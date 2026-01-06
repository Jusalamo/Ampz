import { useState, useRef } from 'react';
import { MapPin, Briefcase } from 'lucide-react';
import { ConnectionProfile } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SwipeCardProps {
  profile: ConnectionProfile;
  onSwipe: (direction: 'left' | 'right') => void;
  isTop: boolean;
}

export function SwipeCard({ profile, onSwipe, isTop }: SwipeCardProps) {
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (clientX: number, clientY: number) => {
    if (!isTop) return;
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging || !isTop) return;
    const offsetX = clientX - dragStart.x;
    const offsetY = clientY - dragStart.y;
    setDragOffset({ x: offsetX, y: offsetY });
  };

  const handleDragEnd = () => {
    if (!isDragging || !isTop) return;
    setIsDragging(false);
    
    const threshold = 100;
    if (dragOffset.x > threshold) {
      onSwipe('right');
    } else if (dragOffset.x < -threshold) {
      onSwipe('left');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const rotation = dragOffset.x * 0.1;
  const opacity = Math.max(0, 1 - Math.abs(dragOffset.x) / 300);

  return (
    <div
      ref={cardRef}
      className={cn(
        'absolute inset-0 w-full h-full rounded-3xl overflow-hidden swipe-card touch-none select-none',
        isTop ? 'z-10' : 'z-0'
      )}
      style={{
        transform: isTop
          ? `translateX(${dragOffset.x}px) translateY(${dragOffset.y * 0.5}px) rotate(${rotation}deg)`
          : 'scale(0.95) translateY(20px)',
        opacity: isTop ? opacity : 0.7,
        transition: isDragging ? 'none' : 'all 0.3s ease-out',
      }}
      onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleDragEnd}
    >
      {/* Card Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-purple-700">
        {/* Gold frame effect */}
        <div className="absolute -inset-1 bg-gradient-to-br from-amber-300/30 to-orange-400/30 rounded-3xl -z-10 rotate-2" />
      </div>
      
      {/* Profile Photo */}
      <div className="relative h-[65%]">
        <img
          src={profile.photo}
          alt={profile.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      {/* Swipe Indicators */}
      {isTop && (
        <>
          <div
            className="absolute top-8 left-8 px-4 py-2 border-4 border-green-500 text-green-500 font-bold text-2xl rounded-lg rotate-[-20deg] shadow-lg bg-black/30 backdrop-blur-sm"
            style={{ opacity: Math.max(0, dragOffset.x / 100) }}
          >
            LIKE
          </div>
          <div
            className="absolute top-8 right-8 px-4 py-2 border-4 border-red-500 text-red-500 font-bold text-2xl rounded-lg rotate-[20deg] shadow-lg bg-black/30 backdrop-blur-sm"
            style={{ opacity: Math.max(0, -dragOffset.x / 100) }}
          >
            NOPE
          </div>
        </>
      )}

      {/* Profile Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold">{profile.name}</h2>
          <span className="text-xl opacity-80">{profile.age}</span>
        </div>
        
        {profile.occupation && (
          <div className="flex items-center gap-2 text-sm opacity-80 mb-2">
            <Briefcase className="w-4 h-4" />
            <span>{profile.occupation}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm opacity-80 mb-3">
          <MapPin className="w-4 h-4" />
          <span>{profile.location}</span>
        </div>
        
        <p className="text-sm opacity-90 mb-3 line-clamp-2">{profile.bio}</p>
        
        <div className="flex flex-wrap gap-2">
          {profile.interests.slice(0, 4).map((interest) => (
            <span
              key={interest}
              className="px-3 py-1 bg-white/20 backdrop-blur-sm text-xs font-medium rounded-full"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
