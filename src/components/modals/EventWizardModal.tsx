import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, ArrowRight, ArrowLeft, MapPin, Check, QrCode, Copy, Download, 
  Upload, Image, Video, Map, Loader2, Search, Calendar, Clock, 
  DollarSign, Palette, ChevronRight, Edit2, Music, Cpu, Users, 
  Brush, Globe, Camera, Map as MapIcon, Radio, Eye, Utensils,
  Coffee, Beer, Hotel, ShoppingBag, Trees, School, Hospital,
  Building, Navigation, Home, Landmark
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
    coordinates: { lat: -22.5609, lng: 17.0658 },
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
    }
  }, [isOpen]);

  // Cleanup maps when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (map1.current) {
        try {
          map1.current.remove();
        } catch (error) {
          console.error('Error removing map1:', error);
        }
        map1.current = null;
        marker1.current = null;
      }
      if (map2.current) {
        try {
          map2.current.remove();
        } catch (error) {
          console.error('Error removing map2:', error);
        }
        map2.current = null;
        marker2.current = null;
      }
    }
  }, [isOpen]);

  // Initialize map for step 3 (Location)
  useEffect(() => {
    if (step === 3 && isOpen && mapContainer1.current) {
      const initMap = async () => {
        try {
          if (!map1.current) {
            await initializeMap(mapContainer1.current, 1);
          } else {
            // Map already exists, just make sure it's visible
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
            }, 100);
          }
        } catch (error) {
          console.error('Error initializing map for step 3:', error);
          setMapError('Failed to load map. Please try again.');
        }
      };
      
      initMap();
    }
  }, [step, isOpen]);

  // Initialize map for step 4 (Radius)
  useEffect(() => {
    if (step === 4 && isOpen && mapContainer2.current) {
      const initMap = async () => {
        try {
          if (!map2.current) {
            await initializeMap(mapContainer2.current, 2);
          } else {
            // Map already exists, just make sure it's visible
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
            }, 100);
          }
        } catch (error) {
          console.error('Error initializing map for step 4:', error);
          setMapError('Failed to load map. Please try again.');
        }
      };
      
      initMap();
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
        style: 'mapbox://styles/mapbox/streets-v11', // Changed to v11 for better compatibility
        center: [eventData.coordinates.lng, eventData.coordinates.lat],
        zoom: 14,
        pitch: 0,
        bearing: 0,
        antialias: true,
        attributionControl: false,
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: true, // Helps with rendering issues
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
  useEffect(() => {
    if (step === 4 && map2.current && map2.current.loaded()) {
      updateGeofenceCircle(map2.current);
    }
  }, [eventData.geofenceRadius, eventData.coordinates, step]);

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
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
        `access_token=${MAPBOX_TOKEN}&` +
        `language=en&` +
        `types=address,poi,place,neighborhood,locality,region&` +
        `limit=1`
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const place = data.features[0];
        
        // Extract structured address information
        const context = place.context || [];
        const street = place.properties?.address || '';
        const neighborhood = context.find((c: any) => c.id.includes('neighborhood'))?.text || '';
        const locality = context.find((c: any) => c.id.includes('place'))?.text || '';
        const region = context.find((c: any) => c.id.includes('region'))?.text || '';
        const country = context.find((c: any) => c.id.includes('country'))?.text || '';
        
        // Build full address
        const fullAddress = [
          street,
          neighborhood,
          locality,
          region,
          country
        ].filter(Boolean).join(', ');
        
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
        
        // Update search input
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

  // Debounced search function for location autocomplete
  const searchLocation = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setLocationSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      
      setIsSearching(true);
      
      try {
        // Get proximity string for user's location
        const proximity = `${userLocation.lng},${userLocation.lat}`;
        
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
          `access_token=${MAPBOX_TOKEN}&` +
          `proximity=${proximity}&` +
          `language=en&` +
          `limit=10&` +
          `types=country,region,district,place,locality,neighborhood,address,poi&` +
          `autocomplete=true&` +
          `fuzzy=true`
        );
        
        if (!response.ok) {
          throw new Error(`Search API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          // Sort by relevance and limit to 5 results
          const sortedSuggestions = data.features
            .sort((a: any, b: any) => b.relevance - a.relevance)
            .slice(0, 5);
          
          setLocationSuggestions(sortedSuggestions);
          setShowSuggestions(true);
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
    [userLocation]
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
    
    // Update search input
    if (searchInputRef.current) {
      searchInputRef.current.value = address;
    }
    
    // Update both maps if they exist
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
      }
      e.target.value = '';
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const newVideo = files[0];
      setVideoFile(newVideo);
      
      // Create preview URL
      const videoUrl = URL.createObjectURL(newVideo);
      setEventData(prev => ({
        ...prev,
        videos: [videoUrl]
      }));
      
      e.target.value = '';
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
      
      // Parse price - ensure it's a number
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
        organizerName: user.name || 'Unknown Organizer',
        qrCode,
        geofenceRadius: eventData.geofenceRadius,
        customTheme: eventData.themeColor,
        coverImage: eventData.images[0] || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000000)}?w=800&auto=format&fit=crop`,
        images: eventData.images,
        videos: eventData.videos,
        tags: [eventData.category],
        isFeatured: user?.subscription?.tier === 'max',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active' as const,
        isFree: eventData.isFree,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className="bg-background rounded-2xl flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-border"
      >
        {/* Header - Redesigned to be compact */}
        <div className="border-b border-border shrink-0">
          {/* Row 1: Title and Close */}
          <div className="flex items-center justify-between px-6 h-14">
            <h2 className="text-xl font-semibold">Create Event</h2>
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
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
                        'w-2 h-2 rounded-full transition-all duration-300',
                        s < step ? 'bg-primary' : 
                        s === step ? 'bg-primary w-3 h-3' : 'bg-muted'
                      )}
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
          )}
          
          {/* Row 3: Current Step Title */}
          {step < 6 && (
            <div className="flex justify-center items-center h-8 pb-2">
              <span className="text-sm text-muted-foreground">
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
                  <h3 className="text-lg font-semibold mb-4">Event Details</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Event Name *</label>
                    <div className="relative">
                      <Input
                        value={eventData.name}
                        onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
                        placeholder="Summer Music Festival"
                        className="h-11 rounded-lg border-border focus:border-primary focus:ring-1 focus:ring-primary"
                        disabled={isSubmitting}
                        maxLength={50}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {50 - eventData.name.length}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {50 - eventData.name.length} characters remaining
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Description *</label>
                    <Textarea
                      value={eventData.description}
                      onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                      placeholder="Tell attendees what to expect..."
                      rows={4}
                      className="rounded-lg border-border focus:border-primary focus:ring-1 focus:ring-primary"
                      disabled={isSubmitting}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {500 - eventData.description.length} characters remaining
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Category *</label>
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
                          >
                            <Icon className="w-5 h-5 mb-1" />
                            <span className="text-xs font-medium">{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Date *</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="date"
                          value={eventData.date}
                          onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                          className="h-11 rounded-lg border-border focus:border-primary focus:ring-1 focus:ring-primary pl-10"
                          disabled={isSubmitting}
                          min={today}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Time *</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="time"
                          value={eventData.time}
                          onChange={(e) => setEventData({ ...eventData, time: e.target.value })}
                          className="h-11 rounded-lg border-border focus:border-primary focus:ring-1 focus:ring-primary pl-10"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Theme Color Section */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Event Theme Color</label>
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
                                borderColor: eventData.themeColor === color ? color : 'transparent'
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
                            className="w-10 h-10 cursor-pointer rounded-lg border border-border"
                          />
                          <div>
                            <p className="text-sm font-medium">Custom Color</p>
                            <p className="text-xs text-muted-foreground">
                              Applied to buttons and accents
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-border rounded-lg p-4 bg-gradient-to-r from-primary/5 to-primary/10">
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
                              <p className="text-sm font-medium">Current Theme</p>
                              <p className="text-xs text-muted-foreground">Purple theme selected</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="rounded-lg">
                            Upgrade to Max
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                          🎨 Unlock 20+ theme colors and custom color picker with Max subscription
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Ticket Price - Fixed empty state */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Event Access</label>
                    <div className="flex items-center gap-4 mb-3">
                      <button
                        onClick={() => setEventData(prev => ({ ...prev, isFree: true, price: '' }))}
                        className={cn(
                          'px-4 py-2 rounded-lg border transition-colors',
                          eventData.isFree
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border hover:border-primary'
                        )}
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
                      >
                        Paid Event
                      </button>
                    </div>
                    {!eventData.isFree && (
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={eventData.price}
                          onChange={(e) => setEventData({ ...eventData, price: e.target.value })}
                          placeholder="0.00"
                          className="h-11 rounded-lg border-border focus:border-primary focus:ring-1 focus:ring-primary pl-10"
                          disabled={isSubmitting}
                          min="0"
                          step="0.01"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          NAD
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
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
                  <h3 className="text-lg font-semibold mb-1">Add Photos & Videos</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Make your event visually appealing
                  </p>
                </div>

                {/* Primary Event Photo */}
                <div className="space-y-3">
                  <label className="text-sm font-medium block">Primary Event Photo *</label>
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer transition-colors",
                      "hover:border-primary hover:bg-primary/5",
                      imageFiles.length > 0 ? "border-solid" : "border-dashed"
                    )}
                    onClick={() => primaryPhotoRef.current?.click()}
                  >
                    {imageFiles.length > 0 ? (
                      <div className="relative w-full h-full">
                        <img
                          src={eventData.images[0]}
                          alt="Primary event photo"
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(0);
                          }}
                          className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-12 h-12 text-muted-foreground mb-3" />
                        <p className="text-sm font-medium">Click to upload</p>
                        <p className="text-xs text-muted-foreground mt-1">or drag & drop</p>
                        <p className="text-xs text-muted-foreground mt-3">
                          JPG, PNG, WEBP • Max 10MB
                        </p>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This photo appears on event cards
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
                    <label className="text-sm font-medium">Additional Photos (Optional)</label>
                    <span className="text-xs text-muted-foreground">
                      {imageFiles.length - 1}/4
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {imageFiles.slice(1).map((_, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                        <img
                          src={eventData.images[index + 1]}
                          alt={`Additional photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeImage(index + 1)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {imageFiles.length < 5 && (
                      <div 
                        className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-6 h-6 text-muted-foreground" />
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
                  <label className="text-sm font-medium block">Event Video (Optional)</label>
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer transition-colors",
                      "hover:border-primary hover:bg-primary/5",
                      videoFile ? "border-solid" : "border-dashed"
                    )}
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
                          className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Video className="w-10 h-10 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">Upload event video</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          MP4, MOV, WebM • Max 50MB
                        </p>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
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

                {/* Preview */}
                <div className="space-y-3">
                  <label className="text-sm font-medium block">Preview</label>
                  <div className="border border-border rounded-xl p-4 bg-card">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        <Eye className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Event Card Preview</p>
                        <p className="text-xs text-muted-foreground">
                          Shows how your primary photo appears
                        </p>
                      </div>
                    </div>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-center">
                        {imageFiles.length > 0 ? (
                          <img
                            src={eventData.images[0]}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Image className="w-12 h-12 text-muted-foreground" />
                        )}
                      </div>
                      <div className="p-3">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
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
                  <h3 className="text-lg font-semibold mb-1">Event Location</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Search and select your venue
                  </p>
                </div>

                {/* Search Input with Autocomplete */}
                <div className="relative">
                  <label className="text-sm font-medium mb-2 block">Search venue or address *</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                        // Delay hiding suggestions to allow click
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      placeholder="Search for a location, street, or venue..."
                      className="h-11 rounded-lg border-border focus:border-primary focus:ring-1 focus:ring-primary pl-10"
                      disabled={isSubmitting}
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {/* Autocomplete Dropdown */}
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                      {locationSuggestions.map((place, index) => {
                        const formatted = formatSuggestion(place);
                        return (
                          <button
                            key={place.id || index}
                            onClick={() => handleLocationSelect(place)}
                            className={cn(
                              "w-full px-4 py-3 flex items-start gap-3 transition-colors text-left border-border",
                              index < locationSuggestions.length - 1 && "border-b",
                              "hover:bg-accent bg-gray-50"
                            )}
                          >
                            <span className="text-muted-foreground mt-0.5 flex-shrink-0">
                              {formatted.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {formatted.primary}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">
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
                    <label className="text-sm font-medium">Map View</label>
                    <div className="flex gap-2">
                      <button 
                        className="text-xs text-muted-foreground hover:text-primary"
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
                          className="text-xs text-red-500 hover:text-red-600"
                          onClick={() => {
                            if (mapContainer1.current && map1.current) {
                              map1.current.remove();
                              map1.current = null;
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
                  <div className="relative w-full h-80 rounded-xl overflow-hidden border border-border bg-gray-100">
                    {mapError ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
                        <Map className="w-12 h-12 text-red-500 mb-3" />
                        <p className="text-sm font-medium text-red-600 mb-2">{mapError}</p>
                        <p className="text-xs text-muted-foreground text-center mb-4">
                          Check your internet connection and Mapbox token
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (mapContainer1.current) {
                              setMapError(null);
                              initializeMap(mapContainer1.current, 1);
                            }
                          }}
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
                        <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs border border-border">
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
                    <label className="text-sm font-medium">Venue Details</label>
                    <div className="border border-border rounded-xl p-4 bg-card">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {selectedVenueDetails.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {selectedVenueDetails.address}
                          </p>
                        </div>
                        <button 
                          className="text-xs text-primary hover:underline"
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

            {/* Step 4: Check-In Radius - REMOVED giant display box */}
            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Check-In Radius</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Set how close attendees must be to check in
                  </p>
                </div>

                {/* Map with Radius */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Geofence Area</label>
                    <div className="flex gap-2">
                      <span className="text-xs text-muted-foreground">
                        Drag marker to adjust location
                      </span>
                      {mapError && (
                        <button 
                          className="text-xs text-red-500 hover:text-red-600"
                          onClick={() => {
                            if (mapContainer2.current && map2.current) {
                              map2.current.remove();
                              map2.current = null;
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
                  <div className="relative w-full h-96 rounded-xl overflow-hidden border border-border bg-gray-100">
                    {mapError ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
                        <Map className="w-12 h-12 text-red-500 mb-3" />
                        <p className="text-sm font-medium text-red-600 mb-2">{mapError}</p>
                        <p className="text-xs text-muted-foreground text-center mb-4">
                          Check your internet connection and Mapbox token
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (mapContainer2.current) {
                              setMapError(null);
                              initializeMap(mapContainer2.current, 2);
                            }
                          }}
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
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg text-sm border border-border flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: eventData.themeColor }}
                          />
                          <span className="font-medium" style={{ color: eventData.themeColor }}>
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
                    <label className="text-sm font-medium">Adjust Radius</label>
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
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10m</span>
                    <span>150m</span>
                    <span>300m</span>
                  </div>
                </div>

                {/* Helper Text */}
                <div className="border border-border rounded-xl p-4 bg-card">
                  <p className="text-sm text-muted-foreground">
                    💡 <span className="font-medium">Recommended:</span> 50-100m for most venues
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>10-50m: High precision (small venues)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>50-100m: Standard events</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
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
                  <h3 className="text-lg font-semibold mb-1">Review Your Event</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Check everything before publishing
                  </p>
                </div>

                {/* Event Preview */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Event Preview</label>
                  <div className="border border-border rounded-xl overflow-hidden bg-card">
                    {/* Event Card Preview */}
                    <div className="p-4 border-b border-border">
                      <p className="text-sm font-medium mb-2">Event Card</p>
                      <div className="border border-border rounded-lg overflow-hidden">
                        <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-center relative">
                          {imageFiles.length > 0 ? (
                            <img
                              src={eventData.images[0]}
                              alt="Event preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Image className="w-12 h-12 text-muted-foreground" />
                          )}
                          {videoFile && (
                            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                              Video
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium truncate">{eventData.name}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {eventData.date} at {eventData.time}
                              </p>
                            </div>
                            <span 
                              className="px-2 py-1 text-xs rounded ml-2"
                              style={{ 
                                backgroundColor: `${eventData.themeColor}20`,
                                color: eventData.themeColor
                              }}
                            >
                              {eventData.category}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span className="truncate">{eventData.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Event Details Preview */}
                    <div className="p-4">
                      <p className="text-sm font-medium mb-2">Event Details</p>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{eventData.date} at {eventData.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{eventData.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span>{eventData.isFree ? 'Free' : `N$${eventData.price}`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Map className="w-4 h-4 text-muted-foreground" />
                          <span>Check-in radius: {eventData.geofenceRadius}m</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit Sections */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Event Information</label>
                  <div className="border border-border rounded-xl overflow-hidden">
                    {/* Basic Info */}
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Basic Info</span>
                        </div>
                        <button 
                          onClick={() => setStep(1)}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Name:</span> {eventData.name}</p>
                        <p><span className="text-muted-foreground">Category:</span> {eventData.category}</p>
                        <p><span className="text-muted-foreground">Date:</span> {eventData.date} at {eventData.time}</p>
                        <p><span className="text-muted-foreground">Price:</span> {eventData.isFree ? 'Free' : `N$${eventData.price}`}</p>
                      </div>
                    </div>
                    
                    {/* Media */}
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Media</span>
                        </div>
                        <button 
                          onClick={() => setStep(2)}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Photos:</span> {imageFiles.length}</p>
                        <p><span className="text-muted-foreground">Video:</span> {videoFile ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                    
                    {/* Location */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Location</span>
                        </div>
                        <button 
                          onClick={() => setStep(3)}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Venue:</span> {eventData.location}</p>
                        <p><span className="text-muted-foreground">Check-in radius:</span> {eventData.geofenceRadius}m</p>
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
                <h3 className="text-2xl font-bold mb-2 text-center">Event Created Successfully!</h3>
                <p className="text-muted-foreground text-center mb-8 max-w-md">
                  Your event "<span className="font-semibold">{createdEvent.name}</span>" is now live! Share the code below so attendees can check in.
                </p>

                <div className="w-full max-w-sm bg-card rounded-2xl flex flex-col items-center justify-center mb-6 border-2 border-border p-6">
                  <div className="text-center mb-6">
                    <p className="text-sm font-medium mb-2" style={{ color: eventData.themeColor }}>
                      Event Check-in Code
                    </p>
                    <p className="text-3xl font-mono font-bold tracking-widest bg-background p-4 rounded-lg">
                      {createdEvent.qrCode}
                    </p>
                  </div>
                  <div className="w-56 h-56 bg-white flex items-center justify-center p-4 border border-border rounded-xl">
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg">
                      <QrCode className="w-44 h-44 text-gray-800" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 w-full max-w-sm">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-lg h-12 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                    onClick={copyCode}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-lg h-12 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                    onClick={handleDownloadQR}
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
          <div className="border-t border-border bg-background p-4 shrink-0">
            <div className="flex gap-3">
              {step > 1 && (
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-lg h-11"
                  onClick={() => setStep(step - 1)}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
              {step < 5 ? (
                <Button
                  className="flex-1 rounded-lg h-11 font-medium"
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
                  }}
                >
                  {step === 4 ? 'Review Event' : 'Next'}
                  {step !== 4 && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              ) : (
                <Button
                  className="flex-1 rounded-lg h-11 font-medium"
                  onClick={handlePublish}
                  disabled={isSubmitting}
                  style={{ 
                    backgroundColor: eventData.themeColor,
                    borderColor: eventData.themeColor 
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
          <div className="border-t border-border bg-background p-4 shrink-0">
            <Button 
              className="w-full rounded-lg h-11 font-medium" 
              onClick={onClose}
              style={{ 
                backgroundColor: eventData.themeColor,
                borderColor: eventData.themeColor 
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
