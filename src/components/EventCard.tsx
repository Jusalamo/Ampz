import { Calendar, MapPin, Users, Bookmark } from 'lucide-react';
import { Event } from '@/lib/types';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: Event;
  variant?: 'default' | 'compact' | 'featured';
  onClick?: () => void;
}

export function EventCard({ event, variant = 'default', onClick }: EventCardProps) {
  const { user, bookmarkEvent } = useApp();
  const isBookmarked = user?.bookmarkedEvents.includes(event.id);

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    bookmarkEvent(event.id);
  };

  if (variant === 'compact') {
    return (
      <div
        onClick={onClick}
        className="flex-shrink-0 w-[200px] glass-card p-3 cursor-pointer hover:border-primary transition-all group"
      >
        <div className="relative h-24 rounded-xl overflow-hidden mb-2">
          <img
            src={event.coverImage}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          {event.price === 0 && (
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-brand-green text-foreground text-xs font-semibold rounded-full">
              FREE
            </span>
          )}
        </div>
        <h3 className="font-semibold text-sm truncate">{event.name}</h3>
        <p className="text-xs text-muted-foreground truncate mt-1">{event.location}</p>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div
        onClick={onClick}
        className="relative flex-shrink-0 w-[300px] h-[180px] rounded-2xl overflow-hidden cursor-pointer group"
      >
        <img
          src={event.coverImage}
          alt={event.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-2 mb-1">
            {event.isFeatured && (
              <span className="px-2 py-0.5 gradient-pro text-foreground text-xs font-semibold rounded-full">
                FEATURED
              </span>
            )}
            <span className="px-2 py-0.5 bg-muted/80 text-foreground text-xs rounded-full">
              {event.category}
            </span>
          </div>
          <h3 className="font-bold text-lg">{event.name}</h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {event.attendees}
            </span>
          </div>
        </div>
        <button
          onClick={handleBookmark}
          className={cn(
            'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all',
            isBookmarked ? 'bg-primary text-primary-foreground' : 'bg-background/50 backdrop-blur-sm text-foreground hover:bg-background/70'
          )}
        >
          <Bookmark className={cn('w-4 h-4', isBookmarked && 'fill-current')} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="glass-card overflow-hidden cursor-pointer hover:border-primary transition-all group"
    >
      <div className="relative h-36">
        <img
          src={event.coverImage}
          alt={event.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          {event.price === 0 ? (
            <span className="px-2 py-0.5 bg-brand-green text-foreground text-xs font-semibold rounded-full">
              FREE
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-background/80 backdrop-blur-sm text-foreground text-xs font-semibold rounded-full">
              N${event.price}
            </span>
          )}
        </div>
        <button
          onClick={handleBookmark}
          className={cn(
            'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all',
            isBookmarked ? 'bg-primary text-primary-foreground' : 'bg-background/50 backdrop-blur-sm text-foreground hover:bg-background/70'
          )}
        >
          <Bookmark className={cn('w-4 h-4', isBookmarked && 'fill-current')} />
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1">{event.name}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <MapPin className="w-4 h-4" />
          <span>{event.location}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {event.time}
            </span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{event.attendees}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
