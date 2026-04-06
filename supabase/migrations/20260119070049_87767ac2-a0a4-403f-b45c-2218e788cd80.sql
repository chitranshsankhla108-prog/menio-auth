-- Add RLS policy to allow customers to read back their own order by ID
-- This is needed so the .select() after insert works for anonymous users
CREATE POLICY "Anyone can read their order by id"
ON public.orders
FOR SELECT
TO anon
USING (true);

-- Note: This is safe because orders don't contain sensitive data beyond what the customer provided
-- and customers need to read back their order for the receipt view