 import { useState, useRef, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, MapPin, Check, QrCode, Copy, Download } from 'lucide-react';
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
  const { addEvent, user, theme } = useApp();
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
    coordinates: { lat: -22.5609, lng: 17.0658 },
    geofenceRadius: 200,
  });
  const [createdEvent, setCreatedEvent] = useState<Event | null>(null);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const geofenceCircle = useRef<string | null>(null);

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
        coordinates: { lat: -22.5609, lng: 17.0658 },
        geofenceRadius: 200,
      });
      setCreatedEvent(null);
    }
  }, [isOpen]);

  // Initialize map on step 2
  useEffect(() => {
    if (step === 2 && mapContainer.current && !map.current) {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
        center: [eventData.coordinates.lng, eventData.coordinates.lat],
        zoom: 13,
      });

      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        setEventData(prev => ({ ...prev, coordinates: { lat, lng } }));
        updateMarker(lng, lat);
        reverseGeocode(lng, lat);
      });
    }

    return () => {
      if (step !== 2 && step !== 3 && map.current) {
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
      marker.current = new mapboxgl.Marker({ color: '#8B5CF6' })
        .setLngLat([lng, lat])
        .addTo(map.current);
    }

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

      map.current.addLayer({
        id: 'geofence-fill',
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': '#8B5CF6',
          'fill-opacity': 0.2,
        },
      });

      map.current.addLayer({
        id: 'geofence-line',
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#8B5CF6',
          'line-width': 2,
        },
      });
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
        setEventData(prev => ({
          ...prev,
          location: place.text || '',
          address: place.place_name || '',
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
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=NA`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const place = data.features[0];
        const [lng, lat] = place.center;
        setEventData(prev => ({
          ...prev,
          coordinates: { lat, lng },
          location: place.text || query,
          address: place.place_name || '',
        }));
        updateMarker(lng, lat);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
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
      customTheme: '#8B5CF6',
      coverImage: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000000)}?w=800`,
      tags: [eventData.category],
      isFeatured: user?.subscription.tier === 'max',
    };

    addEvent(newEvent);
    setCreatedEvent(newEvent);
    setStep(5);
  };

  const copyCode = () => {
    if (createdEvent) {
      navigator.clipboard.writeText(createdEvent.qrCode);
      toast({ title: 'Code copied!', description: 'Share this code with your attendees' });
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
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
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
                  className="h-12"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={eventData.description}
                  onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                  placeholder="Tell attendees what to expect..."
                  rows={4}
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
                        'px-4 py-2 rounded-full text-sm font-medium transition-all',
                        eventData.category === cat
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border hover:border-primary'
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
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Time *</label>
                  <Input
                    type="time"
                    value={eventData.time}
                    onChange={(e) => setEventData({ ...eventData, time: e.target.value })}
                    className="h-12"
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
                  className="h-12"
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
                className="h-12 pl-12"
              />
            </div>

            {eventData.address && (
              <p className="text-sm text-muted-foreground">{eventData.address}</p>
            )}

            <div
              ref={mapContainer}
              className="w-full h-[300px] rounded-xl overflow-hidden border border-border"
            />

            <p className="text-xs text-muted-foreground text-center">
              Tap on the map to place your event pin
            </p>
          </div>
        )}

        {/* Step 3: Geofence */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-xl font-bold mb-2">Check-in Radius</h3>
              <p className="text-muted-foreground text-sm">
                Set how close attendees need to be to check in
              </p>
            </div>

            <div className="glass-card p-6 text-center">
              <p className="text-4xl font-bold text-primary mb-2">
                {eventData.geofenceRadius}m
              </p>
              <p className="text-muted-foreground text-sm">Check-in radius</p>
            </div>

            <Slider
              value={[eventData.geofenceRadius]}
              onValueChange={(value) => setEventData({ ...eventData, geofenceRadius: value[0] })}
              min={50}
              max={500}
              step={50}
              className="my-6"
            />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>50m</span>
              <span>500m</span>
            </div>

            <div
              ref={mapContainer}
              className="w-full h-[250px] rounded-xl overflow-hidden border border-border"
            />

            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground">
                💡 Larger radius = easier check-in. Smaller radius = more precise location verification.
              </p>
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

            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-semibold">{eventData.name}</span>
              </div>
              <div className="border-t border-border" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
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
                  {eventData.location}
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
            </div>

            {eventData.description && (
              <div className="glass-card p-4">
                <p className="text-sm text-muted-foreground mb-2">Description</p>
                <p className="text-sm">{eventData.description}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Success */}
        {step === 5 && createdEvent && (
          <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-brand-green/20 flex items-center justify-center mb-6">
              <Check className="w-10 h-10 text-brand-green" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Event Created!</h3>
            <p className="text-muted-foreground text-center mb-8">
              Share the code below so attendees can check in
            </p>

            <div className="w-48 h-48 bg-card rounded-2xl flex items-center justify-center mb-4 border border-border">
              <QrCode className="w-32 h-32 text-primary" />
            </div>

            <p className="text-2xl font-mono font-bold tracking-widest mb-6">
              {createdEvent.qrCode}
            </p>

            <div className="flex gap-3 w-full max-w-xs">
              <Button variant="outline" className="flex-1" onClick={copyCode}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Code
              </Button>
              <Button variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Save QR
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {step < 5 && (
        <div className="p-4 border-t border-border flex gap-3">
          {step > 1 && (
            <Button variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          {step < 4 ? (
            <Button
              className="flex-1 gradient-pro glow-purple"
              onClick={() => setStep(step + 1)}
              disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              className="flex-1 gradient-pro glow-purple"
              onClick={handlePublish}
            >
              Publish Event
              <Check className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="p-4 border-t border-border">
          <Button className="w-full gradient-pro glow-purple" onClick={onClose}>
            Done
          </Button>
        </div>
      )}
    </div>
  );      
} 
