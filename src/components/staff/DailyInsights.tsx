import { TrendingUp, Crown, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTodaysRevenue, useTopSellingItem } from '@/hooks/useOrders';

export function DailyInsights() {
  const { data: todaysRevenue = 0, isLoading: revenueLoading } = useTodaysRevenue();
  const { data: topItem, isLoading: topItemLoading } = useTopSellingItem();

  return (
    <Card className="bg-gradient-to-br from-primary via-primary/95 to-accent/20 text-primary-foreground overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h2 className="font-display text-lg font-semibold">Daily Insights</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Today's Earnings */}
          <div className="space-y-1">
            <p className="text-xs opacity-75 uppercase tracking-wide">Today's Earnings</p>
            {revenueLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <p className="font-display text-3xl font-bold">
                ₹{todaysRevenue.toLocaleString('en-IN')}
              </p>
            )}
          </div>

          {/* Top Selling Item */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Crown className="w-3 h-3 text-yellow-300" />
              <p className="text-xs opacity-75 uppercase tracking-wide">Top Seller</p>
            </div>
            {topItemLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : topItem ? (
              <div>
                <p className="font-display text-lg font-bold truncate">{topItem.name}</p>
                <p className="text-xs opacity-75">{topItem.count} sold today</p>
              </div>
            ) : (
              <p className="text-sm opacity-75">No sales yet</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
