import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, ArrowRight, ArrowLeft, MapPin, Check, QrCode, Copy, Download, 
  Upload, Image, Video, Map, Loader2, Search, Calendar, Clock, 
  DollarSign, Palette, ChevronRight, Edit2, Music, Cpu, Users, 
  Brush, Globe, Camera, Map as MapIcon, Radio, Eye, Utensils,
  Coffee, Beer, Hotel, ShoppingBag, Trees, School, Hospital,
  Building, Navigation, Home, Landmark, Target, Maximize2, Move
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

// Apply Design Constants
const DESIGN = {
  colors: {
    primary: '#8B5CF6',
    lavenderLight: '#E9D5FF',
    accentPink: '#FFB8E6',
    background: '#1A1A1A',
    card: '#2D2D2D',
    textPrimary: '#FFFFFF',
    textSecondary: '#B8B8B8'
  },
  borderRadius: {
    card: '24px',
    button: '12px',
    roundButton: '50%',
    small: '8px'
  },
  shadows: {
    card: '0 8px 32px rgba(0, 0, 0, 0.4)',
    button: '0 4px 16px rgba(0, 0, 0, 0.3)'
  }
};

// Namibia-specific location database (partial - you'll want to expand this)
const NAMIBIA_LOCATIONS = {
  cities: [
    'Windhoek', 'Swakopmund', 'Walvis Bay', 'Oshakati', 'Rundu', 
    'Katima Mulilo', 'Grootfontein', 'Rehoboth', 'Keetmanshoop', 'Lüderitz'
  ],
  regions: [
    'Khomas', 'Erongo', 'Hardap', 'Karas', 'Kunene',
    'Ohangwena', 'Omaheke', 'Omusati', 'Oshana', 'Oshikoto', 'Otjozondjupa', 'Zambezi'
  ],
  landmarks: [
    'Sossusvlei', 'Etosha National Park', 'Fish River Canyon', 'Skeleton Coast',
    'Brandberg Mountain', 'Spitzkoppe', 'Waterberg Plateau', 'Caprivi Strip'
  ]
};

// Initialize Mapbox with token
const MAPBOX_TOKEN = 'pk.eyJ1IjoianVzYSIsImEiOiJjbWpjanh5amEwbDEwM2dzOXVhbjZ5dzcwIn0.stWdbPHCrf9sKrRJRmShlg';
mapboxgl.accessToken = MAPBOX_TOKEN;

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
    coordinates: { lat: -22.5609, lng: 17.0658 }, // Windhoek center
    geofenceRadius: 50,
    images: [] as string[],
    videos: [] as string[],
    themeColor: '#8B5CF6',
    isFree: true,
  });
  const [createdEvent, setCreatedEvent] = useState<Event | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
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
  const [isDraggingPin, setIsDraggingPin] = useState(false);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 }); // Center position for image cropping

  // Map references for both steps
  const mapContainer1 = useRef<HTMLDivElement>(null);
  const mapContainer2 = useRef<HTMLDivElement>(null);
  const map1 = useRef<mapboxgl.Map | null>(null);
  const map2 = useRef<mapboxgl.Map | null>(null);
  const marker1 = useRef<mapboxgl.Marker | null>(null);
  const marker2 = useRef<mapboxgl.Marker | null>(null);
  
  // File inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const primaryPhotoRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  // UI refs
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const imagePreviewRef = useRef<HTMLDivElement>(null);

  // User's location for proximity bias
  const [userLocation, setUserLocation] = useState({ lat: -22.5609, lng: 17.0658 });

  // Initialize user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Default to Windhoek if permission denied
          setUserLocation({ lat: -22.5609, lng: 17.0658 });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Cleanup URLs
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
        themeColor: '#8B5CF6',
        isFree: true,
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
      setIsDraggingPin(false);
      setImagePosition({ x: 50, y: 50 });
    }
  }, [isOpen]);

  // Cleanup maps when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (map1.current) {
        try { map1.current.remove(); } catch (error) { console.error('Error removing map1:', error); }
        map1.current = null;
        marker1.current = null;
      }
      if (map2.current) {
        try { map2.current.remove(); } catch (error) { console.error('Error removing map2:', error); }
        map2.current = null;
        marker2.current = null;
      }
    }
  }, [isOpen]);

  // Initialize or reuse map for step 3
  useEffect(() => {
    if (step === 3 && isOpen) {
      setTimeout(() => {
        if (mapContainer1.current) {
          initializeOrUpdateMap(mapContainer1.current, 1);
        }
      }, 100);
    }
  }, [step, isOpen]);

  // Initialize or reuse map for step 4
  useEffect(() => {
    if (step === 4 && isOpen) {
      setTimeout(() => {
        if (mapContainer2.current) {
          initializeOrUpdateMap(mapContainer2.current, 2);
        }
      }, 100);
    }
  }, [step, isOpen]);

  const initializeOrUpdateMap = useCallback(async (container: HTMLDivElement, mapNumber: 1 | 2) => {
    if (!container) return;
    
    try {
      setMapError(null);
      container.style.minHeight = '320px';
      
      const currentMap = mapNumber === 1 ? map1 : map2;
      const currentMarker = mapNumber === 1 ? marker1 : marker2;
      
      if (!currentMap.current) {
        // Create new map
        const mapInstance = new mapboxgl.Map({
          container,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [eventData.coordinates.lng, eventData.coordinates.lat],
          zoom: 14,
          attributionControl: false,
          preserveDrawingBuffer: true,
        });

        mapInstance.on('error', (e) => {
          console.error('Mapbox error:', e);
          setMapError('Map failed to load. Please refresh.');
        });

        await new Promise<void>((resolve) => {
          mapInstance.on('load', () => {
            // Add marker
            currentMarker.current = new mapboxgl.Marker({ 
              color: eventData.themeColor,
              draggable: true 
            })
              .setLngLat([eventData.coordinates.lng, eventData.coordinates.lat])
              .addTo(mapInstance);

            // Marker drag handlers
            currentMarker.current.on('dragstart', () => setIsDraggingPin(true));
            currentMarker.current.on('dragend', () => {
              setIsDraggingPin(false);
              const lngLat = currentMarker.current!.getLngLat();
              setEventData(prev => ({ 
                ...prev, 
                coordinates: { lat: lngLat.lat, lng: lngLat.lng } 
              }));
              reverseGeocode(lngLat.lng, lngLat.lat);
            });

            // Click to set location
            mapInstance.on('click', (e) => {
              const { lng, lat } = e.lngLat;
              setEventData(prev => ({ ...prev, coordinates: { lat, lng } }));
              if (currentMarker.current) {
                currentMarker.current.setLngLat([lng, lat]);
              }
              reverseGeocode(lng, lat);
            });

            // Add controls
            mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
            
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
              if (currentMarker.current) {
                currentMarker.current.setLngLat([longitude, latitude]);
              }
              reverseGeocode(longitude, latitude);
            });
            
            mapInstance.addControl(geolocateControl, 'top-right');
            
            // Add geofence circle for step 4
            if (mapNumber === 2) {
              updateGeofenceCircle(mapInstance);
            }
            
            currentMap.current = mapInstance;
            resolve();
          });
        });
      } else {
        // Update existing map
        currentMap.current.resize();
        currentMap.current.flyTo({
          center: [eventData.coordinates.lng, eventData.coordinates.lat],
          zoom: 14,
          duration: 500
        });
        
        if (currentMarker.current) {
          currentMarker.current.setLngLat([eventData.coordinates.lng, eventData.coordinates.lat]);
          currentMarker.current.setDraggable(true);
        }
        
        if (mapNumber === 2) {
          updateGeofenceCircle(currentMap.current);
        }
      }
    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError('Failed to load map.');
    }
  }, [eventData.coordinates, eventData.themeColor]);

  // Update geofence circle
  const updateGeofenceCircle = useCallback((mapInstance: mapboxgl.Map) => {
    if (!mapInstance.loaded()) return;

    const { lat, lng } = eventData.coordinates;
    const radiusInKm = eventData.geofenceRadius / 1000;
    
    const points = 64;
    const coords: [number, number][] = [];
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const dx = radiusInKm * Math.cos(angle) / 111.32;
      const dy = radiusInKm * Math.sin(angle) / (111.32 * Math.cos(lat * Math.PI / 180));
      coords.push([lng + dy, lat + dx]);
    }
    coords.push(coords[0]);

    const sourceId = 'geofence-circle';
    const fillLayerId = 'geofence-fill';
    const lineLayerId = 'geofence-line';
    
    try {
      if (mapInstance.getSource(sourceId)) {
        (mapInstance.getSource(sourceId) as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [coords] },
        });
      } else {
        mapInstance.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
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
    } catch (error) {
      console.error('Error updating geofence circle:', error);
    }
  }, [eventData.geofenceRadius, eventData.coordinates, eventData.themeColor]);

  // Enhanced reverse geocoding for Namibia
  const reverseGeocode = async (lng: number, lat: number) => {
    setIsReverseGeocoding(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
        `access_token=${MAPBOX_TOKEN}&` +
        `language=en&` +
        `types=address,poi,place,neighborhood,locality,region&` +
        `limit=1&` +
        `country=NA` // Focus on Namibia
      );
      
      if (!response.ok) throw new Error(`Geocoding error: ${response.status}`);
      
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const place = data.features[0];
        
        // Build structured address
        const context = place.context || [];
        const street = place.properties?.address || '';
        const neighborhood = context.find((c: any) => c.id.includes('neighborhood'))?.text || '';
        const locality = context.find((c: any) => c.id.includes('place'))?.text || '';
        const region = context.find((c: any) => c.id.includes('region'))?.text || '';
        const country = context.find((c: any) => c.id.includes('country'))?.text || '';
        
        // Namibia-specific formatting
        let fullAddress = '';
        if (street) fullAddress += `${street}, `;
        if (neighborhood && neighborhood !== locality) fullAddress += `${neighborhood}, `;
        if (locality) fullAddress += `${locality}, `;
        if (region) fullAddress += `${region}, `;
        if (country) fullAddress += country;
        
        // Clean up trailing comma
        fullAddress = fullAddress.replace(/, $/, '');
        
        setEventData(prev => ({
          ...prev,
          location: place.text || locality || '',
          address: fullAddress || place.place_name || '',
          streetName: street || place.text || '',
        }));
        
        setSelectedVenueDetails({
          name: place.text || locality || 'Selected Location',
          address: fullAddress || place.place_name || '',
        });
        
        if (searchInputRef.current) {
          searchInputRef.current.value = fullAddress || place.text || '';
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

  // Enhanced Namibia-focused search
  const searchLocation = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setLocationSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      
      setIsSearching(true);
      
      try {
        const proximity = `${userLocation.lng},${userLocation.lat}`;
        
        // First, try Mapbox API with Namibia focus
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
          `access_token=${MAPBOX_TOKEN}&` +
          `proximity=${proximity}&` +
          `language=en&` +
          `limit=10&` +
          `types=country,region,district,place,locality,neighborhood,address,poi&` +
          `autocomplete=true&` +
          `fuzzy=true&` +
          `country=NA` // Namibia only
        );
        
        if (!response.ok) throw new Error(`Search API error: ${response.status}`);
        
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          // Sort by relevance and Namibia preference
          const sortedSuggestions = data.features
            .filter((f: any) => {
              // Filter out non-Namibia results that might sneak in
              const country = f.context?.find((c: any) => c.id.includes('country'))?.text;
              return !country || country === 'Namibia';
            })
            .sort((a: any, b: any) => {
              // Prioritize Namibia results
              const aInNamibia = a.place_name?.includes('Namibia');
              const bInNamibia = b.place_name?.includes('Namibia');
              if (aInNamibia && !bInNamibia) return -1;
              if (!aInNamibia && bInNamibia) return 1;
              return b.relevance - a.relevance;
            })
            .slice(0, 5);
          
          setLocationSuggestions(sortedSuggestions);
          setShowSuggestions(true);
        } else {
          // If no results from Mapbox, show local Namibia suggestions
          const localMatches = getLocalNamibiaSuggestions(query);
          setLocationSuggestions(localMatches);
          setShowSuggestions(localMatches.length > 0);
        }
      } catch (error) {
        console.error('Search error:', error);
        // Fallback to local suggestions
        const localMatches = getLocalNamibiaSuggestions(query);
        setLocationSuggestions(localMatches);
        setShowSuggestions(localMatches.length > 0);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [userLocation]
  );

  // Local Namibia suggestions fallback
  const getLocalNamibiaSuggestions = (query: string) => {
    const queryLower = query.toLowerCase();
    const matches: any[] = [];
    
    // Check cities
    NAMIBIA_LOCATIONS.cities.forEach(city => {
      if (city.toLowerCase().includes(queryLower)) {
        matches.push({
          id: `city-${city}`,
          text: city,
          place_name: `${city}, Namibia`,
          center: getCityCoordinates(city),
          place_type: ['place'],
          properties: { category: 'city' }
        });
      }
    });
    
    // Check regions
    NAMIBIA_LOCATIONS.regions.forEach(region => {
      if (region.toLowerCase().includes(queryLower)) {
        matches.push({
          id: `region-${region}`,
          text: region,
          place_name: `${region} Region, Namibia`,
          center: getRegionCoordinates(region),
          place_type: ['region'],
          properties: { category: 'region' }
        });
      }
    });
    
    // Check landmarks
    NAMIBIA_LOCATIONS.landmarks.forEach(landmark => {
      if (landmark.toLowerCase().includes(queryLower)) {
        matches.push({
          id: `landmark-${landmark}`,
          text: landmark,
          place_name: `${landmark}, Namibia`,
          center: getLandmarkCoordinates(landmark),
          place_type: ['poi'],
          properties: { category: 'landmark' }
        });
      }
    });
    
    return matches.slice(0, 5);
  };

  // Helper function to get approximate coordinates
  const getCityCoordinates = (city: string): [number, number] => {
    const coordinates: Record<string, [number, number]> = {
      'Windhoek': [17.0658, -22.5609],
      'Swakopmund': [14.5333, -22.6833],
      'Walvis Bay': [14.5053, -22.9575],
      'Oshakati': [15.6883, -17.7833],
      'Rundu': [19.7667, -17.9167],
      'Katima Mulilo': [24.2667, -17.5000],
      'Grootfontein': [18.1167, -19.5667],
      'Rehoboth': [17.0833, -23.3167],
      'Keetmanshoop': [18.1333, -26.5833],
      'Lüderitz': [15.1556, -26.6481]
    };
    return coordinates[city] || [17.0658, -22.5609];
  };

  const getRegionCoordinates = (region: string): [number, number] => {
    // Approximate region centers
    return [17.0658, -22.5609]; // Default to Windhoek
  };

  const getLandmarkCoordinates = (landmark: string): [number, number] => {
    const coordinates: Record<string, [number, number]> = {
      'Sossusvlei': [15.8000, -24.7333],
      'Etosha National Park': [15.8942, -18.8556],
      'Fish River Canyon': [20.1667, -27.5833],
      'Skeleton Coast': [12.0000, -21.0000],
      'Brandberg Mountain': [14.5833, -21.1167],
      'Spitzkoppe': [15.1833, -21.8333],
      'Waterberg Plateau': [17.2333, -20.5000],
      'Caprivi Strip': [23.5000, -17.5000]
    };
    return coordinates[landmark] || [17.0658, -22.5609];
  };

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
    const primaryText = feature.text;
    const secondaryText = feature.place_name.replace(feature.text + ', ', '');
    const icon = getSuggestionIcon(feature.place_type, feature.properties?.category);
    
    return {
      icon,
      primary: primaryText,
      secondary: secondaryText,
      coordinates: feature.center,
      fullData: feature
    };
  };

  const handleLocationSelect = (selectedFeature: any) => {
    const [lng, lat] = selectedFeature.center;
    const venueName = selectedFeature.text || '';
    const address = selectedFeature.place_name || '';
    
    setEventData(prev => ({
      ...prev,
      coordinates: { lat, lng },
      location: venueName,
      address: address,
      streetName: selectedFeature.properties?.address || venueName,
    }));
    
    setSelectedVenueDetails({
      name: venueName,
      address: address,
    });
    
    setLocationSuggestions([]);
    setShowSuggestions(false);
    
    if (searchInputRef.current) {
      searchInputRef.current.value = address;
    }
    
    // Update both maps
    if (map1.current) {
      map1.current.flyTo({
        center: [lng, lat],
        zoom: 15,
        duration: 1500
      });
      if (marker1.current) {
        marker1.current.setLngLat([lng, lat]);
      }
    }
    if (map2.current) {
      map2.current.flyTo({
        center: [lng, lat],
        zoom: 15,
        duration: 1500
      });
      if (marker2.current) {
        marker2.current.setLngLat([lng, lat]);
      }
      updateGeofenceCircle(map2.current);
    }
  };

  // Handle Enter key on location search
  const handleLocationKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchInputRef.current?.value) {
      e.preventDefault();
      if (locationSuggestions.length > 0) {
        handleLocationSelect(locationSuggestions[0]);
      } else {
        // Perform search with current input
        searchLocation(searchInputRef.current.value);
      }
    }
  };

  // Image position adjustment handlers
  const handleImagePositionStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const updatePosition = (clientX: number, clientY: number) => {
      if (!imagePreviewRef.current) return;
      
      const rect = imagePreviewRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      
      setImagePosition({
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y))
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      updatePosition(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        updatePosition(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const stopDragging = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', stopDragging);
      document.removeEventListener('touchend', stopDragging);
    };

    if ('touches' in e && e.touches[0]) {
      updatePosition(e.touches[0].clientX, e.touches[0].clientY);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', stopDragging);
    } else {
      updatePosition(e.clientX, e.clientY);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', stopDragging);
    }
  };

  // Image upload handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).slice(0, 5 - imageFiles.length);
      setImageFiles(prev => [...prev, ...newImages]);
      
      const imageUrls = newImages.map(file => URL.createObjectURL(file));
      setEventData(prev => ({
        ...prev,
        images: [...prev.images, ...imageUrls]
      }));
      
      e.target.value = '';
    }
  };

  const handlePrimaryPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      if (imageFiles.length === 0) {
        const newFile = files[0];
        setImageFiles([newFile]);
        setEventData(prev => ({
          ...prev,
          images: [URL.createObjectURL(newFile)]
        }));
      }
      e.target.value = '';
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const newVideo = files[0];
      setVideoFile(newVideo);
      
      const videoUrl = URL.createObjectURL(newVideo);
      setEventData(prev => ({
        ...prev,
        videos: [videoUrl]
      }));
      
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
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
      videos: []
    }));
    setVideoFile(null);
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
      const price = eventData.isFree ? 0 : parseFloat(eventData.price) || 0;
      
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
        videos: eventData.videos,
        tags: [eventData.category],
        isFeatured: user?.subscription?.tier === 'max',
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
  const today = new Date().toISOString().split('T')[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}>
      <div 
        ref={modalRef}
        className="flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden"
        style={{ 
          background: DESIGN.colors.background,
          borderRadius: DESIGN.borderRadius.card,
          boxShadow: DESIGN.shadows.card,
          border: `1px solid ${DESIGN.colors.card}`
        }}
      >
        {/* Header */}
        <div className="border-b" style={{ borderColor: DESIGN.colors.card }}>
          <div className="flex items-center justify-between px-6 h-14">
            <h2 className="text-xl font-semibold" style={{ color: DESIGN.colors.textPrimary }}>
              Create Event
            </h2>
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ 
                color: DESIGN.colors.textSecondary,
                borderRadius: DESIGN.borderRadius.roundButton
              }}
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {step < 6 && (
            <>
              <div className="flex justify-center items-center h-10">
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className="flex items-center">
                      <div
                        className={cn(
                          'transition-all duration-300',
                          s < step ? 'bg-primary' : 
                          s === step ? 'bg-primary' : 'bg-muted'
                        )}
                        style={{ 
                          width: s === step ? '12px' : '8px',
                          height: s === step ? '12px' : '8px',
                          borderRadius: DESIGN.borderRadius.roundButton
                        }}
                      />
                      {s < 5 && (
                        <div className={cn(
                          'w-3 h-0.5 mx-1 transition-colors duration-300',
                          s < step ? 'bg-primary' : 'bg-muted'
                        )} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-center items-center h-8 pb-2">
                <span className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>
                  {stepTitles[step - 1]}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: DESIGN.colors.textPrimary }}>
                    Event Details
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: DESIGN.colors.textPrimary }}>
                      Event Name *
                    </label>
                    <div className="relative">
                      <Input
                        value={eventData.name}
                        onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
                        placeholder="Summer Music Festival"
                        className="h-11"
                        style={{ 
                          borderRadius: DESIGN.borderRadius.button,
                          borderColor: DESIGN.colors.card,
                          background: DESIGN.colors.card,
                          color: DESIGN.colors.textPrimary
                        }}
                        disabled={isSubmitting}
                        maxLength={50}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                        {50 - eventData.name.length}
                      </div>
                    </div>
                    <p className="text-xs mt-1" style={{ color: DESIGN.colors.textSecondary }}>
                      {50 - eventData.name.length} characters remaining
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: DESIGN.colors.textPrimary }}>
                      Description *
                    </label>
                    <Textarea
                      value={eventData.description}
                      onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                      placeholder="Tell attendees what to expect..."
                      rows={4}
                      style={{ 
                        borderRadius: DESIGN.borderRadius.button,
                        borderColor: DESIGN.colors.card,
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
                    <label className="text-sm font-medium mb-2 block" style={{ color: DESIGN.colors.textPrimary }}>
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
                              'flex flex-col items-center justify-center p-3 rounded-lg border transition-all',
                              eventData.category === cat.value
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary hover:bg-primary/5'
                            )}
                            style={{ 
                              borderRadius: DESIGN.borderRadius.button,
                              borderColor: eventData.category === cat.value ? eventData.themeColor : DESIGN.colors.card
                            }}
                          >
                            <Icon className="w-5 h-5 mb-1" style={{ color: DESIGN.colors.textPrimary }} />
                            <span className="text-xs font-medium" style={{ color: DESIGN.colors.textPrimary }}>
                              {cat.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: DESIGN.colors.textPrimary }}>
                        Date *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: DESIGN.colors.textSecondary }} />
                        <Input
                          type="date"
                          value={eventData.date}
                          onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                          className="h-11 pl-10"
                          style={{ 
                            borderRadius: DESIGN.borderRadius.button,
                            borderColor: DESIGN.colors.card,
                            background: DESIGN.colors.card,
                            color: DESIGN.colors.textPrimary
                          }}
                          disabled={isSubmitting}
                          min={today}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: DESIGN.colors.textPrimary }}>
                        Time *
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: DESIGN.colors.textSecondary }} />
                        <Input
                          type="time"
                          value={eventData.time}
                          onChange={(e) => setEventData({ ...eventData, time: e.target.value })}
                          className="h-11 pl-10"
                          style={{ 
                            borderRadius: DESIGN.borderRadius.button,
                            borderColor: DESIGN.colors.card,
                            background: DESIGN.colors.card,
                            color: DESIGN.colors.textPrimary
                          }}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Theme Color */}
                  <div>
                    <label className="text-sm font-medium mb-3 block" style={{ color: DESIGN.colors.textPrimary }}>
                      Event Theme Color
                    </label>
                    {user?.subscription?.tier === 'max' ? (
                      <div className="space-y-3">
                        <div className="flex gap-2 flex-wrap">
                          {presetColors.slice(0, 10).map((color, index) => (
                            <button
                              key={index}
                              onClick={() => setEventData({ ...eventData, themeColor: color })}
                              className="w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform"
                              style={{ 
                                backgroundColor: color,
                                borderColor: eventData.themeColor === color ? color : 'transparent',
                                borderRadius: DESIGN.borderRadius.roundButton
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
                            className="w-10 h-10 cursor-pointer rounded-lg border"
                            style={{ 
                              borderColor: DESIGN.colors.card,
                              borderRadius: DESIGN.borderRadius.button
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
                      <div className="border rounded-lg p-4" style={{ 
                        borderColor: DESIGN.colors.card,
                        background: 'linear-gradient(to right, rgba(139, 92, 246, 0.05), rgba(139, 92, 246, 0.1))'
                      }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-full border-2"
                              style={{ 
                                backgroundColor: eventData.themeColor,
                                borderColor: eventData.themeColor,
                                borderRadius: DESIGN.borderRadius.roundButton
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
                          <Button size="sm" variant="outline" style={{ borderRadius: DESIGN.borderRadius.button }}>
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

                  {/* Ticket Price */}
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: DESIGN.colors.textPrimary }}>
                      Event Access
                    </label>
                    <div className="flex items-center gap-4 mb-3">
                      <button
                        onClick={() => setEventData(prev => ({ ...prev, isFree: true, price: '' }))}
                        className={cn(
                          'px-4 py-2 rounded-lg border transition-colors',
                          eventData.isFree
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border hover:border-primary'
                        )}
                        style={{ 
                          borderRadius: DESIGN.borderRadius.button,
                          borderColor: eventData.isFree ? eventData.themeColor : DESIGN.colors.card
                        }}
                      >
                        Free Event
                      </button>
                      <button
                        onClick={() => setEventData(prev => ({ ...prev, isFree: false }))}
                        className={cn(
                          'px-4 py-2 rounded-lg border transition-colors',
                          !eventData.isFree
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border hover:border-primary'
                        )}
                        style={{ 
                          borderRadius: DESIGN.borderRadius.button,
                          borderColor: !eventData.isFree ? eventData.themeColor : DESIGN.colors.card
                        }}
                      >
                        Paid Event
                      </button>
                    </div>
                    {!eventData.isFree && (
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: DESIGN.colors.textSecondary }} />
                        <Input
                          type="number"
                          value={eventData.price}
                          onChange={(e) => setEventData({ ...eventData, price: e.target.value })}
                          placeholder="0.00"
                          className="h-11 pl-10"
                          style={{ 
                            borderRadius: DESIGN.borderRadius.button,
                            borderColor: DESIGN.colors.card,
                            background: DESIGN.colors.card,
                            color: DESIGN.colors.textPrimary
                          }}
                          disabled={isSubmitting}
                          min="0"
                          step="0.01"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: DESIGN.colors.textSecondary }}>
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

            {/* Step 2: Event Media with Image Position Adjustment */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1" style={{ color: DESIGN.colors.textPrimary }}>
                    Add Photos & Videos
                  </h3>
                  <p className="text-sm mb-4" style={{ color: DESIGN.colors.textSecondary }}>
                    Make your event visually appealing
                  </p>
                </div>

                {/* Primary Event Photo with Position Adjustment */}
                <div className="space-y-3">
                  <label className="text-sm font-medium block" style={{ color: DESIGN.colors.textPrimary }}>
                    Primary Event Photo *
                  </label>
                  <div 
                    ref={imagePreviewRef}
                    className={cn(
                      "border-2 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden",
                      "hover:border-primary hover:bg-primary/5",
                      imageFiles.length > 0 ? "border-solid" : "border-dashed"
                    )}
                    style={{ 
                      borderColor: imageFiles.length > 0 ? DESIGN.colors.card : DESIGN.colors.card,
                      borderRadius: DESIGN.borderRadius.card
                    }}
                    onClick={() => primaryPhotoRef.current?.click()}
                    onMouseDown={imageFiles.length > 0 ? handleImagePositionStart : undefined}
                    onTouchStart={imageFiles.length > 0 ? handleImagePositionStart : undefined}
                  >
                    {imageFiles.length > 0 ? (
                      <>
                        <img
                          src={eventData.images[0]}
                          alt="Primary event photo"
                          className="w-full h-full object-cover"
                          style={{
                            objectPosition: `${imagePosition.x}% ${imagePosition.y}%`
                          }}
                        />
                        {/* Position indicator */}
                        <div 
                          className="absolute w-8 h-8 rounded-full border-2 pointer-events-none"
                          style={{
                            left: `${imagePosition.x}%`,
                            top: `${imagePosition.y}%`,
                            transform: 'translate(-50%, -50%)',
                            borderColor: 'white',
                            background: 'rgba(0,0,0,0.3)'
                          }}
                        >
                          <Move className="w-4 h-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        {/* Position adjustment instructions */}
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                          <Move className="w-3 h-3" />
                          Drag to adjust position
                        </div>
                        {/* Remove button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(0);
                          }}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                          style={{ background: '#EF4444', color: 'white' }}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <Camera className="w-12 h-12 mb-3" style={{ color: DESIGN.colors.textSecondary }} />
                        <p className="text-sm font-medium" style={{ color: DESIGN.colors.textPrimary }}>
                          Click to upload
                        </p>
                        <p className="text-xs mt-1" style={{ color: DESIGN.colors.textSecondary }}>
                          or drag & drop
                        </p>
                        <p className="text-xs mt-3" style={{ color: DESIGN.colors.textSecondary }}>
                          JPG, PNG, WEBP • Max 10MB
                        </p>
                      </>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                    Drag the image to adjust framing. This photo appears on event cards
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

                {/* Additional Photos */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium" style={{ color: DESIGN.colors.textPrimary }}>
                      Additional Photos (Optional)
                    </label>
                    <span className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                      {imageFiles.length - 1}/4
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {imageFiles.slice(1).map((_, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden" style={{ borderRadius: DESIGN.borderRadius.button }}>
                        <img
                          src={eventData.images[index + 1]}
                          alt={`Additional photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeImage(index + 1)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs hover:scale-110 transition-transform"
                          style={{ background: '#EF4444', color: 'white' }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {imageFiles.length < 5 && (
                      <div 
                        className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5"
                        style={{ 
                          borderColor: DESIGN.colors.card,
                          borderRadius: DESIGN.borderRadius.button
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

                {/* Event Video */}
                <div className="space-y-3">
                  <label className="text-sm font-medium block" style={{ color: DESIGN.colors.textPrimary }}>
                    Event Video (Optional)
                  </label>
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer transition-colors",
                      "hover:border-primary hover:bg-primary/5",
                      videoFile ? "border-solid" : "border-dashed"
                    )}
                    style={{ 
                      borderColor: videoFile ? DESIGN.colors.card : DESIGN.colors.card,
                      borderRadius: DESIGN.borderRadius.card
                    }}
                    onClick={() => videoInputRef.current?.click()}
                  >
                    {videoFile ? (
                      <div className="relative w-full h-full">
                        <video
                          src={eventData.videos[0]}
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Video className="w-8 h-8 text-white" />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeVideo();
                          }}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                          style={{ background: '#EF4444', color: 'white' }}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Video className="w-10 h-10 mb-2" style={{ color: DESIGN.colors.textSecondary }} />
                        <p className="text-sm font-medium" style={{ color: DESIGN.colors.textPrimary }}>
                          Upload event video
                        </p>
                        <p className="text-xs mt-1" style={{ color: DESIGN.colors.textSecondary }}>
                          MP4, MOV, WebM • Max 50MB
                        </p>
                      </>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                    Video will auto-play muted on loop
                  </p>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Location & Check-In */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1" style={{ color: DESIGN.colors.textPrimary }}>
                    Event Location
                  </h3>
                  <p className="text-sm mb-4" style={{ color: DESIGN.colors.textSecondary }}>
                    Search and select your venue
                  </p>
                </div>

                {/* Search Input with Autocomplete */}
                <div className="relative">
                  <label className="text-sm font-medium mb-2 block" style={{ color: DESIGN.colors.textPrimary }}>
                    Search venue or address in Namibia *
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: DESIGN.colors.textSecondary }} />
                    <Input
                      ref={searchInputRef}
                      defaultValue={eventData.address || eventData.location}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEventData(prev => ({ ...prev, location: value }));
                        searchLocation(value);
                      }}
                      onFocus={() => {
                        const value = searchInputRef.current?.value || '';
                        if (value.length >= 2) {
                          searchLocation(value);
                          setShowSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      onKeyDown={handleLocationKeyDown}
                      placeholder="Search for a location in Namibia..."
                      className="h-11 pl-10"
                      style={{ 
                        borderRadius: DESIGN.borderRadius.button,
                        borderColor: DESIGN.colors.card,
                        background: DESIGN.colors.card,
                        color: DESIGN.colors.textPrimary
                      }}
                      disabled={isSubmitting}
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: DESIGN.colors.textSecondary }} />
                      </div>
                    )}
                  </div>
                  
                  {/* Autocomplete Dropdown */}
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 overflow-hidden"
                         style={{ 
                           background: DESIGN.colors.card,
                           borderRadius: DESIGN.borderRadius.button,
                           border: `1px solid ${DESIGN.colors.card}`,
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
                              borderColor: DESIGN.colors.card,
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

                {/* Map */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium" style={{ color: DESIGN.colors.textPrimary }}>
                      Map View
                    </label>
                    <div className="flex gap-2">
                      <button 
                        className="text-xs hover:text-primary flex items-center gap-1"
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
                        <Target className="w-3 h-3" />
                        Recenter
                      </button>
                      {mapError && (
                        <button 
                          className="text-xs hover:text-red-600 flex items-center gap-1"
                          style={{ color: '#EF4444' }}
                          onClick={() => {
                            if (mapContainer1.current && map1.current) {
                              map1.current.remove();
                              map1.current = null;
                              setMapError(null);
                              initializeOrUpdateMap(mapContainer1.current, 1);
                            }
                          }}
                        >
                          <Loader2 className="w-3 h-3" />
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="relative w-full h-80 rounded-xl overflow-hidden border bg-gray-100"
                       style={{ 
                         borderColor: DESIGN.colors.card,
                         borderRadius: DESIGN.borderRadius.card
                       }}>
                    {mapError ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4" style={{ background: DESIGN.colors.card }}>
                        <Map className="w-12 h-12 mb-3" style={{ color: '#EF4444' }} />
                        <p className="text-sm font-medium mb-2" style={{ color: DESIGN.colors.textPrimary }}>
                          {mapError}
                        </p>
                        <p className="text-xs text-center mb-4" style={{ color: DESIGN.colors.textSecondary }}>
                          Check your internet connection and try again
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (mapContainer1.current) {
                              setMapError(null);
                              initializeOrUpdateMap(mapContainer1.current, 1);
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
                          style={{ minHeight: '320px' }}
                        />
                        {isDraggingPin && (
                          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs border flex items-center gap-1"
                               style={{ 
                                 borderColor: DESIGN.colors.card,
                                 color: 'white'
                               }}>
                            <Move className="w-3 h-3" />
                            Drop pin to set location
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Venue Details */}
                {selectedVenueDetails && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium" style={{ color: DESIGN.colors.textPrimary }}>
                      Venue Details
                    </label>
                    <div className="border rounded-xl p-4" style={{ 
                      borderColor: DESIGN.colors.card,
                      background: DESIGN.colors.card,
                      borderRadius: DESIGN.borderRadius.card
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
                          className="text-xs hover:underline flex-shrink-0"
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
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1" style={{ color: DESIGN.colors.textPrimary }}>
                    Check-In Radius
                  </h3>
                  <p className="text-sm mb-4" style={{ color: DESIGN.colors.textSecondary }}>
                    Set how close attendees must be to check in
                  </p>
                </div>

                {/* Map with Radius */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium" style={{ color: DESIGN.colors.textPrimary }}>
                      Geofence Area
                    </label>
                    <div className="flex gap-2">
                      <span className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                        Drag pin to adjust location
                      </span>
                      {mapError && (
                        <button 
                          className="text-xs hover:text-red-600 flex items-center gap-1"
                          style={{ color: '#EF4444' }}
                          onClick={() => {
                            if (mapContainer2.current && map2.current) {
                              map2.current.remove();
                              map2.current = null;
                              setMapError(null);
                              initializeOrUpdateMap(mapContainer2.current, 2);
                            }
                          }}
                        >
                          <Loader2 className="w-3 h-3" />
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="relative w-full h-96 rounded-xl overflow-hidden border bg-gray-100"
                       style={{ 
                         borderColor: DESIGN.colors.card,
                         borderRadius: DESIGN.borderRadius.card
                       }}>
                    {mapError ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4" style={{ background: DESIGN.colors.card }}>
                        <Map className="w-12 h-12 mb-3" style={{ color: '#EF4444' }} />
                        <p className="text-sm font-medium mb-2" style={{ color: DESIGN.colors.textPrimary }}>
                          {mapError}
                        </p>
                        <p className="text-xs text-center mb-4" style={{ color: DESIGN.colors.textSecondary }}>
                          Check your internet connection and try again
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (mapContainer2.current) {
                              setMapError(null);
                              initializeOrUpdateMap(mapContainer2.current, 2);
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
                          style={{ minHeight: '320px' }}
                        />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm border flex items-center gap-2"
                             style={{ 
                               background: `${DESIGN.colors.card}CC`,
                               backdropFilter: 'blur(8px)',
                               borderColor: eventData.themeColor,
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
                    <label className="text-sm font-medium" style={{ color: DESIGN.colors.textPrimary }}>
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
                <div className="border rounded-xl p-4" style={{ 
                  borderColor: DESIGN.colors.card,
                  background: DESIGN.colors.card,
                  borderRadius: DESIGN.borderRadius.card
                }}>
                  <p className="text-sm mb-2" style={{ color: DESIGN.colors.textPrimary }}>
                    💡 <span className="font-medium">Recommended:</span> 50-100m for most venues
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
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1" style={{ color: DESIGN.colors.textPrimary }}>
                    Review Your Event
                  </h3>
                  <p className="text-sm mb-4" style={{ color: DESIGN.colors.textSecondary }}>
                    Check everything before publishing
                  </p>
                </div>

                {/* Event Preview */}
                <div className="space-y-3">
                  <label className="text-sm font-medium" style={{ color: DESIGN.colors.textPrimary }}>
                    Event Preview
                  </label>
                  <div className="border rounded-xl overflow-hidden" style={{ 
                    borderColor: DESIGN.colors.card,
                    background: DESIGN.colors.card,
                    borderRadius: DESIGN.borderRadius.card
                  }}>
                    {/* Event Card Preview */}
                    <div className="p-4 border-b" style={{ borderColor: DESIGN.colors.card }}>
                      <p className="text-sm font-medium mb-2" style={{ color: DESIGN.colors.textPrimary }}>
                        Event Card
                      </p>
                      <div className="border rounded-lg overflow-hidden" style={{ 
                        borderColor: DESIGN.colors.card,
                        borderRadius: DESIGN.borderRadius.button
                      }}>
                        <div className="h-32 flex items-center justify-center relative"
                             style={{ 
                               background: `linear-gradient(to right, ${eventData.themeColor}10, ${eventData.themeColor}05)`
                             }}>
                          {imageFiles.length > 0 ? (
                            <img
                              src={eventData.images[0]}
                              alt="Event preview"
                              className="w-full h-full object-cover"
                              style={{
                                objectPosition: `${imagePosition.x}% ${imagePosition.y}%`
                              }}
                            />
                          ) : (
                            <Image className="w-12 h-12" style={{ color: DESIGN.colors.textSecondary }} />
                          )}
                          {videoFile && (
                            <div className="absolute top-2 right-2 text-xs px-2 py-1 rounded"
                                 style={{ 
                                   background: 'rgba(0,0,0,0.6)',
                                   color: 'white'
                                 }}>
                              Video
                            </div>
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
                                borderRadius: DESIGN.borderRadius.small
                              }}
                            >
                              {categories.find(c => c.value === eventData.category)?.label || eventData.category}
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
                        Event Details
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
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit Sections */}
                <div className="space-y-3">
                  <label className="text-sm font-medium" style={{ color: DESIGN.colors.textPrimary }}>
                    Event Information
                  </label>
                  <div className="border rounded-xl overflow-hidden" style={{ 
                    borderColor: DESIGN.colors.card,
                    background: DESIGN.colors.card,
                    borderRadius: DESIGN.borderRadius.card
                  }}>
                    {/* Basic Info */}
                    <div className="p-4 border-b" style={{ borderColor: DESIGN.colors.card }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" style={{ color: DESIGN.colors.textSecondary }} />
                          <span className="text-sm font-medium" style={{ color: DESIGN.colors.textPrimary }}>
                            Basic Info
                          </span>
                        </div>
                        <button 
                          onClick={() => setStep(1)}
                          className="text-xs hover:underline flex items-center gap-1"
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
                    <div className="p-4 border-b" style={{ borderColor: DESIGN.colors.card }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4" style={{ color: DESIGN.colors.textSecondary }} />
                          <span className="text-sm font-medium" style={{ color: DESIGN.colors.textPrimary }}>
                            Media
                          </span>
                        </div>
                        <button 
                          onClick={() => setStep(2)}
                          className="text-xs hover:underline flex items-center gap-1"
                          style={{ color: eventData.themeColor }}
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p><span style={{ color: DESIGN.colors.textSecondary }}>Photos:</span> <span style={{ color: DESIGN.colors.textPrimary }}>{imageFiles.length}</span></p>
                        <p><span style={{ color: DESIGN.colors.textSecondary }}>Video:</span> <span style={{ color: DESIGN.colors.textPrimary }}>{videoFile ? 'Yes' : 'No'}</span></p>
                      </div>
                    </div>
                    
                    {/* Location */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapIcon className="w-4 h-4" style={{ color: DESIGN.colors.textSecondary }} />
                          <span className="text-sm font-medium" style={{ color: DESIGN.colors.textPrimary }}>
                            Location
                          </span>
                        </div>
                        <button 
                          onClick={() => setStep(3)}
                          className="text-xs hover:underline flex items-center gap-1"
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
              <div className="flex flex-col items-center justify-center py-8">
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                  style={{ 
                    backgroundColor: `${eventData.themeColor}20`,
                    borderRadius: DESIGN.borderRadius.roundButton
                  }}
                >
                  <Check className="w-12 h-12" style={{ color: eventData.themeColor }} />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-center" style={{ color: DESIGN.colors.textPrimary }}>
                  Event Created Successfully!
                </h3>
                <p className="text-center mb-8 max-w-md" style={{ color: DESIGN.colors.textSecondary }}>
                  Your event "<span className="font-semibold" style={{ color: DESIGN.colors.textPrimary }}>{createdEvent.name}</span>" is now live! Share the code below so attendees can check in.
                </p>

                <div className="w-full max-w-sm flex flex-col items-center justify-center mb-6 border-2 p-6"
                     style={{ 
                       background: DESIGN.colors.card,
                       borderColor: DESIGN.colors.card,
                       borderRadius: DESIGN.borderRadius.card
                     }}>
                  <div className="text-center mb-6">
                    <p className="text-sm font-medium mb-2" style={{ color: eventData.themeColor }}>
                      Event Check-in Code
                    </p>
                    <p className="text-3xl font-mono font-bold tracking-widest p-4 rounded-lg"
                       style={{ 
                         background: DESIGN.colors.background,
                         color: DESIGN.colors.textPrimary,
                         borderRadius: DESIGN.borderRadius.button
                       }}>
                      {createdEvent.qrCode}
                    </p>
                  </div>
                  <div className="w-56 h-56 flex items-center justify-center p-4 border rounded-xl"
                       style={{ 
                         background: 'white',
                         borderColor: DESIGN.colors.card,
                         borderRadius: DESIGN.borderRadius.card
                       }}>
                    <div className="w-full h-full flex items-center justify-center rounded-lg"
                         style={{ background: '#F3F4F6' }}>
                      <QrCode className="w-44 h-44" style={{ color: '#1F2937' }} />
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

        {/* Footer */}
        {step < 6 && (
          <div className="border-t p-4" style={{ 
            borderColor: DESIGN.colors.card,
            background: DESIGN.colors.background
          }}>
            <div className="flex gap-3">
              {step > 1 && (
                <Button 
                  variant="outline" 
                  className="flex-1 h-11"
                  onClick={() => setStep(step - 1)}
                  disabled={isSubmitting}
                  style={{ 
                    borderRadius: DESIGN.borderRadius.button,
                    borderColor: DESIGN.colors.card,
                    color: DESIGN.colors.textPrimary
                  }}
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
          <div className="border-t p-4" style={{ 
            borderColor: DESIGN.colors.card,
            background: DESIGN.colors.background
          }}>
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
