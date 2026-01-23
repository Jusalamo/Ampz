import { supabase } from '@/integrations/supabase/client';

// Parse check-in URL from QR code
export const parseCheckInURL = (url: string): { eventId: string; token?: string } | null => {
  try {
    // Try to parse as URL first
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      // If not a valid URL, try to extract event ID directly
      const eventIdMatch = url.match(/event\/([^/]+)/);
      if (eventIdMatch) {
        return { eventId: eventIdMatch[1] };
      }
      return null;
    }

    // Check if it's a check-in URL
    const pathParts = parsedUrl.pathname.split('/');
    const eventIndex = pathParts.indexOf('event');
    
    if (eventIndex !== -1 && pathParts.length > eventIndex + 1) {
      const eventId = pathParts[eventIndex + 1];
      const token = parsedUrl.searchParams.get('token') || undefined;
      
      return { eventId, token };
    }
    
    return null;
  } catch {
    return null;
  }
};

// Validate event token (legacy client-side validation)
export const validateEventToken = (token: string, eventId: string): boolean => {
  try {
    // Legacy token format: simple hash of eventId + secret
    const expectedToken = btoa(eventId + '-amps-checkin').slice(0, 8);
    return token === expectedToken;
  } catch {
    return false;
  }
};

// Validate secure event token (server-side)
export const validateSecureEventToken = async (token: string, eventId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('event_tokens')
      .select('id, expires_at')
      .eq('token', token)
      .eq('event_id', eventId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return false;
    }

    // Check if token is expired
    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at);
      if (expiresAt < new Date()) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
};

// Calculate distance between two coordinates in meters
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Check if coordinates are within geofence
export const isWithinGeofence = (
  userLat: number,
  userLng: number,
  eventLat: number,
  eventLng: number,
  radius: number
): boolean => {
  const distance = calculateDistance(userLat, userLng, eventLat, eventLng);
  return distance <= radius;
};

// Generate check-in URL for QR code
export const generateCheckInURL = (eventId: string, token?: string): string => {
  const baseUrl = `${window.location.origin}/event/${eventId}/checkin`;
  return token ? `${baseUrl}?token=${token}` : baseUrl;
};
