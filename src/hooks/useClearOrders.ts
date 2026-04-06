import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCafe } from '@/contexts/CafeContext';
import { toast } from 'sonner';

export function useClearTodayOrders() {
  const queryClient = useQueryClient();
  const { cafe } = useCafe();

  return useMutation({
    mutationFn: async () => {
      if (!cafe) {
        throw new Error('No cafe selected');
      }

      // Get IST midnight for today
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(now.getTime() + istOffset);
      const istYear = istNow.getUTCFullYear();
      const istMonth = istNow.getUTCMonth();
      const istDate = istNow.getUTCDate();
      const istMidnightUTC = new Date(Date.UTC(istYear, istMonth, istDate) - istOffset);
      const todayIST = istMidnightUTC.toISOString();

      // Delete today's orders for this cafe
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('cafe_id', cafe.id)
        .gte('created_at', todayIST);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['todays-revenue'] });
      queryClient.invalidateQueries({ queryKey: ['top-selling-item'] });
      toast.success("Today's orders have been cleared");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to clear orders');
    },
  });
}
