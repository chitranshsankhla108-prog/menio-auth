import { useState } from 'react';
import { Plus, Minus, Coffee, Cookie, UtensilsCrossed, ShoppingBag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMenuItems, MenuCategory, MenuItem } from '@/hooks/useMenuItems';
import { useCreateOrder, OrderItem } from '@/hooks/useOrders';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CounterOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export function CounterOrderDialog({ open, onOpenChange }: CounterOrderDialogProps) {
  const { data: menuItems = [] } = useMenuItems();
  const createOrder = useCreateOrder();
  
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('Drinks');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const availableItems = menuItems.filter(
    (item) => item.is_available && item.category === selectedCategory
  );

  const subtotal = cart.reduce(
    (total, item) => total + Number(item.menuItem.price) * item.quantity,
    0
  );

  const getItemQuantity = (itemId: string) => {
    const cartItem = cart.find((c) => c.menuItem.id === itemId);
    return cartItem?.quantity || 0;
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
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

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setTableNumber('');
    setSpecialInstructions('');
  };

  const handleCreateOrder = () => {
    if (cart.length === 0) return;

    // STRICT CHECK: Block the order if table number is empty
    if (!tableNumber.trim()) {
      toast.error("Table Number Required", {
        description: "Please enter a table number or type 'Counter' to proceed."
      });
      return;
    }

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
        customer_name: customerName.trim() || 'Counter Guest',
        table_number: tableNumber.trim(), // Sends exactly what the staff typed
        special_instructions: specialInstructions.trim() || undefined,
        is_counter_order: true,
      },
      {
        onSuccess: () => {
          clearCart();
          onOpenChange(false);
          toast.success("Order sent to kitchen!");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col rounded-2xl bg-[#FDF8F7] border-[#EBE1E3]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif italic text-2xl text-[#3A2C2C]">
            <ShoppingBag className="w-6 h-6 text-[#6F4E37]" />
            Add Counter Order
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 pr-2">
          
          {/* 2-Column Grid for Table Number & Customer Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="counter-table-number" className="text-[10px] font-black text-[#6F4E37] uppercase tracking-wider">
                Table No. <span className="text-red-500 text-sm">*</span>
              </Label>
              <Input
                id="counter-table-number"
                placeholder="e.g. 5 or Counter"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="h-12 rounded-xl border-[#EBE1E3] bg-white focus-visible:ring-[#6F4E37] font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="counter-customer-name" className="text-[10px] font-black text-[#6F4E37] uppercase tracking-wider">
                Guest Name
              </Label>
              <Input
                id="counter-customer-name"
                placeholder="Optional"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-12 rounded-xl border-[#EBE1E3] bg-white focus-visible:ring-[#6F4E37]"
              />
            </div>
          </div>

          {/* Special Instructions Box */}
          <div className="space-y-1.5">
            <Label htmlFor="counter-special-notes" className="text-[10px] font-black text-[#6F4E37] uppercase tracking-wider">
              Special Instructions
            </Label>
            <textarea
              id="counter-special-notes"
              placeholder="e.g., Make it extra spicy, less ice..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="flex min-h-[60px] w-full rounded-xl border border-[#EBE1E3] bg-white px-3 py-2 text-sm shadow-sm placeholder:text-[#A89699] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#6F4E37] resize-none"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => {
              const Icon = categoryIcons[cat];
              const isActive = selectedCategory === cat;
              return (
                <Button
                  key={cat}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "shrink-0 rounded-xl h-9 transition-colors",
                    isActive 
                      ? "bg-[#6F4E37] text-white hover:bg-[#3A2C2C]" 
                      : "bg-[#F7F1F2] text-[#6F4E37] hover:bg-[#EBE1E3]"
                  )}
                >
                  <Icon className="w-4 h-4 mr-1.5" />
                  {cat}
                </Button>
              );
            })}
          </div>

          {/* Available Items */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {availableItems.map((item) => {
              const quantity = getItemQuantity(item.id);
              const Icon = categoryIcons[item.category];
              return (
                <Card key={item.id} className="overflow-hidden border-none bg-white shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#F7F1F2] flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-[#6F4E37]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate text-[#3A2C2C]">{item.name}</h3>
                        <p className="text-[#6F4E37] font-black text-sm">₹{item.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {quantity > 0 ? (
                          <div className="flex items-center gap-1 bg-[#F7F1F2] p-1 rounded-xl">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg text-[#3A2C2C] hover:bg-white"
                              onClick={() => updateQuantity(item.id, quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-6 text-center font-bold text-xs text-[#3A2C2C]">{quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg bg-[#6F4E37] text-white hover:bg-[#3A2C2C]"
                              onClick={() => addToCart(item)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            size="sm" 
                            className="rounded-xl px-4 font-bold shadow-sm bg-[#6F4E37] text-white hover:bg-[#3A2C2C]" 
                            onClick={() => addToCart(item)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Footer with Cart Summary */}
        {cart.length > 0 && (
          <div className="border-t border-[#EBE1E3] pt-4 space-y-3 mt-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#6F4E37]" />
                <span className="font-bold text-[#3A2C2C]">{cart.length} items</span>
              </div>
              <span className="font-serif italic text-2xl font-black text-[#6F4E37]">
                ₹{subtotal}
              </span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl font-bold border-[#EBE1E3] text-[#6F4E37] hover:bg-[#F7F1F2]" 
                onClick={clearCart}
              >
                Clear
              </Button>
              <Button
                className="flex-[2] rounded-xl font-black shadow-md text-sm bg-[#6F4E37] text-white hover:bg-[#3A2C2C]"
                onClick={handleCreateOrder}
                disabled={createOrder.isPending}
              >
                {createOrder.isPending ? 'Sending...' : 'Send to Kitchen'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}