import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateDistance, parseCheckInURL, getUserLocation } from '@/lib/qr-utils';
import { Event } from '@/lib/types';

export interface CheckInResult {
  success: boolean;
  error?: string;
  errorType?: 'event_ended' | 'event_not_started' | 'outside_geofence' | 'location_denied' | 'already_checked_in' | 'network_error' | 'not_found' | 'not_active' | 'auth_required' | 'unknown';
  message?: string;
  eventId?: string;
  checkInId?: string;
  isWithinGeofence?: boolean;
  distance?: number;
  geofenceRadius?: number;
  eventName?: string;
  eventLocation?: string;
}

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface GeofencePreviewResult {
  withinGeofence: boolean;
  distance: number;
  geofenceRadius: number;
}

export function useCheckIn(userId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user location with permission handling - FAST
  const getFastLocation = useCallback((): Promise<GeolocationResult> => {
    return new Promise((resolve, reject) => {
      // First try cached position (instant)
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
          },
          (error) => {
            // Fall back to high accuracy if cached fails
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy
                });
              },
              (err) => {
                if (err.code === 1) {
                  reject(new Error('Location permission denied. Please enable location access in your browser settings.'));
                } else if (err.code === 2) {
                  reject(new Error('Unable to determine your location. Please check your GPS settings.'));
                } else if (err.code === 3) {
                  reject(new Error('Location request timed out. Please try again.'));
                } else {
                  reject(new Error('Location unavailable. Please try again.'));
                }
              },
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
          },
          { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
        );
      } else {
        reject(new Error('Geolocation not supported by your browser.'));
      }
    });
  }, []);

  // Pre-flight geofence check - get distance before attempting check-in
  const preflightGeofenceCheck = useCallback(async (
    eventId: string
  ): Promise<{ success: boolean; distance?: number; geofenceRadius?: number; eventName?: string; eventLocation?: string; error?: string }> => {
    try {
      // Get event details
      const { data: eventData, error: fetchError } = await supabase
        .from('events')
        .select('id, name, latitude, longitude, geofence_radius, location')
        .eq('id', eventId)
        .single();
      
      if (fetchError || !eventData) {
        return { success: false, error: 'Event not found' };
      }

      // Get user location
      const location = await getFastLocation();
      
      // Calculate distance
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        eventData.latitude || 0,
        eventData.longitude || 0
      );

      const geofenceRadius = eventData.geofence_radius || 50;
      
      return {
        success: distance <= geofenceRadius,
        distance: Math.round(distance),
        geofenceRadius,
        eventName: eventData.name,
        eventLocation: eventData.location
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [getFastLocation]);

  // Enhanced QR code validation that handles all formats
  const validateQRCodeFast = useCallback(async (
    qrData: string
  ): Promise<{ valid: boolean; eventId?: string; event?: Event; error?: string; errorType?: CheckInResult['errorType'] }> => {
    try {
      // First, try to parse as URL
      const parsed = parseCheckInURL(qrData);
      
      if (!parsed || !parsed.eventId) {
        return { valid: false, error: 'Invalid QR code format. Please scan a valid event QR code.', errorType: 'unknown' };
      }
      
      const eventId = parsed.eventId;
      
      // Validate event ID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId)) {
        return { valid: false, error: 'Invalid event ID format', errorType: 'unknown' };
      }
      
      // FAST database fetch - get essential fields including ended_at
      const { data: eventData, error: fetchError } = await supabase
        .from('events')
        .select('id, name, latitude, longitude, geofence_radius, is_active, date, time, end_time, ended_at, location')
        .eq('id', eventId)
        .single();
      
      if (fetchError || !eventData) {
        return { valid: false, error: 'This event doesn\'t exist. Please check the QR code.', errorType: 'not_found' };
      }
      
      if (!eventData.is_active) {
        return { valid: false, error: 'This event is no longer active.', errorType: 'not_active' };
      }

      // Check if event has ended (using ended_at timestamp)
      if (eventData.ended_at) {
        return { valid: false, error: 'This event has ended. Check-in is no longer available.', errorType: 'event_ended' };
      }
      
      // Check event date - allow check-in on the event day and future
      if (eventData.date) {
        const eventDate = new Date(eventData.date);
        const today = new Date();
        
        // Reset both to start of day for comparison
        eventDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        
        if (eventDate < today) {
          return { valid: false, error: 'This event has already passed.', errorType: 'event_ended' };
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
      return { valid: false, error: 'Unable to validate QR code. Please check your connection and try again.', errorType: 'network_error' };
    }
  }, []);

  // Client-side geofence preview (for UI feedback only - actual validation on server)
  const checkGeofencePreview = useCallback((
    event: Event,
    userLat: number,
    userLng: number
  ): { withinGeofence: boolean; distance: number } => {
    // If event has no coordinates, assume within geofence
    if (!event.coordinates.lat || !event.coordinates.lng) {
      return { withinGeofence: true, distance: 0 };
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
      distance: Math.round(distance)
    };
  }, []);

  // MAIN CHECK-IN FUNCTION - Uses secure server-side RPC
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
      let location: GeolocationResult;
      
      try {
        location = await getFastLocation();
        console.log('Location obtained:', location);
      } catch (locationError: any) {
        console.log('Location error:', locationError.message);
        return {
          success: false,
          error: 'Location permission denied. Please enable location access to check in.',
          errorType: 'location_denied'
        };
      }
      
      // STEP 4: Perform SECURE check-in via server-side RPC
      // This validates geofence on the server to prevent client-side bypass
      const { data: checkInId, error: checkInError } = await supabase.rpc('secure_check_in', {
        p_event_id: event.id,
        p_user_lat: location.latitude,
        p_user_lng: location.longitude,
        p_visibility_mode: visibilityMode,
        p_verification_method: 'geolocation'
      });
      
      if (checkInError) {
        console.error('Secure check-in error:', checkInError);
        
        // Parse server error messages with enhanced details
        const errorMessage = checkInError.message || '';
        
        if (errorMessage.includes('already checked in') || errorMessage.includes('already exists')) {
          return { 
            success: true, 
            message: `You're already checked in to ${event.name}!`,
            eventId: event.id,
            errorType: 'already_checked_in'
          };
        }
        
        if (errorMessage.includes('within') && errorMessage.includes('meters')) {
          // Extract distance and radius from error message
          const distanceMatch = errorMessage.match(/Current distance: (\d+)/);
          const radiusMatch = errorMessage.match(/within (\d+) meters/);
          const distance = distanceMatch ? parseInt(distanceMatch[1]) : undefined;
          const radius = radiusMatch ? parseInt(radiusMatch[1]) : event.geofenceRadius;
          
          return { 
            success: false, 
            error: `You're ${distance || 'too far'}m from ${event.name}. Move within ${radius}m to check in.`,
            errorType: 'outside_geofence',
            eventId: event.id,
            eventName: event.name,
            eventLocation: event.location,
            isWithinGeofence: false,
            distance,
            geofenceRadius: radius
          };
        }
        
        if (errorMessage.includes('authenticated')) {
          return { 
            success: false, 
            error: 'Please log in to check in.',
            errorType: 'auth_required'
          };
        }
        
        if (errorMessage.includes('not found') || errorMessage.includes('not active')) {
          return { 
            success: false, 
            error: 'This event is no longer available.',
            errorType: 'not_active'
          };
        }
        
        return { 
          success: false, 
          error: 'Check-in failed. Please try again.',
          errorType: 'unknown'
        };
      }
      
      // Calculate final distance for display
      const finalDistance = calculateDistance(
        location.latitude,
        location.longitude,
        event.coordinates.lat,
        event.coordinates.lng
      );
      
      return {
        success: true,
        message: `Successfully checked in to ${event.name}!`,
        eventId: event.id,
        eventName: event.name,
        checkInId: checkInId as string,
        isWithinGeofence: true,
        distance: Math.round(finalDistance)
      };
      
    } catch (err: any) {
      console.error('Check-in process error:', err);
      
      // User-friendly error messages with error types
      let userError = 'Check-in failed. Please try again.';
      let errorType: CheckInResult['errorType'] = 'unknown';
      
      if (err.message?.includes('Location permission') || err.message?.includes('location access')) {
        userError = 'Location access is required. Please enable it in your browser settings.';
        errorType = 'location_denied';
      } else if (err.message?.includes('network') || err.message?.includes('fetch') || err.message?.includes('Failed to fetch')) {
        userError = 'Connection issue. Please check your internet and try again.';
        errorType = 'network_error';
      } else if (err.message?.includes('Event not found')) {
        userError = 'This event doesn\'t exist. Please check the QR code.';
        errorType = 'not_found';
      } else if (err.message?.includes('timed out')) {
        userError = 'Location request timed out. Please try again.';
        errorType = 'location_denied';
      }
      
      return { success: false, error: userError, errorType };
    } finally {
      setIsLoading(false);
    }
  }, [userId, validateQRCodeFast, getFastLocation]);

  // Direct event check-in (bypasses QR scanning) - Uses secure RPC
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
          eventId: eventId,
          checkInId: existingCheckIn[0].id
        };
      }

      // Get event details for error messages
      const { data: event } = await supabase
        .from('events')
        .select('name, geofence_radius, latitude, longitude')
        .eq('id', eventId)
        .single();
      
      if (!event) {
        return { success: false, error: 'Event not found' };
      }
      
      // Get location (required for secure check-in)
      let location: GeolocationResult;
      
      try {
        location = await getFastLocation();
      } catch (locationError) {
        console.log('Location unavailable');
        return {
          success: false,
          error: 'Location permission denied. Please enable location access to check in.',
          errorType: 'location_denied'
        };
      }
      
      // Perform SECURE check-in via server-side RPC
      const { data: checkInId, error: checkInError } = await supabase.rpc('secure_check_in', {
        p_event_id: eventId,
        p_user_lat: location.latitude,
        p_user_lng: location.longitude,
        p_visibility_mode: visibilityMode,
        p_verification_method: 'geolocation'
      });

      if (checkInError) {
        console.error('Secure check-in error:', checkInError);
        
        const errorMessage = checkInError.message || '';
        
        if (errorMessage.includes('within') && errorMessage.includes('meters')) {
          // Extract distance from error message
          const distanceMatch = errorMessage.match(/Current distance: (\d+)/);
          const distance = distanceMatch ? parseInt(distanceMatch[1]) : undefined;
          
          return {
            success: false,
            error: `You are ${distance || 'too far'}m away from the event. Please move within ${event.geofence_radius || 50}m to check in.`,
            eventId: eventId,
            isWithinGeofence: false,
            distance,
            errorType: 'outside_geofence'
          };
        }
        
        return { success: false, error: 'Check-in failed. Please try again.' };
      }

      // Calculate final distance for display
      const finalDistance = calculateDistance(
        location.latitude,
        location.longitude,
        event.latitude || 0,
        event.longitude || 0
      );

      return {
        success: true,
        message: `Checked in to ${event.name}!`,
        eventId: eventId,
        checkInId: checkInId as string,
        isWithinGeofence: true,
        distance: Math.round(finalDistance)
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
    preflightGeofenceCheck,
    getFastLocation,
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
