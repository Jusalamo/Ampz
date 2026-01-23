import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateDistance, validateGeofenceForCheckIn } from '@/lib/qr-utils';
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

// Type for the secure_check_in RPC response
type SecureCheckInResponse = string | null;

export function useCheckIn(userId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // FAST location - get with low accuracy first
  const getFastLocation = useCallback((): Promise<GeolocationResult> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      // Use low accuracy for speed (like WhatsApp does)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (err) => reject(new Error('Location access needed')),
        {
          enableHighAccuracy: false, // FALSE for speed
          timeout: 5000, // 5 seconds max
          maximumAge: 30000, // Accept cached location up to 30 seconds old
        }
      );
    });
  }, []);

  // INSTANT QR code validation - minimal checks
  const validateQRCodeFast = useCallback(async (
    qrData: string
  ): Promise<{ valid: boolean; eventId?: string; event?: Event; error?: string }> => {
    try {
      // Extract event ID from QR code (fast parsing)
      let eventId: string | null = null;
      
      // Quick regex to find UUID in the string
      const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
      const match = qrData.match(uuidRegex);
      
      if (match) {
        eventId = match[0];
      } else {
        // Try to parse as URL
        try {
          const url = new URL(qrData);
          const pathParts = url.pathname.split('/');
          const eventIndex = pathParts.indexOf('event') + 1;
          if (eventIndex > 0 && eventIndex < pathParts.length) {
            eventId = pathParts[eventIndex];
          }
        } catch {
          // Not a URL, check if it's just an event ID
          if (qrData.length === 36) { // UUID length
            eventId = qrData;
          }
        }
      }
      
      if (!eventId) {
        return { valid: false, error: 'Invalid QR code format' };
      }

      // FAST database fetch - only get essential fields
      const { data: eventData, error: fetchError } = await supabase
        .from('events')
        .select('id, name, latitude, longitude, geofence_radius, is_active')
        .eq('id', eventId)
        .single();

      if (fetchError || !eventData) {
        return { valid: false, error: 'Event not found' };
      }

      if (!eventData.is_active) {
        return { valid: false, error: 'Event is not active' };
      }

      // Return minimal event data
      return {
        valid: true,
        eventId: eventData.id,
        event: {
          id: eventData.id,
          name: eventData.name,
          coordinates: { lat: eventData.latitude, lng: eventData.longitude },
          geofenceRadius: eventData.geofence_radius || 50,
          isActive: eventData.is_active,
        } as Event,
      };
    } catch (err: any) {
      console.error('Fast QR validation error:', err);
      return { valid: false, error: 'Invalid QR code' };
    }
  }, []);

  // FAST geofence check - simplified
  const checkGeofenceFast = useCallback(async (
    event: Event,
    userLat: number,
    userLng: number
  ): Promise<{ withinGeofence: boolean; distance?: number; error?: string }> => {
    try {
      const distance = calculateDistance(
        userLat,
        userLng,
        event.coordinates.lat,
        event.coordinates.lng
      );
      
      const withinGeofence = distance <= event.geofenceRadius;
      
      return {
        withinGeofence,
        distance: Math.round(distance),
        error: withinGeofence ? undefined : `Move within ${event.geofenceRadius}m of the event`
      };
    } catch (err) {
      console.error('Geofence check error:', err);
      return { withinGeofence: false, error: 'Location check failed' };
    }
  }, []);

  // INSTANT check-in process - parallel operations
  const processQRCodeScanFast = useCallback(async (
    qrData: string,
    visibilityMode: 'public' | 'private' = 'public'
  ): Promise<CheckInResult> => {
    if (!userId) {
      return { success: false, error: 'Please log in first' };
    }

    setIsLoading(true);
    setError(null);

    try {
      console.time('TotalCheckInTime');
      
      // STEP 1: Validate QR code (FAST)
      console.time('QRValidation');
      const validationResult = await validateQRCodeFast(qrData);
      console.timeEnd('QRValidation');
      
      if (!validationResult.valid || !validationResult.event) {
        return { 
          success: false, 
          error: validationResult.error || 'Invalid QR code' 
        };
      }
      
      const event = validationResult.event;
      
      // STEP 2: Get location & check geofence in PARALLEL with existing check-in check
      console.time('ParallelChecks');
      const [location, existingCheckIn] = await Promise.all([
        getFastLocation().catch(() => null), // Location is optional for speed
        supabase
          .from('check_ins')
          .select('id')
          .eq('user_id', userId)
          .eq('event_id', event.id)
          .limit(1)
          .then(({ data }) => data?.[0])
      ]);
      console.timeEnd('ParallelChecks');
      
      // If already checked in, return success immediately
      if (existingCheckIn) {
        return {
          success: true,
          message: `Already checked in to ${event.name}`,
          eventId: event.id
        };
      }
      
      // If we have location, check geofence (non-blocking)
      let geofenceResult = { withinGeofence: true };
      if (location) {
        console.time('GeofenceCheck');
        geofenceResult = await checkGeofenceFast(event, location.latitude, location.longitude);
        console.timeEnd('GeofenceCheck');
        
        if (!geofenceResult.withinGeofence) {
          return {
            success: false,
            error: 'Please move closer to the event location',
            eventId: event.id,
            isWithinGeofence: false,
            distance: (geofenceResult as any).distance
          };
        }
      }
      
      // STEP 3: Use secure server-side check-in function for proper geofence validation
      // This prevents clients from bypassing geofence validation
      console.time('SecureCheckIn');
      
      if (location) {
        // Use secure server-side check-in with proper geofence validation
        const { data: checkInId, error: rpcError } = await supabase.rpc('secure_check_in', {
          p_event_id: event.id,
          p_user_lat: location.latitude,
          p_user_lng: location.longitude,
          p_visibility_mode: visibilityMode,
          p_verification_method: 'geolocation'
        }) as { data: SecureCheckInResponse; error: any };
        
        console.timeEnd('SecureCheckIn');
        
        if (rpcError) {
          console.error('Secure check-in error:', rpcError);
          // Extract user-friendly message from error
          const errorMessage = rpcError.message || 'Check-in failed';
          if (errorMessage.includes('meters')) {
            return { success: false, error: errorMessage, eventId: event.id, isWithinGeofence: false };
          }
          return { success: false, error: 'Check-in failed. Please try again.' };
        }
        
        console.timeEnd('TotalCheckInTime');
        
        return {
          success: true,
          message: `Checked in to ${event.name}!`,
          eventId: event.id,
          checkInId: checkInId || undefined,
          isWithinGeofence: true,
          distance: (geofenceResult as any).distance
        };
      } else {
        // Fallback for when location is not available
        const { data: checkInData, error: checkInError } = await supabase
          .from('check_ins')
          .insert({
            user_id: userId,
            event_id: event.id,
            check_in_latitude: null,
            check_in_longitude: null,
            within_geofence: true, // Allow if no location available
            visibility_mode: visibilityMode,
            verification_method: 'qr_scan',
            checked_in_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        
        console.timeEnd('SecureCheckIn');
        
        if (checkInError) {
          console.error('Check-in error:', checkInError);
          return { success: false, error: 'Check-in failed. Please try again.' };
        }
        
        console.timeEnd('TotalCheckInTime');
        
        return {
          success: true,
          message: `Checked in to ${event.name}!`,
          eventId: event.id,
          checkInId: checkInData.id,
          isWithinGeofence: true
        };
      }
    } catch (err: any) {
      console.error('Fast check-in error:', err);
      const message = err?.message || 'Check-in failed';
      
      // User-friendly error messages
      if (message.includes('Location access')) {
        return { success: false, error: 'Please enable location access' };
      }
      if (message.includes('network') || message.includes('fetch')) {
        return { success: false, error: 'Network error. Please check connection' };
      }
      
      return { success: false, error: 'Scan failed. Please try again' };
    } finally {
      setIsLoading(false);
    }
  }, [userId, validateQRCodeFast, getFastLocation, checkGeofenceFast]);

  // ULTRA-FAST check-in for known events (bypasses QR validation)
  const checkInToEventFast = useCallback(async (
    eventId: string,
    visibilityMode: 'public' | 'private' = 'public'
  ): Promise<CheckInResult> => {
    if (!userId) {
      return { success: false, error: 'Please log in first' };
    }

    try {
      // Check if already checked in (FAST)
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

      // Get location quickly (non-blocking)
      const location = await getFastLocation().catch(() => null);
      
      // Create check-in (minimal data)
      const { data: checkInData, error: checkInError } = await supabase
        .from('check_ins')
        .insert({
          user_id: userId,
          event_id: eventId,
          check_in_latitude: location?.latitude || null,
          check_in_longitude: location?.longitude || null,
          within_geofence: true, // Assume they're at the event
          visibility_mode: visibilityMode,
          verification_method: location ? 'geolocation' : 'direct',
          checked_in_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (checkInError) {
        return { success: false, error: 'Check-in failed' };
      }

      // Update count (async)
      (async () => {
        try {
          await supabase
            .from('events')
            .update({ attendees_count: 1 })
            .eq('id', eventId);
        } catch (err) {
          console.error('Failed to update attendee count:', err);
        }
      })();

      return {
        success: true,
        message: 'Checked in successfully!',
        eventId: eventId,
        checkInId: checkInData.id
      };
    } catch (err: any) {
      console.error('Ultra-fast check-in error:', err);
      return { success: false, error: 'Check-in failed. Please try again.' };
    }
  }, [userId, getFastLocation]);

  return {
    isLoading,
    error,
    processQRCodeScan: processQRCodeScanFast, // Use fast version
    checkInToEventFast, // Ultra-fast version for direct event check-in
    validateQRCode: validateQRCodeFast, // Fast validation
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
