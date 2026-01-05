import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Calendar, MapPin, Users, Clock, Share2, Bookmark, Ticket, ExternalLink, Heart, MessageCircle, Image, ChevronRight, Download, QrCode } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { CommunityPhotos } from '@/components/CommunityPhotos';
import { CommunityComments } from '@/components/CommunityComments';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useScrollDirection } from '@/hooks/useScrollDirection';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, user, bookmarkEvent, communityPhotos, communityComments, tickets } = useApp();
  const { toast } = useToast();
  const { scrollY } = useScrollDirection();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const contentRef = useRef<HTMLDivElement>(null);

  const event = events.find((e) => e.id === id);
  const isBookmarked = user?.bookmarkedEvents.includes(id ?? '');
  const eventPhotos = communityPhotos.filter((p) => p.eventId === id);
  const eventComments = communityComments.filter((c) => c.eventId === id);
  const hasTicket = tickets.some(t => t.eventId === id && t.status === 'active');

  // Handle smooth scrolling and prevent jank
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
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

  const handleGetDirections = () => {
    if (event?.coordinates) {
      const { lat, lng } = event.coordinates;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
    }
  };

  const handleCheckIn = () => {
    if (hasTicket) {
      navigate(`/checkin/${event?.id}`);
    }
  };

  const handleBuyTicket = () => {
    if (!user) {
      navigate('/auth?redirect=/event/' + id);
      return;
    }
    
    if (event?.price === 0) {
      // Handle free registration
      toast({
        title: 'Registered!',
        description: 'You have successfully registered for this free event',
      });
    } else {
      navigate(`/tickets/${event?.id}`);
    }
  };

  const handleViewTicket = () => {
    if (hasTicket) {
      navigate(`/ticket/${id}`);
    }
  };

  const getCTAAction = () => {
    if (!user) return handleBuyTicket;
    if (hasTicket && event?.isLive) return handleCheckIn;
    if (hasTicket) return handleViewTicket;
    return handleBuyTicket;
  };

  const getCTAText = () => {
    if (!user) return 'Sign In to Register';
    if (hasTicket && event?.isLive) return 'Check In Now';
    if (hasTicket) return 'View Ticket';
    return event?.price === 0 ? 'Register Free' : 'Buy Ticket';
  };

  if (!event) {
    return (
      <div className="app-container min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Event not found</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isLive = new Date(event.date) <= new Date();
  const descriptionTruncated = event.description.length > 200;

  // Format date properly
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="app-container min-h-screen bg-background relative overflow-hidden">
      {/* Persistent Header */}
      <div 
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrollY > 100 
            ? 'bg-background/95 backdrop-blur-xl border-b border-border shadow-lg' 
            : 'bg-transparent'
        )}
        style={{ 
          transform: `translateY(${isScrolling ? '-100%' : '0'})`,
          transition: 'transform 0.2s ease'
        }}
      >
        <div className="flex items-center justify-between px-5 h-16 pt-safe max-w-app mx-auto">
          <button
            onClick={() => navigate(-1)}
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
              scrollY > 100 
                ? 'bg-card border border-border hover:border-primary hover:scale-105' 
                : 'bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white'
            )}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1 px-4">
            {scrollY > 100 && (
              <h1 className="text-sm font-semibold truncate text-center animate-fade-in">
                {event.name}
              </h1>
            )}
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleShare}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
                scrollY > 100 
                  ? 'bg-card border border-border hover:border-primary hover:scale-105' 
                  : 'bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white'
              )}
              aria-label="Share event"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => bookmarkEvent(event.id)}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
                isBookmarked 
                  ? 'bg-primary text-primary-foreground hover:scale-105' 
                  : scrollY > 100 
                    ? 'bg-card border border-border hover:border-primary hover:scale-105'
                    : 'bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white'
              )}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark event"}
            >
              <Bookmark className={cn('w-5 h-5', isBookmarked && 'fill-current')} />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Image with Fixed Background */}
      <div className="relative h-[70vh] min-h-[500px] max-h-[600px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10"
        />
        <img
          src={event.coverImage}
          alt={event.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          style={{
            transform: `translateY(${Math.min(scrollY * 0.2, 100)}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        />
        
        {/* Status Badge */}
        <div className="absolute top-20 left-5 z-20">
          <span className={cn(
            'px-4 py-2 text-sm font-semibold rounded-xl flex items-center gap-2 backdrop-blur-sm',
            isLive ? 'bg-green-500/90 text-white shadow-lg' : 'bg-card/90 text-foreground border border-white/20'
          )}>
            {isLive ? (
              <>
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE NOW
              </>
            ) : 'UPCOMING'}
          </span>
        </div>

        {/* Event Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-20 bg-gradient-to-t from-background to-transparent">
          <div className="flex flex-wrap gap-2 mb-3">
            {event.isFeatured && (
              <span className="px-3 py-1 gradient-pro text-white text-xs font-semibold rounded-full backdrop-blur-sm">
                FEATURED
              </span>
            )}
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/30">
              {event.category}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">
            {event.name}
          </h1>
          <div className="flex items-center gap-4 text-white/90">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">{event.attendees.toLocaleString()} attending</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area - Proper Scrolling */}
      <div 
        ref={contentRef}
        className="relative bg-background rounded-t-3xl -mt-8 z-20 pb-40"
      >
        <div className="p-5">
          {/* Quick Actions */}
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2 -mx-5 px-5">
            <button 
              onClick={handleGetDirections}
              className="flex items-center gap-3 px-4 py-3 bg-card rounded-xl border border-border flex-shrink-0 hover:border-primary transition-colors"
            >
              <MapPin className="w-5 h-5 text-primary" />
              <span className="font-medium">Directions</span>
            </button>
            <button 
              onClick={() => navigate(`/event/${id}/photos`)}
              className="flex items-center gap-3 px-4 py-3 bg-card rounded-xl border border-border flex-shrink-0 hover:border-primary transition-colors"
            >
              <Image className="w-5 h-5 text-primary" />
              <span className="font-medium">Photos</span>
            </button>
            <button 
              onClick={() => navigate(`/event/${id}/discussion`)}
              className="flex items-center gap-3 px-4 py-3 bg-card rounded-xl border border-border flex-shrink-0 hover:border-primary transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-primary" />
              <span className="font-medium">Discussion</span>
            </button>
            <button 
              onClick={handleShare}
              className="flex items-center gap-3 px-4 py-3 bg-card rounded-xl border border-border flex-shrink-0 hover:border-primary transition-colors"
            >
              <Share2 className="w-5 h-5 text-primary" />
              <span className="font-medium">Share</span>
            </button>
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-card rounded-2xl p-5 border border-border">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Date & Time</h3>
                  <p className="text-lg font-bold">{formattedDate}</p>
                  <p className="text-primary font-medium">{event.time}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-5 border border-border">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Location</h3>
                  <p className="text-lg font-bold truncate">{event.location}</p>
                  <p className="text-sm text-muted-foreground truncate">{event.address}</p>
                  <button 
                    onClick={handleGetDirections}
                    className="text-primary text-sm font-medium mt-2 flex items-center gap-1 hover:underline"
                  >
                    Get directions <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Price & Capacity */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-card rounded-2xl p-5 border border-border">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Price</h3>
              <p className="text-3xl font-bold">
                {event.price === 0 ? 'FREE' : `N$${event.price}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">per person</p>
            </div>
            <div className="bg-card rounded-2xl p-5 border border-border">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Capacity</h3>
              <p className="text-3xl font-bold">{event.attendees.toLocaleString()}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min((event.attendees / event.maxAttendees) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.round((event.attendees / event.maxAttendees) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">About This Event</h2>
            <div className="bg-card rounded-2xl p-5 border border-border">
              <p className="text-foreground leading-relaxed whitespace-pre-line">
                {showFullDescription || !descriptionTruncated 
                  ? event.description 
                  : `${event.description.slice(0, 300)}...`}
              </p>
              {descriptionTruncated && (
                <button 
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-primary font-medium mt-4 flex items-center gap-1 hover:underline"
                >
                  {showFullDescription ? 'Show less' : 'Read more'}
                  <ChevronRight className={cn("w-4 h-4 transition-transform", showFullDescription && "rotate-90")} />
                </button>
              )}
            </div>
          </div>

          {/* Tags */}
          {event.tags.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-2 bg-card text-sm font-medium rounded-xl border border-border hover:border-primary transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Community Photos Preview */}
          {eventPhotos.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Community Photos</h2>
                <button 
                  onClick={() => navigate(`/event/${id}/photos`)}
                  className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
                >
                  View all <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {eventPhotos.slice(0, 6).map((photo, index) => (
                  <div key={photo.id} className="aspect-square rounded-xl overflow-hidden">
                    <img
                      src={photo.url}
                      alt={`Community photo ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Community Comments */}
          <CommunityComments eventId={event.id} comments={eventComments} />
        </div>
      </div>

      {/* Fixed Bottom CTA - Properly spaced */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border pt-4 pb-safe">
        <div className="max-w-app mx-auto px-5">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold truncate">
                {event.price === 0 ? 'FREE' : `N$${event.price}`}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {event.attendees.toLocaleString()} people attending
              </p>
            </div>
            <Button 
              onClick={getCTAAction()}
              className={cn(
                'h-14 text-lg font-semibold min-w-[160px] rounded-xl',
                hasTicket && isLive 
                  ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg animate-pulse shadow-green-500/25' 
                  : 'gradient-pro glow-purple'
              )}
              size="lg"
            >
              {hasTicket && isLive ? (
                <>
                  <QrCode className="w-5 h-5 mr-2" />
                  {getCTAText()}
                </>
              ) : hasTicket ? (
                <>
                  <Ticket className="w-5 h-5 mr-2" />
                  {getCTAText()}
                </>
              ) : event.price === 0 ? (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  {getCTAText()}
                </>
              ) : (
                <>
                  <Ticket className="w-5 h-5 mr-2" />
                  {getCTAText()}
                </>
              )}
            </Button>
          </div>
          
          {/* Additional Actions Row */}
          <div className="flex gap-3 pb-3">
            <button
              onClick={() => bookmarkEvent(event.id)}
              className={cn(
                'flex-1 h-12 rounded-xl border flex items-center justify-center gap-2 transition-all',
                isBookmarked 
                  ? 'bg-primary/10 border-primary text-primary' 
                  : 'bg-card border-border hover:border-primary'
              )}
            >
              <Bookmark className={cn('w-5 h-5', isBookmarked && 'fill-primary')} />
              <span className="font-medium">{isBookmarked ? 'Saved' : 'Save'}</span>
            </button>
            <button 
              onClick={handleShare}
              className="flex-1 h-12 rounded-xl border border-border bg-card hover:border-primary flex items-center justify-center gap-2 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span className="font-medium">Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
