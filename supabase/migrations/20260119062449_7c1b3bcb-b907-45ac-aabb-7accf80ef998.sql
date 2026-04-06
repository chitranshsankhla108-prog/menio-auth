-- Drop and recreate the view with security_invoker enabled
DROP VIEW IF EXISTS public.feedback_public;

CREATE VIEW public.feedback_public
WITH (security_invoker = on)
AS SELECT 
  id,
  name,
  comment,
  rating,
  created_at
FROM public.feedback;