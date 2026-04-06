-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Anyone can create orders for a cafe" ON public.orders;

-- Create a PERMISSIVE INSERT policy that allows anonymous users to create orders
CREATE POLICY "Anyone can create orders for a cafe"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (cafe_id IS NOT NULL);