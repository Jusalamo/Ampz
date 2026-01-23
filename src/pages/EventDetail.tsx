import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, Calendar, MapPin, Users, Clock, Share2, Bookmark, 
  Ticket, ExternalLink, MessageCircle, Image, ChevronDown, ChevronUp,
  Play, Pause, Volume2, VolumeX, Maximize2, Grid3x3, ChevronLeft, ChevronRight,
  X, Film
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { CommunityPhotos } from '@/components/CommunityPhotos';
import { CommunityComments } from '@/components/CommunityComments';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Design Constants - Updated with better spacing
const DESIGN = {
  colors: {
    primary: '#C4B5FD',
    lavenderLight: '#E9D5FF',
    accentPink: '#FFB8E6',
    background: '#1A1A1A',
    card: '#2D2D2D',
    textPrimary: '#FFFFFF',
    textSecondary: '#B8B8B8',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444'
  },
  spacing: {
    app: '16px',
    card: '16px',
    button: '12px',
    modal: '20px',
    section: '24px',
    component: '12px'
  },
  borderRadius: {
    card: '24px',
    cardInner: '20px',
    button: '12px',
    roundButton: '50%',
    modalTop: '20px',
    smallPill: '8px'
  },
  typography: {
    h1: '28px',
    h2: '24px',
    h3: '22px',
    h4: '18px',
    bodyLarge: '15px',
    body: '14px',
    small: '13px',
    caption: '12px'
  }
};

// Import Event type from lib
import { Event as EventType } from '@/lib/types';

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
    tickets.some(t => t.eventId === id && t.status === 'active'), 
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

  // Get CTA text with proper memoization
  const getCTAText = useCallback(() => {
    if (!user) return 'Buy Ticket';
    if (hasTicket && isLive) return 'Check In Now';
    if (hasTicket) return 'View Ticket';
    return event?.price === 0 ? 'Register Free' : 'Buy Ticket';
  }, [user, hasTicket, isLive, event]);

  // Auto-rotate carousel
  const startCarouselRotation = useCallback(() => {
    if (event?.mediaType === 'carousel' && event.images && event.images.length > 1) {
      // Clear existing interval
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
      }
      
      // Start new interval (rotate every 5 seconds)
      carouselIntervalRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => {
          if (!event.images) return prev;
          return (prev + 1) % event.images.length;
        });
      }, 5000);
    }
  }, [event?.mediaType, event?.images?.length]);

  // Stop carousel rotation
  const stopCarouselRotation = useCallback(() => {
    if (carouselIntervalRef.current) {
      clearInterval(carouselIntervalRef.current);
      carouselIntervalRef.current = null;
    }
  }, []);

  // Handle carousel navigation with manual control pause
  const nextImage = useCallback(() => {
    if (event?.images && event.images.length > 0) {
      // Stop auto-rotation temporarily when user manually navigates
      stopCarouselRotation();
      setCurrentImageIndex((prev) => (prev + 1) % event.images.length);
      
      // Restart auto-rotation after 3 seconds
      setTimeout(() => {
        startCarouselRotation();
      }, 3000);
    }
  }, [event?.images?.length, startCarouselRotation, stopCarouselRotation]);

  const prevImage = useCallback(() => {
    if (event?.images && event.images.length > 0) {
      // Stop auto-rotation temporarily when user manually navigates
      stopCarouselRotation();
      setCurrentImageIndex((prev) => (prev - 1 + event.images.length) % event.images.length);
      
      // Restart auto-rotation after 3 seconds
      setTimeout(() => {
        startCarouselRotation();
      }, 3000);
    }
  }, [event?.images?.length, startCarouselRotation, stopCarouselRotation]);

  // Handle video playback
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

  // Handle fullscreen video controls
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
    // Save current video state before opening modal
    if (videoRef.current) {
      videoPlaybackStateRef.current.currentTime = videoRef.current.currentTime;
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
    setIsVideoModalOpen(true);
  }, []);

  const closeVideoModal = useCallback(() => {
    setIsVideoModalOpen(false);
    
    // Resume main video with saved state after a short delay
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.muted = videoPlaybackStateRef.current.isMuted;
        videoRef.current.currentTime = videoPlaybackStateRef.current.currentTime;
        
        if (videoPlaybackStateRef.current.isPlaying) {
          videoRef.current.play().catch(e => {
            console.log('Autoplay failed:', e);
            setIsVideoPlaying(false);
          });
          setIsVideoPlaying(true);
        }
        
        setIsVideoMuted(videoPlaybackStateRef.current.isMuted);
      }
    }, 100);
  }, []);

  // Handle video events
  const handleVideoPlay = useCallback(() => {
    setIsVideoPlaying(true);
    setIsVideoEnded(false);
    videoPlaybackStateRef.current.isPlaying = true;
  }, []);

  const handleVideoPause = useCallback(() => {
    setIsVideoPlaying(false);
    videoPlaybackStateRef.current.isPlaying = false;
  }, []);

  const handleVideoEnded = useCallback(() => {
    setIsVideoPlaying(false);
    setIsVideoEnded(true);
    videoPlaybackStateRef.current.isPlaying = false;
  }, []);

  // Handle fullscreen video events
  const handleFullscreenVideoPlay = useCallback(() => {
    setIsFullscreenVideoPlaying(true);
  }, []);

  const handleFullscreenVideoPause = useCallback(() => {
    setIsFullscreenVideoPlaying(false);
  }, []);

  const handleFullscreenVideoEnded = useCallback(() => {
    setIsFullscreenVideoPlaying(false);
  }, []);

  // Setup main video for persistent auto-playback
  const setupMainVideo = useCallback(() => {
    const videoElement = videoRef.current;
    if (videoElement && event?.mediaType === 'video' && event.videos?.length > 0) {
      const handlePlay = () => handleVideoPlay();
      const handlePause = () => handleVideoPause();
      const handleEnded = () => handleVideoEnded();

      videoElement.addEventListener('play', handlePlay);
      videoElement.addEventListener('pause', handleVideoPause);
      videoElement.addEventListener('ended', handleVideoEnded);
      
      // Set initial state for persistent playback
      videoElement.muted = true; // Always muted by default
      videoElement.loop = true;
      videoElement.preload = "auto";
      
      // Restore saved playback time if exists
      if (videoPlaybackStateRef.current.currentTime > 0) {
        videoElement.currentTime = videoPlaybackStateRef.current.currentTime;
      }
      
      // Try to autoplay with muted state (browsers allow this)
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsVideoPlaying(true);
            videoPlaybackStateRef.current.isPlaying = true;
          })
          .catch(error => {
            console.log('Autoplay prevented:', error);
            videoPlaybackStateRef.current.isPlaying = false;
            setIsVideoPlaying(false);
          });
      }

      return () => {
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [event?.mediaType, event?.videos, handleVideoPlay, handleVideoPause, handleVideoEnded]);

  // Setup fullscreen video when modal opens
  const setupFullscreenVideo = useCallback(() => {
    const fullscreenVideoElement = fullscreenVideoRef.current;
    if (fullscreenVideoElement && isVideoModalOpen && event?.mediaType === 'video' && event.videos?.length > 0) {
      const handlePlay = () => handleFullscreenVideoPlay();
      const handlePause = () => handleFullscreenVideoPause();
      const handleEnded = () => handleFullscreenVideoEnded();

      fullscreenVideoElement.addEventListener('play', handlePlay);
      fullscreenVideoElement.addEventListener('pause', handlePause);
      fullscreenVideoElement.addEventListener('ended', handleEnded);
      
      // Set initial state for modal video
      fullscreenVideoElement.loop = true;
      fullscreenVideoElement.muted = isFullscreenVideoMuted;
      fullscreenVideoElement.currentTime = videoPlaybackStateRef.current.currentTime;
      
      // Try to play in modal
      const playPromise = fullscreenVideoElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Modal autoplay prevented:', error);
          setIsFullscreenVideoPlaying(false);
        });
      }

      return () => {
        fullscreenVideoElement.removeEventListener('play', handlePlay);
        fullscreenVideoElement.removeEventListener('pause', handlePause);
        fullscreenVideoElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [isVideoModalOpen, event?.mediaType, event?.videos, isFullscreenVideoMuted, handleFullscreenVideoPlay, handleFullscreenVideoPause, handleFullscreenVideoEnded]);

  // Handle page visibility for persistent video playback
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (videoRef.current && event?.mediaType === 'video') {
        if (document.hidden) {
          // Page is hidden, save current time
          videoPlaybackStateRef.current.currentTime = videoRef.current.currentTime;
          videoPlaybackStateRef.current.isPlaying = !videoRef.current.paused;
        } else {
          // Page is visible again, restore playback if it was playing
          if (videoPlaybackStateRef.current.isPlaying) {
            videoRef.current.currentTime = videoPlaybackStateRef.current.currentTime;
            videoRef.current.muted = true; // Always muted when restoring
            videoRef.current.play().catch(e => {
              console.log('Resume playback failed:', e);
            });
            setIsVideoPlaying(true);
            setIsVideoMuted(true);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [event?.mediaType]);

  // Setup main video and carousel on mount and when event changes
  useEffect(() => {
    if (event?.mediaType === 'video') {
      const cleanup = setupMainVideo();
      return cleanup;
    } else if (event?.mediaType === 'carousel') {
      startCarouselRotation();
      return () => {
        stopCarouselRotation();
      };
    }
  }, [event?.mediaType, event?.id, setupMainVideo, startCarouselRotation, stopCarouselRotation]);

  // Setup fullscreen video when modal opens
  useEffect(() => {
    if (isVideoModalOpen && event?.mediaType === 'video') {
      setupFullscreenVideo();
    }
  }, [isVideoModalOpen, event?.mediaType, setupFullscreenVideo]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVideoModalOpen) {
        closeVideoModal();
      }
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

  // Scroll effect - prevent automatic scrolling
  useEffect(() => {
    window.scrollTo(0, 0);
    
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

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
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  const handleShare = useCallback(async () => {
    if (!event) return;

    const shareData = {
      title: event.name,
      text: `Check out ${event.name} on Amps!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link copied!',
          description: 'Event link has been copied to clipboard',
        });
      }
    } catch (error) {
      // User cancelled share or error occurred
      console.error('Share failed:', error);
    }
  }, [event, toast]);

  const handleBookmark = useCallback(() => {
    if (!event) return;
    bookmarkEvent(event.id);
  }, [event, bookmarkEvent]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleNavigateToMap = useCallback(() => {
    if (!event) return;
    // Open maps with the event location
    const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(event.location + ' ' + event.address)}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  }, [event]);

  const toggleDescription = useCallback(() => {
    setShowFullDescription(prev => !prev);
  }, []);

  // Handle CTA button click
  const handleCTAClick = useCallback(() => {
    if (!event) return;
    
    if (!user) {
      // Redirect to login/signup
      navigate('/auth');
      return;
    }
    
    if (hasTicket && isLive) {
      // Check in to event with public visibility
      checkInToEvent(event.id, true);
      toast({
        title: 'Checked in!',
        description: 'You have successfully checked in to the event.',
      });
    } else if (hasTicket) {
      // View ticket
      navigate(`/ticket/${event.id}`);
    } else {
      // Buy ticket/register - use webTicketsLink if available
      if (event.webTicketsLink || event.ticketLink) {
        // Open external ticket link (WebTickets)
        window.open(event.webTicketsLink || event.ticketLink, '_blank', 'noopener,noreferrer');
      } else if (event.price === 0) {
        // Free event - register immediately
        toast({
          title: 'Registered!',
          description: 'You have successfully registered for the event.',
        });
      } else {
        // Paid event - redirect to payment
        navigate(`/checkout/${event.id}`);
      }
    }
  }, [event, user, hasTicket, isLive, navigate, checkInToEvent, toast]);

  if (!event) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: DESIGN.colors.background }}
      >
        <div className="text-center">
          <div 
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ 
              background: DESIGN.colors.card,
              borderRadius: '50%'
            }}
          >
            <Calendar className="w-8 h-8" style={{ color: DESIGN.colors.textSecondary }} />
          </div>
          <h2 
            className="text-xl font-bold mb-2"
            style={{ color: DESIGN.colors.textPrimary }}
          >
            Event not found
          </h2>
          <p 
            className="mb-6"
            style={{ color: DESIGN.colors.textSecondary }}
          >
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Button 
            onClick={() => navigate('/')}
            className="rounded-[12px] h-12 px-6"
            style={{ 
              background: DESIGN.colors.primary,
              color: DESIGN.colors.background
            }}
          >
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  // Format date safely
  const formattedDate = useMemo(() => {
    try {
      return new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  }, [event.date]);

  // Ensure images are properly loaded from event creation inputs
  const eventImages = useMemo(() => {
    if (event.images && event.images.length > 0) {
      return event.images;
    }
    // Fallback to coverImage if no images array exists
    return event.coverImage ? [event.coverImage] : [];
  }, [event.images, event.coverImage]);

  return (
    <div 
      className="min-h-screen"
      style={{ background: DESIGN.colors.background }}
    >
      {/* Fixed Header - Cleaner spacing */}
      <header 
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 pt-safe',
          isScrolled 
            ? 'bg-background/95 backdrop-blur-xl py-2' 
            : 'bg-transparent py-3'
        )}
        style={{
          background: isScrolled ? `${DESIGN.colors.background}F2` : 'transparent',
          borderBottom: isScrolled ? `1px solid ${DESIGN.colors.textSecondary}20` : 'none'
        }}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={handleBack}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
              isScrolled 
                ? 'bg-card hover:bg-card/80' 
                : 'bg-black/40 backdrop-blur-sm hover:bg-black/60'
            )}
            style={{
              borderRadius: DESIGN.borderRadius.roundButton,
              background: isScrolled ? DESIGN.colors.card : 'rgba(0, 0, 0, 0.4)',
              color: DESIGN.colors.textPrimary,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          {isScrolled && (
            <h1 
              className="text-sm font-semibold truncate max-w-[200px] px-4" 
              aria-label={event.name}
              style={{ color: DESIGN.colors.textPrimary }}
            >
              {event.name}
            </h1>
          )}
          
          <div className="flex gap-2">
            <button 
              onClick={handleShare}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                isScrolled 
                  ? 'bg-card hover:bg-card/80' 
                  : 'bg-black/40 backdrop-blur-sm hover:bg-black/60'
              )}
              style={{
                borderRadius: DESIGN.borderRadius.roundButton,
                background: isScrolled ? DESIGN.colors.card : 'rgba(0, 0, 0, 0.4)',
                color: DESIGN.colors.textPrimary,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}
              aria-label="Share event"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleBookmark}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-offset-2',
                isBookmarked 
                  ? 'bg-primary text-primary-foreground' 
                  : isScrolled 
                    ? 'bg-card hover:bg-card/80'
                    : 'bg-black/40 backdrop-blur-sm hover:bg-black/60'
              )}
              style={{
                borderRadius: DESIGN.borderRadius.roundButton,
                background: isBookmarked ? DESIGN.colors.primary : isScrolled ? DESIGN.colors.card : 'rgba(0, 0, 0, 0.4)',
                color: isBookmarked ? DESIGN.colors.background : DESIGN.colors.textPrimary,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark event'}
            >
              <Bookmark className={cn('w-5 h-5', isBookmarked && 'fill-current')} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Media Section - YouTube-like aspect ratio (16:9) */}
      <div className="relative w-full pt-[56.25%] bg-black overflow-hidden">
        {event.mediaType === 'video' && event.videos && event.videos.length > 0 ? (
          /* Video Player - Fixed aspect ratio */
          <div className="absolute inset-0 group">
            {/* Video Element */}
            <video
              ref={videoRef}
              src={event.videos[0]}
              className="absolute inset-0 w-full h-full object-cover"
              muted={true}
              loop
              playsInline
              preload="auto"
              autoPlay
              onTimeUpdate={() => {
                if (videoRef.current) {
                  videoPlaybackStateRef.current.currentTime = videoRef.current.currentTime;
                }
              }}
            />
            
            {/* Video Controls Overlay - YouTube-style */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {/* Bottom controls bar */}
              <div 
                className="absolute bottom-0 left-0 right-0"
                style={{
                  background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 100%)',
                  padding: '16px',
                  paddingBottom: '32px' // Extra space for better control access
                }}
              >
                <div className="flex items-center justify-between max-w-5xl mx-auto">
                  <div className="flex items-center gap-3">
                    {/* Play/Pause Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleVideoPlay();
                      }}
                      className="w-11 h-11 rounded-full flex items-center justify-center bg-white/90 hover:bg-white transition-all duration-200 cursor-pointer"
                      style={{
                        color: DESIGN.colors.background,
                        transform: 'scale(1)'
                      }}
                      aria-label={isVideoPlaying ? 'Pause video' : 'Play video'}
                    >
                      {isVideoPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                      )}
                    </button>
                    
                    {/* Volume Control */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleVideoMute();
                      }}
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all duration-200 cursor-pointer backdrop-blur-sm"
                      style={{
                        color: DESIGN.colors.textPrimary
                      }}
                      aria-label={isVideoMuted ? 'Unmute video' : 'Mute video'}
                    >
                      {isVideoMuted ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  
                  {/* Expand Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openVideoModal();
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all duration-200 cursor-pointer backdrop-blur-sm"
                    style={{
                      color: DESIGN.colors.textPrimary
                    }}
                    aria-label="Open video in fullscreen"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Always visible controls on hover state */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <div className="pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleVideoPlay();
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all duration-200 opacity-80 hover:opacity-100 backdrop-blur-sm cursor-pointer"
                  style={{
                    color: DESIGN.colors.textPrimary
                  }}
                  aria-label={isVideoPlaying ? 'Pause video' : 'Play video'}
                >
                  {isVideoPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </button>
              </div>
              
              <div className="pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openVideoModal();
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all duration-200 opacity-80 hover:opacity-100 backdrop-blur-sm cursor-pointer"
                  style={{
                    color: DESIGN.colors.textPrimary
                  }}
                  aria-label="Open video in fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Video Indicator */}
            <div 
              className="absolute top-4 left-4 px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-2"
              style={{
                background: 'rgba(0, 0, 0, 0.7)'
              }}
            >
              <Film className="w-3.5 h-3.5 text-white" />
              <span className="text-xs text-white font-medium">Video</span>
            </div>
            
            {/* Play overlay when video ended */}
            {isVideoEnded && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleVideoPlay();
                  }}
                  className="w-16 h-16 rounded-full flex items-center justify-center bg-white hover:bg-white/90 transition-all cursor-pointer group"
                  style={{
                    color: DESIGN.colors.background
                  }}
                  aria-label="Replay video"
                >
                  <Play className="w-8 h-8 ml-1 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Image Carousel */
          <div className="absolute inset-0">
            {eventImages && eventImages.length > 0 ? (
              <>
                <img
                  src={eventImages[currentImageIndex]}
                  alt={`Event image ${currentImageIndex + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x256/2D2D2D/FFFFFF?text=${encodeURIComponent(event.name.substring(0, 30))}`;
                  }}
                />
                
                {/* Carousel Controls */}
                {eventImages.length > 1 && (
                  <>
                    {/* Navigation Buttons */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        prevImage();
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all hover:scale-105 active:scale-95 z-10 opacity-80 hover:opacity-100"
                      style={{
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: DESIGN.colors.textPrimary
                      }}
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        nextImage();
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all hover:scale-105 active:scale-95 z-10 opacity-80 hover:opacity-100"
                      style={{
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: DESIGN.colors.textPrimary
                      }}
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    
                    {/* Carousel Dots - YouTube-style */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {eventImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            stopCarouselRotation();
                            setCurrentImageIndex(index);
                            setTimeout(() => startCarouselRotation(), 3000);
                          }}
                          className={cn(
                            'w-8 h-1.5 rounded-full transition-all duration-300 hover:scale-110 active:scale-105',
                            index === currentImageIndex 
                              ? 'bg-white' 
                              : 'bg-white/50 hover:bg-white/70'
                          )}
                          aria-label={`Go to image ${index + 1}`}
                        />
                      ))}
                    </div>
                    
                    {/* Image Counter */}
                    <div 
                      className="absolute top-4 right-4 px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-2 z-10"
                      style={{
                        background: 'rgba(0, 0, 0, 0.7)'
                      }}
                    >
                      <Grid3x3 className="w-3.5 h-3.5 text-white" />
                      <span className="text-xs text-white font-medium">
                        {currentImageIndex + 1}/{eventImages.length}
                      </span>
                    </div>
                  </>
                )}
              </>
            ) : (
              /* Fallback if no images */
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-purple-900/20 to-pink-900/20">
                <Image className="w-16 h-16" style={{ color: DESIGN.colors.textSecondary }} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content - YouTube-like spacing */}
      <main 
        ref={contentRef} 
        className="relative z-10 pb-32 max-w-5xl mx-auto"
        style={{ 
          paddingLeft: DESIGN.spacing.app,
          paddingRight: DESIGN.spacing.app,
          background: DESIGN.colors.background
        }}
      >
        {/* Event Info Section - Better spacing */}
        <div className="px-4 py-6">
          {/* Title and Price */}
          <div className="mb-5">
            <h1 
              className="font-bold mb-3"
              style={{ 
                fontSize: DESIGN.typography.h1,
                color: DESIGN.colors.textPrimary,
                lineHeight: 1.2
              }}
            >
              {event.name}
            </h1>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Price Badge */}
                <span 
                  className="px-4 py-2 text-lg font-bold rounded-xl"
                  style={{
                    background: DESIGN.colors.card,
                    color: DESIGN.colors.primary,
                    borderRadius: DESIGN.borderRadius.button,
                    border: `1px solid ${DESIGN.colors.textSecondary}20`
                  }}
                >
                  {event.price === 0 ? 'FREE' : `₦${event.price}`}
                </span>
                
                {/* Attendance Count */}
                <div 
                  className="flex items-center gap-1.5"
                  style={{ color: DESIGN.colors.textSecondary }}
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">{event.attendees} attending</span>
                </div>
              </div>
              
              {/* Category Tag */}
              <span 
                className="px-3 py-1.5 text-sm font-medium rounded-lg"
                style={{
                  background: DESIGN.colors.card,
                  color: DESIGN.colors.textPrimary,
                  borderRadius: DESIGN.borderRadius.button,
                  border: `1px solid ${DESIGN.colors.textSecondary}20`
                }}
              >
                {event.category}
              </span>
            </div>
          </div>

          {/* Tabs Navigation - YouTube-style */}
          <nav 
            className="flex border-b mb-6"
            style={{ 
              borderBottom: `2px solid ${DESIGN.colors.textSecondary}20`
            }}
            aria-label="Event details tabs"
          >
            <button
              onClick={() => setActiveTab('details')}
              className={cn(
                'flex-1 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none relative',
                activeTab === 'details'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              style={{
                color: activeTab === 'details' ? DESIGN.colors.primary : DESIGN.colors.textSecondary,
                fontSize: DESIGN.typography.body
              }}
              aria-current={activeTab === 'details' ? 'page' : undefined}
            >
              Details
              {activeTab === 'details' && (
                <div 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 rounded-full"
                  style={{ background: DESIGN.colors.primary }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={cn(
                'flex-1 py-3 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none relative',
                activeTab === 'photos'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              style={{
                color: activeTab === 'photos' ? DESIGN.colors.primary : DESIGN.colors.textSecondary,
                fontSize: DESIGN.typography.body
              }}
              aria-current={activeTab === 'photos' ? 'page' : undefined}
            >
              <Image className="w-4 h-4" />
              Photos {eventPhotos.length > 0 && `(${eventPhotos.length})`}
              {activeTab === 'photos' && (
                <div 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 rounded-full"
                  style={{ background: DESIGN.colors.primary }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={cn(
                'flex-1 py-3 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none relative',
                activeTab === 'comments'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              style={{
                color: activeTab === 'comments' ? DESIGN.colors.primary : DESIGN.colors.textSecondary,
                fontSize: DESIGN.typography.body
              }}
              aria-current={activeTab === 'comments' ? 'page' : undefined}
            >
              <MessageCircle className="w-4 h-4" />
              Comments {eventComments.length > 0 && `(${eventComments.length})`}
              {activeTab === 'comments' && (
                <div 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 rounded-full"
                  style={{ background: DESIGN.colors.primary }}
                />
              )}
            </button>
          </nav>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-8">
                {/* Info Cards Grid - Better spacing */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Date Card */}
                  <div 
                    className="p-4 rounded-xl border transition-all hover:border-primary/30"
                    style={{
                      background: DESIGN.colors.card,
                      borderRadius: DESIGN.borderRadius.cardInner,
                      border: `1px solid ${DESIGN.colors.textSecondary}20`
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" 
                        aria-hidden="true"
                        style={{
                          background: `${DESIGN.colors.primary}20`,
                          borderRadius: DESIGN.borderRadius.button
                        }}
                      >
                        <Calendar className="w-5 h-5" style={{ color: DESIGN.colors.primary }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p 
                          className="text-xs font-medium mb-1"
                          style={{ color: DESIGN.colors.textSecondary }}
                        >
                          Date
                        </p>
                        <p 
                          className="text-sm font-semibold"
                          style={{ color: DESIGN.colors.textPrimary }}
                        >
                          {formattedDate}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Time Card */}
                  <div 
                    className="p-4 rounded-xl border transition-all hover:border-primary/30"
                    style={{
                      background: DESIGN.colors.card,
                      borderRadius: DESIGN.borderRadius.cardInner,
                      border: `1px solid ${DESIGN.colors.textSecondary}20`
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" 
                        aria-hidden="true"
                        style={{
                          background: `${DESIGN.colors.primary}20`,
                          borderRadius: DESIGN.borderRadius.button
                        }}
                      >
                        <Clock className="w-5 h-5" style={{ color: DESIGN.colors.primary }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p 
                          className="text-xs font-medium mb-1"
                          style={{ color: DESIGN.colors.textSecondary }}
                        >
                          Time
                        </p>
                        <p 
                          className="text-sm font-semibold"
                          style={{ color: DESIGN.colors.textPrimary }}
                        >
                          {event.time}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Location Card - Full width */}
                  <div 
                    className="p-4 rounded-xl border col-span-2 transition-all hover:border-primary/30"
                    style={{
                      background: DESIGN.colors.card,
                      borderRadius: DESIGN.borderRadius.cardInner,
                      border: `1px solid ${DESIGN.colors.textSecondary}20`
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" 
                        aria-hidden="true"
                        style={{
                          background: `${DESIGN.colors.primary}20`,
                          borderRadius: DESIGN.borderRadius.button
                        }}
                      >
                        <MapPin className="w-5 h-5" style={{ color: DESIGN.colors.primary }} />
                      </div>
                      <div className="flex-1 min-w-0 mr-3">
                        <p 
                          className="text-xs font-medium mb-1"
                          style={{ color: DESIGN.colors.textSecondary }}
                        >
                          Location
                        </p>
                        <p 
                          className="text-sm font-semibold mb-1"
                          style={{ color: DESIGN.colors.textPrimary }}
                        >
                          {event.location}
                        </p>
                        <p 
                          className="text-xs"
                          style={{ color: DESIGN.colors.textSecondary }}
                        >
                          {event.address}
                        </p>
                      </div>
                      <button 
                        onClick={handleNavigateToMap}
                        className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                          background: `${DESIGN.colors.primary}20`,
                          borderRadius: DESIGN.borderRadius.button,
                          color: DESIGN.colors.primary
                        }}
                        aria-label="Open location in maps"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Description Section */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 
                      className="font-bold"
                      style={{ 
                        fontSize: DESIGN.typography.h4,
                        color: DESIGN.colors.textPrimary 
                      }}
                    >
                      About This Event
                    </h3>
                    {descriptionTruncated && (
                      <button 
                        onClick={toggleDescription}
                        className="text-primary text-sm font-medium hover:underline flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg px-3 py-1.5"
                        style={{
                          color: DESIGN.colors.primary,
                          fontSize: DESIGN.typography.small,
                          background: `${DESIGN.colors.primary}10`
                        }}
                        aria-expanded={showFullDescription}
                      >
                        {showFullDescription ? 'Show less' : 'Read more'}
                        {showFullDescription ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  <div className={cn(
                    'leading-relaxed',
                    !showFullDescription && descriptionTruncated && 'line-clamp-4'
                  )}
                  style={{
                    color: DESIGN.colors.textSecondary,
                    fontSize: DESIGN.typography.bodyLarge
                  }}>
                    {event.description}
                  </div>
                </section>

                {/* Tags Section */}
                {event.tags.length > 0 && (
                  <section className="space-y-3">
                    <h3 
                      className="font-semibold"
                      style={{ 
                        color: DESIGN.colors.textSecondary,
                        fontSize: DESIGN.typography.body
                      }}
                    >
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1.5 text-sm font-medium rounded-lg border transition-all hover:border-primary/50"
                          style={{
                            background: DESIGN.colors.card,
                            color: DESIGN.colors.textPrimary,
                            borderRadius: DESIGN.borderRadius.button,
                            border: `1px solid ${DESIGN.colors.textSecondary}30`
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Attendees Preview */}
                <div 
                  className="p-5 rounded-xl border transition-all hover:border-primary/30"
                  style={{
                    background: DESIGN.colors.card,
                    borderRadius: DESIGN.borderRadius.cardInner,
                    border: `1px solid ${DESIGN.colors.textSecondary}20`
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{
                          background: `${DESIGN.colors.primary}20`,
                          borderRadius: DESIGN.borderRadius.button
                        }}
                      >
                        <Users className="w-5 h-5" style={{ color: DESIGN.colors.primary }} aria-hidden="true" />
                      </div>
                      <div>
                        <span 
                          className="font-bold block"
                          style={{ 
                            color: DESIGN.colors.textPrimary,
                            fontSize: DESIGN.typography.bodyLarge 
                          }}
                        >
                          {event.attendees} people attending
                        </span>
                        <span 
                          className="text-sm"
                          style={{ color: DESIGN.colors.textSecondary }}
                        >
                          Join the community
                        </span>
                      </div>
                    </div>
                    <button 
                      className="text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg px-3 py-1.5"
                      style={{
                        color: DESIGN.colors.primary,
                        background: `${DESIGN.colors.primary}10`
                      }}
                      onClick={() => {/* TODO: Implement see all attendees */}}
                    >
                      See all
                    </button>
                  </div>
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full border-2 overflow-hidden transition-transform hover:scale-110"
                        style={{
                          background: '#4A4A4A',
                          borderColor: DESIGN.colors.card
                        }}
                        aria-hidden="true"
                      >
                        <img
                          src={`https://i.pravatar.cc/100?img=${i + 10}`}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                    {event.attendees > 5 && (
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-bold text-white transition-transform hover:scale-110"
                        style={{
                          background: DESIGN.colors.primary,
                          borderColor: DESIGN.colors.card
                        }}
                        aria-label={`${event.attendees - 5} more attendees`}
                      >
                        +{event.attendees - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Photos Tab */}
            {activeTab === 'photos' && (
              <div className="min-h-[300px]">
                <CommunityPhotos eventId={event.id} photos={eventPhotos} />
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div className="min-h-[300px]">
                <CommunityComments eventId={event.id} comments={eventComments} />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Sticky Bottom CTA - Better spacing */}
      <footer 
        className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t z-50"
        style={{
          background: `${DESIGN.colors.background}F2`,
          borderTop: `1px solid ${DESIGN.colors.textSecondary}20`,
          padding: `${DESIGN.spacing.app} ${DESIGN.spacing.app} max(env(safe-area-inset-bottom), ${DESIGN.spacing.app})`
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between gap-4 px-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <p 
                  className="font-bold"
                  style={{ 
                    fontSize: DESIGN.typography.h3,
                    color: DESIGN.colors.textPrimary 
                  }}
                >
                  {event.price === 0 ? 'FREE' : `₦${event.price}`}
                </p>
                <p 
                  className="text-sm"
                  style={{ color: DESIGN.colors.textSecondary }}
                >
                  {hasTicket ? 'Ticket purchased' : 'Per person'}
                </p>
              </div>
              <p 
                className="text-xs truncate"
                style={{ color: DESIGN.colors.textSecondary }}
              >
                {hasTicket ? 'You have a ticket for this event' : 'Secure your spot now'}
              </p>
            </div>
            <Button 
              className={cn(
                'flex-1 h-14 rounded-xl text-base font-semibold min-w-[140px] focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all hover:scale-[1.02] active:scale-[0.98]'
              )}
              style={{
                borderRadius: DESIGN.borderRadius.cardInner,
                height: '56px',
                background: hasTicket && isLive 
                  ? `linear-gradient(135deg, ${DESIGN.colors.success} 0%, #059669 100%)`
                  : `linear-gradient(135deg, ${DESIGN.colors.primary} 0%, ${DESIGN.colors.lavenderLight} 100%)`,
                color: DESIGN.colors.background,
                boxShadow: '0 8px 32px rgba(196, 181, 253, 0.4)'
              }}
              size="lg"
              onClick={handleCTAClick}
            >
              <Ticket className="w-5 h-5 mr-2" />
              {getCTAText()}
            </Button>
          </div>
        </div>
      </footer>

      {/* Video Modal - Improved */}
      {isVideoModalOpen && event.mediaType === 'video' && event.videos && event.videos.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
          <div className="relative w-full h-full">
            <video
              ref={fullscreenVideoRef}
              src={event.videos[0]}
              className="w-full h-full object-contain bg-black"
              muted={isFullscreenVideoMuted}
              loop
              controls={false}
              onTimeUpdate={() => {
                if (fullscreenVideoRef.current) {
                  videoPlaybackStateRef.current.currentTime = fullscreenVideoRef.current.currentTime;
                }
              }}
            />
            
            {/* Custom Video Controls */}
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                  <div className="flex items-center gap-6">
                    {/* Play/Pause */}
                    <button
                      onClick={toggleFullscreenVideoPlay}
                      className="w-14 h-14 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all"
                      aria-label={isFullscreenVideoPlaying ? 'Pause video' : 'Play video'}
                    >
                      {isFullscreenVideoPlaying ? (
                        <Pause className="w-7 h-7 text-white" />
                      ) : (
                        <Play className="w-7 h-7 text-white ml-1" />
                      )}
                    </button>
                    
                    {/* Volume */}
                    <button
                      onClick={toggleFullscreenVideoMute}
                      className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all"
                      aria-label={isFullscreenVideoMuted ? 'Unmute video' : 'Mute video'}
                    >
                      {isFullscreenVideoMuted ? (
                        <VolumeX className="w-6 h-6 text-white" />
                      ) : (
                        <Volume2 className="w-6 h-6 text-white" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Close Button */}
            <button
              onClick={closeVideoModal}
              className="absolute top-8 right-8 w-14 h-14 rounded-full flex items-center justify-center bg-black/60 backdrop-blur-sm hover:bg-black/80 transition-all z-10"
              aria-label="Close video"
            >
              <X className="w-7 h-7 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
