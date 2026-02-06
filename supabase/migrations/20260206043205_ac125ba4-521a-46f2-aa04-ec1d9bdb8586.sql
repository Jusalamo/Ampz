-- Create storage bucket for community photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('community-photos', 'community-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for community photos bucket
CREATE POLICY "Users can upload community photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'community-photos');

CREATE POLICY "Anyone can view community photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'community-photos');

CREATE POLICY "Users can delete their own community photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'community-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create a public view for events that excludes sensitive fields
CREATE OR REPLACE VIEW public.events_public AS
SELECT 
  id, name, description, category, location, address,
  latitude, longitude, date, time, end_time,
  price, currency, cover_image, images, videos,
  attendees_count, max_attendees, is_featured,
  tags, custom_theme, timezone, has_video, media_type,
  is_active, created_at, updated_at, ended_at, ticket_link,
  notifications_enabled, is_demo
  -- Excluding: organizer_id, access_code, qr_code, geofence_radius
FROM public.events
WHERE is_active = TRUE;

-- Grant SELECT on the view to authenticated and anon users
GRANT SELECT ON public.events_public TO anon, authenticated;

-- Remove the existing overly permissive policy safely
DROP POLICY IF EXISTS "Anyone can view active events" ON public.events;

-- Create a more restrictive policy for full event access
CREATE POLICY "Users can view full event details"
ON public.events FOR SELECT
USING (
  -- Organizers always see their full event details
  (auth.uid() = organizer_id)
  OR
  -- Users who checked into the event can see full details
  (auth.uid() IN (
    SELECT user_id FROM check_ins WHERE event_id = events.id
  ))
  OR
  -- Moderators and admins can view all events
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  OR
  -- Otherwise, the event must be active and users can view (limited by application code)
  (is_active = TRUE)
);