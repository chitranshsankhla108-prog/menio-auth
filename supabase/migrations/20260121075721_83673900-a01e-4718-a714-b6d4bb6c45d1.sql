-- Remove the overly permissive anonymous read policy for orders
-- The receipt page uses data from the order creation response (location.state),
-- not from a separate database query, so this policy is not needed.
-- Staff already have their own SELECT policy for viewing all orders.

DROP POLICY IF EXISTS "Anyone can read their order by id" ON public.orders;