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

  const coverImage = event.coverImage || 
    event.images?.[0] || 
    `https://via.placeholder.com/400x225/2D2D2D/FFFFFF?text=${encodeURIComponent(event.name)}`;

  if (variant === 'compact') {
    return (
      <div
        onClick={onClick}
        className="flex-shrink-0 w-[200px] p-3 cursor-pointer hover:border-primary transition-all group bg-card rounded-[24px] shadow-md border border-card"
      >
        <div className="relative h-24 mb-2 overflow-hidden rounded-[20px]">
          <img
            src={coverImage}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://via.placeholder.com/200x120/2D2D2D/FFFFFF?text=${encodeURIComponent(event.name.substring(0, 20))}`;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          {event.price === 0 && (
            <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-semibold bg-emerald-500 text-primary-foreground rounded-lg">
              FREE
            </span>
          )}
        </div>
        <h3 className="font-semibold text-sm text-foreground truncate">
          {event.name}
        </h3>
        <p className="text-xs text-muted-foreground truncate mt-1">
          {event.location}
        </p>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div
        onClick={onClick}
        className="relative flex-shrink-0 w-[300px] h-[180px] cursor-pointer group rounded-[24px] overflow-hidden"
      >
        <img
          src={coverImage}
          alt={event.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://via.placeholder.com/300x180/2D2D2D/FFFFFF?text=${encodeURIComponent(event.name.substring(0, 30))}`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-2 mb-1">
            {event.isFeatured && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg">
                FEATURED
              </span>
            )}
            <span className="px-2 py-0.5 text-xs bg-foreground/20 text-white rounded-lg">
              {event.category}
            </span>
          </div>
          <h3 className="font-bold text-[22px] text-white mb-1">
            {event.name}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-white/70">
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
            'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-sm',
            isBookmarked ? 'bg-primary text-white' : 'bg-background/50 text-foreground hover:bg-black/30'
          )}
        >
          <Bookmark className={cn('w-4 h-4', isBookmarked && 'fill-current')} />
        </button>
      </div>
    );
  }

  // Default variant
  return (
    <div
      onClick={onClick}
      className="overflow-hidden cursor-pointer hover:border-primary transition-all group bg-card rounded-[24px] shadow-md border border-card"
    >
      <div className="relative h-36">
        <img
          src={coverImage}
          alt={event.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x144/2D2D2D/FFFFFF?text=${encodeURIComponent(event.name.substring(0, 30))}`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          {event.price === 0 ? (
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500 text-white rounded-lg">
              FREE
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs font-semibold backdrop-blur-sm bg-background/50 text-white rounded-lg">
              N${event.price}
            </span>
          )}
        </div>
        <button
          onClick={handleBookmark}
          className={cn(
            'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-sm',
            isBookmarked ? 'bg-primary text-white' : 'bg-background/50 text-foreground hover:bg-black/30'
          )}
        >
          <Bookmark className={cn('w-4 h-4', isBookmarked && 'fill-current')} />
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-[22px] text-foreground mb-1">
          {event.name}
        </h3>
        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{event.location}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {event.time}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{event.attendees}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
