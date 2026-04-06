-- Add payment tracking columns to orders table
ALTER TABLE public.orders
ADD COLUMN payment_method text DEFAULT NULL,
ADD COLUMN payment_status text DEFAULT 'unpaid',
ADD COLUMN include_gst boolean DEFAULT false,
ADD COLUMN gst_amount numeric DEFAULT 0,
ADD COLUMN final_total numeric DEFAULT 0,
ADD COLUMN is_counter_order boolean DEFAULT false;

-- Add check constraint for payment method
ALTER TABLE public.orders
ADD CONSTRAINT valid_payment_method CHECK (payment_method IS NULL OR payment_method IN ('cash', 'upi'));

-- Add check constraint for payment status
ALTER TABLE public.orders
ADD CONSTRAINT valid_payment_status CHECK (payment_status IN ('unpaid', 'paid'));