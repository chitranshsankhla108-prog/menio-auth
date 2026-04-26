import { useState, useMemo } from 'react';
import { 
  Plus, 
  Minus, 
  Coffee, 
  Cookie, 
  UtensilsCrossed, 
  Store, 
  Loader2, 
  Clock, 
  CheckCircle, 
  Receipt, 
  MessageSquare,
  Share2,
  AlertCircle,
  Pencil // ADDED PENCIL ICON
} from 'lucide-react';
import { useMenuItems, MenuItem } from '@/hooks/useMenuItems';
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
import { DailyInsights } from './DailyInsights';
import { InstallPrompt } from './InstallPrompt';
import { BillDialog } from './BillDialog';
import { CounterOrderDialog } from './CounterOrderDialog';
import { EditOrderDialog } from './EditOrderDialog';

const categoryIcons: Record<string, React.ElementType> = {
  Drinks: Coffee,
  Snacks: Cookie,
  Meals: UtensilsCrossed,
};

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
  
  const [selectedCategory, setSelectedCategory] = useState<string>('Drinks');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [billOrder, setBillOrder] = useState<Order | null>(null);
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [counterOrderOpen, setCounterOrderOpen] = useState(false);

  // NEW STATE FOR EDITING EXISTING ORDERS
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // --- CUSTOM PRICING STATES ---
  const [customPricingOpen, setCustomPricingOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const [tablePromptOpen, setTablePromptOpen] = useState(false);
  const [tempTableNumber, setTempTableNumber] = useState('');
  const [tempSpecialInstructions, setTempSpecialInstructions] = useState('');

  const dynamicCategories = useMemo(() => {
    const fetchedCategories = menuItems.map(item => item.category);
    const combined = Array.from(new Set(['Drinks', 'Snacks', 'Meals', ...fetchedCategories]));
    return combined.filter(Boolean); 
  }, [menuItems]);

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

  const handleAddCustom = () => {
    if (!customPrice) return;
    
    const manualItem: MenuItem = {
      id: `custom-${Date.now()}`,
      name: customName.trim() || "Custom Charge",
      price: parseFloat(customPrice),
      category: 'Custom',
      is_available: true,
      cafe_id: cafe?.id || '',
      description: '',
      image_url: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addToCart(manualItem);
    setCustomPricingOpen(false);
    setCustomName('');
    setCustomPrice('');
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
        is_counter_order: true,
        status: 'pending' 
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

  // --- FILTERS FOR THE QUEUES ---
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'preparing');
  const requestedOrders = orders.filter((o) => o.status === 'requested');

  if (menuLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[#6F4E37]" /></div>;

  // --- COMPONENT: APPROVAL QUEUE ---
  function ApprovalQueue() {
    if (requestedOrders.length === 0) return null;

    return (
      <div className="mb-8 space-y-3 animate-in fade-in slide-in-from-top-4">
        <div className="flex items-center gap-2 px-2 bg-orange-100/50 py-2 rounded-xl border border-orange-200 w-fit">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse ml-1" />
          <h3 className="text-xs font-black uppercase tracking-widest text-orange-800 pr-2 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Verification Required ({requestedOrders.length})
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {requestedOrders.map((order) => {
             const displayId = order.order_number || order.id.slice(0, 4).toUpperCase();
             return (
              <Card key={order.id} className="border-2 border-orange-200 bg-orange-50/80 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold text-orange-700 bg-white border border-orange-200 px-2 py-0.5 rounded-md">#{displayId}</span>
                        <span className="text-sm font-black text-[#3A2C2C]">
                          Table {order.table_number || "NA"}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#6F4E37]">{order.customer_name || 'Guest'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-orange-600 tracking-tighter">₹{order.total_price}</p>
                      <p className="text-[10px] font-bold text-orange-600/60 uppercase tracking-widest">{order.items.length} items</p>
                    </div>
                  </div>

                  {order.items.length > 0 && (
                    <div className="text-xs text-[#6F4E37] font-medium bg-white/50 p-2 rounded-lg line-clamp-1 border border-orange-100">
                      {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-1">
                    <Button 
                      variant="outline" 
                      className="flex-[0.8] h-11 rounded-xl text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 font-black text-[10px] uppercase tracking-widest"
                      onClick={() => updateOrderStatus.mutate({ id: order.id, status: 'cancelled' })}
                      disabled={updateOrderStatus.isPending}
                    >
                      Reject
                    </Button>
                    <Button 
                      className="flex-[2] h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest shadow-md active:scale-95 transition-all"
                      onClick={() => updateOrderStatus.mutate({ id: order.id, status: 'pending' })}
                      disabled={updateOrderStatus.isPending}
                    >
                      Accept Order
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  function MenuSection() {
    return (
      <div className="flex flex-col h-full">
        <div className="flex gap-2 overflow-x-auto pb-4 shrink-0 scrollbar-hide border-b border-[#EBE1E3] mb-4">
          {dynamicCategories.map((cat) => {
            const Icon = categoryIcons[cat] || Coffee;
            return (
              <Button 
                key={cat} 
                size="sm" 
                onClick={() => setSelectedCategory(cat)} 
                className={cn(
                  "shrink-0 rounded-xl transition-all font-bold px-5 h-12 shadow-sm", 
                  selectedCategory === cat 
                    ? "bg-[#6F4E37] text-white shadow-md scale-[1.02]" 
                    : "bg-[#FDF8F7] text-[#6F4E37] border border-[#EBE1E3] hover:bg-[#F9E0E3]/50"
                )}
              >
                <Icon className="w-4 h-4 mr-2" /> {cat}
              </Button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-4 min-h-[400px]">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            
            {/* CUSTOM CHARGE CARD */}
            <Card 
              className="border-2 border-dashed border-[#6F4E37]/30 bg-[#FDF8F7] rounded-2xl overflow-hidden hover:border-[#6F4E37] transition-all flex flex-col h-full items-center justify-center cursor-pointer group min-h-[140px] select-none active:scale-95"
              onClick={() => setCustomPricingOpen(true)}
            >
              <Plus className="w-8 h-8 text-[#6F4E37] mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-black text-[#6F4E37] text-[10px] uppercase tracking-widest text-center">Add Custom Charge</span>
            </Card>

            {availableItems.map((item) => {
              const quantity = getItemQuantity(item.id);
              const ItemFallbackIcon = categoryIcons[item.category] || Coffee;

              return (
                <Card 
                  key={item.id} 
                  className={cn(
                    "border-[#EBE1E3] shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col h-full relative cursor-pointer select-none active:scale-[0.98]",
                    quantity > 0 ? "border-[#6F4E37] bg-[#FDF8F7] ring-1 ring-[#6F4E37]/20" : "bg-white"
                  )}
                  onClick={() => quantity === 0 && addToCart(item)}
                >
                  <div className="h-24 bg-[#F4EDE4]/50 w-full flex items-center justify-center relative border-b border-[#EBE1E3]/50">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <ItemFallbackIcon className="w-8 h-8 text-[#A89699]/60" />
                    )}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
                      <span className="font-black text-[#6F4E37] text-xs">₹{item.price}</span>
                    </div>
                  </div>

                  <CardContent className="p-3 flex-1 flex flex-col justify-between gap-2">
                    <h3 className="font-bold text-[#3A2C2C] text-sm leading-tight line-clamp-2">{item.name}</h3>
                    <div className="mt-auto pt-2" onClick={(e) => e.stopPropagation()}>
                      {quantity > 0 ? (
                        <div className="flex items-center justify-between bg-white border border-[#EBE1E3] p-1 rounded-xl shadow-sm">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#6F4E37]" onClick={() => updateQuantity(item.id, quantity - 1)}><Minus size={14}/></Button>
                          <span className="font-black text-sm w-4 text-center text-[#3A2C2C]">{quantity}</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8 bg-[#6F4E37] text-white" onClick={() => addToCart(item)}><Plus size={14}/></Button>
                        </div>
                      ) : (
                            <Button size="sm" onClick={() => addToCart(item)} className="w-full bg-[#FDF8F7] text-[#6F4E37] border border-[#EBE1E3] hover:bg-[#6F4E37] hover:text-white rounded-xl h-10 transition-colors font-bold text-xs">
                           <Plus className="mr-1.5 w-3 h-3"/> ADD
                           </Button>
                          )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {cart.length > 0 && (
          <div className="shrink-0 pt-4 border-t-2 border-dashed border-[#EBE1E3] bg-white z-10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#A89699] mb-3">Draft Order ({cart.reduce((a, b) => a + b.quantity, 0)} items)</h3>
            <div className="space-y-2 mb-4 max-h-[140px] overflow-y-auto pr-2">
              {cart.map((c) => (
                 <div key={c.menuItem.id} className="flex items-center justify-between bg-[#FDF8F7] p-2.5 rounded-xl border border-[#EBE1E3]">
                    <span className="text-sm font-bold text-[#3A2C2C] truncate pr-2"><span className="text-[#6F4E37] mr-2">{c.quantity}x</span>{c.menuItem.name}</span>
                    <span className="text-sm font-black text-[#6F4E37] shrink-0">₹{c.menuItem.price * c.quantity}</span>
                 </div>
              ))}
            </div>
            <Button onClick={() => setTablePromptOpen(true)} className="w-full h-14 bg-[#3A2C2C] hover:bg-black text-white rounded-2xl font-black text-lg shadow-xl uppercase tracking-wider transition-all active:scale-95">
              Review & Fire (₹{subtotal})
            </Button>
          </div>
        )}
      </div>
    );
  }

  function FeedSection() {
    return (
      <div className="space-y-4">
        {pendingOrders.map((order) => {
          const displayId = order.order_number || order.id.slice(0, 4).toUpperCase();
          return (
            <Card key={order.id} className="rounded-[2rem] border-[#EBE1E3] overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow">
              <div className={cn("p-4 flex justify-between items-center", order.status === 'preparing' ? 'bg-[#FFD6C9]/20' : 'bg-[#FDF8F7]')}>
                <div className="flex items-center gap-3">
                  <div className="bg-[#3A2C2C] text-white w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg">{order.table_number || "NA"}</div>
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
                
                {/* NEW: Edit Order Block */}
                <div>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#A89699]">Order Items</span>
                    <Button variant="ghost" size="sm" className="h-6 px-2.5 rounded-md text-[#6F4E37] bg-[#F9E0E3]/50 hover:bg-[#F9E0E3]" onClick={() => setEditingOrder(order)}>
                      <Pencil className="w-3 h-3 mr-1.5" /> Edit
                    </Button>
                  </div>
                  <div className="bg-[#F7F1F2] p-3 rounded-2xl space-y-2 border border-[#EBE1E3]/50">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                         <p className="text-sm font-bold text-[#3A2C2C]"><span className="text-[#6F4E37] mr-2 text-[15px]">{it.quantity}×</span>{it.name}</p>
                         <p className="text-sm font-black text-[#6F4E37]">₹{it.price * it.quantity}</p>
                      </div>
                    ))}
                  </div>
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
      </div>
    );
  }

  return (
    <div className="bg-[#FDF8F7] min-h-screen pb-20 md:pb-8">
      <InstallPrompt />
      
      <div className="max-w-[1600px] mx-auto p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
         <DailyInsights />
         <Button className="w-full md:w-auto bg-white border-dashed border-2 border-[#EBE1E3] text-[#6F4E37] hover:bg-[#F7F1F2] h-12 px-8 rounded-2xl shadow-sm font-bold transition-colors" onClick={() => setCounterOrderOpen(true)}>
           <Store className="w-5 h-5 mr-2" /> New Counter Order
         </Button>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 h-full">
        {/* MOBILE TABS */}
        <div className="md:hidden">
          <Tabs defaultValue="live-orders" className="w-full">
            <TabsList className="w-full h-14 p-1.5 bg-[#F7F1F2] rounded-2xl mb-4 border border-[#EBE1E3]">
              <TabsTrigger value="new-order" className="flex-1 rounded-xl data-[state=active]:bg-[#6F4E37] data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest transition-all">New Order</TabsTrigger>
              <TabsTrigger value="live-orders" className="flex-1 rounded-xl data-[state=active]:bg-[#6F4E37] data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-1">
                Feed {pendingOrders.length > 0 && `(${pendingOrders.length})`}
                {requestedOrders.length > 0 && <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse ml-1"/>}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="new-order"><MenuSection /></TabsContent>
            <TabsContent value="live-orders">
              <ApprovalQueue />
              <FeedSection />
            </TabsContent>
          </Tabs>
        </div>

        {/* DESKTOP SPLIT VIEW */}
        <div className="hidden md:grid grid-cols-12 gap-8 items-start">
          <section className="col-span-12 lg:col-span-6 sticky top-4 bg-white p-6 rounded-[2.5rem] border border-[#EBE1E3] shadow-sm flex flex-col max-h-[90vh]">
            <h2 className="font-serif text-2xl font-bold text-[#3A2C2C] italic border-b border-[#EBE1E3] pb-4 mb-4 shrink-0 flex items-center justify-between">
              Creation Station
              <Badge className="bg-[#F4EDE4] text-[#6F4E37] text-[10px] uppercase tracking-widest font-black shadow-none border-none">POS Grid</Badge>
            </h2>
            <MenuSection />
          </section>

          <section className="col-span-12 lg:col-span-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#EBE1E3] pb-4 bg-[#FDF8F7] sticky top-0 z-10 pt-2">
              <h2 className="font-serif text-2xl font-bold flex items-center gap-3 text-[#3A2C2C] italic">
                <Clock className="w-6 h-6 text-[#6F4E37]" /> Kitchen Command
              </h2>
              <div className="flex gap-2">
                {requestedOrders.length > 0 && (
                  <Badge className="bg-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-sm uppercase tracking-widest animate-pulse">
                    {requestedOrders.length} New
                  </Badge>
                )}
                <Badge className="bg-[#6F4E37] text-white px-4 py-1.5 rounded-full text-xs font-black shadow-sm uppercase tracking-widest">
                  {pendingOrders.length} Active
                </Badge>
              </div>
            </div>
            
            <ApprovalQueue />
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4"><FeedSection /></div>
          </section>
        </div>
      </main>

      {/* CUSTOM PRICING DIALOG */}
      <Dialog open={customPricingOpen} onOpenChange={setCustomPricingOpen}>
        <DialogContent className="rounded-3xl p-6 w-[90%] max-w-sm bg-white border-[#EBE1E3]">
          <DialogHeader><DialogTitle className="text-xl font-bold font-serif italic text-[#3A2C2C]">Custom Charge</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#6F4E37]">Charge Name</label>
              <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. Extra Syrup, Packaging" className="h-12 rounded-xl bg-[#F7F1F2]" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#6F4E37]">Amount (₹)</label>
              <Input type="number" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} placeholder="0.00" className="h-12 rounded-xl bg-[#F7F1F2] font-black text-lg" />
            </div>
          </div>
          <DialogFooter><Button onClick={handleAddCustom} className="w-full h-14 bg-[#6F4E37] text-white font-black rounded-xl uppercase tracking-widest text-xs">Add to Bill</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION DIALOG */}
      <Dialog open={tablePromptOpen} onOpenChange={setTablePromptOpen}>
        <DialogContent className="rounded-3xl p-6 w-[90%] max-w-md bg-white border-[#EBE1E3]">
          <DialogHeader><DialogTitle className="text-2xl font-bold text-center font-serif italic text-[#3A2C2C]">Review & Confirm</DialogTitle></DialogHeader>
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
              <span className="font-black text-[#3A2C2C] text-xl">₹{subtotal}</span>
            </div>
          </div>
          <div className="py-2 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#6F4E37]">Table Number / Reference</label>
              <Input value={tempTableNumber} onChange={(e) => setTempTableNumber(e.target.value)} placeholder="e.g. Table 4, Takeaway" className="h-14 text-center text-lg font-bold rounded-2xl border-[#EBE1E3] bg-[#F7F1F2]" autoFocus />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#6F4E37]">Special Instructions</label>
              <textarea value={tempSpecialInstructions} onChange={(e) => setTempSpecialInstructions(e.target.value)} placeholder="e.g. Less sugar, extra spicy..." className="w-full min-h-[80px] p-4 text-sm rounded-2xl border border-[#EBE1E3] bg-[#F7F1F2] outline-none focus:ring-2 focus:ring-[#6F4E37] resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleConfirmOrder} className="w-full h-14 font-black rounded-2xl bg-[#6F4E37] text-white hover:bg-[#3A2C2C] uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all" disabled={createOrder.isPending}>
              {createOrder.isPending ? 'Sending...' : 'Confirm & Fire'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BillDialog order={billOrder} open={billDialogOpen} onOpenChange={setBillDialogOpen} />
      <CounterOrderDialog open={counterOrderOpen} onOpenChange={setCounterOrderOpen} />
      
      {/* NEW: THE EDIT ORDER MODAL */}
      <EditOrderDialog 
        order={editingOrder} 
        open={!!editingOrder} 
        onOpenChange={(open) => !open && setEditingOrder(null)} 
      />
    </div>
  );
}