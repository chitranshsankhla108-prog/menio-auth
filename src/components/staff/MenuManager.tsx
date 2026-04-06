import { useState } from 'react';
import { Plus, Pencil, Trash2, Coffee, Cookie, UtensilsCrossed, Loader2, ImageIcon } from 'lucide-react';
import { useMenuItems, useDeleteMenuItem, MenuCategory, MenuItem } from '@/hooks/useMenuItems';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MenuItemDialog } from './MenuItemDialog';
import { Switch } from '@/components/ui/switch';
import { useUpdateMenuItem } from '@/hooks/useMenuItems';
import { cn } from '@/lib/utils';

const categoryIcons: Record<MenuCategory, React.ElementType> = {
  Drinks: Coffee,
  Snacks: Cookie,
  Meals: UtensilsCrossed,
};

const categories: MenuCategory[] = ['Drinks', 'Snacks', 'Meals'];

export function MenuManager() {
  const { data: menuItems = [], isLoading } = useMenuItems();
  const deleteMenuItem = useDeleteMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | 'All'>('All');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const filteredItems =
    selectedCategory === 'All'
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
  };

  const handleToggleAvailability = (item: MenuItem) => {
    updateMenuItem.mutate({
      id: item.id,
      is_available: !item.is_available,
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[300px] bg-[#F4EDE4]">
        <Loader2 className="w-8 h-8 animate-spin text-[#6F4E37]/50" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-fade-in bg-[#F4EDE4] min-h-screen max-w-[1600px] mx-auto">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 mb-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif italic text-3xl font-black text-[#3A2C2C] tracking-tight">Menu Studio</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6F4E37]/60 mt-0.5">Manage your offerings</p>
          </div>
          <Button 
            onClick={handleAdd} 
            className="rounded-xl h-11 px-6 shadow-[0_8px_20px_rgba(58,44,44,0.15)] bg-[#3A2C2C] text-white hover:bg-[#6F4E37] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 mr-1.5 text-[#FFD6C9]" />
            <span className="font-bold text-xs uppercase tracking-widest">Add Item</span>
          </Button>
        </div>
      </div>

      {/* CATEGORY FILTER */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        <Button
          size="sm"
          onClick={() => setSelectedCategory('All')}
          className={cn(
            "shrink-0 rounded-[1.2rem] h-10 px-5 transition-all font-bold text-xs uppercase tracking-widest",
            selectedCategory === 'All' 
              ? "bg-[#6F4E37] text-white shadow-md" 
              : "bg-white text-[#6F4E37] border border-[#F9E0E3] hover:bg-[#F9E0E3]/50 hover:text-[#3A2C2C]"
          )}
        >
          All Items
        </Button>
        {categories.map((cat) => {
          const Icon = categoryIcons[cat];
          const isActive = selectedCategory === cat;
          return (
            <Button
              key={cat}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "shrink-0 rounded-[1.2rem] h-10 px-4 transition-all font-bold text-xs uppercase tracking-widest",
                isActive 
                  ? "bg-[#6F4E37] text-white shadow-md" 
                  : "bg-white text-[#6F4E37] border border-[#F9E0E3] hover:bg-[#F9E0E3]/50 hover:text-[#3A2C2C]"
              )}
            >
              <Icon className="w-3.5 h-3.5 mr-2 opacity-80" />
              {cat}
            </Button>
          );
        })}
      </div>

      {/* EMPTY STATE */}
      {filteredItems.length === 0 && (
        <Card className="border-dashed border-2 border-[#F9E0E3] bg-white/50 rounded-[2rem] shadow-none">
          <CardContent className="py-16 text-center text-[#6F4E37]">
            <div className="w-16 h-16 bg-[#F9E0E3]/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#F9E0E3]">
              <Plus className="w-8 h-8 text-[#6F4E37]/30" />
            </div>
            <p className="font-bold text-sm text-[#3A2C2C]">Your menu is empty</p>
            <p className="text-[10px] uppercase tracking-[0.2em] mt-2 text-[#6F4E37]/60 font-black">Click 'Add Item' to begin</p>
          </CardContent>
        </Card>
      )}

      {filteredItems.length > 0 && (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block bg-white rounded-[2rem] shadow-[0_10px_30px_rgba(58,44,44,0.04)] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F9E0E3] bg-[#FDF8F7]">
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[#A89699]">Item</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[#A89699]">Category</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[#A89699]">Price</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[#A89699] text-center">Status</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[#A89699] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F9E0E3]/50">
                {filteredItems.map((item) => (
                  <tr 
                    key={item.id} 
                    className={cn(
                      "hover:bg-[#FDF8F7]/50 transition-colors group",
                      !item.is_available && "opacity-60 grayscale-[0.5]"
                    )}
                  >
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#F9E0E3]/30 overflow-hidden shrink-0 border border-[#F9E0E3] flex items-center justify-center">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-[#A89699]" />
                          )}
                        </div>
                        <span className="font-serif italic font-bold text-base text-[#3A2C2C]">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <span className="text-xs font-black text-[#6F4E37]/60 uppercase tracking-widest bg-[#F4EDE4] px-3 py-1 rounded-md">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <span className="font-black text-[#6F4E37]">₹{item.price}</span>
                    </td>
                    <td className="py-3 px-6 text-center">
                      <Switch
                        checked={item.is_available}
                        onCheckedChange={() => handleToggleAvailability(item)}
                        className="data-[state=checked]:bg-[#8ED1B2] data-[state=unchecked]:bg-[#EBE1E3] scale-90"
                      />
                    </td>
                    <td className="py-3 px-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#6F4E37]" onClick={() => handleEdit(item)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => deleteMenuItem.mutate(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD VIEW */}
          <div className="md:hidden space-y-4">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className={cn(
                  'overflow-hidden transition-all duration-300 rounded-[1.8rem] border-none bg-white shadow-sm hover:shadow-md group',
                  !item.is_available && 'opacity-60 grayscale-[0.8] bg-[#F4EDE4]'
                )}
              >
                <CardContent className="p-3 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#F9E0E3]/30 overflow-hidden shrink-0 border border-[#F9E0E3] relative">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-[#A89699]">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-[15px] text-[#3A2C2C] truncate font-serif italic">{item.name}</h3>
                      {!item.is_available && (
                        <Badge className="text-[8px] h-4 uppercase tracking-widest font-black bg-[#3A2C2C] text-white border-none rounded-md px-1.5 py-0">Hidden</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-black text-[#6F4E37]">₹{item.price}</p>
                      <span className="text-[10px] font-bold text-[#F9E0E3] uppercase">•</span>
                      <span className="text-[9px] font-black text-[#6F4E37]/40 uppercase tracking-[0.2em]">{item.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-l border-[#F9E0E3] pl-4 pr-1">
                    <Switch
                      checked={item.is_available}
                      onCheckedChange={() => handleToggleAvailability(item)}
                      className="data-[state=checked]:bg-[#8ED1B2] data-[state=unchecked]:bg-[#EBE1E3] scale-90"
                    />
                    <div className="flex flex-col gap-1 ml-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#3A2C2C]" onClick={() => handleEdit(item)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#6F4E37]/30 hover:text-red-500" onClick={() => deleteMenuItem.mutate(item.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <MenuItemDialog open={dialogOpen} onClose={handleCloseDialog} editItem={editingItem} />
    </div>
  );
}