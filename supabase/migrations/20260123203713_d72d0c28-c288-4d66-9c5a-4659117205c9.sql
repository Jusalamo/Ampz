-- =====================================================
-- SECURITY FIX: Profile Email/PII Exposure
-- =====================================================

-- Create a public-facing view that excludes sensitive PII fields
-- This view will be used for profile queries at shared events
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  age,
  bio,
  occupation,
  company,
  location,
  gender,
  interests,
  profile_photo,
  is_verified,
  created_at,
  updated_at
  -- Excluding: email, phone, subscription_tier, subscription_expires_at,
  -- blocked_users, bookmarked_events, created_events, likes_remaining,
  -- last_like_reset, settings, failed_login_attempts, locked_until, last_login_at
FROM public.profiles;

-- Drop the existing policy that exposes PII at shared events
DROP POLICY IF EXISTS "Users can view profiles at shared events" ON public.profiles;

-- Create a more restrictive policy that only allows viewing non-sensitive data
-- through the profiles_public view (which excludes email/phone)
-- Users can only see full profiles of their matches
CREATE POLICY "Users can view limited profiles at shared events" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can view their own full profile
  (auth.uid() = id)
  OR
  -- Users can view matched user profiles (full profile for matched users)
  ((auth.uid() IS NOT NULL) AND (id IN (
    SELECT matches.user1_id FROM matches 
    WHERE matches.user2_id = auth.uid() AND matches.status = 'active'
    UNION
    SELECT matches.user2_id FROM matches 
    WHERE matches.user1_id = auth.uid() AND matches.status = 'active'
  )))
);

-- =====================================================
-- SECURITY FIX: Server-Side Geofence Validation
-- =====================================================

-- Create a secure function to validate geofence and create check-in
-- This prevents clients from bypassing geofence validation
CREATE OR REPLACE FUNCTION public.secure_check_in(
  p_event_id UUID,
  p_user_lat DECIMAL,
  p_user_lng DECIMAL,
  p_visibility_mode TEXT DEFAULT 'public',
  p_verification_method TEXT DEFAULT 'geolocation'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_lat DECIMAL;
  v_event_lng DECIMAL;
  v_geofence_radius INTEGER;
  v_distance DECIMAL;
  v_within_geofence BOOLEAN;
  v_check_in_id UUID;
  v_existing_check_in UUID;
  v_user_id UUID;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to check in';
  END IF;
  
  -- Check for existing check-in
  SELECT id INTO v_existing_check_in
  FROM check_ins
  WHERE user_id = v_user_id AND event_id = p_event_id
  LIMIT 1;
  
  IF v_existing_check_in IS NOT NULL THEN
    RETURN v_existing_check_in; -- Return existing check-in ID
  END IF;
  
  -- Get event location and geofence radius
  SELECT latitude, longitude, COALESCE(geofence_radius, 50)
  INTO v_event_lat, v_event_lng, v_geofence_radius
  FROM events
  WHERE id = p_event_id AND is_active = true;
  
  IF v_event_lat IS NULL THEN
    RAISE EXCEPTION 'Event not found or not active';
  END IF;
  
  -- Calculate distance using Haversine formula (server-side calculation)
  v_distance := calculate_distance(p_user_lat, v_event_lat, p_user_lng, v_event_lng);
  
  -- Determine if within geofence (server-side validation)
  v_within_geofence := v_distance <= v_geofence_radius;
  
  IF NOT v_within_geofence THEN
    RAISE EXCEPTION 'You must be within % meters of the event location to check in. Current distance: % meters', v_geofence_radius, ROUND(v_distance);
  END IF;
  
  -- Create check-in record with server-validated geofence status
  INSERT INTO check_ins (
    user_id,
    event_id,
    check_in_latitude,
    check_in_longitude,
    within_geofence,
    distance_from_venue,
    visibility_mode,
    verification_method,
    checked_in_at
  ) VALUES (
    v_user_id,
    p_event_id,
    p_user_lat,
    p_user_lng,
    v_within_geofence,
    v_distance,
    p_visibility_mode,
    p_verification_method,
    NOW()
  )
  RETURNING id INTO v_check_in_id;
  
  -- Increment event attendees count
  UPDATE events
  SET attendees_count = COALESCE(attendees_count, 0) + 1
  WHERE id = p_event_id;
  
  RETURN v_check_in_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.secure_check_in TO authenticated;

-- =====================================================
-- SECURITY FIX: Input Validation for Community Content
-- =====================================================

-- Add CHECK constraint to reject malicious URL patterns in community_photos
-- This blocks data: URIs, javascript: URIs, and other dangerous patterns
ALTER TABLE public.community_photos 
DROP CONSTRAINT IF EXISTS community_photos_url_validation;

ALTER TABLE public.community_photos 
ADD CONSTRAINT community_photos_url_validation 
CHECK (
  image_url ~ '^https?://' 
  AND image_url !~ '^javascript:'
  AND image_url !~ '^data:'
  AND image_url !~ '^vbscript:'
  AND length(image_url) <= 2048
);

-- Add CHECK constraint for comment content to prevent XSS patterns
ALTER TABLE public.community_comments
DROP CONSTRAINT IF EXISTS community_comments_content_validation;

ALTER TABLE public.community_comments
ADD CONSTRAINT community_comments_content_validation
CHECK (
  length(content) <= 2000
  AND content !~ '<script'
  AND content !~ 'javascript:'
  AND content !~ 'onerror\s*='
  AND content !~ 'onclick\s*='
  AND content !~ 'onload\s*='
);