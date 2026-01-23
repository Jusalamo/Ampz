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

// Design Constants
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {label && <span style={{ fontSize: '14px', color: DESIGN.colors.textPrimary }}>{label}</span>}
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        style={{
          width: '44px',
          height: '24px',
          borderRadius: '12px',
          background: enabled ? DESIGN.colors.primary : 'rgba(255, 255, 255, 0.1)',
          position: 'relative',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}
      >
        <div style={{
          position: 'absolute',
          top: '2px',
          left: enabled ? '22px' : '2px',
          width: '20px',
          height: '20px',
          background: DESIGN.colors.textPrimary,
          borderRadius: '50%',
          transition: 'left 0.2s'
        }} />
      </button>
    </div>
  );
}

// QR Code Modal - UPDATED VERSION WITH PROPER QR GENERATION
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
            qr_code: event.id // Use event ID as QR code identifier
          })
          .eq('id', event.id);
        
        if (error) {
          console.error('Error saving QR code:', error);
        }
      }
    } catch (error) {
      console.error('QR generation error:', error);
      // Fallback to simple QR code
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
    
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 400, 400);
    
    // QR code pattern (simplified for fallback)
    ctx.fillStyle = '#000000';
    
    // Border
    ctx.fillRect(20, 20, 360, 360);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(40, 40, 320, 320);
    
    // Add some QR-like pattern
    ctx.fillStyle = '#000000';
    
    // Position markers
    const markerSize = 60;
    const markerPositions = [
      [40, 40],
      [320 - markerSize, 40],
      [40, 320 - markerSize]
    ];
    
    markerPositions.forEach(([x, y]) => {
      // Outer square
      ctx.fillRect(x, y, markerSize, markerSize);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x + 10, y + 10, markerSize - 20, markerSize - 20);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 20, y + 20, markerSize - 40, markerSize - 40);
    });
    
    // Event info text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(event.name.substring(0, 25), 200, 30);
    
    // Event details
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        background: DESIGN.colors.card,
        borderRadius: DESIGN.borderRadius.card,
        width: '100%',
        maxWidth: '420px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: DESIGN.spacing.default,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: DESIGN.borderRadius.roundButton,
              background: `${DESIGN.colors.primary}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <QrCode className="w-5 h-5" style={{ color: DESIGN.colors.primary }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: DESIGN.colors.textPrimary }}>
                Event QR Code
              </h2>
              <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>
                Scan to check in at event
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{
              width: '32px',
              height: '32px',
              borderRadius: DESIGN.borderRadius.roundButton,
              background: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <X className="w-4 h-4" style={{ color: DESIGN.colors.textPrimary }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {loading ? (
            <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div style={{
                width: '260px',
                height: '260px',
                background: 'white',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                position: 'relative'
              }}>
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <QrCode className="w-16 h-16" style={{ color: DESIGN.colors.textSecondary, margin: '0 auto' }} />
                    <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary, marginTop: '8px' }}>Generating QR...</p>
                  </div>
                )}
                
                {/* Event logo/icon overlay */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '48px',
                  height: '48px',
                  background: DESIGN.colors.background,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white'
                }}>
                  <Calendar className="w-6 h-6" style={{ color: DESIGN.colors.primary }} />
                </div>
              </div>
              
              <div style={{ textAlign: 'center', width: '100%' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: DESIGN.colors.textPrimary, marginBottom: '4px' }}>
                  {event?.name || 'Event'}
                </h3>
                <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary, marginBottom: '12px' }}>
                  Scan this QR code to check in at the event
                </p>
                
                {/* Geofence Information */}
                <div style={{
                  background: `${DESIGN.colors.primary}15`,
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '12px',
                  border: `1px solid ${DESIGN.colors.primary}30`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Navigation className="w-4 h-4" style={{ color: DESIGN.colors.primary }} />
                    <span style={{ fontSize: '13px', color: DESIGN.colors.primary, fontWeight: '500' }}>
                      Geofence Check Required
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>
                    Attendees must be within {event?.geofenceRadius || 50}m of the venue to check in
                  </p>
                </div>
                
                {/* Check-in URL */}
                <div style={{
                  background: DESIGN.colors.background,
                  borderRadius: '8px',
                  padding: '10px',
                  marginTop: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  overflow: 'hidden'
                }}>
                  <p style={{ 
                    fontSize: '11px', 
                    color: DESIGN.colors.textSecondary,
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    textAlign: 'left'
                  }}>
                    {qrCodeURL}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: DESIGN.spacing.default,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={handleCopyURL}
            style={{
              flex: 1,
              padding: '12px',
              border: `1px solid ${DESIGN.colors.primary}`,
              borderRadius: DESIGN.borderRadius.button,
              background: 'transparent',
              color: DESIGN.colors.primary,
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <ExternalLink className="w-4 h-4" />
            Copy URL
          </button>
          <button
            onClick={handleDownload}
            disabled={!qrDataUrl}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: DESIGN.borderRadius.button,
              background: DESIGN.colors.primary,
              color: DESIGN.colors.background,
              fontSize: '14px',
              fontWeight: '500',
              cursor: qrDataUrl ? 'pointer' : 'not-allowed',
              opacity: qrDataUrl ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        background: DESIGN.colors.card,
        borderRadius: DESIGN.borderRadius.card,
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: DESIGN.spacing.default,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: DESIGN.borderRadius.roundButton,
            background: `${DESIGN.colors.danger}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle className="w-5 h-5" style={{ color: DESIGN.colors.danger }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: DESIGN.colors.textPrimary }}>
              Delete Event
            </h2>
            <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>
              This action cannot be undone
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: DESIGN.spacing.default }}>
          <p style={{ fontSize: '14px', color: DESIGN.colors.textPrimary, marginBottom: '16px' }}>
            Are you sure you want to delete <strong>"{event?.name}"</strong>? This will remove:
          </p>
          
          <div style={{
            background: DESIGN.colors.background,
            borderRadius: DESIGN.borderRadius.button,
            padding: '12px',
            marginBottom: '16px'
          }}>
            <ul style={{ fontSize: '13px', color: DESIGN.colors.textSecondary, paddingLeft: '20px' }}>
              <li>All event details</li>
              <li>{event?.attendees || 0} attendee records</li>
              <li>Check-in history</li>
              <li>All media files</li>
              <li>Notification history</li>
            </ul>
          </div>
          
          <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>
            Attendees will be notified that the event has been cancelled.
          </p>
        </div>

        {/* Footer */}
        <div style={{
          padding: DESIGN.spacing.default,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            disabled={isDeleting}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: DESIGN.borderRadius.button,
              background: 'transparent',
              color: DESIGN.colors.textPrimary,
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              opacity: isDeleting ? 0.5 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: DESIGN.borderRadius.button,
              background: DESIGN.colors.danger,
              color: DESIGN.colors.background,
              fontSize: '14px',
              fontWeight: '500',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isDeleting ? (
              <>
                Deleting...
              </>
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
      // Load custom templates from localStorage
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
      case 'emergency': return <AlertTriangle className="w-5 h-5" style={{ color: DESIGN.colors.danger }} />;
      case 'reminder': return <Bell className="w-5 h-5" style={{ color: DESIGN.colors.warning }} />;
      case 'update': return <RefreshCw className="w-5 h-5" style={{ color: DESIGN.colors.info }} />;
      default: return <Send className="w-5 h-5" style={{ color: DESIGN.colors.primary }} />;
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        background: DESIGN.colors.card,
        borderRadius: DESIGN.borderRadius.card,
        width: '100%',
        maxWidth: '480px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: DESIGN.spacing.default,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: DESIGN.colors.card,
          zIndex: 10,
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {getNotificationIcon()}
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: DESIGN.colors.textPrimary }}>
              Send Notification
            </h2>
          </div>
          <button 
            onClick={onClose} 
            style={{
              width: '32px',
              height: '32px',
              borderRadius: DESIGN.borderRadius.roundButton,
              background: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <X className="w-4 h-4" style={{ color: DESIGN.colors.textPrimary }} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: DESIGN.spacing.default,
          paddingBottom: `calc(${DESIGN.spacing.default} + ${DESIGN.spacing.modalFooterHeight})`
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Event Selection */}
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                Send to
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setSelectedEvent('all')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: DESIGN.borderRadius.button,
                    fontSize: '12px',
                    fontWeight: '500',
                    border: '1px solid',
                    background: selectedEvent === 'all' ? DESIGN.colors.primary : 'transparent',
                    color: selectedEvent === 'all' ? DESIGN.colors.background : DESIGN.colors.textSecondary,
                    borderColor: selectedEvent === 'all' ? DESIGN.colors.primary : 'rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  All Events ({events.reduce((sum, e) => sum + e.attendees, 0)})
                </button>
                {events.map(event => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: DESIGN.borderRadius.button,
                      fontSize: '12px',
                      fontWeight: '500',
                      border: '1px solid',
                      background: selectedEvent === event.id ? DESIGN.colors.primary : 'transparent',
                      color: selectedEvent === event.id ? DESIGN.colors.background : DESIGN.colors.textSecondary,
                      borderColor: selectedEvent === event.id ? DESIGN.colors.primary : 'rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                  }}
                  >
                    {event.name} ({event.attendees})
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Type */}
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                Notification Type
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {[
                  { key: 'announcement', label: 'Announcement', icon: Bell, color: DESIGN.colors.primary },
                  { key: 'reminder', label: 'Reminder', icon: Clock, color: DESIGN.colors.warning },
                  { key: 'update', label: 'Update', icon: RefreshCw, color: DESIGN.colors.info },
                  { key: 'emergency', label: 'Emergency', icon: AlertTriangle, color: DESIGN.colors.danger }
                ].map((type) => (
                  <button
                    key={type.key}
                    onClick={() => setNotificationType(type.key as any)}
                    style={{
                      padding: '12px',
                      borderRadius: DESIGN.borderRadius.button,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      border: `1px solid ${notificationType === type.key ? type.color : 'rgba(255, 255, 255, 0.1)'}`,
                      background: notificationType === type.key ? `${type.color}20` : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <type.icon className="w-5 h-5" style={{ color: type.color }} />
                    <span style={{ fontSize: '12px', color: DESIGN.colors.textPrimary }}>
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Filter */}
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                Recipients
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { key: 'all', label: 'All Attendees' },
                  { key: 'checked-in', label: 'Only Checked-in' },
                  { key: 'not-checked-in', label: 'Not Checked-in' }
                ].map(option => (
                  <button
                    key={option.key}
                    onClick={() => setSendTo(option.key as any)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: DESIGN.borderRadius.button,
                      fontSize: '12px',
                      fontWeight: '500',
                      border: '1px solid',
                      background: sendTo === option.key ? DESIGN.colors.primary : 'transparent',
                      color: sendTo === option.key ? DESIGN.colors.background : DESIGN.colors.textSecondary,
                      borderColor: sendTo === option.key ? DESIGN.colors.primary : 'rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary, marginTop: '4px' }}>
                Sending to approximately {getRecipientCount()} attendees
              </p>
            </div>

            {/* Title & Message */}
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                Title
              </label>
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title"
                maxLength={100}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: DESIGN.colors.background,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: DESIGN.borderRadius.button,
                  color: DESIGN.colors.textPrimary,
                  fontSize: '15px'
                }}
              />
              <div style={{ textAlign: 'right', marginTop: '4px' }}>
                <span style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>
                  {title.length}/100 characters
                </span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                Message
              </label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter notification message..."
                rows={4}
                maxLength={500}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: DESIGN.colors.background,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: DESIGN.borderRadius.button,
                  color: DESIGN.colors.textPrimary,
                  fontSize: '15px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <div style={{ textAlign: 'right', marginTop: '4px' }}>
                <span style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>
                  {message.length}/500 characters
                </span>
              </div>
            </div>

            {/* Custom Templates Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: DESIGN.colors.textPrimary }}>
                  Quick Templates
                </label>
                <button
                  onClick={() => setShowTemplateSection(!showTemplateSection)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    color: DESIGN.colors.primary,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {showTemplateSection ? 'Hide' : 'Show'} Templates
                </button>
              </div>
              
              {showTemplateSection && (
                <div style={{
                  background: DESIGN.colors.background,
                  borderRadius: DESIGN.borderRadius.button,
                  padding: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: '12px'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        value={newTemplate}
                        onChange={(e) => setNewTemplate(e.target.value)}
                        placeholder="Add custom template..."
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: DESIGN.colors.card,
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: DESIGN.borderRadius.button,
                          color: DESIGN.colors.textPrimary,
                          fontSize: '14px'
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTemplate()}
                      />
                      <button
                        onClick={handleAddTemplate}
                        disabled={!newTemplate.trim()}
                        style={{
                          padding: '8px 16px',
                          borderRadius: DESIGN.borderRadius.button,
                          background: DESIGN.colors.primary,
                          color: DESIGN.colors.background,
                          border: 'none',
                          cursor: newTemplate.trim() ? 'pointer' : 'not-allowed',
                          opacity: newTemplate.trim() ? 1 : 0.5
                        }}
                      >
                        Add
                      </button>
                    </div>
                    <p style={{ fontSize: '11px', color: DESIGN.colors.textSecondary }}>
                      Save frequently used messages as templates
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                    {customTemplates.map((template, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px',
                        background: DESIGN.colors.card,
                        borderRadius: DESIGN.borderRadius.button,
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <button
                          onClick={() => setMessage(template)}
                          style={{
                            flex: 1,
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            color: DESIGN.colors.textPrimary,
                            fontSize: '12px',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                        >
                          {template}
                        </button>
                        <button
                          onClick={() => handleRemoveTemplate(index)}
                          style={{
                            padding: '4px',
                            background: 'transparent',
                            border: 'none',
                            color: DESIGN.colors.danger,
                            cursor: 'pointer'
                          }}
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
        <div style={{
          position: 'sticky',
          bottom: 0,
          background: DESIGN.colors.card,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          padding: DESIGN.spacing.default,
          display: 'flex',
          gap: '12px',
          height: DESIGN.spacing.modalFooterHeight,
          alignItems: 'center',
          flexShrink: 0,
          zIndex: 10
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: DESIGN.borderRadius.button,
              background: 'transparent',
              color: DESIGN.colors.textPrimary,
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSending || !title.trim() || !message.trim()}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: DESIGN.borderRadius.button,
              background: notificationType === 'emergency' ? DESIGN.colors.danger : DESIGN.colors.primary,
              color: DESIGN.colors.background,
              fontSize: '15px',
              fontWeight: '500',
              opacity: (isSending || !title.trim() || !message.trim()) ? 0.7 : 1,
              cursor: (isSending || !title.trim() || !message.trim()) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
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

export default function EventManager() {
  const navigate = useNavigate();
  const { user, events, updateEvent, deleteEvent, communityComments } = useApp();
  const { toast } = useToast();
  
  // Add defensive checks immediately
  const safeEvents = events || [];
  const safeCommunityComments = communityComments || [];
  
  const [activeTab, setActiveTab] = useState<Tab>('events');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'live' | 'upcoming' | 'past'>('all');
  const [attendeeFilter, setAttendeeFilter] = useState<'all' | 'checked-in' | 'not-checked-in'>('all');
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  
  // Modal states
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [actionEvent, setActionEvent] = useState<AppEvent | null>(null);

  const userEvents = safeEvents.filter(e => e.organizerId === user?.id);
  const selectedEvent = selectedEventId ? safeEvents.find(e => e.id === selectedEventId) : null;

  const isPro = user?.subscription.tier === 'pro' || user?.subscription.tier === 'max';

  // Filter events based on search and status
  const filteredEvents = userEvents.filter(event => {
    // Search filter
    const matchesSearch = !searchQuery || 
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const eventDate = new Date(event.date);
    const now = new Date();
    const isPast = eventDate < now;
    const isToday = eventDate.toDateString() === now.toDateString();
    
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
    // Real attendee data would need to be fetched separately from the database
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

  // Prevent body scrolling when modals are open
  useEffect(() => {
    if (qrModalOpen || deleteModalOpen || notificationModalOpen || editModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [qrModalOpen, deleteModalOpen, notificationModalOpen, editModalOpen]);

  // Handle edit event - open modal instead of navigating
  const handleEditEvent = (event: AppEvent) => {
    setActionEvent(event);
    setEditModalOpen(true);
  };

  if (!isPro) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: DESIGN.colors.background,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: DESIGN.spacing.default
      }}>
        <div style={{ textAlign: 'center', maxWidth: '384px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: DESIGN.borderRadius.roundButton,
            background: `${DESIGN.colors.primary}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <Calendar className="w-10 h-10" style={{ color: DESIGN.colors.primary }} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: DESIGN.colors.textPrimary }}>
            Event Manager
          </h1>
          <p style={{ fontSize: '15px', color: DESIGN.colors.textSecondary, marginBottom: '24px' }}>
            Upgrade to Pro or Max to create and manage events
          </p>
          <button
            onClick={() => navigate('/settings')}
            style={{
              width: '100%',
              padding: '15px',
              border: 'none',
              borderRadius: DESIGN.borderRadius.button,
              background: DESIGN.colors.primary,
              color: DESIGN.colors.background,
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Upgrade Now
          </button>
        </div>
      </div>
    );
  }

  const getEventStatus = (event: typeof safeEvents[0]) => {
    const eventDate = new Date(event.date);
    const now = new Date();
    if (eventDate < now) return 'past';
    if (eventDate.toDateString() === now.toDateString()) return 'live';
    return 'upcoming';
  };

  const handleQRCode = (event: AppEvent) => {
    setActionEvent(event);
    setQrModalOpen(true);
  };

  const handleDeleteEvent = (event: AppEvent) => {
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

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: DESIGN.colors.background,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: DESIGN.colors.background,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: DESIGN.spacing.default
        }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{
              width: '40px',
              height: '40px',
              borderRadius: DESIGN.borderRadius.roundButton,
              background: DESIGN.colors.card,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <ChevronLeft className="w-5 h-5" style={{ color: DESIGN.colors.textPrimary }} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: DESIGN.colors.textPrimary }}>Event Manager</h1>
            <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>{userEvents.length} events</p>
          </div>
          <button
            onClick={() => navigate('/events')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: DESIGN.borderRadius.button,
              background: DESIGN.colors.primary,
              color: DESIGN.colors.background,
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>

        {/* Tabs - COMBINED ATTENDEES & MESSAGES */}
        <div style={{
          display: 'flex',
          paddingLeft: DESIGN.spacing.default,
          paddingRight: DESIGN.spacing.default,
          gap: '4px',
          paddingBottom: '12px',
          overflowX: 'auto'
        }}>
          {[
            { key: 'events', label: 'My Events', icon: Calendar },
            { key: 'attendees-messages', label: 'Attendees & Messages', icon: Users },
            { key: 'analytics', label: 'Analytics', icon: BarChart3 },
            { key: 'settings', label: 'Settings', icon: Settings },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as Tab)}
              style={{
                padding: '10px 14px',
                borderRadius: DESIGN.borderRadius.button,
                fontSize: '14px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: activeTab === tab.key ? DESIGN.colors.primary : DESIGN.colors.card,
                color: activeTab === tab.key ? DESIGN.colors.background : DESIGN.colors.textSecondary,
                border: 'none',
                cursor: 'pointer',
                minHeight: '44px'
              }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: DESIGN.spacing.default,
        paddingBottom: '24px'
      }}>
        {/* My Events Tab */}
        {activeTab === 'events' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Search and Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <Search className="w-4 h-4" style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: DESIGN.colors.textSecondary
                }} />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 36px',
                    background: DESIGN.colors.card,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: DESIGN.borderRadius.button,
                    color: DESIGN.colors.textPrimary,
                    fontSize: '15px'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'live', label: 'Live Now' },
                  { key: 'upcoming', label: 'Upcoming' },
                  { key: 'past', label: 'Past' }
                ].map(status => (
                  <button
                    key={status.key}
                    onClick={() => setFilterStatus(status.key as any)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: DESIGN.borderRadius.button,
                      fontSize: '12px',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                      border: '1px solid',
                      background: filterStatus === status.key ? DESIGN.colors.primary : DESIGN.colors.card,
                      color: filterStatus === status.key ? DESIGN.colors.background : DESIGN.colors.textSecondary,
                      borderColor: filterStatus === status.key ? DESIGN.colors.primary : 'rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer'
                    }}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredEvents.length > 0 ? (
              filteredEvents.map(event => {
                const status = getEventStatus(event);
                return (
                  <div 
                    key={event.id} 
                    style={{
                      background: DESIGN.colors.card,
                      borderRadius: DESIGN.borderRadius.card,
                      border: `1px solid ${selectedEventId === event.id ? DESIGN.colors.primary : 'rgba(255, 255, 255, 0.1)'}`,
                      overflow: 'hidden',
                      transition: 'border-color 0.2s',
                      padding: DESIGN.spacing.cardPadding
                    }}
                  >
                    {/* Centered Image at Top */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center',
                      marginBottom: '16px'
                    }}>
                      <img 
                        src={event.coverImage} 
                        alt={event.name}
                        style={{ 
                          width: '100%',
                          maxWidth: '320px',
                          height: '160px',
                          objectFit: 'cover',
                          borderRadius: DESIGN.borderRadius.cardInner
                        }}
                      />
                    </div>

                    {/* Event Header */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      justifyContent: 'space-between',
                      gap: '8px',
                      marginBottom: '12px'
                    }}>
                      <h3 style={{ 
                        fontSize: '16px',
                        fontWeight: 'bold', 
                        color: DESIGN.colors.textPrimary, 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1
                      }}>
                        {event.name}
                      </h3>
                      <span style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        borderRadius: DESIGN.borderRadius.roundButton,
                        fontWeight: '500',
                        background: status === 'live' ? `${DESIGN.colors.success}20` : 
                                  status === 'upcoming' ? `${DESIGN.colors.primary}20` : 
                                  `${DESIGN.colors.textSecondary}20`,
                        color: status === 'live' ? DESIGN.colors.success : 
                              status === 'upcoming' ? DESIGN.colors.primary : 
                              DESIGN.colors.textSecondary
                      }}>
                        {status === 'live' ? '🔴 Live' : status === 'upcoming' ? 'Upcoming' : 'Past'}
                      </span>
                    </div>

                    {/* Event Details */}
                    <p style={{ 
                      fontSize: '14px', 
                      color: DESIGN.colors.textSecondary,
                      marginBottom: '12px'
                    }}>
                      {event.date} • {event.attendees} attendees
                    </p>

                    {/* Geofence Info */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      marginBottom: '12px',
                      padding: '8px',
                      background: `${DESIGN.colors.primary}10`,
                      borderRadius: DESIGN.borderRadius.small,
                      border: `1px solid ${DESIGN.colors.primary}20`
                    }}>
                      <Navigation className="w-4 h-4" style={{ color: DESIGN.colors.primary }} />
                      <span style={{ fontSize: '13px', color: DESIGN.colors.textSecondary }}>
                        Geofence: {event.geofenceRadius}m radius
                      </span>
                    </div>

                    {/* Media Info */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      marginBottom: '20px',
                      flexWrap: 'wrap'
                    }}>
                      {event.images?.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Grid3x3 className="w-4 h-4" style={{ color: DESIGN.colors.primary }} />
                          <span style={{ fontSize: '13px', color: DESIGN.colors.textSecondary }}>
                            {event.images?.length || 0} photos
                          </span>
                        </div>
                      ) : event.videos?.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Film className="w-4 h-4" style={{ color: DESIGN.colors.primary }} />
                          <span style={{ fontSize: '13px', color: DESIGN.colors.textSecondary }}>Video content</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '8px'
                    }}>
                      <button
                        onClick={() => navigate(`/event/${event.id}`)}
                        style={{
                          height: '40px',
                          padding: '0 8px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: DESIGN.borderRadius.button,
                          background: 'transparent',
                          color: DESIGN.colors.textPrimary,
                          fontSize: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      
                      <button
                        onClick={() => handleEditEvent(event)}
                        style={{
                          height: '40px',
                          padding: '0 8px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: DESIGN.borderRadius.button,
                          background: 'transparent',
                          color: DESIGN.colors.textPrimary,
                          fontSize: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      
                      <button
                        onClick={() => handleQRCode(event)}
                        style={{
                          height: '40px',
                          padding: '0 8px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: DESIGN.borderRadius.button,
                          background: 'transparent',
                          color: DESIGN.colors.textPrimary,
                          fontSize: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        <QrCode className="w-4 h-4" />
                        <span>QR</span>
                      </button>
                      
                      <button
                        onClick={() => handleDeleteEvent(event)}
                        style={{
                          height: '40px',
                          padding: '0 8px',
                          borderRadius: DESIGN.borderRadius.button,
                          background: 'transparent',
                          color: DESIGN.colors.danger,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '64px 0' }}>
                <Calendar className="w-12 h-12" style={{ color: DESIGN.colors.textSecondary, margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: DESIGN.colors.textPrimary }}>
                  No Events Found
                </h3>
                <p style={{ fontSize: '14px', color: DESIGN.colors.textSecondary, marginBottom: '16px' }}>
                  {searchQuery ? 'Try a different search term' : 'Create your first event to get started'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => navigate('/events')}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: DESIGN.borderRadius.button,
                      background: DESIGN.colors.primary,
                      color: DESIGN.colors.background,
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      margin: '0 auto',
                      cursor: 'pointer'
                    }}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Event Selector */}
            {userEvents.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                <button
                  onClick={() => setSelectedEventId(null)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: DESIGN.borderRadius.button,
                    fontSize: '12px',
                    fontWeight: '500',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    border: '1px solid',
                    background: !selectedEventId ? DESIGN.colors.primary : DESIGN.colors.card,
                    color: !selectedEventId ? DESIGN.colors.background : DESIGN.colors.textSecondary,
                    borderColor: !selectedEventId ? DESIGN.colors.primary : 'rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer'
                  }}
                >
                  All Events
                </button>
                {userEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEventId(event.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: DESIGN.borderRadius.button,
                      fontSize: '12px',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                      border: '1px solid',
                      background: selectedEventId === event.id ? DESIGN.colors.primary : DESIGN.colors.card,
                      color: selectedEventId === event.id ? DESIGN.colors.background : DESIGN.colors.textSecondary,
                      borderColor: selectedEventId === event.id ? DESIGN.colors.primary : 'rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer'
                    }}
                  >
                    {event.name}
                  </button>
                ))}
              </div>
            )}

            {/* Attendee Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div style={{
                background: DESIGN.colors.card,
                padding: '12px',
                borderRadius: DESIGN.borderRadius.card,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: DESIGN.colors.primary }}>
                  {attendees.length}
                </p>
                <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>Total</p>
              </div>
              <div style={{
                background: DESIGN.colors.card,
                padding: '12px',
                borderRadius: DESIGN.borderRadius.card,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: DESIGN.colors.success }}>
                  {attendees.filter(a => a.checkedIn).length}
                </p>
                <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>Checked In</p>
              </div>
              <div style={{
                background: DESIGN.colors.card,
                padding: '12px',
                borderRadius: DESIGN.borderRadius.card,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: DESIGN.colors.warning }}>
                  {attendees.filter(a => !a.checkedIn).length}
                </p>
                <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>Pending</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleExportAttendees}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: DESIGN.borderRadius.button,
                  background: 'transparent',
                  color: DESIGN.colors.textPrimary,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={handleOpenNotificationModal}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  borderRadius: DESIGN.borderRadius.button,
                  background: DESIGN.colors.notification,
                  color: DESIGN.colors.background,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <Bell className="w-4 h-4" />
                Notify
              </button>
            </div>

            {/* Attendee Filter */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
              {[
                { key: 'all', label: 'All Attendees' },
                { key: 'checked-in', label: 'Checked In' },
                { key: 'not-checked-in', label: 'Not Checked In' }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setAttendeeFilter(filter.key as any)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: DESIGN.borderRadius.button,
                    fontSize: '12px',
                    fontWeight: '500',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    border: '1px solid',
                    background: attendeeFilter === filter.key ? DESIGN.colors.primary : DESIGN.colors.card,
                    color: attendeeFilter === filter.key ? DESIGN.colors.background : DESIGN.colors.textSecondary,
                    borderColor: attendeeFilter === filter.key ? DESIGN.colors.primary : 'rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer'
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Attendees List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredAttendees.length > 0 ? (
                filteredAttendees.map(attendee => (
                  <div key={attendee.id} style={{
                    background: DESIGN.colors.card,
                    borderRadius: DESIGN.borderRadius.card,
                    padding: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'border-color 0.2s'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: DESIGN.borderRadius.roundButton,
                      background: `${DESIGN.colors.primary}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <User className="w-5 h-5" style={{ color: DESIGN.colors.primary }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: DESIGN.colors.textPrimary }}>{attendee.name}</p>
                      <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>
                        {attendee.ticketType} • {attendee.email}
                      </p>
                    </div>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: DESIGN.borderRadius.roundButton,
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: attendee.checkedIn ? `${DESIGN.colors.success}20` : `${DESIGN.colors.warning}20`,
                      color: attendee.checkedIn ? DESIGN.colors.success : DESIGN.colors.warning
                    }}>
                      {attendee.checkedIn ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {attendee.checkedIn ? 'Checked In' : 'Pending'}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{
                  background: DESIGN.colors.card,
                  borderRadius: DESIGN.borderRadius.card,
                  padding: '32px 16px',
                  textAlign: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <Users className="w-12 h-12" style={{ color: DESIGN.colors.textSecondary, margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '14px', fontWeight: '500', color: DESIGN.colors.textPrimary, marginBottom: '4px' }}>
                    No attendees found
                  </p>
                  <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>
                    {attendeeFilter !== 'all' 
                      ? 'No attendees match your filter' 
                      : 'Attendees will appear here once they register'}
                  </p>
                </div>
              )}
            </div>

            {/* Recent Messages/Engagement */}
            <div style={{
              background: DESIGN.colors.card,
              borderRadius: DESIGN.borderRadius.card,
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: DESIGN.colors.textPrimary }}>Recent Engagement</h3>
                <span style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>
                  {analytics.totalMessages} messages
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {safeCommunityComments
                  .filter(comment => 
                    selectedEventId 
                      ? comment.eventId === selectedEventId
                      : userEvents.some(event => event.id === comment.eventId)
                  )
                  .slice(0, 5)
                  .map(comment => (
                    <div key={comment.id} style={{
                      padding: '12px',
                      background: DESIGN.colors.background,
                      borderRadius: DESIGN.borderRadius.button,
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: DESIGN.borderRadius.roundButton,
                          background: `${DESIGN.colors.primary}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <User className="w-3 h-3" style={{ color: DESIGN.colors.primary }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '12px', fontWeight: '500', color: DESIGN.colors.textPrimary }}>
                            {comment.userName}
                          </p>
                          <p style={{ fontSize: '11px', color: DESIGN.colors.textSecondary }}>
                            {new Date(comment.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p style={{ fontSize: '13px', color: DESIGN.colors.textSecondary, marginTop: '4px' }}>
                        {comment.text}
                      </p>
                    </div>
                  ))}
                
                {analytics.totalMessages === 0 && (
                  <div style={{ textAlign: 'center', padding: '16px' }}>
                    <MessageSquare className="w-8 h-8" style={{ color: DESIGN.colors.textSecondary, margin: '0 auto 8px' }} />
                    <p style={{ fontSize: '13px', color: DESIGN.colors.textSecondary }}>
                      No messages yet. Engagement will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Event Selector */}
            {userEvents.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                <button
                  onClick={() => setSelectedEventId(null)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: DESIGN.borderRadius.button,
                    fontSize: '12px',
                    fontWeight: '500',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    border: '1px solid',
                    background: !selectedEventId ? DESIGN.colors.primary : DESIGN.colors.card,
                    color: !selectedEventId ? DESIGN.colors.background : DESIGN.colors.textSecondary,
                    borderColor: !selectedEventId ? DESIGN.colors.primary : 'rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer'
                  }}
                >
                  All Events
                </button>
                {userEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEventId(event.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: DESIGN.borderRadius.button,
                      fontSize: '12px',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                      border: '1px solid',
                      background: selectedEventId === event.id ? DESIGN.colors.primary : DESIGN.colors.card,
                      color: selectedEventId === event.id ? DESIGN.colors.background : DESIGN.colors.textSecondary,
                      borderColor: selectedEventId === event.id ? DESIGN.colors.primary : 'rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer'
                    }}
                  >
                    {event.name}
                  </button>
                ))}
              </div>
            )}

            {/* Key Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{
                background: DESIGN.colors.card,
                padding: '16px',
                borderRadius: DESIGN.borderRadius.card,
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Users className="w-5 h-5" style={{ color: DESIGN.colors.primary }} />
                  <span style={{ fontSize: '14px', color: DESIGN.colors.textSecondary }}>Total Attendees</span>
                </div>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: DESIGN.colors.textPrimary }}>
                  {analytics.totalAttendees}
                </p>
              </div>
              <div style={{
                background: DESIGN.colors.card,
                padding: '16px',
                borderRadius: DESIGN.borderRadius.card,
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <CheckCircle className="w-5 h-5" style={{ color: DESIGN.colors.success }} />
                  <span style={{ fontSize: '14px', color: DESIGN.colors.textSecondary }}>Check-in Rate</span>
                </div>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: DESIGN.colors.textPrimary }}>{analytics.checkInRate}%</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{
                background: DESIGN.colors.card,
                padding: '16px',
                borderRadius: DESIGN.borderRadius.card,
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <MessageSquare className="w-5 h-5" style={{ color: DESIGN.colors.info }} />
                  <span style={{ fontSize: '14px', color: DESIGN.colors.textSecondary }}>Messages</span>
                </div>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: DESIGN.colors.textPrimary }}>{analytics.totalMessages}</p>
              </div>
              <div style={{
                background: DESIGN.colors.card,
                padding: '16px',
                borderRadius: DESIGN.borderRadius.card,
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <TrendingUp className="w-5 h-5" style={{ color: DESIGN.colors.warning }} />
                  <span style={{ fontSize: '14px', color: DESIGN.colors.textSecondary }}>Engagement</span>
                </div>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: DESIGN.colors.textPrimary }}>{analytics.engagementRate}%</p>
              </div>
            </div>

            {/* Check-in Chart */}
            <div style={{
              background: DESIGN.colors.card,
              padding: '16px',
              borderRadius: DESIGN.borderRadius.card,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: DESIGN.colors.textPrimary }}>Check-in Activity</h3>
              <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '8px' }}>
                {[65, 78, 45, 90, 82, 55, 70].map((val, i) => (
                  <div 
                    key={i}
                    style={{
                      width: '32px',
                      borderTopLeftRadius: DESIGN.borderRadius.button,
                      borderTopRightRadius: DESIGN.borderRadius.button,
                      background: `${DESIGN.colors.primary}20`,
                      height: '100%',
                      position: 'relative'
                    }}
                  >
                    <div 
                      style={{
                        width: '100%',
                        background: DESIGN.colors.primary,
                        borderTopLeftRadius: DESIGN.borderRadius.button,
                        borderTopRightRadius: DESIGN.borderRadius.button,
                        position: 'absolute',
                        bottom: 0,
                        height: `${val}%`,
                        transition: 'height 1s ease'
                      }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: DESIGN.colors.textSecondary, marginTop: '8px' }}>
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
            <div style={{
              background: DESIGN.colors.card,
              padding: '16px',
              borderRadius: DESIGN.borderRadius.card,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: DESIGN.colors.textPrimary }}>Event Performance</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {userEvents.slice(0, 3).map((event, i) => (
                  <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: DESIGN.borderRadius.roundButton,
                      background: `${DESIGN.colors.primary}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: DESIGN.colors.primary
                    }}>
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: DESIGN.colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {event.name}
                      </p>
                      <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Event Preferences */}
            <div style={{
              background: DESIGN.colors.card,
              padding: '16px',
              borderRadius: DESIGN.borderRadius.card,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: DESIGN.colors.textPrimary }}>Event Preferences</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                    Default Check-in Radius (meters)
                  </label>
                  <input 
                    type="range" 
                    min="10" 
                    max="500" 
                    defaultValue="100"
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: DESIGN.colors.textSecondary, marginTop: '4px' }}>
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
            <div style={{
              background: DESIGN.colors.card,
              padding: '16px',
              borderRadius: DESIGN.borderRadius.card,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: DESIGN.colors.textPrimary }}>Notification Settings</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
            <div style={{
              background: DESIGN.colors.card,
              padding: '16px',
              borderRadius: DESIGN.borderRadius.card,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: DESIGN.colors.textPrimary }}>Security & Privacy</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: DESIGN.borderRadius.roundButton,
                    background: `${DESIGN.colors.info}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Shield className="w-5 h-5" style={{ color: DESIGN.colors.info }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: DESIGN.colors.textPrimary }}>Data Privacy</p>
                    <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>We protect your event data</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: DESIGN.borderRadius.roundButton,
                    background: `${DESIGN.colors.success}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Key className="w-5 h-5" style={{ color: DESIGN.colors.success }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: DESIGN.colors.textPrimary }}>Secure Access</p>
                    <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>All data is encrypted</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: DESIGN.borderRadius.roundButton,
                    background: `${DESIGN.colors.primary}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Navigation className="w-5 h-5" style={{ color: DESIGN.colors.primary }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: DESIGN.colors.textPrimary }}>Geofence Security</p>
                    <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>Location-based check-in verification</p>
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
              style={{
                width: '100%',
                padding: '12px',
                border: 'none',
                borderRadius: DESIGN.borderRadius.button,
                background: DESIGN.colors.primary,
                color: DESIGN.colors.background,
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
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
      
      {/* Notification Modal - Rendered independently of actionEvent */}
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

      {/* Add CSS animations for live updates */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
