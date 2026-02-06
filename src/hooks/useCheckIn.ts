import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/lib/types';

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface CheckInResult {
  success: boolean;
  error?: string;
  errorType?: 'already_checked_in' | 'outside_geofence' | 'event_not_found' | 'unknown';
  message?: string;
  distance?: number;
  eventId?: string;
}

interface ValidationResult {
  valid: boolean;
  event?: Event;
  error?: string;
}

interface GeofenceCheckResult {
  success: boolean;
  distance?: number;
  geofenceRadius?: number;
  location?: GeolocationResult;
  error?: string;
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Get user's current location
async function getCurrentLocation(): Promise<GeolocationResult> {
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
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location permission denied. Please enable location access in your browser settings.'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information is unavailable.'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location request timed out.'));
            break;
          default:
            reject(new Error('An unknown error occurred while getting location.'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
}

export function useCheckIn(userId?: string) {
  const [isLoading, setIsLoading] = useState(false);

  // Validate QR code and fetch event
  const validateQRCode = useCallback(async (code: string): Promise<ValidationResult> => {
    try {
      // Extract event ID from QR code (could be URL or UUID)
      let eventId: string | null = null;
      
      if (code.includes('/event/')) {
        const match = code.match(/\/event\/([a-f0-9-]+)/i);
        if (match) eventId = match[1];
      } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code)) {
        eventId = code;
      } else {
        // Try finding by access_code or qr_code
        const { data: eventByCode } = await supabase
          .from('events')
          .select('*')
          .or(`access_code.eq.${code},qr_code.eq.${code}`)
          .eq('is_active', true)
          .single();
        
        if (eventByCode) eventId = eventByCode.id;
      }

      if (!eventId) {
        return { valid: false, error: 'Invalid QR code format' };
      }

      // Fetch event details
      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('is_active', true)
        .single();

      if (error || !event) {
        return { valid: false, error: 'Event not found or is inactive' };
      }

      // Map database event to Event type
      const mappedEvent: Event = {
        id: event.id,
        name: event.name,
        description: event.description || '',
        category: event.category,
        location: event.location,
        address: event.address,
        coordinates: {
          lat: Number(event.latitude),
          lng: Number(event.longitude),
        },
        date: event.date,
        time: event.time,
        endTime: event.end_time || undefined,
        endedAt: event.ended_at || undefined,
        price: event.price || 0,
        currency: event.currency || 'NAD',
        maxAttendees: event.max_attendees || 500,
        attendees: event.attendees_count || 0,
        organizerId: event.organizer_id || '',
        qrCode: event.qr_code,
        geofenceRadius: event.geofence_radius || 50,
        customTheme: event.custom_theme || '#8B5CF6',
        coverImage: event.cover_image || '',
        images: event.images || [],
        videos: event.videos || [],
        tags: event.tags || [],
        isFeatured: event.is_featured || false,
        isDemo: event.is_demo || false,
        isActive: event.is_active ?? true,
        ticketLink: event.ticket_link || undefined,
        accessCode: event.access_code || undefined,
      };

      return { valid: true, event: mappedEvent };
    } catch (err) {
      console.error('Error validating QR code:', err);
      return { valid: false, error: 'Failed to validate QR code' };
    }
  }, []);

  // Pre-flight geofence check (gets location and validates distance)
  const preflightGeofenceCheck = useCallback(async (eventId: string): Promise<GeofenceCheckResult> => {
    try {
      // Get event coordinates
      const { data: event, error } = await supabase
        .from('events')
        .select('latitude, longitude, geofence_radius')
        .eq('id', eventId)
        .single();

      if (error || !event) {
        return { success: false, error: 'Event not found' };
      }

      // Get user's current location
      const location = await getCurrentLocation();
      
      // Calculate distance
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        Number(event.latitude),
        Number(event.longitude)
      );

      const geofenceRadius = event.geofence_radius || 50;
      const withinGeofence = distance <= geofenceRadius;

      return {
        success: withinGeofence,
        distance: Math.round(distance),
        geofenceRadius,
        location,
      };
    } catch (err: any) {
      console.error('Geofence check error:', err);
      return { success: false, error: err.message || 'Failed to check location' };
    }
  }, []);

  // Process check-in with cached location
  const processCheckIn = useCallback(async (
    event: Event,
    location: GeolocationResult,
    visibilityMode: 'public' | 'private'
  ): Promise<CheckInResult> => {
    if (!userId) {
      return { success: false, error: 'User not authenticated', errorType: 'unknown' };
    }

    setIsLoading(true);

    try {
      // Check if already checked in
      const { data: existingCheckIn } = await supabase
        .from('check_ins')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', event.id)
        .limit(1);

      if (existingCheckIn && existingCheckIn.length > 0) {
        setIsLoading(false);
        return { 
          success: true, 
          message: `You're already checked in to ${event.name}!`,
          errorType: 'already_checked_in',
          eventId: event.id 
        };
      }

      // Calculate distance for the record
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        event.coordinates.lat,
        event.coordinates.lng
      );

      // Insert check-in record
      const { error: insertError } = await supabase
        .from('check_ins')
        .insert({
          event_id: event.id,
          user_id: userId,
          visibility_mode: visibilityMode,
          verification_method: 'geolocation',
          check_in_latitude: location.latitude,
          check_in_longitude: location.longitude,
          within_geofence: true,
          distance_from_venue: Math.round(distance),
          checked_in_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Check-in insert error:', insertError);
        setIsLoading(false);
        return { success: false, error: 'Failed to complete check-in', errorType: 'unknown' };
      }

      // Update event attendee count
      await supabase
        .from('events')
        .update({ attendees_count: (event.attendees || 0) + 1 })
        .eq('id', event.id);

      // If public visibility, create or update match profile
      if (visibilityMode === 'public') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, bio, age, interests, profile_photo, occupation, gender, location')
          .eq('id', userId)
          .single();

        if (profile) {
          // Get the check-in ID
          const { data: checkIn } = await supabase
            .from('check_ins')
            .select('id')
            .eq('user_id', userId)
            .eq('event_id', event.id)
            .single();

          await supabase
            .from('match_profiles')
            .upsert({
              user_id: userId,
              event_id: event.id,
              check_in_id: checkIn?.id,
              display_name: profile.name || 'Anonymous',
              bio: profile.bio,
              age: profile.age,
              interests: profile.interests || [],
              profile_photos: profile.profile_photo ? [profile.profile_photo] : [],
              occupation: profile.occupation,
              gender: profile.gender,
              location: profile.location,
              is_public: true,
              is_active: true,
            });
        }
      }

      setIsLoading(false);
      return {
        success: true,
        message: `Welcome to ${event.name}!`,
        distance: Math.round(distance),
        eventId: event.id,
      };
    } catch (err: any) {
      console.error('Check-in error:', err);
      setIsLoading(false);
      return { success: false, error: err.message || 'Check-in failed', errorType: 'unknown' };
    }
  }, [userId]);

  return {
    isLoading,
    validateQRCode,
    preflightGeofenceCheck,
    processCheckIn,
  };
}
