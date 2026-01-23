import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';

// Generate a SHA-256 hash for secure token storage
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate a unique access token for an event
export function generateEventToken(eventId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const raw = `${eventId}-${timestamp}-${random}`;
  // Simple encoding for URL-safe token
  return btoa(raw).replace(/[+/=]/g, (c) => 
    c === '+' ? '-' : c === '/' ? '_' : ''
  );
}

// Generate a cryptographically secure token and store hash server-side
export async function generateSecureEventToken(
  eventId: string,
  expiresAt?: Date
): Promise<{ token: string; tokenId: string } | null> {
  try {
    // Generate secure random token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    
    // Hash the token for storage
    const tokenHash = await hashToken(token);
    
    // Store hash server-side via RPC
    const { data, error } = await supabase.rpc('create_event_token', {
      p_event_id: eventId,
      p_token_hash: tokenHash,
      p_expires_at: expiresAt?.toISOString() || null,
    });
    
    if (error) {
      console.error('Error creating event token:', error);
      return null;
    }
    
    return { token, tokenId: data };
  } catch (error) {
    console.error('Error generating secure token:', error);
    return null;
  }
}

// Generate a unique access code (human readable)
export function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate QR code data URL with geofence check endpoint
export async function generateQRCodeDataURL(data: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    });
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

// Build check-in URL for an event with geofence validation
export function buildCheckInURL(eventId: string, token: string): string {
  const baseURL = window.location.origin;
  return `${baseURL}/event/${eventId}/checkin?token=${token}&checkGeofence=true`;
}

// Parse check-in URL and extract event ID and token
export function parseCheckInURL(url: string): { eventId: string; token: string } | null {
  try {
    // Handle multiple URL formats:
    // 1. Regular check-in URL with token: /event/{id}/checkin?token={token}
    // 2. Event page URL: /event/{id}
    // 3. Event check-in page URL: /event/{id}/checkin
    
    // Remove any hash or query parameters for basic parsing
    const cleanUrl = url.split('#')[0].split('?')[0];
    
    // Try to extract event ID from URL
    const eventIdMatch = cleanUrl.match(/\/event\/([^/]+)(\/checkin)?$/);
    if (!eventIdMatch) return null;
    
    const eventId = eventIdMatch[1];
    
    // Extract token from query parameters if present
    const urlObj = new URL(url, window.location.origin);
    const token = urlObj.searchParams.get('token');
    
    return { eventId, token: token || '' };
  } catch (error) {
    console.error('Error parsing check-in URL:', error);
    return null;
  }
}

// Extract event ID from URL
export function extractEventIdFromURL(url: string): string | null {
  try {
    const cleanUrl = url.split('#')[0].split('?')[0];
    const eventIdMatch = cleanUrl.match(/\/event\/([^/]+)(\/checkin)?$/);
    return eventIdMatch ? eventIdMatch[1] : null;
  } catch (error) {
    console.error('Error extracting event ID from URL:', error);
    return null;
  }
}

// Client-side token validation (for backwards compatibility and basic checks)
export function validateEventToken(token: string, eventId: string): boolean {
  if (!token) return false;
  
  try {
    // Reverse the encoding
    const padded = token.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(padded);
    return decoded.startsWith(eventId);
  } catch (error) {
    return false;
  }
}

// Server-side secure token validation with geofence check
export async function validateSecureEventToken(
  token: string,
  eventId: string
): Promise<{ valid: boolean; requiresGeofence?: boolean }> {
  if (!token) return { valid: false };
  
  try {
    // Hash the token to compare with stored hash
    const tokenHash = await hashToken(token);
    
    // Validate server-side
    const { data, error } = await supabase.rpc('validate_event_token', {
      p_token_hash: tokenHash,
      p_event_id: eventId,
    });
    
    if (error) {
      console.error('Error validating token:', error);
      return { valid: false };
    }
    
    return { valid: data === true, requiresGeofence: true };
  } catch (error) {
    console.error('Error in secure token validation:', error);
    return { valid: false };
  }
}

// Calculate distance between two coordinates in meters (Haversine formula)
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Check if user is within geofence
export function isWithinGeofence(
  userLat: number,
  userLng: number,
  eventLat: number,
  eventLng: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(userLat, userLng, eventLat, eventLng);
  return distance <= radiusMeters;
}

// Download QR code as image
export async function downloadQRCode(eventName: string, qrDataUrl: string): Promise<void> {
  const link = document.createElement('a');
  link.download = `${eventName.replace(/[^a-zA-Z0-9]/g, '-')}-qr-code.png`;
  link.href = qrDataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// New function: Generate QR code URL that includes geofence check
export function generateEventQRCodeURL(eventId: string, token?: string): string {
  const baseURL = window.location.origin;
  const checkinURL = `${baseURL}/event/${eventId}/checkin`;
  
  if (token) {
    return `${checkinURL}?token=${token}&checkGeofence=true`;
  }
  
  return checkinURL;
}

// New function: Validate geofence for check-in
export async function validateGeofenceForCheckIn(
  eventId: string,
  userLat: number,
  userLng: number
): Promise<{ valid: boolean; distance?: number; error?: string }> {
  try {
    // Fetch event details including coordinates and geofence radius
    const { data: event, error } = await supabase
      .from('events')
      .select('latitude, longitude, geofence_radius')
      .eq('id', eventId)
      .single();
    
    if (error || !event) {
      return { valid: false, error: 'Event not found' };
    }
    
    const distance = calculateDistance(
      userLat,
      userLng,
      event.latitude,
      event.longitude
    );
    
    const withinGeofence = distance <= (event.geofence_radius || 50);
    
    return {
      valid: withinGeofence,
      distance: Math.round(distance),
      error: withinGeofence ? undefined : `You are ${Math.round(distance)}m away from the event venue. Please move within ${event.geofence_radius || 50}m to check in.`
    };
  } catch (error) {
    console.error('Error validating geofence:', error);
    return { valid: false, error: 'Failed to validate location' };
  }
}
