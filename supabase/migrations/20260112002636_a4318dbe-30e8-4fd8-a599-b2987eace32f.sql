-- Remove unused is_within_geofence function that could expose inactive event locations
-- This function is not used anywhere in the application (client uses qr-utils.ts instead)
-- and bypasses RLS by querying events directly without checking is_active status

DROP FUNCTION IF EXISTS public.is_within_geofence(UUID, DECIMAL, DECIMAL);
DROP FUNCTION IF EXISTS public.is_within_geofence(UUID, NUMERIC, NUMERIC);