import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, MapPin, Calendar, Clock, CheckCircle, AlertCircle, LogIn, ArrowLeft, Navigation, Users, UserX, Camera, Plus, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/lib/types';
import { useCheckIn, GeolocationResult } from '@/hooks/useCheckIn';

type CheckInStep = 'idle' | 'checking_location' | 'choose_visibility' | 'create_profile' | 'checking_in' | 'success' | 'already_checked_in';

export default function EventCheckIn() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useApp();
  const { preflightGeofenceCheck, processCheckIn, isLoading: checkInLoading } = useCheckIn(user?.id);

  const [event, setEvent]                   = useState<Event | null>(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [step, setStep]                     = useState<CheckInStep>('idle');
  const [distance, setDistance]             = useState<number | null>(null);
  const [selectedVisibility, setSelectedVisibility] = useState<'public' | 'private' | null>(null);

  // Holds the single GPS result from preflight — reused for the insert
  const [cachedLocation, setCachedLocation] = useState<GeolocationResult | null>(null);

  // Connection profile form state
  const [profilePhoto, setProfilePhoto]     = useState<string>('');
  const [profileName, setProfileName]       = useState('');
  const [profileAge, setProfileAge]         = useState('');
  const [profileBio, setProfileBio]         = useState('');
  const [profileOccupation, setProfileOccupation] = useState('');
  const [profileInterests, setProfileInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest]       = useState('');
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [showCamera, setShowCamera]         = useState(false);
  const [stream, setStream]                 = useState<MediaStream | null>(null);
  const videoRef = useState<HTMLVideoElement | null>(null)[0];
  const canvasRef = useState<HTMLCanvasElement | null>(null)[0];

  const token = searchParams.get('token');

  // ── fetch event on mount ────────────────────────────────────────────────
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

        // Pre-fill profile from user data if available
        if (user) {
          setProfileName(user.displayName || user.name || '');
          // Don't pre-fill photo - user must take a live photo
          
          // Already checked in?
          const { data: existing } = await supabase
            .from('check_ins')
            .select('id')
            .eq('user_id', user.id)
            .eq('event_id', id)
            .limit(1);

          if (existing && existing.length > 0) {
            setStep('already_checked_in');
          }
        }
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, user]);

  // ── user taps "Check In Now" → runs geofence, caches location ──────────
  const handleCheckIn = useCallback(async () => {
    if (!event || !user) return;

    setError(null);
    setStep('checking_location');

    const result = await preflightGeofenceCheck(event.id);

    // Location permission / GPS error
    if (result.error) {
      setError(
        result.error.includes('Location permission') || result.error.includes('location access')
          ? 'Location permission denied. Please enable location access in your browser settings.'
          : result.error
      );
      setStep('idle');
      return;
    }

    setDistance(result.distance ?? null);

    // Outside geofence
    if (!result.success) {
      setError(`You're ${result.distance}m from the venue. Move within ${result.geofenceRadius}m to check in.`);
      setStep('idle');
      return;
    }

    // Geofence passed — cache location and ask for visibility
    setCachedLocation(result.location || null);
    setStep('choose_visibility');
  }, [event, user, preflightGeofenceCheck]);

  // ── user picks public / private ─────────────────────────────────────────
  const handleVisibilityChoice = useCallback(async (visibility: 'public' | 'private') => {
    setSelectedVisibility(visibility);
    
    if (visibility === 'public') {
      // Public → Show profile creation form
      setStep('create_profile');
    } else {
      // Private → Complete check-in immediately
      if (!event || !cachedLocation) {
        setError('Location data missing. Please try checking in again.');
        setStep('idle');
        return;
      }

      setStep('checking_in');
      setError(null);

      const result = await processCheckIn(event, cachedLocation, visibility);

      if (result.success || result.errorType === 'already_checked_in') {
        setStep('success');
      } else {
        setError(result.error || 'Check-in failed. Please try again.');
        setStep('idle');
        setCachedLocation(null);
      }
    }
  }, [event, cachedLocation, processCheckIn]);

  // ── create connection profile and complete check-in ─────────────────────
  const handleCreateProfile = useCallback(async () => {
    if (!event || !cachedLocation || !user) {
      setError('Missing required data. Please try again.');
      return;
    }

    // Validation
    if (!profileName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!profileAge.trim() || isNaN(Number(profileAge)) || Number(profileAge) < 18) {
      setError('Please enter a valid age (18+)');
      return;
    }
    if (!profileBio.trim()) {
      setError('Please add a short bio');
      return;
    }
    if (!profilePhoto) {
      setError('Please take a photo for your profile');
      return;
    }

    setCreatingProfile(true);
    setError(null);

    try {
      // First, complete the check-in
      setStep('checking_in');
      const checkInResult = await processCheckIn(event, cachedLocation, 'public');

      if (!checkInResult.success && checkInResult.errorType !== 'already_checked_in') {
        setError(checkInResult.error || 'Check-in failed. Please try again.');
        setStep('create_profile');
        setCreatingProfile(false);
        return;
      }

      // Then, create the connection profile
      const { data: profileData, error: profileError } = await supabase
        .from('connection_profiles')
        .insert({
          user_id: user.id,
          event_id: event.id,
          name: profileName.trim(),
          age: Number(profileAge),
          bio: profileBio.trim(),
          photo: profilePhoto, // Base64 image from camera
          occupation: profileOccupation.trim() || null,
          interests: profileInterests.length > 0 ? profileInterests : null,
          location: event.location,
          event_name: event.name,
          gender: null,
        })
        .select('id')
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Check-in succeeded but profile failed - still redirect but show warning
        navigate('/connect', { 
          replace: true,
          state: { warning: 'Checked in successfully, but profile creation failed. Please update your profile.' }
        });
        return;
      }

      // Success! Redirect to Connect/Swipe page
      navigate('/connect', { replace: true });

    } catch (err) {
      console.error('Error during profile creation:', err);
      setError('Failed to create profile. Please try again.');
      setStep('create_profile');
    } finally {
      setCreatingProfile(false);
    }
  }, [event, cachedLocation, user, profileName, profileAge, profileBio, profilePhoto, profileOccupation, profileInterests, processCheckIn, navigate]);

  // ── add interest tag ────────────────────────────────────────────────────
  const handleAddInterest = useCallback(() => {
    const trimmed = newInterest.trim();
    if (trimmed && !profileInterests.includes(trimmed) && profileInterests.length < 10) {
      setProfileInterests([...profileInterests, trimmed]);
      setNewInterest('');
    }
  }, [newInterest, profileInterests]);

  // ── remove interest tag ─────────────────────────────────────────────────
  const handleRemoveInterest = useCallback((interest: string) => {
    setProfileInterests(profileInterests.filter(i => i !== interest));
  }, [profileInterests]);

  // ── start camera ────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 640 } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      
      // Wait for video element to be available
      setTimeout(() => {
        if (videoRef) {
          videoRef.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Camera access denied. Please enable camera permissions.');
    }
  }, []);

  // ── stop camera ─────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  }, [stream]);

  // ── take photo ──────────────────────────────────────────────────────────
  const takePhoto = useCallback(() => {
    if (!videoRef || !canvasRef) return;
    
    const context = canvasRef.getContext('2d');
    if (!context) return;

    // Set canvas size to match video
    canvasRef.width = videoRef.videoWidth;
    canvasRef.height = videoRef.videoHeight;

    // Draw video frame to canvas
    context.drawImage(videoRef, 0, 0);

    // Convert to base64 image
    const photoData = canvasRef.toDataURL('image/jpeg', 0.8);
    setProfilePhoto(photoData);
    
    // Stop camera
    stopCamera();
  }, [stopCamera]);

  // ── cleanup camera on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // ── loading ─────────────────────────────────────────────────────────────
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── hard error / event not found ────────────────────────────────────────
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

  // ── format date for display ─────────────────────────────────────────────
  let formattedDate = event.date;
  try {
    formattedDate = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {}

  // ── not logged in → show event info + login CTA ────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
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
            <Button variant="ghost" className="mb-4 -ml-2" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

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

            <div className="bg-primary/10 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
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
              <Button variant="outline" className="flex-1" onClick={() => navigate(`/event/${event.id}`)}>
                View Event
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── success (only for PRIVATE check-ins) / already checked in ──────────
  if (step === 'success' || step === 'already_checked_in') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {step === 'already_checked_in' ? 'Already Checked In!' : "You're Checked In!"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {step === 'already_checked_in'
              ? `You're already checked in to ${event.name}`
              : `Welcome to ${event.name} (Private Mode)`}
          </p>
          {distance !== null && (
            <p className="text-sm text-green-600 dark:text-green-400 mb-4">
              <MapPin className="w-4 h-4 inline mr-1" />
              Checked in from {distance}m away
            </p>
          )}
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate(`/event/${event.id}`)} className="w-full">View Event</Button>
            <Button variant="outline" onClick={() => navigate('/connect')}>Meet People</Button>
            <Button variant="ghost" onClick={() => navigate('/events')}>Browse More Events</Button>
          </div>
        </div>
      </div>
    );
  }

  // ── create profile screen (PUBLIC visibility only) ──────────────────────
  if (step === 'create_profile') {
    return (
      <div className="min-h-screen bg-background overflow-y-auto pb-20">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Button variant="ghost" className="mb-4 -ml-2" onClick={() => setStep('choose_visibility')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">Create Your Profile</h1>
            <p className="text-muted-foreground">
              Let others at {event.name} know who you are
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-6 bg-card rounded-2xl p-6 border border-border">
            {/* Photo - Camera View or Captured Photo */}
            <div>
              <label className="block text-sm font-medium mb-2">Profile Photo *</label>
              
              {showCamera ? (
                /* Camera View */
                <div className="space-y-3">
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black">
                    <video
                      ref={(el) => {
                        if (el) {
                          videoRef = el;
                          if (stream) el.srcObject = stream;
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={takePhoto}
                      className="flex-1"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Take Photo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={stopCamera}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : profilePhoto ? (
                /* Captured Photo Preview */
                <div className="space-y-3">
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-muted">
                    <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={startCamera}
                    className="w-full"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Retake Photo
                  </Button>
                </div>
              ) : (
                /* No Photo - Show Camera Button */
                <div className="space-y-3">
                  <div className="w-full aspect-square rounded-xl bg-muted flex flex-col items-center justify-center border-2 border-dashed border-border">
                    <Camera className="w-16 h-16 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Take a live photo</p>
                  </div>
                  <Button
                    type="button"
                    onClick={startCamera}
                    className="w-full"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Open Camera
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Take a clear photo of yourself for your profile
              </p>
            </div>

            {/* Hidden canvas for photo capture */}
            <canvas
              ref={(el) => { if (el) canvasRef = el; }}
              style={{ display: 'none' }}
            />

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <Input
                type="text"
                placeholder="Your name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                maxLength={50}
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium mb-2">Age *</label>
              <Input
                type="number"
                placeholder="18+"
                value={profileAge}
                onChange={(e) => setProfileAge(e.target.value)}
                min={18}
                max={100}
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium mb-2">Bio *</label>
              <Textarea
                placeholder="Tell people about yourself..."
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value)}
                maxLength={500}
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">{profileBio.length}/500 characters</p>
            </div>

            {/* Occupation */}
            <div>
              <label className="block text-sm font-medium mb-2">Occupation (optional)</label>
              <Input
                type="text"
                placeholder="e.g., Software Engineer, Designer"
                value={profileOccupation}
                onChange={(e) => setProfileOccupation(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium mb-2">Interests (optional)</label>
              <div className="flex gap-2 mb-2">
                <Input
                  type="text"
                  placeholder="Add an interest..."
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
                  maxLength={30}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddInterest}
                  disabled={!newInterest.trim() || profileInterests.length >= 10}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {profileInterests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profileInterests.map((interest, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30"
                    >
                      <span className="text-sm">{interest}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveInterest(interest)}
                        className="hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Maximum 10 interests</p>
            </div>

            {/* Submit */}
            <Button
              className="w-full h-12 text-lg font-semibold"
              onClick={handleCreateProfile}
              disabled={creatingProfile || step === 'checking_in'}
            >
              {creatingProfile || step === 'checking_in' ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                'Complete Check-In'
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── visibility choice screen ────────────────────────────────────────────
  if (step === 'choose_visibility') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-1">You're at {event.name}!</h1>
            {distance !== null && (
              <p className="text-sm text-green-600 dark:text-green-400">
                <MapPin className="w-4 h-4 inline mr-1" />
                {distance}m from venue • Within range
              </p>
            )}
            <p className="text-muted-foreground mt-2">How would you like to appear at this event?</p>
          </div>

          <div className="space-y-3 mb-6">
            {/* Public */}
            <button
              onClick={() => handleVisibilityChoice('public')}
              className="w-full p-4 rounded-xl bg-card border-2 border-primary/50 hover:border-primary transition-colors text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Public</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Best for networking</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Others can see your profile and connect with you</p>
            </button>

            {/* Private */}
            <button
              onClick={() => handleVisibilityChoice('private')}
              className="w-full p-4 rounded-xl bg-card border border-border hover:border-muted-foreground transition-colors text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <UserX className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold">Private</p>
                  <p className="text-xs text-muted-foreground">Browse anonymously</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">You can see others but they won't see you</p>
            </button>
          </div>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => {
              setStep('idle');
              setCachedLocation(null);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // ── main check-in page (idle / checking_location) ──────────────────────
  return (
    <div className="min-h-screen bg-background">
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
          <Button variant="ghost" className="mb-4 -ml-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

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

          {/* Geofence info banner */}
          <div className="bg-primary/10 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <Navigation className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-primary">Geofence Check Required</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You must be within {event.geofenceRadius}m of the venue to check in
                </p>
              </div>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Check-In Failed</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Check-in button */}
          <Button
            className="w-full h-14 text-lg font-semibold"
            onClick={handleCheckIn}
            disabled={step === 'checking_location'}
          >
            {step === 'checking_location' ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Checking Location...
              </>
            ) : (
              'Check In Now'
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Your location will be verified before check-in
          </p>
        </div>
      </div>
    </div>
  );
}
