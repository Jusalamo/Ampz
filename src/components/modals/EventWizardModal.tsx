import { useState, useRef, useEffect } from 'react';
import { 
  X, ArrowRight, ArrowLeft, MapPin, Check, QrCode, 
  Copy, Download, Upload, Image as ImageIcon, Video 
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
  });
  const [createdEvent, setCreatedEvent] = useState<Event | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

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
      });
      setCreatedEvent(null);
      setQrCodeUrl('');
    }
  }, [isOpen]);

  // Initialize map on step 2
  useEffect(() => {
    if (step === 2 && mapContainer.current && !map.current) {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [eventData.coordinates.lng, eventData.coordinates.lat],
        zoom: 13,
      });

      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        setEventData(prev => ({ ...prev, coordinates: { lat, lng } }));
        updateMarker(lng, lat);
        reverseGeocode(lng, lat);
      });

      // Add navigation control
      map.current.addControl(new mapboxgl.NavigationControl());
    }

    return () => {
      if ((step !== 2 && step !== 3) && map.current) {
        map.current.remove();
        map.current = null;
        marker.current = null;
      }
    };
  }, [step]);

  // Update geofence circle on step 3
  useEffect(() => {
    if (step === 3 && map.current) {
      updateGeofenceCircle();
    }
  }, [step, eventData.geofenceRadius, eventData.coordinates]);

  const updateMarker = (lng: number, lat: number) => {
    if (!map.current) return;

    if (marker.current) {
      marker.current.setLngLat([lng, lat]);
    } else {
      marker.current = new mapboxgl.Marker({ 
        color: '#8B5CF6',
        draggable: true 
      })
        .setLngLat([lng, lat])
        .addTo(map.current);

      marker.current.on('dragend', () => {
        const newLngLat = marker.current!.getLngLat();
        setEventData(prev => ({ 
          ...prev, 
          coordinates: { lat: newLngLat.lat, lng: newLngLat.lng } 
        }));
        reverseGeocode(newLngLat.lng, newLngLat.lat);
      });
    }

    map.current.flyTo({ center: [lng, lat], zoom: 14 });
  };

  const updateGeofenceCircle = () => {
    if (!map.current) return;

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
        id: 'geofence-fill',
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': '#8B5CF6',
          'fill-opacity': 0.1,
        },
      });

      map.current.addLayer({
        id: 'geofence-line',
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#8B5CF6',
          'line-width': 2,
          'line-dasharray': [2, 1],
        },
      });
    }
  };

  const reverseGeocode = async (lng: number, lat: number) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=address`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const addressFeature = data.features.find((f: any) => f.place_type.includes('address'));
        const streetName = addressFeature ? addressFeature.text : '';
        
        const placeFeature = data.features.find((f: any) => f.place_type.includes('place'));
        const placeName = placeFeature ? placeFeature.text : '';
        
        const fullAddress = data.features[0]?.place_name || '';
        
        setEventData(prev => ({
          ...prev,
          location: placeName || streetName,
          streetName: streetName || placeName,
          address: fullAddress,
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
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=NA&types=address,poi,place`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const place = data.features[0];
        const [lng, lat] = place.center;
        setEventData(prev => ({
          ...prev,
          coordinates: { lat, lng },
          location: place.text || query,
          streetName: place.properties?.address || place.text,
          address: place.place_name || '',
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
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setEventData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newVideos = Array.from(files).map(file => URL.createObjectURL(file));
      setEventData(prev => ({
        ...prev,
        videos: [...prev.videos, ...newVideos]
      }));
    }
  };

  const generateQRCode = async (text: string): Promise<string> => {
    try {
      // Dynamic import to avoid build issues
      const QRCode = (await import('qrcode')).default;
      return await QRCode.toDataURL(text, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (err) {
      console.error('QR Code generation error:', err);
      // Return a fallback
      return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="white"/><text x="200" y="200" text-anchor="middle" fill="black">QR Code Error</text></svg>';
    }
  };

  const handlePublish = async () => {
    const eventId = crypto.randomUUID();
    const qrData = `${eventId}-${eventData.name.replace(/\s+/g, '-').toUpperCase()}`;
    
    // Generate QR code
    try {
      const qrDataUrl = await generateQRCode(qrData);
      setQrCodeUrl(qrDataUrl);
    } catch (err) {
      console.error('QR Code generation error:', err);
    }
    
    const newEvent: Event = {
      id: eventId,
      name: eventData.name,
      description: eventData.description,
      category: eventData.category,
      location: eventData.location,
      address: eventData.address,
      streetName: eventData.streetName,
      coordinates: eventData.coordinates,
      date: eventData.date,
      time: eventData.time,
      price: eventData.price,
      currency: 'NAD',
      maxAttendees: 500,
      attendees: 0,
      organizerId: user?.id || '',
      qrCode: qrData,
      geofenceRadius: eventData.geofenceRadius,
      images: eventData.images,
      videos: eventData.videos,
      customTheme: '#8B5CF6',
      coverImage: eventData.images[0] || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000000)}?w=800`,
      tags: [eventData.category],
      isFeatured: user?.subscription?.tier === 'max',
    };

    addEvent(newEvent);
    setCreatedEvent(newEvent);
    setStep(5);
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

  const saveQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `event-qr-${createdEvent?.qrCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'QR Code saved!',
        description: 'QR code has been downloaded to your device'
      });
    }
  };

  const isStep1Valid = eventData.name && eventData.category && eventData.date && eventData.time;
  const isStep2Valid = eventData.coordinates.lat !== 0 && eventData.location;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold">Create Event</h2>
          {step < 5 && (
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={cn(
                    'w-8 h-1 rounded-full transition-colors',
                    s <= step ? 'bg-primary' : 'bg-muted'
                  )}
                />
              ))}
            </div>
          )}
        </div>
        <button 
          onClick={onClose} 
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-accent transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
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
                  className="h-12 rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={eventData.description}
                  onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                  placeholder="Tell attendees what to expect..."
                  rows={4}
                  className="rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Category *</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEventData({ ...eventData, category: cat })}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        eventData.category === cat
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border hover:border-primary hover:bg-accent'
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
                    className="h-12 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Time *</label>
                  <Input
                    type="time"
                    value={eventData.time}
                    onChange={(e) => setEventData({ ...eventData, time: e.target.value })}
                    className="h-12 rounded-lg"
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
                  className="h-12 rounded-lg"
                  min={0}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
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
                className="h-12 pl-12 rounded-lg"
              />
            </div>

            {eventData.streetName && (
              <div className="flex items-center gap-2 p-3 bg-accent rounded-lg">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{eventData.streetName}</span>
              </div>
            )}

            {eventData.address && (
              <p className="text-sm text-muted-foreground">{eventData.address}</p>
            )}

            <div
              ref={mapContainer}
              className="w-full h-[300px] rounded-xl overflow-hidden border border-border mt-4"
            />

            <p className="text-xs text-muted-foreground text-center mt-2">
              Click on the map to place your event pin, or drag the marker
            </p>
          </div>
        )}

        {/* Step 3: Media & Radius */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-xl font-bold mb-2">Media & Check-in Settings</h3>
              <p className="text-muted-foreground text-sm">Add photos/videos and set check-in radius</p>
            </div>

            {/* Media Upload Section */}
            <div className="space-y-4">
              <h4 className="font-semibold">Event Media</h4>
              
              {/* Image Upload */}
              <div>
                <label className="text-sm font-medium mb-2 block">Upload Images</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer block">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">Click to upload images</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                  </label>
                </div>
                
                {eventData.images.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {eventData.images.map((img, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                        <img 
                          src={img} 
                          alt={`Event ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Upload */}
              <div>
                <label className="text-sm font-medium mb-2 block">Upload Videos</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    id="video-upload"
                    accept="video/*"
                    multiple
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  <label htmlFor="video-upload" className="cursor-pointer block">
                    <Video className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">Click to upload videos</p>
                    <p className="text-xs text-muted-foreground">MP4, MOV up to 50MB</p>
                  </label>
                </div>
                
                {eventData.videos.length > 0 && (
                  <div className="mt-3">
                    {eventData.videos.map((video, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-accent rounded-lg mb-2">
                        <Video className="w-4 h-4 text-primary" />
                        <span className="text-sm truncate">Video {index + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Radius Slider */}
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">Check-in Radius</h4>
                  <span className="text-2xl font-bold text-primary">
                    {eventData.geofenceRadius}m
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Set how close attendees need to be to check in (10-500 meters)
                </p>

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

                {/* Map Preview with Radius */}
                <div className="mt-6">
                  <p className="text-sm font-medium mb-2">Radius Preview</p>
                  <div
                    ref={mapContainer}
                    className="w-full h-[250px] rounded-xl overflow-hidden border border-border"
                  />
                </div>

                <div className="mt-4 p-4 bg-accent rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💡 <span className="font-medium">Tip:</span> Larger radius = easier check-in. 
                    Smaller radius = more precise location verification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-xl font-bold mb-2">Review Your Event</h3>
              <p className="text-muted-foreground text-sm">Make sure everything looks good</p>
            </div>

            <div className="glass-card p-6 space-y-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-semibold text-right">{eventData.name}</span>
              </div>
              <div className="border-t border-border" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-lg text-sm">
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
                  {eventData.images.length} images, {eventData.videos.length} videos
                </span>
              </div>
            </div>

            {eventData.description && (
              <div className="glass-card p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Description</p>
                <p className="text-sm">{eventData.description}</p>
              </div>
            )}

            {/* Media Preview */}
            {(eventData.images.length > 0 || eventData.videos.length > 0) && (
              <div className="glass-card p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-3">Media Preview</p>
                {eventData.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {eventData.images.slice(0, 2).map((img, index) => (
                      <div key={index} className="aspect-video rounded-lg overflow-hidden">
                        <img 
                          src={img} 
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
                {eventData.videos.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-primary" />
                    <span className="text-sm">{eventData.videos.length} video(s) uploaded</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Success */}
        {step === 5 && createdEvent && (
          <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-center">Event Created Successfully!</h3>
            <p className="text-muted-foreground text-center mb-8 max-w-sm">
              Share the QR code below so attendees can check in at your event location
            </p>

            {/* QR Code Display */}
            <div className="w-64 h-64 bg-white p-4 rounded-2xl flex items-center justify-center mb-6 border border-border shadow-lg">
              {qrCodeUrl ? (
                <img 
                  src={qrCodeUrl} 
                  alt="Event QR Code" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-gray-300" />
                </div>
              )}
            </div>

            {/* Event Code */}
            <div className="mb-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">Event Code</p>
              <p className="text-2xl font-mono font-bold tracking-wider bg-accent px-4 py-2 rounded-lg">
                {createdEvent.qrCode}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full max-w-xs">
              <Button 
                variant="outline" 
                className="flex-1 h-12 rounded-lg"
                onClick={copyCode}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Code
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 h-12 rounded-lg"
                onClick={saveQRCode}
              >
                <Download className="w-4 h-4 mr-2" />
                Save QR
              </Button>
            </div>

            {/* Additional Info */}
            <div className="mt-8 p-4 bg-accent rounded-lg w-full max-w-sm">
              <p className="text-sm text-muted-foreground text-center">
                📍 <span className="font-medium">Location:</span> {createdEvent.streetName || createdEvent.location}
              </p>
              <p className="text-sm text-muted-foreground text-center mt-1">
                🎯 <span className="font-medium">Check-in Radius:</span> {createdEvent.geofenceRadius}m
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Fixed with proper spacing */}
      {step < 5 && (
        <div className="p-4 border-t border-border flex gap-3 mt-auto">
          {step > 1 && (
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-lg"
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          {step < 4 ? (
            <Button
              className="flex-1 h-12 gradient-pro glow-purple rounded-lg"
              onClick={() => setStep(step + 1)}
              disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              className="flex-1 h-12 gradient-pro glow-purple rounded-lg"
              onClick={handlePublish}
            >
              Publish Event
              <Check className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="p-4 border-t border-border mt-auto">
          <Button 
            className="w-full h-12 gradient-pro glow-purple rounded-lg mb-4"
            onClick={onClose}
          >
            Done
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            You can manage this event from the "My Events" section
          </p>
        </div>
      )}
    </div>
  );
}
