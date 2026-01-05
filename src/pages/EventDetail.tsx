import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Calendar, MapPin, Users, Clock, Share2, Bookmark, Ticket, ExternalLink } from 'lucide-react';
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

  const event = events.find((e) => e.id === id);
  const isBookmarked = user?.bookmarkedEvents.includes(id ?? '');
  const eventPhotos = communityPhotos.filter((p) => p.eventId === id);
  const eventComments = communityComments.filter((c) => c.eventId === id);
  const hasTicket = tickets.some(t => t.eventId === id && t.status === 'active');

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

  return (
    <div className="app-container min-h-screen bg-background">
      {/* Persistent Back Button - Always visible */}
      <div 
        className={cn(
          'fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-app z-50 transition-all duration-300',
          scrollY > 200 ? 'bg-background/95 backdrop-blur-xl border-b border-border' : 'bg-transparent'
        )}
      >
        <div className="flex items-center justify-between px-4 h-14 pt-safe">
          <button
            onClick={() => navigate(-1)}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
              scrollY > 200 
                ? 'bg-card border border-border hover:border-primary' 
                : 'bg-black/30 backdrop-blur-sm hover:bg-black/50'
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          {scrollY > 200 && (
            <h1 className="text-sm font-semibold truncate max-w-[200px]">{event.name}</h1>
          )}
          
          <div className="flex gap-2">
            <button 
              onClick={handleShare}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                scrollY > 200 
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
                  : scrollY > 200 
                    ? 'bg-card border border-border hover:border-primary'
                    : 'bg-black/30 backdrop-blur-sm hover:bg-black/50'
              )}
            >
              <Bookmark className={cn('w-5 h-5', isBookmarked && 'fill-current')} />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Image with Parallax Effect */}
      <div className="relative h-[320px] overflow-hidden">
        <div 
          className="absolute inset-0 transition-transform duration-100"
          style={{ transform: `translateY(${Math.min(scrollY * 0.3, 50)}px) scale(${1 + scrollY * 0.0005})` }}
        >
          <img
            src={event.coverImage}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute top-20 left-5">
          <span className={cn(
            'px-3 py-1.5 text-xs font-semibold rounded-full',
            isLive ? 'bg-brand-green text-white animate-pulse' : 'bg-card text-foreground'
          )}>
            {isLive ? '🔴 LIVE' : 'Upcoming'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 -mt-20 relative z-10 pb-32">
        {/* Tags */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {event.isFeatured && (
            <span className="px-3 py-1 gradient-pro text-foreground text-xs font-semibold rounded-full">
              FEATURED
            </span>
          )}
          <span className="px-3 py-1 bg-card text-foreground text-xs font-semibold rounded-full border border-border">
            {event.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-5 leading-tight">{event.name}</h1>

        {/* Info Grid - No Overflow */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
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
          
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="text-sm font-semibold truncate">{event.time}</p>
            </div>
          </div>
          
          <div className="glass-card p-4 flex items-center gap-3 col-span-2">
            <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 mr-2">
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="text-sm font-semibold truncate">{event.location}</p>
              <p className="text-xs text-muted-foreground truncate">{event.address}</p>
            </div>
            <button className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Attendees */}
        <div className="glass-card p-4 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <span className="font-medium">{event.attendees} attending</span>
          </div>
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-9 h-9 rounded-full bg-card border-2 border-background overflow-hidden"
              >
                <img
                  src={`https://i.pravatar.cc/100?img=${i + 10}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center border-2 border-background text-xs font-semibold">
              +{Math.max(0, event.attendees - 4)}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">About This Event</h2>
          <p className="text-muted-foreground leading-relaxed text-sm">
            {showFullDescription || !descriptionTruncated 
              ? event.description 
              : `${event.description.slice(0, 200)}...`}
          </p>
          {descriptionTruncated && (
            <button 
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-primary text-sm font-medium mt-2 hover:underline"
            >
              {showFullDescription ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          {event.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1.5 bg-card text-sm font-medium rounded-full border border-border"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Community Photos */}
        <CommunityPhotos eventId={event.id} photos={eventPhotos} />

        {/* Community Comments */}
        <CommunityComments eventId={event.id} comments={eventComments} />
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app bg-background/95 backdrop-blur-xl border-t border-border p-4 pb-safe z-30">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-2xl font-bold">
              {event.price === 0 ? 'FREE' : `N$${event.price}`}
            </p>
            <p className="text-xs text-muted-foreground">per person</p>
          </div>
          <Button 
            className={cn(
              'flex-1 h-14 text-lg font-semibold',
              hasTicket && isLive 
                ? 'bg-brand-green hover:bg-brand-green/90 text-white animate-pulse' 
                : 'gradient-pro glow-purple'
            )}
          >
            <Ticket className="w-5 h-5 mr-2" />
            {getCTAText()}
          </Button>
        </div>
      </div>
    </div>
  );
}
