import { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  Receipt, 
  Store, 
  ArrowLeft,
  FilterX
} from 'lucide-react';
import { useOrders, Order } from '@/hooks/useOrders';
import { useCafe } from '@/contexts/CafeContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { BillDialog } from '@/components/staff/BillDialog'; // Adjust path if needed
import { useNavigate } from 'react-router-dom';

export function OrderHistory() {
  const { cafe } = useCafe();
  const { data: orders = [], isLoading } = useOrders();
  const navigate = useNavigate();

  // --- FILTERS STATE ---
  // Default to today's date in YYYY-MM-DD format for the input
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- DIALOG STATE ---
  const [billOrder, setBillOrder] = useState<Order | null>(null);
  const [billDialogOpen, setBillDialogOpen] = useState(false);

  // --- FILTERING LOGIC ---
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Only show completed, paid, or cancelled orders (hide active kitchen orders)
      if (order.status === 'pending' || order.status === 'preparing') return false;

      // 2. Date Filter
      const orderDate = parseISO(order.created_at);
      const filterDate = parseISO(selectedDate);
      const matchesDate = selectedDate ? isSameDay(orderDate, filterDate) : true;

      /// 3. Search Filter (by ID, Table, or Customer Name)
      const searchLower = searchQuery.toLowerCase();
      const displayId = (order.order_number || order.id.slice(0, 4)).toLowerCase();
      const matchesSearch = 
        displayId.includes(searchLower) || 
        (order.table_number && String(order.table_number).toLowerCase().includes(searchLower)) ||
        (order.customer_name && String(order.customer_name).toLowerCase().includes(searchLower));
      return matchesDate && matchesSearch;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // Newest first
  }, [orders, selectedDate, searchQuery]);

  // --- METRICS CALCULATION ---
  const metrics = useMemo(() => {
    const validOrders = filteredOrders.filter(o => o.status !== 'cancelled');
    return {
      totalRevenue: validOrders.reduce((sum, order) => sum + Number(order.total_price), 0),
      orderCount: validOrders.length,
      cancelledCount: filteredOrders.filter(o => o.status === 'cancelled').length
    };
  }, [filteredOrders]);

  const handleViewBill = (order: Order) => {
    setBillOrder(order);
    setBillDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FDF8F7] pb-24 selection:bg-[#FFD6C9] selection:text-[#3A2C2C]">
      
      {/* HEADER */}
      <div className="bg-white border-b border-[#EBE1E3] sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1200px] mx-auto p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-[#6F4E37] hover:bg-[#F9E0E3]/50 rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-serif text-3xl font-black text-[#3A2C2C] italic flex items-center gap-2">
                  History <span className="text-[#A89699] text-xl font-sans not-italic font-bold tracking-widest uppercase">Archive</span>
                </h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#6F4E37]">
                  {cafe?.name || 'Cafe'} Operations
                </p>
              </div>
            </div>

            {/* METRICS SUMMARY */}
            <div className="flex gap-4 bg-[#F4EDE4]/50 p-3 rounded-2xl border border-[#EBE1E3]">
              <div className="px-4 border-r border-[#EBE1E3]/50">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#A89699]">Orders</p>
                <p className="text-xl font-black text-[#3A2C2C]">{metrics.orderCount}</p>
              </div>
              <div className="px-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#A89699]">Revenue</p>
                <p className="text-xl font-black text-[#6F4E37]">₹{metrics.totalRevenue.toFixed(2)}</p>
              </div>
            </div>

          </div>

          {/* FILTER CONTROLS */}
          <div className="flex flex-col md:flex-row gap-3 mt-6">
            <div className="relative flex-1">
              {/* FIX: pointer-events-none added to stop icon from stealing clicks */}
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A89699] pointer-events-none" />
              <Input 
                placeholder="Search by Order # or Table..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 h-14 bg-[#F7F1F2] border-none rounded-2xl text-sm font-bold focus-visible:ring-2 focus-visible:ring-[#6F4E37]"
              />
            </div>
            
            <div className="relative shrink-0 md:w-64">
              {/* FIX: pointer-events-none added to stop icon from stealing clicks */}
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A89699] pointer-events-none" />
              <Input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                // FIX: Force calendar popup to open when clicking anywhere in the input box
                onClick={(e) => {
                  try { e.currentTarget.showPicker(); } catch (err) {} 
                }}
                className="w-full pl-12 h-14 bg-[#F7F1F2] border-none rounded-2xl text-sm font-bold text-[#3A2C2C] focus-visible:ring-2 focus-visible:ring-[#6F4E37] cursor-pointer"
              />
            </div>

            {(searchQuery || selectedDate !== format(new Date(), 'yyyy-MM-dd')) && (
              <Button 
                variant="outline" 
                onClick={() => { setSearchQuery(''); setSelectedDate(format(new Date(), 'yyyy-MM-dd')); }}
                className="h-14 px-6 rounded-2xl border-[#EBE1E3] text-[#A89699] hover:bg-[#F9E0E3]/30 hover:text-[#3A2C2C] font-bold"
              >
                <FilterX className="w-5 h-5 md:mr-2" />
                <span className="hidden md:inline">Clear Filters</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ORDER LIST */}
      <main className="max-w-[1200px] mx-auto p-4 md:p-6 mt-4">
        {isLoading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6F4E37]" /></div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-[#EBE1E3]">
            <Store className="w-12 h-12 text-[#A89699]/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#3A2C2C] mb-1">No Orders Found</h3>
            <p className="text-sm font-bold text-[#A89699]">Try adjusting your date or search filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredOrders.map((order) => {
              const displayId = order.order_number || order.id.slice(0, 4).toUpperCase();
              const isCancelled = order.status === 'cancelled';

              return (
                <Card key={order.id} className={cn("rounded-3xl border-[#EBE1E3] shadow-sm transition-all hover:shadow-md", isCancelled ? "opacity-75 bg-red-50/30" : "bg-white")}>
                  <div className="p-4 flex justify-between items-start border-b border-[#EBE1E3]/50">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold text-[#A89699] border border-[#EBE1E3] px-2 py-0.5 rounded-md bg-white">#{displayId}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#3A2C2C]">
                          {format(parseISO(order.created_at), 'h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[#3A2C2C]">Table: {order.table_number || "Counter"}</p>
                    </div>
                    
                    <Badge className={cn("px-3 py-1 rounded-full text-[10px] uppercase font-black", 
                      order.status === 'completed' ? 'bg-emerald-100 text-emerald-700 shadow-none' : 
                      isCancelled ? 'bg-red-100 text-red-700 shadow-none' : 
                      'bg-[#F4EDE4] text-[#6F4E37] shadow-none'
                    )}>
                      {order.status}
                    </Badge>
                  </div>

                  <CardContent className="p-4 flex flex-col gap-4">
                    <div className="bg-[#FDF8F7] p-3 rounded-2xl space-y-1.5 border border-[#EBE1E3]/50">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className={cn("font-bold text-[#3A2C2C]", isCancelled && "line-through opacity-50")}>
                            <span className="text-[#6F4E37] mr-1.5">{it.quantity}x</span>{it.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#A89699]">Total Amount</span>
                        <span className={cn("text-lg font-black", isCancelled ? "text-red-400 line-through" : "text-[#3A2C2C]")}>
                          ₹{order.total_price}
                        </span>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        onClick={() => handleViewBill(order)}
                        className="rounded-xl border-[#EBE1E3] text-[#6F4E37] hover:bg-[#FDF8F7]"
                      >
                        <Receipt className="w-4 h-4 mr-2" /> View Bill
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <BillDialog order={billOrder} open={billDialogOpen} onOpenChange={setBillDialogOpen} />
    </div>
  );
}