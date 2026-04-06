-- Fix: Remove the overly permissive 'Anyone can manage menu items' policy
-- Keep the 'Anyone can view menu items' policy for public read access

DROP POLICY IF EXISTS "Anyone can manage menu items" ON public.menu_items;

-- Create staff-only policies for INSERT, UPDATE, DELETE operations
CREATE POLICY "Staff can insert menu items"
ON public.menu_items
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff can update menu items"
ON public.menu_items
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff can delete menu items"
ON public.menu_items
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Add database CHECK constraints for additional defense layer
ALTER TABLE public.menu_items 
ADD CONSTRAINT menu_items_name_length CHECK (char_length(name) <= 100),
ADD CONSTRAINT menu_items_description_length CHECK (description IS NULL OR char_length(description) <= 500),
ADD CONSTRAINT menu_items_price_positive CHECK (price > 0);

-- Add constraints to feedback table
ALTER TABLE public.feedback
ADD CONSTRAINT feedback_name_length CHECK (name IS NULL OR char_length(name) <= 100),
ADD CONSTRAINT feedback_email_length CHECK (email IS NULL OR char_length(email) <= 255),
ADD CONSTRAINT feedback_comment_length CHECK (char_length(comment) <= 1000),
ADD CONSTRAINT feedback_rating_range CHECK (rating >= 1 AND rating <= 5);

-- Add constraints to orders table
ALTER TABLE public.orders
ADD CONSTRAINT orders_customer_name_length CHECK (customer_name IS NULL OR char_length(customer_name) <= 100),
ADD CONSTRAINT orders_total_price_positive CHECK (total_price >= 0);