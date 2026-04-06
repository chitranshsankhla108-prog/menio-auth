
-- Add order_number column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number text;

-- Create a function to generate the next JOD-XX order number for today per cafe
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  today_count integer;
BEGIN
  -- Count today's orders for this cafe (using IST timezone)
  SELECT COUNT(*) INTO today_count
  FROM public.orders
  WHERE cafe_id = NEW.cafe_id
    AND created_at::date = (now() AT TIME ZONE 'Asia/Kolkata')::date
    AND id != NEW.id;

  NEW.order_number := 'JOD-' || LPAD((today_count + 1)::text, 2, '0');
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate order_number on insert
DROP TRIGGER IF EXISTS set_order_number ON public.orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_order_number();
