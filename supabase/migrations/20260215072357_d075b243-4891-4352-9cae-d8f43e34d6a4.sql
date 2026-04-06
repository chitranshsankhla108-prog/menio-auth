
-- Drop existing overly permissive staff policies on orders
DROP POLICY IF EXISTS "Staff can view orders for their cafe" ON public.orders;
DROP POLICY IF EXISTS "Staff can update orders for their cafe" ON public.orders;
DROP POLICY IF EXISTS "Staff can delete orders for their cafe" ON public.orders;
DROP POLICY IF EXISTS "Full Order Access" ON public.orders;
DROP POLICY IF EXISTS "Allow staff to manage orders for their cafe" ON public.orders;

-- Create cafe-scoped SELECT policy for staff
CREATE POLICY "Staff can view orders for their cafe" ON public.orders
  FOR SELECT
  USING (
    cafe_id IS NOT NULL AND (
      has_role_for_cafe(auth.uid(), cafe_id, 'admin') OR
      has_role_for_cafe(auth.uid(), cafe_id, 'staff')
    )
  );

-- Create cafe-scoped UPDATE policy for staff
CREATE POLICY "Staff can update orders for their cafe" ON public.orders
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

-- Create cafe-scoped DELETE policy for staff
CREATE POLICY "Staff can delete orders for their cafe" ON public.orders
  FOR DELETE
  USING (
    cafe_id IS NOT NULL AND (
      has_role_for_cafe(auth.uid(), cafe_id, 'admin') OR
      has_role_for_cafe(auth.uid(), cafe_id, 'staff')
    )
  );
