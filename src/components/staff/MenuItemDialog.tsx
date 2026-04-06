import { useState, useEffect, useMemo } from 'react';
import { useAddMenuItem, useUpdateMenuItem, MenuItem, MenuCategory, useMenuItems } from '@/hooks/useMenuItems';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator
} from '@/components/ui/select';
import { Coffee, IndianRupee, ImageIcon, ListTree, FileText, UploadCloud, X, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client'; 

interface MenuItemDialogProps {
  open: boolean;
  onClose: () => void;
  editItem: MenuItem | null;
}

export function MenuItemDialog({ open, onClose, editItem }: MenuItemDialogProps) {
  const addMenuItem = useAddMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  
  // Fetch existing items to dynamically generate the category list
  const { data: existingItems = [] } = useMenuItems();
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Drinks');
  const [description, setDescription] = useState('');
  const [available, setAvailable] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  
  // NEW STATES for dynamic categories
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Auto-generate categories based on what's already in the database
  const dynamicCategories = useMemo(() => {
    const dbCategories = existingItems.map(item => item.category);
    // Combine defaults with whatever is in the DB, and remove duplicates
    const combined = Array.from(new Set(['Drinks', 'Snacks', 'Meals', ...dbCategories]));
    return combined.filter(Boolean); // remove any empties
  }, [existingItems]);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setPrice(editItem.price.toString());
      setCategory(editItem.category);
      setDescription(editItem.description || '');
      setAvailable(editItem.is_available);
      setImageUrl(editItem.image_url || '');
      setIsAddingNewCategory(false);
    } else {
      setName('');
      setPrice('');
      setCategory('Drinks');
      setDescription('');
      setAvailable(true);
      setImageUrl('');
      setIsAddingNewCategory(false);
      setNewCategoryName('');
    }
  }, [editItem, open]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      setImageUrl(data.publicUrl);
      toast.success('Image uploaded successfully!');
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image', { description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine the final category string
    const finalCategory = isAddingNewCategory ? newCategoryName.trim() : category;

    if (!finalCategory) {
      toast.error("Category is required");
      return;
    }

    const itemData = {
      name: name.trim(),
      price: parseFloat(price) || 0,
      // FIX: Added 'as MenuCategory' to force TypeScript to accept custom words
      category: finalCategory as MenuCategory, 
      description: description.trim() || undefined,
      is_available: available,
      image_url: imageUrl.trim() || undefined,
    };

    if (editItem) {
      updateMenuItem.mutate({ id: editItem.id, ...itemData }, {
        onSuccess: () => onClose(),
      });
    } else {
      addMenuItem.mutate(itemData, {
        onSuccess: () => onClose(),
      });
    }
  };

  const isLoading = addMenuItem.isPending || updateMenuItem.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto p-0 rounded-[2rem] border-none bg-white overflow-hidden shadow-[0_20px_60px_rgba(58,44,44,0.15)] max-h-[90vh] flex flex-col">
        
        <DialogHeader className="bg-[#F4EDE4] p-6 border-b border-[#F9E0E3] shrink-0">
          <DialogTitle className="font-serif text-2xl font-black italic text-[#3A2C2C] flex items-center gap-2">
            {editItem ? 'Edit Menu Item' : 'Add New Item'}
          </DialogTitle>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6F4E37]/60 text-left mt-1">
            {editItem ? 'Update details below' : 'Create a new offering'}
          </p>
        </DialogHeader>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="menu-item-form" onSubmit={handleSubmit} className="space-y-5">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-[#6F4E37] flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5" /> Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Latte"
                  className="h-12 rounded-xl border-[#EBE1E3] bg-[#F7F1F2] focus-visible:ring-[#FFD6C9] font-bold text-[#3A2C2C] px-4"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-[10px] font-black uppercase tracking-widest text-[#6F4E37] flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5" /> Price
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="h-12 rounded-xl border-[#EBE1E3] bg-[#F7F1F2] focus-visible:ring-[#FFD6C9] font-black text-lg text-[#3A2C2C] px-4"
                  required
                />
              </div>
            </div>

            {/* --- SMART CATEGORY SELECTOR --- */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-[#6F4E37] flex items-center justify-between">
                <span className="flex items-center gap-1.5"><ListTree className="w-3.5 h-3.5" /> Category</span>
                {isAddingNewCategory && (
                  <button type="button" onClick={() => setIsAddingNewCategory(false)} className="text-[#9D4E5C] hover:underline normal-case tracking-normal">
                    Cancel Custom
                  </button>
                )}
              </Label>
              
              {isAddingNewCategory ? (
                <Input
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Desserts, Merch, Specials"
                  className="h-12 rounded-xl border-[#6F4E37] bg-white focus-visible:ring-[#FFD6C9] font-bold text-[#3A2C2C] px-4 shadow-[0_0_15px_rgba(111,78,55,0.1)]"
                  required
                />
              ) : (
                <Select value={category} onValueChange={(v) => {
                  if (v === 'ADD_NEW') {
                    setIsAddingNewCategory(true);
                  } else {
                    setCategory(v);
                  }
                }}>
                  <SelectTrigger className="h-12 rounded-xl border-[#EBE1E3] bg-[#F7F1F2] focus-visible:ring-[#FFD6C9] font-bold text-[#3A2C2C] px-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#EBE1E3] shadow-lg">
                    {dynamicCategories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="font-bold py-3 cursor-pointer focus:bg-[#F9E0E3]">
                        {cat}
                      </SelectItem>
                    ))}
                    <SelectSeparator className="bg-[#EBE1E3]" />
                    <SelectItem value="ADD_NEW" className="font-black text-[#6F4E37] py-3 cursor-pointer focus:bg-[#F9E0E3]">
                      <span className="flex items-center gap-2"><Plus className="w-4 h-4"/> Add New Category...</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-[#6F4E37] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Item Photo
              </Label>
              
              <div className="relative">
                {imageUrl ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border-2 border-[#EBE1E3] group bg-[#F7F1F2]">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-[#3A2C2C]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => setImageUrl('')} 
                        className="rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-xl"
                      >
                        <X className="w-4 h-4 mr-1"/> Remove Photo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-[#EBE1E3] bg-[#F7F1F2] hover:bg-[#F9E0E3]/50 hover:border-[#FFD6C9] transition-all cursor-pointer group">
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[#FFD6C9] mb-2" />
                        <span className="text-[10px] font-bold text-[#6F4E37] uppercase tracking-widest">Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 text-[#6F4E37] mb-2 opacity-50 group-hover:scale-110 transition-transform duration-300 group-hover:text-[#FFD6C9]" />
                        <span className="text-xs font-bold text-[#3A2C2C]">Click to upload image</span>
                        <span className="text-[10px] font-bold text-[#A89699] uppercase tracking-widest mt-1">JPEG, PNG, WEBP</span>
                      </>
                    )}
                    <input 
                      id="image-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-[#6F4E37] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Description <span className="text-[#A89699] font-normal lowercase tracking-normal text-xs ml-1">(Optional)</span>
              </Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of the item..."
                className="w-full min-h-[80px] p-4 text-sm rounded-xl border-[#EBE1E3] bg-[#F7F1F2] outline-none focus:ring-2 focus:ring-[#FFD6C9] font-medium leading-relaxed resize-none text-[#3A2C2C]"
              />
            </div>

            <div className="flex items-center justify-between bg-[#F4EDE4] p-4 rounded-xl border border-[#F9E0E3]">
              <div className="space-y-0.5">
                <Label htmlFor="available" className="font-bold text-sm text-[#3A2C2C]">In Stock</Label>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#6F4E37]/60">Customers can order this</p>
              </div>
              <Switch
                id="available"
                checked={available}
                onCheckedChange={setAvailable}
                className="data-[state=checked]:bg-[#8ED1B2]"
              />
            </div>

          </form>
        </div>
        
        <div className="p-4 border-t border-[#F9E0E3] bg-white shrink-0">
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-[0.8] h-14 rounded-xl font-bold border-[#EBE1E3] text-[#6F4E37] hover:bg-[#F7F1F2]" 
              disabled={isLoading || isUploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              form="menu-item-form"
              className="flex-[2] h-14 rounded-xl font-black uppercase tracking-widest text-sm bg-[#3A2C2C] text-white hover:bg-[#6F4E37] shadow-[0_10px_30px_rgba(58,44,44,0.15)] active:scale-95 transition-all" 
              disabled={isLoading || isUploading}
            >
              {isLoading ? 'Saving...' : editItem ? 'Update Item' : 'Create Item'}
            </Button>
          </div>
        </div>
        
      </DialogContent>
    </Dialog>
  );
}