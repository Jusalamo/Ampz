import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, SlidersHorizontal, Plus, MapPin, Calendar, Star, ChevronRight, Layers, X } from 'lucide-react';

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
  const [mapView, setMapView] = useState('3d'); // '2d' or '3d'
  const [isDrawerDragging, setIsDrawerDragging] = useState(false);
  
  const mapContainer = useRef(null);
  const drawerRef = useRef(null);
  const dragStartY = useRef(0);
  const currentTranslate = useRef(0);
  const mapInteractionRef = useRef(false);

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
    setIsDrawerDragging(true);
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
    setTimeout(() => setIsDrawerDragging(false), 100);
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

  // Handle clicks on map to deselect event
  const handleMapClick = (e) => {
    // Only deselect if not clicking on event marker or card
    if (!e.target.closest('.event-marker') && 
        !e.target.closest('.event-card-3d') &&
        !isDrawerDragging) {
      setSelectedEvent(null);
    }
  };

  const toggleMapView = () => {
    setMapView(prev => prev === '2d' ? '3d' : '2d');
  };

  const translateY = SNAP_POSITIONS[drawerPosition] * getDrawerHeight() + dragOffset;

  return (
    <div className="h-screen w-full relative overflow-hidden bg-gray-900">
      {/* Map Container - Fully interactive, always visible */}
      <div 
        ref={mapContainer}
        className="absolute inset-0 w-full h-full"
        style={{ 
          zIndex: 1,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)',
          cursor: isDrawerDragging ? 'default' : 'grab',
          pointerEvents: 'auto' // Map is always interactive
        }}
        onClick={handleMapClick}
      >
        {/* Mock Map Content - Interactive */}
        <div 
          className="w-full h-full relative flex items-center justify-center"
          style={{
            transform: mapView === '3d' ? 'perspective(1000px) rotateX(45deg)' : 'none',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.5s ease'
          }}
        >
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
          
          {/* Mock Event Markers - Interactive */}
          {filteredEvents.map((event, idx) => (
            <div
              key={event.id}
              className="event-marker absolute cursor-pointer hover:scale-110 transition-transform"
              style={{
                left: `${45 + idx * 10}%`,
                top: `${40 + idx * 8}%`,
                zIndex: 50,
                transform: mapView === '3d' 
                  ? `translateZ(${selectedEvent?.id === event.id ? '100px' : '50px'}) translate(-50%, -50%)`
                  : 'translate(-50%, -50%)',
                transformStyle: 'preserve-3d',
                pointerEvents: 'auto'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEvent(event);
              }}
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white relative"
                style={{ 
                  backgroundColor: event.customTheme,
                  boxShadow: selectedEvent?.id === event.id 
                    ? `0 0 30px ${event.customTheme}, 0 8px 16px rgba(0,0,0,0.4)`
                    : '0 4px 8px rgba(0,0,0,0.3)'
                }}
              >
                {event.isFeatured ? (
                  <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                ) : (
                  <div className="w-5 h-5 bg-white/40 rounded-full" />
                )}
                
                {/* Pulsing ring for selected */}
                {selectedEvent?.id === event.id && (
                  <div 
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ 
                      backgroundColor: event.customTheme,
                      opacity: 0.4
                    }}
                  />
                )}
              </div>

              {/* Geofence Circle - Only for selected event */}
              {selectedEvent?.id === event.id && (
                <div
                  className="absolute top-1/2 left-1/2 rounded-full border-2 border-dashed pointer-events-none"
                  style={{
                    width: '200px',
                    height: '200px',
                    transform: 'translate(-50%, -50%)',
                    borderColor: event.customTheme,
                    backgroundColor: `${event.customTheme}15`,
                    animation: 'pulse 2s infinite'
                  }}
                />
              )}
            </div>
          ))}

          {/* Selected Event 3D Card - Floats above marker in 3D space */}
          {selectedEvent && (
            <div
              className="event-card-3d absolute pointer-events-auto"
              style={{
                left: `${45 + filteredEvents.findIndex(e => e.id === selectedEvent.id) * 10}%`,
                top: `${40 + filteredEvents.findIndex(e => e.id === selectedEvent.id) * 8}%`,
                zIndex: 200,
                width: '300px',
                transform: mapView === '3d'
                  ? 'translateZ(150px) translate(-50%, -120%)'
                  : 'translate(-50%, -120%)',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.3s ease'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                className="rounded-2xl shadow-2xl border overflow-hidden backdrop-blur-md"
                style={{
                  background: `${DESIGN.colors.card}f0`,
                  borderColor: `${selectedEvent.customTheme}60`,
                  boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${selectedEvent.customTheme}40`
                }}
              >
                <div className="flex items-start gap-3 p-3">
                  <img 
                    src={selectedEvent.coverImage} 
                    alt={selectedEvent.name}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                    style={{ border: `2px solid ${selectedEvent.customTheme}` }}
                  />
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm line-clamp-1 text-white">
                        {selectedEvent.name}
                      </h3>
                      <button 
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform"
                        style={{ 
                          background: DESIGN.colors.background, 
                          color: DESIGN.colors.textSecondary,
                          border: `1px solid ${DESIGN.colors.textSecondary}40`
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(null);
                        }}
                      >
                        <X className="w-3 h-3" />
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
                        onClick={(e) => {
                          e.stopPropagation();
                          alert('Navigate to event details');
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
        
        {/* Map Controls - Top Right */}
        <div className="absolute top-4 right-4 flex flex-col gap-2" style={{ zIndex: 100 }}>
          <button
            onClick={toggleMapView}
            className="w-10 h-10 rounded-lg flex items-center justify-center backdrop-blur-md hover:scale-105 transition-transform"
            style={{
              background: 'rgba(45, 45, 45, 0.9)',
              border: `1px solid ${DESIGN.colors.textSecondary}40`,
              color: DESIGN.colors.textPrimary,
              boxShadow: DESIGN.shadows.button
            }}
            title={`Switch to ${mapView === '2d' ? '3D' : '2D'} view`}
          >
            <Layers className="w-5 h-5" />
          </button>
          
          <div 
            className="px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-md"
            style={{
              background: 'rgba(45, 45, 45, 0.9)',
              color: DESIGN.colors.primary,
              border: `1px solid ${DESIGN.colors.primary}40`
            }}
          >
            {mapView.toUpperCase()}
          </div>
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
          zIndex: 300, // Higher than map elements
          height: '100%',
          transform: `translateY(${translateY}px)`,
          touchAction: 'none',
          background: DESIGN.colors.background,
          borderTopLeftRadius: DESIGN.borderRadius.large,
          borderTopRightRadius: DESIGN.borderRadius.large,
          borderTop: `1px solid ${DESIGN.colors.textSecondary}20`,
          boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'auto' // Drawer captures events
        }}
      >
        {/* Drawer Handle - Capture drag events */}
        <div
          className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing select-none"
          style={{ pointerEvents: 'auto' }}
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
        <div className="flex-1 flex flex-col px-4 overflow-hidden" style={{ pointerEvents: 'auto' }}>
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
                  border: selectedEvent?.id === event.id 
                    ? `2px solid ${event.customTheme}`
                    : `1px solid ${DESIGN.colors.textSecondary}20`,
                  boxShadow: selectedEvent?.id === event.id
                    ? `0 0 20px ${event.customTheme}40`
                    : DESIGN.shadows.card
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.1; transform: translate(-50%, -50%) scale(1.1); }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
