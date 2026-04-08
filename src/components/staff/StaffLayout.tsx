import { Outlet, useNavigate } from 'react-router-dom';
import { StaffNavigation } from './StaffNavigation';
import { useAuth } from '@/hooks/useAuth';
import { useOrderNotifications } from '@/hooks/useOrderNotifications'; // <-- NEW IMPORT
import { Button } from '@/components/ui/button';
import { LogOut, User, ShieldCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export function StaffLayout() {
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();

  // <-- GLOBAL NOTIFICATIONS TRIGGER -->
  // This stays alive no matter what tab you are on!
  useOrderNotifications(); 

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      toast.success('Signed out securely');
      navigate('/auth'); 
    }
  };

  return (
    <div className="min-h-screen bg-[#F4EDE4] pb-24 md:pb-20 selection:bg-[#FFD6C9] selection:text-[#3A2C2C]">
      
      {/* COCOA STAFF HEADER */}
      <header className="sticky top-0 z-40 bg-[#3A2C2C] text-[#F4EDE4] shadow-[0_15px_40px_rgba(58,44,44,0.15)]">
        <div className="flex items-center justify-between h-16 px-6 max-w-[1600px] mx-auto">
          
          {/* Brand & Badge */}
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-black font-serif italic tracking-tighter text-[#F4EDE4]">
              Menio
            </h1>
            <span className="bg-[#6F4E37] text-[#FFD6C9] text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md">
              Portal
            </span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-[#F4EDE4] hover:bg-[#6F4E37] hover:text-[#FFD6C9] rounded-xl transition-all active:scale-95">
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            
            {/* Premium Dropdown Styling */}
            <DropdownMenuContent align="end" className="w-64 rounded-[1.5rem] border-[#F9E0E3] shadow-[0_20px_60px_rgba(58,44,44,0.08)] bg-white p-2">
              <div className="px-4 py-3 border-b border-[#F9E0E3] mb-2 bg-[#F4EDE4]/40 rounded-xl">
                <p className="text-sm font-bold text-[#3A2C2C] truncate">{user?.email}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#6F4E37]" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6F4E37]">
                    {isAdmin ? 'Administrator' : 'Staff Member'}
                  </p>
                </div>
              </div>
              
              <DropdownMenuItem 
                onClick={handleSignOut} 
                className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer rounded-xl font-bold text-sm py-3 px-3 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Secure Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </header>
      
      {/* MAIN CONTENT OUTLET */}
      <main className="w-full">
        <Outlet />
      </main>
      
      {/* BOTTOM NAVIGATION ROUTER */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#EBE1E3] bg-white md:bg-transparent md:border-none">
        <div className="max-w-[1600px] mx-auto">
           <StaffNavigation />
        </div>
      </div>
    </div>
  );
}