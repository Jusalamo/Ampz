import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, MapPin, Calendar, Clock, CheckCircle, AlertCircle, LogIn } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/lib/types';
import { validateEventToken, calculateDistance } from '@/lib/qr-utils';

export default function EventCheckIn() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useApp();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) {
        setError('Invalid event ID');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError || !data) {
          setError('Event not found');
          setLoading(false);
          return;
        }

        // Map to Event type
        const eventData: Event = {
          id: data.id,
          name: data.name,
          description: data.description || '',
          category: data.category,
          location: data.location,
          address: data.address,
          coordinates: { lat: data.latitude, lng: data.longitude },
          date: data.date,
          time: data.time,
          price: data.price || 0,
          currency: data.currency || 'NAD',
          maxAttendees: data.max_attendees || 500,
          attendees: data.attendees_count || 0,
          organizerId: data.organizer_id,
          qrCode: data.qr_code,
          geofenceRadius: data.geofence_radius || 50,
          customTheme: data.custom_theme || '#8B5CF6',
          coverImage: data.cover_image || '',
          images: data.images || [],
          videos: data.videos || [],
          tags: data.tags || [],
          isFeatured: data.is_featured || false,
          isDemo: data.is_demo || false,
          isActive: data.is_active ?? true,
        };

        setEvent(eventData);
      } catch {
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleCheckIn = async () => {
    if (!event || !user) return;

    setCheckingIn(true);
    setLocationError(null);

    try {
      // Get user location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      // Calculate distance
      const distance = calculateDistance(
        userLat,
        userLng,
        event.coordinates.lat,
        event.coordinates.lng
      );

      const withinGeofence = distance <= event.geofenceRadius;

      if (!withinGeofence) {
        setLocationError(`You are ${Math.round(distance)}m away. Please move within ${event.geofenceRadius}m of the venue.`);
        setCheckingIn(false);
        return;
      }

      // Create check-in record
      const { error: checkInError } = await supabase
        .from('check_ins')
        .insert({
          user_id: user.id,
          event_id: event.id,
          check_in_latitude: userLat,
          check_in_longitude: userLng,
          within_geofence: true,
          distance_from_venue: distance,
          visibility_mode: 'public',
          verification_method: 'qr_scan',
          checked_in_at: new Date().toISOString(),
        });

      if (checkInError) {
        setError('Failed to check in. Please try again.');
        setCheckingIn(false);
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      if (err.code === 1) {
        setLocationError('Location permission denied. Please enable location access.');
      } else if (err.code === 2) {
        setLocationError('Unable to get your location. Please try again.');
      } else if (err.code === 3) {
        setLocationError('Location request timed out. Please try again.');
      } else {
        setError('Check-in failed. Please try again.');
      }
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-xl font-bold mb-2">{error}</h1>
          <Button onClick={() => navigate('/events')}>Browse Events</Button>
        </div>
      </div>
    );
  }

  if (!event) return null;

  // Format date
  let formattedDate = event.date;
  try {
    formattedDate = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {}

  // If not authenticated, show public event page with login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        {/* Event Header */}
        <div className="relative h-48">
          <img
            src={event.coverImage || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800'}
            alt={event.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="px-4 -mt-12 relative z-10">
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h1 className="text-2xl font-bold mb-2">{event.name}</h1>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            </div>

            <p className="text-muted-foreground mb-6">{event.description}</p>

            {/* Login/Signup CTA */}
            <div className="bg-primary/10 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <LogIn className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="font-semibold">Sign in to check in</h3>
                  <p className="text-sm text-muted-foreground">
                    Create an account or log in to check in to this event
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={() => navigate(`/auth?redirect=/event/${event.id}/checkin${token ? `?token=${token}` : ''}`)}
              >
                Sign In
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate(`/event/${event.id}`)}
              >
                View Event
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">You're Checked In!</h1>
          <p className="text-muted-foreground mb-6">Welcome to {event.name}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate(`/event/${event.id}`)}>
              View Event
            </Button>
            <Button variant="outline" onClick={() => navigate('/connect')}>
              Meet People
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated check-in flow
  return (
    <div className="min-h-screen bg-background">
      {/* Event Header */}
      <div className="relative h-48">
        <img
          src={event.coverImage || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800'}
          alt={event.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="px-4 -mt-12 relative z-10">
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h1 className="text-2xl font-bold mb-2">{event.name}</h1>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
          </div>

          {/* Location Error */}
          {locationError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Location Check Failed</p>
                  <p className="text-sm text-muted-foreground mt-1">{locationError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Check-in Button */}
          <Button
            className="w-full h-14 text-lg font-semibold"
            onClick={handleCheckIn}
            disabled={checkingIn}
          >
            {checkingIn ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Verifying Location...
              </>
            ) : (
              'Check In Now'
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-4">
            You must be within {event.geofenceRadius}m of the venue to check in
          </p>
        </div>
      </div>
    </div>
  );
}
