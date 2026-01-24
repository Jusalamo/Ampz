import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Calendar, Clock, MapPin, DollarSign, Users, Tag, Globe, Loader2, Image, Video, Upload, Trash2, Map as MapIcon } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Event } from '@/lib/types';
import { AmpzButton } from '@/components/ui/ampz-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
}

// Convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export function EditEventModal({ isOpen, onClose, event }: EditEventModalProps) {
  const { updateEvent } = useApp();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'media' | 'location'>('details');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    endTime: '',
    location: '',
    address: '',
    category: '',
    price: 0,
    maxAttendees: 500,
    ticketLink: '',
    geofenceRadius: 50,
    tags: [] as string[],
    coverImage: '',
    images: [] as string[],
    videos: [] as string[],
    coordinates: { lat: 0, lng: 0 },
  });

  const [newTag, setNewTag] = useState('');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Populate form when event changes
  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        description: event.description || '',
        date: event.date || '',
        time: event.time || '',
        endTime: event.endTime || '',
        location: event.location || '',
        address: event.address || '',
        category: event.category || '',
        price: event.price || 0,
        maxAttendees: event.maxAttendees || 500,
        ticketLink: event.ticketLink || event.webTicketsLink || '',
        geofenceRadius: event.geofenceRadius || 50,
        tags: event.tags || [],
        coverImage: event.coverImage || '',
        images: event.images || [],
        videos: event.videos || [],
        coordinates: event.coordinates || { lat: 0, lng: 0 },
      });
    }
  }, [event]);

  // Initialize map when location tab is active
  useEffect(() => {
    if (!isOpen || activeTab !== 'location' || !mapContainerRef.current || !MAPBOX_TOKEN) return;
    
    // Clean up existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [formData.coordinates.lng || 17.0658, formData.coordinates.lat || -22.5609],
      zoom: 14,
    });

    map.on('load', () => {
      // Add marker for current location
      const marker = new mapboxgl.Marker({ draggable: true })
        .setLngLat([formData.coordinates.lng || 17.0658, formData.coordinates.lat || -22.5609])
        .addTo(map);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        setFormData(prev => ({
          ...prev,
          coordinates: { lat: lngLat.lat, lng: lngLat.lng }
        }));
      });

      markerRef.current = marker;
    });

    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      setFormData(prev => ({
        ...prev,
        coordinates: { lat, lng }
      }));
      
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      }
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isOpen, activeTab, formData.coordinates.lat, formData.coordinates.lng]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleChange('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleChange('tags', formData.tags.filter(t => t !== tagToRemove));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const base64 = await fileToBase64(files[i]);
        newImages.push(base64);
      }
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages],
        coverImage: prev.coverImage || newImages[0] || ''
      }));
      
      toast({ title: 'Images added', description: `${newImages.length} image(s) uploaded` });
    } catch (error) {
      toast({ title: 'Upload failed', description: 'Could not upload images', variant: 'destructive' });
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      const newVideos: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const base64 = await fileToBase64(files[i]);
        newVideos.push(base64);
      }
      
      setFormData(prev => ({
        ...prev,
        videos: [...prev.videos, ...newVideos]
      }));
      
      toast({ title: 'Videos added', description: `${newVideos.length} video(s) uploaded` });
    } catch (error) {
      toast({ title: 'Upload failed', description: 'Could not upload videos', variant: 'destructive' });
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: newImages,
        coverImage: prev.coverImage === prev.images[index] ? (newImages[0] || '') : prev.coverImage
      };
    });
  };

  const removeVideo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
  };

  const setCoverImage = (image: string) => {
    setFormData(prev => ({ ...prev, coverImage: image }));
  };

  const handleSubmit = async () => {
    if (!event) return;
    
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Event name is required', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await updateEvent(event.id, {
        name: formData.name,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        endTime: formData.endTime,
        location: formData.location,
        address: formData.address,
        category: formData.category,
        price: formData.price,
        maxAttendees: formData.maxAttendees,
        ticketLink: formData.ticketLink,
        webTicketsLink: formData.ticketLink,
        geofenceRadius: formData.geofenceRadius,
        tags: formData.tags,
        coverImage: formData.coverImage,
        images: formData.images,
        videos: formData.videos,
        coordinates: formData.coordinates,
      });

      if (success) {
        toast({ title: 'Success', description: 'Event updated successfully' });
        onClose();
      } else {
        toast({ title: 'Error', description: 'Failed to update event', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update event',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card rounded-ampz-lg w-full max-w-lg max-h-[90vh] flex flex-col border border-border/20">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold">Edit Event</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 ampz-transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {[
            { key: 'details', label: 'Details', icon: Calendar },
            { key: 'media', label: 'Media', icon: Image },
            { key: 'location', label: 'Location', icon: MapIcon },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                activeTab === tab.key 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'details' && (
            <>
              {/* Event Name */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Event Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter event name"
                  className="rounded-ampz-md"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe your event..."
                  rows={3}
                  className="rounded-ampz-md"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Date
                  </label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    className="rounded-ampz-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Start Time
                  </label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleChange('time', e.target.value)}
                    className="rounded-ampz-md"
                  />
                </div>
              </div>

              {/* End Time */}
              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  End Time (Optional)
                </label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleChange('endTime', e.target.value)}
                  className="rounded-ampz-md"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Event will automatically end at this time
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full h-10 px-3 rounded-ampz-md bg-background border border-input text-sm"
                >
                  <option value="">Select category</option>
                  <option value="Music">Music</option>
                  <option value="Sports">Sports</option>
                  <option value="Tech">Tech</option>
                  <option value="Art">Art</option>
                  <option value="Food">Food & Drink</option>
                  <option value="Networking">Networking</option>
                  <option value="Party">Party</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Price & Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Ticket Price
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.price}
                    onChange={(e) => handleChange('price', Number(e.target.value))}
                    placeholder="0 for free"
                    className="rounded-ampz-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Max Attendees
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.maxAttendees}
                    onChange={(e) => handleChange('maxAttendees', Number(e.target.value))}
                    className="rounded-ampz-md"
                  />
                </div>
              </div>

              {/* WebTickets Link */}
              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  External Ticket Link
                </label>
                <Input
                  type="url"
                  value={formData.ticketLink}
                  onChange={(e) => handleChange('ticketLink', e.target.value)}
                  placeholder="https://webtickets.co.za/..."
                  className="rounded-ampz-md"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Tags
                </label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-ampz-sm"
                    >
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    className="rounded-ampz-md flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <AmpzButton variant="secondary" onClick={handleAddTag}>Add</AmpzButton>
                </div>
              </div>
            </>
          )}

          {activeTab === 'media' && (
            <>
              {/* Images */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Image className="w-4 h-4 text-primary" />
                  Event Images
                </label>
                
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {formData.images.map((img, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img
                        src={img}
                        alt={`Event ${index + 1}`}
                        className={`w-full h-full object-cover rounded-ampz-md ${
                          formData.coverImage === img ? 'ring-2 ring-primary' : ''
                        }`}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-ampz-md flex items-center justify-center gap-2">
                        <button
                          onClick={() => setCoverImage(img)}
                          className="p-1.5 bg-primary rounded-full text-white"
                          title="Set as cover"
                        >
                          <Image className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeImage(index)}
                          className="p-1.5 bg-destructive rounded-full text-white"
                          title="Remove"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      {formData.coverImage === img && (
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary text-white text-xs rounded">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                  
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-muted-foreground/30 rounded-ampz-md flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Add</span>
                  </button>
                </div>
              </div>

              {/* Videos */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" />
                  Event Videos
                </label>
                
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {formData.videos.map((vid, index) => (
                    <div key={index} className="relative group aspect-video">
                      <video
                        src={vid}
                        className="w-full h-full object-cover rounded-ampz-md"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-ampz-md flex items-center justify-center">
                        <button
                          onClick={() => removeVideo(index)}
                          className="p-2 bg-destructive rounded-full text-white"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="aspect-video border-2 border-dashed border-muted-foreground/30 rounded-ampz-md flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Add Video</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'location' && (
            <>
              {/* Location Name */}
              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Location Name
                </label>
                <Input
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="Venue name"
                  className="rounded-ampz-md"
                />
              </div>

              {/* Address */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Street Address</label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Full venue address"
                  className="rounded-ampz-md"
                />
              </div>

              {/* Map */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Pin Location (Click or drag to adjust)
                </label>
                {MAPBOX_TOKEN ? (
                  <div
                    ref={mapContainerRef}
                    className="w-full h-48 rounded-ampz-md overflow-hidden"
                  />
                ) : (
                  <div className="w-full h-48 rounded-ampz-md bg-muted flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Map not available</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Coordinates: {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
                </p>
              </div>

              {/* Geofence Radius */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Check-in Radius: {formData.geofenceRadius}m
                </label>
                <Slider
                  value={[formData.geofenceRadius]}
                  onValueChange={([value]) => handleChange('geofenceRadius', value)}
                  min={10}
                  max={500}
                  step={10}
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Attendees must be within this distance to check in
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-border">
          <AmpzButton variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </AmpzButton>
          <AmpzButton
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </AmpzButton>
        </div>
      </div>
    </div>
  );
}
