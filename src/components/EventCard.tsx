import { Calendar, MapPin, Users, Bookmark } from 'lucide-react';
import { Event } from '@/lib/types';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

// Design Constants
const DESIGN = {
  colors: {
    primary: '#C4B5FD',
    lavenderLight: '#E9D5FF',
    accentPink: '#FFB8E6',
    background: '#1A1A1A',
    card: '#2D2D2D',
    textPrimary: '#FFFFFF',
    textSecondary: '#B8B8B8'
  },
  typography: {
    h1: '28px',
    h2: '24px',
    h3: '22px',
    bodyLarge: '15px',
    body: '14px',
    small: '13px',
    caption: '13px',
    button: '16px'
  },
  borderRadius: {
    card: '24px',
    cardInner: '20px',
    button: '12px',
    roundButton: '50%',
    smallPill: '8px'
  },
  shadows: {
    card: '0 8px 32px rgba(0, 0, 0, 0.4)'
  }
};

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

  // Ensure coverImage always has a valid URL
  const coverImage = event.coverImage || 
    event.images?.[0] || 
    `https://via.placeholder.com/400x225/2D2D2D/FFFFFF?text=${encodeURIComponent(event.name)}`;

  if (variant === 'compact') {
    return (
      <div
        onClick={onClick}
        className="flex-shrink-0 w-[200px] p-3 cursor-pointer hover:border-primary transition-all group"
        style={{
          background: DESIGN.colors.card,
          borderRadius: DESIGN.borderRadius.card,
          boxShadow: DESIGN.shadows.card,
          border: `1px solid ${DESIGN.colors.card}`
        }}
      >
        <div 
          className="relative h-24 mb-2 overflow-hidden"
          style={{ borderRadius: DESIGN.borderRadius.cardInner }}
        >
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
            <span 
              className="absolute top-2 left-2 px-2 py-0.5 text-xs font-semibold"
              style={{
                background: '#10B981',
                color: DESIGN.colors.background,
                borderRadius: DESIGN.borderRadius.smallPill
              }}
            >
              FREE
            </span>
          )}
        </div>
        <h3 
          className="font-semibold truncate"
          style={{
            fontSize: DESIGN.typography.body,
            color: DESIGN.colors.textPrimary
          }}
        >
          {event.name}
        </h3>
        <p 
          className="truncate mt-1"
          style={{
            fontSize: DESIGN.typography.small,
            color: DESIGN.colors.textSecondary
          }}
        >
          {event.location}
        </p>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div
        onClick={onClick}
        className="relative flex-shrink-0 w-[300px] h-[180px] cursor-pointer group"
        style={{ borderRadius: DESIGN.borderRadius.card }}
      >
        <img
          src={coverImage}
          alt={event.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          style={{ borderRadius: DESIGN.borderRadius.card }}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://via.placeholder.com/300x180/2D2D2D/FFFFFF?text=${encodeURIComponent(event.name.substring(0, 30))}`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-2 mb-1">
            {event.isFeatured && (
              <span 
                className="px-2 py-0.5 text-xs font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${DESIGN.colors.primary} 0%, ${DESIGN.colors.lavenderLight} 100%)`,
                  color: DESIGN.colors.background,
                  borderRadius: DESIGN.borderRadius.smallPill
                }}
              >
                FEATURED
              </span>
            )}
            <span 
              className="px-2 py-0.5 text-xs"
              style={{
                background: `${DESIGN.colors.textSecondary}20`,
                color: DESIGN.colors.textPrimary,
                borderRadius: DESIGN.borderRadius.smallPill
              }}
            >
              {event.category}
            </span>
          </div>
          <h3 
            className="font-bold mb-1"
            style={{
              fontSize: DESIGN.typography.h3,
              color: DESIGN.colors.textPrimary
            }}
          >
            {event.name}
          </h3>
          <div 
            className="flex items-center gap-3 mt-1"
            style={{ fontSize: DESIGN.typography.small, color: DESIGN.colors.textSecondary }}
          >
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
            isBookmarked ? 'text-white' : 'text-foreground hover:bg-black/30'
          )}
          style={{
            background: isBookmarked ? DESIGN.colors.primary : `${DESIGN.colors.background}80`,
            borderRadius: DESIGN.borderRadius.roundButton
          }}
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
      className="overflow-hidden cursor-pointer hover:border-primary transition-all group"
      style={{
        background: DESIGN.colors.card,
        borderRadius: DESIGN.borderRadius.card,
        boxShadow: DESIGN.shadows.card,
        border: `1px solid ${DESIGN.colors.card}`
      }}
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
            <span 
              className="px-2 py-0.5 text-xs font-semibold"
              style={{
                background: '#10B981',
                color: DESIGN.colors.background,
                borderRadius: DESIGN.borderRadius.smallPill
              }}
            >
              FREE
            </span>
          ) : (
            <span 
              className="px-2 py-0.5 text-xs font-semibold backdrop-blur-sm"
              style={{
                background: `${DESIGN.colors.background}80`,
                color: DESIGN.colors.textPrimary,
                borderRadius: DESIGN.borderRadius.smallPill
              }}
            >
              N${event.price}
            </span>
          )}
        </div>
        <button
          onClick={handleBookmark}
          className={cn(
            'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-sm',
            isBookmarked ? 'text-white' : 'text-foreground hover:bg-black/30'
          )}
          style={{
            background: isBookmarked ? DESIGN.colors.primary : `${DESIGN.colors.background}80`,
            borderRadius: DESIGN.borderRadius.roundButton
          }}
        >
          <Bookmark className={cn('w-4 h-4', isBookmarked && 'fill-current')} />
        </button>
      </div>
      <div className="p-4">
        <h3 
          className="font-bold mb-1"
          style={{
            fontSize: DESIGN.typography.h3,
            color: DESIGN.colors.textPrimary
          }}
        >
          {event.name}
        </h3>
        <div 
          className="flex items-center gap-2 mb-2"
          style={{ fontSize: DESIGN.typography.body, color: DESIGN.colors.textSecondary }}
        >
          <MapPin className="w-4 h-4" />
          <span>{event.location}</span>
        </div>
        <div 
          className="flex items-center justify-between"
          style={{ fontSize: DESIGN.typography.body, color: DESIGN.colors.textSecondary }}
        >
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
