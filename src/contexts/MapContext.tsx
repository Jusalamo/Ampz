import React, { createContext, useContext, useRef, useState, useEffect, useCallback, ReactNode } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapContextType {
  map: mapboxgl.Map | null;
  mapContainer: React.RefObject<HTMLDivElement>;
  isReady: boolean;
  isInitialized: boolean;
  setMapVisible: (visible: boolean) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export function MapProvider({ children }: { children: ReactNode }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Initialize map once on first visibility
  const initializeMap = useCallback(() => {
    if (!mapContainer.current || map.current || !MAPBOX_TOKEN) return;

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
      });

      map.current.on('load', () => {
        setIsReady(true);
        setIsInitialized(true);
        
        // Add controls
        map.current!.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
        
        const geolocate = new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserLocation: true,
          showUserHeading: true,
        });
        map.current!.addControl(geolocate, 'top-right');
        
        // Auto-trigger geolocation after a delay
        setTimeout(() => {
          try {
            geolocate.trigger();
          } catch (e) {
            console.log('Geolocation not available');
          }
        }, 1000);
      });

    } catch (error) {
      console.error('Failed to initialize map:', error);
      setIsReady(true);
    }
  }, []);

  // Initialize when visible
  useEffect(() => {
    if (isVisible && !isInitialized && MAPBOX_TOKEN) {
      initializeMap();
    }
  }, [isVisible, isInitialized, initializeMap]);

  // Resize map when becoming visible
  useEffect(() => {
    if (isVisible && map.current && isReady) {
      setTimeout(() => {
        map.current?.resize();
      }, 100);
    }
  }, [isVisible, isReady]);

  const setMapVisible = useCallback((visible: boolean) => {
    setIsVisible(visible);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <MapContext.Provider value={{ 
      map: map.current, 
      mapContainer, 
      isReady, 
      isInitialized,
      setMapVisible 
    }}>
      {/* Hidden persistent map container */}
      <div 
        ref={mapContainer}
        className="fixed inset-0 -z-10"
        style={{ 
          visibility: isVisible ? 'visible' : 'hidden',
          pointerEvents: isVisible ? 'auto' : 'none'
        }}
      />
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
}
