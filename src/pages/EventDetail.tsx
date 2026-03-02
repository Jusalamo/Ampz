import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, Calendar, MapPin, Users, Clock, Share2, Bookmark, 
  Ticket, ExternalLink, MessageCircle, Image, ChevronDown, ChevronUp,
  Play, Pause, Volume2, VolumeX, Maximize2, Grid3x3, ChevronLeft, ChevronRight,
  X
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { CommunityPhotos } from '@/components/CommunityPhotos';
import { CommunityComments } from '@/components/CommunityComments';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

// Import Event type from lib
import { Event as EventType } from '@/lib/types';

// Attendee type for real data
interface EventAttendee {
  id: string;
  name: string;
  profilePhoto: string | null;
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, user, bookmarkEvent, communityPhotos, communityComments, tickets, checkInToEvent } = useApp();
  const { toast } = useToast();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'photos' | 'comments'>('details');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const [isFullscreenVideoPlaying, setIsFullscreenVideoPlaying] = useState(true);
  const [isFullscreenVideoMuted, setIsFullscreenVideoMuted] = useState(false);
  const [realAttendees, setRealAttendees] = useState<EventAttendee[]>([]);
  const [isRsvping, setIsRsvping] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  const lastScrollY = useRef(0);
  const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoPlaybackStateRef = useRef({
    currentTime: 0,
    isPlaying: true,
    isMuted: true
  });

  // Memoize event find for better performance
  const event = useMemo(() => 
    events.find((e) => e.id === id), 
    [events, id]
  );

  const isBookmarked = useMemo(() => 
    user?.bookmarkedEvents.includes(id ?? ''), 
    [user, id]
  );

  const eventPhotos = useMemo(() => 
    communityPhotos.filter((p) => p.eventId === id), 
    [communityPhotos, id]
  );

  const eventComments = useMemo(() => 
    communityComments.filter((c) => c.eventId === id), 
    [communityComments, id]
  );

  const hasTicket = useMemo(() => 
    tickets.some(t => t.eventId === id && (t.status === 'active' || t.status === 'used')), 
    [tickets, id]
  );

  const hasRsvp = useMemo(() => 
    tickets.some(t => t.eventId === id), 
    [tickets, id]
  );

  // Memoize derived values
  const isLive = useMemo(() => 
    event ? new Date(event.date) <= new Date() : false, 
    [event]
  );

  const descriptionTruncated = useMemo(() => 
    (event?.description?.length ?? 0) > 150, 
    [event]
  );

  // Fetch real attendees from check_ins
  useEffect(() => {
    if (!id) return;
    const fetchAttendees = async () => {
      const { data } = await supabase
        .from('check_ins')
        .select('user_id')
        .eq('event_id', id)
        .eq('visibility_mode', 'public')
        .limit(6);
      
      if (data && data.length > 0) {
        const userIds = data.map(d => d.user_id).filter(Boolean) as string[];
        const { data: profiles } = await supabase
          .from('profiles_public')
          .select('id, name, profile_photo')
          .in('id', userIds);
        
        setRealAttendees((profiles || []).map(p => ({
          id: p.id || '',
          name: p.name || 'Anonymous',
          profilePhoto: p.profile_photo
        })));
      }
    };
    fetchAttendees();

    // Subscribe to new check-ins for real-time count
    const channel = supabase
      .channel(`event-checkins-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'check_ins', filter: `event_id=eq.${id}` }, () => {
        fetchAttendees();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // RSVP handler
  const handleRsvp = useCallback(async () => {
    if (!event || !user) return;
    setIsRsvping(true);
    try {
      const { error } = await supabase.from('tickets').insert({
        event_id: event.id,
        user_id: user.id,
        purchase_source: 'rsvp',
        purchase_reference: `rsvp-${event.id}-${Date.now()}`,
        qr_code: `rsvp-${event.id}-${user.id}`,
        amount_paid: 0,
        currency: event.currency || 'NAD',
        ticket_status: 'active',
        payment_status: 'rsvp_pending',
      });
      if (error) throw error;
      toast({ title: 'RSVPed!', description: 'Event added to your ticket box!' });
    } catch (err: any) {
      toast({ title: 'RSVP Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsRsvping(false);
    }
  }, [event, user, toast]);

  // Get CTA text with proper memoization
  const getCTAText = useCallback(() => {
    if (!user) return 'Buy Ticket';
    if (hasTicket && isLive) return 'Check In Now';
    if (hasTicket) return 'View Ticket';
    return event?.price === 0 ? 'Register Free' : `Buy Now - ${event?.currency || 'N'}$${event?.price}`;
  }, [user, hasTicket, isLive, event]);

  // Auto-rotate carousel
  const startCarouselRotation = useCallback(() => {
    if (event?.mediaType === 'carousel' && event.images && event.images.length > 1) {
      if (carouselIntervalRef.current) clearInterval(carouselIntervalRef.current);
      carouselIntervalRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => {
          if (!event.images) return prev;
          return (prev + 1) % event.images.length;
        });
      }, 5000);
    }
  }, [event?.mediaType, event?.images?.length]);

  const stopCarouselRotation = useCallback(() => {
    if (carouselIntervalRef.current) {
      clearInterval(carouselIntervalRef.current);
      carouselIntervalRef.current = null;
    }
  }, []);

  const nextImage = useCallback(() => {
    if (event?.images && event.images.length > 0) {
      stopCarouselRotation();
      setCurrentImageIndex((prev) => (prev + 1) % event.images.length);
      setTimeout(() => startCarouselRotation(), 3000);
    }
  }, [event?.images?.length, startCarouselRotation, stopCarouselRotation]);

  const prevImage = useCallback(() => {
    if (event?.images && event.images.length > 0) {
      stopCarouselRotation();
      setCurrentImageIndex((prev) => (prev - 1 + event.images.length) % event.images.length);
      setTimeout(() => startCarouselRotation(), 3000);
    }
  }, [event?.images?.length, startCarouselRotation, stopCarouselRotation]);

  // Video handlers
  const toggleVideoPlay = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsVideoPlaying(true);
        setIsVideoEnded(false);
        videoPlaybackStateRef.current.isPlaying = true;
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
        videoPlaybackStateRef.current.isPlaying = false;
      }
    }
  }, []);

  const toggleVideoMute = useCallback(() => {
    if (videoRef.current) {
      const newMutedState = !videoRef.current.muted;
      videoRef.current.muted = newMutedState;
      setIsVideoMuted(newMutedState);
      videoPlaybackStateRef.current.isMuted = newMutedState;
    }
  }, []);

  const toggleFullscreenVideoPlay = useCallback(() => {
    if (fullscreenVideoRef.current) {
      if (fullscreenVideoRef.current.paused) {
        fullscreenVideoRef.current.play();
        setIsFullscreenVideoPlaying(true);
      } else {
        fullscreenVideoRef.current.pause();
        setIsFullscreenVideoPlaying(false);
      }
    }
  }, []);

  const toggleFullscreenVideoMute = useCallback(() => {
    if (fullscreenVideoRef.current) {
      const newMutedState = !fullscreenVideoRef.current.muted;
      fullscreenVideoRef.current.muted = newMutedState;
      setIsFullscreenVideoMuted(newMutedState);
    }
  }, []);

  const openVideoModal = useCallback(() => {
    if (videoRef.current) {
      videoPlaybackStateRef.current.currentTime = videoRef.current.currentTime;
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
    setIsVideoModalOpen(true);
  }, []);

  const closeVideoModal = useCallback(() => {
    setIsVideoModalOpen(false);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.muted = videoPlaybackStateRef.current.isMuted;
        videoRef.current.currentTime = videoPlaybackStateRef.current.currentTime;
        if (videoPlaybackStateRef.current.isPlaying) {
          videoRef.current.play().catch(() => setIsVideoPlaying(false));
          setIsVideoPlaying(true);
        }
        setIsVideoMuted(videoPlaybackStateRef.current.isMuted);
      }
    }, 100);
  }, []);

  const handleVideoPlay = useCallback(() => { setIsVideoPlaying(true); setIsVideoEnded(false); videoPlaybackStateRef.current.isPlaying = true; }, []);
  const handleVideoPause = useCallback(() => { setIsVideoPlaying(false); videoPlaybackStateRef.current.isPlaying = false; }, []);
  const handleVideoEnded = useCallback(() => { setIsVideoPlaying(false); setIsVideoEnded(true); videoPlaybackStateRef.current.isPlaying = false; }, []);
  const handleFullscreenVideoPlay = useCallback(() => setIsFullscreenVideoPlaying(true), []);
  const handleFullscreenVideoPause = useCallback(() => setIsFullscreenVideoPlaying(false), []);
  const handleFullscreenVideoEnded = useCallback(() => setIsFullscreenVideoPlaying(false), []);

  const setupMainVideo = useCallback(() => {
    const videoElement = videoRef.current;
    if (videoElement && event?.mediaType === 'video' && event.videos?.length > 0) {
      const handlePlay = () => handleVideoPlay();
      const handlePause = () => handleVideoPause();
      const handleEnded = () => handleVideoEnded();
      videoElement.addEventListener('play', handlePlay);
      videoElement.addEventListener('pause', handleVideoPause);
      videoElement.addEventListener('ended', handleVideoEnded);
      videoElement.muted = true;
      videoElement.loop = true;
      videoElement.preload = "auto";
      if (videoPlaybackStateRef.current.currentTime > 0) videoElement.currentTime = videoPlaybackStateRef.current.currentTime;
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise.then(() => { setIsVideoPlaying(true); videoPlaybackStateRef.current.isPlaying = true; })
          .catch(() => { videoPlaybackStateRef.current.isPlaying = false; setIsVideoPlaying(false); });
      }
      return () => {
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [event?.mediaType, event?.videos, handleVideoPlay, handleVideoPause, handleVideoEnded]);

  const setupFullscreenVideo = useCallback(() => {
    const el = fullscreenVideoRef.current;
    if (el && isVideoModalOpen && event?.mediaType === 'video' && event.videos?.length > 0) {
      const handlePlay = () => handleFullscreenVideoPlay();
      const handlePause = () => handleFullscreenVideoPause();
      const handleEnded = () => handleFullscreenVideoEnded();
      el.addEventListener('play', handlePlay);
      el.addEventListener('pause', handlePause);
      el.addEventListener('ended', handleEnded);
      el.loop = true;
      el.muted = isFullscreenVideoMuted;
      el.currentTime = videoPlaybackStateRef.current.currentTime;
      el.play().catch(() => setIsFullscreenVideoPlaying(false));
      return () => {
        el.removeEventListener('play', handlePlay);
        el.removeEventListener('pause', handlePause);
        el.removeEventListener('ended', handleEnded);
      };
    }
  }, [isVideoModalOpen, event?.mediaType, event?.videos, isFullscreenVideoMuted, handleFullscreenVideoPlay, handleFullscreenVideoPause, handleFullscreenVideoEnded]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (videoRef.current && event?.mediaType === 'video') {
        if (document.hidden) {
          videoPlaybackStateRef.current.currentTime = videoRef.current.currentTime;
          videoPlaybackStateRef.current.isPlaying = !videoRef.current.paused;
        } else {
          if (videoPlaybackStateRef.current.isPlaying) {
            videoRef.current.currentTime = videoPlaybackStateRef.current.currentTime;
            videoRef.current.muted = true;
            videoRef.current.play().catch(() => {});
            setIsVideoPlaying(true);
            setIsVideoMuted(true);
          }
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [event?.mediaType]);

  useEffect(() => {
    if (event?.mediaType === 'video') {
      const cleanup = setupMainVideo();
      return cleanup;
    } else if (event?.mediaType === 'carousel') {
      startCarouselRotation();
      return () => stopCarouselRotation();
    }
  }, [event?.mediaType, event?.id, setupMainVideo, startCarouselRotation, stopCarouselRotation]);

  useEffect(() => {
    if (isVideoModalOpen && event?.mediaType === 'video') setupFullscreenVideo();
  }, [isVideoModalOpen, event?.mediaType, setupFullscreenVideo]);

  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVideoModalOpen) closeVideoModal();
    };
    if (isVideoModalOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isVideoModalOpen, closeVideoModal]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (Math.abs(currentScrollY - lastScrollY.current) > 5) {
        setIsScrolled(currentScrollY > 50);
        lastScrollY.current = currentScrollY;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'auto';
    };
  }, []);

  const handleShare = useCallback(async () => {
    if (!event) return;
    const shareData = { title: event.name, text: `Check out ${event.name} on Amps!`, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: 'Link copied!', description: 'Event link has been copied to clipboard' });
      }
    } catch {}
  }, [event, toast]);

  const handleBookmark = useCallback(() => { if (event) bookmarkEvent(event.id); }, [event, bookmarkEvent]);
  const handleBack = useCallback(() => navigate(-1), [navigate]);

  const handleNavigateToMap = useCallback(() => {
    if (!event) return;
    const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(event.location + ' ' + event.address)}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  }, [event]);

  const toggleDescription = useCallback(() => setShowFullDescription(prev => !prev), []);

  const handleCTAClick = useCallback(() => {
    if (!event) return;
    if (!user) { navigate('/auth'); return; }
    if (hasTicket && isLive) {
      checkInToEvent(event.id, true);
      toast({ title: 'Checked in!', description: 'You have successfully checked in to the event.' });
    } else if (hasTicket) {
      navigate(`/ticket/${event.id}`);
    } else {
      if (event.webTicketsLink || event.ticketLink) {
        window.open(event.webTicketsLink || event.ticketLink, '_blank', 'noopener,noreferrer');
      } else if (event.price === 0) {
        toast({ title: 'Registered!', description: 'You have successfully registered for the event.' });
      } else {
        navigate(`/checkout/${event.id}`);
      }
    }
  }, [event, user, hasTicket, isLive, navigate, checkInToEvent, toast]);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-card">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-foreground">Event not found</h2>
          <p className="mb-6 text-muted-foreground">The event you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/')} className="rounded-xl h-12 px-6 bg-primary text-primary-foreground">
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  const formattedDate = (() => {
    try {
      return new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch { return 'Invalid date'; }
  })();

  const eventImages = event.images && event.images.length > 0 ? event.images : event.coverImage ? [event.coverImage] : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <header className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 pt-safe',
        isScrolled ? 'bg-background/95 backdrop-blur-xl py-2 border-b border-border/20' : 'bg-transparent py-3'
      )}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button onClick={handleBack} className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center transition-colors text-foreground shadow-lg',
            isScrolled ? 'bg-card hover:bg-card/80' : 'bg-black/40 backdrop-blur-sm hover:bg-black/60'
          )} aria-label="Go back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          {isScrolled && (
            <h1 className="text-sm font-semibold truncate max-w-[200px] px-4 text-foreground" aria-label={event.name}>
              {event.name}
            </h1>
          )}
          <div className="flex gap-2">
            <button onClick={handleShare} className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-colors text-foreground shadow-lg',
              isScrolled ? 'bg-card hover:bg-card/80' : 'bg-black/40 backdrop-blur-sm hover:bg-black/60'
            )} aria-label="Share event">
              <Share2 className="w-5 h-5" />
            </button>
            <button onClick={handleBookmark} className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg',
              isBookmarked ? 'bg-primary text-primary-foreground' : isScrolled ? 'bg-card hover:bg-card/80 text-foreground' : 'bg-black/40 backdrop-blur-sm hover:bg-black/60 text-foreground'
            )} aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark event'}>
              <Bookmark className={cn('w-5 h-5', isBookmarked && 'fill-current')} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Media Section */}
      <div className="relative w-full pt-[56.25%] bg-black overflow-hidden">
        {event.mediaType === 'video' && event.videos && event.videos.length > 0 ? (
          <div className="absolute inset-0">
            <video ref={videoRef} src={event.videos[0]} className="absolute inset-0 w-full h-full object-cover" muted loop playsInline preload="auto" autoPlay
              onTimeUpdate={() => { if (videoRef.current) videoPlaybackStateRef.current.currentTime = videoRef.current.currentTime; }} />
            <div className="absolute inset-0">
              <div className="absolute left-4 bottom-4">
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleVideoPlay(); }}
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all text-white"
                  aria-label={isVideoPlaying ? 'Pause video' : 'Play video'}>
                  {isVideoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
              </div>
              <div className="absolute right-4 bottom-4 flex items-center gap-3">
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleVideoMute(); }}
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all text-white"
                  aria-label={isVideoMuted ? 'Unmute video' : 'Mute video'}>
                  {isVideoMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openVideoModal(); }}
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all text-white"
                  aria-label="Open video in fullscreen">
                  <Maximize2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            {isVideoEnded && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleVideoPlay(); }}
                  className="w-16 h-16 rounded-full flex items-center justify-center bg-white hover:bg-white/90 transition-all text-background"
                  aria-label="Replay video">
                  <Play className="w-8 h-8 ml-1" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0">
            {eventImages.length > 0 ? (
              <>
                <img src={eventImages[currentImageIndex]} alt={`Event image ${currentImageIndex + 1}`}
                  className="absolute inset-0 w-full h-full object-cover" loading="eager" decoding="async"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                {eventImages.length > 1 && (
                  <>
                    <div className="absolute left-4 bottom-4">
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); prevImage(); }}
                        className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all text-white" aria-label="Previous image">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="absolute right-4 bottom-4 flex items-center gap-3">
                      <div className="px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-2 bg-black/70">
                        <Grid3x3 className="w-3.5 h-3.5 text-white" />
                        <span className="text-xs text-white font-medium">{currentImageIndex + 1}/{eventImages.length}</span>
                      </div>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextImage(); }}
                        className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all text-white" aria-label="Next image">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {eventImages.map((_, index) => (
                        <button key={index} onClick={(e) => { e.preventDefault(); e.stopPropagation(); stopCarouselRotation(); setCurrentImageIndex(index); setTimeout(() => startCarouselRotation(), 3000); }}
                          className={cn('w-8 h-1.5 rounded-full transition-all duration-300', index === currentImageIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/70')} aria-label={`Go to image ${index + 1}`} />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-purple-900/20 to-pink-900/20">
                <Image className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <main ref={contentRef} className="relative z-10 pb-32 max-w-5xl mx-auto px-4 bg-background">
        <div className="px-4 py-6">
          {/* Title and Price */}
          <div className="mb-5">
            <h1 className="font-bold text-[28px] leading-tight mb-3 text-foreground">{event.name}</h1>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-4 py-2 text-lg font-bold rounded-xl bg-card text-primary border border-border/20">
                  {event.price === 0 ? 'FREE' : `${event.currency || 'N'}$${event.price}`}
                </span>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {event.attendees} {event.attendees === 1 ? 'person' : 'people'} attending
                  </span>
                </div>
              </div>
              <span className="px-3 py-1.5 text-sm font-medium rounded-lg bg-card text-foreground border border-border/20">
                {event.category}
              </span>
            </div>
          </div>

          {/* Tabs Navigation */}
          <nav className="flex border-b-2 border-border/20 mb-6" aria-label="Event details tabs">
            {[
              { key: 'details' as const, label: 'Details', icon: null },
              { key: 'photos' as const, label: `Photos ${eventPhotos.length > 0 ? `(${eventPhotos.length})` : ''}`, icon: Image },
              { key: 'comments' as const, label: `Comments ${eventComments.length > 0 ? `(${eventComments.length})` : ''}`, icon: MessageCircle },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={cn('flex-1 py-3 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 relative',
                  activeTab === tab.key ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )} aria-current={activeTab === tab.key ? 'page' : undefined}>
                {tab.icon && <tab.icon className="w-4 h-4" />}
                {tab.label}
                {activeTab === tab.key && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 rounded-full bg-primary" />}
              </button>
            ))}
          </nav>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'details' && (
              <div className="space-y-8">
                {/* Info Cards Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Date Card */}
                  <div className="p-4 rounded-xl bg-card border border-border/20 transition-all hover:border-primary/30">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/20">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium mb-1 text-muted-foreground">Date</p>
                        <p className="text-sm font-semibold text-foreground">{formattedDate}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Time Card */}
                  <div className="p-4 rounded-xl bg-card border border-border/20 transition-all hover:border-primary/30">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/20">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium mb-1 text-muted-foreground">Time</p>
                        <p className="text-sm font-semibold text-foreground">{event.time}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Location Card - Full width */}
                  <div className="p-4 rounded-xl bg-card border border-border/20 col-span-2 transition-all hover:border-primary/30">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/20">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-xs font-medium mb-1 text-muted-foreground">Location</p>
                        <p className="text-sm font-semibold mb-1 text-foreground">{event.location}</p>
                        <p className="text-xs text-muted-foreground">{event.address}</p>
                      </div>
                      <button onClick={handleNavigateToMap}
                        className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-colors bg-primary/20"
                        aria-label="Open location in maps">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-foreground">About This Event</h3>
                    {descriptionTruncated && (
                      <button onClick={toggleDescription}
                        className="text-sm font-medium flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-primary bg-primary/10 hover:underline"
                        aria-expanded={showFullDescription}>
                        {showFullDescription ? 'Show less' : 'Read more'}
                        {showFullDescription ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  <div className={cn('leading-relaxed text-base text-muted-foreground', !showFullDescription && descriptionTruncated && 'line-clamp-4')}>
                    {event.description}
                  </div>
                </section>

                {/* Tags */}
                {event.tags.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag) => (
                        <span key={tag} className="px-3 py-1.5 text-sm font-medium rounded-lg bg-card text-foreground border border-border/30 hover:border-primary/50 transition-all">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Attendees Preview - Real data */}
                <div className="p-5 rounded-xl bg-card border border-border/20 transition-all hover:border-primary/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/20">
                        <Users className="w-5 h-5 text-primary" aria-hidden="true" />
                      </div>
                      <div>
                        <span className="font-bold block text-base text-foreground">
                          {event.attendees} {event.attendees === 1 ? 'person' : 'people'} attending
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {event.attendees === 0 ? 'Be the first to join!' : 'Join the community'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex -space-x-3">
                    {realAttendees.slice(0, 5).map((attendee) => (
                      <div key={attendee.id} className="w-10 h-10 rounded-full border-2 border-card overflow-hidden transition-transform hover:scale-110 bg-muted">
                        <img src={attendee.profilePhoto || '/default-avatar.png'} alt="" className="w-full h-full object-cover" loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }} />
                      </div>
                    ))}
                    {realAttendees.length === 0 && event.attendees > 0 && (
                      <span className="text-sm text-muted-foreground">Loading attendees...</span>
                    )}
                    {event.attendees > 5 && (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-card text-sm font-bold text-white bg-primary transition-transform hover:scale-110"
                        aria-label={`${event.attendees - 5} more attendees`}>
                        +{event.attendees - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'photos' && (
              <div className="min-h-[300px]">
                <CommunityPhotos eventId={event.id} photos={eventPhotos} />
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="min-h-[300px]">
                <CommunityComments eventId={event.id} comments={eventComments} />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Sticky Bottom CTA - RSVP + Buy */}
      <footer className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t border-border/20 z-50 bg-background/95 px-4 py-4 pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="max-w-5xl mx-auto">
          {hasRsvp ? (
            <div className="flex items-center gap-3 px-4">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-lg text-foreground">RSVPed ✓</p>
                <p className="text-sm text-muted-foreground truncate">You're on the list for this event</p>
              </div>
              {hasTicket && isLive && (
                <Button className="h-14 rounded-xl text-base font-semibold min-w-[140px] bg-green-600 hover:bg-green-700 text-white" size="lg" onClick={handleCTAClick}>
                  <Ticket className="w-5 h-5 mr-2" />
                  Check In Now
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4">
              <Button onClick={handleRsvp} disabled={isRsvping || !user}
                className="flex-1 h-14 rounded-xl text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
                {isRsvping ? 'RSVPing...' : 'RSVP'}
              </Button>
              {event.price > 0 && (
                <Button onClick={handleCTAClick}
                  className="flex-1 h-14 rounded-xl text-base font-semibold border-2 border-primary bg-transparent text-primary hover:bg-primary/10" size="lg" variant="outline">
                  <Ticket className="w-5 h-5 mr-2" />
                  Buy Now - {event.currency || 'N'}${event.price}
                </Button>
              )}
            </div>
          )}
        </div>
      </footer>

      {/* Video Modal */}
      {isVideoModalOpen && event.mediaType === 'video' && event.videos && event.videos.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
          <div className="relative w-full h-full">
            <video ref={fullscreenVideoRef} src={event.videos[0]} className="w-full h-full object-contain bg-black" muted={isFullscreenVideoMuted} loop controls={false}
              onTimeUpdate={() => { if (fullscreenVideoRef.current) videoPlaybackStateRef.current.currentTime = fullscreenVideoRef.current.currentTime; }} />
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                  <div className="flex items-center gap-6">
                    <button onClick={toggleFullscreenVideoPlay} className="w-14 h-14 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all" aria-label={isFullscreenVideoPlaying ? 'Pause video' : 'Play video'}>
                      {isFullscreenVideoPlaying ? <Pause className="w-7 h-7 text-white" /> : <Play className="w-7 h-7 text-white ml-1" />}
                    </button>
                    <button onClick={toggleFullscreenVideoMute} className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all" aria-label={isFullscreenVideoMuted ? 'Unmute video' : 'Mute video'}>
                      {isFullscreenVideoMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={closeVideoModal} className="absolute top-8 right-8 w-14 h-14 rounded-full flex items-center justify-center bg-black/60 backdrop-blur-sm hover:bg-black/80 transition-all z-10" aria-label="Close video">
              <X className="w-7 h-7 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
