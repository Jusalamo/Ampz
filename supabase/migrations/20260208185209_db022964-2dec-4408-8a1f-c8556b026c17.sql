CREATE OR REPLACE FUNCTION public.secure_check_in(p_event_id uuid, p_user_lat numeric, p_user_lng numeric, p_visibility_mode text DEFAULT 'public'::text, p_verification_method text DEFAULT 'qr_scan'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to check in';
  END IF;
  
  SELECT id INTO v_existing_check_in
  FROM check_ins
  WHERE user_id = v_user_id AND event_id = p_event_id
  LIMIT 1;
  
  IF v_existing_check_in IS NOT NULL THEN
    RETURN v_existing_check_in;
  END IF;
  
  SELECT latitude, longitude, COALESCE(geofence_radius, 50)
  INTO v_event_lat, v_event_lng, v_geofence_radius
  FROM events
  WHERE id = p_event_id AND is_active = true;
  
  IF v_event_lat IS NULL THEN
    RAISE EXCEPTION 'Event not found or not active';
  END IF;
  
  v_distance := calculate_distance(p_user_lat, v_event_lat, p_user_lng, v_event_lng);
  v_within_geofence := v_distance <= v_geofence_radius;
  
  IF NOT v_within_geofence THEN
    RAISE EXCEPTION 'You must be within % meters of the event location to check in. Current distance: % meters', v_geofence_radius, ROUND(v_distance);
  END IF;
  
  INSERT INTO check_ins (
    user_id, event_id, check_in_latitude, check_in_longitude,
    within_geofence, distance_from_venue, visibility_mode,
    verification_method, checked_in_at
  ) VALUES (
    v_user_id, p_event_id, p_user_lat, p_user_lng,
    v_within_geofence, v_distance, p_visibility_mode,
    p_verification_method, NOW()
  )
  RETURNING id INTO v_check_in_id;
  
  UPDATE events
  SET attendees_count = COALESCE(attendees_count, 0) + 1
  WHERE id = p_event_id;
  
  RETURN v_check_in_id;
END;
$function$;