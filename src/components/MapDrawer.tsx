import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, Plus, MapPin, X, Users, Calendar, DollarSign } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { EventCard } from './EventCard';
import { Input } from './ui/input';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from './ui/button';
import { Event } from '@/lib/types';

const MAPBOX_TOKEN = 'pk.eyJ1IjoianVzYSIsImEiOiJjbWpjanh5amEwbDEwM2dzOXVhbjZ5dzcwIn0.stWdbPHCrf9sKrRJRmShlg';

interface MapDrawerProps {
  onCreateEvent: () => void;
  onOpenFilters: () => void;
}

type DrawerPosition = 'minimum' | 'half' | 'full';

const SNAP_POSITIONS = {
  full: 0,       // 0% - Map completely hidden (shows drawer handle only)
  half: 0.5,     // 50% - Half map, half events
  minimum: 0.85, // 15% - Mostly map, small events bar
};

export function MapDrawer({ onCreateEvent, onOpenFilters }: MapDrawerProps) {
  const navigate = useNavigate();
  const { events, user } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [drawerPosition, setDrawerPosition] = useState<DrawerPosition>('half');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventCard, setShowEventCard] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number]>([17.0658, -22.5609]);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const eventCardRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
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

  // Initialize map with better styling
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12', // Regular colored map
      center: [17.0658, -22.5609], // Windhoek
      zoom: 11,
      pitch: 45,
      bearing: -17.6,
      antialias: true,
      interactive: true,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Add geolocate control
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserLocation: true,
    });
    
    map.current.addControl(geolocate, 'top-right');

    geolocate.on('geolocate', (e: any) => {
      setUserLocation([e.coords.longitude, e.coords.latitude]);
    });

    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setUserLocation([longitude, latitude]);
          map.current?.flyTo({
            center: [longitude, latitude],
            zoom: 13,
            duration: 2000,
          });
        },
        () => {
          console.log('Using default location');
        }
      );
    }

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add event markers with click handlers
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for filtered events
    filteredEvents.forEach((event) => {
      const markerElement = document.createElement('div');
      markerElement.className = 'event-marker cursor-pointer group';
      markerElement.innerHTML = `
        <div class="relative">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200 border-2 border-white">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            </svg>
          </div>
          <div class="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full border border-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-700">
            ${event.attendees > 99 ? '99+' : event.attendees}
          </div>
        </div>
      `;

      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'center',
      })
        .setLngLat([event.coordinates.lng, event.coordinates.lat])
        .addTo(map.current!);

      // Add geofence circle for this event
      addGeofenceCircle(event);

      markerElement.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedEvent(event);
        setShowEventCard(true);
        
        // Fly to event location
        map.current?.flyTo({
          center: [event.coordinates.lng, event.coordinates.lat],
          zoom: 14,
          pitch: 60,
          bearing: 40,
          duration: 1500,
        });
      });

      markersRef.current.push(marker);
    });

    // Add user location marker
    const userMarkerElement = document.createElement('div');
    userMarkerElement.className = 'user-marker';
    userMarkerElement.innerHTML = `
      <div class="relative">
        <div class="w-6 h-6 rounded-full bg-brand-green animate-pulse"></div>
        <div class="absolute inset-0 rounded-full bg-brand-green/30 animate-ping"></div>
      </div>
    `;

    const userMarker = new mapboxgl.Marker({
      element: userMarkerElement,
      anchor: 'center',
    })
      .setLngLat(userLocation)
      .addTo(map.current!);

    markersRef.current.push(userMarker);

  }, [filteredEvents, userLocation]);

  const addGeofenceCircle = (event: Event) => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const { lat, lng } = event.coordinates;
    const radiusInKm = event.geofenceRadius / 1000;
    
    // Generate circle coordinates
    const points = 64;
    const coords: [number, number][] = [];
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const dx = radiusInKm * Math.cos(angle) / 111.32;
      const dy = radiusInKm * Math.sin(angle) / (111.32 * Math.cos(lat * Math.PI / 180));
      coords.push([lng + dy, lat + dx]);
    }
    coords.push(coords[0]); // Close the circle

    const sourceId = `geofence-${event.id}`;
    const fillLayerId = `geofence-fill-${event.id}`;
    const lineLayerId = `geofence-line-${event.id}`;

    // Remove existing layers if they exist
    if (map.current.getLayer(fillLayerId)) map.current.removeLayer(fillLayerId);
    if (map.current.getLayer(lineLayerId)) map.current.removeLayer(lineLayerId);
    if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);

    // Add new source and layers
    map.current.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [coords] },
      },
    });

    map.current.addLayer({
      id: fillLayerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': event.customTheme || '#8B5CF6',
        'fill-opacity': ['case', ['==', ['get', 'id'], event.id], 0.15, 0.05],
      },
    });

    map.current.addLayer({
      id: lineLayerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': event.customTheme || '#8B5CF6',
        'line-width': ['case', ['==', ['get', 'id'], event.id], 3, 1],
        'line-opacity': ['case', ['==', ['get', 'id'], event.id], 0.8, 0.3],
        'line-dasharray': [2, 2],
      },
    });
  };

  const getDrawerHeight = () => {
    if (typeof window === 'undefined') return 500;
    return window.innerHeight - 64 - 65; // Header and nav height
  };

  const snapToPosition = useCallback((percentage: number): DrawerPosition => {
    if (percentage > 0.7) return 'minimum';
    if (percentage > 0.3) return 'half';
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
    const newTranslate = Math.max(0, Math.min(getDrawerHeight() * 0.9, currentTranslate.current + deltaY));
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

  const handleEventCardClick = (event: Event) => {
    navigate(`/event/${event.id}`);
  };

  const handleCloseEventCard = () => {
    setShowEventCard(false);
    setSelectedEvent(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (eventCardRef.current && !eventCardRef.current.contains(event.target as Node)) {
        handleCloseEventCard();
      }
    };

    if (showEventCard) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEventCard]);

  return (
    <div className="relative h-full">
      {/* Mapbox Map - Full screen */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0 z-0"
        style={{ top: 0, bottom: 65 }}
      />

      {/* Event Card Overlay - Shows when pin is clicked */}
      {showEventCard && selectedEvent && (
        <div className="absolute inset-0 z-20 flex items-end justify-center p-4 pointer-events-none">
          <div 
            ref={eventCardRef}
            className="w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border overflow-hidden pointer-events-auto animate-slide-up"
            onClick={() => handleEventCardClick(selectedEvent)}
          >
            <div className="relative">
              {/* Event Image */}
              <div className="h-48 w-full relative overflow-hidden">
                <img
                  src={selectedEvent.coverImage}
                  alt={selectedEvent.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Close Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseEventCard();
                  }}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                {/* Event Title */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white mb-1">{selectedEvent.name}</h3>
                  <div className="flex items-center gap-2 text-white/90">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{selectedEvent.location}</span>
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div className="p-4 space-y-4">
                {/* Category and Date */}
                <div className="flex items-center justify-between">
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: `${selectedEvent.customTheme || '#8B5CF6'}20`,
                      color: selectedEvent.customTheme || '#8B5CF6'
                    }}
                  >
                    {selectedEvent.category}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{selectedEvent.date} at {selectedEvent.time}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-card rounded-xl p-3 text-center">
                    <Users className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Attending</p>
                    <p className="text-lg font-bold">{selectedEvent.attendees}</p>
                  </div>
                  <div className="bg-card rounded-xl p-3 text-center">
                    <MapPin className="w-5 h-5 text-green-500 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Radius</p>
                    <p className="text-lg font-bold">{selectedEvent.geofenceRadius}m</p>
                  </div>
                  <div className="bg-card rounded-xl p-3 text-center">
                    <DollarSign className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="text-lg font-bold">
                      {selectedEvent.price === 0 ? 'FREE' : `N$${selectedEvent.price}`}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {selectedEvent.description && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm line-clamp-2">{selectedEvent.description}</p>
                  </div>
                )}

                {/* View Details Button */}
                <Button 
                  className="w-full gradient-pro glow-purple rounded-xl h-12 font-medium mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventCardClick(selectedEvent);
                  }}
                >
                  View Event Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Events Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          'absolute left-0 right-0 bg-background rounded-t-3xl z-10 shadow-2xl border-t border-border',
          !isDragging && 'transition-transform duration-300 ease-out'
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
        <div className="px-5 overflow-hidden h-full flex flex-col">
          {/* Search and Actions */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 pl-12 bg-card border-border rounded-xl"
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
            className="w-full mb-4 py-3 rounded-xl gradient-pro text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity relative"
          >
            <Plus className="w-5 h-5" />
            Create Event
            {user?.subscription.tier === 'free' && (
              <span className="absolute right-3 px-2 py-0.5 bg-white/20 text-xs rounded-full">
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
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                )}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Events List */}
          <div 
            className="flex-1 overflow-y-auto space-y-4 pb-4"
          >
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <div key={event.id} className="animate-fade-in">
                  <EventCard
                    event={event}
                    onClick={() => navigate(`/event/${event.id}`)}
                    onHover={() => {
                      // Highlight the event on map when hovering over card
                      map.current?.flyTo({
                        center: [event.coordinates.lng, event.coordinates.lat],
                        zoom: 13,
                        duration: 800,
                      });
                    }}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No events found</h3>
                <p className="text-muted-foreground mb-6">
                  {search ? 'Try a different search' : 'Be the first to create an event!'}
                </p>
                <Button
                  onClick={onCreateEvent}
                  className="rounded-xl"
                  variant={user?.subscription.tier === 'free' ? 'outline' : 'default'}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Event
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawer Position Indicator */}
      <div className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-xs font-medium">
        {drawerPosition === 'full' ? 'Events' : 
         drawerPosition === 'half' ? 'Half Map' : 'Full Map'}
      </div>
    </div>
  );
}
