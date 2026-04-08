import { useState, useRef } from 'react';
import { Hash, Receipt, Banknote, Smartphone, Share2, Check, Store, Printer, Image as ImageIcon } from 'lucide-react';
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
import html2canvas from 'html2canvas';

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
  
  // Reference for the hidden receipt we want to turn into an image
  const receiptRef = useRef<HTMLDivElement>(null);

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

  // --- SHARE TEXT (Standard Fast Share) ---
  const handleShareText = async () => {
    const billText = `━━━━━━━━━━━━━━━━━━━━━━\n${cafe?.name || 'Cafe'} Bill\n━━━━━━━━━━━━━━━━━━━━━━\nOrder #${displayId}\nTotal: ₹${grandTotal.toFixed(2)}\nThank you for visiting!`;
    if (navigator.share) {
      try { await navigator.share({ text: billText }); } catch (err) {}
    } else {
      await navigator.clipboard.writeText(billText);
      toast.success("Bill copied to clipboard!");
    }
  };

  // --- PRINT THERMAL (Strictly for physical receipt machines) ---
  const handlePrintNormal = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error("Please allow pop-ups.");
    const content = renderNormal80mm(order, cafe, displayId, subtotal, includeGst, gstAmount, grandTotal);
    printWindow.document.write(`<html><head><script src="https://cdn.tailwindcss.com"></script><style>@page { size: 80mm auto; margin: 0; } body { width: 80mm; padding: 6mm; font-family: monospace; }</style></head><body>${content}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  // --- SHARE DESIGNER (INSTANT IMAGE GENERATION) ---
  const handleShareDesignerImage = async () => {
    if (!receiptRef.current) return;
    
    toast.loading("Preparing aesthetic receipt...", { id: "share-toast" });

    try {
      // Takes an instant screenshot of the hidden React component
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, // High resolution for mobile
        backgroundColor: '#F4EDE4',
        logging: false
      });

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error("Failed to generate image");

        const file = new File([blob], `Menio_Bill_${displayId}.png`, { type: 'image/png' });

        // Trigger Native Share (Mobile) or Download (PC)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Bill #${displayId}`,
            text: `Thank you for visiting ${cafe?.name || 'us'}! Here is your receipt.`
          });
          toast.success("Shared successfully!", { id: "share-toast" });
        } else {
          // Fallback for PC browsers
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Menio_Bill_${displayId}.png`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success("Receipt image downloaded!", { id: "share-toast" });
        }
      }, 'image/png');

    } catch (error) {
      console.error(error);
      toast.error("Failed to generate image.", { id: "share-toast" });
    }
  };

  return (
    <>
      {/* =========================================================
        THE HIDDEN RECEIPT (For Instant Image Generation)
        This is rendered off-screen so html2canvas can grab it instantly 
        without loading external CSS files.
        =========================================================
      */}
      <div className="absolute top-0 left-0 -z-50 opacity-0 pointer-events-none">
        <div ref={receiptRef} className="w-[500px] bg-[#F4EDE4] p-10 font-sans">
          <div className="bg-white p-10 rounded-[2rem] border-2 border-dashed border-[#A89699] relative">
            {/* Scalloped edge */}
            <div className="absolute -top-3 left-0 right-0 h-3 bg-[radial-gradient(circle,transparent_4px,#ffffff_5px)] bg-[length:12px_12px] -mt-[1px]" />
            
            <div className="text-center space-y-3 mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F4EDE4] mb-2">
                <Store className="w-8 h-8 text-[#6F4E37]" />
              </div>
              <h3 className="font-serif text-4xl font-black text-[#3A2C2C] uppercase tracking-widest italic">{cafe?.name || 'Cafe'}</h3>
              <p className="text-sm uppercase tracking-widest text-[#A89699] font-bold">{format(new Date(order.created_at), 'dd MMM yyyy • h:mm a')}</p>
              <div className="pt-2">
                <span className="font-mono text-sm font-bold border border-[#6F4E37] text-[#6F4E37] bg-[#F4EDE4]/50 px-4 py-1.5 rounded-full">#{displayId}</span>
              </div>
            </div>

            <div className="space-y-4 font-mono text-lg border-b-2 border-dashed border-[#A89699] pb-6">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <span className="text-[#3A2C2C] max-w-[75%]"><span className="font-bold mr-3">{item.quantity}x</span>{item.name}</span>
                  <span className="font-bold text-[#6F4E37]">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-6">
              <div className="flex justify-between text-base font-bold text-[#A89699]"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              {includeGst && <div className="flex justify-between text-base font-bold text-[#A89699]"><span>GST (5%)</span><span>₹{gstAmount.toFixed(2)}</span></div>}
              <div className="flex justify-between items-center mt-4 pt-4 border-t-4 border-[#3A2C2C]">
                <span className="font-black uppercase tracking-widest text-[#3A2C2C] text-xl">Grand Total</span>
                <span className="font-serif italic text-4xl font-black text-[#3A2C2C]">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center mt-10 text-[#A89699]">
               <p className="font-bold uppercase tracking-widest text-sm">Thank You for Visiting</p>
               <p className="text-xs uppercase tracking-[0.3em] opacity-60 mt-1">Powered by Menio</p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
        THE VISIBLE DIALOG UI
        =========================================================
      */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0 border-none bg-[#F4EDE4] rounded-[2rem] shadow-2xl">
          <DialogHeader className="p-6 bg-[#3A2C2C] text-white shrink-0">
            <DialogTitle className="flex items-center gap-2 font-serif text-2xl italic tracking-tight text-[#FFD6C9]">
              <Receipt className="w-6 h-6" /> Invoice
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {/* The "Paper Receipt" UI on screen */}
            <div className="bg-white p-6 rounded-xl border border-dashed border-[#A89699] shadow-sm relative">
              <div className="absolute -top-3 left-0 right-0 h-3 bg-[radial-gradient(circle,transparent_4px,#ffffff_5px)] bg-[length:12px_12px] -mt-[1px]" />
              <div className="text-center space-y-2 mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F4EDE4] mb-1">
                  <Store className="w-6 h-6 text-[#6F4E37]" />
                </div>
                <h3 className="font-serif text-2xl font-black text-[#3A2C2C] uppercase tracking-widest">{cafe?.name || 'Cafe'}</h3>
                <p className="text-[10px] uppercase tracking-widest text-[#A89699] font-bold">{format(new Date(order.created_at), 'dd MMM yyyy • h:mm a')}</p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Badge variant="outline" className="font-mono text-[10px] font-bold border-[#6F4E37] text-[#6F4E37] bg-[#F4EDE4]/50">
                    <Hash className="w-3 h-3 mr-0.5" />{displayId}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 font-mono text-sm border-b border-dashed border-[#A89699] pb-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <span className="text-[#3A2C2C] max-w-[70%]"><span className="font-bold mr-2">{item.quantity}x</span>{item.name}</span>
                    <span className="font-bold text-[#6F4E37]">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-4">
                <div className="flex justify-between text-sm font-bold text-[#A89699]"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                {includeGst && <div className="flex justify-between text-sm font-bold text-[#A89699]"><span>GST (5%)</span><span>₹{gstAmount.toFixed(2)}</span></div>}
                <div className="flex justify-between items-center mt-3 pt-3 border-t-2 border-[#3A2C2C]">
                  <span className="font-black uppercase tracking-widest text-[#3A2C2C] text-sm">Grand Total</span>
                  <span className="font-serif italic text-2xl font-black text-[#3A2C2C]">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-[#F9E0E3]">
              <Label htmlFor="gst-toggle" className="flex flex-col cursor-pointer">
                <span className="font-bold text-[#3A2C2C]">Include GST (5%)</span>
              </Label>
              <Switch id="gst-toggle" checked={includeGst} onCheckedChange={setIncludeGst} className="data-[state=checked]:bg-[#8ED1B2]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant={selectedPayment === 'cash' ? 'default' : 'outline'} className={cn("h-16 flex-col gap-1.5 rounded-2xl border-2 transition-all", selectedPayment === 'cash' ? 'bg-[#6F4E37] border-[#6F4E37] text-white' : 'bg-white text-[#6F4E37]')} onClick={() => setSelectedPayment('cash')}><Banknote className="w-5 h-5" /> Cash</Button>
              <Button variant={selectedPayment === 'upi' ? 'default' : 'outline'} className={cn("h-16 flex-col gap-1.5 rounded-2xl border-2 transition-all", selectedPayment === 'upi' ? 'bg-[#6F4E37] border-[#6F4E37] text-white' : 'bg-white text-[#6F4E37]')} onClick={() => setSelectedPayment('upi')}><Smartphone className="w-5 h-5" /> UPI</Button>
            </div>

            <div className="space-y-3 pt-2 border-t border-dashed border-[#A89699]/30">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12 rounded-xl text-[#3A2C2C] font-bold text-[11px] uppercase" onClick={handlePrintNormal}><Printer className="w-4 h-4 mr-2" /> Thermal Print</Button>
                <Button variant="outline" className="h-12 rounded-xl text-[#6F4E37] bg-[#FDF8F7] border-[#6F4E37]/30 font-bold text-[11px] uppercase" onClick={handleShareDesignerImage}><ImageIcon className="w-4 h-4 mr-2" /> Share Image</Button>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-[1] h-14 rounded-xl text-[#6F4E37] font-bold" onClick={handleShareText}><Share2 className="w-4 h-4" /></Button>
                <Button className="flex-[3] h-14 rounded-xl bg-[#3A2C2C] text-[#FFD6C9] hover:bg-[#6F4E37] font-black uppercase text-xs shadow-lg" disabled={!selectedPayment || updatePayment.isPending} onClick={handleMarkAsPaid}><Check className="w-4 h-4 mr-2" /> Mark as Paid</Button>
              </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ==========================================
// THERMAL HTML TEMPLATE (Only used if they click "Thermal Print")
// ==========================================
function renderNormal80mm(order: any, cafe: any, displayId: string, subtotal: number, includeGst: boolean, gstAmount: number, grandTotal: number) {
  return `
    <div class="text-[11px] uppercase text-black font-bold">
      <div class="text-center mb-4"><h2 class="text-xl">${cafe.name || 'Cafe'}</h2><p>${format(new Date(), 'dd/MM/yyyy HH:mm')}</p><p>#${displayId}</p></div>
      <div class="border-b-2 border-black border-dashed mb-2"></div>
      ${order.items.map((it: any) => `<div class="flex justify-between mb-1"><span>${it.quantity}x ${it.name}</span><span>${(it.price * it.quantity).toFixed(2)}</span></div>`).join('')}
      <div class="border-b-2 border-black border-dashed mt-3 mb-2"></div>
      <div class="flex justify-between"><span>SUBTOTAL</span><span>${subtotal.toFixed(2)}</span></div>
      ${includeGst ? `<div class="flex justify-between"><span>GST</span><span>${gstAmount.toFixed(2)}</span></div>` : ''}
      <div class="border-b-2 border-black border-solid my-2"></div>
      <div class="flex justify-between text-sm"><span>TOTAL</span><span>Rs. ${grandTotal.toFixed(2)}</span></div>
    </div>
  `;
}