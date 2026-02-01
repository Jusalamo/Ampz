import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateDistance, parseCheckInURL } from '@/lib/qr-utils';
import { Event } from '@/lib/types';
import { isCheckInAllowed } from '@/lib/event-utils';

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
            console.error('Location error:', error);
            reject(new Error('Location permission denied. Please enable location access to check in.'));
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        reject(new Error('Geolocation not supported'));
      }
    });
  }, []);

  const validateQRCodeFast = useCallback(async (
    qrData: string
  ): Promise<{ valid: boolean; eventId?: string; event?: Event; error?: string }> => {
    try {
      const parsed = parseCheckInURL(qrData);
      
      if (!parsed || !parsed.eventId) {
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(qrData)) {
          return { valid: true, eventId: qrData };
        }
        return { valid: false, error: 'Invalid QR code format. Please scan a valid event QR code.' };
      }
      
      const eventId = parsed.eventId;
      
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId)) {
        return { valid: false, error: 'Invalid event ID format' };
      }
      
      return { valid: true, eventId };
      
    } catch (err: any) {
      console.error('QR validation error:', err);
      return { valid: false, error: 'Invalid QR code. Please try again.' };
    }
  }, []);

  const checkGeofencePreview = useCallback((
    event: Event,
    userLat: number,
    userLng: number
  ): { withinGeofence: boolean; distance: number } => {
    if (!event.coordinates?.lat || !event.coordinates?.lng) {
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
      
      const validationResult = await validateQRCodeFast(qrData);
      
      if (!validationResult.valid || !validationResult.eventId) {
        return { 
          success: false, 
          error: validationResult.error || 'Invalid QR code' 
        };
      }
      
      const eventId = validationResult.eventId;
      
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (eventError || !eventData) {
        return { success: false, error: 'Event not found. Please check the QR code.' };
      }
      
      if (!eventData.is_active) {
        return { success: false, error: 'This event is no longer active.' };
      }
      
      // Convert to Event type for validation
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
        endTime: eventData.end_time || '',
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
      
      // Check if check-in is allowed using the new timing logic
      if (!isCheckInAllowed(event)) {
        const now = new Date();
        const eventDate = new Date(eventData.date);
        const [startHours, startMinutes] = eventData.time.split(':').map(Number);
        
        const eventStart = new Date(eventDate);
        eventStart.setHours(startHours, startMinutes, 0, 0);
        
        const checkInStart = new Date(eventStart.getTime() - 30 * 60 * 1000);
        
        let eventEnd: Date;
        if (eventData.end_time) {
          const [endHours, endMinutes] = eventData.end_time.split(':').map(Number);
          eventEnd = new Date(eventDate);
          eventEnd.setHours(endHours, endMinutes, 0, 0);
        } else {
          eventEnd = new Date(eventStart.getTime() + 4 * 60 * 60 * 1000);
        }
        
        if (now < checkInStart) {
          const timeUntil = Math.floor((checkInStart.getTime() - now.getTime()) / (1000 * 60));
          if (timeUntil > 60) {
            const hoursUntil = Math.floor(timeUntil / 60);
            return { 
              success: false, 
              error: `Check-in opens ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''} before the event at ${eventData.time}` 
            };
          } else {
            return { 
              success: false, 
              error: `Check-in opens in ${timeUntil} minute${timeUntil > 1 ? 's' : ''} (30 minutes before event)` 
            };
          }
        } else if (now > eventEnd) {
          return { 
            success: false, 
            error: 'Check-in has ended for this event' 
          };
        }
      }
      
      console.log('Event found:', eventData.name);
      
      const { data: existingCheckIn } = await supabase
        .from('check_ins')
        .select('id, checked_in_at')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .limit(1);
      
      if (existingCheckIn && existingCheckIn.length > 0) {
        const checkInTime = new Date(existingCheckIn[0].checked_in_at);
        const now = new Date();
        const minutesDiff = (now.getTime() - checkInTime.getTime()) / (1000 * 60);
        
        if (minutesDiff < 5) {
          return {
            success: true,
            message: `Already checked in to ${eventData.name}`,
            eventId: eventId,
            checkInId: existingCheckIn[0].id
          };
        }
      }
      
      let location: GeolocationResult;
      
      try {
        location = await getFastLocation();
        console.log('Location obtained:', location);
        
        const preview = checkGeofencePreview(event, location.latitude, location.longitude);
        
        if (!preview.withinGeofence) {
          return {
            success: false,
            error: `You are ${preview.distance}m away from the event location. Please move within ${event.geofenceRadius || 50}m to check in.`,
            eventId: eventId,
            isWithinGeofence: false,
            distance: preview.distance
          };
        }
      } catch (locationError: any) {
        console.log('Location error:', locationError.message);
        return {
          success: false,
          error: 'Location permission denied. Please enable location access to check in.'
        };
      }
      
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
        
        if (errorMessage.includes('already checked in') || errorMessage.includes('already exists')) {
          return { 
            success: true, 
            message: 'You have already checked in to this event',
            eventId: eventId
          };
        }
        
        if (errorMessage.includes('within') && errorMessage.includes('meters')) {
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
        
        if (errorMessage.includes('authenticated')) {
          return { 
            success: false, 
            error: 'Please log in to check in'
          };
        }
        
        if (errorMessage.includes('not found') || errorMessage.includes('not active')) {
          return { 
            success: false, 
            error: 'Event not found or is no longer active'
          };
        }
        
        return { 
          success: false, 
          error: 'Check-in failed. Please try again.' 
        };
      }
      
      return {
        success: true,
        message: `Successfully checked in to ${eventData.name}!`,
        eventId: eventId,
        checkInId: checkInId as string,
        isWithinGeofence: true,
        distance: 0
      };
      
    } catch (err: any) {
      console.error('Check-in process error:', err);
      
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
  }, [userId, validateQRCodeFast, getFastLocation, checkGeofencePreview]);

  const checkInToEventFast = useCallback(async (
    eventId: string,
    visibilityMode: 'public' | 'private' = 'public'
  ): Promise<CheckInResult> => {
    if (!userId) {
      return { success: false, error: 'Please log in to check in' };
    }

    setIsLoading(true);

    try {
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

      const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (!event) {
        return { success: false, error: 'Event not found' };
      }
      
      // Check if check-in is allowed using the new timing logic
      const eventObj: Event = {
        id: event.id,
        name: event.name,
        date: event.date,
        time: event.time,
        endTime: event.end_time || '',
        isActive: event.is_active,
      } as Event;
      
      if (!isCheckInAllowed(eventObj)) {
        const now = new Date();
        const eventDate = new Date(event.date);
        const [startHours, startMinutes] = event.time.split(':').map(Number);
        
        const eventStart = new Date(eventDate);
        eventStart.setHours(startHours, startMinutes, 0, 0);
        
        const checkInStart = new Date(eventStart.getTime() - 30 * 60 * 1000);
        
        let eventEnd: Date;
        if (event.end_time) {
          const [endHours, endMinutes] = event.end_time.split(':').map(Number);
          eventEnd = new Date(eventDate);
          eventEnd.setHours(endHours, endMinutes, 0, 0);
        } else {
          eventEnd = new Date(eventStart.getTime() + 4 * 60 * 60 * 1000);
        }
        
        if (now < checkInStart) {
          return { 
            success: false, 
            error: `Check-in opens 30 minutes before the event at ${event.time}` 
          };
        } else if (now > eventEnd) {
          return { 
            success: false, 
            error: 'Check-in has ended for this event' 
          };
        }
      }
      
      let location: GeolocationResult;
      
      try {
        location = await getFastLocation();
        console.log('Location obtained for direct check-in:', location);
      } catch (locationError) {
        console.log('Location unavailable:', locationError);
        return {
          success: false,
          error: 'Location permission denied. Please enable location access to check in.'
        };
      }
      
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
          const distanceMatch = errorMessage.match(/Current distance: (\d+)/);
          const distance = distanceMatch ? parseInt(distanceMatch[1]) : undefined;
          
          return {
            success: false,
            error: `You are ${distance || 'too far'}m away from the event. Please move within ${event.geofence_radius || 50}m to check in.`,
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
