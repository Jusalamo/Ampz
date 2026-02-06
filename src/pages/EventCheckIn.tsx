import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { QRScannerModal } from '@/components/modals/QRScannerModal';

interface EventInfo {
  id: string;
  name: string;
  location: string;
  address: string;
  date: string;
  time: string;
  coverImage: string;
  attendeesCount: number;
}

export default function EventCheckIn() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useApp();
  
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAlreadyCheckedIn, setIsAlreadyCheckedIn] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        setError('Invalid event link');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('events')
          .select('id, name, location, address, date, time, cover_image, attendees_count')
          .eq('id', eventId)
          .eq('is_active', true)
          .single();

        if (fetchError || !data) {
          setError('Event not found or is no longer active');
          setLoading(false);
          return;
        }

        setEvent({
          id: data.id,
          name: data.name,
          location: data.location,
          address: data.address,
          date: data.date,
          time: data.time,
          coverImage: data.cover_image || '',
          attendeesCount: data.attendees_count || 0,
        });

        // Check if user is already checked in
        if (user?.id) {
          const { data: checkIn } = await supabase
            .from('check_ins')
            .select('id')
            .eq('user_id', user.id)
            .eq('event_id', eventId)
            .limit(1);

          if (checkIn && checkIn.length > 0) {
            setIsAlreadyCheckedIn(true);
          }
        }
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, user?.id]);

  const handleCheckIn = () => {
    if (!isAuthenticated) {
      // Redirect to auth with return URL
      navigate(`/auth?redirect=/event/${eventId}/checkin`);
      return;
    }
    setShowScanner(true);
  };

  const handleCheckInSuccess = () => {
    setIsAlreadyCheckedIn(true);
    setShowScanner(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-xl font-bold mb-2">Oops!</h1>
        <p className="text-muted-foreground text-center mb-6">{error || 'Event not found'}</p>
        <Button onClick={() => navigate('/events')}>Browse Events</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Image */}
      <div className="relative h-64">
        {event.coverImage ? (
          <img 
            src={event.coverImage} 
            alt={event.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="px-6 -mt-20 relative z-10">
        <div className="bg-card rounded-3xl p-6 shadow-xl border border-border">
          <h1 className="text-2xl font-bold mb-4">{event.name}</h1>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Calendar className="w-5 h-5" />
              <span>{new Date(event.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Clock className="w-5 h-5" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <MapPin className="w-5 h-5" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Users className="w-5 h-5" />
              <span>{event.attendeesCount} attendees</span>
            </div>
          </div>

          {isAlreadyCheckedIn ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-green-500">You're checked in!</p>
                <p className="text-sm text-muted-foreground">Enjoy the event</p>
              </div>
            </div>
          ) : (
            <Button 
              onClick={handleCheckIn}
              className="w-full h-14 text-lg font-semibold"
              size="lg"
            >
              {isAuthenticated ? 'Check In Now' : 'Sign In to Check In'}
            </Button>
          )}

          {!isAlreadyCheckedIn && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              You'll need to be at the venue to check in
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => navigate(`/event/${eventId}`)}
          >
            View Event Details
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => {
              const { lat, lng } = { lat: 0, lng: 0 }; // Would use event coords
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${event.address}`, '_blank');
            }}
          >
            Get Directions
          </Button>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        userId={user?.id}
        onCheckInSuccess={handleCheckInSuccess}
      />
    </div>
  );
}
