import { useState, useRef, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, MapPin, Check, QrCode, Copy, Download, Upload, Image, Video, Map } from 'lucide-react';
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
  const [mapInitialized, setMapInitialized] = useState(false);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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
      setMapInitialized(false);
    }
  }, [isOpen]);

  // Initialize map on step 3 (Location)
  useEffect(() => {
    if (step === 3 && mapContainer.current && !map.current && !mapInitialized) {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [eventData.coordinates.lng, eventData.coordinates.lat],
        zoom: 13,
        attributionControl: false
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl());
      
      // Add marker
      marker.current = new mapboxgl.Marker({ color: eventData.themeColor })
        .setLngLat([eventData.coordinates.lng, eventData.coordinates.lat])
        .addTo(map.current);

      map.current.on('load', () => {
        setMapInitialized(true);
      });

      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        setEventData(prev => ({ ...prev, coordinates: { lat, lng } }));
        updateMarker(lng, lat);
        reverseGeocode(lng, lat);
      });
    }

    // Handle step 4 (Geofence) - reuse existing map
    if (step === 4 && map.current && !mapInitialized) {
      setMapInitialized(true);
      updateGeofenceCircle();
    }

    // Cleanup when leaving location/geofence steps
    if (step !== 3 && step !== 4 && map.current) {
      mapInitialized && setMapInitialized(false);
    }

    return () => {
      // Only remove map when completely closing the wizard
      if (!isOpen && map.current) {
        map.current.remove();
        map.current = null;
        marker.current = null;
        setMapInitialized(false);
      }
    };
  }, [step, isOpen, mapInitialized]);

  // Update geofence circle on step 4
  useEffect(() => {
    if (step === 4 && map.current && mapInitialized) {
      updateGeofenceCircle();
    }
  }, [step, eventData.geofenceRadius, eventData.coordinates, mapInitialized]);

  const updateMarker = (lng: number, lat: number) => {
    if (!map.current || !marker.current) return;

    marker.current.setLngLat([lng, lat]);
    marker.current.setPopup(new mapboxgl.Popup().setText('Event Location'));
    
    map.current.flyTo({ center: [lng, lat], zoom: 14 });
  };

  const updateGeofenceCircle = () => {
    if (!map.current) return;

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

      if (!map.current.getLayer('geofence-fill')) {
        map.current.addLayer({
          id: 'geofence-fill',
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': eventData.themeColor,
            'fill-opacity': 0.15,
          },
        });
      }

      if (!map.current.getLayer('geofence-line')) {
        map.current.addLayer({
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
    }
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
        updateMarker(lng, lat);
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
    URL.revokeObjectURL(eventData.images[index]);
    setEventData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    URL.revokeObjectURL(eventData.videos[index]);
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
  const isStep2Valid = eventData.images.length > 0 || eventData.videos.length > 0;
  const isStep3Valid = eventData.coordinates.lat !== 0 && eventData.location;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold">Create Event</h2>
          {step < 6 && (
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={cn(
                    'w-6 h-1.5 rounded-full transition-colors',
                    s <= step ? 'bg-primary' : 'bg-muted'
                  )}
                />
              ))}
            </div>
          )}
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content with bottom padding for footer */}
      <div className="flex-1 overflow-y-auto p-5" style={{ paddingBottom: '140px' }}>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-xl font-bold mb-2">Event Details</h3>
              <p className="text-muted-foreground text-sm">Tell us about your event</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Event Name *</label>
                <Input
                  value={eventData.name}
                  onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
                  placeholder="e.g., Summer Music Festival"
                  className="h-12 rounded-lg border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={eventData.description}
                  onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                  placeholder="Tell attendees what to expect..."
                  rows={4}
                  className="rounded-lg border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Category *</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setEventData({ ...eventData, category: cat })}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-all border-2',
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
                    className="h-12 rounded-lg border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Time *</label>
                  <Input
                    type="time"
                    value={eventData.time}
                    onChange={(e) => setEventData({ ...eventData, time: e.target.value })}
                    className="h-12 rounded-lg border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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
                  className="h-12 rounded-lg border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  min={0}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Theme Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={eventData.themeColor}
                    onChange={(e) => setEventData({ ...eventData, themeColor: e.target.value })}
                    className="w-12 h-12 cursor-pointer rounded-lg border-2 border-border"
                  />
                  <span className="text-sm font-medium">{eventData.themeColor}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Media Upload */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-xl font-bold mb-2">Event Media</h3>
              <p className="text-muted-foreground text-sm">Add photos and videos for your event</p>
            </div>

            {/* Images Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Photos</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg"
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

              <div className="grid grid-cols-3 gap-3">
                {eventData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Event ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-border"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {eventData.images.length === 0 && (
                  <div className="col-span-3 flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg">
                    <Image className="w-12 h-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No photos added yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Add at least one photo</p>
                  </div>
                )}
              </div>
            </div>

            {/* Videos Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Videos</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => videoInputRef.current?.click()}
                  className="rounded-lg"
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

              <div className="grid grid-cols-2 gap-3">
                {eventData.videos.map((video, index) => (
                  <div key={index} className="relative group">
                    <video
                      src={video}
                      className="w-full h-32 object-cover rounded-lg border-2 border-border"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Video className="w-8 h-8 text-white/80" />
                    </div>
                    <button
                      onClick={() => removeVideo(index)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {eventData.videos.length === 0 && (
                  <div className="col-span-2 flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg">
                    <Video className="w-12 h-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No videos added yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Optional</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in h-full">
            <div>
              <h3 className="text-xl font-bold mb-2">Event Location</h3>
              <p className="text-muted-foreground text-sm">Search or click the map to set location</p>
            </div>

            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
              <Input
                value={eventData.location}
                onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && searchLocation(eventData.location)}
                placeholder="Search for a location..."
                className="h-12 pl-12 rounded-lg border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {eventData.streetName && (
              <div className="glass-card p-4 rounded-lg">
                <p className="text-sm font-medium">Street Name:</p>
                <p className="text-sm text-muted-foreground">{eventData.streetName}</p>
              </div>
            )}

            {eventData.address && (
              <p className="text-sm text-muted-foreground">{eventData.address}</p>
            )}

            <div
              ref={mapContainer}
              className="w-full h-[calc(100vh-280px)] min-h-[300px] rounded-xl overflow-hidden border-2 border-border bg-gray-100"
            >
              {!mapInitialized && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-muted-foreground">Loading map...</p>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Tap on the map to place your event pin • Coordinates: {eventData.coordinates.lat.toFixed(4)}, {eventData.coordinates.lng.toFixed(4)}
            </p>
          </div>
        )}

        {/* Step 4: Geofence */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in h-full">
            <div>
              <h3 className="text-xl font-bold mb-2">Check-in Radius</h3>
              <p className="text-muted-foreground text-sm">
                Set how close attendees need to be to check in
              </p>
            </div>

            <div className="glass-card p-6 text-center rounded-lg">
              <p className="text-4xl font-bold" style={{ color: eventData.themeColor }}>
                {eventData.geofenceRadius}m
              </p>
              <p className="text-muted-foreground text-sm">Check-in radius</p>
            </div>

            <div className="space-y-4">
              <Slider
                value={[eventData.geofenceRadius]}
                onValueChange={(value) => setEventData({ ...eventData, geofenceRadius: value[0] })}
                min={10}
                max={500}
                step={10}
                className="my-6"
              />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10m</span>
                <span>250m</span>
                <span>500m</span>
              </div>
            </div>

            {/* Map preview with radius */}
            <div className="relative rounded-xl overflow-hidden border-2 border-border bg-gray-100">
              <div
                ref={mapContainer}
                className="w-full h-[250px]"
              >
                {!mapInitialized && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-xs text-muted-foreground">Loading map...</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm">
                <Map className="w-4 h-4 inline mr-2" />
                Radius: {eventData.geofenceRadius}m
              </div>
            </div>

            <div className="glass-card p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 <span className="font-medium">Radius Guide:</span><br/>
                • 10-50m: High security, precise check-in<br/>
                • 50-200m: Standard events, good balance<br/>
                • 200-500m: Large venues, easier check-in
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-xl font-bold mb-2">Review Your Event</h3>
              <p className="text-muted-foreground text-sm">Make sure everything looks good</p>
            </div>

            <div className="glass-card p-6 space-y-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-semibold">{eventData.name}</span>
              </div>
              <div className="border-t border-border" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Category</span>
                <span 
                  className="px-3 py-1 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: `${eventData.themeColor}20`, color: eventData.themeColor }}
                >
                  {eventData.category}
                </span>
              </div>
              <div className="border-t border-border" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Date & Time</span>
                <span className="font-semibold">
                  {eventData.date} at {eventData.time}
                </span>
              </div>
              <div className="border-t border-border" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Location</span>
                <span className="font-semibold text-right max-w-[200px] truncate">
                  {eventData.streetName || eventData.location}
                </span>
              </div>
              <div className="border-t border-border" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-semibold">
                  {eventData.price === 0 ? 'FREE' : `N$${eventData.price}`}
                </span>
              </div>
              <div className="border-t border-border" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Check-in Radius</span>
                <span className="font-semibold">{eventData.geofenceRadius}m</span>
              </div>
              <div className="border-t border-border" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Media</span>
                <span className="font-semibold">
                  {eventData.images.length} photos, {eventData.videos.length} videos
                </span>
              </div>
            </div>

            {eventData.description && (
              <div className="glass-card p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Description</p>
                <p className="text-sm text-muted-foreground">{eventData.description}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 6: Success */}
        {step === 6 && createdEvent && (
          <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{ backgroundColor: `${eventData.themeColor}20` }}
            >
              <Check className="w-10 h-10" style={{ color: eventData.themeColor }} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Event Created!</h3>
            <p className="text-muted-foreground text-center mb-8 max-w-md">
              Your event "{createdEvent.name}" is now live! Share the code below so attendees can check in.
            </p>

            <div className="w-64 h-64 bg-white rounded-2xl flex flex-col items-center justify-center mb-6 border-2 border-border p-4">
              <div className="text-center mb-4">
                <p className="text-sm font-medium mb-1" style={{ color: eventData.themeColor }}>
                  Check-in Code
                </p>
                <p className="text-3xl font-mono font-bold tracking-widest">
                  {createdEvent.qrCode}
                </p>
              </div>
              <div className="w-48 h-48 bg-white flex items-center justify-center">
                <QrCode className="w-40 h-40 text-gray-800" />
              </div>
            </div>

            <div className="flex gap-3 w-full max-w-xs">
              <Button 
                variant="outline" 
                className="flex-1 rounded-lg"
                onClick={copyCode}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Code
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 rounded-lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Save QR
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Slim fixed footer */}
      {step < 6 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-border bg-background/95 backdrop-blur-sm shadow-lg">
          <div className="flex gap-3 w-full">
            {step > 1 && (
              <Button 
                variant="outline" 
                className="flex-1 rounded-lg h-12"
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            {step < 5 ? (
              <Button
                className="flex-1 rounded-lg h-12"
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !isStep1Valid) || 
                  (step === 2 && !isStep2Valid) || 
                  (step === 3 && !isStep3Valid)
                }
                style={{ 
                  backgroundColor: eventData.themeColor,
                  borderColor: eventData.themeColor 
                }}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                className="flex-1 rounded-lg h-12"
                onClick={handlePublish}
                style={{ 
                  backgroundColor: eventData.themeColor,
                  borderColor: eventData.themeColor 
                }}
              >
                Publish Event
                <Check className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
          <div className="text-xs text-muted-foreground text-center mt-2">
            Step {step} of 5
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-border bg-background/95 backdrop-blur-sm shadow-lg">
          <Button 
            className="w-full rounded-lg h-12" 
            onClick={onClose}
            style={{ 
              backgroundColor: eventData.themeColor,
              borderColor: eventData.themeColor 
            }}
          >
            Done • Go to Event Dashboard
          </Button>
          <div className="text-xs text-muted-foreground text-center mt-2">
            Event created successfully! Manage it from your dashboard.
          </div>
        </div>
      )}
    </div>
  );      
}
