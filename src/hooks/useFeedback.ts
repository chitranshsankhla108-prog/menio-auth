import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { useCafe } from '@/contexts/CafeContext';

// Validation schema for feedback
const feedbackSchema = z.object({
  name: z.string().trim().max(100, "Name must be less than 100 characters").optional(),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters").optional().or(z.literal('')),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  comment: z.string().trim().min(1, "Comment is required").max(1000, "Comment must be less than 1000 characters"),
  cafe_id: z.string().uuid("Invalid cafe ID"),
});

export interface Feedback {
  id: string;
  name: string | null;
  email: string | null;
  rating: number;
  comment: string;
  cafe_id: string | null;
  created_at: string;
}

export function useFeedbacks() {
  const { cafe } = useCafe();

  return useQuery({
    queryKey: ['feedbacks', cafe?.id],
    queryFn: async () => {
      if (!cafe) return [];

      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('cafe_id', cafe.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Feedback[];
    },
    enabled: !!cafe,
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  const { cafe } = useCafe();
  
  return useMutation({
    mutationFn: async (feedback: {
      name?: string;
      email?: string;
      rating: number;
      comment: string;
    }) => {
      if (!cafe) {
        throw new Error('No cafe selected');
      }

      const validationResult = feedbackSchema.safeParse({
        ...feedback,
        cafe_id: cafe.id,
      });
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0]?.message || 'Invalid input';
        throw new Error(errorMessage);
      }

      const validatedData = validationResult.data;
      const { data, error } = await supabase
        .from('feedback')
        .insert([{
          name: validatedData.name || null,
          email: validatedData.email || null,
          rating: validatedData.rating,
          comment: validatedData.comment,
          cafe_id: validatedData.cafe_id,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks', cafe?.id] });
      toast.success('Thank you for your feedback!');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to submit feedback');
    },
  });
}
