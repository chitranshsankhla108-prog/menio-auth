import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Order, OrderItem, useUpdateOrderItems } from '@/hooks/useOrders';
import { useMenuItems } from '@/hooks/useMenuItems';
import { Plus, Minus, Trash2 } from 'lucide-react';

interface EditOrderDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditOrderDialog({ order, open, onOpenChange }: EditOrderDialogProps) {
  const { data: menuItems = [] } = useMenuItems();
  const updateOrderItems = useUpdateOrderItems();
  
  const [currentItems, setCurrentItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    if (order && open) {
      // Deep copy to avoid mutating original state instantly
      setCurrentItems(JSON.parse(JSON.stringify(order.items)));
    }
  }, [order, open]);

  const newTotal = currentItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCurrentItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0)); // Auto-remove if quantity hits 0
  };

  const handleRemoveItem = (itemId: string) => {
    setCurrentItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleAddNewItem = (menuItemId: string) => {
    const menuItem = menuItems.find(m => m.id === menuItemId);
    if (!menuItem) return;

    setCurrentItems(prev => {
      const existing = prev.find(p => p.id === menuItem.id);
      if (existing) {
        return prev.map(p => p.id === menuItem.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { id: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: 1 }];
    });
  };

  const handleSave = () => {
    if (!order) return;
    updateOrderItems.mutate(
      { id: order.id, items: currentItems, total_price: newTotal },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl p-6 w-[90%] max-w-md bg-white border-[#EBE1E3]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-serif italic text-[#3A2C2C]">
            Edit Table {order.table_number || 'Order'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Item List */}
          <div className="bg-[#FDF8F7] p-2 rounded-2xl border border-[#EBE1E3] max-h-[300px] overflow-y-auto space-y-2">
            {currentItems.length === 0 ? (
              <p className="text-center text-xs text-[#A89699] py-4 font-bold uppercase tracking-widest">Order is empty</p>
            ) : (
              currentItems.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-[#EBE1E3] shadow-sm">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-bold text-[#3A2C2C] truncate">{item.name}</p>
                    <p className="text-xs font-black text-[#6F4E37]">₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#FDF8F7] p-1 rounded-lg">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[#3A2C2C]" onClick={() => handleUpdateQuantity(item.id, -1)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="font-black text-sm w-4 text-center">{item.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[#3A2C2C]" onClick={() => handleUpdateQuantity(item.id, 1)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 ml-1 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleRemoveItem(item.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add New Item Selector */}
          <div className="pt-2">
            <Select onValueChange={handleAddNewItem} value="">
              <SelectTrigger className="h-12 rounded-xl border-dashed border-2 border-[#EBE1E3] bg-[#FDF8F7] focus-visible:ring-[#FFD6C9] font-bold text-[#6F4E37]">
                <SelectValue placeholder="+ Add item to order..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#EBE1E3] shadow-lg max-h-[200px]">
                {menuItems.filter(m => m.is_available).map(item => (
                  <SelectItem key={item.id} value={item.id} className="font-bold py-3 cursor-pointer focus:bg-[#F9E0E3]">
                    {item.name} - ₹{item.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-[#EBE1E3]">
            <span className="font-black uppercase text-[10px] tracking-widest text-[#A89699]">New Total</span>
            <span className="font-black text-[#3A2C2C] text-xl">₹{newTotal}</span>
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleSave} 
            className="w-full h-14 bg-[#3A2C2C] text-white font-black rounded-xl uppercase tracking-widest text-sm shadow-xl hover:bg-[#6F4E37] transition-all"
            disabled={updateOrderItems.isPending || currentItems.length === 0}
          >
            {updateOrderItems.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}