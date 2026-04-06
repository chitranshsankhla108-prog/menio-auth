import { useState } from 'react';
import { Hash, Receipt, Banknote, Smartphone, Share2, Check, Store } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Order, useUpdateOrderPayment } from '@/hooks/useOrders';
import { useCafe } from '@/contexts/CafeContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BillDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GST_RATE = 0.05; // 5% GST

export function BillDialog({ order, open, onOpenChange }: BillDialogProps) {
  const [includeGst, setIncludeGst] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'upi' | null>(null);
  const { cafe } = useCafe();
  const updatePayment = useUpdateOrderPayment();

  if (!order) return null;

  const displayId = order.order_number || order.id.slice(0, 6).toUpperCase();
  const subtotal = Number(order.total_price);
  const gstAmount = includeGst ? subtotal * GST_RATE : 0;
  const grandTotal = subtotal + gstAmount;

  const handleMarkAsPaid = () => {
    if (!selectedPayment) return;
    
    updatePayment.mutate({
      id: order.id,
      payment_method: selectedPayment,
      payment_status: 'paid',
      include_gst: includeGst,
      gst_amount: gstAmount,
      final_total: grandTotal,
    }, {
      onSuccess: () => {
        toast.success("Payment recorded successfully!");
        onOpenChange(false);
        setSelectedPayment(null);
        setIncludeGst(false);
      }
    });
  };

  const handleShare = async () => {
    const billText = `
━━━━━━━━━━━━━━━━━━━━━━
${cafe?.name || 'Cafe'} Bill
━━━━━━━━━━━━━━━━━━━━━━
Order #${displayId}
${format(new Date(order.created_at), 'dd MMM yyyy, h:mm a')}
${order.customer_name ? `Guest: ${order.customer_name}` : ''}
${order.table_number ? `Table: ${order.table_number}` : ''}

${order.items.map(item => `${item.quantity}x ${item.name}\n   ₹${(item.price * item.quantity).toFixed(2)}`).join('\n\n')}

──────────────────────
Subtotal: ₹${subtotal.toFixed(2)}
${includeGst ? `GST (5%): ₹${gstAmount.toFixed(2)}\n──────────────────────` : ''}
TOTAL: ₹${grandTotal.toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━
Thank you for visiting!
Powered by Menio
    `.trim();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${cafe?.name} - Bill #${displayId}`,
          text: billText,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      await navigator.clipboard.writeText(billText);
      toast.success("Bill copied to clipboard!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0 border-none bg-[#F4EDE4] rounded-[2rem] shadow-[0_20px_60px_rgba(58,44,44,0.15)]">
        
        <DialogHeader className="p-6 bg-[#3A2C2C] text-white shrink-0">
          <DialogTitle className="flex items-center gap-2 font-serif text-2xl italic tracking-tight text-[#FFD6C9]">
            <Receipt className="w-6 h-6" />
            Invoice
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          
          {/* THE "PAPER RECEIPT" UI */}
          <div className="bg-white p-6 rounded-xl border border-dashed border-[#A89699] shadow-sm relative">
            {/* Scalloped top edge illusion */}
            <div className="absolute -top-3 left-0 right-0 h-3 bg-[radial-gradient(circle,transparent_4px,#ffffff_5px)] bg-[length:12px_12px] -mt-[1px]" />

            {/* Header */}
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F4EDE4] mb-1">
                <Store className="w-6 h-6 text-[#6F4E37]" />
              </div>
              <h3 className="font-serif text-2xl font-black text-[#3A2C2C] uppercase tracking-widest">
                {cafe?.name || 'Cafe'}
              </h3>
              <p className="text-[10px] uppercase tracking-widest text-[#A89699] font-bold">
                {format(new Date(order.created_at), 'dd MMM yyyy • h:mm a')}
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Badge variant="outline" className="font-mono text-[10px] font-bold border-[#6F4E37] text-[#6F4E37] bg-[#F4EDE4]/50">
                  <Hash className="w-3 h-3 mr-0.5" />{displayId}
                </Badge>
                {order.table_number && (
                  <Badge className="text-[10px] font-black uppercase tracking-widest bg-[#6F4E37] text-white">
                    Tbl {order.table_number}
                  </Badge>
                )}
              </div>
              {order.customer_name && (
                <p className="text-sm font-bold text-[#3A2C2C] pt-1 border-t border-dashed border-[#EBE1E3] mt-3">
                  Guest: {order.customer_name}
                </p>
              )}
            </div>

            {/* Items */}
            <div className="space-y-3 font-mono text-sm border-b border-dashed border-[#A89699] pb-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <span className="text-[#3A2C2C] max-w-[70%]">
                    <span className="font-bold mr-2">{item.quantity}x</span>
                    {item.name}
                  </span>
                  <span className="font-bold text-[#6F4E37]">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-4">
              <div className="flex justify-between text-sm font-bold text-[#A89699]">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {includeGst && (
                <div className="flex justify-between text-sm font-bold text-[#A89699]">
                  <span>GST (5%)</span>
                  <span>₹{gstAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center mt-3 pt-3 border-t-2 border-[#3A2C2C]">
                <span className="font-black uppercase tracking-widest text-[#3A2C2C] text-sm">Grand Total</span>
                <span className="font-serif italic text-2xl font-black text-[#3A2C2C]">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* GST Toggle */}
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-[#F9E0E3] shadow-sm">
            <Label htmlFor="gst-toggle" className="flex flex-col cursor-pointer">
              <span className="font-bold text-[#3A2C2C]">Include GST (5%)</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#A89699]">Add standard tax</span>
            </Label>
            <Switch
              id="gst-toggle"
              checked={includeGst}
              onCheckedChange={setIncludeGst}
              className="data-[state=checked]:bg-[#8ED1B2]"
            />
          </div>

          {/* Payment Options */}
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-[#6F4E37]">Settle Payment</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={selectedPayment === 'cash' ? 'default' : 'outline'}
                className={cn(
                  "h-16 flex-col gap-1.5 rounded-2xl border-2 transition-all",
                  selectedPayment === 'cash' 
                    ? 'bg-[#6F4E37] border-[#6F4E37] text-white shadow-md scale-[1.02]' 
                    : 'bg-white border-[#EBE1E3] text-[#6F4E37] hover:bg-[#F7F1F2]'
                )}
                onClick={() => setSelectedPayment('cash')}
              >
                <Banknote className="w-5 h-5" />
                <span className="font-bold uppercase tracking-wider text-xs">Cash</span>
              </Button>
              <Button
                variant={selectedPayment === 'upi' ? 'default' : 'outline'}
                className={cn(
                  "h-16 flex-col gap-1.5 rounded-2xl border-2 transition-all",
                  selectedPayment === 'upi' 
                    ? 'bg-[#6F4E37] border-[#6F4E37] text-white shadow-md scale-[1.02]' 
                    : 'bg-white border-[#EBE1E3] text-[#6F4E37] hover:bg-[#F7F1F2]'
                )}
                onClick={() => setSelectedPayment('upi')}
              >
                <Smartphone className="w-5 h-5" />
                <span className="font-bold uppercase tracking-wider text-xs">UPI</span>
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-14 rounded-xl border-[#EBE1E3] text-[#6F4E37] hover:bg-white font-bold"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              className="flex-[2] h-14 rounded-xl bg-[#3A2C2C] text-[#FFD6C9] hover:bg-[#6F4E37] font-black uppercase tracking-widest text-xs shadow-lg"
              disabled={!selectedPayment || updatePayment.isPending}
              onClick={handleMarkAsPaid}
            >
              <Check className="w-4 h-4 mr-2" />
              {updatePayment.isPending ? 'Processing...' : 'Mark as Paid'}
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}