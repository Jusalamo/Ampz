import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateDistance, parseCheckInURL, getUserLocation } from '@/lib/qr-utils';
import { Event } from '@/lib/types';

export interface CheckInResult {
  success: boolean;
  error?: string;
  message?: string;
  eventId?: string;
  checkInId?: string;
  isWithinGeofence?: boolean;
  distance?: number;
}

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function useCheckIn(userId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user location with permission handling
  const getFastLocation = useCallback((): Promise<GeolocationResult> => {
    return getUserLocation({
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 30000,
    });
  }, []);

  // Enhanced QR code validation that handles all formats
  const validateQRCodeFast = useCallback(async (
    qrData: string
  ): Promise<{ valid: boolean; eventId?: string; event?: Event; error?: string }> => {
    try {
      // First, try to parse as URL
      const parsed = parseCheckInURL(qrData);
      
      if (!parsed || !parsed.eventId) {
        return { valid: false, error: 'Invalid QR code format. Please scan a valid event QR code.' };
      }
      
      const eventId = parsed.eventId;
      
      // Validate event ID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId)) {
        return { valid: false, error: 'Invalid event ID format' };
      }
      
      // FAST database fetch - get essential fields
      const { data: eventData, error: fetchError } = await supabase
        .from('events')
        .select('id, name, latitude, longitude, geofence_radius, is_active, date, time, location')
        .eq('id', eventId)
        .single();
      
      if (fetchError || !eventData) {
        return { valid: false, error: 'Event not found or invalid' };
      }
      
      if (!eventData.is_active) {
        return { valid: false, error: 'This event is no longer active' };
      }
      
      // Check if event date is in the past
      if (eventData.date) {
        const eventDate = new Date(eventData.date);
        if (eventDate < new Date()) {
          return { valid: false, error: 'This event has already ended' };
        }
      }
      
      // Return complete event data
      return {
        valid: true,
        eventId: eventData.id,
        event: {
          id: eventData.id,
          name: eventData.name,
          location: eventData.location,
          coordinates: { lat: eventData.latitude || 0, lng: eventData.longitude || 0 },
          geofenceRadius: eventData.geofence_radius || 50,
          isActive: eventData.is_active,
          date: eventData.date,
          time: eventData.time,
        } as Event,
      };
    } catch (err: any) {
      console.error('QR validation error:', err);
      return { valid: false, error: 'Invalid QR code. Please try again.' };
    }
  }, []);

  // Geofence check with proper error handling
  const checkGeofenceFast = useCallback(async (
    event: Event,
    userLat: number,
    userLng: number
  ): Promise<{ withinGeofence: boolean; distance?: number; error?: string }> => {
    try {
      // If event has no coordinates, skip geofence check
      if (!event.coordinates.lat || !event.coordinates.lng) {
        return { withinGeofence: true };
      }
      
      const distance = calculateDistance(
        userLat,
        userLng,
        event.coordinates.lat,
        event.coordinates.lng
      );
      
      const withinGeofence = distance <= (event.geofenceRadius || 50);
      
      return {
        withinGeofence,
        distance: Math.round(distance),
        error: withinGeofence ? undefined : `You are ${Math.round(distance)}m away from the event location. Please move within ${event.geofenceRadius || 50}m to check in.`
      };
    } catch (err) {
      console.error('Geofence check error:', err);
      return { withinGeofence: false, error: 'Unable to verify location. Please ensure location services are enabled.' };
    }
  }, []);

  // MAIN CHECK-IN FUNCTION - Fixed and simplified
  const processQRCodeScan = useCallback(async (
    qrData: string,
    visibilityMode: 'public' | 'private' = 'public'
  ): Promise<CheckInResult> => {
    if (!userId) {
      return { success: false, error: 'Please log in to check in' };
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Processing QR code:', qrData.substring(0, 100));
      
      // STEP 1: Validate QR code
      const validationResult = await validateQRCodeFast(qrData);
      
      if (!validationResult.valid || !validationResult.event) {
        return { 
          success: false, 
          error: validationResult.error || 'Invalid QR code' 
        };
      }
      
      const event = validationResult.event;
      console.log('Event found:', event.name);
      
      // STEP 2: Check for existing check-in (prevent duplicates)
      const { data: existingCheckIn } = await supabase
        .from('check_ins')
        .select('id, checked_in_at')
        .eq('user_id', userId)
        .eq('event_id', event.id)
        .limit(1);
      
      if (existingCheckIn && existingCheckIn.length > 0) {
        const checkInTime = new Date(existingCheckIn[0].checked_in_at);
        const now = new Date();
        const minutesDiff = (now.getTime() - checkInTime.getTime()) / (1000 * 60);
        
        // If checked in within last 5 minutes, don't allow duplicate
        if (minutesDiff < 5) {
          return {
            success: true,
            message: `Already checked in to ${event.name}`,
            eventId: event.id,
            checkInId: existingCheckIn[0].id
          };
        }
      }
      
      // STEP 3: Get location for geofence check
      let location;
      let geofenceResult = { withinGeofence: true, distance: 0 };
      
      try {
        location = await getFastLocation();
        console.log('Location obtained:', location);
        
        // Check geofence
        geofenceResult = await checkGeofenceFast(event, location.latitude, location.longitude);
        
        if (!geofenceResult.withinGeofence) {
          return {
            success: false,
            error: geofenceResult.error || 'Outside event location',
            eventId: event.id,
            isWithinGeofence: false,
            distance: geofenceResult.distance
          };
        }
      } catch (locationError: any) {
        console.log('Location error (non-fatal):', locationError.message);
        // If location fails, still proceed but note it
      }
      
      // STEP 4: Perform check-in via secure function
      const { data: checkInData, error: checkInError } = await supabase
        .from('check_ins')
        .insert({
          user_id: userId,
          event_id: event.id,
          check_in_latitude: location?.latitude || null,
          check_in_longitude: location?.longitude || null,
          within_geofence: geofenceResult.withinGeofence,
          visibility_mode: visibilityMode,
          verification_method: location ? 'geolocation' : 'qr_scan',
          checked_in_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      
      if (checkInError) {
        console.error('Check-in insert error:', checkInError);
        
        // Handle specific error cases
        if (checkInError.code === '23505') { // Unique violation
          return { 
            success: false, 
            error: 'You have already checked in to this event' 
          };
        }
        
        if (checkInError.message?.includes('within_geofence')) {
          return { 
            success: false, 
            error: 'You must be at the event location to check in',
            eventId: event.id
          };
        }
        
        return { 
          success: false, 
          error: 'Check-in failed. Please try again.' 
        };
      }
      
      // STEP 5: Update attendee count (optimistic)
      try {
        await supabase.rpc('increment_attendee_count', {
          event_id: event.id
        });
      } catch (countError) {
        console.error('Failed to update attendee count:', countError);
        // Non-critical error, continue
      }
      
      return {
        success: true,
        message: `Successfully checked in to ${event.name}!`,
        eventId: event.id,
        checkInId: checkInData?.id,
        isWithinGeofence: geofenceResult.withinGeofence,
        distance: geofenceResult.distance
      };
      
    } catch (err: any) {
      console.error('Check-in process error:', err);
      
      // User-friendly error messages
      let userError = 'Check-in failed. Please try again.';
      
      if (err.message?.includes('Location permission')) {
        userError = 'Location permission denied. Please enable location access to check in.';
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        userError = 'Network error. Please check your internet connection.';
      } else if (err.message?.includes('Event not found')) {
        userError = 'Event not found. Please check the QR code.';
      }
      
      return { success: false, error: userError };
    } finally {
      setIsLoading(false);
    }
  }, [userId, validateQRCodeFast, getFastLocation, checkGeofenceFast]);

  // Direct event check-in (bypasses QR scanning)
  const checkInToEventFast = useCallback(async (
    eventId: string,
    visibilityMode: 'public' | 'private' = 'public'
  ): Promise<CheckInResult> => {
    if (!userId) {
      return { success: false, error: 'Please log in to check in' };
    }

    setIsLoading(true);

    try {
      // Check for existing check-in
      const { data: existingCheckIn } = await supabase
        .from('check_ins')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .limit(1);

      if (existingCheckIn && existingCheckIn.length > 0) {
        return {
          success: true,
          message: 'Already checked in!',
          eventId: eventId
        };
      }

      // Get event details
      const { data: event } = await supabase
        .from('events')
        .select('name, latitude, longitude, geofence_radius')
        .eq('id', eventId)
        .single();
      
      if (!event) {
        return { success: false, error: 'Event not found' };
      }
      
      // Get location if available
      let location;
      let withinGeofence = true;
      
      try {
        location = await getFastLocation();
        
        // Check geofence if event has coordinates
        if (event.latitude && event.longitude) {
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            event.latitude,
            event.longitude
          );
          withinGeofence = distance <= (event.geofence_radius || 50);
          
          if (!withinGeofence) {
            return {
              success: false,
              error: `You are ${Math.round(distance)}m away from the event. Please move closer to check in.`,
              eventId: eventId,
              isWithinGeofence: false,
              distance: Math.round(distance)
            };
          }
        }
      } catch (locationError) {
        console.log('Location unavailable, proceeding without geofence check');
        // Continue without location
      }
      
      // Create check-in
      const { data: checkInData, error: checkInError } = await supabase
        .from('check_ins')
        .insert({
          user_id: userId,
          event_id: eventId,
          check_in_latitude: location?.latitude || null,
          check_in_longitude: location?.longitude || null,
          within_geofence: withinGeofence,
          visibility_mode: visibilityMode,
          verification_method: location ? 'geolocation' : 'direct',
          checked_in_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (checkInError) {
        return { success: false, error: 'Check-in failed. Please try again.' };
      }

      // Update attendee count
      try {
        await supabase.rpc('increment_attendee_count', {
          event_id: eventId
        });
      } catch (countError) {
        console.error('Failed to update count:', countError);
      }

      return {
        success: true,
        message: `Checked in to ${event.name}!`,
        eventId: eventId,
        checkInId: checkInData.id
      };
    } catch (err: any) {
      console.error('Direct check-in error:', err);
      return { success: false, error: 'Check-in failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, [userId, getFastLocation]);

  return {
    isLoading,
    error,
    processQRCodeScan,
    checkInToEventFast,
    validateQRCode: validateQRCodeFast,
    hasCheckedIn: useCallback(async (eventId: string): Promise<boolean> => {
      if (!userId) return false;
      const { data } = await supabase
        .from('check_ins')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .limit(1);
      return !!(data && data.length > 0);
    }, [userId]),
  };
}
