-- Fix the security definer view by using security_invoker
DROP VIEW IF EXISTS public.events_public;

CREATE VIEW public.events_public 
WITH (security_invoker = on) AS
SELECT 
  id, name, description, category, location, address,
  latitude, longitude, date, time, end_time,
  price, currency, cover_image, images, videos,
  attendees_count, max_attendees, is_featured,
  tags, custom_theme, timezone, has_video, media_type,
  is_active, created_at, updated_at, ended_at, ticket_link,
  notifications_enabled, is_demo
FROM public.events
WHERE is_active = TRUE;

GRANT SELECT ON public.events_public TO anon, authenticated;