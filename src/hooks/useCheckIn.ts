import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateDistance } from '@/lib/qr-utils';

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

  // Get user location with permission handling - FAST with fallback strategy
  const getFastLocation = useCallback((): Promise<GeolocationResult> => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      // First try cached position (instant)
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
              console.error('Location error:', err);
              reject(new Error('Location permission denied. Please enable location access to check in.'));
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        },
        { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
      );
    });
  }, []);

  // Direct event check-in - Uses secure RPC with geofence validation
  // This is the ONLY check-in function - all validation happens here
  const checkInToEventFast = useCallback(async (
    eventId: string,
    visibilityMode: 'public' | 'private' = 'public'
  ): Promise<CheckInResult> => {
    if (!userId) {
      return { success: false, error: 'Please log in to check in' };
    }

    setIsLoading(true);
    setError(null);

    try {
      // STEP 1: Check for existing check-in (prevent duplicates)
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

      // STEP 2: Get event details for error messages
      const { data: event } = await supabase
        .from('events')
        .select('name, geofence_radius, latitude, longitude')
        .eq('id', eventId)
        .single();
      
      if (!event) {
        return { success: false, error: 'Event not found' };
      }
      
      // STEP 3: Get user location (required for secure check-in)
      let location: GeolocationResult;
      
      try {
        location = await getFastLocation();
        console.log('Location obtained for check-in:', location);
      } catch (locationError: any) {
        console.error('Location unavailable:', locationError);
        return {
          success: false,
          error: 'Location permission denied. Please enable location access to check in.'
        };
      }
      
      // STEP 4: Perform SECURE check-in via server-side RPC
      // Server validates geofence AND completes check-in atomically
      // This prevents client-side bypass and ensures data consistency
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
        
        // Parse server error messages for better user feedback
        if (errorMessage.includes('within') && errorMessage.includes('meters')) {
          // Extract distance from error message if available
          const distanceMatch = errorMessage.match(/Current distance: (\d+)/);
          const distance = distanceMatch ? parseInt(distanceMatch[1]) : undefined;
          
          return {
            success: false,
            error: errorMessage,
            eventId: eventId,
            isWithinGeofence: false,
            distance
          };
        }
        
        if (errorMessage.includes('already')) {
          return {
            success: true,
            message: 'Already checked in!',
            eventId: eventId
          };
        }
        
        return { success: false, error: 'Check-in failed. Please try again.' };
      }

      // STEP 5: Calculate actual distance for success message
      const distance = calculateDistance(
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
        distance: Math.round(distance)
      };
    } catch (err: any) {
      console.error('Check-in error:', err);
      
      // User-friendly error messages
      let userError = 'Check-in failed. Please try again.';
      
      if (err.message?.includes('Location permission')) {
        userError = 'Location permission denied. Please enable location access to check in.';
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        userError = 'Network error. Please check your internet connection.';
      }
      
      return { success: false, error: userError };
    } finally {
      setIsLoading(false);
    }
  }, [userId, getFastLocation]);

  // Check if user has already checked in to an event
  const hasCheckedIn = useCallback(async (eventId: string): Promise<boolean> => {
    if (!userId) return false;
    
    const { data } = await supabase
      .from('check_ins')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .limit(1);
    
    return !!(data && data.length > 0);
  }, [userId]);

  return {
    isLoading,
    error,
    checkInToEventFast,
    hasCheckedIn,
  };
}
