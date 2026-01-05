import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, Plus, MapPin, X, Calendar, Users, DollarSign, Clock } from 'lucide-react';
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
  minimum: 0.75, // 25% visible (drawer shows just handle)
  half: 0.5,     // 50% visible
  full: 0,       // 100% visible (full screen events)
};

export function MapDrawer({ onCreateEvent, onOpenFilters }: MapDrawerProps) {
  const navigate = useNavigate();
  const { events, user } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [drawerPosition, setDrawerPosition] = useState<DrawerPosition>('half');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventCard, setShowEventCard] = useState(false);
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
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
      style: 'mapbox://styles/mapbox/streets-v12', // Regular colorful map
      center: [17.0658, -22.5609], // Windhoek
      zoom: 11,
      pitch: 60,
      bearing: -20,
      antialias: true,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    // Add geolocate control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserLocation: true,
        showUserHeading: true,
      }),
      'top-right'
    );

    // Add 3D terrain
    map.current.on('load', () => {
      // Add terrain source
      map.current?.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
      
      // Add terrain layer
      map.current?.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

      // Add sky layer
      map.current?.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 0.0],
          'sky-atmosphere-sun-intensity': 15,
        },
      });

      // Update event markers after map loads
      updateEventMarkers();
    });

    // User location marker
    const userMarker = document.createElement('div');
    userMarker.innerHTML = `
      <div class="relative">
        <div class="w-8 h-8 rounded-full bg-blue-500 border-3 border-white shadow-lg animate-pulse"></div>
        <div class="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75"></div>
      </div>
    `;
    
    const userMapMarker = new mapboxgl.Marker(userMarker)
      .setLngLat([17.0658, -22.5609])
      .addTo(map.current);

    markersRef.current.push(userMapMarker);

    // Handle map click to close popup
    map.current.on('click', (e) => {
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
        removeGeofenceCircle();
      }
    });

    // Handle map move to update popup position
    map.current.on('move', () => {
      if (popupRef.current && selectedEvent) {
        const coordinates = [selectedEvent.coordinates.lng, selectedEvent.coordinates.lat];
        const pixelPosition = map.current!.project(coordinates);
        
        // Update custom card position if needed
        if (document.getElementById('custom-event-card')) {
          const card = document.getElementById('custom-event-card');
          if (card) {
            const rect = card.getBoundingClientRect();
            const newX = pixelPosition.x - rect.width / 2;
            const newY = pixelPosition.y - rect.height - 40; // Position above marker
            card.style.left = `${newX}px`;
            card.style.top = `${newY}px`;
          }
        }
      }
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update event markers when events change
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      updateEventMarkers();
    }
  }, [events, selectedCategory]);

  const updateEventMarkers = () => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for filtered events
    filteredEvents.forEach((event) => {
      const markerEl = document.createElement('div');
      markerEl.className = 'event-marker cursor-pointer group';
      markerEl.innerHTML = `
        <div class="relative">
          <div class="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-125 group-hover:shadow-xl"
               style="background-color: ${event.customTheme || '#8B5CF6'};">
            <div class="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
              <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
              </svg>
            </div>
          </div>
          <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45"
               style="background-color: ${event.customTheme || '#8B5CF6'};"></div>
        </div>
      `;

      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([event.coordinates.lng, event.coordinates.lat])
        .addTo(map.current!);

      // Add click handler to marker
      markerEl.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Remove existing popup
        if (popupRef.current) {
          popupRef.current.remove();
        }
        
        // Create and show new popup
        const popup = new mapboxgl.Popup({
          offset: [0, -40], // Position above marker
          closeButton: false,
          closeOnClick: false,
          maxWidth: '300px',
          anchor: 'bottom',
          className: 'event-popup',
        })
          .setLngLat([event.coordinates.lng, event.coordinates.lat])
          .setHTML(createPopupHTML(event))
          .addTo(map.current!);

        popupRef.current = popup;
        
        // Add geofence circle for this event
        addGeofenceCircle(event);
        
        // Center map on event
        map.current?.flyTo({
          center: [event.coordinates.lng, event.coordinates.lat],
          zoom: 15,
          pitch: 75,
          bearing: 0,
          duration: 1000,
        });
      });

      markersRef.current.push(marker);
    });
  };

  const createPopupHTML = (event: any) => {
    return `
      <div class="bg-background rounded-xl shadow-2xl border border-border overflow-hidden w-[280px]">
        <div class="p-4 border-b border-border flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="w-3 h-3 rounded-full" style="background-color: ${event.customTheme || '#8B5CF6'}"></div>
            <span class="text-xs font-medium px-2 py-1 rounded-md bg-primary/10 text-primary">
              ${event.category}
            </span>
          </div>
          <button onclick="window.dispatchEvent(new CustomEvent('closePopup'))" class="w-8 h-8 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="p-4">
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <h3 class="font-bold text-lg mb-1">${event.name}</h3>
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <span>${event.location}</span>
              </div>
            </div>
            <div class="text-xs font-bold px-2 py-1 rounded-md ml-2" 
                 style="background-color: ${event.customTheme || '#8B5CF6'}20; color: ${event.customTheme || '#8B5CF6'}">
              ${event.geofenceRadius}m radius
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="flex items-center gap-2 text-sm">
              <svg class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <span>${event.date}</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <svg class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>${event.time}</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <svg class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              <span>${event.attendees} attending</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <svg class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>${event.price === 0 ? 'FREE' : `N$${event.price}`}</span>
            </div>
          </div>

          <button onclick="window.dispatchEvent(new CustomEvent('viewEventDetails', { detail: '${event.id}' }))" 
                  class="w-full py-3 rounded-xl font-medium text-white text-sm"
                  style="background-color: ${event.customTheme || '#8B5CF6'}; border-color: ${event.customTheme || '#8B5CF6'}">
            View Event Details
          </button>
        </div>
      </div>
    `;
  };

  const addGeofenceCircle = (event: any) => {
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
    
    // Remove existing geofence if any
    removeGeofenceCircle();

    // Add new geofence
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
        'fill-opacity': 0.1,
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

    // Store current event for cleanup
    setSelectedEvent(event);
  };

  const removeGeofenceCircle = () => {
    if (!map.current) return;
    
    if (selectedEvent) {
      const sourceId = `geofence-${selectedEvent.id}`;
      if (map.current.getLayer(`${sourceId}-fill`)) {
        map.current.removeLayer(`${sourceId}-fill`);
      }
      if (map.current.getLayer(`${sourceId}-line`)) {
        map.current.removeLayer(`${sourceId}-line`);
      }
      if (map.current.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }
      setSelectedEvent(null);
    }
  };

  // Handle popup events from injected JavaScript
  useEffect(() => {
    const handleClosePopup = () => {
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      removeGeofenceCircle();
    };

    const handleViewEventDetails = (e: CustomEvent) => {
      const eventId = e.detail;
      navigate(`/event/${eventId}`);
    };

    window.addEventListener('closePopup', handleClosePopup as EventListener);
    window.addEventListener('viewEventDetails', handleViewEventDetails as EventListener);

    return () => {
      window.removeEventListener('closePopup', handleClosePopup as EventListener);
      window.removeEventListener('viewEventDetails', handleViewEventDetails as EventListener);
    };
  }, [navigate]);

  const getDrawerHeight = () => {
    if (typeof window === 'undefined') return 500;
    return window.innerHeight;
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

  // Handle event card click in drawer
  const handleEventCardClick = (event: any) => {
    // Navigate directly to event details (NOT show pin card)
    navigate(`/event/${event.id}`);
  };

  return (
    <div className="relative h-full">
      {/* Mapbox Map - Full screen */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0 z-0"
      />

      {/* Events Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          'absolute left-0 right-0 bg-background rounded-t-3xl z-10 shadow-2xl',
          !isDragging && 'transition-transform duration-300 ease-out'
        )}
        style={{
          height: getDrawerHeight(),
          bottom: 0,
          transform: getTransformValue(),
          pointerEvents: drawerPosition === 'minimum' ? 'none' : 'auto',
        }}
      >
        {/* Drag Handle - Always visible */}
        <div
          className="flex justify-center py-4 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          style={{ pointerEvents: 'auto' }}
        >
          <div className={cn(
            'w-12 h-1.5 rounded-full transition-colors',
            isDragging ? 'bg-primary' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
          )} />
        </div>

        {/* Drawer Content - Hidden at minimum position */}
        {drawerPosition !== 'minimum' && (
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
              className="overflow-y-auto space-y-4 pb-32"
              style={{ maxHeight: drawerPosition === 'full' ? 'calc(100% - 120px)' : 'calc(100% - 200px)' }}
            >
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => handleEventCardClick(event)} // Direct navigation
                    showPreview={false} // Don't show preview on hover
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
        )}
      </div>
    </div>
  );
}
