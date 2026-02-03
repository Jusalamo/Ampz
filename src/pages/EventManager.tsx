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
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border-none cursor-pointer hover:bg-white/20 transition-colors"
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
            className="flex-1 px-3 py-3 border border-primary rounded-xl bg-transparent text-primary text-sm font-medium cursor-pointer flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Copy URL
          </button>
          <button
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className={`flex-1 px-3 py-3 border-none rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity
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

// Delete Event Modal
interface DeleteEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: AppEvent | null;
  onConfirm: () => Promise<void>;
}

function DeleteEventModal({ isOpen, onClose, event, onConfirm }: DeleteEventModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-card rounded-2xl w-full max-w-md flex flex-col overflow-hidden border border-white/10">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">Delete Event</h2>
            <p className="text-xs text-gray-400">This action cannot be undone</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-white mb-4">
            Are you sure you want to delete <strong>"{event?.name}"</strong>? This will remove:
          </p>
          
          <div className="bg-background rounded-xl p-3 mb-4">
            <ul className="text-sm text-gray-400 pl-5 list-disc">
              <li>All event details</li>
              <li>{event?.attendees || 0} attendee records</li>
              <li>Check-in history</li>
              <li>All media files</li>
              <li>Notification history</li>
            </ul>
          </div>
          
          <p className="text-xs text-gray-400">
            Attendees will be notified that the event has been cancelled.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-3 py-3 border border-white/20 rounded-xl bg-transparent text-white text-sm font-medium cursor-pointer hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`flex-1 px-3 py-3 border-none rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity
              ${isDeleting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ background: DESIGN.colors.danger, color: DESIGN.colors.background }}
          >
            {isDeleting ? (
              'Deleting...'
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Event
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Notification Modal (Combines Quick Templates)
interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: AppEvent[];
  selectedEventId?: string;
}

function NotificationModal({ isOpen, onClose, events, selectedEventId }: NotificationModalProps) {
  const [selectedEvent, setSelectedEvent] = useState<string>(selectedEventId || 'all');
  const [notificationType, setNotificationType] = useState<'announcement' | 'reminder' | 'update' | 'emergency'>('announcement');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendTo, setSendTo] = useState<'all' | 'checked-in' | 'not-checked-in'>('all');
  const [scheduleFor, setScheduleFor] = useState<'now' | 'schedule'>('now');
  const [scheduledTime, setScheduledTime] = useState('');
  const [customTemplates, setCustomTemplates] = useState<string[]>([
    'Event starting soon! Get ready 🎉',
    'Reminder: Check in when you arrive',
    'Thank you for attending! Hope to see you again',
    'Event details have been updated',
  ]);
  const [newTemplate, setNewTemplate] = useState('');
  const [showTemplateSection, setShowTemplateSection] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const savedTemplates = localStorage.getItem('customTemplates');
      if (savedTemplates) {
        setCustomTemplates(JSON.parse(savedTemplates));
      }
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: 'Error', description: 'Title and message are required', variant: 'destructive' });
      return;
    }

    setIsSending(true);
    try {
      // In production, this would connect to your notification service
      const event = events.find(e => e.id === selectedEvent);
      const eventName = selectedEvent === 'all' ? 'All Events' : event?.name || 'Event';
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({ 
        title: 'Notification Sent!', 
        description: `Sent to ${eventName} attendees`,
        duration: 5000
      });

      setTitle('');
      setMessage('');
      
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send notification', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const handleAddTemplate = () => {
    if (newTemplate.trim() && !customTemplates.includes(newTemplate)) {
      const updatedTemplates = [...customTemplates, newTemplate];
      setCustomTemplates(updatedTemplates);
      localStorage.setItem('customTemplates', JSON.stringify(updatedTemplates));
      setNewTemplate('');
      toast({ title: 'Template Added', description: 'Custom template saved' });
    }
  };

  const handleRemoveTemplate = (index: number) => {
    const updatedTemplates = customTemplates.filter((_, i) => i !== index);
    setCustomTemplates(updatedTemplates);
    localStorage.setItem('customTemplates', JSON.stringify(updatedTemplates));
    toast({ title: 'Template Removed', description: 'Custom template deleted' });
  };

  const getNotificationIcon = () => {
    switch (notificationType) {
      case 'emergency': return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'reminder': return <Bell className="w-5 h-5 text-warning" />;
      case 'update': return <RefreshCw className="w-5 h-5 text-info" />;
      default: return <Send className="w-5 h-5 text-primary" />;
    }
  };

  const getRecipientCount = () => {
    if (selectedEvent === 'all') {
      return events.reduce((sum, e) => sum + e.attendees, 0);
    }
    const event = events.find(e => e.id === selectedEvent);
    return event?.attendees || 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-card rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-white/10">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            {getNotificationIcon()}
            <h2 className="text-lg font-bold text-white">Send Notification</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border-none cursor-pointer hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-4">
            {/* Event Selection */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Send to</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedEvent('all')}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors
                    ${selectedEvent === 'all' ? 'bg-primary text-background border-primary' : 'bg-transparent text-gray-400 border-white/10'}`}
                >
                  All Events ({events.reduce((sum, e) => sum + e.attendees, 0)})
                </button>
                {events.map(event => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors
                      ${selectedEvent === event.id ? 'bg-primary text-background border-primary' : 'bg-transparent text-gray-400 border-white/10'}`}
                  >
                    {event.name} ({event.attendees})
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Type */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Notification Type</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'announcement', label: 'Announcement', icon: Bell, color: 'bg-primary/20 text-primary border-primary' },
                  { key: 'reminder', label: 'Reminder', icon: Clock, color: 'bg-warning/20 text-warning border-warning' },
                  { key: 'update', label: 'Update', icon: RefreshCw, color: 'bg-info/20 text-info border-info' },
                  { key: 'emergency', label: 'Emergency', icon: AlertTriangle, color: 'bg-destructive/20 text-destructive border-destructive' }
                ].map((type) => (
                  <button
                    key={type.key}
                    onClick={() => setNotificationType(type.key as any)}
                    className={`p-3 rounded-xl flex flex-col items-center gap-2 border cursor-pointer transition-colors
                      ${notificationType === type.key ? type.color : 'bg-transparent text-gray-400 border-white/10'}`}
                  >
                    <type.icon className="w-5 h-5" />
                    <span className="text-xs text-current">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Filter */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Recipients</label>
              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'All Attendees' },
                  { key: 'checked-in', label: 'Only Checked-in' },
                  { key: 'not-checked-in', label: 'Not Checked-in' }
                ].map(option => (
                  <button
                    key={option.key}
                    onClick={() => setSendTo(option.key as any)}
                    className={`flex-1 px-2 py-2 rounded-xl text-xs font-medium border transition-colors
                      ${sendTo === option.key ? 'bg-primary text-background border-primary' : 'bg-transparent text-gray-400 border-white/10'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Sending to approximately {getRecipientCount()} attendees
              </p>
            </div>

            {/* Title & Message */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Title</label>
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title"
                maxLength={100}
                className="w-full px-3 py-3 bg-background border border-white/10 rounded-xl text-white text-sm"
              />
              <div className="text-right mt-1">
                <span className="text-xs text-gray-400">{title.length}/100 characters</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Message</label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter notification message..."
                rows={4}
                maxLength={500}
                className="w-full px-3 py-3 bg-background border border-white/10 rounded-xl text-white text-sm resize-vertical font-sans"
              />
              <div className="text-right mt-1">
                <span className="text-xs text-gray-400">{message.length}/500 characters</span>
              </div>
            </div>

            {/* Custom Templates Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-white">Quick Templates</label>
                <button
                  onClick={() => setShowTemplateSection(!showTemplateSection)}
                  className="px-2 py-1 text-xs text-primary bg-transparent border-none cursor-pointer flex items-center gap-1 hover:text-primary/80 transition-colors"
                >
                  {showTemplateSection ? 'Hide' : 'Show'} Templates
                </button>
              </div>
              
              {showTemplateSection && (
                <div className="bg-background rounded-xl p-3 mb-3 border border-white/10">
                  <div className="mb-3">
                    <div className="flex gap-2 mb-2">
                      <input
                        value={newTemplate}
                        onChange={(e) => setNewTemplate(e.target.value)}
                        placeholder="Add custom template..."
                        className="flex-1 px-2 py-2 bg-card border border-white/10 rounded-xl text-white text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTemplate()}
                      />
                      <button
                        onClick={handleAddTemplate}
                        disabled={!newTemplate.trim()}
                        className={`px-4 py-2 rounded-xl border-none cursor-pointer transition-opacity
                          ${!newTemplate.trim() ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
                        style={{ background: DESIGN.colors.primary, color: DESIGN.colors.background }}
                      >
                        Add
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Save frequently used messages as templates
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-2 max-h-36 overflow-y-auto">
                    {customTemplates.map((template, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-card rounded-xl border border-white/10">
                        <button
                          onClick={() => setMessage(template)}
                          className="flex-1 text-left bg-transparent border-none text-white text-xs cursor-pointer px-1 py-0.5"
                        >
                          {template}
                        </button>
                        <button
                          onClick={() => handleRemoveTemplate(index)}
                          className="p-1 bg-transparent border-none text-destructive cursor-pointer hover:text-destructive/80"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-3 border border-white/20 rounded-xl bg-transparent text-white text-sm font-medium cursor-pointer hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSending || !title.trim() || !message.trim()}
            className={`flex-1 px-3 py-3 border-none rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-opacity
              ${(isSending || !title.trim() || !message.trim()) ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
            style={{ 
              background: notificationType === 'emergency' ? DESIGN.colors.danger : DESIGN.colors.primary, 
              color: DESIGN.colors.background 
            }}
          >
            {isSending ? (
              'Sending...'
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Now
              </>
            )}
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
      bg-card rounded-2xl border overflow-hidden transition-colors p-5 mb-4
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

  // Get real attendees from check-ins
  const getRealAttendees = () => {
    if (!user) return [];
    
    // For demo accounts, return some sample data
    if (user.isDemo) {
      return [
        { id: '1', name: 'Sarah Chen', email: 'sarah@example.com', checkedIn: true, checkInTime: '2024-01-15T10:30:00Z', ticketType: 'VIP' },
        { id: '2', name: 'Mike Johnson', email: 'mike@example.com', checkedIn: true, checkInTime: '2024-01-15T11:15:00Z', ticketType: 'General' },
        { id: '3', name: 'Emily Davis', email: 'emily@example.com', checkedIn: false, ticketType: 'General' },
        { id: '4', name: 'Alex Kim', email: 'alex@example.com', checkedIn: false, ticketType: 'VIP' },
        { id: '5', name: 'John Smith', email: 'john@example.com', checkedIn: true, checkInTime: '2024-01-15T09:45:00Z', ticketType: 'General' },
      ];
    }
    
    // For production accounts, return empty as check-ins are not exposed in context
    return [];
  };

  const attendees = getRealAttendees();
  const filteredAttendees = attendees.filter(attendee => {
    if (attendeeFilter === 'checked-in') return attendee.checkedIn;
    if (attendeeFilter === 'not-checked-in') return !attendee.checkedIn;
    return true;
  });

  // Get real analytics data
  const getAnalyticsData = () => {
    const totalAttendees = userEvents.reduce((sum, e) => sum + e.attendees, 0);
    const checkedInAttendees = attendees.filter(a => a.checkedIn).length;
    const checkInRate = totalAttendees > 0 ? Math.round((checkedInAttendees / totalAttendees) * 100) : 0;
    
    // Get messages/engagement from community comments
    const eventMessages = selectedEventId 
      ? safeCommunityComments.filter(c => c.eventId === selectedEventId)
      : safeCommunityComments.filter(c => userEvents.some(e => e.id === c.eventId));
    
    return {
      totalAttendees,
      checkedInAttendees,
      checkInRate,
      totalEvents: userEvents.length,
      totalMessages: eventMessages.length,
      engagementRate: totalAttendees > 0 ? Math.round((eventMessages.length / totalAttendees) * 100) : 0
    };
  };

  const analytics = getAnalyticsData();

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

  const handleOpenNotificationModal = () => {
    setNotificationModalOpen(true);
  };

  const handleExportAttendees = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      'Name,Email,Ticket Type,Checked In,Check-in Time\n' +
      filteredAttendees.map(a => 
        `${a.name},${a.email},${a.ticketType},${a.checkedIn ? 'Yes' : 'No'},${a.checkInTime || ''}`
      ).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedEvent?.name || 'attendees'}_list.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ 
      title: 'Exported!', 
      description: 'CSV file downloaded' 
    });
  };

  // Prevent body scrolling when modals are open
  useEffect(() => {
    if (qrModalOpen || deleteModalOpen || notificationModalOpen || editModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [qrModalOpen, deleteModalOpen, notificationModalOpen, editModalOpen]);

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
            className="w-full px-4 py-3 bg-primary text-background rounded-xl font-medium cursor-pointer hover:bg-primary/90 transition-colors"
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
        {/* My Events Tab */}
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
                  className="w-full pl-10 pr-3 py-3 bg-card border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
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
                      ${filterStatus === status.key ? 'bg-primary text-background border-primary' : 'bg-card text-gray-400 border-white/10 hover:bg-card/80'}
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

        {/* Combined Attendees & Messages Tab */}
        {activeTab === 'attendees-messages' && (
          <div className="flex flex-col gap-4">
            {/* Event Selector */}
            {userEvents.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedEventId(null)}
                  className={`
                    px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors border
                    ${!selectedEventId ? 'bg-primary text-background border-primary' : 'bg-card text-gray-400 border-white/10'}
                  `}
                >
                  All Events
                </button>
                {userEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEventId(event.id)}
                    className={`
                      px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors border
                      ${selectedEventId === event.id ? 'bg-primary text-background border-primary' : 'bg-card text-gray-400 border-white/10'}
                    `}
                  >
                    {event.name}
                  </button>
                ))}
              </div>
            )}

            {/* Attendee Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card p-3 rounded-2xl border border-white/10 text-center">
                <p className="text-2xl font-bold text-primary">{attendees.length}</p>
                <p className="text-xs text-gray-400">Total</p>
              </div>
              <div className="bg-card p-3 rounded-2xl border border-white/10 text-center">
                <p className="text-2xl font-bold text-success">{attendees.filter(a => a.checkedIn).length}</p>
                <p className="text-xs text-gray-400">Checked In</p>
              </div>
              <div className="bg-card p-3 rounded-2xl border border-white/10 text-center">
                <p className="text-2xl font-bold text-warning">{attendees.filter(a => !a.checkedIn).length}</p>
                <p className="text-xs text-gray-400">Pending</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleExportAttendees}
                className="flex-1 px-3 py-3 border border-white/20 rounded-xl bg-transparent text-white text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-white/5 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={handleOpenNotificationModal}
                className="flex-1 px-3 py-3 border-none rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background: DESIGN.colors.notification, color: DESIGN.colors.background }}
              >
                <Bell className="w-4 h-4" />
                Notify
              </button>
            </div>

            {/* Attendee Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { key: 'all', label: 'All Attendees' },
                { key: 'checked-in', label: 'Checked In' },
                { key: 'not-checked-in', label: 'Not Checked In' }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setAttendeeFilter(filter.key as any)}
                  className={`
                    px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors border
                    ${attendeeFilter === filter.key ? 'bg-primary text-background border-primary' : 'bg-card text-gray-400 border-white/10'}
                  `}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Attendees List */}
            <div className="flex flex-col gap-2">
              {filteredAttendees.length > 0 ? (
                filteredAttendees.map(attendee => (
                  <div key={attendee.id} className="bg-card rounded-2xl p-3 border border-white/10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{attendee.name}</p>
                      <p className="text-xs text-gray-400">
                        {attendee.ticketType} • {attendee.email}
                      </p>
                    </div>
                    <span className={`
                      px-2 py-1 rounded-full text-xs flex items-center gap-1
                      ${attendee.checkedIn ? 'bg-green-500/20 text-green-500' : 'bg-warning/20 text-warning'}
                    `}>
                      {attendee.checkedIn ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {attendee.checkedIn ? 'Checked In' : 'Pending'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="bg-card rounded-2xl p-8 text-center border border-white/10">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-white mb-1">No attendees found</p>
                  <p className="text-xs text-gray-400">
                    {attendeeFilter !== 'all' 
                      ? 'No attendees match your filter' 
                      : 'Attendees will appear here once they register'}
                  </p>
                </div>
              )}
            </div>

            {/* Recent Messages/Engagement */}
            <div className="bg-card rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Recent Engagement</h3>
                <span className="text-xs text-gray-400">{analytics.totalMessages} messages</span>
              </div>
              
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {safeCommunityComments
                  .filter(comment => 
                    selectedEventId 
                      ? comment.eventId === selectedEventId
                      : userEvents.some(event => event.id === comment.eventId)
                  )
                  .slice(0, 5)
                  .map(comment => (
                    <div key={comment.id} className="p-3 bg-background rounded-xl border border-white/10">
                      <div className="flex items-start gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-3 h-3 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-white">{comment.userName}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(comment.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{comment.text}</p>
                    </div>
                  ))}
                
                {analytics.totalMessages === 0 && (
                  <div className="text-center py-4">
                    <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No messages yet. Engagement will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-4">
            {/* Event Selector */}
            {userEvents.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedEventId(null)}
                  className={`
                    px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors border
                    ${!selectedEventId ? 'bg-primary text-background border-primary' : 'bg-card text-gray-400 border-white/10'}
                  `}
                >
                  All Events
                </button>
                {userEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEventId(event.id)}
                    className={`
                      px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors border
                      ${selectedEventId === event.id ? 'bg-primary text-background border-primary' : 'bg-card text-gray-400 border-white/10'}
                    `}
                  >
                    {event.name}
                  </button>
                ))}
              </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-sm text-gray-400">Total Attendees</span>
                </div>
                <p className="text-3xl font-bold text-white">{analytics.totalAttendees}</p>
              </div>
              <div className="bg-card p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="text-sm text-gray-400">Check-in Rate</span>
                </div>
                <p className="text-3xl font-bold text-white">{analytics.checkInRate}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-info" />
                  <span className="text-sm text-gray-400">Messages</span>
                </div>
                <p className="text-3xl font-bold text-white">{analytics.totalMessages}</p>
              </div>
              <div className="bg-card p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-warning" />
                  <span className="text-sm text-gray-400">Engagement</span>
                </div>
                <p className="text-3xl font-bold text-white">{analytics.engagementRate}%</p>
              </div>
            </div>

            {/* Check-in Chart */}
            <div className="bg-card p-4 rounded-2xl border border-white/10">
              <h3 className="text-sm font-semibold mb-4 text-white">Check-in Activity</h3>
              <div className="h-40 flex items-end justify-center gap-2">
                {[65, 78, 45, 90, 82, 55, 70].map((val, i) => (
                  <div key={i} className="w-8 relative">
                    <div 
                      className="w-full bg-primary rounded-t-xl absolute bottom-0 transition-all duration-1000 ease-in-out"
                      style={{ height: `${val}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>

            {/* Top Events */}
            <div className="bg-card p-4 rounded-2xl border border-white/10">
              <h3 className="text-sm font-semibold mb-3 text-white">Event Performance</h3>
              <div className="flex flex-col gap-3">
                {userEvents.slice(0, 3).map((event, i) => (
                  <div key={event.id} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{event.name}</p>
                      <p className="text-xs text-gray-400">
                        {event.attendees} attendees • Geofence: {event.geofenceRadius}m
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="flex flex-col gap-4">
            {/* Event Preferences */}
            <div className="bg-card p-4 rounded-2xl border border-white/10">
              <h3 className="text-sm font-semibold mb-4 text-white">Event Preferences</h3>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Default Check-in Radius (meters)</label>
                  <input 
                    type="range" 
                    min="10" 
                    max="500" 
                    defaultValue="100"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>10m</span>
                    <span>100m</span>
                    <span>500m</span>
                  </div>
                </div>
                
                <ToggleSwitch
                  enabled={true}
                  onChange={() => {}}
                  label="Automatically generate QR codes for new events"
                />
                
                <ToggleSwitch
                  enabled={true}
                  onChange={() => {}}
                  label="Require geofence verification for check-ins"
                />
                
                <ToggleSwitch
                  enabled={true}
                  onChange={() => {}}
                  label="Show real-time check-in notifications"
                />
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-card p-4 rounded-2xl border border-white/10">
              <h3 className="text-sm font-semibold mb-4 text-white">Notification Settings</h3>
              <div className="flex flex-col gap-3">
                <ToggleSwitch
                  enabled={true}
                  onChange={() => {}}
                  label="Real-time attendee check-in notifications"
                />
                <ToggleSwitch
                  enabled={true}
                  onChange={() => {}}
                  label="Event update announcements"
                />
                <ToggleSwitch
                  enabled={false}
                  onChange={() => {}}
                  label="Daily event summary emails"
                />
                <ToggleSwitch
                  enabled={true}
                  onChange={() => {}}
                  label="Push notifications for new attendees"
                />
              </div>
            </div>

            {/* Security & Privacy */}
            <div className="bg-card p-4 rounded-2xl border border-white/10">
              <h3 className="text-sm font-semibold mb-4 text-white">Security & Privacy</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-info/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-info" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Data Privacy</p>
                    <p className="text-xs text-gray-400">We protect your event data</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                    <Key className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Secure Access</p>
                    <p className="text-xs text-gray-400">All data is encrypted</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Geofence Security</p>
                    <p className="text-xs text-gray-400">Location-based check-in verification</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                toast({ 
                  title: 'Settings Saved', 
                  description: 'Your preferences have been updated',
                  duration: 3000
                });
              }}
              className="w-full px-4 py-3 bg-primary text-background rounded-xl text-sm font-medium cursor-pointer hover:bg-primary/90 transition-colors"
            >
              Save Settings
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {actionEvent && (
        <>
          <QRCodeModal
            isOpen={qrModalOpen}
            onClose={() => { setQrModalOpen(false); setActionEvent(null); }}
            event={actionEvent}
          />
          
          <DeleteEventModal
            isOpen={deleteModalOpen}
            onClose={() => { setDeleteModalOpen(false); setActionEvent(null); }}
            event={actionEvent}
            onConfirm={handleConfirmDelete}
          />
        </>
      )}
      
      {/* Notification Modal */}
      <NotificationModal
        isOpen={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
        events={userEvents}
        selectedEventId={selectedEventId || undefined}
      />

      {/* Edit Event Modal */}
      <EditEventModal
        isOpen={editModalOpen}
        onClose={() => { setEditModalOpen(false); setActionEvent(null); }}
        event={actionEvent}
      />
    </div>
  );
}
