import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateDistance, isWithinGeofence, parseCheckInURL, validateEventToken, validateSecureEventToken, extractEventIdFromURL, validateGeofenceForCheckIn } from '@/lib/qr-utils';
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

  // Get user's current location
  const getUserLocation = useCallback((): Promise<GeolocationResult> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (err) => {
          let message = 'Failed to get location';
          switch (err.code) {
            case err.PERMISSION_DENIED:
              message = 'Location permission denied. Please enable location access.';
              break;
            case err.POSITION_UNAVAILABLE:
              message = 'Location information unavailable.';
              break;
            case err.TIMEOUT:
              message = 'Location request timed out.';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  // Verify geofence and perform check-in
  const checkIn = useCallback(async (
    event: Event,
    visibilityMode: 'public' | 'private' = 'public',
    verificationPhoto?: string
  ): Promise<CheckInResult> => {
    if (!userId) {
      return { success: false, error: 'You must be logged in to check in' };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get user's location
      const location = await getUserLocation();

      // Validate geofence
      const geofenceCheck = await validateGeofenceForCheckIn(
        event.id,
        location.latitude,
        location.longitude
      );

      if (!geofenceCheck.valid) {
        return {
          success: false,
          error: geofenceCheck.error || `You need to be inside the event's geofence to proceed. Please move within ${event.geofenceRadius}m of the venue to check in.`,
          isWithinGeofence: false,
          distance: geofenceCheck.distance
        };
      }

      // Check if user has already checked in
      const { data: existingCheckIn } = await supabase
        .from('check_ins')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', event.id)
        .limit(1);

      if (existingCheckIn && existingCheckIn.length > 0) {
        return {
          success: true,
          message: `You're already checked in to ${event.name}!`,
          eventId: event.id,
          isWithinGeofence: true,
          distance: geofenceCheck.distance
        };
      }

      // Create check-in record
      const { data, error: insertError } = await supabase
        .from('check_ins')
        .insert({
          user_id: userId,
          event_id: event.id,
          check_in_latitude: location.latitude,
          check_in_longitude: location.longitude,
          within_geofence: true,
          distance_from_venue: geofenceCheck.distance,
          visibility_mode: visibilityMode,
          verification_method: verificationPhoto ? 'photo' : 'geolocation',
          verification_photo: verificationPhoto || null,
          checked_in_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Check-in error:', insertError);
        return { success: false, error: 'Failed to record check-in. Please try again.' };
      }

      // If public, create match profile
      if (visibilityMode === 'public') {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name, age, bio, interests, profile_photo, location, occupation, gender')
          .eq('id', userId)
          .single();

        if (profileData) {
          await supabase.from('match_profiles').insert({
            user_id: userId,
            event_id: event.id,
            check_in_id: data.id,
            display_name: profileData.name || 'Anonymous',
            age: profileData.age,
            bio: profileData.bio,
            interests: profileData.interests || [],
            profile_photos: verificationPhoto 
              ? [verificationPhoto] 
              : profileData.profile_photo 
                ? [profileData.profile_photo] 
                : [],
            location: profileData.location,
            occupation: profileData.occupation,
            gender: profileData.gender,
            is_active: true,
            is_public: true,
          });
        }
      }

      // Update event attendees count
      await supabase.rpc('increment_event_attendees', { event_id: event.id });

      return {
        success: true,
        message: `Welcome to ${event.name}!`,
        eventId: event.id,
        checkInId: data.id,
        isWithinGeofence: true,
        distance: geofenceCheck.distance
      };
    } catch (err: any) {
      const message = err?.message || 'Check-in failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [userId, getUserLocation]);

  // Validate QR code and return event info - UPDATED to handle geofence
  const validateQRCode = useCallback(async (
    qrData: string
  ): Promise<{ valid: boolean; eventId?: string; event?: Event; requiresGeofence?: boolean; error?: string }> => {
    try {
      console.log('Validating QR code data:', qrData);
      
      // First, try to parse as URL to extract event ID
      const parsed = parseCheckInURL(qrData);
      
      let eventId: string | null = null;
      
      if (parsed) {
        eventId = parsed.eventId;
      } else {
        // If not a URL, try to extract event ID directly
        eventId = extractEventIdFromURL(qrData);
      }
      
      if (!eventId) {
        return { valid: false, error: 'Invalid QR code format. Could not find event ID.' };
      }
      
      // Fetch event by ID
      const { data: eventData, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (fetchError || !eventData) {
        return { valid: false, error: 'Event not found' };
      }

      if (!eventData.is_active) {
        return { valid: false, error: 'This event is no longer active' };
      }

      // Check if URL contains geofence check parameter
      const urlObj = new URL(qrData.includes('://') ? qrData : `https://dummy.com/${qrData}`);
      const requiresGeofence = urlObj.searchParams.has('checkGeofence');

      return {
        valid: true,
        eventId: eventData.id,
        event: formatEventData(eventData),
        requiresGeofence
      };
    } catch (err: any) {
      console.error('Error validating QR code:', err);
      return { valid: false, error: 'Failed to validate QR code. Please try again.' };
    }
  }, []);

  // Helper function to format event data
  const formatEventData = (eventData: any): Event => {
    return {
      id: eventData.id,
      name: eventData.name,
      description: eventData.description || '',
      category: eventData.category,
      location: eventData.location,
      address: eventData.address,
      coordinates: { lat: eventData.latitude, lng: eventData.longitude },
      date: eventData.date,
      time: eventData.time,
      price: eventData.price || 0,
      currency: eventData.currency || 'NAD',
      maxAttendees: eventData.max_attendees || 500,
      attendees: eventData.attendees_count || 0,
      organizerId: eventData.organizer_id,
      qrCode: eventData.qr_code,
      qrCodeUrl: eventData.qr_code_url,
      geofenceRadius: eventData.geofence_radius || 50,
      customTheme: eventData.custom_theme || '#8B5CF6',
      coverImage: eventData.cover_image || '',
      images: eventData.images || [],
      videos: eventData.videos || [],
      tags: eventData.tags || [],
      isFeatured: eventData.is_featured || false,
      isDemo: eventData.is_demo || false,
      isActive: eventData.is_active ?? true,
    } as Event;
  };

  // Unified QR code scanning flow with geofence check
  const processQRCodeScan = useCallback(async (
    qrData: string,
    visibilityMode: 'public' | 'private' = 'public',
    verificationPhoto?: string
  ): Promise<CheckInResult> => {
    if (!userId) {
      return { success: false, error: 'You must be logged in to check in' };
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Processing QR code scan:', qrData);
      
      // First validate the QR code
      const validationResult = await validateQRCode(qrData);
      
      if (!validationResult.valid || !validationResult.event) {
        console.log('QR code validation failed:', validationResult.error);
        return { 
          success: false, 
          error: validationResult.error || 'Invalid QR code. Please make sure you\'re scanning a valid event QR code.' 
        };
      }

      const event = validationResult.event;
      console.log('Event found:', event.name);
      
      // Get user's location for geofence check
      const location = await getUserLocation();
      
      // Validate geofence if required
      if (validationResult.requiresGeofence !== false) {
        const geofenceCheck = await validateGeofenceForCheckIn(
          event.id,
          location.latitude,
          location.longitude
        );
        
        if (!geofenceCheck.valid) {
          return {
            success: false,
            error: geofenceCheck.error || `You need to be inside the event's geofence to proceed. Please move within ${event.geofenceRadius}m of the venue to check in.`,
            isWithinGeofence: false,
            distance: geofenceCheck.distance,
            eventId: event.id
          };
        }
        
        // Check if user has already checked in
        const { data: existingCheckIn } = await supabase
          .from('check_ins')
          .select('id')
          .eq('user_id', userId)
          .eq('event_id', event.id)
          .limit(1);

        if (existingCheckIn && existingCheckIn.length > 0) {
          return {
            success: true,
            message: `You're already checked in to ${event.name}!`,
            eventId: event.id,
            isWithinGeofence: true,
            distance: geofenceCheck.distance
          };
        }

        // Create check-in record
        const { data, error: insertError } = await supabase
          .from('check_ins')
          .insert({
            user_id: userId,
            event_id: event.id,
            check_in_latitude: location.latitude,
            check_in_longitude: location.longitude,
            within_geofence: true,
            distance_from_venue: geofenceCheck.distance,
            visibility_mode: visibilityMode,
            verification_method: verificationPhoto ? 'photo' : 'qr_scan',
            verification_photo: verificationPhoto || null,
            checked_in_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error('Check-in error:', insertError);
          return { success: false, error: 'Failed to record check-in. Please try again.' };
        }

        // If public, create match profile
        if (visibilityMode === 'public') {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name, age, bio, interests, profile_photo, location, occupation, gender')
            .eq('id', userId)
            .single();

          if (profileData) {
            await supabase.from('match_profiles').insert({
              user_id: userId,
              event_id: event.id,
              check_in_id: data.id,
              display_name: profileData.name || 'Anonymous',
              age: profileData.age,
              bio: profileData.bio,
              interests: profileData.interests || [],
              profile_photos: verificationPhoto 
                ? [verificationPhoto] 
                : profileData.profile_photo 
                  ? [profileData.profile_photo] 
                  : [],
              location: profileData.location,
              occupation: profileData.occupation,
              gender: profileData.gender,
              is_active: true,
              is_public: true,
            });
          }
        }

        // Update event attendees count
        await supabase.rpc('increment_event_attendees', { event_id: event.id });

        return {
          success: true,
          message: `Welcome to ${event.name}!`,
          eventId: event.id,
          checkInId: data.id,
          isWithinGeofence: true,
          distance: geofenceCheck.distance
        };
      } else {
        // Geofence check not required (for testing or special events)
        return await checkIn(event, visibilityMode, verificationPhoto);
      }
    } catch (err: any) {
      console.error('Error in processQRCodeScan:', err);
      const message = err?.message || 'Check-in failed. Please try again.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [userId, validateQRCode, getUserLocation, checkIn]);

  // Check if user has already checked in to an event
  const hasCheckedIn = useCallback(async (eventId: string): Promise<boolean> => {
    if (!userId) return false;

    const { data, error } = await supabase
      .from('check_ins')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .limit(1);

    return !error && (data?.length ?? 0) > 0;
  }, [userId]);

  return {
    isLoading,
    error,
    checkIn,
    validateQRCode,
    hasCheckedIn,
    getUserLocation,
    processQRCodeScan,
  };
}
