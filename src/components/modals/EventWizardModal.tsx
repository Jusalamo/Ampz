import { useState, useRef, useEffect } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Check,
  QrCode,
  Copy,
  Download,
  ImagePlus,
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
import QRCode from 'qrcode';

const MAPBOX_TOKEN =
  'pk.eyJ1IjoianVzYSIsImEiOiJjbWpjanh5amEwbDEwM2dzOXVhbjZ5dzcwIn0.stWdbPHCrf9sKrRJRmShlg';

interface EventWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = ['Music', 'Tech', 'Party', 'Art', 'Food', 'Sports', 'Other'];

export function EventWizardModal({ isOpen, onClose }: EventWizardModalProps) {
  const { addEvent, user } = useApp();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [qrImage, setQrImage] = useState<string | null>(null);

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
    media: [] as File[],
  });

  const [createdEvent, setCreatedEvent] = useState<Event | null>(null);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  /* ---------------- MAP INITIALIZATION ---------------- */

  useEffect(() => {
    if (!isOpen || map.current || !mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12', // ✅ NORMAL COLORED MAP
      center: [eventData.coordinates.lng, eventData.coordinates.lat],
      zoom: 13,
    });

    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      setEventData((prev) => ({
        ...prev,
        coordinates: { lat, lng },
      }));
      placeMarker(lng, lat);
      reverseGeocode(lng, lat);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!map.current) return;
    drawGeofence();
  }, [eventData.geofenceRadius, eventData.coordinates]);

  /* ---------------- MAP HELPERS ---------------- */

  const placeMarker = (lng: number, lat: number) => {
    if (!map.current) return;

    if (!marker.current) {
      marker.current = new mapboxgl.Marker({ color: '#6366F1' })
        .setLngLat([lng, lat])
        .addTo(map.current);
    } else {
      marker.current.setLngLat([lng, lat]);
    }

    map.current.flyTo({ center: [lng, lat], zoom: 14 });
  };

  const drawGeofence = () => {
    if (!map.current) return;

    const { lat, lng } = eventData.coordinates;
    const radiusKm = eventData.geofenceRadius / 1000;
    const points = 64;
    const coords: [number, number][] = [];

    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const dx = radiusKm * Math.cos(angle) / 111.32;
      const dy =
        radiusKm *
        Math.sin(angle) /
        (111.32 * Math.cos((lat * Math.PI) / 180));
      coords.push([lng + dy, lat + dx]);
    }
    coords.push(coords[0]);

    const geojson = {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [coords] },
    };

    if (map.current.getSource('geofence')) {
      (map.current.getSource('geofence') as mapboxgl.GeoJSONSource).setData(
        geojson as any
      );
    } else {
      map.current.addSource('geofence', {
        type: 'geojson',
        data: geojson as any,
      });

      map.current.addLayer({
        id: 'geofence-fill',
        type: 'fill',
        source: 'geofence',
        paint: { 'fill-color': '#6366F1', 'fill-opacity': 0.2 },
      });

      map.current.addLayer({
        id: 'geofence-line',
        type: 'line',
        source: 'geofence',
        paint: { 'line-color': '#6366F1', 'line-width': 2 },
      });
    }
  };

  const reverseGeocode = async (lng: number, lat: number) => {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
    );
    const data = await res.json();
    if (data.features?.length) {
      setEventData((prev) => ({
        ...prev,
        location: data.features[0].text,
        address: data.features[0].place_name,
      }));
    }
  };

  /* ---------------- EVENT CREATION ---------------- */

  const handlePublish = async () => {
    const qrCodeValue = `${eventData.name}-${Date.now()}`;
    const qrImg = await QRCode.toDataURL(qrCodeValue);
    setQrImage(qrImg);

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
      qrCode: qrCodeValue,
      geofenceRadius: eventData.geofenceRadius,
      customTheme: '#6366F1',
      coverImage: '',
      tags: [eventData.category],
      isFeatured: user?.subscription?.tier === 'max',
    };

    addEvent(newEvent);
    setCreatedEvent(newEvent);
    setStep(5);
  };

  /* ---------------- VALIDATION ---------------- */

  const isStep1Valid =
    eventData.name &&
    eventData.category &&
    eventData.date &&
    eventData.time;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between p-5 border-b">
        <h2 className="text-lg font-bold">Create Event</h2>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X />
        </Button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        {step === 1 && (
          <>
            <Input
              className="h-12 rounded-xl"
              placeholder="Event name"
              value={eventData.name}
              onChange={(e) =>
                setEventData({ ...eventData, name: e.target.value })
              }
            />
            <Textarea
              className="rounded-xl"
              placeholder="Description"
              value={eventData.description}
              onChange={(e) =>
                setEventData({
                  ...eventData,
                  description: e.target.value,
                })
              }
            />
          </>
        )}

        {(step === 2 || step === 3) && (
          <>
            <Input
              className="h-12 rounded-xl"
              placeholder="Search location"
              value={eventData.location}
              onChange={(e) =>
                setEventData({ ...eventData, location: e.target.value })
              }
            />

            <div
              ref={mapContainer}
              className="w-full h-[300px] rounded-xl border"
            />

            {step === 3 && (
              <>
                <p className="text-center font-semibold">
                  Radius: {eventData.geofenceRadius}m
                </p>
                <Slider
                  min={10}
                  max={500}
                  step={10}
                  value={[eventData.geofenceRadius]}
                  onValueChange={(v) =>
                    setEventData({
                      ...eventData,
                      geofenceRadius: v[0],
                    })
                  }
                />
              </>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <label className="flex items-center gap-3 border rounded-xl p-4 cursor-pointer">
              <ImagePlus />
              Upload event media
              <input
                type="file"
                multiple
                hidden
                onChange={(e) =>
                  setEventData({
                    ...eventData,
                    media: Array.from(e.target.files || []),
                  })
                }
              />
            </label>
          </>
        )}

        {step === 5 && createdEvent && (
          <div className="text-center space-y-6">
            <img
              src={qrImage || ''}
              alt="QR Code"
              className="mx-auto w-48 h-48"
            />
            <p className="font-mono tracking-widest">
              {createdEvent.qrCode}
            </p>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-6 border-t flex gap-3 pb-10">
        {step > 1 && step < 5 && (
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
        {step < 4 && (
          <Button
            className="flex-1"
            disabled={step === 1 && !isStep1Valid}
            onClick={() => setStep(step + 1)}
          >
            Next
          </Button>
        )}
        {step === 4 && (
          <Button className="flex-1" onClick={handlePublish}>
            Publish Event
          </Button>
        )}
        {step === 5 && (
          <Button className="flex-1" onClick={onClose}>
            Done
          </Button>
        )}
      </div>
    </div>
  );
}
