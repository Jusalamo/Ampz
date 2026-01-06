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

// Updated snap positions
const SNAP_POSITIONS = {
  minimum: 0.75,   // 25% from bottom - shows most of map
  half: 0.5,       // 50% visible
  full: 0,         // 0% from bottom - covers entire screen
};

// Bottom navbar height in percentage
const BOTTOM_NAVBAR_HEIGHT = 0.08;

// Interface for 3D popup elements
interface Popup3D {
  element: HTMLDivElement;
  marker: mapboxgl.Marker;
  event: Event;
  updatePosition: () => void;
}

export function MapDrawer({ onCreateEvent, onOpenFilters }: MapDrawerProps) {
  const navigate = useNavigate();
  const { events, user } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [drawerPosition, setDrawerPosition] = useState<DrawerPosition>('minimum');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [searchSuggestions, setSearchSuggestions] = useState<Event[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [selectedPopup3D, setSelectedPopup3D] = useState<Popup3D | null>(null);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popups3DRef = useRef<Popup3D[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const dragStartY = useRef(0);
  const currentTranslate = useRef(0);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const rafRef = useRef<number | null>(null);

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

  // Function to create 3D popup element
  const create3DPopupElement = (event: Event): HTMLDivElement => {
    const popupEl = document.createElement('div');
    popupEl.className = 'absolute transform-gpu pointer-events-auto';
    popupEl.style.width = '280px';
    popupEl.style.transformOrigin = 'bottom center';
    popupEl.innerHTML = `
      <div class="bg-background rounded-2xl shadow-2xl border border-border overflow-hidden transform-gpu">
        <div class="flex items-start gap-3 p-3">
          <img 
            src="${event.coverImage}" 
            alt="${event.name}"
            class="w-20 h-20 rounded-xl object-cover flex-shrink-0"
          />
          <div class="flex-1 min-w-0 py-1">
            <div class="flex items-start justify-between gap-2">
              <h3 class="font-bold text-sm line-clamp-1">${event.name}</h3>
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
              <button class="h-7 text-xs px-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                View Event
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add click handler to view event
    const viewButton = popupEl.querySelector('button');
    if (viewButton) {
      viewButton.addEventListener('click', (e) => {
        e.stopPropagation();
        navigate(`/event/${event.id}`);
      });
    }
    
    // Add close button functionality
    popupEl.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    return popupEl;
  };

  // Function to update all 3D popup positions
  const updateAll3DPopupPositions = useCallback(() => {
    if (!map.current || !mapReady) return;
    
    popups3DRef.current.forEach(popup => {
      popup.updatePosition();
    });
  }, [mapReady]);

  // Initialize map immediately on component mount
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [17.0658, -22.5609],
        zoom: 12,
        pitch: 45,
        bearing: -17.6,
        antialias: true,
        attributionControl: false,
        optimizeForTerrain: true,
      });

      map.current.on('load', () => {
        setMapReady(true);
        
        // Add controls
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

        // Initial marker update
        updateEventMarkers();
      });

      // Handle map movement to update 3D popup positions
      map.current.on('move', () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
        rafRef.current = requestAnimationFrame(updateAll3DPopupPositions);
      });

      // Handle map click to close popups
      map.current.on('click', () => {
        closeAll3DPopups();
      });

      // Track user location updates
      map.current.on('locationfound', (e) => {
        const { lng, lat } = e.coords;
        
        if (userMarkerRef.current) {
          userMarkerRef.current.remove();
        }

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
      // Clean up animation frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      // Clean up all 3D popups
      popups3DRef.current.forEach(popup => {
        popup.element.remove();
      });
      popups3DRef.current = [];
      
      // Clean up markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [updateAll3DPopupPositions]);

  // Update event markers when events change
  useEffect(() => {
    if (map.current && mapReady) {
      updateEventMarkers();
    }
  }, [events, selectedCategory, filteredEvents, mapReady]);

  const updateEventMarkers = () => {
    if (!map.current || !mapReady) return;
    
    // Clear existing 3D popups
    popups3DRef.current.forEach(popup => {
      popup.element.remove();
    });
    popups3DRef.current = [];
    
    // Clear existing markers (except user marker)
    markersRef.current.forEach(marker => {
      if (marker !== userMarkerRef.current) {
        marker.remove();
      }
    });
    markersRef.current = userMarkerRef.current ? [userMarkerRef.current] : [];

    // Add markers and 3D popups for filtered events
    filteredEvents.forEach((event) => {
      // Create marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'event-marker cursor-pointer group relative';
      markerEl.innerHTML = `
        <div class="relative transform transition-transform duration-200 hover:scale-110">
          <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
               style="background-color: ${event.customTheme || '#8B5CF6'};">
            ${event.isFeatured ? '<svg class="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>' : '<div class="w-3 h-3 bg-white/30 rounded-full"></div>'}
          </div>
          <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45"
               style="background-color: ${event.customTheme || '#8B5CF6'};"></div>
        </div>
      `;

      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([event.coordinates.lng, event.coordinates.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);

      // Create 3D popup element
      const popupEl = create3DPopupElement(event);
      mapContainer.current!.appendChild(popupEl);
      
      // Function to update popup position based on 3D perspective
      const updatePopupPosition = () => {
        if (!map.current) return;
        
        const { lng, lat } = event.coordinates;
        const point = map.current!.project([lng, lat]);
        
        // Calculate 3D offset based on pitch and bearing
        const pitch = map.current!.getPitch();
        const bearing = map.current!.getBearing();
        const zoom = map.current!.getZoom();
        
        // Adjust Y position based on pitch (more pitch = higher popup)
        const pitchOffset = Math.sin(pitch * Math.PI / 180) * 50;
        
        // Adjust X position based on bearing
        const bearingOffset = Math.sin(bearing * Math.PI / 180) * 20;
        
        // Scale based on zoom
        const scale = Math.min(1.2, Math.max(0.8, zoom / 12));
        
        // Apply 3D perspective transform
        const transform = `
          translate(${point.x - 140 + bearingOffset}px, ${point.y - 120 - pitchOffset}px)
          scale(${scale})
          perspective(1000px)
          rotateX(${pitch * 0.5}deg)
          rotateZ(${-bearing * 0.2}deg)
        `;
        
        popupEl.style.transform = transform;
        popupEl.style.opacity = zoom > 11 ? '1' : '0';
        popupEl.style.pointerEvents = zoom > 11 ? 'auto' : 'none';
        popupEl.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
      };

      // Create popup object
      const popup3D: Popup3D = {
        element: popupEl,
        marker: marker,
        event: event,
        updatePosition: updatePopupPosition
      };

      popups3DRef.current.push(popup3D);
      
      // Initial position update
      updatePopupPosition();
      
      // Add click handler to marker
      markerEl.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Close all other popups
        closeAll3DPopups();
        
        // Highlight this popup
        popupEl.style.zIndex = '100';
        popupEl.style.transform += ' translateY(-10px)';
        setSelectedPopup3D(popup3D);
        
        // Fly to event
        map.current?.flyTo({
          center: [event.coordinates.lng, event.coordinates.lat],
          zoom: 15,
          pitch: 60,
          bearing: map.current!.getBearing(),
          duration: 800,
        });
      });
      
      // Add hover effects
      markerEl.addEventListener('mouseenter', () => {
        popupEl.style.transform += ' scale(1.05)';
      });
      
      markerEl.addEventListener('mouseleave', () => {
        if (selectedPopup3D !== popup3D) {
          const point = map.current!.project([event.coordinates.lng, event.coordinates.lat]);
          const pitch = map.current!.getPitch();
          const bearing = map.current!.getBearing();
          const zoom = map.current!.getZoom();
          const pitchOffset = Math.sin(pitch * Math.PI / 180) * 50;
          const bearingOffset = Math.sin(bearing * Math.PI / 180) * 20;
          const scale = Math.min(1.2, Math.max(0.8, zoom / 12));
          
          popupEl.style.transform = `
            translate(${point.x - 140 + bearingOffset}px, ${point.y - 120 - pitchOffset}px)
            scale(${scale})
            perspective(1000px)
            rotateX(${pitch * 0.5}deg)
            rotateZ(${-bearing * 0.2}deg)
          `;
        }
      });
    });
  };

  const closeAll3DPopups = () => {
    popups3DRef.current.forEach(popup => {
      popup.element.style.zIndex = '50';
    });
    setSelectedPopup3D(null);
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

    const sourceId = `geofence-active`;
    
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
    
    const sourceId = 'geofence-active';
    if (map.current.getLayer(`${sourceId}-fill`)) {
      map.current.removeLayer(`${sourceId}-fill`);
    }
    if (map.current.getLayer(`${sourceId}-line`)) {
      map.current.removeLayer(`${sourceId}-line`);
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }
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
      
      {/* 3D Popups will be appended here automatically */}

      {/* Optional: Map attribution in corner */}
      <div className="absolute bottom-16 right-2 z-10 text-xs text-white/70 bg-black/30 px-2 py-1 rounded pointer-events-none">
        © Mapbox © OpenStreetMap
      </div>

      {/* Drawer - Events list that slides up from bottom */}
      <div
        ref={drawerRef}
        className={cn(
          'absolute left-0 right-0 bg-background rounded-t-3xl shadow-2xl z-30 flex flex-col border-t border-border',
          isDragging ? '' : 'transition-transform duration-300 ease-out'
        )}
        style={{
          height: '100%',
          transform: `translateY(${translateY}px)`,
          touchAction: 'none',
        }}
      >
        {/* Drawer Handle - Only visible when not in full position */}
        {drawerPosition !== 'full' && (
          <div
            className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing select-none"
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
               'Swipe up for full view'}
            </p>
          </div>
        )}

        {/* Drawer Content */}
        <div className="flex-1 flex flex-col px-4 overflow-hidden pt-2">
          {/* Search and Create Row - Always visible except in full screen maybe? */}
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
                        handleEventCardClick(event);
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
      </div>

      {/* Bottom Navbar Space (simulated) */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none z-20"
        style={{ height: `${BOTTOM_NAVBAR_HEIGHT * 100}%` }}
      />

      {/* Custom CSS for 3D effects and scrollbars */}
      <style jsx>{`
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
        
        /* 3D Popup styles */
        .event-marker:hover ~ .popup-3d {
          transform: translateY(-10px) scale(1.05) !important;
          z-index: 60 !important;
        }
        
        /* Smooth transitions for 3D effects */
        .popup-3d {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3),
                      0 0 0 1px rgba(255, 255, 255, 0.1);
        }
        
        .popup-3d:hover {
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4),
                      0 0 0 1px rgba(255, 255, 255, 0.15),
                      0 0 40px rgba(var(--color-primary), 0.2);
        }
      `}</style>
    </div>
  );
}
