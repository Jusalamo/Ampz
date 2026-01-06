import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, SlidersHorizontal, Plus, MapPin, X, Calendar, Clock } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { EventCard } from './EventCard';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Use environment variable for Mapbox token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoianVzYSIsImEiOiJjbWpjanh5amEwbDEwM2dzOXVhbjZ5dzcwIn0.stWdbPHCrf9sKrRJRmShlg';

// Type definitions
interface Coordinates {
  lng: number;
  lat: number;
}

interface Event {
  id: string;
  name: string;
  location: string;
  category: string;
  coordinates: Coordinates;
  coverImage: string;
  date: string;
  time: string;
  price: number;
  isFeatured?: boolean;
  customTheme?: string;
  geofenceRadius: number;
}

interface MapDrawerProps {
  onCreateEvent: () => void;
  onOpenFilters: () => void;
}

type DrawerPosition = 'minimum' | 'half' | 'full';

// Updated snap positions - drawer covers entire screen in full state
const SNAP_POSITIONS = {
  minimum: 0.75,   // 25% from bottom - shows most of map
  half: 0.5,       // 50% visible
  full: 0,         // Covers entire screen (handle at top)
};

export function MapDrawer({ onCreateEvent, onOpenFilters }: MapDrawerProps) {
  const navigate = useNavigate();
  const { events, user } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [drawerPosition, setDrawerPosition] = useState<DrawerPosition>('minimum');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<Event[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [eventCards3D, setEventCards3D] = useState<Map<string, HTMLDivElement>>(new Map());
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const dragStartY = useRef(0);
  const currentTranslate = useRef(0);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const cardMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  const categories = ['All', 'Music', 'Tech', 'Party', 'Art', 'Food', 'Sports'];

  // Memoized filtered events for performance
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.name.toLowerCase().includes(search.toLowerCase()) ||
        event.location.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [events, search, selectedCategory]);

  // Handle search suggestions
  useEffect(() => {
    if (search.length > 0) {
      const suggestions = events
        .filter(e => 
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.location.toLowerCase().includes(search.toLowerCase())
        )
        .slice(0, 5);
      setSearchSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [search, events]);

  // Initialize map immediately on component mount
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [17.0658, -22.5609], // Windhoek
        zoom: 12,
        pitch: 45,
        bearing: -17.6,
        antialias: true,
        attributionControl: false,
        optimizeForTerrain: true,
      });

      // Hide map loading tiles
      map.current.on('load', () => {
        setMapReady(true);
        // Add controls after map is loaded
        map.current!.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

        // Add geolocate control
        const geolocate = new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserLocation: true,
          showUserHeading: true,
        });
        map.current!.addControl(geolocate, 'top-right');
        
        // Auto-trigger geolocation
        setTimeout(() => {
          try {
            geolocate.trigger();
          } catch (e) {
            console.log('Geolocation not available');
          }
        }, 1000);

        updateEventMarkers();
      });

      // Handle map click to clear selection
      map.current.on('click', (e) => {
        // Only clear if clicking on the map (not on markers)
        const target = e.originalEvent.target as HTMLElement;
        if (!target.closest('.event-marker') && !target.closest('.event-card-3d')) {
          clearEventSelection();
        }
      });

      // Track user location updates
      map.current.on('locationfound', (e) => {
        const { lng, lat } = e.coords;
        
        // Remove existing user marker
        if (userMarkerRef.current) {
          userMarkerRef.current.remove();
        }

        // Create new user marker
        const userMarkerEl = document.createElement('div');
        userMarkerEl.className = 'user-marker';
        userMarkerEl.innerHTML = `
          <div class="relative">
            <div class="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
            <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-12 h-6 bg-blue-500/10 rounded-full blur-sm"></div>
          </div>
        `;

        userMarkerRef.current = new mapboxgl.Marker(userMarkerEl)
          .setLngLat([lng, lat])
          .addTo(map.current!);
      });

    } catch (error) {
      console.error('Failed to initialize map:', error);
      setMapReady(true);
    }

    return () => {
      // Clean up all markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      
      // Clean up 3D card markers
      cardMarkersRef.current.forEach(marker => marker.remove());
      cardMarkersRef.current.clear();
      
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Clear event selection
  const clearEventSelection = () => {
    setSelectedEvent(null);
    removeGeofenceCircle();
    // Remove all 3D card markers
    cardMarkersRef.current.forEach(marker => marker.remove());
    cardMarkersRef.current.clear();
    setEventCards3D(new Map());
  };

  // Update event markers when events change
  useEffect(() => {
    if (map.current && mapReady) {
      updateEventMarkers();
    }
  }, [events, selectedCategory, filteredEvents, mapReady]);

  const updateEventMarkers = () => {
    if (!map.current || !mapReady) return;
    
    // Clear existing markers (except user marker)
    markersRef.current.forEach(marker => {
      if (marker !== userMarkerRef.current) {
        marker.remove();
      }
    });
    markersRef.current = userMarkerRef.current ? [userMarkerRef.current] : [];

    // Add markers for filtered events
    filteredEvents.forEach((event) => {
      const markerEl = document.createElement('div');
      markerEl.className = 'event-marker cursor-pointer group';
      markerEl.innerHTML = `
        <div class="relative transform transition-transform duration-200 hover:scale-110">
          <div class="w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
               style="background-color: ${event.customTheme || '#8B5CF6'};">
            ${event.isFeatured ? 
              '<svg class="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>' : 
              '<div class="w-4 h-4 bg-white/40 rounded-full"></div>'}
          </div>
        </div>
      `;

      const marker = new mapboxgl.Marker({
        element: markerEl,
        anchor: 'bottom'
      })
        .setLngLat([event.coordinates.lng, event.coordinates.lat])
        .addTo(map.current!);

      markerEl.addEventListener('click', (e) => {
        e.stopPropagation();
        handleEventMarkerClick(event);
      });

      markersRef.current.push(marker);
    });
  };

  const handleEventMarkerClick = (event: Event) => {
    // Clear previous selection
    clearEventSelection();
    
    // Set new selection
    setSelectedEvent(event);
    addGeofenceCircle(event);
    add3DEventCard(event);
    
    // Fly to event location
    map.current?.flyTo({
      center: [event.coordinates.lng, event.coordinates.lat],
      zoom: 15,
      pitch: 60,
      duration: 800,
    });
  };

  const add3DEventCard = (event: Event) => {
    if (!map.current || !mapReady) return;

    // Create 3D card element
    const cardEl = document.createElement('div');
    cardEl.className = 'event-card-3d absolute transform -translate-x-1/2 -translate-y-full';
    cardEl.style.width = '280px';
    cardEl.style.zIndex = '1000';
    
    cardEl.innerHTML = `
      <div class="bg-background rounded-2xl shadow-2xl border border-border overflow-hidden">
        <div class="flex items-start gap-3 p-3">
          <img 
            src="${event.coverImage}" 
            alt="${event.name}"
            class="w-20 h-20 rounded-xl object-cover flex-shrink-0"
          />
          <div class="flex-1 min-w-0 py-1">
            <div class="flex items-start justify-between gap-2">
              <h3 class="font-bold text-sm line-clamp-1">${event.name}</h3>
              <button class="w-6 h-6 rounded-full bg-card flex items-center justify-center flex-shrink-0 close-3d-card">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div class="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <span>${event.date}</span>
              <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>${event.time}</span>
            </div>
            <div class="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span class="line-clamp-1">${event.location}</span>
            </div>
            <div class="flex items-center justify-between mt-2">
              <span class="text-xs font-semibold" style="color: ${event.customTheme || '#8B5CF6'}">
                ${event.price === 0 ? 'FREE' : `N$${event.price}`}
              </span>
              <button class="h-7 px-3 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors view-event-btn">
                View Event
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Create marker for the 3D card
    const cardMarker = new mapboxgl.Marker({
      element: cardEl,
      anchor: 'bottom',
      offset: [0, -20] // Position above the pin
    })
      .setLngLat([event.coordinates.lng, event.coordinates.lat])
      .addTo(map.current!);

    // Store reference
    cardMarkersRef.current.set(event.id, cardMarker);
    setEventCards3D(prev => new Map(prev).set(event.id, cardEl));

    // Add event listeners to the 3D card
    setTimeout(() => {
      const closeBtn = cardEl.querySelector('.close-3d-card');
      const viewBtn = cardEl.querySelector('.view-event-btn');
      
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          clearEventSelection();
        });
      }
      
      if (viewBtn) {
        viewBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          handleEventCardClick(event);
        });
      }
    }, 10);
  };

  const addGeofenceCircle = (event: Event) => {
    if (!map.current || !mapReady) return;

    const { lat, lng } = event.coordinates;
    const radiusInKm = event.geofenceRadius / 1000;
    
    const points = 64;
    const coords: [number, number][] = [];
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const dx = radiusInKm * Math.cos(angle) / 111.32;
      const dy = radiusInKm * Math.sin(angle) / (111.32 * Math.cos(lat * Math.PI / 180));
      coords.push([lng + dy, lat + dx]);
    }
    coords.push(coords[0]);

    const sourceId = `geofence-${event.id}`;
    
    if (map.current.getSource(sourceId)) {
      (map.current.getSource(sourceId) as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [coords] },
      });
    } else {
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
    }
  };

  const removeGeofenceCircle = () => {
    if (!map.current || !mapReady) return;
    
    // Remove all geofence circles
    events.forEach(event => {
      const sourceId = `geofence-${event.id}`;
      if (map.current!.getLayer(`${sourceId}-fill`)) {
        map.current!.removeLayer(`${sourceId}-fill`);
      }
      if (map.current!.getLayer(`${sourceId}-line`)) {
        map.current!.removeLayer(`${sourceId}-line`);
      }
      if (map.current!.getSource(sourceId)) {
        map.current!.removeSource(sourceId);
      }
    });
  };

  const handleEventCardClick = (event: Event) => {
    navigate(`/event/${event.id}`);
  };

  const getDrawerHeight = () => {
    if (typeof window === 'undefined') return 500;
    return window.innerHeight;
  };

  const snapToPosition = useCallback((percentage: number): DrawerPosition => {
    if (percentage > 0.6) return 'minimum';
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
    // Allow dragging up to full screen coverage
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

  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientY);
  };

  // Mouse event handlers for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
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
  const isPro = user?.subscription?.tier === 'pro' || user?.subscription?.tier === 'max';

  return (
    <div className="h-screen w-full relative overflow-hidden bg-black">
      {/* Map Container - Full screen behind everything */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 0 }}
      />
      
      {/* Map attribution */}
      <div className="absolute bottom-4 right-2 z-10 text-xs text-white/70 bg-black/30 px-2 py-1 rounded">
        © Mapbox © OpenStreetMap
      </div>

      {/* Drawer - Events list that slides up from bottom */}
      <div
        ref={drawerRef}
        className={cn(
          'absolute left-0 right-0 bg-background rounded-t-3xl shadow-2xl z-20 flex flex-col border-t border-border',
          isDragging ? '' : 'transition-transform duration-300 ease-out'
        )}
        style={{
          height: '100%',
          transform: `translateY(${translateY}px)`,
          touchAction: 'none',
        }}
      >
        {/* Drawer Handle - Always visible at top when drawer is up */}
        <div
          className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing select-none bg-background rounded-t-3xl"
          role="button"
          tabIndex={0}
          aria-label={`Drawer position: ${drawerPosition}. Drag to adjust.`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setDrawerPosition(drawerPosition === 'minimum' ? 'half' : drawerPosition === 'half' ? 'full' : 'minimum');
            }
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
          <p className="text-xs text-muted-foreground mt-2">
            {drawerPosition === 'minimum' ? `${filteredEvents.length} events nearby - Swipe up` : 
             drawerPosition === 'full' ? 'Swipe down for map' : 
             'Swipe up or down'}
          </p>
        </div>

        {/* Drawer Content - Only shows when not minimized */}
        {drawerPosition !== 'minimum' && (
          <div className="flex-1 flex flex-col px-4 overflow-hidden">
            {/* Search and Create Row */}
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search events..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="pl-10 h-10 bg-card border-border rounded-xl"
                  aria-label="Search events"
                />
                
                {/* Search Suggestions Dropdown */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                    {searchSuggestions.map(event => (
                      <button
                        key={event.id}
                        className="w-full px-3 py-2 text-left hover:bg-card flex items-center gap-2"
                        onMouseDown={() => {
                          setSearch(event.name);
                          setShowSuggestions(false);
                          handleEventMarkerClick(event);
                        }}
                        aria-label={`Select event: ${event.name}`}
                      >
                        <img src={event.coverImage} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{event.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{event.date} • {event.location}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                onClick={onOpenFilters}
                className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:border-primary transition-colors"
                aria-label="Open filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              
              {isPro && (
                <Button
                  size="sm"
                  onClick={onCreateEvent}
                  className="h-10 px-3 rounded-xl relative"
                  aria-label="Create new event"
                >
                  <Plus className="w-4 h-4" />
                  {user?.createdEvents?.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {user.createdEvents.length}
                    </span>
                  )}
                </Button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-1">
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
                  aria-label={`Filter by ${category}`}
                  aria-pressed={selectedCategory === category}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Events List */}
            <div 
              className="flex-1 overflow-y-auto space-y-3 pb-24 custom-scrollbar"
            >
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => handleEventCardClick(event)}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No events found</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Custom CSS for 3D cards and scrollbars */}
      <style jsx global>{`
        .event-card-3d {
          pointer-events: auto;
          animation: float-up 0.3s ease-out;
        }
        
        .event-card-3d .close-3d-card:hover {
          background-color: rgba(0, 0, 0, 0.1);
        }
        
        .event-card-3d .view-event-btn:hover {
          opacity: 0.9;
        }
        
        @keyframes float-up {
          from {
            opacity: 0;
            transform: translate(-50%, -80%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -100%) scale(1);
          }
        }
        
        .event-marker {
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
        }
        
        .user-marker {
          filter: drop-shadow(0 4px 8px rgba(59, 130, 246, 0.5));
        }
        
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        
        /* Ensure map markers are above map tiles */
        .mapboxgl-marker {
          z-index: 1;
        }
        
        /* Make 3D cards appear above regular markers */
        .event-card-3d {
          z-index: 1000 !important;
        }
      `}</style>
    </div>
  );
}
