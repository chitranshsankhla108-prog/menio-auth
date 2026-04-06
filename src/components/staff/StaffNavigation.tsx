import { Link, useLocation } from 'react-router-dom';
import { Menu, ShoppingCart, MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/staff', icon: Menu, label: 'Menu' },
  { path: '/staff/orders', icon: ShoppingCart, label: 'Orders' },
  { path: '/staff/feedback', icon: MessageSquare, label: 'Feedback' },
  { path: '/staff/settings', icon: Settings, label: 'Settings' },
];

export function StaffNavigation() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#F4EDE4]/90 backdrop-blur-2xl border-t border-[#F9E0E3] shadow-[0_-10px_40px_rgba(58,44,44,0.05)]">
      <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-4 pb-2">
        {navItems.map((item) => {
          // Check if it's the exact path OR if we are inside a sub-page of that path
          const isActive = location.pathname === item.path || 
                          (item.path !== '/staff' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1.5 transition-all duration-300 relative group',
                isActive
                  ? 'text-[#3A2C2C]' 
                  : 'text-[#6F4E37]/40 hover:text-[#6F4E37]'
              )}
            >
              {/* Premium Icon Wrapper (The "Pill") */}
              <div className={cn(
                "p-2 rounded-[1rem] transition-all duration-300",
                isActive 
                  ? "bg-[#FFD6C9] shadow-[0_4px_10px_rgba(255,214,201,0.5)]" 
                  : "group-hover:bg-[#F9E0E3]/50"
              )}>
                <item.icon
                  className={cn(
                    'w-[1.15rem] h-[1.15rem] transition-transform duration-300',
                    isActive && 'scale-110 stroke-[2.5px]'
                  )}
                />
              </div>
              
              {/* Elegant Typography */}
              <span className={cn(
                "text-[9px] font-black uppercase tracking-[0.2em] transition-all",
                isActive ? "opacity-100" : "opacity-0 translate-y-2 absolute bottom-1 group-hover:opacity-100 group-hover:translate-y-0"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}