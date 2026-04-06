import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { z } from 'zod';
import { useCafe } from '@/contexts/CafeContext';

export type OrderStatus = 'pending' | 'preparing' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'upi';
export type PaymentStatus = 'unpaid' | 'paid';

// --- VALIDATION SCHEMAS ---
const orderItemSchema = z.object({
  id: z.string().min(1, "Item ID is required"),
  name: z.string().min(1, "Item name is required").max(100, "Name too long"),
  price: z.number().nonnegative("Price must be non-negative"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Order must have at least one item"),
  total_price: z.number().nonnegative("Total price must be non-negative"),
  customer_name: z.string().trim().max(100, "Customer name must be less than 100 characters").optional(),
  // SECURITY FIX: Table number is now REQUIRED (min 1 character) to close the loophole
  table_number: z.string().min(1, "Table number is required").max(20, "Table number too long"), 
  cafe_id: z.string().uuid("Invalid cafe ID"),
  is_counter_order: z.boolean().optional(),
  special_instructions: z.string().max(500, "Special instructions too long").optional(),
});

const updateOrderStatusSchema = z.object({
  id: z.string().min(1, "Order ID is required"),
  status: z.enum(['pending', 'preparing', 'completed', 'cancelled']),
});

const updateOrderPaymentSchema = z.object({
  id: z.string().min(1, "Order ID is required"),
  payment_method: z.enum(['cash', 'upi']),
  payment_status: z.enum(['unpaid', 'paid']),
  include_gst: z.boolean(),
  gst_amount: z.number().nonnegative(),
  final_total: z.number().nonnegative(),
});

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total_price: number;
  status: OrderStatus;
  customer_name: string | null;
  table_number: string | null; 
  cafe_id: string | null;
  created_at: string;
  updated_at: string;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  include_gst: boolean;
  gst_amount: number;
  final_total: number;
  is_counter_order: boolean;
  order_number: string | null;
  special_instructions: string | null; 
}

// --- HOOKS ---

export function useOrders(status?: OrderStatus) {
  const queryClient = useQueryClient();
  const { cafe } = useCafe();

  useEffect(() => {
    if (!cafe) return;

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `cafe_id=eq.${cafe.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders', cafe.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, cafe]);

  return useQuery({
    queryKey: ['orders', cafe?.id, status],
    queryFn: async () => {
      if (!cafe) return [];

      let query = supabase
        .from('orders')
        .select('*')
        .eq('cafe_id', cafe.id)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(order => ({
        ...order,
        items: order.items as unknown as OrderItem[],
      })) as Order[];
    },
    enabled: !!cafe,
  });
}

function getTodayISTMidnight(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  const istYear = istNow.getUTCFullYear();
  const istMonth = istNow.getUTCMonth();
  const istDate = istNow.getUTCDate();
  const istMidnightUTC = new Date(Date.UTC(istYear, istMonth, istDate) - istOffset);
  return istMidnightUTC.toISOString();
}

export function useTodaysRevenue() {
  const { cafe } = useCafe();

  return useQuery({
    queryKey: ['todays-revenue', cafe?.id],
    queryFn: async () => {
      if (!cafe) return 0;
      const todayIST = getTodayISTMidnight();
      
      const { data, error } = await supabase
        .from('orders')
        .select('total_price')
        .eq('cafe_id', cafe.id)
        .eq('status', 'completed')
        .gte('created_at', todayIST);
      
      if (error) throw error;
      return data.reduce((sum, order) => sum + Number(order.total_price), 0);
    },
    enabled: !!cafe,
    refetchInterval: 30000,
  });
}

export function useTopSellingItem() {
  const { cafe } = useCafe();

  return useQuery({
    queryKey: ['top-selling-item', cafe?.id],
    queryFn: async () => {
      if (!cafe) return null;
      const todayIST = getTodayISTMidnight();
      
      const { data, error } = await supabase
        .from('orders')
        .select('items')
        .eq('cafe_id', cafe.id)
        .gte('created_at', todayIST);
      
      if (error) throw error;
      if (!data || data.length === 0) return null;
      
      const itemCounts: Record<string, { name: string; count: number }> = {};
      data.forEach((order) => {
        const items = order.items as unknown as OrderItem[];
        items.forEach((item) => {
          if (!itemCounts[item.id]) {
            itemCounts[item.id] = { name: item.name, count: 0 };
          }
          itemCounts[item.id].count += item.quantity;
        });
      });
      
      let topItem: { name: string; count: number } | null = null;
      Object.values(itemCounts).forEach((item) => {
        if (!topItem || item.count > topItem.count) {
          topItem = item;
        }
      });
      return topItem;
    },
    enabled: !!cafe,
    refetchInterval: 30000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { cafe } = useCafe();
  
  return useMutation({
    mutationFn: async (order: {
      items: OrderItem[];
      total_price: number;
      customer_name?: string;
      table_number: string; // Now required in the function call
      is_counter_order?: boolean;
      special_instructions?: string;
    }) => {
      if (!cafe) throw new Error('No cafe selected');

      const validationResult = createOrderSchema.safeParse({
        ...order,
        cafe_id: cafe.id,
      });

      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0]?.message || 'Invalid order data';
        throw new Error(errorMessage);
      }

      const validatedData = validationResult.data;
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          items: JSON.parse(JSON.stringify(validatedData.items)),
          total_price: validatedData.total_price,
          customer_name: validatedData.customer_name || null,
          table_number: validatedData.table_number, // Pushing the mandatory table number
          cafe_id: validatedData.cafe_id,
          status: 'pending' as const,
          is_counter_order: validatedData.is_counter_order || false,
          special_instructions: validatedData.special_instructions || null,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', cafe?.id] });
    },
    onError: (error: any) => {
      console.error('Order creation failed:', error);
      const message = error?.message || 'Failed to place order';
      toast.error(message);
    },
  });
}

export function useUpdateOrderPayment() {
  const queryClient = useQueryClient();
  const { cafe } = useCafe();
  
  return useMutation({
    mutationFn: async (payment: {
      id: string;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
      include_gst: boolean;
      gst_amount: number;
      final_total: number;
    }) => {
      const validationResult = updateOrderPaymentSchema.safeParse(payment);
      if (!validationResult.success) {
        throw new Error(validationResult.error.errors[0]?.message || 'Invalid payment data');
      }

      const { id, ...paymentData } = validationResult.data;
      const { data, error } = await supabase
        .from('orders')
        .update({
          ...paymentData,
          status: 'completed' as const,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', cafe?.id] });
      queryClient.invalidateQueries({ queryKey: ['todays-revenue', cafe?.id] });
      toast.success(`Order marked as paid (${variables.payment_method.toUpperCase()})`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update payment');
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { cafe } = useCafe();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const validationResult = updateOrderStatusSchema.safeParse({ id, status });
      if (!validationResult.success) {
        throw new Error('Invalid status update');
      }

      const { data, error } = await supabase
        .from('orders')
        .update({ status: validationResult.data.status })
        .eq('id', validationResult.data.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', cafe?.id] });
      toast.success(`Order marked as ${variables.status}`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    },
  });
}