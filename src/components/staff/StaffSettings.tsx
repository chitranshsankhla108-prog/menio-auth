import { useState, useRef } from 'react';
import { 
  Settings as SettingsIcon, 
  QrCode, 
  Share2, 
  Trash2, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  LogOut, 
  ImageIcon, 
  Camera, 
  Loader2 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useCafe } from '@/contexts/CafeContext';
import { useClearTodayOrders } from '@/hooks/useClearOrders';
import { useStorage } from '@/hooks/useStorage'; 
import { supabase } from '@/integrations/supabase/client'; 
import { toast } from 'sonner';

import { PaymentSettings } from './PaymentSettings'; 
// ---> NEW: Import your synthesized sound function <---
import { playNotificationSound } from '@/hooks/useOrderNotifications'; 

export function StaffSettings() {
  const { cafe, clearCafe } = useCafe();
  const clearOrders = useClearTodayOrders();
  const { uploadMenuImage, isUploading } = useStorage(); 
  const logoInputRef = useRef<HTMLInputElement>(null); 

  const [confirmOpen, setConfirmOpen] = useState(false);
  
  // Notification Toggle State
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('menio-notifications-enabled') !== 'false'; // Default true
  });

  // ---> NEW: Volume Slider State <---
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('menio_notification_volume');
    return saved !== null ? parseFloat(saved) * 100 : 50; // Default 50%
  });

  const menuUrl = `${window.location.origin}/?code=${cafe?.code || ''}`;

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !cafe) return;

    const publicUrl = await uploadMenuImage(file);
    if (publicUrl) {
      const { error } = await supabase
        .from('cafes')
        .update({ logo_url: publicUrl })
        .eq('id', cafe.id);

      if (error) {
        toast.error("Failed to update logo in database");
      } else {
        toast.success("Cafe logo updated!");
        window.location.reload(); 
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(menuUrl);
    toast.success('Menu link copied to clipboard!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: cafe?.name || 'Menio Menu',
          text: 'Check out our menu!',
          url: menuUrl,
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleClearOrders = () => {
    clearOrders.mutate();
    setConfirmOpen(false);
  };

  const handleToggleNotifications = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    localStorage.setItem('menio-notifications-enabled', enabled.toString());
    
    // If they turn it on, play a test sound
    if (enabled) {
      toast.success('Order notifications enabled');
      if (volume > 0) playNotificationSound();
    } else {
      toast.info('Order notifications disabled');
    }
  };

  // ---> NEW: Volume Handlers <---
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    // Save to local storage as a decimal (0.0 to 1.0)
    localStorage.setItem('menio_notification_volume', (newVolume / 100).toString());
  };

  const handleVolumeRelease = (newVolume: number) => {
    if (newVolume > 0 && notificationsEnabled) {
      playNotificationSound(); // Play test sound when they release the slider
    }
  };

  const handleSwitchCafe = () => {
    clearCafe();
    window.location.href = '/';
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in max-w-2xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="w-6 h-6 text-[#6F4E37]" />
        <h2 className="font-serif italic text-2xl font-bold text-[#3A2C2C]">Dashboard Settings</h2>
      </div>

      {/* Current Cafe Info & Logo Management */}
      {cafe && (
        <Card className="rounded-[2rem] overflow-hidden border-[#EBE1E3] shadow-sm bg-white">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-6">
              {/* BRAND LOGO AREA */}
              <div 
                onClick={() => !isUploading && logoInputRef.current?.click()}
                className="relative w-20 h-20 rounded-[1.5rem] bg-[#F7F1F2] overflow-hidden shrink-0 cursor-pointer group border-2 border-dashed border-[#EBE1E3] hover:border-[#6F4E37] transition-all flex items-center justify-center shadow-inner"
              >
                {cafe.logo_url ? (
                  <img src={cafe.logo_url} alt="Logo" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-[#6F4E37]" /> : <ImageIcon className="w-6 h-6 text-[#A89699]" />}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6F4E37] mb-1">Active Cafe</h3>
                <p className="text-xl font-black text-[#3A2C2C] truncate leading-tight">{cafe.name}</p>
                <div className="inline-flex items-center gap-1.5 bg-[#FDF8F7] border border-[#EBE1E3] px-2 py-0.5 rounded-lg mt-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#A89699]">ID Code:</span>
                  <span className="text-[10px] font-mono font-bold text-[#3A2C2C]">{cafe.code}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 h-11 rounded-xl font-bold border-[#EBE1E3] text-[#3A2C2C]" onClick={handleSwitchCafe}>
                <LogOut className="w-4 h-4 mr-2" />
                Switch Cafe
              </Button>
              <input type="file" ref={logoInputRef} onChange={handleLogoChange} className="hidden" accept="image/*" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Settings */}
      {cafe && (
        <PaymentSettings 
          cafeId={cafe.id} 
          currentUpiId={(cafe as any).upi_id} 
          currentQrUrl={(cafe as any).upi_qr_url} 
        />
      )}

      {/* Notification Settings */}
      <Card className="rounded-[2rem] border-[#EBE1E3] shadow-sm bg-white">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                notificationsEnabled ? "bg-[#FFD6C9] text-[#6F4E37]" : "bg-[#F7F1F2] text-[#A89699]"
              )}>
                {notificationsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <Label htmlFor="notifications" className="font-bold text-sm text-[#3A2C2C]">Order Notifications</Label>
                <p className="text-[10px] text-[#A89699] font-medium uppercase tracking-wider">Play "Ding" sound for new orders</p>
              </div>
            </div>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={handleToggleNotifications}
            />
          </div>

          {/* ---> NEW: HTML Volume Slider <--- */}
          {notificationsEnabled && (
            <div className="pt-6 border-t border-[#EBE1E3] space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <Label className="font-bold text-xs text-[#6F4E37] uppercase tracking-wider">Volume Level</Label>
                <span className="font-black text-[#3A2C2C] bg-[#F7F1F2] px-2 py-1 rounded-md text-xs">
                  {volume}%
                </span>
              </div>
              
              <div className="flex items-center gap-4 bg-[#FDF8F7] p-5 rounded-[1.5rem] border border-[#EBE1E3]">
                <button 
                  onClick={() => handleVolumeChange(0)} 
                  className="text-[#A89699] hover:text-red-500 transition-colors"
                >
                  {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                  onMouseUp={(e) => handleVolumeRelease(parseInt((e.target as HTMLInputElement).value))}
                  onTouchEnd={(e) => handleVolumeRelease(parseInt((e.target as HTMLInputElement).value))}
                  className="flex-1 h-2 bg-[#EBE1E3] rounded-lg appearance-none cursor-pointer accent-[#6F4E37]"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share Menu Link */}
      <Card className="rounded-[2rem] border-[#EBE1E3] shadow-sm bg-white">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <QrCode className="w-5 h-5 text-[#6F4E37]" />
            <h3 className="font-bold text-sm text-[#3A2C2C]">Customer Access</h3>
          </div>
          <p className="text-xs text-[#A89699] font-medium">
            Share this link or print a QR code for your tables so customers can view the visual menu.
          </p>
          <div className="flex gap-2">
            <code className="flex-1 text-[10px] bg-[#FDF8F7] p-3 rounded-xl truncate font-mono font-bold text-[#3A2C2C] border border-[#EBE1E3]">
              {menuUrl}
            </code>
            <Button size="sm" className="rounded-xl h-11 px-4 shadow-md bg-[#6F4E37] text-white hover:bg-[#3A2C2C]" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-2 border-dashed border-red-200 bg-red-50/50 rounded-[2rem]">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-sm">Danger Zone</h3>
          </div>
          <p className="text-[11px] text-red-800/70 font-medium mb-4">
            Clearing today's orders will permanently remove them from your live kitchen dashboard. This cannot be undone.
          </p>
          
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full h-12 rounded-xl font-bold shadow-sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Orders
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[2.5rem] border-[#EBE1E3]">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-serif italic text-2xl text-[#3A2C2C]">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm font-medium text-[#A89699]">
                  This will wipe all orders from today. It's recommended to do this only after closing your cafe for the night.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3 mt-4">
                <AlertDialogCancel className="rounded-xl h-12 flex-1 border-[#EBE1E3]">Wait, Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearOrders}
                  className="bg-red-600 text-white hover:bg-red-700 rounded-xl h-12 flex-1 font-bold shadow-md"
                >
                  Yes, Clear Orders
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* About */}
      <div className="text-center py-6 space-y-2">
        <p className="text-[10px] font-black text-[#A89699] uppercase tracking-[0.3em]">Menio v1.0.0</p>
        <p className="text-[9px] text-[#A89699]/60 italic px-8">Managed by Digital Cafe Hub. All your cafe data is secure and real-time.</p>
      </div>
    </div>
  );
}