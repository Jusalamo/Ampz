import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Calendar, MapPin, Users, Clock, Share2, Bookmark, Ticket, ExternalLink, MessageCircle, Image, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'details' | 'photos' | 'comments'>('details');
  const contentRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const event = events.find((e) => e.id === id);
  const isBookmarked = user?.bookmarkedEvents.includes(id ?? '');
  const eventPhotos = communityPhotos.filter((p) => p.eventId === id);
  const eventComments = communityComments.filter((c) => c.eventId === id);
  const hasTicket = tickets.some(t => t.eventId === id && t.status === 'active');

  // Fix scroll issue - prevent automatic scrolling
  useEffect(() => {
    // Reset scroll position to top when component mounts
    window.scrollTo(0, 0);
    
    // Disable any scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Only update if scroll changed meaningfully (more than 5px)
      if (Math.abs(currentScrollY - lastScrollY.current) > 5) {
        setIsScrolled(currentScrollY > 50);
        lastScrollY.current = currentScrollY;
      }
    };

    // Add passive scroll listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
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

  if (!event) {
    return (
      <div className="app-container min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-card flex items-center justify-center">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">Event not found</h2>
          <p className="text-muted-foreground mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/')} className="rounded-lg">
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  const isLive = new Date(event.date) <= new Date();
  const descriptionTruncated = event.description.length > 150;

  // Determine CTA based on context
  const getCTAText = () => {
    if (!user) return 'Buy Ticket';
    if (hasTicket && isLive) return 'Check In Now';
    if (hasTicket) return 'View Ticket';
    return event.price === 0 ? 'Register Free' : 'Buy Ticket';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <div 
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
          isScrolled 
            ? 'bg-background/95 backdrop-blur-xl border-b border-border shadow-sm' 
            : 'bg-transparent'
        )}
      >
        <div className="flex items-center justify-between px-4 h-14 pt-safe max-w-app mx-auto">
          <button
            onClick={() => navigate(-1)}
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
              isScrolled 
                ? 'bg-card hover:bg-card/80' 
                : 'bg-black/40 backdrop-blur-sm hover:bg-black/60'
            )}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          {isScrolled && (
            <h1 className="text-sm font-semibold truncate max-w-[180px]">{event.name}</h1>
          )}
          
          <div className="flex gap-1">
            <button 
              onClick={handleShare}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
                isScrolled 
                  ? 'bg-card hover:bg-card/80' 
                  : 'bg-black/40 backdrop-blur-sm hover:bg-black/60'
              )}
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => bookmarkEvent(event.id)}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center transition-all',
                isBookmarked 
                  ? 'bg-primary text-primary-foreground' 
                  : isScrolled 
                    ? 'bg-card hover:bg-card/80'
                    : 'bg-black/40 backdrop-blur-sm hover:bg-black/60'
              )}
            >
              <Bookmark className={cn('w-4 h-4', isBookmarked && 'fill-current')} />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={event.coverImage}
          alt={event.name}
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute top-16 left-4">
          <span className={cn(
            'px-3 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5 backdrop-blur-sm',
            isLive 
              ? 'bg-red-500/90 text-white animate-pulse border border-red-300' 
              : 'bg-card/90 text-foreground border border-border'
          )}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
            {isLive ? 'LIVE NOW' : 'UPCOMING'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div ref={contentRef} className="px-4 -mt-6 relative z-10 pb-24 max-w-app mx-auto">
        {/* Title and Tags */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="text-xl font-bold leading-snug flex-1">{event.name}</h1>
            {event.isFeatured && (
              <span className="px-2.5 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full whitespace-nowrap">
                FEATURED
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 bg-card text-xs font-medium rounded-lg border border-border">
              {event.category}
            </span>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium" style={{ color: event.customTheme }}>
                {event.price === 0 ? 'FREE' : `N$${event.price}`}
              </span>
              <span className="mx-1">•</span>
              <span>{event.attendees} attending</span>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-border mb-6">
          <button
            onClick={() => setActiveTab('details')}
            className={cn(
              'flex-1 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'details'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={cn(
              'flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5',
              activeTab === 'photos'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Image className="w-3.5 h-3.5" />
            Photos {eventPhotos.length > 0 && `(${eventPhotos.length})`}
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={cn(
              'flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5',
              activeTab === 'comments'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Comments {eventComments.length > 0 && `(${eventComments.length})`}
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card p-3 rounded-xl border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="text-sm font-semibold truncate">
                        {new Date(event.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card p-3 rounded-xl border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="text-sm font-semibold truncate">{event.time}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card p-3 rounded-xl border border-border col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-sm font-semibold truncate">{event.location}</p>
                      <p className="text-xs text-muted-foreground truncate">{event.address}</p>
                    </div>
                    <button className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  About This Event
                  {descriptionTruncated && (
                    <button 
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-primary text-xs font-medium hover:underline flex items-center gap-1"
                    >
                      {showFullDescription ? 'Show less' : 'Read more'}
                      {showFullDescription ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </h3>
                <div className={cn(
                  'text-muted-foreground leading-relaxed text-sm',
                  !showFullDescription && descriptionTruncated && 'line-clamp-4'
                )}>
                  {event.description}
                </div>
              </div>

              {/* Tags */}
              {event.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Tags</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 bg-card text-xs font-medium rounded-lg border border-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Attendees Preview */}
              <div className="bg-card p-4 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">{event.attendees} people attending</span>
                  </div>
                  <button className="text-xs text-primary font-medium hover:underline">
                    See all
                  </button>
                </div>
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gray-200 border-2 border-background overflow-hidden"
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
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-background text-xs font-semibold text-white">
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
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border p-4 pb-safe z-40">
        <div className="max-w-app mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-lg font-bold truncate">
                {event.price === 0 ? 'FREE ENTRY' : `N$${event.price}`}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {hasTicket ? 'Ticket purchased' : 'Per person'}
              </p>
            </div>
            <Button 
              className={cn(
                'flex-1 h-12 rounded-xl text-base font-semibold min-w-[120px]',
                hasTicket && isLive 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg' 
                  : 'bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white'
              )}
              size="lg"
            >
              <Ticket className="w-4 h-4 mr-2" />
              {getCTAText()}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
