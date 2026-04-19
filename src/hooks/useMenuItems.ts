import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { useCafe } from '@/contexts/CafeContext';

export type MenuCategory = string;

// --- UPDATED VALIDATION SCHEMA ---
const menuItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  price: z.number().positive("Price must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  description: z.string().trim().max(500, "Description must be less than 500 characters").optional().nullable(),
  is_available: z.boolean().optional(),
  // Changed: Relaxed URL validation to allow for internal Supabase paths before they become public URLs
  image_url: z.string().max(2000, "URL too long").optional().nullable().or(z.literal('')),
  cafe_id: z.string().uuid("Invalid cafe ID"),
});

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: MenuCategory;
  description: string | null;
  is_available: boolean;
  image_url: string | null;
  cafe_id: string | null;
  created_at: string;
  updated_at: string;
}

// --- HOOKS ---

export function useMenuItems() {
  const { cafe } = useCafe();

  return useQuery({
    queryKey: ['menu-items', cafe?.id],
    queryFn: async () => {
      if (!cafe) return [];

      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('cafe_id', cafe.id)
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as MenuItem[];
    },
    enabled: !!cafe,
  });
}

export function useAddMenuItem() {
  const queryClient = useQueryClient();
  const { cafe } = useCafe();
  
  return useMutation({
    mutationFn: async (item: {
      name: string;
      price: number;
      category: MenuCategory;
      description?: string;
      is_available?: boolean;
      image_url?: string;
    }) => {
      if (!cafe) {
        throw new Error('No cafe selected');
      }

      const validationResult = menuItemSchema.safeParse({
        ...item,
        cafe_id: cafe.id,
      });
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0]?.message || 'Invalid input';
        throw new Error(errorMessage);
      }

      const validatedData = validationResult.data;
      const { data, error } = await supabase
        .from('menu_items')
        .insert([{
          name: validatedData.name,
          price: validatedData.price,
          category: validatedData.category,
          is_available: validatedData.is_available ?? true,
          image_url: validatedData.image_url || null,
          description: validatedData.description || null,
          cafe_id: validatedData.cafe_id,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', cafe?.id] });
      toast.success('Menu item added successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add menu item');
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  const { cafe } = useCafe();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MenuItem> & { id: string }) => {
      const updateSchema = menuItemSchema.partial().omit({ cafe_id: true });
      const validationResult = updateSchema.safeParse(updates);
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0]?.message || 'Invalid input';
        throw new Error(errorMessage);
      }

      const validatedData = validationResult.data;
      
      // Build the update object dynamically
      const updateObj: any = {};
      if (validatedData.name !== undefined) updateObj.name = validatedData.name;
      if (validatedData.price !== undefined) updateObj.price = validatedData.price;
      if (validatedData.category !== undefined) updateObj.category = validatedData.category;
      if (validatedData.is_available !== undefined) updateObj.is_available = validatedData.is_available;
      if (validatedData.description !== undefined) updateObj.description = validatedData.description || null;
      if (validatedData.image_url !== undefined) updateObj.image_url = validatedData.image_url || null;

      const { data, error } = await supabase
        .from('menu_items')
        .update(updateObj)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', cafe?.id] });
      toast.success('Menu item updated');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update menu item');
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  const { cafe } = useCafe();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', cafe?.id] });
      toast.success('Menu item deleted');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete menu item');
    },
  });
}
