import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, Plus, MapPin } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { EventCard } from './EventCard';
import { Input } from './ui/input';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoianVzYSIsImEiOiJjbWpjanh5amEwbDEwM2dzOXVhbjZ5dzcwIn0.stWdbPHCrf9sKrRJRmShlg';

interface MapDrawerProps {
  onCreateEvent: () => void;
  onOpenFilters: () => void;
}

type DrawerPosition = 'minimum' | 'half' | 'full';

const SNAP_POSITIONS = {
  minimum: 0.75, // 25% visible
  half: 0.5,     // 50% visible
  full: 0,       // 100% visible
};

export function MapDrawer({ onCreateEvent, onOpenFilters }: MapDrawerProps) {
  const navigate = useNavigate();
  const { events, theme, user } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [drawerPosition, setDrawerPosition] = useState<DrawerPosition>('half');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const currentTranslate = useRef(0);

  const categories = ['All', 'Music', 'Tech', 'Party', 'Art', 'Food', 'Sports'];

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(search.toLowerCase()) ||
      event.location.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
      center: [17.0658, -22.5609], // Windhoek
      zoom: 11,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add event markers
    events.forEach((event) => {
      const el = document.createElement('div');
      el.className = 'event-marker';
      el.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
        <div class="p-3 min-w-[200px]">
          <h3 class="font-bold text-sm mb-1">${event.name}</h3>
          <p class="text-xs text-gray-500 mb-2">${event.location}</p>
          <p class="text-xs text-gray-500">${event.attendees} attending</p>
        </div>
      `);

      new mapboxgl.Marker(el)
        .setLngLat([event.coordinates.lng, event.coordinates.lat])
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener('click', () => {
        map.current?.flyTo({
          center: [event.coordinates.lng, event.coordinates.lat],
          zoom: 14,
          duration: 1000,
        });
      });
    });

    // User location marker
    const userMarker = document.createElement('div');
    userMarker.innerHTML = `
      <div class="w-4 h-4 rounded-full bg-brand-green border-2 border-white shadow-lg animate-pulse"></div>
    `;
    new mapboxgl.Marker(userMarker)
      .setLngLat([17.0658, -22.5609])
      .addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update map style on theme change
  useEffect(() => {
    if (map.current) {
      map.current.setStyle(theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11');
    }
  }, [theme]);

  const getDrawerHeight = () => {
    if (typeof window === 'undefined') return 500;
    return window.innerHeight - 64 - 65; // Header and nav height
  };

  const snapToPosition = useCallback((percentage: number): DrawerPosition => {
    if (percentage > 0.625) return 'minimum';
    if (percentage > 0.25) return 'half';
    return 'full';
  }, []);

  const handleDragStart = (clientY: number) => {
    setIsDragging(true);
    dragStartY.current = clientY;
    currentTranslate.current = SNAP_POSITIONS[drawerPosition] * getDrawerHeight();
  };

  const handleDragMove = (clientY: number) => {
    if (!isDragging) return;
    
    const deltaY = clientY - dragStartY.current;
    const newTranslate = Math.max(0, Math.min(getDrawerHeight() * 0.75, currentTranslate.current + deltaY));
    setDragOffset(newTranslate - currentTranslate.current);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    
    const finalTranslate = currentTranslate.current + dragOffset;
    const percentage = finalTranslate / getDrawerHeight();
    const newPosition = snapToPosition(percentage);
    
    setDrawerPosition(newPosition);
    setDragOffset(0);
    setIsDragging(false);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const getTransformValue = () => {
    const baseTranslate = SNAP_POSITIONS[drawerPosition] * getDrawerHeight();
    const totalTranslate = isDragging ? baseTranslate + dragOffset : baseTranslate;
    return `translateY(${totalTranslate}px)`;
  };

  return (
    <div className="relative h-full">
      {/* Mapbox Map */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0 z-0"
        style={{ top: 0, bottom: 65 }}
      />

      {/* Events Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          'absolute left-0 right-0 bg-background rounded-t-3xl z-10 shadow-2xl',
          !isDragging && 'transition-transform duration-400 ease-out'
        )}
        style={{
          height: getDrawerHeight(),
          bottom: 65,
          transform: getTransformValue(),
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center py-4 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className={cn(
            'w-12 h-1.5 rounded-full transition-colors',
            isDragging ? 'bg-primary' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
          )} />
        </div>

        {/* Drawer Content */}
        <div className="px-5 overflow-hidden h-full">
          {/* Search and Actions */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 pl-12 bg-card border-border"
              />
            </div>
            <button 
              onClick={onOpenFilters}
              className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center hover:border-primary transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Create Event Button */}
          <button
            onClick={onCreateEvent}
            className="w-full mb-4 py-3 rounded-xl gradient-pro text-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity relative"
          >
            <Plus className="w-5 h-5" />
            Create Event
            {user?.subscription.tier === 'free' && (
              <span className="absolute right-3 px-2 py-0.5 bg-background/20 text-xs rounded-full">
                PRO
              </span>
            )}
          </button>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 mb-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                )}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Events List */}
          <div 
            className="overflow-y-auto space-y-4 pb-8"
            style={{ maxHeight: 'calc(100% - 200px)' }}
          >
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => navigate(`/event/${event.id}`)}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No events found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
