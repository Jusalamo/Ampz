import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateDistance, parseCheckInURL } from '@/lib/qr-utils';
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

export function useCheckIn(userId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user location with permission handling
  const getFastLocation = useCallback((): Promise<GeolocationResult> => {
    return new Promise((resolve, reject) => {
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

  // Pre-flight geofence check - ONLY geofence validation happens here
  const preflightGeofenceCheck = useCallback(async (
    eventId: string
  ): Promise<{ success: boolean; distance?: number; geofenceRadius?: number; eventName?: string; eventLocation?: string; error?: string }> => {
    try {
      const { data: eventData, error: fetchError } = await supabase
        .from('events')
        .select('id, name, latitude, longitude, geofence_radius, location')
        .eq('id', eventId)
        .single();
      
      if (fetchError || !eventData) {
        return { success: false, error: 'Event not found' };
      }

      const location = await getFastLocation();
      
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

  // QR code validation
  const validateQRCodeFast = useCallback(async (
    qrData: string
  ): Promise<{ valid: boolean; eventId?: string; event?: Event; error?: string; errorType?: CheckInResult['errorType'] }> => {
    try {
      const parsed = parseCheckInURL(qrData);
      
      if (!parsed || !parsed.eventId) {
        return { valid: false, error: 'Invalid QR code format. Please scan a valid event QR code.', errorType: 'unknown' };
      }
      
      const eventId = parsed.eventId;
      
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId)) {
        return { valid: false, error: 'Invalid event ID format', errorType: 'unknown' };
      }
      
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

      if (eventData.ended_at) {
        return { valid: false, error: 'This event has ended. Check-in is no longer available.', errorType: 'event_ended' };
      }
      
      if (eventData.date) {
        const eventDate = new Date(eventData.date);
        const today = new Date();
        eventDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        
        if (eventDate < today) {
          return { valid: false, error: 'This event has already passed.', errorType: 'event_ended' };
        }
      }
      
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

  // SIMPLIFIED CHECK-IN - Trusts that preflight already validated geofence
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
      console.log('Processing check-in for visibility:', visibilityMode);
      
      // Validate QR code
      const validationResult = await validateQRCodeFast(qrData);
      
      if (!validationResult.valid || !validationResult.event) {
        return { 
          success: false, 
          error: validationResult.error || 'Invalid QR code' 
        };
      }
      
      const event = validationResult.event;
      
      // Check for existing check-in
      const { data: existingCheckIn } = await supabase
        .from('check_ins')
        .select('id, checked_in_at')
        .eq('user_id', userId)
        .eq('event_id', event.id)
        .limit(1);
      
      if (existingCheckIn && existingCheckIn.length > 0) {
        return {
          success: true,
          message: `Already checked in to ${event.name}`,
          eventId: event.id,
          checkInId: existingCheckIn[0].id,
          errorType: 'already_checked_in'
        };
      }
      
      // Get location for distance display (not for validation)
      let location: GeolocationResult;
      try {
        location = await getFastLocation();
      } catch (locationError: any) {
        return {
          success: false,
          error: 'Location permission denied. Please enable location access to check in.',
          errorType: 'location_denied'
        };
      }
      
      // Create check-in directly (no server-side geofence validation)
      const { data: checkInData, error: checkInError } = await supabase
        .from('check_ins')
        .insert({
          user_id: userId,
          event_id: event.id,
          visibility_mode: visibilityMode,
          verification_method: 'geolocation',
          check_in_location: `POINT(${location.longitude} ${location.latitude})`,
          checked_in_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (checkInError) {
        console.error('Check-in error:', checkInError);
        
        if (checkInError.message?.includes('duplicate') || checkInError.code === '23505') {
          return { 
            success: true, 
            message: `You're already checked in to ${event.name}!`,
            eventId: event.id,
            errorType: 'already_checked_in'
          };
        }
        
        return { 
          success: false, 
          error: 'Check-in failed. Please try again.',
          errorType: 'unknown'
        };
      }
      
      // Increment attendee count
      await supabase.rpc('increment_event_attendees', { event_id: event.id });
      
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
        checkInId: checkInData.id,
        isWithinGeofence: true,
        distance: Math.round(finalDistance)
      };
      
    } catch (err: any) {
      console.error('Check-in process error:', err);
      
      let userError = 'Check-in failed. Please try again.';
      let errorType: CheckInResult['errorType'] = 'unknown';
      
      if (err.message?.includes('Location permission') || err.message?.includes('location access')) {
        userError = 'Location access is required. Please enable it in your browser settings.';
        errorType = 'location_denied';
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        userError = 'Connection issue. Please check your internet and try again.';
        errorType = 'network_error';
      }
      
      return { success: false, error: userError, errorType };
    } finally {
      setIsLoading(false);
    }
  }, [userId, validateQRCodeFast, getFastLocation]);

  return {
    isLoading,
    error,
    processQRCodeScan,
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
