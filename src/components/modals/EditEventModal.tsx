import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, DollarSign, Users, Tag, Globe, Loader2, Image } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Event } from '@/lib/types';
import { AmpzButton } from '@/components/ui/ampz-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
}

export function EditEventModal({ isOpen, onClose, event }: EditEventModalProps) {
  const { updateEvent } = useApp();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    location: '',
    address: '',
    category: '',
    price: 0,
    maxAttendees: 500,
    ticketLink: '',
    geofenceRadius: 50,
    tags: [] as string[],
    coverImage: '',
  });

  const [newTag, setNewTag] = useState('');

  // Populate form when event changes
  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        description: event.description || '',
        date: event.date || '',
        time: event.time || '',
        location: event.location || '',
        address: event.address || '',
        category: event.category || '',
        price: event.price || 0,
        maxAttendees: event.maxAttendees || 500,
        ticketLink: event.ticketLink || '',
        geofenceRadius: event.geofenceRadius || 50,
        tags: event.tags || [],
        coverImage: event.coverImage || '',
      });
    }
  }, [event]);

  const handleChange = (field: string, value: string | number | string[]) => {
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

  const handleSubmit = async () => {
    if (!event) return;
    
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Event name is required', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateEvent(event.id, {
        name: formData.name,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        address: formData.address,
        category: formData.category,
        price: formData.price,
        maxAttendees: formData.maxAttendees,
        ticketLink: formData.ticketLink,
        geofenceRadius: formData.geofenceRadius,
        tags: formData.tags,
        coverImage: formData.coverImage,
      });

      toast({ title: 'Success', description: 'Event updated successfully' });
      onClose();
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

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                Time
              </label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => handleChange('time', e.target.value)}
                className="rounded-ampz-md"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Location
            </label>
            <Input
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="City, Country"
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
              WebTickets / External Link
            </label>
            <Input
              type="url"
              value={formData.ticketLink}
              onChange={(e) => handleChange('ticketLink', e.target.value)}
              placeholder="https://webtickets.co.za/..."
              className="rounded-ampz-md"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Link to external ticket purchase page
            </p>
          </div>

          {/* Cover Image URL */}
          <div>
            <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
              <Image className="w-4 h-4 text-primary" />
              Cover Image URL
            </label>
            <Input
              type="url"
              value={formData.coverImage}
              onChange={(e) => handleChange('coverImage', e.target.value)}
              placeholder="https://..."
              className="rounded-ampz-md"
            />
          </div>

          {/* Geofence Radius */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Check-in Radius (meters)
            </label>
            <Input
              type="number"
              min={10}
              max={500}
              value={formData.geofenceRadius}
              onChange={(e) => handleChange('geofenceRadius', Number(e.target.value))}
              className="rounded-ampz-md"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Attendees must be within this distance to check in
            </p>
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
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-destructive"
                  >
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
              <AmpzButton variant="secondary" onClick={handleAddTag}>
                Add
              </AmpzButton>
            </div>
          </div>
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
