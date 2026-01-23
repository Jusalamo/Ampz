import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, SlidersHorizontal, Plus, MapPin, Calendar, Star, ChevronRight } from 'lucide-react';

// Mock data and hooks for demo
const mockEvents = [
  {
    id: '1',
    name: 'Summer Music Festival',
    location: 'Downtown Park',
    category: 'Music',
    coordinates: { lng: 17.0658, lat: -22.5609 },
    coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea',
    date: 'Jan 25, 2026',
    time: '18:00',
    price: 150,
    isFeatured: true,
    customTheme: '#C4B5FD',
    geofenceRadius: 500
  },
  {
    id: '2',
    name: 'Tech Meetup',
    location: 'Innovation Hub',
    category: 'Tech',
    coordinates: { lng: 17.0758, lat: -22.5709 },
    coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
    date: 'Jan 26, 2026',
    time: '14:00',
    price: 0,
    isFeatured: false,
    customTheme: '#FFB8E6',
    geofenceRadius: 300
  }
];

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
  borderRadius: {
    large: '24px',
    medium: '20px',
    small: '12px'
  },
  shadows: {
    card: '0 8px 32px rgba(0, 0, 0, 0.4)',
    button: '0 4px 16px rgba(0, 0, 0, 0.3)'
  }
};

const SNAP_POSITIONS = {
  minimum: 0.88,   // Shows 12% of drawer (mostly map visible)
  half: 0.45,      // 55% drawer visible
  full: 0.05,      // 95% drawer visible (small gap at top)
};

export default function MapDrawer() {
  const [events] = useState(mockEvents);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [drawerPosition, setDrawerPosition] = useState('minimum');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  const mapContainer = useRef(null);
  const drawerRef = useRef(null);
  const dragStartY = useRef(0);
  const currentTranslate = useRef(0);

  const categories = ['All', 'Music', 'Tech', 'Party', 'Art', 'Food', 'Sports'];

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.name.toLowerCase().includes(search.toLowerCase()) ||
        event.location.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [events, search, selectedCategory]);

  const getDrawerHeight = () => {
    return typeof window !== 'undefined' ? window.innerHeight : 800;
  };

  const snapToPosition = useCallback((percentage) => {
    if (percentage > 0.65) return 'minimum';
    if (percentage > 0.25) return 'half';
    return 'full';
  }, []);

  const handleDragStart = (clientY) => {
    setIsDragging(true);
    dragStartY.current = clientY;
    currentTranslate.current = SNAP_POSITIONS[drawerPosition] * getDrawerHeight();
  };

  const handleDragMove = (clientY) => {
    if (!isDragging) return;
    
    const deltaY = clientY - dragStartY.current;
    const maxTranslate = getDrawerHeight() * SNAP_POSITIONS.minimum;
    const minTranslate = getDrawerHeight() * SNAP_POSITIONS.full;
    
    const newTranslate = Math.max(minTranslate, Math.min(maxTranslate, currentTranslate.current + deltaY));
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

  const handleTouchStart = (e) => {
    handleDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    handleDragMove(e.touches[0].clientY);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    handleDragStart(e.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      handleDragMove(e.clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const translateY = SNAP_POSITIONS[drawerPosition] * getDrawerHeight() + dragOffset;

  return (
    <div className="h-screen w-full relative overflow-hidden bg-gray-900">
      {/* Map Container - Always visible, full screen */}
      <div 
        ref={mapContainer}
        className="absolute inset-0 w-full h-full"
        style={{ 
          zIndex: 1,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)'
        }}
      >
        {/* Mock Map Content */}
        <div className="w-full h-full relative flex items-center justify-center">
          <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          {/* Mock Event Markers */}
          {filteredEvents.map((event, idx) => (
            <div
              key={event.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform"
              style={{
                left: `${45 + idx * 10}%`,
                top: `${40 + idx * 8}%`,
                zIndex: 2
              }}
              onClick={() => setSelectedEvent(event)}
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                style={{ backgroundColor: event.customTheme }}
              >
                {event.isFeatured ? (
                  <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                ) : (
                  <div className="w-5 h-5 bg-white/40 rounded-full" />
                )}
              </div>
              
              {/* Event Label */}
              <div 
                className="absolute top-full mt-2 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap"
                style={{ 
                  backgroundColor: DESIGN.colors.card,
                  color: DESIGN.colors.textPrimary,
                  boxShadow: DESIGN.shadows.card
                }}
              >
                {event.name}
              </div>
            </div>
          ))}

          {/* Selected Event Card on Map */}
          {selectedEvent && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-full"
              style={{
                left: '50%',
                top: '45%',
                zIndex: 100,
                width: '280px'
              }}
            >
              <div 
                className="rounded-2xl shadow-2xl border overflow-hidden"
                style={{
                  background: DESIGN.colors.card,
                  borderColor: `${DESIGN.colors.primary}40`,
                  boxShadow: DESIGN.shadows.card
                }}
              >
                <div className="flex items-start gap-3 p-3">
                  <img 
                    src={selectedEvent.coverImage} 
                    alt={selectedEvent.name}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                    style={{ border: `2px solid ${DESIGN.colors.primary}` }}
                  />
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm line-clamp-1 text-white">
                        {selectedEvent.name}
                      </h3>
                      <button 
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform"
                        style={{ 
                          background: DESIGN.colors.card, 
                          color: DESIGN.colors.textSecondary,
                          border: `1px solid ${DESIGN.colors.textSecondary}20`
                        }}
                        onClick={() => setSelectedEvent(null)}
                      >
                        ×
                      </button>
                    </div>
                    <div className="text-xs mt-1 text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        <span>{selectedEvent.date}</span>
                        <span className="ml-1">{selectedEvent.time}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span className="line-clamp-1">{selectedEvent.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-semibold" style={{ color: selectedEvent.customTheme }}>
                        {selectedEvent.price === 0 ? 'FREE' : `N$${selectedEvent.price}`}
                      </span>
                      <button 
                        className="h-7 px-3 text-xs rounded-lg font-medium hover:opacity-90 transition-opacity"
                        style={{ 
                          background: selectedEvent.customTheme, 
                          color: DESIGN.colors.background 
                        }}
                      >
                        View Event
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Map Attribution */}
        <div 
          className="absolute bottom-4 right-2 text-xs px-2 py-1 rounded backdrop-blur-sm"
          style={{ 
            color: DESIGN.colors.textPrimary,
            background: 'rgba(0, 0, 0, 0.4)',
            zIndex: 2
          }}
        >
          © Mapbox © OpenStreetMap
        </div>
      </div>

      {/* Drawer - Events list overlay */}
      <div
        ref={drawerRef}
        className={isDragging ? '' : 'transition-transform duration-300 ease-out'}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          zIndex: 10,
          height: '100%',
          transform: `translateY(${translateY}px)`,
          touchAction: 'none',
          background: DESIGN.colors.background,
          borderTopLeftRadius: DESIGN.borderRadius.large,
          borderTopRightRadius: DESIGN.borderRadius.large,
          borderTop: `1px solid ${DESIGN.colors.textSecondary}20`,
          boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Drawer Handle */}
        <div
          className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleDragEnd}
          onMouseDown={handleMouseDown}
        >
          <div 
            className="w-12 h-1.5 rounded-full" 
            style={{ background: `${DESIGN.colors.textSecondary}30` }} 
          />
          <p className="text-xs mt-2 text-gray-400">
            {drawerPosition === 'minimum' ? `${filteredEvents.length} events - Swipe up` : 
             drawerPosition === 'full' ? 'Swipe down for map' : 
             'Swipe up or down'}
          </p>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 flex flex-col px-4 overflow-hidden">
          {/* Search and Filters */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 h-10 rounded-xl border-0 focus:ring-2 focus:ring-purple-400"
                style={{
                  background: DESIGN.colors.card,
                  color: DESIGN.colors.textPrimary
                }}
              />
            </div>
            
            <button
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:scale-105 transition-transform"
              style={{
                background: DESIGN.colors.card,
                border: `1px solid ${DESIGN.colors.textSecondary}30`,
                color: DESIGN.colors.textPrimary
              }}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            
            <button
              className="h-10 px-3 rounded-xl font-medium flex items-center gap-1 hover:scale-105 transition-transform"
              style={{
                background: DESIGN.colors.primary,
                color: DESIGN.colors.background,
                boxShadow: DESIGN.shadows.button
              }}
            >
              <Plus className="w-4 h-4" />
              <span className="text-xs">Create</span>
            </button>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className="px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all hover:scale-105"
                style={
                  selectedCategory === category
                    ? {
                        background: DESIGN.colors.primary,
                        color: DESIGN.colors.background,
                        boxShadow: DESIGN.shadows.button
                      }
                    : {
                        background: DESIGN.colors.card,
                        color: DESIGN.colors.textSecondary,
                        border: `1px solid ${DESIGN.colors.textSecondary}30`
                      }
                }
              >
                {category}
              </button>
            ))}
          </div>

          {/* Events List */}
          <div className="flex-1 overflow-y-auto space-y-3 pb-24">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                style={{
                  background: DESIGN.colors.card,
                  border: `1px solid ${DESIGN.colors.textSecondary}20`,
                  boxShadow: DESIGN.shadows.card
                }}
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex gap-3 p-3">
                  <img
                    src={event.coverImage}
                    alt={event.name}
                    className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                    style={{ border: `2px solid ${event.customTheme}` }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm mb-1 text-white line-clamp-1">
                      {event.name}
                    </h3>
                    <div className="text-xs text-gray-400 space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        <span>{event.date} • {event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-semibold" style={{ color: event.customTheme }}>
                        {event.price === 0 ? 'FREE' : `N$${event.price}`}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-lg" style={{ 
                        background: `${event.customTheme}20`,
                        color: event.customTheme
                      }}>
                        {event.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
