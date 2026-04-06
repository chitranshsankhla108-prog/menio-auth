import { useState } from 'react';
import { 
  Plus, 
  Minus, 
  Coffee, 
  Cookie, 
  UtensilsCrossed, 
  ShoppingBag, 
  Loader2, 
  Clock, 
  CheckCircle, 
  Receipt, 
  Store, 
  BadgeCheck,
  MessageSquare,
  Share2 
} from 'lucide-react';
import { useMenuItems, MenuCategory, MenuItem } from '@/hooks/useMenuItems';
import { useOrders, useCreateOrder, useUpdateOrderStatus, OrderItem, Order } from '@/hooks/useOrders';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { useCafe } from '@/contexts/CafeContext'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { DailyInsights } from './DailyInsights';
import { InstallPrompt } from './InstallPrompt';
import { BillDialog } from './BillDialog';
import { CounterOrderDialog } from './CounterOrderDialog';

const categoryIcons: Record<MenuCategory, React.ElementType> = {
  Drinks: Coffee,
  Snacks: Cookie,
  Meals: UtensilsCrossed,
};

const categories: MenuCategory[] = ['Drinks', 'Snacks', 'Meals'];

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export function OrderEntry() {
  const { cafe } = useCafe(); 
  const { data: menuItems = [], isLoading: menuLoading } = useMenuItems();
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const createOrder = useCreateOrder();
  const updateOrderStatus = useUpdateOrderStatus();
  
  useOrderNotifications();
  
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('Drinks');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [billOrder, setBillOrder] = useState<Order | null>(null);
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [counterOrderOpen, setCounterOrderOpen] = useState(false);

  const [tablePromptOpen, setTablePromptOpen] = useState(false);
  const [tempTableNumber, setTempTableNumber] = useState('');
  const [tempSpecialInstructions, setTempSpecialInstructions] = useState('');

  const availableItems = menuItems.filter((item) => item.is_available && item.category === selectedCategory);
  const subtotal = cart.reduce((total, item) => total + Number(item.menuItem.price) * item.quantity, 0);

  const getItemQuantity = (itemId: string) => {
    const cartItem = cart.find((c) => c.menuItem.id === itemId);
    return cartItem?.quantity || 0;
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((c) => c.menuItem.id !== itemId)
        : prev.map((c) => (c.menuItem.id === itemId ? { ...c, quantity } : c))
    );
  };

  const handleConfirmOrder = () => {
    const orderItems: OrderItem[] = cart.map((c) => ({
      id: c.menuItem.id,
      name: c.menuItem.name,
      price: Number(c.menuItem.price),
      quantity: c.quantity,
    }));

    createOrder.mutate(
      { 
        items: orderItems, 
        total_price: subtotal,
        table_number: tempTableNumber.trim() || 'Counter', 
        special_instructions: tempSpecialInstructions.trim() || undefined,
        is_counter_order: true
      },
      { onSuccess: () => {
          setCart([]);
          setTablePromptOpen(false);
          setTempTableNumber('');
          setTempSpecialInstructions('');
      }}
    );
  };

  const shareBillViaWhatsApp = (order: Order) => {
    const itemSummary = order.items.map((item) => `• ${item.name} x${item.quantity} - ₹${item.price * item.quantity}`).join('\n');
    const text = `*${cafe?.name || 'Cafe'} Bill Summary*\nTable: #${order.table_number}\nTotal: ₹${order.total_price}\n\nItems:\n${itemSummary}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleGenerateBill = (order: Order) => {
    setBillOrder(order);
    setBillDialogOpen(true);
  };

  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'preparing');

  if (menuLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[#6F4E37]" /></div>;

  // --- MENU SECTION (CREATION STATION) ---
  function MenuSection() {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => {
            const Icon = categoryIcons[cat];
            return (
              <Button key={cat} size="sm" onClick={() => setSelectedCategory(cat)} className={cn("shrink-0 rounded-xl transition-all font-bold px-5", selectedCategory === cat ? "bg-[#6F4E37] text-white" : "bg-white text-[#6F4E37] border border-[#EBE1E3]")}>
                <Icon className="w-4 h-4 mr-2" /> {cat}
              </Button>
            );
          })}
        </div>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
          {availableItems.map((item) => {
            const quantity = getItemQuantity(item.id);
            return (
              <Card key={item.id} className="border-[#EBE1E3] shadow-none rounded-2xl overflow-hidden">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-[#3A2C2C]">{item.name}</h3>
                    <p className="font-black text-[#6F4E37]">₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {quantity > 0 ? (
                      <div className="flex items-center gap-2 bg-[#F7F1F2] p-1 rounded-xl">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, quantity - 1)}><Minus size={14}/></Button>
                        <span className="w-6 text-center font-bold">{quantity}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-[#6F4E37] text-white" onClick={() => addToCart(item)}><Plus size={14}/></Button>
                      </div>
                    ) : (
                      <Button size="sm" className="bg-[#6F4E37] text-white rounded-xl h-9" onClick={() => addToCart(item)}><Plus className="mr-1" size={16}/> Add</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* --- ADDED: CART SUMMARY VISIBILITY --- */}
        {cart.length > 0 && (
          <div className="sticky bottom-0 md:static pt-4 mt-6 border-t-2 border-dashed border-[#EBE1E3] bg-white z-10 pb-4 md:pb-0">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#A89699] mb-3">Current Draft</h3>
            <div className="space-y-2 mb-4 max-h-[150px] overflow-y-auto">
              {cart.map((c) => (
                 <div key={c.menuItem.id} className="flex items-center justify-between bg-[#F7F1F2] p-2.5 rounded-xl">
                    <span className="text-sm font-bold text-[#3A2C2C] truncate pr-2">
                       <span className="text-[#6F4E37] mr-2">{c.quantity}x</span>
                       {c.menuItem.name}
                    </span>
                    <span className="text-sm font-black text-[#6F4E37] shrink-0">₹{c.menuItem.price * c.quantity}</span>
                 </div>
              ))}
            </div>
            <Button onClick={() => setTablePromptOpen(true)} className="w-full h-14 bg-[#3A2C2C] hover:bg-black text-white rounded-2xl font-black text-lg shadow-xl uppercase tracking-wider transition-all">
              Review & Fire (₹{subtotal})
            </Button>
          </div>
        )}
      </div>
    );
  }

  // --- FEED SECTION (KITCHEN COMMAND) ---
  function FeedSection() {
    return (
      <>
        {pendingOrders.map((order) => {
          const displayId = order.order_number || order.id.slice(0, 4).toUpperCase();
          return (
            <Card key={order.id} className="rounded-[2rem] border-[#EBE1E3] overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow">
              <div className={cn("p-4 flex justify-between items-center", order.status === 'preparing' ? 'bg-[#FFD6C9]/20' : 'bg-[#FDF8F7]')}>
                <div className="flex items-center gap-3">
                  <div className="bg-[#3A2C2C] text-white w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg">
                    {order.table_number || "NA"}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#A89699] border border-[#EBE1E3] px-2 py-0.5 rounded-md bg-white">#{displayId}</span>
                    <p className="text-sm font-bold mt-1 text-[#3A2C2C]">{order.customer_name || "Guest"}</p>
                  </div>
                </div>
                <Badge className={cn("px-3 py-1 rounded-full text-[10px] uppercase font-black", order.status === 'preparing' ? 'bg-blue-600 text-white animate-pulse' : 'bg-[#6F4E37] text-white')}>
                  {order.status}
                </Badge>
              </div>
              <CardContent className="p-4 space-y-4">
                <div className="bg-[#F7F1F2] p-3 rounded-2xl space-y-2">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                       <p className="text-sm font-bold text-[#3A2C2C]">
                         <span className="text-[#6F4E37] mr-2 text-[15px]">{it.quantity}×</span>{it.name}
                       </p>
                       <p className="text-sm font-black text-[#6F4E37]">₹{it.price * it.quantity}</p>
                    </div>
                  ))}
                </div>
                {order.special_instructions && (
                  <div className="bg-red-50 p-3 rounded-xl text-xs font-bold text-red-700 italic border border-red-100 flex gap-2 items-start">
                    <MessageSquare size={16} className="shrink-0 mt-0.5"/> 
                    <span className="leading-tight">"{order.special_instructions}"</span>
                  </div>
                )}
                <div className="flex flex-col gap-2 pt-2 border-t border-[#EBE1E3]">
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#A89699]">Bill Total</span>
                    <span className="text-xl font-black text-[#3A2C2C]">₹{order.total_price}</span>
                  </div>
                  {order.status === 'pending' ? (
                    <Button className="h-12 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700" onClick={() => updateOrderStatus.mutate({ id: order.id, status: 'preparing' })}>START PREPARING</Button>
                  ) : (
                    <Button className="h-12 rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-700" onClick={() => updateOrderStatus.mutate({ id: order.id, status: 'completed' })}><CheckCircle className="mr-2 w-5 h-5"/> MARK AS DONE</Button>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 h-10 rounded-xl border-[#EBE1E3] text-green-600 hover:bg-green-50" onClick={() => shareBillViaWhatsApp(order)}><Share2 size={16} className="mr-2"/> WA</Button>
                    <Button variant="outline" className="flex-1 h-10 rounded-xl border-[#EBE1E3] text-[#6F4E37] hover:bg-[#FDF8F7]" onClick={() => handleGenerateBill(order)}><Receipt size={16} className="mr-2"/> Bill</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </>
    );
  }

  // --- MAIN RENDER ---
  return (
    <div className="bg-[#FDF8F7] min-h-screen pb-20 md:pb-8">
      <InstallPrompt />
      
      <div className="max-w-[1600px] mx-auto p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
         <DailyInsights />
         <Button className="w-full md:w-auto bg-white border-dashed border-2 border-[#EBE1E3] text-[#6F4E37] hover:bg-[#F7F1F2] h-12 px-8 rounded-2xl shadow-sm font-bold" onClick={() => setCounterOrderOpen(true)}>
           <Store className="w-5 h-5 mr-2" /> New Counter Order
         </Button>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 h-full">
        {/* MOBILE TABS */}
        <div className="md:hidden">
          <Tabs defaultValue="live-orders" className="w-full">
            <TabsList className="w-full h-14 p-1.5 bg-[#F7F1F2] rounded-2xl mb-4">
              <TabsTrigger value="new-order" className="flex-1 rounded-xl data-[state=active]:bg-[#6F4E37] data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest">New Order</TabsTrigger>
              <TabsTrigger value="live-orders" className="flex-1 rounded-xl data-[state=active]:bg-[#6F4E37] data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest">Live Feed ({pendingOrders.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="new-order"><MenuSection /></TabsContent>
            <TabsContent value="live-orders"><FeedSection /></TabsContent>
          </Tabs>
        </div>

        {/* DESKTOP SPLIT VIEW */}
        <div className="hidden md:grid grid-cols-12 gap-8 items-start">
          <section className="col-span-4 lg:col-span-3 sticky top-4 bg-white p-5 rounded-[2.5rem] border border-[#EBE1E3] shadow-sm">
            <h2 className="font-serif text-2xl font-bold text-[#3A2C2C] italic border-b border-[#EBE1E3] pb-4 mb-4">Creation Station</h2>
            <MenuSection />
          </section>

          <section className="col-span-8 lg:col-span-9 space-y-6">
            <div className="flex items-center justify-between border-b border-[#EBE1E3] pb-4">
              <h2 className="font-serif text-2xl font-bold flex items-center gap-3 text-[#3A2C2C] italic">
                <Clock className="w-6 h-6 text-[#6F4E37]" /> Kitchen Command
              </h2>
              <Badge className="bg-[#6F4E37] text-white px-4 py-1 rounded-full text-sm font-bold shadow-sm">{pendingOrders.length} Active</Badge>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
               <FeedSection />
            </div>
          </section>
        </div>
      </main>

      {/* --- ADDED: CART SUMMARY IN CONFIRMATION DIALOG --- */}
      <Dialog open={tablePromptOpen} onOpenChange={setTablePromptOpen}>
        <DialogContent className="rounded-3xl p-6 w-[90%] max-w-md bg-white border-[#EBE1E3]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center font-serif italic text-[#3A2C2C]">Review & Confirm</DialogTitle>
          </DialogHeader>
          
          <div className="bg-[#FDF8F7] p-4 rounded-2xl max-h-[200px] overflow-y-auto border border-[#EBE1E3]">
            <div className="space-y-2">
              {cart.map((c) => (
                <div key={c.menuItem.id} className="flex justify-between items-center text-sm">
                  <span className="font-bold text-[#3A2C2C]"><span className="text-[#6F4E37] mr-2">{c.quantity}x</span>{c.menuItem.name}</span>
                  <span className="font-black text-[#6F4E37]">₹{c.menuItem.price * c.quantity}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 mt-3 border-t border-[#EBE1E3] flex justify-between items-center">
              <span className="font-black uppercase text-[10px] tracking-widest text-[#A89699]">Total Amount</span>
              <span className="font-black text-[#3A2C2C] text-lg">₹{subtotal}</span>
            </div>
          </div>

          <div className="py-2 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#6F4E37]">Table Number</label>
              <Input value={tempTableNumber} onChange={(e) => setTempTableNumber(e.target.value)} placeholder="Leave blank for Counter" className="h-14 text-center text-lg font-bold rounded-2xl border-[#EBE1E3] focus-visible:ring-[#6F4E37]" autoFocus />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#6F4E37]">Special Instructions</label>
              <textarea value={tempSpecialInstructions} onChange={(e) => setTempSpecialInstructions(e.target.value)} placeholder="e.g. Less sugar, extra spicy..." className="w-full min-h-[80px] p-4 text-sm rounded-2xl border border-[#EBE1E3] bg-white outline-none focus:ring-2 focus:ring-[#6F4E37] resize-none placeholder:text-[#A89699]" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleConfirmOrder} className="w-full h-14 font-black rounded-2xl bg-[#6F4E37] text-white hover:bg-[#3A2C2C] uppercase tracking-widest text-sm shadow-lg" disabled={createOrder.isPending}>
              {createOrder.isPending ? 'Sending...' : 'Confirm & Fire'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BillDialog order={billOrder} open={billDialogOpen} onOpenChange={setBillDialogOpen} />
      <CounterOrderDialog open={counterOrderOpen} onOpenChange={setCounterOrderOpen} />
    </div>
  );
}