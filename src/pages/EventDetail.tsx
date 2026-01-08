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

// Design Constants
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
    modal: '20px'
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

// Add missing interface for event
interface EventType {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  date: string;
  time: string;
  location: string;
  address: string;
  category: string;
  price: number;
  attendees: number;
  isFeatured: boolean;
  tags: string[];
  customTheme?: string;
  images: string[];
  videos: string[];
  hasVideo: boolean;
  mediaType: 'video' | 'carousel';
  selectedVideoIndex: number;
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, user, bookmarkEvent, communityPhotos, communityComments, tickets } = useApp();
  const { toast } = useToast();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'photos' | 'comments'>('details');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  const lastScrollY = useRef(0);

  // Memoize event find for better performance
  const event = useMemo(() => 
    events.find((e: EventType) => e.id === id), 
    [events, id]
  ) as EventType | undefined;

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

  // Handle video playback
  const toggleVideoPlay = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsVideoPlaying(true);
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  }, []);

  const toggleVideoMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsVideoMuted(videoRef.current.muted);
    }
  }, []);

  const openVideoModal = useCallback(() => {
    setIsVideoModalOpen(true);
    if (fullscreenVideoRef.current) {
      fullscreenVideoRef.current.muted = false;
      fullscreenVideoRef.current.play();
      setIsVideoPlaying(true);
      setIsVideoMuted(false);
    }
  }, []);

  const closeVideoModal = useCallback(() => {
    setIsVideoModalOpen(false);
    if (fullscreenVideoRef.current) {
      fullscreenVideoRef.current.pause();
    }
    // Reset main video to muted autoplay
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play();
    }
  }, []);

  // Handle carousel navigation
  const nextImage = useCallback(() => {
    if (event?.images && event.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % event.images.length);
    }
  }, [event]);

  const prevImage = useCallback(() => {
    if (event?.images && event.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + event.images.length) % event.images.length);
    }
  }, [event]);

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

  return (
    <div 
      className="min-h-screen"
      style={{ background: DESIGN.colors.background }}
    >
      {/* Fixed Header */}
      <header 
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
          isScrolled 
            ? 'bg-background/95 backdrop-blur-xl' 
            : 'bg-transparent'
        )}
        style={{
          background: isScrolled ? `${DESIGN.colors.background}F2` : 'transparent',
          borderBottom: isScrolled ? `1px solid ${DESIGN.colors.textSecondary}20` : 'none'
        }}
      >
        <div 
          className="flex items-center justify-between px-4 h-14 pt-safe max-w-app mx-auto"
          style={{ paddingLeft: DESIGN.spacing.app, paddingRight: DESIGN.spacing.app }}
        >
          <button
            onClick={handleBack}
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
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
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          {isScrolled && (
            <h1 
              className="text-sm font-semibold truncate max-w-[180px]" 
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
                'w-9 h-9 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
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
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleBookmark}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-offset-2',
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
              <Bookmark className={cn('w-4 h-4', isBookmarked && 'fill-current')} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Media Section */}
      <div className="relative h-64 overflow-hidden">
        {event.mediaType === 'video' && event.videos && event.videos.length > 0 ? (
          /* Video Player */
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={event.videos[0]}
              className="w-full h-full object-cover"
              muted
              autoPlay
              loop
              playsInline
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
            />
            
            {/* Video Controls Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleVideoPlay}
                      className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.9)',
                        color: DESIGN.colors.background
                      }}
                    >
                      {isVideoPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                      )}
                    </button>
                    <button
                      onClick={toggleVideoMute}
                      className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.9)',
                        color: DESIGN.colors.background
                      }}
                    >
                      {isVideoMuted ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={openVideoModal}
                    className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
                    style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      color: DESIGN.colors.background
                    }}
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Video Indicator */}
            <div className="absolute top-3 left-3 px-2 py-1 rounded-full backdrop-blur-sm"
                 style={{
                   background: 'rgba(0, 0, 0, 0.6)'
                 }}>
              <div className="flex items-center gap-1">
                <Film className="w-3 h-3 text-white" />
                <span className="text-xs text-white">Video</span>
              </div>
            </div>
          </div>
        ) : (
          /* Image Carousel */
          <div className="relative w-full h-full">
            {event.images && event.images.length > 0 ? (
              <>
                <img
                  src={event.images[currentImageIndex]}
                  alt={`Event image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x256?text=Event+Image';
                  }}
                />
                
                {/* Carousel Controls */}
                {event.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
                      style={{
                        background: 'rgba(0, 0, 0, 0.6)',
                        color: DESIGN.colors.textPrimary
                      }}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
                      style={{
                        background: 'rgba(0, 0, 0, 0.6)',
                        color: DESIGN.colors.textPrimary
                      }}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    
                    {/* Carousel Dots */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                      {event.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={cn(
                            'w-2 h-2 rounded-full transition-all',
                            index === currentImageIndex 
                              ? 'bg-white w-4' 
                              : 'bg-white/50'
                          )}
                        />
                      ))}
                    </div>
                    
                    {/* Image Counter */}
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-full backdrop-blur-sm"
                         style={{
                           background: 'rgba(0, 0, 0, 0.6)'
                         }}>
                      <div className="flex items-center gap-1">
                        <Grid3x3 className="w-3 h-3 text-white" />
                        <span className="text-xs text-white">
                          {currentImageIndex + 1}/{event.images.length}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              /* Fallback if no images */
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-purple-900/20 to-pink-900/20">
                <Image className="w-16 h-16" style={{ color: DESIGN.colors.textSecondary }} />
              </div>
            )}
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute top-16 left-4">
          <span className={cn(
            'px-3 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5 backdrop-blur-sm',
            isLive 
              ? 'bg-red-500/90 text-white animate-pulse' 
              : 'bg-card/90 text-foreground'
          )}
          style={{
            borderRadius: DESIGN.borderRadius.roundButton,
            background: isLive ? `${DESIGN.colors.danger}E6` : `${DESIGN.colors.card}E6`,
            color: isLive ? DESIGN.colors.textPrimary : DESIGN.colors.textPrimary,
            border: `1px solid ${isLive ? `${DESIGN.colors.danger}80` : `${DESIGN.colors.textSecondary}40`}`
          }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" aria-hidden="true"></span>
            {isLive ? 'LIVE NOW' : 'UPCOMING'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main 
        ref={contentRef} 
        className="relative z-10 pb-24"
        style={{ 
          paddingLeft: DESIGN.spacing.app,
          paddingRight: DESIGN.spacing.app,
          marginTop: '-24px',
          background: DESIGN.colors.background
        }}
      >
        {/* Title and Tags */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 
              className="font-bold leading-snug flex-1"
              style={{ 
                fontSize: DESIGN.typography.h1,
                color: DESIGN.colors.textPrimary 
              }}
            >
              {event.name}
            </h1>
            {event.isFeatured && (
              <span 
                className="px-2.5 py-1 text-white text-xs font-semibold rounded-full whitespace-nowrap"
                style={{
                  background: 'linear-gradient(135deg, #C4B5FD 0%, #FFB8E6 100%)',
                  borderRadius: DESIGN.borderRadius.roundButton
                }}
              >
                FEATURED
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <span 
              className="px-2.5 py-1 text-xs font-medium rounded-lg"
              style={{
                background: DESIGN.colors.card,
                color: DESIGN.colors.textPrimary,
                borderRadius: DESIGN.borderRadius.button,
                border: `1px solid ${DESIGN.colors.textSecondary}30`
              }}
            >
              {event.category}
            </span>
            <div 
              className="text-sm"
              style={{ color: DESIGN.colors.textSecondary }}
            >
              <span className="font-medium" style={{ color: DESIGN.colors.primary }}>
                {event.price === 0 ? 'FREE' : `N$${event.price}`}
              </span>
              <span className="mx-1" aria-hidden="true">•</span>
              <span>{event.attendees} attending</span>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <nav 
          className="flex border-b mb-6"
          style={{ 
            borderBottom: `1px solid ${DESIGN.colors.textSecondary}20`
          }}
          aria-label="Event details tabs"
        >
          <button
            onClick={() => setActiveTab('details')}
            className={cn(
              'flex-1 py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
              activeTab === 'details'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            style={{
              borderBottomColor: activeTab === 'details' ? DESIGN.colors.primary : 'transparent',
              color: activeTab === 'details' ? DESIGN.colors.primary : DESIGN.colors.textSecondary,
              fontSize: DESIGN.typography.small
            }}
            aria-current={activeTab === 'details' ? 'page' : undefined}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={cn(
              'flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
              activeTab === 'photos'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            style={{
              borderBottomColor: activeTab === 'photos' ? DESIGN.colors.primary : 'transparent',
              color: activeTab === 'photos' ? DESIGN.colors.primary : DESIGN.colors.textSecondary,
              fontSize: DESIGN.typography.small
            }}
            aria-current={activeTab === 'photos' ? 'page' : undefined}
          >
            <Image className="w-3.5 h-3.5" />
            Photos {eventPhotos.length > 0 && `(${eventPhotos.length})`}
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={cn(
              'flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
              activeTab === 'comments'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            style={{
              borderBottomColor: activeTab === 'comments' ? DESIGN.colors.primary : 'transparent',
              color: activeTab === 'comments' ? DESIGN.colors.primary : DESIGN.colors.textSecondary,
              fontSize: DESIGN.typography.small
            }}
            aria-current={activeTab === 'comments' ? 'page' : undefined}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Comments {eventComments.length > 0 && `(${eventComments.length})`}
          </button>
        </nav>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div 
                  className="p-3 rounded-xl border"
                  style={{
                    background: DESIGN.colors.card,
                    borderRadius: DESIGN.borderRadius.cardInner,
                    border: `1px solid ${DESIGN.colors.textSecondary}20`
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" 
                      aria-hidden="true"
                      style={{
                        background: `${DESIGN.colors.primary}1A`,
                        borderRadius: DESIGN.borderRadius.button
                      }}
                    >
                      <Calendar className="w-4 h-4" style={{ color: DESIGN.colors.primary }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p 
                        className="text-xs truncate"
                        style={{ color: DESIGN.colors.textSecondary }}
                      >
                        Date
                      </p>
                      <p 
                        className="text-sm font-semibold truncate"
                        style={{ color: DESIGN.colors.textPrimary }}
                      >
                        {formattedDate}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className="p-3 rounded-xl border"
                  style={{
                    background: DESIGN.colors.card,
                    borderRadius: DESIGN.borderRadius.cardInner,
                    border: `1px solid ${DESIGN.colors.textSecondary}20`
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" 
                      aria-hidden="true"
                      style={{
                        background: `${DESIGN.colors.primary}1A`,
                        borderRadius: DESIGN.borderRadius.button
                      }}
                    >
                      <Clock className="w-4 h-4" style={{ color: DESIGN.colors.primary }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p 
                        className="text-xs truncate"
                        style={{ color: DESIGN.colors.textSecondary }}
                      >
                        Time
                      </p>
                      <p 
                        className="text-sm font-semibold truncate"
                        style={{ color: DESIGN.colors.textPrimary }}
                      >
                        {event.time}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className="p-3 rounded-xl border col-span-2"
                  style={{
                    background: DESIGN.colors.card,
                    borderRadius: DESIGN.borderRadius.cardInner,
                    border: `1px solid ${DESIGN.colors.textSecondary}20`
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" 
                      aria-hidden="true"
                      style={{
                        background: `${DESIGN.colors.primary}1A`,
                        borderRadius: DESIGN.borderRadius.button
                      }}
                    >
                      <MapPin className="w-4 h-4" style={{ color: DESIGN.colors.primary }} />
                    </div>
                    <div className="flex-1 min-w-0 mr-2">
                      <p 
                        className="text-xs truncate"
                        style={{ color: DESIGN.colors.textSecondary }}
                      >
                        Location
                      </p>
                      <p 
                        className="text-sm font-semibold truncate"
                        style={{ color: DESIGN.colors.textPrimary }}
                      >
                        {event.location}
                      </p>
                      <p 
                        className="text-xs truncate"
                        style={{ color: DESIGN.colors.textSecondary }}
                      >
                        {event.address}
                      </p>
                    </div>
                    <button 
                      onClick={handleNavigateToMap}
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{
                        background: `${DESIGN.colors.primary}1A`,
                        borderRadius: DESIGN.borderRadius.button,
                        color: DESIGN.colors.primary
                      }}
                      aria-label="Open location in maps"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Description */}
              <section>
                <h3 
                  className="font-bold mb-3 flex items-center gap-2"
                  style={{ 
                    fontSize: DESIGN.typography.h4,
                    color: DESIGN.colors.textPrimary 
                  }}
                >
                  About This Event
                  {descriptionTruncated && (
                    <button 
                      onClick={toggleDescription}
                      className="text-primary text-xs font-medium hover:underline flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded"
                      style={{
                        color: DESIGN.colors.primary,
                        fontSize: DESIGN.typography.caption
                      }}
                      aria-expanded={showFullDescription}
                    >
                      {showFullDescription ? 'Show less' : 'Read more'}
                      {showFullDescription ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </h3>
                <div className={cn(
                  'leading-relaxed',
                  !showFullDescription && descriptionTruncated && 'line-clamp-4'
                )}
                style={{
                  color: DESIGN.colors.textSecondary,
                  fontSize: DESIGN.typography.body
                }}>
                  {event.description}
                </div>
              </section>

              {/* Tags */}
              {event.tags.length > 0 && (
                <section>
                  <h3 
                    className="font-semibold mb-2"
                    style={{ 
                      color: DESIGN.colors.textSecondary,
                      fontSize: DESIGN.typography.small
                    }}
                  >
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg border"
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
                className="p-4 rounded-xl border"
                style={{
                  background: DESIGN.colors.card,
                  borderRadius: DESIGN.borderRadius.cardInner,
                  border: `1px solid ${DESIGN.colors.textSecondary}20`
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" style={{ color: DESIGN.colors.primary }} aria-hidden="true" />
                    <span 
                      className="font-medium"
                      style={{ 
                        color: DESIGN.colors.textPrimary,
                        fontSize: DESIGN.typography.body 
                      }}
                    >
                      {event.attendees} people attending
                    </span>
                  </div>
                  <button 
                    className="text-xs font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded"
                    style={{
                      color: DESIGN.colors.primary,
                      fontSize: DESIGN.typography.caption
                    }}
                    onClick={() => {/* TODO: Implement see all attendees */}}
                  >
                    See all
                  </button>
                </div>
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 overflow-hidden"
                      style={{
                        background: '#4A4A4A',
                        borderColor: DESIGN.colors.background
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
                  {event.attendees > 4 && (
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-semibold text-white"
                      style={{
                        background: DESIGN.colors.primary,
                        borderColor: DESIGN.colors.background
                      }}
                      aria-label={`${event.attendees - 4} more attendees`}
                    >
                      +{event.attendees - 4}
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
      </main>

      {/* Sticky Bottom CTA */}
      <footer 
        className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t p-4 pb-safe z-40"
        style={{
          background: `${DESIGN.colors.background}F2`,
          borderTop: `1px solid ${DESIGN.colors.textSecondary}20`,
          padding: DESIGN.spacing.app
        }}
      >
        <div className="mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p 
                className="font-bold truncate"
                style={{ 
                  fontSize: DESIGN.typography.h4,
                  color: DESIGN.colors.textPrimary 
                }}
              >
                {event.price === 0 ? 'FREE ENTRY' : `N$${event.price}`}
              </p>
              <p 
                className="text-xs truncate"
                style={{ color: DESIGN.colors.textSecondary }}
              >
                {hasTicket ? 'Ticket purchased' : 'Per person'}
              </p>
            </div>
            <Button 
              className={cn(
                'flex-1 h-12 rounded-xl text-base font-semibold min-w-[120px] focus:outline-none focus:ring-2 focus:ring-offset-2'
              )}
              style={{
                borderRadius: DESIGN.borderRadius.cardInner,
                height: '48px',
                background: hasTicket && isLive 
                  ? `linear-gradient(135deg, ${DESIGN.colors.success} 0%, #059669 100%)`
                  : `linear-gradient(135deg, ${DESIGN.colors.primary} 0%, ${DESIGN.colors.lavenderLight} 100%)`,
                color: DESIGN.colors.background,
                boxShadow: '0 4px 20px rgba(196, 181, 253, 0.3)'
              }}
              size="lg"
              onClick={() => {/* TODO: Implement ticket purchase */}}
            >
              <Ticket className="w-4 h-4 mr-2" />
              {getCTAText()}
            </Button>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      {isVideoModalOpen && event.mediaType === 'video' && event.videos && event.videos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={fullscreenVideoRef}
              src={event.videos[0]}
              className="w-full h-full object-contain"
              controls
              autoPlay
            />
            
            {/* Close Button */}
            <button
              onClick={closeVideoModal}
              className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm"
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                color: DESIGN.colors.textPrimary
              }}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
