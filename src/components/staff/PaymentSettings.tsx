import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client"; 
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, QrCode, CheckCircle2, AlertCircle } from "lucide-react";

interface PaymentSettingsProps {
  cafeId: string;
  currentUpiId?: string;
  currentQrUrl?: string;
}

export function PaymentSettings({ cafeId, currentUpiId, currentQrUrl }: PaymentSettingsProps) {
  const [upiId, setUpiId] = useState(currentUpiId || "");
  const [previewUrl, setPreviewUrl] = useState(currentQrUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // --- NEW VALIDATION CODE ---
    
    // 1. Size Check (2MB Limit)
    const maxSize = 2 * 1024 * 1024; 
    if (file.size > maxSize) {
      toast({ 
        title: "File too large", 
        description: "Please upload an image smaller than 2MB for better performance.", 
        variant: "destructive" 
      });
      return;
    }

    // 2. Type Check (MIME types)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ 
        title: "Invalid file type", 
        description: "Please use JPG, PNG, or WebP formats.", 
        variant: "destructive" 
      });
      return;
    }

    // --- END VALIDATION ---

    setIsUploading(true);
    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const filePath = `qrcodes/${cafeId}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      setPreviewUrl(publicUrl);
      toast({ title: "Image uploaded successfully!", variant: "default" });
    } catch (error: any) {
      toast({ 
        title: "Upload failed", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!upiId || !previewUrl) {
      toast({
        title: "Missing Information",
        description: "Both UPI ID and a QR Code image are required to enable payments.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const { data, error: dbError } = await supabase
        .from('cafes')
        .update({ 
          upi_id: upiId, 
          upi_qr_url: previewUrl 
        } as any) 
        .eq('id', cafeId)
        .select();

      if (dbError) {
        console.error("Supabase Error:", dbError);
        throw dbError;
      }

      if (!data || data.length === 0) {
        console.error("Zero rows updated. Blocked by RLS or Cafe ID mismatch.");
        throw new Error("Save blocked by database security. Please update your Supabase policies.");
      }

      toast({ 
        title: "Success", 
        description: "Payment settings locked in!", 
        variant: "default" 
      });

      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error: any) {
      toast({ 
        title: "Save failed", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border-none bg-[#FDF8F7] shadow-sm rounded-[2.5rem] overflow-hidden">
      <CardHeader className="bg-[#3A2C2C] py-6">
        <CardTitle className="font-serif italic text-[#FDF8F7] text-2xl flex items-center gap-2">
          <QrCode size={24} /> Payment Configuration
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-8 space-y-8">
        <div className="space-y-3">
          <label className="text-sm font-bold text-[#6F4E37] uppercase tracking-wider flex items-center gap-2">
            UPI ID <span className="text-red-400">*</span>
          </label>
          <Input 
            value={upiId} 
            onChange={(e) => setUpiId(e.target.value)}
            className="rounded-2xl border-[#FFD6C9] bg-white h-12 focus:ring-[#3A2C2C]"
            placeholder="e.g. yourcafe@upi"
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-[#6F4E37] uppercase tracking-wider flex items-center gap-2">
            QR Code Image <span className="text-red-400">*</span>
          </label>
          
          <div className={`relative flex flex-col items-center p-10 border-2 border-dashed rounded-[2rem] transition-all ${
            !previewUrl ? 'border-red-200 bg-red-50/20' : 'border-[#FFD6C9] bg-white shadow-inner'
          }`}>
            {previewUrl ? (
              <div className="relative group">
                <img 
                  src={previewUrl} 
                  alt="QR Preview" 
                  className="w-48 h-48 object-contain rounded-xl p-2 bg-white" 
                />
                <div className="absolute -top-2 -right-2 bg-[#8ED1B2] p-1 rounded-full shadow-md">
                  <CheckCircle2 size={20} className="text-[#3A2C2C]" />
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 bg-[#FDF8F7] flex items-center justify-center rounded-3xl mx-auto text-[#FFD6C9] mb-4">
                  <Upload size={32} />
                </div>
                <p className="text-xs text-[#6F4E37] font-medium">Upload your official UPI QR code</p>
              </div>
            )}
            
            <label className="mt-6 cursor-pointer group">
              <span className="bg-[#3A2C2C] text-[#FDF8F7] px-8 py-3 rounded-full text-sm font-bold flex items-center gap-2 group-hover:opacity-90 transition-opacity">
                {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                {previewUrl ? "Replace Image" : "Choose Image"}
              </span>
              <input 
                type="file" 
                className="hidden" 
                onChange={handleFileChange} 
                accept="image/*" 
                disabled={isUploading} 
              />
            </label>
          </div>
        </div>

        {(!upiId || !previewUrl) && (
          <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-2xl border border-red-100">
            <AlertCircle size={18} />
            <span className="text-xs font-bold uppercase">QR Code and UPI ID are required</span>
          </div>
        )}

        <Button 
          onClick={handleSaveSettings}
          disabled={isUploading}
          className="w-full h-14 bg-[#3A2C2C] text-white rounded-full font-bold text-lg hover:brightness-110 shadow-xl shadow-orange-100/50 transition-all"
        >
          {isUploading ? "Processing..." : "Save Payment Details"}
        </Button>
      </CardContent>
    </Card>
  );
}