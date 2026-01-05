import { useState, useRef, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, MapPin, Check, QrCode, Copy, Download, Upload, Image, Video, Map, Loader2 } from 'lucide-react';
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

const MAPBOX_TOKEN = 'pk.eyJ1IjoianVzYSIsImEiOiJjbWpjanh5amEwbDEwM2dzOXVhbjZ5dzcwIn0.stWdbPHCrf9sKrRJRmShlg';

interface EventWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = ['Music', 'Tech', 'Party', 'Art', 'Food', 'Sports', 'Other'];

export function EventWizardModal({ isOpen, onClose }: EventWizardModalProps) {
  const { addEvent, user } = useApp();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [eventData, setEventData] = useState({
    name: '',
    description: '',
    category: '',
    price: 0,
    date: '',
    time: '',
    location: '',
    address: '',
    streetName: '',
    coordinates: { lat: -22.5609, lng: 17.0658 },
    geofenceRadius: 200,
    images: [] as string[],
    videos: [] as string[],
    themeColor: '#8B5CF6',
  });
  const [createdEvent, setCreatedEvent] = useState<Event | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [isMapLoading, setIsMapLoading] = useState(false);

  const mapContainer1 = useRef<HTMLDivElement>(null);
  const mapContainer2 = useRef<HTMLDivElement>(null);
  const map1 = useRef<mapboxgl.Map | null>(null);
  const map2 = useRef<mapboxgl.Map | null>(null);
  const marker1 = useRef<mapboxgl.Marker | null>(null);
  const marker2 = useRef<mapboxgl.Marker | null>(null);
  const geofenceCircle = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setEventData({
        name: '',
        description: '',
        category: '',
        price: 0,
        date: '',
        time: '',
        location: '',
        address: '',
        streetName: '',
        coordinates: { lat: -22.5609, lng: 17.0658 },
        geofenceRadius: 200,
        images: [],
        videos: [],
        themeColor: '#8B5CF6',
      });
      setImageFiles([]);
      setVideoFiles([]);
      setCreatedEvent(null);
    }
  }, [isOpen]);

  // Cleanup maps when modal closes
  useEffect(() => {
    return () => {
      if (map1.current) {
        map1.current.remove();
        map1.current = null;
      }
      if (map2.current) {
        map2.current.remove();
        map2.current = null;
      }
    };
  }, []);

  // Initialize map for step 3 (Location)
  useEffect(() => {
    if (step === 3 && mapContainer1.current && !map1.current) {
      initializeMap(mapContainer1.current, 1);
    }
  }, [step]);

  // Initialize map for step 4 (Radius)
  useEffect(() => {
    if (step === 4 && mapContainer2.current && !map2.current) {
      initializeMap(mapContainer2.current, 2);
    }
  }, [step]);

  const initializeMap = (container: HTMLDivElement, mapNumber: 1 | 2) => {
    setIsMapLoading(true);
    
    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      
      const mapInstance = new mapboxgl.Map({
        container,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [eventData.coordinates.lng, eventData.coordinates.lat],
        zoom: 13,
        pitch: 45,
        bearing: -17.6,
        antialias: true,
      });

      mapInstance.on('load', () => {
        setIsMapLoading(false);
        
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
            mapInstance.flyTo({ center: [lng, lat], zoom: 14 });
          });
        } else {
          map2.current = mapInstance;
          
          // Add marker for map 2
          marker2.current = new mapboxgl.Marker({ 
            color: eventData.themeColor 
          })
            .setLngLat([eventData.coordinates.lng, eventData.coordinates.lat])
            .addTo(mapInstance);

          // Add geofence circle to map 2
          updateGeofenceCircle();
        }

        // Add navigation controls
        mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        // Add geolocate control
        mapInstance.addControl(
          new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserLocation: true,
          }),
          'top-right'
        );
      });

      mapInstance.on('error', (e) => {
        console.error('Map error:', e);
        setIsMapLoading(false);
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      setIsMapLoading(false);
    }
  };

  // Update geofence circle when radius changes
  useEffect(() => {
    if (step === 4 && map2.current) {
      updateGeofenceCircle();
    }
  }, [eventData.geofenceRadius, eventData.coordinates, step]);

  const updateGeofenceCircle = () => {
    if (!map2.current || !map2.current.isStyleLoaded()) return;

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
    
    if (map2.current.getSource(sourceId)) {
      (map2.current.getSource(sourceId) as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [coords] },
      });
    } else {
      map2.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'Polygon', coordinates: [coords] },
        },
      });

      map2.current.addLayer({
        id: 'geofence-fill',
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': eventData.themeColor,
          'fill-opacity': 0.2,
        },
      });

      map2.current.addLayer({
        id: 'geofence-line',
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': eventData.themeColor,
          'line-width': 3,
          'line-dasharray': [2, 2],
        },
      });
    }

    // Ensure map is centered on the marker
    map2.current.flyTo({
      center: [lng, lat],
      zoom: 14,
      duration: 500
    });
  };

  const reverseGeocode = async (lng: number, lat: number) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const place = data.features[0];
        // Extract street name from place properties
        const streetName = place.properties?.address || place.text || '';
        setEventData(prev => ({
          ...prev,
          location: place.text || '',
          address: place.place_name || '',
          streetName: streetName,
        }));
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const searchLocation = async (query: string) => {
    if (!query) return;
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=NA&types=address`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const place = data.features[0];
        const [lng, lat] = place.center;
        const streetName = place.properties?.address || place.text || '';
        setEventData(prev => ({
          ...prev,
          coordinates: { lat, lng },
          location: place.text || query,
          address: place.place_name || '',
          streetName: streetName,
        }));
        
        // Update both maps if they exist
        if (map1.current) {
          map1.current.flyTo({ center: [lng, lat], zoom: 14 });
          if (marker1.current) {
            marker1.current.setLngLat([lng, lat]);
          }
        }
        if (map2.current) {
          map2.current.flyTo({ center: [lng, lat], zoom: 14 });
          if (marker2.current) {
            marker2.current.setLngLat([lng, lat]);
          }
          updateGeofenceCircle();
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files);
      setImageFiles(prev => [...prev, ...newImages]);
      
      // Create preview URLs
      const imageUrls = newImages.map(file => URL.createObjectURL(file));
      setEventData(prev => ({
        ...prev,
        images: [...prev.images, ...imageUrls]
      }));
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newVideos = Array.from(files);
      setVideoFiles(prev => [...prev, ...newVideos]);
      
      // Create preview URLs
      const videoUrls = newVideos.map(file => URL.createObjectURL(file));
      setEventData(prev => ({
        ...prev,
        videos: [...prev.videos, ...videoUrls]
      }));
    }
  };

  const removeImage = (index: number) => {
    setEventData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setEventData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
    setVideoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePublish = () => {
    const qrCode = `${eventData.name.replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    
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
      price: eventData.price,
      currency: 'NAD',
      maxAttendees: 500,
      attendees: 0,
      organizerId: user?.id || '',
      qrCode,
      geofenceRadius: eventData.geofenceRadius,
      customTheme: eventData.themeColor,
      coverImage: eventData.images[0] || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000000)}?w=800`,
      images: eventData.images,
      videos: eventData.videos,
      tags: [eventData.category],
      isFeatured: user?.subscription.tier === 'max',
    };

    addEvent(newEvent);
    setCreatedEvent(newEvent);
    setStep(6);
  };

  const copyCode = () => {
    if (createdEvent) {
      navigator.clipboard.writeText(createdEvent.qrCode);
      toast({ title: 'Code copied!', description: 'Share this code with your attendees' });
    }
  };

  const isStep1Valid = eventData.name && eventData.category && eventData.date && eventData.time;
  const isStep3Valid = eventData.coordinates.lat !== 0 && eventData.location;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div 
        ref={modalRef}
        className="bg-background rounded-2xl flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">Create Event</h2>
            {step < 6 && (
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={cn(
                      'w-6 h-2 rounded-full transition-colors',
                      s <= step ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Single scrollable area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Event Details</h3>
                  <p className="text-muted-foreground">Tell us about your event</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Event Name *</label>
                    <Input
                      value={eventData.name}
                      onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
                      placeholder="e.g., Summer Music Festival"
                      className="h-12 rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea
                      value={eventData.description}
                      onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                      placeholder="Tell attendees what to expect..."
                      rows={4}
                      className="rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-3 block">Category *</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setEventData({ ...eventData, category: cat })}
                          className={cn(
                            'px-4 py-3 rounded-xl text-sm font-medium transition-all border-2',
                            eventData.category === cat
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card border-border hover:border-primary hover:bg-primary/5'
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Date *</label>
                      <Input
                        type="date"
                        value={eventData.date}
                        onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                        className="h-12 rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Time *</label>
                      <Input
                        type="time"
                        value={eventData.time}
                        onChange={(e) => setEventData({ ...eventData, time: e.target.value })}
                        className="h-12 rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Price (NAD)</label>
                    <Input
                      type="number"
                      value={eventData.price}
                      onChange={(e) => setEventData({ ...eventData, price: Number(e.target.value) })}
                      placeholder="0 for free events"
                      className="h-12 rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      min={0}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-3 block">Theme Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={eventData.themeColor}
                        onChange={(e) => setEventData({ ...eventData, themeColor: e.target.value })}
                        className="w-12 h-12 cursor-pointer rounded-xl border-2 border-border"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium">{eventData.themeColor}</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          This color will be used for your event theme
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Media Upload */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Event Media</h3>
                  <p className="text-muted-foreground">Add photos and videos for your event</p>
                </div>

                {/* Images Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Photos</label>
                      <p className="text-xs text-muted-foreground">Upload event photos (up to 10)</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Add Photos
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {eventData.images.map((image, index) => (
                      <div key={index} className="relative aspect-square group">
                        <img
                          src={image}
                          alt={`Event ${index + 1}`}
                          className="w-full h-full object-cover rounded-xl border-2 border-border"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {eventData.images.length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center p-10 border-2 border-dashed border-border rounded-xl">
                        <Image className="w-16 h-16 text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground mb-2">No photos added yet</p>
                        <p className="text-xs text-muted-foreground text-center">
                          Click "Add Photos" to upload images of your event
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Videos Section */}
                <div className="space-y-4 pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Videos</label>
                      <p className="text-xs text-muted-foreground">Upload event videos (up to 3)</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => videoInputRef.current?.click()}
                      className="rounded-xl"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Add Videos
                    </Button>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {eventData.videos.map((video, index) => (
                      <div key={index} className="relative aspect-video group">
                        <video
                          src={video}
                          className="w-full h-full object-cover rounded-xl border-2 border-border"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Video className="w-10 h-10 text-white" />
                        </div>
                        <button
                          onClick={() => removeVideo(index)}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {eventData.videos.length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center p-10 border-2 border-dashed border-border rounded-xl">
                        <Video className="w-16 h-16 text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground mb-2">No videos added yet</p>
                        <p className="text-xs text-muted-foreground text-center">
                          Click "Add Videos" to upload promotional videos
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Location */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Event Location</h3>
                  <p className="text-muted-foreground">Search or click the map to set location</p>
                </div>

                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                  <Input
                    value={eventData.location}
                    onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && searchLocation(eventData.location)}
                    placeholder="Search for a location..."
                    className="h-12 pl-12 rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                {eventData.streetName && (
                  <div className="bg-card p-4 rounded-xl">
                    <p className="text-sm font-medium">Street Name:</p>
                    <p className="text-sm text-muted-foreground">{eventData.streetName}</p>
                  </div>
                )}

                {eventData.address && (
                  <div className="bg-card p-4 rounded-xl">
                    <p className="text-sm font-medium">Full Address:</p>
                    <p className="text-sm text-muted-foreground">{eventData.address}</p>
                  </div>
                )}

                {/* Map Container for Location Selection */}
                <div className="relative w-full h-[400px] rounded-xl overflow-hidden border-2 border-border">
                  {isMapLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900 z-10">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <span className="ml-2 text-sm">Loading map...</span>
                    </div>
                  )}
                  <div
                    ref={mapContainer1}
                    className="w-full h-full"
                  />
                </div>

                <div className="text-xs text-muted-foreground text-center p-2">
                  <p>Tap on the map or drag the marker to set location</p>
                  <p className="mt-1">Coordinates: {eventData.coordinates.lat.toFixed(4)}, {eventData.coordinates.lng.toFixed(4)}</p>
                </div>
              </div>
            )}

            {/* Step 4: Geofence */}
            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Check-in Radius</h3>
                  <p className="text-muted-foreground">
                    Set how close attendees need to be to check in
                  </p>
                </div>

                <div className="bg-card p-6 rounded-xl text-center">
                  <p className="text-5xl font-bold mb-2" style={{ color: eventData.themeColor }}>
                    {eventData.geofenceRadius}m
                  </p>
                  <p className="text-sm text-muted-foreground">Check-in radius</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Adjust Radius</span>
                      <span className="text-lg font-bold px-3 py-1 rounded-lg bg-card" style={{ color: eventData.themeColor }}>
                        {eventData.geofenceRadius}m
                      </span>
                    </div>
                    <Slider
                      value={[eventData.geofenceRadius]}
                      onValueChange={(value) => setEventData({ ...eventData, geofenceRadius: value[0] })}
                      min={10}
                      max={500}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10m</span>
                      <span>250m</span>
                      <span>500m</span>
                    </div>
                  </div>

                  {/* Map Container for Radius Visualization */}
                  <div className="relative w-full h-[350px] rounded-xl overflow-hidden border-2 border-border">
                    {isMapLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900 z-10">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="ml-2 text-sm">Loading map...</span>
                      </div>
                    )}
                    <div
                      ref={mapContainer2}
                      className="w-full h-full"
                    />
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
                      <Map className="w-4 h-4 inline mr-2" />
                      Radius: {eventData.geofenceRadius}m
                    </div>
                  </div>
                </div>

                <div className="bg-card p-4 rounded-xl">
                  <p className="text-sm text-muted-foreground">
                    💡 <span className="font-medium">Radius Guide:</span><br/>
                    • <strong>10-50m</strong>: High security, precise check-in<br/>
                    • <strong>50-200m</strong>: Standard events, good balance<br/>
                    • <strong>200-500m</strong>: Large venues, easier check-in
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Review Your Event</h3>
                  <p className="text-muted-foreground">Make sure everything looks good</p>
                </div>

                <div className="bg-card p-6 rounded-xl space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Event Name</p>
                      <p className="font-semibold">{eventData.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Category</p>
                      <span 
                        className="inline-flex px-3 py-1 rounded-lg text-sm font-medium"
                        style={{ backgroundColor: `${eventData.themeColor}20`, color: eventData.themeColor }}
                      >
                        {eventData.category}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Date & Time</p>
                      <p className="font-semibold">{eventData.date} at {eventData.time}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Price</p>
                      <p className="font-semibold">
                        {eventData.price === 0 ? 'FREE' : `N$${eventData.price}`}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Location</p>
                    <p className="font-semibold">{eventData.streetName || eventData.location}</p>
                    {eventData.address && (
                      <p className="text-sm text-muted-foreground mt-1">{eventData.address}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Check-in Radius</p>
                      <p className="font-semibold">{eventData.geofenceRadius}m</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Media</p>
                      <p className="font-semibold">
                        {eventData.images.length} photos, {eventData.videos.length} videos
                      </p>
                    </div>
                  </div>

                  {eventData.description && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-2">Description</p>
                      <p className="text-sm">{eventData.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Success */}
            {step === 6 && createdEvent && (
              <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${eventData.themeColor}20` }}
                >
                  <Check className="w-12 h-12" style={{ color: eventData.themeColor }} />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-center">Event Created Successfully!</h3>
                <p className="text-muted-foreground text-center mb-8 max-w-md">
                  Your event "<span className="font-semibold">{createdEvent.name}</span>" is now live! Share the code below so attendees can check in.
                </p>

                <div className="w-full max-w-sm bg-white rounded-2xl flex flex-col items-center justify-center mb-6 border-2 border-border p-6">
                  <div className="text-center mb-6">
                    <p className="text-sm font-medium mb-2" style={{ color: eventData.themeColor }}>
                      Event Check-in Code
                    </p>
                    <p className="text-3xl font-mono font-bold tracking-widest bg-card p-4 rounded-lg">
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
                    className="flex-1 rounded-xl h-12"
                    onClick={copyCode}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl h-12"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Save QR
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA Buttons - Fixed at bottom of modal */}
        {step < 6 && (
          <div className="border-t border-border bg-background p-6 shrink-0">
            <div className="flex gap-3 w-full">
              {step > 1 && (
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl h-12"
                  onClick={() => setStep(step - 1)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              {step < 5 ? (
                <Button
                  className="flex-1 rounded-xl h-12 font-medium"
                  onClick={() => setStep(step + 1)}
                  disabled={(step === 1 && !isStep1Valid) || (step === 3 && !isStep3Valid)}
                  style={{ 
                    backgroundColor: eventData.themeColor,
                    borderColor: eventData.themeColor,
                    opacity: ((step === 1 && !isStep1Valid) || (step === 3 && !isStep3Valid)) ? 0.5 : 1
                  }}
                >
                  {step === 4 ? 'Review Event' : 'Next'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  className="flex-1 rounded-xl h-12 font-medium"
                  onClick={handlePublish}
                  style={{ 
                    backgroundColor: eventData.themeColor,
                    borderColor: eventData.themeColor 
                  }}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Publish Event
                </Button>
              )}
            </div>
            <div className="text-xs text-muted-foreground text-center mt-3">
              Step {step} of 5 • {step === 1 ? 'Basic Info' : step === 2 ? 'Media' : step === 3 ? 'Location' : step === 4 ? 'Radius' : 'Review'}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="border-t border-border bg-background p-6 shrink-0">
            <Button 
              className="w-full rounded-xl h-12 font-medium" 
              onClick={onClose}
              style={{ 
                backgroundColor: eventData.themeColor,
                borderColor: eventData.themeColor 
              }}
            >
              <Check className="w-4 h-4 mr-2" />
              Done • Go to Event Dashboard
            </Button>
            <div className="text-xs text-muted-foreground text-center mt-3">
              Event created successfully! You can now manage it from your dashboard.
            </div>
          </div>
        )}
      </div>
    </div>
  );      
}
