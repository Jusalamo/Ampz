import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Calendar, MapPin, Users, Clock, Share2, Bookmark, Ticket, ExternalLink } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { CommunityPhotos } from '@/components/CommunityPhotos';
import { CommunityComments } from '@/components/CommunityComments';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, user, bookmarkEvent, communityPhotos, communityComments, tickets } = useApp();
  const { toast } = useToast();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);

  const event = events.find((e) => e.id === id);
  const isBookmarked = user?.bookmarkedEvents.includes(id ?? '');
  const eventPhotos = communityPhotos.filter((p) => p.eventId === id);
  const eventComments = communityComments.filter((c) => c.eventId === id);
  const hasTicket = tickets.some(t => t.eventId === id && t.status === 'active');

  // Handle scroll events safely
  useEffect(() => {
    if (!isMounted.current) return;

    const handleScroll = () => {
      if (isMounted.current) {
        setScrollY(window.scrollY);
      }
    };

    // Initialize scroll position
    handleScroll();
    setHasInitialized(true);

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Prevent auto-scroll on mount
    setTimeout(() => {
      if (isMounted.current && window.scrollY === 0) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }, 50);

    return () => {
      isMounted.current = false;
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Fix scroll to top on component mount
  useEffect(() => {
    if (!hasInitialized) return;
    
    // Only reset scroll if we're at the bottom
    if (window.scrollY > 100) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    
    // Prevent any auto-scrolling behavior
    const preventAutoScroll = (e: WheelEvent) => {
      // Allow normal scrolling, just prevent programmatic scroll
    };
    
    window.addEventListener('wheel', preventAutoScroll, { passive: true });
    
    return () => {
      window.removeEventListener('wheel', preventAutoScroll);
    };
  }, [hasInitialized]);

  const handleShare = async () => {
    const shareData = {
      title: event?.name,
      text: `Check out ${event?.name} on Amps!`,
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
    } catch {
      // User cancelled share
    }
  };

  const handleBookmark = () => {
    if (event) {
      bookmarkEvent(event.id);
    }
  };

  const handleOpenMap = () => {
    if (event?.coordinates) {
      const { lat, lng } = event.coordinates;
      window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
    }
  };

  if (!event) {
    return (
      <div className="app-container min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Event not found</p>
        <Button onClick={() => navigate('/')} variant="outline">
          Go Back Home
        </Button>
      </div>
    );
  }

  const isLive = new Date(event.date) <= new Date();
  const descriptionTruncated = event.description.length > 200;

  // Determine CTA based on context
  const getCTAText = () => {
    if (!user) return 'Buy Ticket';
    if (hasTicket && isLive) return 'Check In Now';
    if (hasTicket) return 'View Ticket';
    return event.price === 0 ? 'Register Free' : 'Buy Ticket';
  };

  const handleCTAClick = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (hasTicket) {
      if (isLive) {
        // Navigate to check-in flow
        navigate(`/checkin/${event.id}`);
      } else {
        // Show ticket
        navigate(`/tickets/${event.id}`);
      }
    } else {
      // Navigate to ticket purchase
      navigate(`/tickets/${event.id}/purchase`);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="app-container min-h-screen bg-background relative"
      style={{ overflowAnchor: 'none' }} // Prevent auto-scrolling
    >
      {/* Persistent Back Button - Always visible */}
      <div 
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 w-full',
          scrollY > 200 ? 'bg-background/95 backdrop-blur-xl border-b border-border' : 'bg-transparent'
        )}
      >
        <div className="flex items-center justify-between px-4 h-14 pt-safe max-w-app mx-auto">
          <button
            onClick={() => navigate(-1)}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
              scrollY > 200 
                ? 'bg-card border border-border hover:border-primary hover:bg-card/80' 
                : 'bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white'
            )}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          {scrollY > 200 && (
            <h1 className="text-sm font-semibold truncate max-w-[200px] px-2">{event.name}</h1>
          )}
          
          <div className="flex gap-2">
            <button 
              onClick={handleShare}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                scrollY > 200 
                  ? 'bg-card border border-border hover:border-primary hover:bg-card/80' 
                  : 'bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white'
              )}
              aria-label="Share event"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleBookmark}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                isBookmarked 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : scrollY > 200 
                    ? 'bg-card border border-border hover:border-primary hover:bg-card/80'
                    : 'bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white'
              )}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark event"}
            >
              <Bookmark className={cn('w-5 h-5', isBookmarked && 'fill-current')} />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Image - Fixed parallax without causing scroll issues */}
      <div className="relative h-[280px] overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{ 
            transform: `translateY(${Math.min(scrollY * 0.2, 30)}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          <img
            src={event.coverImage}
            alt={event.name}
            className="w-full h-full object-cover"
            loading="eager"
            onLoad={() => {
              // Force reflow to prevent scroll jumps
              document.body.style.overflowAnchor = 'none';
            }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute top-20 left-5">
          <span className={cn(
            'px-3 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5',
            isLive ? 'bg-brand-green text-white' : 'bg-card text-foreground border border-border'
          )}>
            <span className={cn('w-2 h-2 rounded-full', isLive ? 'bg-white animate-pulse' : 'bg-muted-foreground')} />
            {isLive ? 'LIVE NOW' : 'UPCOMING'}
          </span>
        </div>
      </div>

      {/* Content - No negative margins causing overlap */}
      <div className="px-5 pt-6 pb-40"> {/* Increased bottom padding for CTA */}
        {/* Tags */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {event.isFeatured && (
            <span className="px-3 py-1.5 bg-gradient-to-r from-primary to-purple-600 text-white text-xs font-semibold rounded-full">
              FEATURED
            </span>
          )}
          <span className="px-3 py-1.5 bg-card text-foreground text-xs font-semibold rounded-full border border-border">
            {event.category}
          </span>
          {event.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-3 py-1.5 bg-card text-foreground text-xs font-semibold rounded-full border border-border"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-5 leading-tight">{event.name}</h1>

        {/* Info Grid - Simplified layout */}
        <div className="space-y-3 mb-6">
          <div className="bg-card p-4 rounded-xl flex items-center gap-3 border border-border">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Date & Time</p>
              <p className="text-sm font-semibold">
                {new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
                {' • '}
                {event.time}
              </p>
            </div>
          </div>
          
          <div className="bg-card p-4 rounded-xl flex items-center gap-3 border border-border">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Location</p>
              <p className="text-sm font-semibold truncate">{event.location}</p>
              {event.address && (
                <p className="text-xs text-muted-foreground truncate">{event.address}</p>
              )}
            </div>
            <button 
              onClick={handleOpenMap}
              className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
              aria-label="Open in maps"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Attendees & Price */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card p-4 rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Attending</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{event.attendees}</span>
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full bg-card border-2 border-background overflow-hidden"
                  >
                    <img
                      src={`https://i.pravatar.cc/100?img=${i + 10}`}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-card p-4 rounded-xl border border-border">
            <div className="text-sm font-medium mb-2">Price</div>
            <div className="text-2xl font-bold">
              {event.price === 0 ? 'FREE' : `N$${event.price}`}
            </div>
            <div className="text-xs text-muted-foreground">per person</div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3">About This Event</h2>
          <div className="bg-card p-4 rounded-xl border border-border">
            <p className="text-muted-foreground leading-relaxed text-sm">
              {showFullDescription || !descriptionTruncated 
                ? event.description 
                : `${event.description.slice(0, 200)}...`}
            </p>
            {descriptionTruncated && (
              <button 
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-primary text-sm font-medium mt-3 hover:underline"
              >
                {showFullDescription ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        </div>

        {/* Community Photos - Only show if there are photos */}
        {eventPhotos.length > 0 && (
          <div className="mb-8">
            <CommunityPhotos eventId={event.id} photos={eventPhotos} />
          </div>
        )}

        {/* Community Comments - Only show if there are comments */}
        {eventComments.length > 0 && (
          <div className="mb-8">
            <CommunityComments eventId={event.id} comments={eventComments} />
          </div>
        )}
      </div>

      {/* Sticky Bottom CTA - Fixed positioning issues */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border z-30 pb-safe"
        style={{ 
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
          transform: 'translateZ(0)' // Force GPU acceleration
        }}
      >
        <div className="max-w-app mx-auto p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold truncate">
                {event.price === 0 ? 'FREE ENTRY' : `N$${event.price}`}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {hasTicket ? 'You have a ticket' : 'Secure your spot'}
              </p>
            </div>
            <Button 
              onClick={handleCTAClick}
              className={cn(
                'h-12 px-6 text-base font-semibold whitespace-nowrap',
                hasTicket && isLive 
                  ? 'bg-brand-green hover:bg-brand-green/90 text-white shadow-lg' 
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              )}
              size="lg"
            >
              <Ticket className="w-5 h-5 mr-2 flex-shrink-0" />
              {getCTAText()}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
