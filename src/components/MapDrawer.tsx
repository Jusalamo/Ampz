import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, Plus, MapPin, X, Users, Calendar, Clock } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { EventCard } from './EventCard';
import { Input } from './ui/input';
import { Button } from './ui/button';
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
  full: 0.95,    // 5% visible (just handlebar)
  half: 0.5,     // 50% visible
  minimum: 0.25  // 25% visible (maximum map visible)
};

interface SelectedEvent {
  event: any;
  showCard: boolean;
  coordinates: { lng: number; lat: number };
}

export function MapDrawer({ onCreateEvent, onOpenFilters }: MapDrawerProps) {
  const navigate = useNavigate();
  const { events, theme, user } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [drawerPosition, setDrawerPosition] = useState<DrawerPosition>('half');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const currentTranslate = useRef(0);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const popups = useRef<mapboxgl.Popup[]>([]);
  const geofenceCircles = useRef<string[]>([]);

  const categories = ['All', 'Music', 'Tech', 'Party', 'Art', 'Food', 'Sports'];

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(search.toLowerCase()) ||
      event.location.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Initialize map with 3D view
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12', // Regular colors, not dark
      center: [17.0658, -22.5609], // Windhoek
      zoom: 12,
      pitch: 60, // 3D tilt
      bearing: -20, // Rotation
      antialias: true,
    });

    // Add 3D terrain (if available)
    map.current.on('load', () => {
      // Add navigation controls
      map.current?.addControl(new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true
      }), 'top-right');

      // Add geolocate control
      map.current?.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserLocation: true,
          showAccuracyCircle: true,
        }),
        'top-right'
      );

      // Add fullscreen control
      map.current?.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      // Add event markers
      addEventMarkers();

      // User location marker
      const userMarker = document.createElement('div');
      userMarker.innerHTML = `
        <div class="relative">
          <div class="w-6 h-6 rounded-full bg-brand-green border-3 border-white shadow-lg animate-pulse"></div>
          <div class="absolute -inset-3 rounded-full bg-brand-green/20 animate-ping"></div>
        </div>
      `;
      new mapboxgl.Marker(userMarker)
        .setLngLat([17.0658, -22.5609])
        .addTo(map.current);
    });

    return () => {
      markers.current.forEach(marker => marker.remove());
      popups.current.forEach(popup => popup.remove());
      geofenceCircles.current.forEach(sourceId => {
        if (map.current?.getSource(sourceId)) {
          map.current?.removeSource(sourceId);
        }
      });
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add event markers with geofence circles
  const addEventMarkers = () => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    popups.current.forEach(popup => popup.remove());
    geofenceCircles.current.forEach(sourceId => {
      if (map.current?.getSource(sourceId)) {
        map.current?.removeSource(sourceId);
      }
    });

    markers.current = [];
    popups.current = [];
    geofenceCircles.current = [];

    events.forEach((event) => {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'event-marker cursor-pointer transition-all hover:scale-125';
      el.innerHTML = `
        <div class="relative">
          <div class="w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center border-2 border-primary">
            <div class="w-6 h-6 rounded-full" style="background-color: ${event.customTheme || '#8B5CF6'}"></div>
          </div>
          <div class="absolute -inset-2 rounded-full bg-primary/10 animate-ping"></div>
        </div>
      `;

      // Create event card for popup
      const eventCardEl = document.createElement('div');
      eventCardEl.className = 'event-popup-card bg-background rounded-xl shadow-2xl overflow-hidden min-w-[280px] border border-border';
      eventCardEl.innerHTML = `
        <div class="relative">
          <img 
            src="${event.coverImage}" 
            alt="${event.name}"
            class="w-full h-32 object-cover"
          />
          <div class="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
            <X class="w-4 h-4 text-white" />
          </div>
          <div class="p-4">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-bold text-lg truncate">${event.name}</h3>
              <span class="px-2 py-1 text-xs rounded-full" style="background-color: ${event.customTheme || '#8B5CF6'}20; color: ${event.customTheme || '#8B5CF6'}">
                ${event.category}
              </span>
            </div>
            
            <div class="space-y-2 mb-3">
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin class="w-4 h-4" />
                <span class="truncate">${event.location}</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar class="w-4 h-4" />
                <span>${event.date}</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock class="w-4 h-4" />
                <span>${event.time}</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <Users class="w-4 h-4" />
                <span>${event.attendees} attending</span>
              </div>
            </div>

            <div class="flex items-center justify-between text-sm">
              <span class="font-semibold">${event.price === 0 ? 'FREE' : `N$${event.price}`}</span>
              <div class="flex items-center gap-2">
                <span class="text-xs px-2 py-1 rounded-full bg-card">${event.geofenceRadius}m radius</span>
                <button class="view-details-btn px-3 py-1.5 rounded-lg text-sm font-medium" style="background-color: ${event.customTheme || '#8B5CF6'}">
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Add click handler for view details button
      setTimeout(() => {
        const viewDetailsBtn = eventCardEl.querySelector('.view-details-btn');
        if (viewDetailsBtn) {
          viewDetailsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigate(`/event/${event.id}`);
          });
        }

        const closeBtn = eventCardEl.querySelector('.absolute.top-2.right-2');
        if (closeBtn) {
          closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (popupRef.isOpen()) {
              popupRef.remove();
            }
          });
        }
      }, 0);

      // Create popup
      const popupRef = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false,
        maxWidth: '300px'
      }).setDOMContent(eventCardEl);

      // Create marker
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([event.coordinates.lng, event.coordinates.lat])
        .setPopup(popupRef)
        .addTo(map.current!);

      // Add click handler to marker
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Fly to event location
        map.current?.flyTo({
          center: [event.coordinates.lng, event.coordinates.lat],
          zoom: 14,
          pitch: 60,
          bearing: -20,
          duration: 1000,
        });

        // Show event card
        setSelectedEvent({
          event,
          showCard: true,
          coordinates: { lng: event.coordinates.lng, lat: event.coordinates.lat }
        });

        // Add geofence circle
        addGeofenceCircle(event);
      });

      markers.current.push(marker);
      popups.current.push(popupRef);
    });
  };

  // Add geofence circle to map
  const addGeofenceCircle = (event: any) => {
    if (!map.current) return;

    const { lat, lng } = event.coordinates;
    const radiusInKm = event.geofenceRadius / 1000;
    const sourceId = `geofence-${event.id}`;

    // Remove existing circle
    if (geofenceCircles.current.includes(sourceId)) {
      if (map.current.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }
      geofenceCircles.current = geofenceCircles.current.filter(id => id !== sourceId);
    }

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

    // Add circle source and layers
    map.current.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [coords] },
      },
    });

    map.current.addLayer({
      id: `${sourceId}-fill`,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': event.customTheme || '#8B5CF6',
        'fill-opacity': 0.15,
      },
    });

    map.current.addLayer({
      id: `${sourceId}-line`,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': event.customTheme || '#8B5CF6',
        'line-width': 2,
        'line-dasharray': [2, 1],
      },
    });

    geofenceCircles.current.push(sourceId);
  };

  // Remove all geofence circles
  const removeGeofenceCircles = () => {
    if (!map.current) return;

    geofenceCircles.current.forEach(sourceId => {
      if (map.current?.getSource(sourceId)) {
        // Remove layers
        if (map.current.getLayer(`${sourceId}-fill`)) {
          map.current.removeLayer(`${sourceId}-fill`);
        }
        if (map.current.getLayer(`${sourceId}-line`)) {
          map.current.removeLayer(`${sourceId}-line`);
        }
        // Remove source
        map.current.removeSource(sourceId);
      }
    });
    geofenceCircles.current = [];
  };

  // Close event card
  const closeEventCard = () => {
    setSelectedEvent(null);
    removeGeofenceCircles();
  };

  // Re-add markers when events change
  useEffect(() => {
    if (map.current?.isStyleLoaded()) {
      addEventMarkers();
    }
  }, [events]);

  // Update map style on theme change
  useEffect(() => {
    if (map.current) {
      // Keep streets style for both themes (not dark)
      map.current.setStyle('mapbox://styles/mapbox/streets-v12');
      // Re-add markers after style change
      setTimeout(() => {
        addEventMarkers();
      }, 500);
    }
  }, [theme]);

  const getDrawerHeight = () => {
    if (typeof window === 'undefined') return 500;
    return window.innerHeight - 64 - 65; // Header and nav height
  };

  const snapToPosition = useCallback((percentage: number): DrawerPosition => {
    if (percentage < 0.3) return 'full';
    if (percentage < 0.625) return 'half';
    return 'minimum';
  }, []);

  const handleDragStart = (clientY: number) => {
    setIsDragging(true);
    dragStartY.current = clientY;
    currentTranslate.current = SNAP_POSITIONS[drawerPosition] * getDrawerHeight();
  };

  const handleDragMove = (clientY: number) => {
    if (!isDragging) return;
    
    const deltaY = clientY - dragStartY.current;
    const newTranslate = Math.max(0, Math.min(getDrawerHeight() * 0.95, currentTranslate.current + deltaY));
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

      {/* Selected Event Card Overlay */}
      {selectedEvent?.showCard && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 max-w-md w-[90%]">
          <div className="bg-background rounded-2xl shadow-2xl border border-border overflow-hidden">
            <div className="relative">
              <img 
                src={selectedEvent.event.coverImage} 
                alt={selectedEvent.event.name}
                className="w-full h-40 object-cover"
              />
              <button 
                onClick={closeEventCard}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-xl truncate pr-2">{selectedEvent.event.name}</h3>
                <span 
                  className="px-3 py-1 text-sm rounded-full shrink-0"
                  style={{ 
                    backgroundColor: `${selectedEvent.event.customTheme || '#8B5CF6'}20`, 
                    color: selectedEvent.event.customTheme || '#8B5CF6' 
                  }}
                >
                  {selectedEvent.event.category}
                </span>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{selectedEvent.event.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{selectedEvent.event.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{selectedEvent.event.time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{selectedEvent.event.attendees} attending</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">
                    {selectedEvent.event.price === 0 ? 'FREE' : `N$${selectedEvent.event.price}`}
                  </span>
                  <span className="text-sm px-3 py-1 rounded-full bg-card">
                    {selectedEvent.event.geofenceRadius}m radius
                  </span>
                </div>
                <Button
                  onClick={() => navigate(`/event/${selectedEvent.event.id}`)}
                  className="rounded-xl font-medium"
                  style={{ 
                    backgroundColor: selectedEvent.event.customTheme || '#8B5CF6',
                    borderColor: selectedEvent.event.customTheme || '#8B5CF6'
                  }}
                >
                  View Details
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
          'absolute left-0 right-0 bg-background rounded-t-3xl z-20 shadow-2xl border-t border-x border-border',
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
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing touch-none border-b border-border"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className={cn(
            'w-16 h-1.5 rounded-full transition-colors',
            isDragging ? 'bg-primary' : 'bg-muted-foreground/40 hover:bg-primary/70'
          )} />
        </div>

        {/* Drawer Content */}
        <div className="px-5 overflow-hidden h-full">
          {/* Search and Actions */}
          <div className="flex gap-3 mb-4 pt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 pl-12 rounded-xl bg-card border-border"
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
            className="w-full mb-4 py-3.5 rounded-xl gradient-pro text-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity relative shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Create Event
            {user?.subscription.tier === 'free' && (
              <span className="absolute right-4 px-3 py-1 bg-background/30 text-xs rounded-full backdrop-blur-sm">
                PRO
              </span>
            )}
          </button>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 mb-4 pb-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all border',
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground hover:text-foreground border-border hover:border-primary'
                )}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Events List */}
          <div 
            className="overflow-y-auto space-y-4 pb-24"
            style={{ maxHeight: 'calc(100% - 180px)' }}
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
                <MapPin className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground font-medium">No events found</p>
                <p className="text-sm text-muted-foreground mt-1">Try changing your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
