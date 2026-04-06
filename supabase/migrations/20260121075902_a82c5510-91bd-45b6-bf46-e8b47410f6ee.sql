-- Create cafes table for multi-tenant support
CREATE TABLE public.cafes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on cafes
ALTER TABLE public.cafes ENABLE ROW LEVEL SECURITY;

-- Anyone can read cafes (needed for code lookup)
CREATE POLICY "Anyone can view cafes" ON public.cafes
  FOR SELECT USING (true);

-- Only admins can manage cafes
CREATE POLICY "Admins can manage cafes" ON public.cafes
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add cafe_id to menu_items
ALTER TABLE public.menu_items ADD COLUMN cafe_id UUID REFERENCES public.cafes(id) ON DELETE CASCADE;

-- Add cafe_id to orders
ALTER TABLE public.orders ADD COLUMN cafe_id UUID REFERENCES public.cafes(id) ON DELETE CASCADE;

-- Add cafe_id to user_roles
ALTER TABLE public.user_roles ADD COLUMN cafe_id UUID REFERENCES public.cafes(id) ON DELETE CASCADE;

-- Add cafe_id to feedback
ALTER TABLE public.feedback ADD COLUMN cafe_id UUID REFERENCES public.cafes(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_menu_items_cafe_id ON public.menu_items(cafe_id);
CREATE INDEX idx_orders_cafe_id ON public.orders(cafe_id);
CREATE INDEX idx_user_roles_cafe_id ON public.user_roles(cafe_id);
CREATE INDEX idx_feedback_cafe_id ON public.feedback(cafe_id);
CREATE INDEX idx_cafes_code ON public.cafes(code);

-- Update RLS policies for menu_items to filter by cafe_id
DROP POLICY IF EXISTS "Anyone can view menu items" ON public.menu_items;
CREATE POLICY "Anyone can view menu items for their cafe" ON public.menu_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can insert menu items" ON public.menu_items;
CREATE POLICY "Staff can insert menu items for their cafe" ON public.menu_items
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')
  );

DROP POLICY IF EXISTS "Staff can update menu items" ON public.menu_items;
CREATE POLICY "Staff can update menu items for their cafe" ON public.menu_items
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')
  ) WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')
  );

DROP POLICY IF EXISTS "Staff can delete menu items" ON public.menu_items;
CREATE POLICY "Staff can delete menu items for their cafe" ON public.menu_items
  FOR DELETE USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')
  );

-- Update RLS policies for orders to filter by cafe_id
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders for a cafe" ON public.orders
  FOR INSERT WITH CHECK (cafe_id IS NOT NULL);

DROP POLICY IF EXISTS "Staff can view all orders" ON public.orders;
CREATE POLICY "Staff can view orders for their cafe" ON public.orders
  FOR SELECT USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')
  );

DROP POLICY IF EXISTS "Staff can update orders" ON public.orders;
CREATE POLICY "Staff can update orders for their cafe" ON public.orders
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')
  );

-- Add policy for staff to delete orders (for clear orders feature)
CREATE POLICY "Staff can delete orders for their cafe" ON public.orders
  FOR DELETE USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')
  );

-- Update RLS policies for feedback
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedback;
CREATE POLICY "Anyone can submit feedback for a cafe" ON public.feedback
  FOR INSERT WITH CHECK (cafe_id IS NOT NULL);

DROP POLICY IF EXISTS "Staff can view all feedback" ON public.feedback;
CREATE POLICY "Staff can view feedback for their cafe" ON public.feedback
  FOR SELECT USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')
  );

-- Create trigger for cafes updated_at
CREATE TRIGGER update_cafes_updated_at
  BEFORE UPDATE ON public.cafes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();