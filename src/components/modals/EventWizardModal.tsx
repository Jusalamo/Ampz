import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, ArrowRight, ArrowLeft, MapPin, Check, QrCode, Copy, Download, 
  Upload, Image, Video, Map, Loader2, Search, Calendar, Clock, 
  DollarSign, Palette, ChevronRight, Edit2, Music, Cpu, Users, 
  Brush, Globe, Camera, Map as MapIcon, Radio, Eye, Utensils,
  Coffee, Beer, Hotel, ShoppingBag, Trees, School, Hospital,
  Building, Navigation, Home, Landmark, Play, Pause,
  Film, Grid3x3
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Event } from '@/lib/types';
import debounce from 'lodash/debounce';

// Initialize Mapbox with token
const MAPBOX_TOKEN = 'pk.eyJ1IjoianVzYSIsImEiOiJjbWpjanh5amEwbDEwM2dzOXVhbjZ5dzcwIn0.stWdbPHCrf9sKrRJRmShlg';
mapboxgl.accessToken = MAPBOX_TOKEN;

// Design Constants
const DESIGN = {
  colors: {
    primary: '#8B5CF6',
    lavenderLight: '#E9D5FF',
    accentPink: '#FFB8E6',
    background: '#1A1A1A',
    card: '#2D2D2D',
    textPrimary: '#FFFFFF',
    textSecondary: '#B8B8B8',
    muted: '#4A4A4A',
    border: '#404040'
  },
  borderRadius: {
    card: '24px',
    innerCard: '20px',
    button: '12px',
    roundButton: '50%',
    modalTop: '20px',
    smallPill: '8px',
    input: '12px'
  },
  shadows: {
    card: '0 8px 32px rgba(0, 0, 0, 0.4)',
    button: '0 4px 16px rgba(0, 0, 0, 0.3)',
    modal: '0 20px 60px rgba(0, 0, 0, 0.4)'
  }
};

interface EventWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = [
  { value: 'music', label: 'Music & Concerts', icon: Music },
  { value: 'tech', label: 'Tech & Innovation', icon: Cpu },
  { value: 'party', label: 'Party & Social', icon: Users },
  { value: 'art', label: 'Art & Culture', icon: Brush },
  { value: 'food', label: 'Food & Drink', icon: Globe },
  { value: 'sports', label: 'Sports & Fitness', icon: MapIcon },
  { value: 'other', label: 'Other', icon: Radio }
];

const stepTitles = [
  'Basic Info',
  'Event Media',
  'Location & Check-In',
  'Check-In Radius',
  'Review & Publish'
];

const presetColors = [
  '#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899', '#3B82F6', '#10B981',
  '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#3B82F6',
  '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#06B6D4'
];

export function EventWizardModal({ isOpen, onClose }: EventWizardModalProps) {
  const { addEvent, user } = useApp();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [mediaType, setMediaType] = useState<'video' | 'carousel'>('carousel'); // Add this state
  const [eventData, setEventData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    date: '',
    time: '',
    location: '',
    address: '',
    streetName: '',
    coordinates: { lat: -22.5609, lng: 17.0658 },
    geofenceRadius: 50,
    images: [] as string[],
    videos: [] as string[],
    videoFiles: [] as File[],
    themeColor: '#8B5CF6',
    isFree: true,
    mediaType: 'carousel' as 'video' | 'carousel', // Track media type
    selectedVideoIndex: 0, // For video selection if multiple
  });
  const [createdEvent, setCreatedEvent] = useState<Event | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState<string>('0:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedVenueDetails, setSelectedVenueDetails] = useState<{
    name: string;
    address: string;
    website?: string;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [imageZoom, setImageZoom] = useState(100);

  const mapContainer1 = useRef<HTMLDivElement>(null);
  const mapContainer2 = useRef<HTMLDivElement>(null);
  const map1 = useRef<mapboxgl.Map | null>(null);
  const map2 = useRef<mapboxgl.Map | null>(null);
  const marker1 = useRef<mapboxgl.Marker | null>(null);
  const marker2 = useRef<mapboxgl.Marker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const primaryPhotoRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mapsInitialized = useRef({ map1: false, map2: false });

  // Get user's location for proximity bias
  const [userLocation, setUserLocation] = useState({ lat: -22.5609, lng: 17.0658 });

  useEffect(() => {
    // Try to get user's current location for better search results
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Default to Windhoek, Namibia
          setUserLocation({ lat: -22.5609, lng: 17.0658 });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, []);

  // Cleanup URLs when component unmounts or images/videos change
  useEffect(() => {
    return () => {
      eventData.images.forEach(url => URL.revokeObjectURL(url));
      eventData.videos.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setMediaType('carousel');
      setEventData({
        name: '',
        description: '',
        category: '',
        price: '',
        date: '',
        time: '',
        location: '',
        address: '',
        streetName: '',
        coordinates: { lat: -22.5609, lng: 17.0658 },
        geofenceRadius: 50,
        images: [],
        videos: [],
        videoFiles: [],
        themeColor: '#8B5CF6',
        isFree: true,
        mediaType: 'carousel',
        selectedVideoIndex: 0,
      });
      setImageFiles([]);
      setVideoFile(null);
      setCreatedEvent(null);
      setIsSubmitting(false);
      setLocationSuggestions([]);
      setShowSuggestions(false);
      setSelectedVenueDetails(null);
      setIsSearching(false);
      setIsReverseGeocoding(false);
      setMapError(null);
      setImagePosition({ x: 50, y: 50 });
      setIsDraggingImage(false);
      setImageZoom(100);
      setIsVideoPlaying(false);
      setVideoDuration('0:00');
    }
  }, [isOpen]);

  // Cleanup maps ONLY when modal closes
  useEffect(() => {
    if (!isOpen) {
      const cleanupMap = (
        mapRef: React.MutableRefObject<mapboxgl.Map | null>, 
        markerRef: React.MutableRefObject<mapboxgl.Marker | null>
      ) => {
        if (markerRef.current) {
          try {
            markerRef.current.remove();
          } catch (error) {
            console.error('Error removing marker:', error);
          }
          markerRef.current = null;
        }
        if (mapRef.current) {
          try {
            mapRef.current.remove();
          } catch (error) {
            console.error('Error removing map:', error);
          }
          mapRef.current = null;
        }
      };

      cleanupMap(map1, marker1);
      cleanupMap(map2, marker2);
      
      // Reset initialization flags
      mapsInitialized.current = { map1: false, map2: false };
    }
  }, [isOpen]);

  // Initialize map for step 3
  useEffect(() => {
    if (step === 3 && isOpen && mapContainer1.current && !mapsInitialized.current.map1) {
      const initMap = async () => {
        try {
          await initializeMap(mapContainer1.current!, 1);
          mapsInitialized.current.map1 = true;
        } catch (error) {
          console.error('Error initializing map for step 3:', error);
          setMapError('Failed to load map. Please try again.');
        }
      };
      
      initMap();
    } else if (step === 3 && map1.current && mapsInitialized.current.map1) {
      // Map already exists, just update it
      setTimeout(() => {
        if (map1.current) {
          try {
            map1.current.resize();
            map1.current.flyTo({
              center: [eventData.coordinates.lng, eventData.coordinates.lat],
              zoom: 14,
              duration: 500
            });
          } catch (error) {
            console.error('Error updating map1:', error);
          }
        }
      }, 50);
    }
  }, [step, isOpen, eventData.coordinates]);

  // Initialize map for step 4
  useEffect(() => {
    if (step === 4 && isOpen && mapContainer2.current && !mapsInitialized.current.map2) {
      const initMap = async () => {
        try {
          await initializeMap(mapContainer2.current!, 2);
          mapsInitialized.current.map2 = true;
        } catch (error) {
          console.error('Error initializing map for step 4:', error);
          setMapError('Failed to load map. Please try again.');
        }
      };
      
      initMap();
    } else if (step === 4 && map2.current && mapsInitialized.current.map2) {
      // Map already exists, just update it
      setTimeout(() => {
        if (map2.current) {
          try {
            map2.current.resize();
            map2.current.flyTo({
              center: [eventData.coordinates.lng, eventData.coordinates.lat],
              zoom: 14,
              duration: 500
            });
            updateGeofenceCircle(map2.current);
          } catch (error) {
            console.error('Error updating map2:', error);
          }
        }
      }, 50);
    }
  }, [step, isOpen, eventData.coordinates]);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        // Resize maps based on current step
        if (step === 3 && map1.current && mapsInitialized.current.map1) {
          try {
            map1.current.resize();
            // Trigger a re-render
            const center = map1.current.getCenter();
            map1.current.jumpTo({ center, zoom: map1.current.getZoom() });
          } catch (error) {
            console.error('Error resizing map1:', error);
          }
        }
        
        if (step === 4 && map2.current && mapsInitialized.current.map2) {
          try {
            map2.current.resize();
            const center = map2.current.getCenter();
            map2.current.jumpTo({ center, zoom: map2.current.getZoom() });
          } catch (error) {
            console.error('Error resizing map2:', error);
          }
        }
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [step, isOpen]);

  const initializeMap = useCallback(async (container: HTMLDivElement, mapNumber: 1 | 2) => {
    if (!container) {
      console.error('Map container not found');
      setMapError('Map container not available');
      return;
    }
    
    try {
      // Clear any existing error
      setMapError(null);
      
      // Set a minimum height for the container to prevent black screen
      container.style.minHeight = '320px';
      
      const mapInstance = new mapboxgl.Map({
        container,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [eventData.coordinates.lng, eventData.coordinates.lat],
        zoom: 14,
        pitch: 0,
        bearing: 0,
        antialias: true,
        attributionControl: false,
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: true,
      });

      // Add error handler
      mapInstance.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError('Map failed to load. Please refresh the page.');
      });

      // Wait for map to load
      await new Promise<void>((resolve) => {
        mapInstance.on('load', () => {
          console.log(`Map ${mapNumber} loaded successfully`);
          
          if (mapNumber === 1) {
            map1.current = mapInstance;
            
            // Add marker for map 1
            marker1.current = new mapboxgl.Marker({ 
              color: eventData.themeColor,
              draggable: true 
            })
              .setLngLat([eventData.coordinates.lng, eventData.coordinates.lat])
              .addTo(mapInstance);

            // Handle marker drag
            marker1.current.on('dragend', () => {
              if (marker1.current) {
                const lngLat = marker1.current.getLngLat();
                setEventData(prev => ({ 
                  ...prev, 
                  coordinates: { lat: lngLat.lat, lng: lngLat.lng } 
                }));
                reverseGeocode(lngLat.lng, lngLat.lat);
              }
            });

            // Click to set location
            mapInstance.on('click', (e) => {
              const { lng, lat } = e.lngLat;
              setEventData(prev => ({ ...prev, coordinates: { lat, lng } }));
              if (marker1.current) {
                marker1.current.setLngLat([lng, lat]);
              } else {
                marker1.current = new mapboxgl.Marker({ color: eventData.themeColor })
                  .setLngLat([lng, lat])
                  .addTo(mapInstance);
              }
              reverseGeocode(lng, lat);
            });
          } else {
            map2.current = mapInstance;
            
            // Add marker for map 2
            marker2.current = new mapboxgl.Marker({ 
              color: eventData.themeColor 
            })
              .setLngLat([eventData.coordinates.lng, eventData.coordinates.lat])
              .addTo(mapInstance);

            // Add geofence circle
            updateGeofenceCircle(mapInstance);
          }

          // Add navigation controls
          mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
          
          // Add geolocate control
          const geolocateControl = new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserLocation: true,
          });
          
          geolocateControl.on('geolocate', (position: GeolocationPosition) => {
            const { longitude, latitude } = position.coords;
            setEventData(prev => ({
              ...prev,
              coordinates: { lat: latitude, lng: longitude }
            }));
            reverseGeocode(longitude, latitude);
          });
          
          mapInstance.addControl(geolocateControl, 'top-right');
          
          // Force a resize to ensure proper rendering
          setTimeout(() => {
            mapInstance.resize();
          }, 100);
          
          resolve();
        });

        // Set a timeout in case map fails to load
        setTimeout(() => {
          resolve();
        }, 5000);
      });

    } catch (error) {
      console.error('Error creating map:', error);
      setMapError('Failed to initialize map. Please check your internet connection and try again.');
      throw error;
    }
  }, [eventData.themeColor, eventData.coordinates]);

  // Update geofence circle when radius changes
  const updateGeofenceCircle = useCallback((mapInstance: mapboxgl.Map) => {
    if (!mapInstance.loaded()) return;

    const { lat, lng } = eventData.coordinates;
    const radiusInKm = eventData.geofenceRadius / 1000;
    
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

    const sourceId = 'geofence-circle';
    const fillLayerId = 'geofence-fill';
    const lineLayerId = 'geofence-line';
    
    try {
      if (mapInstance.getSource(sourceId)) {
        (mapInstance.getSource(sourceId) as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'Polygon', coordinates: [coords] },
        });
      } else {
        mapInstance.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'Polygon', coordinates: [coords] },
          },
        });

        mapInstance.addLayer({
          id: fillLayerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': eventData.themeColor,
            'fill-opacity': 0.15,
          },
        });

        mapInstance.addLayer({
          id: lineLayerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': eventData.themeColor,
            'line-width': 2,
            'line-dasharray': [2, 2],
          },
        });
      }

      // Update layer colors if theme changes
      if (mapInstance.getLayer(fillLayerId)) {
        mapInstance.setPaintProperty(fillLayerId, 'fill-color', eventData.themeColor);
      }
      if (mapInstance.getLayer(lineLayerId)) {
        mapInstance.setPaintProperty(lineLayerId, 'line-color', eventData.themeColor);
      }
    } catch (error) {
      console.error('Error updating geofence circle:', error);
    }
  }, [eventData.geofenceRadius, eventData.coordinates, eventData.themeColor]);

  const reverseGeocode = async (lng: number, lat: number) => {
    setIsReverseGeocoding(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/search/geocode/v6/reverse?` +
        `longitude=${lng}&latitude=${lat}&` +
        `access_token=${MAPBOX_TOKEN}&` +
        `language=en&` +
        `limit=1`
      );
      
      if (!response.ok) {
        throw new Error(`Reverse geocoding API error: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const place = data.features[0];
        const properties = place.properties || {};
        const context = properties.context || {};
        
        // Extract address components from v6 API structure
        const street = properties.name || properties.full_address || '';
        const locality = context.place?.name || '';
        const region = context.region?.name || '';
        const country = context.country?.name || '';
        
        // Build full address
        const fullAddress = [
          street,
          locality,
          region,
          country
        ].filter(Boolean).join(', ');
        
        setEventData(prev => ({
          ...prev,
          location: properties.name || locality || '',
          address: fullAddress || properties.full_address || '',
          streetName: street || properties.name || '',
        }));
        
        setSelectedVenueDetails({
          name: properties.name || locality || 'Selected Location',
          address: fullAddress || properties.full_address || '',
        });
        
        // Update search input
        if (searchInputRef.current) {
          searchInputRef.current.value = fullAddress || properties.name || '';
        }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      toast({
        title: 'Location Error',
        description: 'Could not get address for this location.',
        variant: 'destructive'
      });
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Debounced search function for location autocomplete - Namibia focused
  const searchLocation = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setLocationSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      
      setIsSearching(true);
      
      try {
        // Correct Geocoding v6 API endpoint and parameters
        const response = await fetch(
          `https://api.mapbox.com/search/geocode/v6/forward?` +
          `q=${encodeURIComponent(query)}&` +
          `access_token=${MAPBOX_TOKEN}&` +
          `country=NA&` + // Restrict to Namibia
          `bbox=11.7,-28.97,25.27,-16.96&` + // Namibia bounding box
          `proximity=${userLocation.lng},${userLocation.lat}&` +
          `language=en&` +
          `types=address,place,poi&` + // Filter for relevant features
          `limit=10`
        );
        
        if (!response.ok) {
          throw new Error(`Search API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          // For v6 API, check if results are from Namibia
          const namibianResults = data.features
            .filter((feature: any) => {
              // In v6, country info might be in properties.context.country
              const countryCode = feature.properties?.context?.country?.iso_3166_1_alpha_2;
              return countryCode === 'NA';
            })
            .slice(0, 8);
          
          setLocationSuggestions(namibianResults);
          setShowSuggestions(namibianResults.length > 0);
        } else {
          setLocationSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Search error:', error);
        setLocationSuggestions([]);
        setShowSuggestions(false);
        toast({
          title: 'Search Error',
          description: 'Could not search for locations. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [userLocation, toast]
  );

  const getSuggestionIcon = (placeType: string[], category?: string) => {
    if (placeType.includes('poi')) {
      if (category?.includes('restaurant') || category?.includes('food')) return <Utensils className="w-4 h-4" />;
      if (category?.includes('cafe') || category?.includes('coffee')) return <Coffee className="w-4 h-4" />;
      if (category?.includes('bar') || category?.includes('pub')) return <Beer className="w-4 h-4" />;
      if (category?.includes('hotel') || category?.includes('lodging')) return <Hotel className="w-4 h-4" />;
      if (category?.includes('shop') || category?.includes('store')) return <ShoppingBag className="w-4 h-4" />;
      if (category?.includes('park') || category?.includes('garden')) return <Trees className="w-4 h-4" />;
      if (category?.includes('school') || category?.includes('university')) return <School className="w-4 h-4" />;
      if (category?.includes('hospital') || category?.includes('clinic')) return <Hospital className="w-4 h-4" />;
      if (category?.includes('government')) return <Building className="w-4 h-4" />;
      return <Landmark className="w-4 h-4" />;
    }
    if (placeType.includes('address')) return <Home className="w-4 h-4" />;
    if (placeType.includes('place') || placeType.includes('locality')) return <MapPin className="w-4 h-4" />;
    if (placeType.includes('neighborhood')) return <Navigation className="w-4 h-4" />;
    if (placeType.includes('region') || placeType.includes('district')) return <Map className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  const formatSuggestion = (feature: any) => {
    const properties = feature.properties || {};
    const primaryText = properties.name || feature.text || '';
    const secondaryText = properties.full_address || properties.place_formatted || '';
    
    // For v6 API, use properties.type instead of place_type
    const placeTypes = properties.type ? [properties.type] : feature.place_type || [];
    const icon = getSuggestionIcon(placeTypes, properties.category);
    
    return {
      icon,
      primary: primaryText,
      secondary: secondaryText,
      coordinates: feature.geometry?.coordinates || [],
      fullData: feature
    };
  };

  const handleLocationSelect = (selectedFeature: any) => {
    const coordinates = selectedFeature.geometry?.coordinates || selectedFeature.center;
    const [lng, lat] = coordinates;
    const properties = selectedFeature.properties || {};
    const venueName = properties.name || selectedFeature.text || '';
    const address = properties.full_address || properties.place_formatted || '';
    
    setEventData(prev => ({
      ...prev,
      coordinates: { lat, lng },
      location: venueName,
      address: address,
      streetName: properties.name || venueName,
    }));
    
    setSelectedVenueDetails({
      name: venueName,
      address: address,
    });
    
    setLocationSuggestions([]);
    setShowSuggestions(false);
    
    // Update search input
    if (searchInputRef.current) {
      searchInputRef.current.value = address;
    }
    
    // Update both maps if they exist and fly to location
    if (map1.current) {
      map1.current.flyTo({
        center: [lng, lat],
        zoom: 15,
        duration: 1500,
        essential: true
      });
      if (marker1.current) {
        marker1.current.setLngLat([lng, lat]);
      } else {
        marker1.current = new mapboxgl.Marker({ 
          color: eventData.themeColor,
          draggable: true 
        })
          .setLngLat([lng, lat])
          .addTo(map1.current);
          
        marker1.current.on('dragend', () => {
          if (marker1.current) {
            const lngLat = marker1.current.getLngLat();
            setEventData(prev => ({ 
              ...prev, 
              coordinates: { lat: lngLat.lat, lng: lngLat.lng } 
            }));
            reverseGeocode(lngLat.lng, lngLat.lat);
          }
        });
      }
    }
    
    if (map2.current) {
      map2.current.flyTo({
        center: [lng, lat],
        zoom: 15,
        duration: 1500,
        essential: true
      });
      if (marker2.current) {
        marker2.current.setLngLat([lng, lat]);
      } else {
        marker2.current = new mapboxgl.Marker({ 
          color: eventData.themeColor 
        })
          .setLngLat([lng, lat])
          .addTo(map2.current);
      }
      updateGeofenceCircle(map2.current);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).slice(0, 5 - imageFiles.length);
      setImageFiles(prev => [...prev, ...newImages]);
      
      // Create preview URLs
      const imageUrls = newImages.map(file => URL.createObjectURL(file));
      setEventData(prev => ({
        ...prev,
        images: [...prev.images, ...imageUrls]
      }));
      
      // Reset file input
      e.target.value = '';
    }
  };

  const handlePrimaryPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      // If this is the first photo, treat as primary
      if (imageFiles.length === 0) {
        const newFile = files[0];
        setImageFiles([newFile]);
        setEventData(prev => ({
          ...prev,
          images: [URL.createObjectURL(newFile)]
        }));
        // Reset position and zoom for new image
        setImagePosition({ x: 50, y: 50 });
        setImageZoom(100);
      }
      e.target.value = '';
    }
  };

  const handleImagePositionChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingImage) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setImagePosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newVideoFile = files[0];
    
    // Validate video file
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/ogg'];
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (!validTypes.includes(newVideoFile.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload MP4, WebM, MOV, AVI, or OGG files only.',
        variant: 'destructive'
      });
      e.target.value = '';
      return;
    }
    
    if (newVideoFile.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Video must be under 50MB.',
        variant: 'destructive'
      });
      e.target.value = '';
      return;
    }
    
    // Create preview URL
    const videoUrl = URL.createObjectURL(newVideoFile);
    
    setEventData(prev => ({
      ...prev,
      videos: [videoUrl],
      videoFiles: [newVideoFile]
    }));
    
    setVideoFile(newVideoFile);
    e.target.value = '';
  };

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsVideoPlaying(true);
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  };

  const handleVideoLoaded = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      setVideoDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }
  };

  const removeImage = (index: number) => {
    // Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(eventData.images[index]);
    
    setEventData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    if (eventData.videos[0]) {
      URL.revokeObjectURL(eventData.videos[0]);
    }
    
    setEventData(prev => ({
      ...prev,
      videos: [],
      videoFiles: [],
      mediaType: 'carousel' // Reset to carousel if video is removed
    }));
    setVideoFile(null);
    setIsVideoPlaying(false);
    setVideoDuration('0:00');
    
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handlePublish = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create an event',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const qrCode = `${eventData.name.replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      
      // Parse price - ensure it's a number
      const price = eventData.isFree ? 0 : parseFloat(eventData.price) || 0;
      
      // Determine media type
      const hasVideo = eventData.videos.length > 0;
      const mediaType = hasVideo ? 'video' : 'carousel';
      
      // In a real app, you would upload files to a server/storage service
      // For demo purposes, we'll keep the object URLs
      const videoUrls = eventData.videos;
      
      const newEvent: Event = {
        id: crypto.randomUUID(),
        name: eventData.name,
        description: eventData.description,
        category: eventData.category,
        location: eventData.location,
        address: eventData.address,
        coordinates: eventData.coordinates,
        date: eventData.date,
        time: eventData.time,
        price: price,
        currency: 'NAD',
        maxAttendees: 500,
        attendees: 0,
        organizerId: user.id,
        qrCode,
        geofenceRadius: eventData.geofenceRadius,
        customTheme: eventData.themeColor,
        coverImage: eventData.images[0] || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000000)}?w=800&auto=format&fit=crop`,
        images: eventData.images,
        videos: videoUrls,
        tags: [eventData.category],
        isFeatured: user?.subscription?.tier === 'max',
        hasVideo: videoUrls.length > 0,
        mediaType: mediaType, // Store the media type
        selectedVideoIndex: 0
      };

      await addEvent(newEvent);
      setCreatedEvent(newEvent);
      setStep(6);
      
      toast({
        title: 'Event created!',
        description: 'Your event has been published successfully.',
      });
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to create event. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCode = () => {
    if (createdEvent) {
      navigator.clipboard.writeText(createdEvent.qrCode);
      toast({ 
        title: 'Code copied!', 
        description: 'Share this code with your attendees' 
      });
    }
  };

  const handleDownloadQR = () => {
    toast({
      title: 'QR Code Download',
      description: 'This feature would generate and download a QR code image.',
    });
  };

  const isStep1Valid = eventData.name.trim() && eventData.category && eventData.date && eventData.time;
  const isStep3Valid = eventData.coordinates.lat !== 0 && eventData.location.trim();

  if (!isOpen) return null;

  // Get current date for date input min
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" 
         style={{ 
           background: 'rgba(0, 0, 0, 0.5)',
           backdropFilter: 'blur(8px)'
         }}>
      <div 
        ref={modalRef}
        className="flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden"
        style={{
          background: DESIGN.colors.background,
          borderRadius: DESIGN.borderRadius.modalTop,
          boxShadow: DESIGN.shadows.modal,
          border: `1px solid ${DESIGN.colors.border}`
        }}
      >
        {/* Header - Redesigned to be compact */}
        <div style={{ borderBottom: `1px solid ${DESIGN.colors.border}`, flexShrink: 0 }}>
          {/* Row 1: Title and Close */}
          <div className="flex items-center justify-between px-6 h-14">
            <h2 className="text-[28px] font-bold" style={{ color: DESIGN.colors.textPrimary }}>
              Create Event
            </h2>
            <button 
              onClick={onClose} 
              className="w-8 h-8 flex items-center justify-center transition-colors"
              style={{ 
                borderRadius: '50%',
                color: DESIGN.colors.textSecondary
              }}
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Row 2: Progress Dots */}
          {step < 6 && (
            <div className="flex justify-center items-center h-10">
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="flex items-center">
                    <div
                      className={cn(
                        'transition-all duration-300',
                        s < step ? 'bg-primary' : 
                        s === step ? 'bg-primary' : DESIGN.colors.muted
                      )}
                      style={{ 
                        width: s === step ? '12px' : '8px',
                        height: s === step ? '12px' : '8px',
                        borderRadius: '50%'
                      }}
                    />
                    {s < 5 && (
                      <div className={cn(
                        'h-0.5 mx-1 transition-colors duration-300',
                        s < step ? 'bg-primary' : DESIGN.colors.muted
                      )} 
                      style={{ width: '12px' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Row 3: Current Step Title */}
          {step < 6 && (
            <div className="flex justify-center items-center h-8 pb-2">
              <span className="text-[14px]" style={{ color: DESIGN.colors.textSecondary }}>
                {stepTitles[step - 1]}
              </span>
            </div>
          )}
        </div>

        {/* Content - Scrollable area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-[22px] font-bold mb-1" style={{ color: DESIGN.colors.textPrimary }}>
                    Event Details
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[13px] font-semibold mb-2 block uppercase tracking-wider" 
                           style={{ color: DESIGN.colors.textSecondary }}>
                      Event Name *
                    </label>
                    <div className="relative">
                      <Input
                        value={eventData.name}
                        onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
                        placeholder="Summer Music Festival"
                        className="h-11"
                        style={{
                          borderRadius: DESIGN.borderRadius.input,
                          borderColor: DESIGN.colors.border,
                          background: DESIGN.colors.card,
                          color: DESIGN.colors.textPrimary
                        }}
                        disabled={isSubmitting}
                        maxLength={50}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" 
                           style={{ color: DESIGN.colors.textSecondary }}>
                        {50 - eventData.name.length}
                      </div>
                    </div>
                    <p className="text-xs mt-1" style={{ color: DESIGN.colors.textSecondary }}>
                      {50 - eventData.name.length} characters remaining
                    </p>
                  </div>

                  <div>
                    <label className="text-[13px] font-semibold mb-2 block uppercase tracking-wider" 
                           style={{ color: DESIGN.colors.textSecondary }}>
                      Description *
                    </label>
                    <Textarea
                      value={eventData.description}
                      onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                      placeholder="Tell attendees what to expect..."
                      rows={4}
                      style={{
                        borderRadius: DESIGN.borderRadius.input,
                        borderColor: DESIGN.colors.border,
                        background: DESIGN.colors.card,
                        color: DESIGN.colors.textPrimary
                      }}
                      disabled={isSubmitting}
                      maxLength={500}
                    />
                    <p className="text-xs mt-1" style={{ color: DESIGN.colors.textSecondary }}>
                      {500 - eventData.description.length} characters remaining
                    </p>
                  </div>

                  <div>
                    <label className="text-[13px] font-semibold mb-2 block uppercase tracking-wider" 
                           style={{ color: DESIGN.colors.textSecondary }}>
                      Category *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {categories.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.value}
                            onClick={() => setEventData({ ...eventData, category: cat.value })}
                            disabled={isSubmitting}
                            className={cn(
                              'flex flex-col items-center justify-center p-3 border transition-all',
                              eventData.category === cat.value
                                ? 'border-primary'
                                : 'border-border hover:border-primary'
                            )}
                            style={{
                              borderRadius: DESIGN.borderRadius.button,
                              background: eventData.category === cat.value 
                                ? `${eventData.themeColor}20` 
                                : 'transparent'
                            }}
                          >
                            <Icon className="w-5 h-5 mb-1" 
                                  style={{ color: eventData.category === cat.value ? eventData.themeColor : DESIGN.colors.textSecondary }} />
                            <span className="text-xs font-medium" 
                                  style={{ color: eventData.category === cat.value ? eventData.themeColor : DESIGN.colors.textPrimary }}>
                              {cat.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[13px] font-semibold mb-2 block uppercase tracking-wider" 
                             style={{ color: DESIGN.colors.textSecondary }}>
                        Date *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
                                 style={{ color: DESIGN.colors.textSecondary }} />
                        <Input
                          type="date"
                          value={eventData.date}
                          onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                          className="h-11 pl-10"
                          style={{
                            borderRadius: DESIGN.borderRadius.input,
                            borderColor: DESIGN.colors.border,
                            background: DESIGN.colors.card,
                            color: DESIGN.colors.textPrimary
                          }}
                          disabled={isSubmitting}
                          min={today}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[13px] font-semibold mb-2 block uppercase tracking-wider" 
                             style={{ color: DESIGN.colors.textSecondary }}>
                        Time *
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
                              style={{ color: DESIGN.colors.textSecondary }} />
                        <Input
                          type="time"
                          value={eventData.time}
                          onChange={(e) => setEventData({ ...eventData, time: e.target.value })}
                          className="h-11 pl-10"
                          style={{
                            borderRadius: DESIGN.borderRadius.input,
                            borderColor: DESIGN.colors.border,
                            background: DESIGN.colors.card,
                            color: DESIGN.colors.textPrimary
                          }}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Theme Color Section */}
                  <div>
                    <label className="text-[13px] font-semibold mb-3 block uppercase tracking-wider" 
                           style={{ color: DESIGN.colors.textSecondary }}>
                      Event Theme Color
                    </label>
                    {user?.subscription?.tier === 'max' ? (
                      <div className="space-y-3">
                        <div className="flex gap-2 flex-wrap">
                          {presetColors.slice(0, 10).map((color, index) => (
                            <button
                              key={index}
                              onClick={() => setEventData({ ...eventData, themeColor: color })}
                              className="w-8 h-8 transition-transform hover:scale-110"
                              style={{ 
                                backgroundColor: color,
                                borderRadius: '50%',
                                border: `2px solid ${eventData.themeColor === color ? color : 'transparent'}`
                              }}
                              title={color}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={eventData.themeColor}
                            onChange={(e) => setEventData({ ...eventData, themeColor: e.target.value })}
                            className="w-10 h-10 cursor-pointer border"
                            style={{
                              borderRadius: DESIGN.borderRadius.input,
                              borderColor: DESIGN.colors.border
                            }}
                          />
                          <div>
                            <p className="text-sm font-medium" style={{ color: DESIGN.colors.textPrimary }}>
                              Custom Color
                            </p>
                            <p className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                              Applied to buttons and accents
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4"
                           style={{
                             borderRadius: DESIGN.borderRadius.input,
                             border: `1px solid ${DESIGN.colors.border}`,
                             background: `linear-gradient(to right, ${eventData.themeColor}10, ${eventData.themeColor}20)`
                           }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-full border-2"
                              style={{ 
                                backgroundColor: eventData.themeColor,
                                borderColor: eventData.themeColor
                              }}
                            />
                            <div>
                              <p className="text-sm font-medium" style={{ color: DESIGN.colors.textPrimary }}>
                                Current Theme
                              </p>
                              <p className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                                Purple theme selected
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" 
                                  className="rounded-lg"
                                  style={{ borderRadius: DESIGN.borderRadius.button }}>
                            Upgrade to Max
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                        <p className="text-xs mt-3" style={{ color: DESIGN.colors.textSecondary }}>
                          🎨 Unlock 20+ theme colors and custom color picker with Max subscription
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Ticket Price - Fixed empty state */}
                  <div>
                    <label className="text-[13px] font-semibold mb-2 block uppercase tracking-wider" 
                           style={{ color: DESIGN.colors.textSecondary }}>
                      Event Access
                    </label>
                    <div className="flex items-center gap-4 mb-3">
                      <button
                        onClick={() => setEventData(prev => ({ ...prev, isFree: true, price: '' }))}
                        className={cn(
                          'px-4 py-2 border transition-colors',
                          eventData.isFree
                            ? 'border-primary text-primary'
                            : 'border-border hover:border-primary'
                        )}
                        style={{
                          borderRadius: DESIGN.borderRadius.button,
                          background: eventData.isFree ? `${eventData.themeColor}20` : 'transparent',
                          color: eventData.isFree ? eventData.themeColor : DESIGN.colors.textPrimary
                        }}
                      >
                        Free Event
                      </button>
                      <button
                        onClick={() => setEventData(prev => ({ ...prev, isFree: false }))}
                        className={cn(
                          'px-4 py-2 border transition-colors',
                          !eventData.isFree
                            ? 'border-primary text-primary'
                            : 'border-border hover:border-primary'
                        )}
                        style={{
                          borderRadius: DESIGN.borderRadius.button,
                          background: !eventData.isFree ? `${eventData.themeColor}20` : 'transparent',
                          color: !eventData.isFree ? eventData.themeColor : DESIGN.colors.textPrimary
                        }}
                      >
                        Paid Event
                      </button>
                    </div>
                    {!eventData.isFree && (
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
                                   style={{ color: DESIGN.colors.textSecondary }} />
                        <Input
                          type="number"
                          value={eventData.price}
                          onChange={(e) => setEventData({ ...eventData, price: e.target.value })}
                          placeholder="0.00"
                          className="h-11 pl-10"
                          style={{
                            borderRadius: DESIGN.borderRadius.input,
                            borderColor: DESIGN.colors.border,
                            background: DESIGN.colors.card,
                            color: DESIGN.colors.textPrimary
                          }}
                          disabled={isSubmitting}
                          min="0"
                          step="0.01"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" 
                             style={{ color: DESIGN.colors.textSecondary }}>
                          NAD
                        </div>
                      </div>
                    )}
                    <p className="text-xs mt-2" style={{ color: DESIGN.colors.textSecondary }}>
                      {eventData.isFree 
                        ? 'Attendees can join for free' 
                        : 'Enter the ticket price for your event'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Event Media */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-[22px] font-bold mb-1" style={{ color: DESIGN.colors.textPrimary }}>
                    Add Photos & Videos
                  </h3>
                  <p className="text-[14px] mb-4" style={{ color: DESIGN.colors.textSecondary }}>
                    Make your event visually appealing
                  </p>
                </div>

                {/* Media Type Selector */}
                <div className="space-y-3">
                  <label className="text-[13px] font-semibold block uppercase tracking-wider" 
                         style={{ color: DESIGN.colors.textSecondary }}>
                    Media Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setEventData(prev => ({ ...prev, mediaType: 'carousel' }));
                        setMediaType('carousel');
                      }}
                      className={cn(
                        'p-4 border transition-all flex flex-col items-center justify-center gap-2',
                        eventData.mediaType === 'carousel'
                          ? 'border-primary'
                          : 'border-border hover:border-primary'
                      )}
                      style={{
                        borderRadius: DESIGN.borderRadius.button,
                        background: eventData.mediaType === 'carousel' 
                          ? `${eventData.themeColor}20` 
                          : 'transparent'
                      }}
                    >
                      <Grid3x3 className="w-6 h-6" 
                              style={{ color: eventData.mediaType === 'carousel' ? eventData.themeColor : DESIGN.colors.textSecondary }} />
                      <span className="text-sm font-medium" 
                            style={{ color: eventData.mediaType === 'carousel' ? eventData.themeColor : DESIGN.colors.textPrimary }}>
                        Image Carousel
                      </span>
                      <p className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                        Multiple images in slideshow
                      </p>
                    </button>
                    <button
                      onClick={() => {
                        setEventData(prev => ({ ...prev, mediaType: 'video' }));
                        setMediaType('video');
                      }}
                      className={cn(
                        'p-4 border transition-all flex flex-col items-center justify-center gap-2',
                        eventData.mediaType === 'video'
                          ? 'border-primary'
                          : 'border-border hover:border-primary'
                      )}
                      style={{
                        borderRadius: DESIGN.borderRadius.button,
                        background: eventData.mediaType === 'video' 
                          ? `${eventData.themeColor}20` 
                          : 'transparent'
                      }}
                    >
                      <Film className="w-6 h-6" 
                            style={{ color: eventData.mediaType === 'video' ? eventData.themeColor : DESIGN.colors.textSecondary }} />
                      <span className="text-sm font-medium" 
                            style={{ color: eventData.mediaType === 'video' ? eventData.themeColor : DESIGN.colors.textPrimary }}>
                        Video
                      </span>
                      <p className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                        Auto-play muted video
                      </p>
                    </button>
                  </div>
                </div>

                {/* Primary Event Photo (ALWAYS REQUIRED FOR EVENT CARD) */}
                <div className="space-y-3">
                  <label className="text-[13px] font-semibold block uppercase tracking-wider" 
                         style={{ color: DESIGN.colors.textSecondary }}>
                    Primary Event Photo *
                  </label>
                  <div 
                    className={cn(
                      "border-2 flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden",
                      "hover:border-primary",
                      imageFiles.length > 0 ? "border-solid" : "border-dashed"
                    )}
                    style={{
                      borderRadius: DESIGN.borderRadius.card,
                      borderColor: imageFiles.length > 0 ? DESIGN.colors.border : DESIGN.colors.muted,
                      height: '192px',
                      background: imageFiles.length > 0 ? 'transparent' : `${DESIGN.colors.primary}10`
                    }}
                    onClick={() => !imageFiles.length && primaryPhotoRef.current?.click()}
                    onMouseDown={(e) => {
                      if (imageFiles.length > 0) {
                        e.preventDefault();
                        setIsDraggingImage(true);
                      }
                    }}
                    onMouseMove={handleImagePositionChange}
                    onMouseUp={() => setIsDraggingImage(false)}
                    onMouseLeave={() => setIsDraggingImage(false)}
                  >
                    {imageFiles.length > 0 ? (
                      <div className="relative w-full h-full">
                        <img
                          src={eventData.images[0]}
                          alt="Primary event photo"
                          className="w-full h-full object-cover"
                          style={{
                            objectPosition: `${imagePosition.x}% ${imagePosition.y}%`,
                            transform: `scale(${imageZoom / 100})`,
                            transition: isDraggingImage ? 'none' : 'all 0.2s ease',
                            cursor: isDraggingImage ? 'grabbing' : 'grab'
                          }}
                          draggable={false}
                        />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setImageZoom(prev => Math.min(150, prev + 10));
                            }}
                            className="w-8 h-8 backdrop-blur-sm flex items-center justify-center"
                            style={{
                              borderRadius: '50%',
                              background: 'rgba(0, 0, 0, 0.6)',
                              color: DESIGN.colors.textPrimary
                            }}
                            title="Zoom in"
                          >
                            <span className="text-lg font-bold">+</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setImageZoom(prev => Math.max(50, prev - 10));
                            }}
                            className="w-8 h-8 backdrop-blur-sm flex items-center justify-center"
                            style={{
                              borderRadius: '50%',
                              background: 'rgba(0, 0, 0, 0.6)',
                              color: DESIGN.colors.textPrimary
                            }}
                            title="Zoom out"
                          >
                            <span className="text-lg font-bold">−</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              primaryPhotoRef.current?.click();
                            }}
                            className="w-8 h-8 backdrop-blur-sm flex items-center justify-center"
                            style={{
                              borderRadius: '50%',
                              background: 'rgba(0, 0, 0, 0.6)',
                              color: DESIGN.colors.textPrimary
                            }}
                            title="Change photo"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(0);
                            setImagePosition({ x: 50, y: 50 });
                            setImageZoom(100);
                          }}
                          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center"
                          style={{
                            borderRadius: '50%',
                            background: '#EF4444',
                            color: DESIGN.colors.textPrimary
                          }}
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs px-3 py-1.5 backdrop-blur-sm"
                             style={{
                               borderRadius: '9999px',
                               background: 'rgba(0, 0, 0, 0.6)',
                               color: DESIGN.colors.textPrimary
                             }}>
                          {isDraggingImage ? 'Positioning...' : 'Click and drag to adjust'}
                        </div>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-12 h-12 mb-3" style={{ color: DESIGN.colors.textSecondary }} />
                        <p className="text-sm font-medium" style={{ color: DESIGN.colors.textPrimary }}>Click to upload</p>
                        <p className="text-xs mt-1" style={{ color: DESIGN.colors.textSecondary }}>or drag & drop</p>
                        <p className="text-xs mt-3" style={{ color: DESIGN.colors.textSecondary }}>
                          JPG, PNG, WEBP • Max 10MB
                        </p>
                      </>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                    {imageFiles.length > 0 
                      ? 'Click and drag to reposition • Use +/− to zoom' 
                      : 'This photo appears on event cards'}
                  </p>
                  <input
                    ref={primaryPhotoRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePrimaryPhotoUpload}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Conditional Content Based on Media Type */}
                {eventData.mediaType === 'carousel' ? (
                  /* Additional Photos for Carousel */
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[13px] font-semibold uppercase tracking-wider" 
                            style={{ color: DESIGN.colors.textSecondary }}>
                        Additional Photos (Optional)
                      </label>
                      <span className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                        {imageFiles.length - 1}/4
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {imageFiles.slice(1).map((_, index) => (
                        <div key={index} className="relative aspect-square overflow-hidden"
                             style={{ borderRadius: DESIGN.borderRadius.button }}>
                          <img
                            src={eventData.images[index + 1]}
                            alt={`Additional photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeImage(index + 1)}
                            className="absolute top-1 right-1 w-6 h-6 text-xs flex items-center justify-center"
                            style={{
                              borderRadius: '50%',
                              background: '#EF4444',
                              color: DESIGN.colors.textPrimary
                            }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {imageFiles.length < 5 && (
                        <div 
                          className="aspect-square flex items-center justify-center cursor-pointer"
                          style={{
                            borderRadius: DESIGN.borderRadius.button,
                            border: `2px dashed ${DESIGN.colors.border}`,
                            background: `${DESIGN.colors.primary}10`
                          }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="w-6 h-6" style={{ color: DESIGN.colors.textSecondary }} />
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                  </div>
                ) : (
                  /* Video Upload for Video Type */
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[13px] font-semibold uppercase tracking-wider" 
                            style={{ color: DESIGN.colors.textSecondary }}>
                        Event Video *
                      </label>
                      <span className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                        {videoFile ? '1/1' : '0/1'}
                      </span>
                    </div>
                    <div 
                      className={cn(
                        "border-2 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden",
                        "hover:border-primary",
                        videoFile ? "border-solid" : "border-dashed"
                      )}
                      style={{
                        borderRadius: DESIGN.borderRadius.card,
                        borderColor: videoFile ? DESIGN.colors.border : DESIGN.colors.muted,
                        height: '192px',
                        background: videoFile ? 'transparent' : `${DESIGN.colors.primary}10`
                      }}
                      onClick={() => !videoFile && videoInputRef.current?.click()}
                    >
                      {videoFile ? (
                        <div className="relative w-full h-full group">
                          <video
                            ref={videoRef}
                            src={eventData.videos[0]}
                            className="w-full h-full object-cover"
                            style={{ borderRadius: DESIGN.borderRadius.card }}
                            controls={false}
                            muted
                            playsInline
                            onLoadedMetadata={handleVideoLoaded}
                            onEnded={() => setIsVideoPlaying(false)}
                            onPlay={() => setIsVideoPlaying(true)}
                            onPause={() => setIsVideoPlaying(false)}
                          />
                          
                          {/* Video controls overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <div className="flex items-center justify-between">
                                <button
                                  onClick={toggleVideoPlay}
                                  className="w-10 h-10 rounded-full flex items-center justify-center"
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    color: DESIGN.colors.background
                                  }}
                                >
                                  {isVideoPlaying ? (
                                    <Pause className="w-5 h-5 ml-0.5" />
                                  ) : (
                                    <Play className="w-5 h-5 ml-0.5" />
                                  )}
                                </button>
                                <div className="flex-1 mx-4">
                                  <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-white"
                                      style={{ width: videoRef.current ? `${(videoRef.current.currentTime / videoRef.current.duration) * 100}%` : '0%' }}
                                    />
                                  </div>
                                </div>
                                <span className="text-xs font-medium text-white">
                                  {videoDuration}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Video info overlay */}
                          <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 rounded-full backdrop-blur-sm"
                               style={{
                                 background: 'rgba(0, 0, 0, 0.6)'
                               }}>
                            <Video className="w-3 h-3 text-white" />
                            <span className="text-xs text-white">
                              {videoFile.type.split('/')[1].toUpperCase()}
                            </span>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeVideo();
                            }}
                            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center z-10"
                            style={{
                              borderRadius: '50%',
                              background: '#EF4444',
                              color: DESIGN.colors.textPrimary
                            }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Video className="w-10 h-10 mb-2" style={{ color: DESIGN.colors.textSecondary }} />
                          <p className="text-sm font-medium" style={{ color: DESIGN.colors.textPrimary }}>Click to upload video</p>
                          <p className="text-xs mt-1" style={{ color: DESIGN.colors.textSecondary }}>
                            MP4, WebM, MOV, AVI, OGG • Max 50MB
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                    <p className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                      {videoFile 
                        ? 'Click play/pause to preview • Video will auto-play muted on event details page' 
                        : 'Video will auto-play muted on loop in event details page'}
                    </p>
                  </div>
                )}

                {/* Preview */}
                <div className="space-y-3">
                  <label className="text-[13px] font-semibold block uppercase tracking-wider" 
                         style={{ color: DESIGN.colors.textSecondary }}>
                    Preview
                  </label>
                  <div className="p-4"
                       style={{
                         borderRadius: DESIGN.borderRadius.card,
                         border: `1px solid ${DESIGN.colors.border}`,
                         background: DESIGN.colors.card
                       }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                           style={{
                             background: `linear-gradient(to bottom right, ${eventData.themeColor}30, ${eventData.themeColor}10`
                           }}>
                        <Eye className="w-6 h-6" style={{ color: eventData.themeColor }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: DESIGN.colors.textPrimary }}>
                          {eventData.mediaType === 'video' ? 'Video Preview' : 'Carousel Preview'}
                        </p>
                        <p className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                          Shows how your media appears on event details
                        </p>
                      </div>
                    </div>
                    <div className="overflow-hidden" style={{ borderRadius: DESIGN.borderRadius.button, border: `1px solid ${DESIGN.colors.border}` }}>
                      <div className="h-32 flex items-center justify-center overflow-hidden relative"
                           style={{ background: `linear-gradient(to right, ${eventData.themeColor}10, ${eventData.themeColor}5)` }}>
                        {eventData.mediaType === 'video' && videoFile ? (
                          <div className="relative w-full h-full">
                            <video
                              src={eventData.videos[0]}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                              loop
                              autoPlay
                            />
                            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                              Video
                            </div>
                          </div>
                        ) : imageFiles.length > 0 ? (
                          <>
                            <img
                              src={eventData.images[0]}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              style={{
                                objectPosition: `${imagePosition.x}% ${imagePosition.y}%`,
                                transform: `scale(${imageZoom / 100})`
                              }}
                            />
                            {imageFiles.length > 1 && (
                              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                {imageFiles.length} images
                              </div>
                            )}
                          </>
                        ) : (
                          <Image className="w-12 h-12" style={{ color: DESIGN.colors.textSecondary }} />
                        )}
                      </div>
                      <div className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="h-4 mb-2" style={{ borderRadius: '4px', background: DESIGN.colors.muted, width: '75%' }}></div>
                            <div className="h-3" style={{ borderRadius: '4px', background: DESIGN.colors.muted, width: '50%' }}></div>
                          </div>
                          <div className="w-10 h-5" style={{ borderRadius: DESIGN.borderRadius.smallPill, background: DESIGN.colors.muted }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Location & Check-In */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-[22px] font-bold mb-1" style={{ color: DESIGN.colors.textPrimary }}>
                    Event Location
                  </h3>
                  <p className="text-[14px] mb-4" style={{ color: DESIGN.colors.textSecondary }}>
                    Search and select your venue
                  </p>
                </div>

                {/* Search Input with Autocomplete */}
                <div className="relative">
                  <label className="text-[13px] font-semibold mb-2 block uppercase tracking-wider" 
                         style={{ color: DESIGN.colors.textSecondary }}>
                    Search venue or address *
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
                           style={{ color: DESIGN.colors.textSecondary }} />
                    <Input
                      ref={searchInputRef}
                      defaultValue={eventData.address || eventData.location}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEventData(prev => ({ ...prev, location: value }));
                        searchLocation(value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (locationSuggestions.length > 0) {
                            handleLocationSelect(locationSuggestions[0]);
                          }
                        }
                      }}
                      onFocus={() => {
                        const value = searchInputRef.current?.value || '';
                        if (value.length >= 2) {
                          searchLocation(value);
                          setShowSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay hiding suggestions to allow click
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      placeholder="Search for a location, street, or venue..."
                      className="h-11 pl-10"
                      style={{
                        borderRadius: DESIGN.borderRadius.input,
                        borderColor: DESIGN.colors.border,
                        background: DESIGN.colors.card,
                        color: DESIGN.colors.textPrimary
                      }}
                      disabled={isSubmitting}
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin" 
                                style={{ color: DESIGN.colors.textSecondary }} />
                      </div>
                    )}
                  </div>
                  <p className="text-xs mt-1" style={{ color: DESIGN.colors.textSecondary }}>
                    Press Enter to select first result
                  </p>
                  
                  {/* Autocomplete Dropdown */}
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 overflow-hidden"
                         style={{
                           borderRadius: DESIGN.borderRadius.button,
                           border: `1px solid ${DESIGN.colors.border}`,
                           background: DESIGN.colors.card,
                           boxShadow: DESIGN.shadows.card
                         }}>
                      {locationSuggestions.map((place, index) => {
                        const formatted = formatSuggestion(place);
                        return (
                          <button
                            key={place.id || index}
                            onClick={() => handleLocationSelect(place)}
                            className={cn(
                              "w-full px-4 py-3 flex items-start gap-3 transition-colors text-left",
                              index < locationSuggestions.length - 1 && "border-b",
                              "hover:bg-primary/5"
                            )}
                            style={{ 
                              borderBottomColor: `${DESIGN.colors.border}50`,
                              color: DESIGN.colors.textPrimary
                            }}
                          >
                            <span className="mt-0.5 flex-shrink-0" style={{ color: DESIGN.colors.textSecondary }}>
                              {formatted.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {formatted.primary}
                              </div>
                              <div className="text-sm truncate" style={{ color: DESIGN.colors.textSecondary }}>
                                {formatted.secondary}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Map - Now with error handling */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[13px] font-semibold uppercase tracking-wider" 
                           style={{ color: DESIGN.colors.textSecondary }}>
                      Map View
                    </label>
                    <div className="flex gap-2">
                      <button 
                        className="text-xs hover:text-primary"
                        style={{ color: DESIGN.colors.textSecondary }}
                        onClick={() => {
                          if (map1.current) {
                            map1.current.flyTo({
                              center: [eventData.coordinates.lng, eventData.coordinates.lat],
                              zoom: 14
                            });
                          }
                        }}
                      >
                        Recenter
                      </button>
                      {mapError && (
                        <button 
                          className="text-xs hover:text-red-600"
                          style={{ color: '#EF4444' }}
                          onClick={() => {
                            if (mapContainer1.current && map1.current) {
                              map1.current.remove();
                              map1.current = null;
                              mapsInitialized.current.map1 = false;
                              setMapError(null);
                              initializeMap(mapContainer1.current, 1);
                            }
                          }}
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="relative w-full h-80 overflow-hidden border"
                       style={{
                         borderRadius: DESIGN.borderRadius.card,
                         borderColor: DESIGN.colors.border,
                         background: `${DESIGN.colors.primary}10`
                       }}>
                    {mapError ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4"
                           style={{ background: DESIGN.colors.card }}>
                        <Map className="w-12 h-12 mb-3" style={{ color: '#EF4444' }} />
                        <p className="text-sm font-medium mb-2" style={{ color: '#EF4444' }}>{mapError}</p>
                        <p className="text-xs text-center mb-4" style={{ color: DESIGN.colors.textSecondary }}>
                          Check your internet connection and Mapbox token
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (mapContainer1.current) {
                              setMapError(null);
                              mapsInitialized.current.map1 = false;
                              initializeMap(mapContainer1.current, 1);
                            }
                          }}
                          style={{ borderRadius: DESIGN.borderRadius.button }}
                        >
                          <Loader2 className="w-3 h-3 mr-2" />
                          Reload Map
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div
                          ref={mapContainer1}
                          className="w-full h-full"
                          style={{ 
                            minHeight: '320px',
                            display: step === 3 ? 'block' : 'none' 
                          }}
                        />
                        <div className="absolute top-3 left-3 px-3 py-1.5 text-xs border backdrop-blur-sm"
                             style={{
                               borderRadius: DESIGN.borderRadius.button,
                               background: `${DESIGN.colors.background}80`,
                               borderColor: DESIGN.colors.border,
                               color: DESIGN.colors.textPrimary
                             }}>
                          {isReverseGeocoding ? (
                            <div className="flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Getting address...
                            </div>
                          ) : (
                            "Drag marker to adjust location"
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Venue Details */}
                {selectedVenueDetails && (
                  <div className="space-y-3">
                    <label className="text-[13px] font-semibold uppercase tracking-wider" 
                           style={{ color: DESIGN.colors.textSecondary }}>
                      Venue Details
                    </label>
                    <div className="p-4"
                         style={{
                           borderRadius: DESIGN.borderRadius.card,
                           border: `1px solid ${DESIGN.colors.border}`,
                           background: DESIGN.colors.card
                         }}>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: eventData.themeColor }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: DESIGN.colors.textPrimary }}>
                            {selectedVenueDetails.name}
                          </p>
                          <p className="text-xs truncate" style={{ color: DESIGN.colors.textSecondary }}>
                            {selectedVenueDetails.address}
                          </p>
                        </div>
                        <button 
                          className="text-xs hover:underline"
                          style={{ color: eventData.themeColor }}
                          onClick={() => {
                            searchInputRef.current?.focus();
                            setShowSuggestions(true);
                          }}
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Check-In Radius */}
            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-[22px] font-bold mb-1" style={{ color: DESIGN.colors.textPrimary }}>
                    Check-In Radius
                  </h3>
                  <p className="text-[14px] mb-4" style={{ color: DESIGN.colors.textSecondary }}>
                    Set how close attendees must be to check in
                  </p>
                </div>

                {/* Map with Radius */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[13px] font-semibold uppercase tracking-wider" 
                           style={{ color: DESIGN.colors.textSecondary }}>
                      Geofence Area
                    </label>
                    <div className="flex gap-2">
                      <span className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                        Drag marker to adjust location
                      </span>
                      {mapError && (
                        <button 
                          className="text-xs hover:text-red-600"
                          style={{ color: '#EF4444' }}
                          onClick={() => {
                            if (mapContainer2.current && map2.current) {
                              map2.current.remove();
                              map2.current = null;
                              mapsInitialized.current.map2 = false;
                              setMapError(null);
                              initializeMap(mapContainer2.current, 2);
                            }
                          }}
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="relative w-full h-96 overflow-hidden border"
                       style={{
                         borderRadius: DESIGN.borderRadius.card,
                         borderColor: DESIGN.colors.border,
                         background: `${DESIGN.colors.primary}10`
                       }}>
                    {mapError ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4"
                           style={{ background: DESIGN.colors.card }}>
                        <Map className="w-12 h-12 mb-3" style={{ color: '#EF4444' }} />
                        <p className="text-sm font-medium mb-2" style={{ color: '#EF4444' }}>{mapError}</p>
                        <p className="text-xs text-center mb-4" style={{ color: DESIGN.colors.textSecondary }}>
                          Check your internet connection and Mapbox token
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (mapContainer2.current) {
                              setMapError(null);
                              mapsInitialized.current.map2 = false;
                              initializeMap(mapContainer2.current, 2);
                            }
                          }}
                          style={{ borderRadius: DESIGN.borderRadius.button }}
                        >
                          <Loader2 className="w-3 h-3 mr-2" />
                          Reload Map
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div
                          ref={mapContainer2}
                          className="w-full h-full"
                          style={{ 
                            minHeight: '320px',
                            display: step === 4 ? 'block' : 'none' 
                          }}
                        />
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 text-sm border backdrop-blur-sm flex items-center gap-2"
                             style={{
                               borderRadius: DESIGN.borderRadius.button,
                               background: `${DESIGN.colors.background}80`,
                               borderColor: DESIGN.colors.border,
                               color: eventData.themeColor
                             }}>
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: eventData.themeColor }}
                          />
                          <span className="font-medium">
                            {eventData.geofenceRadius}m radius
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Radius Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[13px] font-semibold uppercase tracking-wider" 
                           style={{ color: DESIGN.colors.textSecondary }}>
                      Adjust Radius
                    </label>
                    <span 
                      className="text-lg font-bold"
                      style={{ color: eventData.themeColor }}
                    >
                      {eventData.geofenceRadius}m
                    </span>
                  </div>
                  <Slider
                    value={[eventData.geofenceRadius]}
                    onValueChange={(value) => setEventData({ ...eventData, geofenceRadius: value[0] })}
                    min={10}
                    max={300}
                    step={10}
                    className="w-full"
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-between text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                    <span>10m</span>
                    <span>150m</span>
                    <span>300m</span>
                  </div>
                </div>

                {/* Helper Text */}
                <div className="p-4"
                     style={{
                       borderRadius: DESIGN.borderRadius.card,
                       border: `1px solid ${DESIGN.colors.border}`,
                       background: DESIGN.colors.card
                     }}>
                  <p className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>
                    💡 <span className="font-medium" style={{ color: DESIGN.colors.textPrimary }}>Recommended:</span> 50-100m for most venues
                  </p>
                  <div className="mt-2 text-xs space-y-1" style={{ color: DESIGN.colors.textSecondary }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: '#10B981' }}></div>
                      <span>10-50m: High precision (small venues)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: '#3B82F6' }}></div>
                      <span>50-100m: Standard events</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: '#8B5CF6' }}></div>
                      <span>100-300m: Large venues & outdoor events</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review & Publish */}
            {step === 5 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-[22px] font-bold mb-1" style={{ color: DESIGN.colors.textPrimary }}>
                    Review Your Event
                  </h3>
                  <p className="text-[14px] mb-4" style={{ color: DESIGN.colors.textSecondary }}>
                    Check everything before publishing
                  </p>
                </div>

                {/* Event Preview */}
                <div className="space-y-3">
                  <label className="text-[13px] font-semibold uppercase tracking-wider" 
                         style={{ color: DESIGN.colors.textSecondary }}>
                    Event Preview
                  </label>
                  <div className="overflow-hidden"
                       style={{
                         borderRadius: DESIGN.borderRadius.card,
                         border: `1px solid ${DESIGN.colors.border}`,
                         background: DESIGN.colors.card
                       }}>
                    {/* Event Card Preview */}
                    <div className="p-4 border-b" style={{ borderBottomColor: DESIGN.colors.border }}>
                      <p className="text-sm font-medium mb-2" style={{ color: DESIGN.colors.textPrimary }}>
                        Event Card
                      </p>
                      <div className="overflow-hidden" style={{ borderRadius: DESIGN.borderRadius.button, border: `1px solid ${DESIGN.colors.border}` }}>
                        <div className="h-32 flex items-center justify-center relative overflow-hidden"
                             style={{ background: `linear-gradient(to right, ${eventData.themeColor}10, ${eventData.themeColor}5)` }}>
                          {/* Always show the primary image on event card */}
                          {imageFiles.length > 0 ? (
                            <img
                              src={eventData.images[0]}
                              alt="Event preview"
                              className="w-full h-full object-cover"
                              style={{
                                objectPosition: `${imagePosition.x}% ${imagePosition.y}%`,
                                transform: `scale(${imageZoom / 100})`
                              }}
                            />
                          ) : (
                            <Image className="w-12 h-12" style={{ color: DESIGN.colors.textSecondary }} />
                          )}
                        </div>
                        <div className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium truncate" style={{ color: DESIGN.colors.textPrimary }}>
                                {eventData.name}
                              </p>
                              <p className="text-sm truncate" style={{ color: DESIGN.colors.textSecondary }}>
                                {eventData.date} at {eventData.time}
                              </p>
                            </div>
                            <span 
                              className="px-2 py-1 text-xs rounded ml-2"
                              style={{ 
                                backgroundColor: `${eventData.themeColor}20`,
                                color: eventData.themeColor,
                                borderRadius: DESIGN.borderRadius.smallPill
                              }}
                            >
                              {eventData.category}
                            </span>
                          </div>
                          <div className="flex items-center text-sm" style={{ color: DESIGN.colors.textSecondary }}>
                            <MapPin className="w-3 h-3 mr-1" />
                            <span className="truncate">{eventData.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Event Details Preview */}
                    <div className="p-4">
                      <p className="text-sm font-medium mb-2" style={{ color: DESIGN.colors.textPrimary }}>
                        Event Details Page
                      </p>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" style={{ color: DESIGN.colors.textSecondary }} />
                          <span style={{ color: DESIGN.colors.textPrimary }}>{eventData.date} at {eventData.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" style={{ color: DESIGN.colors.textSecondary }} />
                          <span style={{ color: DESIGN.colors.textPrimary }}>{eventData.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" style={{ color: DESIGN.colors.textSecondary }} />
                          <span style={{ color: DESIGN.colors.textPrimary }}>{eventData.isFree ? 'Free' : `N$${eventData.price}`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Map className="w-4 h-4" style={{ color: DESIGN.colors.textSecondary }} />
                          <span style={{ color: DESIGN.colors.textPrimary }}>Check-in radius: {eventData.geofenceRadius}m</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {eventData.mediaType === 'video' ? <Video className="w-4 h-4" style={{ color: DESIGN.colors.textSecondary }} /> : <Grid3x3 className="w-4 h-4" style={{ color: DESIGN.colors.textSecondary }} />}
                          <span style={{ color: DESIGN.colors.textPrimary }}>
                            {eventData.mediaType === 'video' 
                              ? 'Video will auto-play muted' 
                              : `Carousel with ${imageFiles.length} image${imageFiles.length !== 1 ? 's' : ''}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit Sections */}
                <div className="space-y-3">
                  <label className="text-[13px] font-semibold uppercase tracking-wider" 
                         style={{ color: DESIGN.colors.textSecondary }}>
                    Event Information
                  </label>
                  <div className="overflow-hidden" style={{ borderRadius: DESIGN.borderRadius.card, border: `1px solid ${DESIGN.colors.border}` }}>
                    {/* Basic Info */}
                    <div className="p-4 border-b" style={{ borderBottomColor: DESIGN.colors.border }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" style={{ color: DESIGN.colors.textSecondary }} />
                          <span className="text-sm font-medium" style={{ color: DESIGN.colors.textPrimary }}>Basic Info</span>
                        </div>
                        <button 
                          onClick={() => setStep(1)}
                          className="text-xs flex items-center gap-1"
                          style={{ color: eventData.themeColor }}
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p><span style={{ color: DESIGN.colors.textSecondary }}>Name:</span> <span style={{ color: DESIGN.colors.textPrimary }}>{eventData.name}</span></p>
                        <p><span style={{ color: DESIGN.colors.textSecondary }}>Category:</span> <span style={{ color: DESIGN.colors.textPrimary }}>{eventData.category}</span></p>
                        <p><span style={{ color: DESIGN.colors.textSecondary }}>Date:</span> <span style={{ color: DESIGN.colors.textPrimary }}>{eventData.date} at {eventData.time}</span></p>
                        <p><span style={{ color: DESIGN.colors.textSecondary }}>Price:</span> <span style={{ color: DESIGN.colors.textPrimary }}>{eventData.isFree ? 'Free' : `N$${eventData.price}`}</span></p>
                      </div>
                    </div>
                    
                    {/* Media */}
                    <div className="p-4 border-b" style={{ borderBottomColor: DESIGN.colors.border }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {eventData.mediaType === 'video' ? <Video className="w-4 h-4" style={{ color: DESIGN.colors.textSecondary }} /> : <Camera className="w-4 h-4" style={{ color: DESIGN.colors.textSecondary }} />}
                          <span className="text-sm font-medium" style={{ color: DESIGN.colors.textPrimary }}>Media</span>
                        </div>
                        <button 
                          onClick={() => setStep(2)}
                          className="text-xs flex items-center gap-1"
                          style={{ color: eventData.themeColor }}
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p><span style={{ color: DESIGN.colors.textSecondary }}>Type:</span> <span style={{ color: DESIGN.colors.textPrimary }}>{eventData.mediaType === 'video' ? 'Video' : 'Image Carousel'}</span></p>
                        <p><span style={{ color: DESIGN.colors.textSecondary }}>Primary Photo:</span> <span style={{ color: DESIGN.colors.textPrimary }}>{imageFiles.length > 0 ? 'Uploaded' : 'Required'}</span></p>
                        {eventData.mediaType === 'video' ? (
                          <p><span style={{ color: DESIGN.colors.textSecondary }}>Video:</span> <span style={{ color: DESIGN.colors.textPrimary }}>{videoFile ? 'Uploaded (auto-plays muted)' : 'Required'}</span></p>
                        ) : (
                          <p><span style={{ color: DESIGN.colors.textSecondary }}>Additional Photos:</span> <span style={{ color: DESIGN.colors.textPrimary }}>{imageFiles.length - 1}</span></p>
                        )}
                      </div>
                    </div>
                    
                    {/* Location */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapIcon className="w-4 h-4" style={{ color: DESIGN.colors.textSecondary }} />
                          <span className="text-sm font-medium" style={{ color: DESIGN.colors.textPrimary }}>Location</span>
                        </div>
                        <button 
                          onClick={() => setStep(3)}
                          className="text-xs flex items-center gap-1"
                          style={{ color: eventData.themeColor }}
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p><span style={{ color: DESIGN.colors.textSecondary }}>Venue:</span> <span style={{ color: DESIGN.colors.textPrimary }}>{eventData.location}</span></p>
                        <p><span style={{ color: DESIGN.colors.textSecondary }}>Check-in radius:</span> <span style={{ color: DESIGN.colors.textPrimary }}>{eventData.geofenceRadius}m</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Success */}
            {step === 6 && createdEvent && (
              <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center mb-6 animate-scale-in"
                  style={{ backgroundColor: `${eventData.themeColor}20` }}
                >
                  <Check className="w-12 h-12" style={{ color: eventData.themeColor }} />
                </div>
                <h3 className="text-[28px] font-bold mb-2 text-center" style={{ color: DESIGN.colors.textPrimary }}>
                  Event Created Successfully!
                </h3>
                <p className="text-center mb-8 max-w-md" style={{ color: DESIGN.colors.textSecondary }}>
                  Your event "<span className="font-semibold" style={{ color: DESIGN.colors.textPrimary }}>{createdEvent.name}</span>" is now live! Share the code below so attendees can check in.
                </p>

                <div className="w-full max-w-sm flex flex-col items-center justify-center mb-6 border-2 p-6"
                     style={{
                       borderRadius: DESIGN.borderRadius.card,
                       borderColor: DESIGN.colors.border,
                       background: DESIGN.colors.card
                     }}>
                  <div className="text-center mb-6">
                    <p className="text-sm font-medium mb-2" style={{ color: eventData.themeColor }}>
                      Event Check-in Code
                    </p>
                    <p className="text-3xl font-mono font-bold tracking-widest p-4 rounded-lg"
                       style={{
                         background: DESIGN.colors.background,
                         color: DESIGN.colors.textPrimary
                       }}>
                      {createdEvent.qrCode}
                    </p>
                  </div>
                  <div className="w-56 h-56 p-4 border rounded-xl flex items-center justify-center"
                       style={{
                         borderRadius: DESIGN.borderRadius.card,
                         borderColor: DESIGN.colors.border,
                         background: DESIGN.colors.textPrimary
                       }}>
                    <div className="w-full h-full rounded-lg flex items-center justify-center"
                         style={{ background: `${DESIGN.colors.textSecondary}10` }}>
                      <QrCode className="w-44 h-44" style={{ color: DESIGN.colors.background }} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 w-full max-w-sm">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-12 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                    onClick={copyCode}
                    style={{ borderRadius: DESIGN.borderRadius.button }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 h-12 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                    onClick={handleDownloadQR}
                    style={{ borderRadius: DESIGN.borderRadius.button }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Save QR
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Redesigned to be compact */}
        {step < 6 && (
          <div className="border-t p-4 flex-shrink-0" style={{ borderTopColor: DESIGN.colors.border, background: DESIGN.colors.background }}>
            <div className="flex gap-3">
              {step > 1 && (
                <Button 
                  variant="outline" 
                  className="flex-1 h-11"
                  onClick={() => setStep(step - 1)}
                  disabled={isSubmitting}
                  style={{ borderRadius: DESIGN.borderRadius.button }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
              {step < 5 ? (
                <Button
                  className="flex-1 h-11 font-medium"
                  onClick={() => setStep(step + 1)}
                  disabled={
                    isSubmitting ||
                    (step === 1 && !isStep1Valid) ||
                    (step === 2 && imageFiles.length === 0) ||
                    (step === 2 && eventData.mediaType === 'video' && !videoFile) ||
                    (step === 3 && !isStep3Valid)
                  }
                  style={{ 
                    backgroundColor: eventData.themeColor,
                    borderColor: eventData.themeColor,
                    borderRadius: DESIGN.borderRadius.button,
                    color: DESIGN.colors.background
                  }}
                >
                  {step === 4 ? 'Review Event' : 'Next'}
                  {step !== 4 && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              ) : (
                <Button
                  className="flex-1 h-11 font-medium"
                  onClick={handlePublish}
                  disabled={isSubmitting}
                  style={{ 
                    backgroundColor: eventData.themeColor,
                    borderColor: eventData.themeColor,
                    borderRadius: DESIGN.borderRadius.button,
                    color: DESIGN.colors.background
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Create Event
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="border-t p-4 flex-shrink-0" style={{ borderTopColor: DESIGN.colors.border, background: DESIGN.colors.background }}>
            <Button 
              className="w-full h-11 font-medium" 
              onClick={onClose}
              style={{ 
                backgroundColor: eventData.themeColor,
                borderColor: eventData.themeColor,
                borderRadius: DESIGN.borderRadius.button,
                color: DESIGN.colors.background
              }}
            >
              <Check className="w-4 h-4 mr-2" />
              Go to Event Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );      
}
