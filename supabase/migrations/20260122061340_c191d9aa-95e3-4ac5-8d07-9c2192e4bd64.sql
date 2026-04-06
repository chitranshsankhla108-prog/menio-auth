-- Create a cafe-aware role check function
CREATE OR REPLACE FUNCTION public.has_role_for_cafe(_user_id uuid, _cafe_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND cafe_id = _cafe_id
      AND role = _role
  )
$$;

-- Drop existing menu_items policies that lack cafe-specific enforcement
DROP POLICY IF EXISTS "Staff can insert menu items for their cafe" ON public.menu_items;
DROP POLICY IF EXISTS "Staff can update menu items for their cafe" ON public.menu_items;
DROP POLICY IF EXISTS "Staff can delete menu items for their cafe" ON public.menu_items;

-- Create new cafe-scoped INSERT policy
CREATE POLICY "Staff can insert menu items for their cafe" ON public.menu_items
  FOR INSERT
  WITH CHECK (
    cafe_id IS NOT NULL AND (
      has_role_for_cafe(auth.uid(), cafe_id, 'admin') OR
      has_role_for_cafe(auth.uid(), cafe_id, 'staff')
    )
  );

-- Create new cafe-scoped UPDATE policy
CREATE POLICY "Staff can update menu items for their cafe" ON public.menu_items
  FOR UPDATE
  USING (
    cafe_id IS NOT NULL AND (
      has_role_for_cafe(auth.uid(), cafe_id, 'admin') OR
      has_role_for_cafe(auth.uid(), cafe_id, 'staff')
    )
  )
  WITH CHECK (
    cafe_id IS NOT NULL AND (
      has_role_for_cafe(auth.uid(), cafe_id, 'admin') OR
      has_role_for_cafe(auth.uid(), cafe_id, 'staff')
    )
  );

-- Create new cafe-scoped DELETE policy
CREATE POLICY "Staff can delete menu items for their cafe" ON public.menu_items
  FOR DELETE
  USING (
    cafe_id IS NOT NULL AND (
      has_role_for_cafe(auth.uid(), cafe_id, 'admin') OR
      has_role_for_cafe(auth.uid(), cafe_id, 'staff')
    )
  );