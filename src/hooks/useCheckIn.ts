import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateDistance, parseCheckInURL, validateEventToken, validateSecureEventToken } from '@/lib/qr-utils';
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

  // Unified QR code processing function
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
      // First, try to parse the QR data to get event info
      const parsed = parseCheckInURL(qrData);
      let eventId: string | undefined;
      
      if (parsed) {
        // If we parsed a URL, use the eventId from it
        eventId = parsed.eventId;
        
        // If there's a token, validate it
        if (parsed.token) {
          const isSecureTokenValid = await validateSecureEventToken(parsed.token, eventId);
          const isLegacyTokenValid = validateEventToken(parsed.token, eventId);
          
          if (!isSecureTokenValid && !isLegacyTokenValid) {
            return { success: false, error: 'Invalid or expired QR code token' };
          }
        }
      } else {
        // If not a URL, treat it as a direct code (QR code or access code)
        eventId = qrData;
      }

      // Fetch event details
      const { data: eventData, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .or(`id.eq.${eventId},qr_code.eq.${qrData},access_code.eq.${qrData}`)
        .single();

      if (fetchError || !eventData) {
        console.error('Event fetch error:', fetchError);
        return { success: false, error: 'Invalid QR code or event not found' };
      }

      if (!eventData.is_active) {
        return { success: false, error: 'This event is no longer active' };
      }

      const event: Event = {
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
        geofenceRadius: eventData.geofence_radius || 50,
        customTheme: eventData.custom_theme || '#8B5CF6',
        coverImage: eventData.cover_image || '',
        images: eventData.images || [],
        videos: eventData.videos || [],
        tags: eventData.tags || [],
        isFeatured: eventData.is_featured || false,
        isDemo: eventData.is_demo || false,
        isActive: eventData.is_active ?? true,
      };

      // Get user's location for geofence check
      const location = await getUserLocation();
      
      // Calculate distance to venue
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        event.coordinates.lat,
        event.coordinates.lng
      );

      // Check if within geofence
      const withinGeofence = distance <= event.geofenceRadius;

      if (!withinGeofence) {
        const distanceInMeters = Math.round(distance);
        return {
          success: false,
          error: `You need to be inside the event's geofence to proceed. You are ${distanceInMeters}m away from the event. Please move within ${event.geofenceRadius}m of the venue to check in.`,
          isWithinGeofence: false,
          distance: distanceInMeters,
          eventId: event.id
        };
      }

      // Check if user has already checked in
      const { data: existingCheckIn } = await supabase
        .from('check_ins')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', event.id)
        .maybeSingle();

      if (existingCheckIn) {
        return { 
          success: false, 
          error: 'You have already checked in to this event',
          eventId: event.id
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
          distance_from_venue: distance,
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

      return {
        success: true,
        message: `Welcome to ${event.name}!`,
        eventId: event.id,
        checkInId: data.id,
        isWithinGeofence: true,
        distance: Math.round(distance)
      };
    } catch (err: any) {
      console.error('Process QR code error:', err);
      const message = err?.message || 'Check-in failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [userId, getUserLocation]);

  // Validate QR code and return event info (for validation only, not check-in)
  const validateQRCode = useCallback(async (
    qrData: string
  ): Promise<{ valid: boolean; eventId?: string; event?: Event; error?: string }> => {
    try {
      // Parse the QR code URL
      const parsed = parseCheckInURL(qrData);
      let eventId: string | undefined;
      
      if (parsed) {
        eventId = parsed.eventId;
        
        // If there's a token, validate it
        if (parsed.token) {
          const isSecureTokenValid = await validateSecureEventToken(parsed.token, eventId);
          const isLegacyTokenValid = validateEventToken(parsed.token, eventId);
          
          if (!isSecureTokenValid && !isLegacyTokenValid) {
            return { valid: false, error: 'Invalid or expired QR code' };
          }
        }
      } else {
        // If not a URL, treat it as a direct code
        eventId = qrData;
      }

      // Fetch event details
      const { data: eventData, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .or(`id.eq.${eventId},qr_code.eq.${qrData},access_code.eq.${qrData}`)
        .single();

      if (fetchError || !eventData) {
        console.error('Validate QR error:', fetchError);
        return { valid: false, error: 'Invalid QR code or access code' };
      }

      if (!eventData.is_active) {
        return { valid: false, error: 'This event is no longer active' };
      }

      return {
        valid: true,
        eventId: eventData.id,
        event: {
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
          geofenceRadius: eventData.geofence_radius || 50,
          customTheme: eventData.custom_theme || '#8B5CF6',
          coverImage: eventData.cover_image || '',
          images: eventData.images || [],
          videos: eventData.videos || [],
          tags: eventData.tags || [],
          isFeatured: eventData.is_featured || false,
          isDemo: eventData.is_demo || false,
          isActive: eventData.is_active ?? true,
        } as Event,
      };
    } catch (err: any) {
      console.error('Validate QR catch error:', err);
      return { valid: false, error: err?.message || 'Failed to validate QR code' };
    }
  }, []);

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

  // Direct check-in function (for EventCheckIn page)
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

      // Calculate distance to venue
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        event.coordinates.lat,
        event.coordinates.lng
      );

      // Check if within geofence
      const withinGeofence = distance <= event.geofenceRadius;

      if (!withinGeofence) {
        const distanceInMeters = Math.round(distance);
        return {
          success: false,
          error: `You need to be inside the event's geofence to proceed. You are ${distanceInMeters}m away from the event. Please move within ${event.geofenceRadius}m of the venue to check in.`,
          isWithinGeofence: false,
          distance: distanceInMeters
        };
      }

      // Check if user has already checked in
      const { data: existingCheckIn } = await supabase
        .from('check_ins')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', event.id)
        .maybeSingle();

      if (existingCheckIn) {
        return { success: false, error: 'You have already checked in to this event' };
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
          distance_from_venue: distance,
          visibility_mode: visibilityMode,
          verification_method: verificationPhoto ? 'photo' : 'direct',
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

      return {
        success: true,
        message: `Welcome to ${event.name}!`,
        eventId: event.id,
        checkInId: data.id,
        isWithinGeofence: true,
        distance: Math.round(distance)
      };
    } catch (err: any) {
      const message = err?.message || 'Check-in failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [userId, getUserLocation]);

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
