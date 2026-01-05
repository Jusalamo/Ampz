import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Calendar, MapPin, Users, Clock, Share2, Bookmark, Ticket, ExternalLink, Image, MessageCircle } from 'lucide-react';
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
  const [isScrolled, setIsScrolled] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const event = events.find((e) => e.id === id);
  const isBookmarked = user?.bookmarkedEvents.includes(id ?? '');
  const eventPhotos = communityPhotos.filter((p) => p.eventId === id);
  const eventComments = communityComments.filter((c) => c.eventId === id);
  const hasTicket = tickets.some(t => t.eventId === id && t.status === 'active');

  // Fix scrolling issue - prevent automatic scroll
  useEffect(() => {
    // Reset scroll position when component mounts
    window.scrollTo(0, 0);
    
    // Add scroll listener for header effects
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Prevent any auto-scrolling behavior
    const preventAutoScroll = (e: Event) => {
      e.preventDefault();
    };
    
    // Add passive event listener to prevent scrolling issues
    window.addEventListener('wheel', preventAutoScroll, { passive: false });
    window.addEventListener('touchmove', preventAutoScroll, { passive: false });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', preventAutoScroll);
      window.removeEventListener('touchmove', preventAutoScroll);
    };
  }, []);

  // Additional fix for iOS Safari scrolling issues
  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

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

  if (!event) {
    return (
      <div className="app-container min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Event not found</p>
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

  const getCTAButtonClass = () => {
    if (!user) return 'gradient-pro glow-purple';
    if (hasTicket && isLive) return 'bg-brand-green hover:bg-brand-green/90 text-white';
    if (hasTicket) return 'bg-primary hover:bg-primary/90 text-white';
    return 'gradient-pro glow-purple';
  };

  return (
    <div className="app-container min-h-screen bg-background relative">
      {/* Persistent Back Button - Optimized for mobile & desktop */}
      <div 
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled 
            ? 'bg-background/95 backdrop-blur-xl border-b border-border shadow-sm' 
            : 'bg-transparent'
        )}
      >
        <div className="flex items-center justify-between px-4 h-14 pt-safe max-w-app mx-auto">
          <button
            onClick={() => navigate(-1)}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
              isScrolled 
                ? 'bg-card border border-border hover:border-primary' 
                : 'bg-black/30 backdrop-blur-sm hover:bg-black/50'
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          {isScrolled && (
            <h1 className="text-sm font-semibold truncate max-w-[200px] text-center">{event.name}</h1>
          )}
          
          <div className="flex gap-2">
            <button 
              onClick={handleShare}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                isScrolled 
                  ? 'bg-card border border-border hover:border-primary' 
                  : 'bg-black/30 backdrop-blur-sm hover:bg-black/50'
              )}
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => bookmarkEvent(event.id)}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                isBookmarked 
                  ? 'bg-primary text-primary-foreground' 
                  : isScrolled 
                    ? 'bg-card border border-border hover:border-primary'
                    : 'bg-black/30 backdrop-blur-sm hover:bg-black/50'
              )}
            >
              <Bookmark className={cn('w-5 h-5', isBookmarked && 'fill-current')} />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Image with Optimized Parallax */}
      <div className="relative h-[320px] sm:h-[400px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={event.coverImage}
            alt={event.name}
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Status Badge - Positioned for both mobile and desktop */}
        <div className="absolute top-20 sm:top-24 left-4 sm:left-6">
          <span className={cn(
            'px-3 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5',
            isLive 
              ? 'bg-brand-green text-white shadow-lg animate-pulse' 
              : 'bg-card text-foreground border border-border'
          )}>
            {isLive ? (
              <>
                <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                <span>LIVE NOW</span>
              </>
            ) : (
              'UPCOMING'
            )}
          </span>
        </div>
      </div>

      {/* Content Area - Fixed scrolling */}
      <div 
        ref={contentRef}
        className="px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-10 pb-32 overflow-visible"
      >
        {/* Event Tags */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {event.isFeatured && (
            <span className="px-3 py-1.5 gradient-pro text-foreground text-xs font-semibold rounded-full border border-primary/20">
              🌟 FEATURED
            </span>
          )}
          <span className="px-3 py-1.5 bg-card text-foreground text-xs font-semibold rounded-full border border-border">
            {event.category.toUpperCase()}
          </span>
          {event.price === 0 && (
            <span className="px-3 py-1.5 bg-green-500/20 text-green-600 text-xs font-semibold rounded-full border border-green-500/30">
              FREE
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold mb-5 leading-tight">{event.name}</h1>

        {/* Info Grid - Optimized for mobile & desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="glass-card p-4 sm:p-5 flex items-center gap-3 hover:bg-card/50 transition-colors">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-muted-foreground">Date</p>
              <p className="text-sm sm:text-base font-semibold truncate">
                {new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
          
          <div className="glass-card p-4 sm:p-5 flex items-center gap-3 hover:bg-card/50 transition-colors">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-muted-foreground">Time</p>
              <p className="text-sm sm:text-base font-semibold truncate">{event.time}</p>
            </div>
          </div>
          
          <div className="glass-card p-4 sm:p-5 flex items-center gap-3 col-span-full hover:bg-card/50 transition-colors">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0 mr-2">
              <p className="text-xs sm:text-sm text-muted-foreground">Location</p>
              <p className="text-sm sm:text-base font-semibold truncate">{event.location}</p>
              <p className="text-xs text-muted-foreground truncate mt-1">{event.address}</p>
            </div>
            <button 
              className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
              onClick={() => window.open(`https://maps.google.com/?q=${event.address}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Attendees Section */}
        <div className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <span className="font-medium text-sm sm:text-base">{event.attendees} attending</span>
              <p className="text-xs text-muted-foreground mt-0.5">{event.maxAttendees - event.attendees} spots left</p>
            </div>
          </div>
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-card border-2 border-background overflow-hidden"
              >
                <img
                  src={`https://i.pravatar.cc/100?img=${i + 10}`}
                  alt="Attendee"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
            {event.attendees > 4 && (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center border-2 border-background text-xs font-semibold text-white">
                +{event.attendees - 4}
              </div>
            )}
          </div>
        </div>

        {/* Description Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg sm:text-xl font-bold">About This Event</h2>
            {descriptionTruncated && (
              <button 
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-primary text-sm font-medium hover:underline px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
              >
                {showFullDescription ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
          <div className="bg-card/50 rounded-xl p-4 sm:p-5">
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              {showFullDescription || !descriptionTruncated 
                ? event.description 
                : `${event.description.slice(0, 200)}...`}
            </p>
          </div>
        </div>

        {/* Event Tags */}
        {event.tags.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg sm:text-xl font-bold mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-card text-sm font-medium rounded-full border border-border hover:border-primary transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Community Sections with Tab Navigation for Mobile */}
        <div className="mb-20">
          <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-xl border-b border-border -mx-4 sm:-mx-6 px-4 sm:px-6">
            <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
              <button
                className="flex items-center gap-2 py-3 px-1 border-b-2 border-transparent hover:text-primary transition-colors whitespace-nowrap text-sm font-medium"
                onClick={() => {
                  const photosSection = document.getElementById('community-photos');
                  photosSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Image className="w-4 h-4" />
                Photos ({eventPhotos.length})
              </button>
              <button
                className="flex items-center gap-2 py-3 px-1 border-b-2 border-transparent hover:text-primary transition-colors whitespace-nowrap text-sm font-medium"
                onClick={() => {
                  const commentsSection = document.getElementById('community-comments');
                  commentsSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <MessageCircle className="w-4 h-4" />
                Comments ({eventComments.length})
              </button>
            </div>
          </div>

          {/* Community Photos Section */}
          <div id="community-photos" className="pt-6">
            <CommunityPhotos eventId={event.id} photos={eventPhotos} />
          </div>

          {/* Community Comments Section */}
          <div id="community-comments" className="pt-10">
            <CommunityComments eventId={event.id} comments={eventComments} />
          </div>
        </div>
      </div>

      {/* Sticky Bottom CTA - Optimized for mobile & desktop */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-40 pb-safe">
        <div className="max-w-app mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <p className="text-xl sm:text-2xl font-bold truncate">
                  {event.price === 0 ? 'FREE' : `N$${event.price}`}
                </p>
                {event.price > 0 && (
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">per person</p>
                )}
              </div>
              {event.price === 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">No payment required</p>
              )}
            </div>
            <Button 
              className={cn(
                'flex-shrink-0 h-12 sm:h-14 text-base sm:text-lg font-semibold px-6 sm:px-8 min-w-[140px] sm:min-w-[160px]',
                getCTAButtonClass()
              )}
              size="lg"
            >
              <Ticket className="w-5 h-5 sm:w-6 sm:h-6 mr-2 flex-shrink-0" />
              <span className="truncate">{getCTAText()}</span>
            </Button>
          </div>
          
          {/* Additional mobile-only info */}
          <div className="sm:hidden mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{event.attendees} attending</span>
            <span>{isLive ? 'Live Now' : 'Upcoming'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
