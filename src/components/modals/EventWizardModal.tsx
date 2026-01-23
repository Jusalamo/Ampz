import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, ArrowRight, ArrowLeft, MapPin, Check, QrCode, Copy, Download, 
  Upload, Image, Video, Map, Loader2, Search, Calendar, Clock, 
  DollarSign, Palette, ChevronRight, Edit2, Music, Cpu, Users, 
  Brush, Globe, Camera, Map as MapIcon, Radio, Eye, Utensils,
  Coffee, Beer, Hotel, ShoppingBag, Trees, School, Hospital,
  Building, Navigation, Home, Landmark, Play, Pause,
  Film, Grid3x3, Link as LinkIcon, Ticket, Trash2, EyeOff
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

// Initialize Mapbox with token from environment variable
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const isMapboxAvailable = !!MAPBOX_TOKEN;
if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

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
  editingEvent?: Event | null;
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

// Function to generate QR code URL that links to event check-in
const generateQRCodeUrl = (eventId: string, qrCode: string): string => {
  // Generate check-in URL that can be parsed by the QR scanner
  const checkInUrl = `${window.location.origin}/event/${eventId}/checkin`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(checkInUrl)}&format=png&bgcolor=ffffff&color=000000&qzone=1&margin=10&ecc=H`;
};

// Helper function to convert File to Base64 for persistent storage
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Helper function to check if a string is a base64 image
const isBase64Image = (str: string): boolean => {
  return str.startsWith('data:image/') || str.startsWith('data:video/');
};

export function EventWizardModal({ isOpen, onClose, editingEvent }: EventWizardModalProps) {
  const { addEvent, updateEvent, user } = useApp();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [mediaType, setMediaType] = useState<'video' | 'carousel'>('carousel');
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
    images: [] as string[], // Store base64 strings or URLs
    videos: [] as string[],
    imageFiles: [] as File[], // Store actual File objects for new uploads
    videoFiles: [] as File[],
    themeColor: '#8B5CF6',
    isFree: true,
    mediaType: 'carousel' as 'video' | 'carousel',
    selectedVideoIndex: 0,
    webTicketsLink: '',
    qrCodeUrl: '',
  });
  const [createdEvent, setCreatedEvent] = useState<Event | null>(null);
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
  const [editingMedia, setEditingMedia] = useState(false);

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const mapsInitialized = useRef({ map1: false, map2: false });

  // Get user's location for proximity bias
  const [userLocation, setUserLocation] = useState({ lat: -22.5609, lng: 17.0658 });

  useEffect(() => {
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
          setUserLocation({ lat: -22.5609, lng: 17.0658 });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, []);

  // Load editing event data if provided
  useEffect(() => {
    if (editingEvent && isOpen) {
      // Convert existing event to form data
      setEventData({
        name: editingEvent.name || '',
        description: editingEvent.description || '',
        category: editingEvent.category || '',
        price: editingEvent.price?.toString() || '',
        date: editingEvent.date || '',
        time: editingEvent.time || '',
        location: editingEvent.location || '',
        address: editingEvent.address || '',
        streetName: '',
        coordinates: editingEvent.coordinates || { lat: -22.5609, lng: 17.0658 },
        geofenceRadius: editingEvent.geofenceRadius || 50,
        images: editingEvent.images || [],
        videos: editingEvent.videos || [],
        imageFiles: [], // Start with empty files array
        videoFiles: [],
        themeColor: editingEvent.customTheme || '#8B5CF6',
        isFree: editingEvent.price === 0,
        mediaType: editingEvent.mediaType || 'carousel',
        selectedVideoIndex: editingEvent.selectedVideoIndex || 0,
        webTicketsLink: editingEvent.webTicketsLink || '',
        qrCodeUrl: editingEvent.qrCodeUrl || '',
      });
      
      setMediaType(editingEvent.mediaType || 'carousel');
      
      // Preselect category if it exists in our categories list
      if (editingEvent.category && categories.find(c => c.value === editingEvent.category)) {
        setEventData(prev => ({ ...prev, category: editingEvent.category! }));
      }
    }
  }, [editingEvent, isOpen]);

  // Cleanup URLs when component unmounts or images/videos change
  useEffect(() => {
    const currentImages = eventData.images;
    const currentVideos = eventData.videos;
    
    return () => {
      // Only revoke blob URLs, not base64 or external URLs
      currentImages.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      currentVideos.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [eventData.images, eventData.videos]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && !editingEvent) {
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
        imageFiles: [],
        videoFiles: [],
        themeColor: '#8B5CF6',
        isFree: true,
        mediaType: 'carousel',
        selectedVideoIndex: 0,
        webTicketsLink: '',
        qrCodeUrl: '',
      });
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
      setEditingMedia(false);
    }
  }, [isOpen, editingEvent]);

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

  // Update geofence circle when radius changes
  useEffect(() => {
    if (step === 4 && map2.current && mapsInitialized.current.map2) {
      updateGeofenceCircle(map2.current);
    }
  }, [step, eventData.geofenceRadius]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (step === 3 && map1.current && mapsInitialized.current.map1) {
          try {
            map1.current.resize();
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
    if (!isMapboxAvailable) {
      setMapError('Map service unavailable. Please configure VITE_MAPBOX_TOKEN.');
      return;
    }
    
    if (!container) {
      console.error('Map container not found');
      setMapError('Map container not available');
      return;
    }
    
    try {
      setMapError(null);
      
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

      mapInstance.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError('Map failed to load. Please refresh the page.');
      });

      await new Promise<void>((resolve) => {
        mapInstance.on('load', () => {
          console.log(`Map ${mapNumber} loaded successfully`);
          
          if (mapNumber === 1) {
            map1.current = mapInstance;
            
            marker1.current = new mapboxgl.Marker({ 
              color: eventData.themeColor,
              draggable: true 
            })
              .setLngLat([eventData.coordinates.lng, eventData.coordinates.lat])
              .addTo(mapInstance);

            marker1.current.on('dragend', () => {
              if (marker1.current) {
                const lngLat = marker1.current.getLngLat();
                setEventData(prev => ({ 
                  ...prev, 
                  coordinates: { lat: lngLat.lat, lng: lngLat.lng } 
                }));
              }
            });

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
            });
          } else {
            map2.current = mapInstance;
            
            marker2.current = new mapboxgl.Marker({ 
              color: eventData.themeColor 
            })
              .setLngLat([eventData.coordinates.lng, eventData.coordinates.lat])
              .addTo(mapInstance);

            updateGeofenceCircle(mapInstance);
          }

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
          });
          
          mapInstance.addControl(geolocateControl, 'top-right');
          
          setTimeout(() => {
            mapInstance.resize();
          }, 100);
          
          resolve();
        });

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

  const handleGeofenceRadiusChange = (value: number[]) => {
    const newRadius = value[0];
    setEventData(prev => ({ ...prev, geofenceRadius: newRadius }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).slice(0, 5 - eventData.imageFiles.length);
    
    const validFiles = newFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const maxSize = 10 * 1024 * 1024;
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not a valid image file. Please upload JPG, PNG, WEBP, or GIF files only.`,
          variant: 'destructive'
        });
        return false;
      }
      
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 10MB limit.`,
          variant: 'destructive'
        });
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }
    
    // Add to files array
    setEventData(prev => ({
      ...prev,
      imageFiles: [...prev.imageFiles, ...validFiles]
    }));
    
    // Convert files to base64 for preview
    const base64Promises = validFiles.map(file => fileToBase64(file));
    try {
      const base64Images = await Promise.all(base64Promises);
      setEventData(prev => ({
        ...prev,
        images: [...prev.images, ...base64Images]
      }));
    } catch (error) {
      console.error('Error converting images to base64:', error);
      toast({
        title: 'Upload Error',
        description: 'Failed to process uploaded images. Please try again.',
        variant: 'destructive'
      });
    }
    
    e.target.value = '';
  };

  const handlePrimaryPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFile = files[0];
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024;
    
    if (!validTypes.includes(newFile.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload JPG, PNG, WEBP, or GIF files only.',
        variant: 'destructive'
      });
      e.target.value = '';
      return;
    }
    
    if (newFile.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Image must be under 10MB.',
        variant: 'destructive'
      });
      e.target.value = '';
      return;
    }
    
    try {
      const base64Image = await fileToBase64(newFile);
      
      if (eventData.images.length > 0) {
        // Replace the first image
        setEventData(prev => ({
          ...prev,
          images: [base64Image, ...prev.images.slice(1)],
          imageFiles: [newFile, ...prev.imageFiles.slice(1)]
        }));
      } else {
        // Add as first image
        setEventData(prev => ({
          ...prev,
          images: [base64Image],
          imageFiles: [newFile]
        }));
      }
      
      setImagePosition({ x: 50, y: 50 });
      setImageZoom(100);
      e.target.value = '';
    } catch (error) {
      console.error('Error converting image to base64:', error);
      toast({
        title: 'Upload Error',
        description: 'Failed to process uploaded image. Please try again.',
        variant: 'destructive'
      });
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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newVideoFile = files[0];
    
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/ogg'];
    const maxSize = 50 * 1024 * 1024;
    
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
    
    try {
      const base64Video = await fileToBase64(newVideoFile);
      
      setEventData(prev => ({
        ...prev,
        videos: [base64Video],
        videoFiles: [newVideoFile],
        mediaType: 'video'
      }));
      
      setMediaType('video');
      e.target.value = '';
    } catch (error) {
      console.error('Error converting video to base64:', error);
      toast({
        title: 'Upload Error',
        description: 'Failed to process uploaded video. Please try again.',
        variant: 'destructive'
      });
    }
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
    setEventData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imageFiles: prev.imageFiles.filter((_, i) => i !== index)
    }));
    
    if (index === 0 && eventData.images.length > 1) {
      setImagePosition({ x: 50, y: 50 });
      setImageZoom(100);
    }
  };

  const removeVideo = () => {
    setEventData(prev => ({
      ...prev,
      videos: [],
      videoFiles: [],
      mediaType: 'carousel'
    }));
    setMediaType('carousel');
    setIsVideoPlaying(false);
    setVideoDuration('0:00');
    
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const validateEventData = (): string[] => {
    const errors: string[] = [];
    
    if (!eventData.name.trim()) errors.push('Event name is required');
    if (!eventData.category) errors.push('Category is required');
    if (!eventData.date) errors.push('Date is required');
    if (!eventData.time) errors.push('Time is required');
    if (!eventData.location.trim()) errors.push('Location name is required');
    if (!eventData.address.trim()) errors.push('Address is required');
    if (eventData.images.length === 0) errors.push('Primary photo is required');
    
    if (eventData.mediaType === 'video' && eventData.videos.length === 0) {
      errors.push('Video is required for video type');
    }
    
    if (!eventData.isFree) {
      const price = parseFloat(eventData.price);
      if (isNaN(price) || price < 0) {
        errors.push('Valid price is required for paid events');
      }
    }
    
    if (!eventData.coordinates || typeof eventData.coordinates.lat !== 'number' || typeof eventData.coordinates.lng !== 'number') {
      errors.push('Valid map coordinates are required');
    }
    
    return errors;
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

    const validationErrors = validateEventData();
    if (validationErrors.length > 0) {
      toast({
        title: 'Validation Error',
        description: `Please fix the following issues:\n${validationErrors.join('\n')}`,
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const eventId = editingEvent?.id || crypto.randomUUID();
      const qrCode = editingEvent?.qrCode || `${eventData.name.replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      
      const price = eventData.isFree ? 0 : parseFloat(eventData.price) || 0;
      
      const hasVideo = eventData.videos.length > 0;
      const mediaType = hasVideo ? 'video' : 'carousel';
      
      // Generate QR code that links to the event check-in page
      const qrCodeUrl = generateQRCodeUrl(eventId, qrCode);
      
      // Use base64 images and videos for persistent storage
      const images = eventData.images;
      const videos = eventData.videos;
      
      // Create event data
      const newEvent: Event = {
        id: eventId,
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
        attendees: editingEvent?.attendees || 0,
        organizerId: user.id,
        qrCode: qrCode,
        qrCodeUrl: qrCodeUrl,
        geofenceRadius: eventData.geofenceRadius,
        customTheme: eventData.themeColor,
        coverImage: eventData.images[0] || '',
        images: images,
        videos: videos,
        tags: [eventData.category],
        isFeatured: user?.subscription?.tier === 'max',
        hasVideo: eventData.videos.length > 0,
        mediaType: mediaType,
        selectedVideoIndex: 0,
        webTicketsLink: eventData.webTicketsLink,
        createdAt: editingEvent?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingEvent && updateEvent) {
        await updateEvent(newEvent);
        toast({
          title: 'Event updated!',
          description: 'Your event has been updated successfully.',
        });
      } else if (addEvent) {
        await addEvent(newEvent);
        toast({
          title: 'Event created!',
          description: 'Your event has been published successfully.',
        });
      } else {
        throw new Error('Event function not available');
      }
      
      setCreatedEvent(newEvent);
      setStep(6);
      
    } catch (error) {
      console.error('Error creating/updating event:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create/update event. Please try again.',
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

  const handleDownloadQR = async () => {
    if (!createdEvent?.qrCodeUrl) return;
    
    try {
      const response = await fetch(createdEvent.qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${createdEvent.name.replace(/\s+/g, '-')}-qr-code.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'QR Code Downloaded',
        description: 'QR code saved to your device.',
      });
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast({
        title: 'Download Failed',
        description: 'Could not download QR code. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const isStep1Valid = eventData.name.trim() && eventData.category && eventData.date && eventData.time;
  const isStep2Valid = eventData.images.length > 0 && (eventData.mediaType === 'carousel' || (eventData.mediaType === 'video' && eventData.videos.length > 0));
  const isStep3Valid = eventData.coordinates.lat !== 0 && eventData.location.trim() && eventData.address.trim();

  if (!isOpen) return null;

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
        {/* Header */}
        <div style={{ borderBottom: `1px solid ${DESIGN.colors.border}`, flexShrink: 0 }}>
          <div className="flex items-center justify-between px-6 h-14">
            <h2 className="text-[28px] font-bold" style={{ color: DESIGN.colors.textPrimary }}>
              {editingEvent ? 'Edit Event' : 'Create Event'}
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
          
          {step < 6 && (
            <div className="flex justify-center items-center h-8 pb-2">
              <span className="text-[14px]" style={{ color: DESIGN.colors.textSecondary }}>
                {stepTitles[step - 1]}
              </span>
            </div>
          )}
        </div>

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

                  <div>
                    <label className="text-[13px] font-semibold mb-2 block uppercase tracking-wider" 
                           style={{ color: DESIGN.colors.textSecondary }}>
                      WebTickets Link (Optional)
                    </label>
                    <div className="relative">
                      <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
                              style={{ color: DESIGN.colors.textSecondary }} />
                      <Input
                        value={eventData.webTicketsLink}
                        onChange={(e) => setEventData({ ...eventData, webTicketsLink: e.target.value })}
                        placeholder="https://webtickets.com.na/your-event"
                        className="h-11 pl-10"
                        style={{
                          borderRadius: DESIGN.borderRadius.input,
                          borderColor: DESIGN.colors.border,
                          background: DESIGN.colors.card,
                          color: DESIGN.colors.textPrimary
                        }}
                        disabled={isSubmitting}
                        type="url"
                      />
                    </div>
                    <p className="text-xs mt-1" style={{ color: DESIGN.colors.textSecondary }}>
                      Add a link for ticket sales (optional)
                    </p>
                  </div>

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
                             background: `linear-gradient(to right, ${eventData.themeColor}10, ${eventData.themeColor}20`
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

                <div className="space-y-3">
                  <label className="text-[13px] font-semibold block uppercase tracking-wider" 
                         style={{ color: DESIGN.colors.textSecondary }}>
                    Primary Event Photo *
                  </label>
                  <div 
                    className={cn(
                      "border-2 flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden",
                      "hover:border-primary",
                      eventData.images.length > 0 ? "border-solid" : "border-dashed"
                    )}
                    style={{
                      borderRadius: DESIGN.borderRadius.card,
                      borderColor: eventData.images.length > 0 ? DESIGN.colors.border : DESIGN.colors.muted,
                      height: '192px',
                      background: eventData.images.length > 0 ? 'transparent' : `${DESIGN.colors.primary}10`
                    }}
                    onClick={() => !eventData.images.length && primaryPhotoRef.current?.click()}
                    onMouseDown={(e) => {
                      if (eventData.images.length > 0) {
                        e.preventDefault();
                        setIsDraggingImage(true);
                      }
                    }}
                    onMouseMove={handleImagePositionChange}
                    onMouseUp={() => setIsDraggingImage(false)}
                    onMouseLeave={() => setIsDraggingImage(false)}
                  >
                    {eventData.images.length > 0 ? (
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
                          }}
                          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center"
                          style={{
                            borderRadius: '50%',
                            background: '#EF4444',
                            color: DESIGN.colors.textPrimary
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
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
                          JPG, PNG, WEBP, GIF • Max 10MB
                        </p>
                      </>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                    {eventData.images.length > 0 
                      ? 'Click and drag to reposition • Use +/− to zoom • Click trash to remove' 
                      : 'This photo appears on event cards'}
                  </p>
                  <input
                    ref={primaryPhotoRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handlePrimaryPhotoUpload}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </div>

                {eventData.mediaType === 'carousel' ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[13px] font-semibold uppercase tracking-wider" 
                            style={{ color: DESIGN.colors.textSecondary }}>
                        Additional Photos (Optional)
                      </label>
                      <span className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                        {eventData.images.length - 1}/4
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {eventData.images.slice(1).map((image, index) => (
                        <div key={index} className="relative aspect-square overflow-hidden"
                             style={{ borderRadius: DESIGN.borderRadius.button }}>
                          <img
                            src={image}
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
                      {eventData.images.length < 5 && (
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
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                    <p className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                      Upload up to 4 additional photos for the carousel
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[13px] font-semibold uppercase tracking-wider" 
                            style={{ color: DESIGN.colors.textSecondary }}>
                        Event Video *
                      </label>
                      <span className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                        {eventData.videos.length > 0 ? '1/1' : '0/1'}
                      </span>
                    </div>
                    <div 
                      className={cn(
                        "border-2 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden",
                        "hover:border-primary",
                        eventData.videos.length > 0 ? "border-solid" : "border-dashed"
                      )}
                      style={{
                        borderRadius: DESIGN.borderRadius.card,
                        borderColor: eventData.videos.length > 0 ? DESIGN.colors.border : DESIGN.colors.muted,
                        height: '192px',
                        background: eventData.videos.length > 0 ? 'transparent' : `${DESIGN.colors.primary}10`
                      }}
                      onClick={() => !eventData.videos.length && videoInputRef.current?.click()}
                    >
                      {eventData.videos.length > 0 ? (
                        <div className="relative w-full h-full group">
                          <video
                            ref={videoRef}
                            src={eventData.videos[0]}
                            className="w-full h-full object-cover"
                            style={{ borderRadius: DESIGN.borderRadius.card }}
                            controls={false}
                            muted
                            playsInline
                            loop
                            onLoadedMetadata={handleVideoLoaded}
                            onEnded={() => setIsVideoPlaying(false)}
                            onPlay={() => setIsVideoPlaying(true)}
                            onPause={() => setIsVideoPlaying(false)}
                          />
                          
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
                          
                          <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 rounded-full backdrop-blur-sm"
                               style={{
                                 background: 'rgba(0, 0, 0, 0.6)'
                               }}>
                            <Video className="w-3 h-3 text-white" />
                            <span className="text-xs text-white">
                              {eventData.videoFiles[0]?.type.split('/')[1].toUpperCase() || 'VIDEO'}
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
                            <Trash2 className="w-4 h-4" />
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
                      accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/ogg"
                      onChange={handleVideoUpload}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                    <p className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                      {eventData.videos.length > 0 
                        ? 'Click play/pause to preview • Video will auto-play muted on event details page' 
                        : 'Video will auto-play muted on loop in event details page'}
                    </p>
                  </div>
                )}
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

                <div className="space-y-4">
                  <div>
                    <label className="text-[13px] font-semibold mb-2 block uppercase tracking-wider" 
                           style={{ color: DESIGN.colors.textSecondary }}>
                      Location Name *
                    </label>
                    <Input
                      value={eventData.location}
                      onChange={(e) => setEventData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., Warehouse Theatre, Joe's Beerhouse, etc."
                      className="h-11"
                      style={{
                        borderRadius: DESIGN.borderRadius.input,
                        borderColor: DESIGN.colors.border,
                        background: DESIGN.colors.card,
                        color: DESIGN.colors.textPrimary
                      }}
                      disabled={isSubmitting}
                    />
                    <p className="text-xs mt-1" style={{ color: DESIGN.colors.textSecondary }}>
                      This name will appear on event cards
                    </p>
                  </div>

                  <div>
                    <label className="text-[13px] font-semibold mb-2 block uppercase tracking-wider" 
                           style={{ color: DESIGN.colors.textSecondary }}>
                      Street Address *
                    </label>
                    <Input
                      value={eventData.address}
                      onChange={(e) => setEventData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="e.g., 123 Independence Ave, Windhoek, Namibia"
                      className="h-11"
                      style={{
                        borderRadius: DESIGN.borderRadius.input,
                        borderColor: DESIGN.colors.border,
                        background: DESIGN.colors.card,
                        color: DESIGN.colors.textPrimary
                      }}
                      disabled={isSubmitting}
                    />
                    <p className="text-xs mt-1" style={{ color: DESIGN.colors.textSecondary }}>
                      This will be shown on event details page
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[13px] font-semibold uppercase tracking-wider" 
                           style={{ color: DESIGN.colors.textSecondary }}>
                      Pin Location on Map *
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
                          Click or drag marker to set location
                        </div>
                      </>
                    )}
                  </div>
                </div>
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
                    onValueChange={handleGeofenceRadiusChange}
                    min={10}
                    max={300}
                    step={1}
                    className="w-full"
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-between text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                    <span>10m</span>
                    <span>155m</span>
                    <span>300m</span>
                  </div>
                </div>

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
                    <div className="p-4 border-b" style={{ borderBottomColor: DESIGN.colors.border }}>
                      <p className="text-sm font-medium mb-2" style={{ color: DESIGN.colors.textPrimary }}>
                        Event Card
                      </p>
                      <div className="overflow-hidden" style={{ borderRadius: DESIGN.borderRadius.button, border: `1px solid ${DESIGN.colors.border}` }}>
                        <div className="h-32 flex items-center justify-center relative overflow-hidden"
                             style={{ background: `linear-gradient(to right, ${eventData.themeColor}10, ${eventData.themeColor}5)` }}>
                          {eventData.images.length > 0 ? (
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
                          <span style={{ color: DESIGN.colors.textPrimary }}>{eventData.address}</span>
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
                              : `Carousel with ${eventData.images.length} image${eventData.images.length !== 1 ? 's' : ''}`}
                          </span>
                        </div>
                        {eventData.webTicketsLink && (
                          <div className="flex items-center gap-2">
                            <Ticket className="w-4 h-4" style={{ color: DESIGN.colors.textSecondary }} />
                            <a 
                              href={eventData.webTicketsLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                              style={{ color: eventData.themeColor }}
                            >
                              Buy Tickets on WebTickets
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[13px] font-semibold uppercase tracking-wider" 
                         style={{ color: DESIGN.colors.textSecondary }}>
                    Event Information
                  </label>
                  <div className="overflow-hidden" style={{ borderRadius: DESIGN.borderRadius.card, border: `1px solid ${DESIGN.colors.border}` }}>
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
                        {eventData.webTicketsLink && (
                          <p><span style={{ color: DESIGN.colors.textSecondary }}>WebTickets:</span> <span style={{ color: eventData.themeColor }}>Link added</span></p>
                        )}
                      </div>
                    </div>
                    
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
                        <p><span style={{ color: DESIGN.colors.textSecondary }}>Primary Photo:</span> <span style={{ color: DESIGN.colors.textPrimary }}>{eventData.images.length > 0 ? 'Uploaded' : 'Required'}</span></p>
                        {eventData.mediaType === 'video' ? (
                          <p><span style={{ color: DESIGN.colors.textSecondary }}>Video:</span> <span style={{ color: DESIGN.colors.textPrimary }}>{eventData.videos.length > 0 ? 'Uploaded (auto-plays muted)' : 'Required'}</span></p>
                        ) : (
                          <p><span style={{ color: DESIGN.colors.textSecondary }}>Additional Photos:</span> <span style={{ color: DESIGN.colors.textPrimary }}>{eventData.images.length - 1}</span></p>
                        )}
                      </div>
                    </div>
                    
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
                        <p><span style={{ color: DESIGN.colors.textSecondary }}>Location Name:</span> <span style={{ color: DESIGN.colors.textPrimary }}>{eventData.location}</span></p>
                        <p><span style={{ color: DESIGN.colors.textSecondary }}>Address:</span> <span style={{ color: DESIGN.colors.textPrimary }}>{eventData.address}</span></p>
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
                  {editingEvent ? 'Event Updated Successfully!' : 'Event Created Successfully!'}
                </h3>
                <p className="text-center mb-8 max-w-md" style={{ color: DESIGN.colors.textSecondary }}>
                  Your event "<span className="font-semibold" style={{ color: DESIGN.colors.textPrimary }}>{createdEvent.name}</span>" is now {editingEvent ? 'updated' : 'live'}! Share the QR code below for attendees to check in.
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
                    <p className="text-xs mt-2" style={{ color: DESIGN.colors.textSecondary }}>
                      Scan QR code or enter this code to access event
                    </p>
                  </div>
                  <div className="w-56 h-56 p-4 border rounded-xl flex items-center justify-center"
                       style={{
                         borderRadius: DESIGN.borderRadius.card,
                         borderColor: DESIGN.colors.border,
                         background: DESIGN.colors.textPrimary
                       }}>
                    {createdEvent.qrCodeUrl ? (
                      <img
                        src={createdEvent.qrCodeUrl}
                        alt="QR Code"
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full rounded-lg flex items-center justify-center"
                           style={{ background: `${DESIGN.colors.textSecondary}10` }}>
                        <QrCode className="w-44 h-44" style={{ color: DESIGN.colors.background }} />
                      </div>
                    )}
                  </div>
                  <p className="text-xs mt-3 text-center" style={{ color: DESIGN.colors.textSecondary }}>
                    QR code links to: {window.location.origin}/event/{createdEvent.id}/checkin
                  </p>
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
                    (step === 2 && !isStep2Valid) ||
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
                      {editingEvent ? 'Updating...' : 'Publishing...'}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {editingEvent ? 'Update Event' : 'Create Event'}
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
              {editingEvent ? 'Close' : 'Go to Event Dashboard'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
