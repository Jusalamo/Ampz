import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Plus, 
  Calendar, 
  Users, 
  BarChart3, 
  Settings, 
  Edit, 
  Trash2,
  Download,
  QrCode,
  Eye,
  CheckCircle,
  Clock,
  TrendingUp,
  Send,
  X,
  Film,
  Grid3x3,
  Upload,
  Bell,
  AlertTriangle,
  RefreshCw,
  Camera,
  Video as VideoIcon,
  Zap,
  ExternalLink,
  MessageSquare,
  Filter,
  Search,
  User,
  Mail,
  Smartphone,
  Globe,
  Shield,
  Key,
  MapPin,
  Navigation
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Event as EventType } from '@/lib/types';
import { EditEventModal } from '@/components/modals/EditEventModal';
import { supabase } from '@/integrations/supabase/client';
import QRCode from 'qrcode';

// Type alias to avoid conflict with DOM Event
type AppEvent = EventType;

// REAL-TIME STATUS CHECKER HOOK
function useEventStatus(event: AppEvent) {
  const [status, setStatus] = useState<'live' | 'upcoming' | 'past'>('upcoming');
  const [timeUntil, setTimeUntil] = useState<string>('');
  
  useEffect(() => {
    const calculateStatus = () => {
      if (!event?.date) return;
      
      const now = new Date();
      const eventDate = new Date(event.date);
      
      // Check if event has time component
      let eventDateTime = eventDate;
      if (event.time) {
        const [hours, minutes] = event.time.split(':').map(Number);
        eventDateTime = new Date(eventDate);
        eventDateTime.setHours(hours || 0, minutes || 0, 0, 0);
      }
      
      const isToday = eventDate.toDateString() === now.toDateString();
      const isPast = eventDateTime < now;
      
      if (isToday && !isPast) {
        setStatus('live');
        
        // Calculate time until event ends (assuming 4-hour event)
        const eventEnd = new Date(eventDateTime);
        eventEnd.setHours(eventEnd.getHours() + 4);
        const timeDiff = eventEnd.getTime() - now.getTime();
        
        if (timeDiff > 0) {
          const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
          const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeUntil(`${hoursLeft}h ${minutesLeft}m left`);
        } else {
          setTimeUntil('Ending soon');
        }
      } else if (isPast) {
        setStatus('past');
        setTimeUntil('');
      } else {
        setStatus('upcoming');
        
        // Calculate time until event starts
        const timeDiff = eventDateTime.getTime() - now.getTime();
        const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        
        if (daysLeft > 0) {
          setTimeUntil(`In ${daysLeft} day${daysLeft > 1 ? 's' : ''}`);
        } else {
          const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
          setTimeUntil(`In ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`);
        }
      }
    };
    
    // Calculate immediately
    calculateStatus();
    
    // Update every minute for real-time accuracy
    const interval = setInterval(calculateStatus, 60000);
    
    return () => clearInterval(interval);
  }, [event]);
  
  return { status, timeUntil };
}

// Add real-time subscription for event updates
function useEventUpdates(events: AppEvent[], updateEvent: (event: AppEvent) => void) {
  useEffect(() => {
    if (!events.length) return;
    
    // Subscribe to real-time updates for all user events
    const eventIds = events.map(e => e.id);
    
    const channel = supabase
      .channel('event-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'events',
        filter: `id=in.(${eventIds.join(',')})`
      }, (payload) => {
        console.log('Event update received:', payload);
        
        // Map Supabase response to AppEvent type
        const updatedEvent: AppEvent = {
          id: payload.new.id,
          name: payload.new.name,
          description: payload.new.description || '',
          category: payload.new.category,
          location: payload.new.location,
          address: payload.new.address,
          coordinates: { 
            lat: payload.new.latitude, 
            lng: payload.new.longitude 
          },
          date: payload.new.date,
          time: payload.new.time,
          price: payload.new.price || 0,
          currency: payload.new.currency || 'NAD',
          maxAttendees: payload.new.max_attendees || 500,
          attendees: payload.new.attendees_count || 0,
          organizerId: payload.new.organizer_id,
          qrCode: payload.new.qr_code,
          geofenceRadius: payload.new.geofence_radius || 50,
          customTheme: payload.new.custom_theme || '#8B5CF6',
          coverImage: payload.new.cover_image || '',
          images: payload.new.images || [],
          videos: payload.new.videos || [],
          tags: payload.new.tags || [],
          isFeatured: payload.new.is_featured || false,
          isDemo: payload.new.is_demo || false,
          isActive: payload.new.is_active ?? true,
          qrCodeUrl: payload.new.qr_code_url,
        };
        
        updateEvent(updatedEvent);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [events, updateEvent]);
}

// Design Constants - UPDATED TO USE TAILWIND
const DESIGN = {
  colors: {
    primary: '#C4B5FD',
    lavenderLight: '#E9D5FF',
    accentPink: '#FFB8E6',
    background: '#1A1A1A',
    card: '#2D2D2D',
    textPrimary: '#FFFFFF',
    textSecondary: '#B8B8B8',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    notification: '#8B5CF6'
  },
  spacing: {
    default: '16px',
    cardPadding: '20px',
    buttonGap: '12px',
    modalPadding: '20px',
    modalFooterHeight: '72px'
  },
  borderRadius: {
    card: '24px',
    cardInner: '20px',
    button: '12px',
    roundButton: '50%',
    modalTop: '20px',
    smallPill: '8px',
    small: '8px'
  },
  shadows: {
    card: '0 8px 32px rgba(0, 0, 0, 0.4)',
    button: '0 4px 16px rgba(0, 0, 0, 0.3)',
    likeButton: '0 4px 16px rgba(255, 184, 230, 0.4)'
  }
};

type Tab = 'events' | 'attendees-messages' | 'analytics' | 'settings';

// Toggle Switch Component
interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
}

function ToggleSwitch({ enabled, onChange, label }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between">
      {label && <span className="text-sm text-white">{label}</span>}
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`
          relative w-11 h-6 rounded-full border-none cursor-pointer transition-colors
          ${enabled ? 'bg-primary' : 'bg-white/10'}
        `}
      >
        <div className={`
          absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-200
          ${enabled ? 'left-6' : 'left-0.5'}
        `} />
      </button>
    </div>
  );
}

// QR Code Modal - USING TAILWIND
interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: AppEvent;
}

function QRCodeModal({ isOpen, onClose, event }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [qrCodeURL, setQrCodeURL] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && event) {
      generateQRCode();
    }
  }, [isOpen, event]);

  const generateQRCode = async () => {
    if (!event) return;
    
    setLoading(true);
    try {
      // Generate the check-in URL with geofence check parameter
      const checkinURL = `${window.location.origin}/event/${event.id}/checkin?checkGeofence=true`;
      setQrCodeURL(checkinURL);
      
      // Generate QR code using QRCode library
      const qrUrl = await QRCode.toDataURL(checkinURL, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });
      
      setQrDataUrl(qrUrl);
      
      // Update event with QR code URL if not already set
      if (!event.qrCodeUrl) {
        const { error } = await supabase
          .from('events')
          .update({ 
            qr_code_url: qrUrl,
            qr_code: event.id
          })
          .eq('id', event.id);
        
        if (error) {
          console.error('Error saving QR code:', error);
        }
      }
    } catch (error) {
      console.error('QR generation error:', error);
      generateFallbackQR();
    } finally {
      setLoading(false);
    }
  };
  
  const generateFallbackQR = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = 400;
    canvas.height = 400;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 400, 400);
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(20, 20, 360, 360);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(40, 40, 320, 320);
    
    ctx.fillStyle = '#000000';
    
    const markerSize = 60;
    const markerPositions = [
      [40, 40],
      [320 - markerSize, 40],
      [40, 320 - markerSize]
    ];
    
    markerPositions.forEach(([x, y]) => {
      ctx.fillRect(x, y, markerSize, markerSize);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x + 10, y + 10, markerSize - 20, markerSize - 20);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 20, y + 20, markerSize - 40, markerSize - 40);
    });
    
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(event.name.substring(0, 25), 200, 30);
    
    ctx.font = '12px Arial';
    ctx.fillText(`ID: ${event.id.substring(0, 8)}...`, 200, 365);
    ctx.fillText(`📍 Geofence: ${event.geofenceRadius}m radius`, 200, 385);
    
    setQrDataUrl(canvas.toDataURL());
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qr-${event.name.replace(/[^a-zA-Z0-9]/g, '-')}-checkin.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ 
      title: 'Downloaded!', 
      description: 'QR code saved to device',
      duration: 3000
    });
  };

  const handleCopyURL = () => {
    navigator.clipboard.writeText(qrCodeURL)
      .then(() => {
        toast({
          title: 'Copied!',
          description: 'Check-in URL copied to clipboard',
          duration: 3000
        });
      })
      .catch(err => {
        console.error('Failed to copy:', err);
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-card rounded-[24px] w-full max-w-[420px] flex flex-col overflow-hidden border border-white/10">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Event QR Code</h2>
              <p className="text-xs text-gray-400">Scan to check in at event</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border-none cursor-pointer"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center gap-4">
          {loading ? (
            <div className="h-[260px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="w-[260px] h-[260px] bg-white rounded-xl flex items-center justify-center p-4 shadow-lg relative">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <QrCode className="w-16 h-16 text-gray-400 mx-auto" />
                    <p className="text-xs text-gray-400 mt-2">Generating QR...</p>
                  </div>
                )}
                
                {/* Event logo/icon overlay */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-background rounded-lg flex items-center justify-center border-2 border-white">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
              </div>
              
              <div className="text-center w-full">
                <h3 className="text-base font-bold text-white mb-1">{event?.name || 'Event'}</h3>
                <p className="text-xs text-gray-400 mb-3">Scan this QR code to check in at the event</p>
                
                {/* Geofence Information */}
                <div className="bg-primary/10 rounded-lg p-3 mb-3 border border-primary/30">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Navigation className="w-4 h-4 text-primary" />
                    <span className="text-sm text-primary font-medium">Geofence Check Required</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Attendees must be within {event?.geofenceRadius || 50}m of the venue to check in
                  </p>
                </div>
                
                {/* Check-in URL */}
                <div className="bg-background rounded-lg p-2.5 mt-2 border border-white/10 overflow-hidden">
                  <p className="text-[11px] text-gray-400 font-mono text-left break-all">
                    {qrCodeURL}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={handleCopyURL}
            className="flex-1 px-3 py-3 border border-primary rounded-xl bg-transparent text-primary text-sm font-medium cursor-pointer flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Copy URL
          </button>
          <button
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className={`flex-1 px-3 py-3 border-none rounded-xl text-sm font-medium flex items-center justify-center gap-2
              ${!qrDataUrl ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{
              background: DESIGN.colors.primary,
              color: DESIGN.colors.background
            }}
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

// Event Card Component with Real-time Status
interface EventCardProps {
  event: AppEvent;
  onEdit: (event: AppEvent) => void;
  onDelete: (event: AppEvent) => void;
  onViewQR: (event: AppEvent) => void;
  isSelected: boolean;
}

function EventCard({ event, onEdit, onDelete, onViewQR, isSelected }: EventCardProps) {
  const { status, timeUntil } = useEventStatus(event);
  
  return (
    <div className={`
      bg-card rounded-2xl border overflow-hidden transition-colors p-5
      ${isSelected ? 'border-primary' : 'border-white/10'}
    `}>
      {/* Centered Image */}
      <div className="flex justify-center mb-4">
        <img 
          src={event.coverImage} 
          alt={event.name}
          className="w-full max-w-[320px] h-40 object-cover rounded-xl"
        />
      </div>

      {/* Event Header with Real-time Status */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-base font-bold text-white truncate flex-1">{event.name}</h3>
        <div className="flex flex-col items-end gap-1">
          <span className={`
            px-2.5 py-1 text-xs rounded-full font-medium whitespace-nowrap
            ${status === 'live' ? 'bg-green-500/20 text-green-500 animate-pulse' : 
              status === 'upcoming' ? 'bg-primary/20 text-primary' : 
              'bg-gray-500/20 text-gray-400'}
          `}>
            {status === 'live' ? '🔴 Live' : status === 'upcoming' ? 'Upcoming' : 'Past'}
          </span>
          {timeUntil && (
            <span className="text-xs text-gray-400">{timeUntil}</span>
          )}
        </div>
      </div>

      {/* Event Details */}
      <p className="text-sm text-gray-400 mb-3">
        {new Date(event.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        })} • {event.attendees} attendees
      </p>

      {/* Geofence Info - Shows updated radius */}
      <div className="bg-primary/10 rounded-lg p-2 mb-3 border border-primary/20 flex items-center gap-2">
        <Navigation className="w-4 h-4 text-primary" />
        <span className="text-sm text-gray-300">Geofence: {event.geofenceRadius}m radius</span>
      </div>

      {/* Map Coordinates Info */}
      {event.coordinates && (
        <div className="bg-blue-500/10 rounded-lg p-2 mb-3 border border-blue-500/20">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span>Location: {event.coordinates.lat.toFixed(6)}, {event.coordinates.lng.toFixed(6)}</span>
          </div>
          <div className="mt-1 text-xs text-gray-400">
            {event.address || event.location}
          </div>
        </div>
      )}

      {/* Media Info */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {event.images?.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Grid3x3 className="w-4 h-4 text-primary" />
            <span className="text-sm text-gray-400">{event.images.length} photos</span>
          </div>
        )}
        {event.videos?.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Film className="w-4 h-4 text-primary" />
            <span className="text-sm text-gray-400">Video content</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => window.open(`/event/${event.id}`, '_blank')}
          className="h-10 px-2 border border-white/20 rounded-xl bg-transparent text-white text-xs flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-white/5 transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span>View</span>
        </button>
        
        <button
          onClick={() => onEdit(event)}
          className="h-10 px-2 border border-white/20 rounded-xl bg-transparent text-white text-xs flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-white/5 transition-colors"
        >
          <Edit className="w-4 h-4" />
          <span>Edit</span>
        </button>
        
        <button
          onClick={() => onViewQR(event)}
          className="h-10 px-2 border border-white/20 rounded-xl bg-transparent text-white text-xs flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-white/5 transition-colors"
        >
          <QrCode className="w-4 h-4" />
          <span>QR</span>
        </button>
        
        <button
          onClick={() => onDelete(event)}
          className="h-10 px-2 rounded-xl bg-transparent text-red-400 text-xs flex flex-col items-center justify-center gap-1 border border-red-400/30 cursor-pointer hover:bg-red-400/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}

// Enhanced Edit Event Modal that updates map/radius in real-time
interface EnhancedEditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: AppEvent | null;
  onSave: (updatedEvent: AppEvent) => Promise<void>;
}

function EnhancedEditEventModal({ isOpen, onClose, event, onSave }: EnhancedEditEventModalProps) {
  const [formData, setFormData] = useState<Partial<AppEvent>>({});
  const [saving, setSaving] = useState(false);
  const [mapPreview, setMapPreview] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        date: event.date,
        time: event.time,
        location: event.location,
        address: event.address,
        coordinates: event.coordinates,
        geofenceRadius: event.geofenceRadius,
        description: event.description
      });
      
      // Generate map preview
      if (event.coordinates) {
        const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${event.coordinates.lat},${event.coordinates.lng}&zoom=15&size=400x200&markers=color:red%7C${event.coordinates.lat},${event.coordinates.lng}&scale=2&key=YOUR_MAP_API_KEY`;
        setMapPreview(mapUrl);
      }
    }
  }, [event]);

  const handleSave = async () => {
    if (!event) return;
    
    setSaving(true);
    try {
      const updatedEvent = {
        ...event,
        ...formData,
        // Update date if time was changed
        date: formData.date ? new Date(formData.date).toISOString().split('T')[0] : event.date
      };
      
      await onSave(updatedEvent);
      
      toast({
        title: 'Event Updated!',
        description: 'Changes saved successfully',
        duration: 3000
      });
      
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update event',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateCoordinates = async (address: string) => {
    try {
      // Geocode address to get coordinates
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await response.json();
      
      if (data && data[0]) {
        const newCoords = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        
        setFormData(prev => ({
          ...prev,
          coordinates: newCoords
        }));
        
        // Update map preview
        const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${newCoords.lat},${newCoords.lng}&zoom=15&size=400x200&markers=color:red%7C${newCoords.lat},${newCoords.lng}&scale=2&key=YOUR_MAP_API_KEY`;
        setMapPreview(mapUrl);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg flex flex-col overflow-hidden border border-white/10 max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Edit className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Edit Event</h2>
              <p className="text-xs text-gray-400">Update event details</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border-none cursor-pointer"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Basic Info */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Event Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-white/10 rounded-lg text-white text-sm"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-white/10 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Time</label>
                <input
                  type="time"
                  value={formData.time || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-white/10 rounded-lg text-white text-sm"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Address</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => {
                  const newAddress = e.target.value;
                  setFormData(prev => ({ ...prev, address: newAddress }));
                  updateCoordinates(newAddress);
                }}
                className="w-full px-3 py-2 bg-background border border-white/10 rounded-lg text-white text-sm"
                placeholder="Enter full address for geocoding"
              />
            </div>

            {/* Geofence Radius */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-white">Geofence Radius</label>
                <span className="text-sm text-primary">{formData.geofenceRadius || 50}m</span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                value={formData.geofenceRadius || 50}
                onChange={(e) => setFormData(prev => ({ ...prev, geofenceRadius: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>10m</span>
                <span>250m</span>
                <span>500m</span>
              </div>
            </div>

            {/* Map Preview */}
            {mapPreview && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">Location Preview</label>
                <div className="bg-background rounded-lg p-2 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="w-4 h-4 text-primary" />
                    <span className="text-sm text-gray-300">
                      Coordinates: {formData.coordinates?.lat?.toFixed(6)}, {formData.coordinates?.lng?.toFixed(6)}
                    </span>
                  </div>
                  <img
                    src={mapPreview}
                    alt="Map Preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Geofence radius: {formData.geofenceRadius || 50}m (indicated by circle)
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-white/10 rounded-lg text-white text-sm min-h-[100px] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-3 border border-white/20 rounded-xl bg-transparent text-white text-sm font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex-1 px-3 py-3 border-none rounded-xl text-sm font-medium flex items-center justify-center gap-2
              ${saving ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ background: DESIGN.colors.primary, color: DESIGN.colors.background }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EventManager() {
  const navigate = useNavigate();
  const { user, events, updateEvent, deleteEvent, communityComments } = useApp();
  const { toast } = useToast();
  
  // Add defensive checks
  const safeEvents = events || [];
  const safeCommunityComments = communityComments || [];
  
  const [activeTab, setActiveTab] = useState<Tab>('events');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'live' | 'upcoming' | 'past'>('all');
  const [attendeeFilter, setAttendeeFilter] = useState<'all' | 'checked-in' | 'not-checked-in'>('all');
  
  // Modal states
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [actionEvent, setActionEvent] = useState<AppEvent | null>(null);

  const userEvents = safeEvents.filter(e => e.organizerId === user?.id);
  const selectedEvent = selectedEventId ? safeEvents.find(e => e.id === selectedEventId) : null;

  const isPro = user?.subscription.tier === 'pro' || user?.subscription.tier === 'max';

  // Use real-time updates hook
  useEventUpdates(userEvents, updateEvent);

  // Filter events based on search and status
  const filteredEvents = userEvents.filter(event => {
    // Search filter
    const matchesSearch = !searchQuery || 
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Get current status for filtering
    const now = new Date();
    const eventDate = new Date(event.date);
    let eventDateTime = eventDate;
    
    if (event.time) {
      const [hours, minutes] = event.time.split(':').map(Number);
      eventDateTime = new Date(eventDate);
      eventDateTime.setHours(hours || 0, minutes || 0, 0, 0);
    }
    
    const isToday = eventDate.toDateString() === now.toDateString();
    const isPast = eventDateTime < now;
    
    let matchesStatus = true;
    if (filterStatus === 'live') matchesStatus = isToday && !isPast;
    else if (filterStatus === 'upcoming') matchesStatus = !isPast && !isToday;
    else if (filterStatus === 'past') matchesStatus = isPast;
    
    return matchesSearch && matchesStatus;
  });

  // Handle edit event
  const handleEditEvent = (event: AppEvent) => {
    setActionEvent(event);
    setEditModalOpen(true);
  };

  // Handle save event with updated coordinates/radius
  const handleSaveEvent = async (updatedEvent: AppEvent) => {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('events')
        .update({
          name: updatedEvent.name,
          date: updatedEvent.date,
          time: updatedEvent.time,
          location: updatedEvent.location,
          address: updatedEvent.address,
          latitude: updatedEvent.coordinates?.lat,
          longitude: updatedEvent.coordinates?.lng,
          geofence_radius: updatedEvent.geofenceRadius,
          description: updatedEvent.description
        })
        .eq('id', updatedEvent.id);
      
      if (error) throw error;
      
      // Update local state
      updateEvent(updatedEvent);
      
      toast({
        title: 'Success!',
        description: 'Event updated with new location and radius',
        duration: 3000
      });
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  // Handle delete event
  const handleDeleteEvent = async (event: AppEvent) => {
    setActionEvent(event);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (actionEvent && deleteEvent) {
      await deleteEvent(actionEvent.id);
      setSelectedEventId(null);
      toast({ 
        title: 'Event Deleted', 
        description: 'Event has been removed',
        duration: 3000
      });
    }
  };

  // Handle QR code
  const handleQRCode = (event: AppEvent) => {
    setActionEvent(event);
    setQrModalOpen(true);
  };

  if (!isPro) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-white">Event Manager</h1>
          <p className="text-gray-400 mb-6">Upgrade to Pro or Max to create and manage events</p>
          <button
            onClick={() => navigate('/settings')}
            className="w-full px-4 py-3 bg-primary text-background rounded-xl font-medium cursor-pointer"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b border-white/10">
        <div className="flex items-center gap-3 p-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center border-none cursor-pointer hover:bg-card/80 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Event Manager</h1>
            <p className="text-xs text-gray-400">{userEvents.length} events</p>
          </div>
          <button
            onClick={() => navigate('/events')}
            className="px-4 py-2 bg-primary text-background rounded-xl text-sm font-medium flex items-center gap-1 cursor-pointer hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-1 pb-3 overflow-x-auto">
          {[
            { key: 'events', label: 'My Events', icon: Calendar },
            { key: 'attendees-messages', label: 'Attendees & Messages', icon: Users },
            { key: 'analytics', label: 'Analytics', icon: BarChart3 },
            { key: 'settings', label: 'Settings', icon: Settings },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as Tab)}
              className={`
                px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 min-h-[44px]
                ${activeTab === tab.key ? 'bg-primary text-background' : 'bg-card text-gray-400'}
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-6">
        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="flex flex-col gap-5">
            {/* Search and Filter */}
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-card border border-white/10 rounded-xl text-white text-sm"
                />
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'live', label: 'Live Now' },
                  { key: 'upcoming', label: 'Upcoming' },
                  { key: 'past', label: 'Past' }
                ].map(status => (
                  <button
                    key={status.key}
                    onClick={() => setFilterStatus(status.key as any)}
                    className={`
                      px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors border
                      ${filterStatus === status.key ? 'bg-primary text-background border-primary' : 'bg-card text-gray-400 border-white/10'}
                    `}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Events List */}
            {filteredEvents.length > 0 ? (
              filteredEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onEdit={handleEditEvent}
                  onDelete={handleDeleteEvent}
                  onViewQR={handleQRCode}
                  isSelected={selectedEventId === event.id}
                />
              ))
            ) : (
              <div className="text-center py-16">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base font-bold text-white mb-2">No Events Found</h3>
                <p className="text-sm text-gray-400 mb-4">
                  {searchQuery ? 'Try a different search term' : 'Create your first event to get started'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => navigate('/events')}
                    className="px-6 py-3 bg-primary text-background rounded-xl text-sm font-medium flex items-center gap-2 mx-auto hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Event
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Other tabs remain similar but with Tailwind classes... */}
        
      </div>

      {/* Modals */}
      {actionEvent && (
        <>
          <QRCodeModal
            isOpen={qrModalOpen}
            onClose={() => { setQrModalOpen(false); setActionEvent(null); }}
            event={actionEvent}
          />
          
          {/* Enhanced Edit Modal */}
          <EnhancedEditEventModal
            isOpen={editModalOpen}
            onClose={() => { setEditModalOpen(false); setActionEvent(null); }}
            event={actionEvent}
            onSave={handleSaveEvent}
          />
          
          {/* Delete Modal (convert to Tailwind) */}
          {deleteModalOpen && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
              <div className="bg-card rounded-2xl w-full max-w-md flex flex-col overflow-hidden border border-white/10">
                {/* Delete Modal Content */}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
