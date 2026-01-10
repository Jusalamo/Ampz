import QRCode from 'qrcode';

// Generate a unique access token for an event
export function generateEventToken(eventId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const raw = `${eventId}-${timestamp}-${random}`;
  // Simple encryption (in production, use proper encryption)
  return btoa(raw).replace(/[+/=]/g, (c) => 
    c === '+' ? '-' : c === '/' ? '_' : ''
  );
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

// Generate QR code data URL
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

// Build check-in URL for an event
export function buildCheckInURL(eventId: string, token: string): string {
  const baseURL = window.location.origin + window.location.pathname.replace(/\/$/, '');
  return `${baseURL}#/event/${eventId}/checkin?token=${token}`;
}

// Parse check-in URL and extract event ID and token
export function parseCheckInURL(url: string): { eventId: string; token: string } | null {
  try {
    // Handle both regular URLs and hash-based URLs
    const hashMatch = url.match(/\/event\/([^/]+)\/checkin\?token=([^&]+)/);
    if (hashMatch) {
      return { eventId: hashMatch[1], token: hashMatch[2] };
    }
    return null;
  } catch (error) {
    console.error('Error parsing check-in URL:', error);
    return null;
  }
}

// Validate event token
export function validateEventToken(token: string, eventId: string): boolean {
  try {
    // Reverse the encoding
    const padded = token.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(padded);
    return decoded.startsWith(eventId);
  } catch (error) {
    return false;
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
