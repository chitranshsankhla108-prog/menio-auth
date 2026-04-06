
-- =============================================
-- Drop overly permissive policies on menu_items
-- (Proper cafe-scoped staff policies already exist)
-- =============================================
DROP POLICY IF EXISTS "Allow inserts" ON public.menu_items;
DROP POLICY IF EXISTS "Allow deletes" ON public.menu_items;
DROP POLICY IF EXISTS "Full Menu Access" ON public.menu_items;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.menu_items;
DROP POLICY IF EXISTS "Enable update for all users" ON public.menu_items;

-- =============================================
-- Drop redundant overly permissive policies on feedback
-- (Keep "Anyone can submit feedback for a cafe" which checks cafe_id IS NOT NULL)
-- =============================================
DROP POLICY IF EXISTS "Allow anonymous insert on feedback" ON public.feedback;
DROP POLICY IF EXISTS "Allow anyone to submit feedback" ON public.feedback;
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.feedback;

-- =============================================
-- Drop redundant overly permissive policies on orders
-- (Keep "Anyone can create orders for a cafe" which checks cafe_id IS NOT NULL)
-- =============================================
DROP POLICY IF EXISTS "Enable insert for all users" ON public.orders;
DROP POLICY IF EXISTS "Allow anonymous to insert orders" ON public.orders;
