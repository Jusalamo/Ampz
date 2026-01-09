import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Plus, 
  Calendar, 
  Users, 
  BarChart3, 
  MessageSquare, 
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
  ExternalLink
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Event } from '@/lib/types';

// Mock WebSocket service for real-time notifications
const mockNotificationService = {
  sendNotification: async (eventId: string, title: string, message: string, type: string) => {
    console.log('Sending notification:', { eventId, title, message, type });
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, sentCount: 150 });
      }, 1000);
    });
  },
  
  subscribeToEvent: (eventId: string, callback: (data: any) => void) => {
    const interval = setInterval(() => {
      callback({
        type: 'attendee_update',
        data: { checkedInCount: Math.floor(Math.random() * 10) + 1 }
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }
};

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
    smallPill: '8px'
  },
  shadows: {
    card: '0 8px 32px rgba(0, 0, 0, 0.4)',
    button: '0 4px 16px rgba(0, 0, 0, 0.3)',
    likeButton: '0 4px 16px rgba(255, 184, 230, 0.4)'
  }
};

type Tab = 'events' | 'attendees' | 'analytics' | 'messages' | 'settings';

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

// File Upload Preview Component
interface FilePreviewProps {
  file: {
    id: string;
    url: string;
    name: string;
    type: 'image' | 'video';
    size?: number;
  };
  onRemove: () => void;
  isCover?: boolean;
}

function FilePreview({ file, onRemove, isCover }: FilePreviewProps) {
  return (
    <div style={{
      background: DESIGN.colors.background,
      borderRadius: DESIGN.borderRadius.button,
      padding: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {file.type === 'video' ? (
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            background: `${DESIGN.colors.primary}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <VideoIcon className="w-6 h-6" style={{ color: DESIGN.colors.primary }} />
          </div>
        ) : (
          <img 
            src={file.url} 
            alt={file.name}
            style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '8px',
              objectFit: 'cover'
            }}
          />
        )}
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <p style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              color: DESIGN.colors.textPrimary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '200px'
            }}>
              {file.name}
            </p>
            {isCover && (
              <span style={{
                padding: '2px 6px',
                fontSize: '10px',
                borderRadius: DESIGN.borderRadius.smallPill,
                background: DESIGN.colors.primary,
                color: DESIGN.colors.background,
                fontWeight: '500'
              }}>
                Cover
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              fontSize: '11px', 
              color: DESIGN.colors.textSecondary,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {file.type === 'video' ? <VideoIcon className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
              {file.type === 'video' ? 'Video' : 'Image'}
            </span>
            {file.size && (
              <>
                <span style={{ fontSize: '11px', color: DESIGN.colors.textSecondary }}>•</span>
                <span style={{ fontSize: '11px', color: DESIGN.colors.textSecondary }}>
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </>
            )}
          </div>
        </div>
        
        <button
          onClick={onRemove}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: DESIGN.borderRadius.roundButton,
            background: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
          <X className="w-4 h-4" style={{ color: DESIGN.colors.textPrimary }} />
        </button>
      </div>
      
      {!isCover && file.type === 'image' && (
        <button
          onClick={() => {
            const event = new CustomEvent('setCoverImage', { detail: file.url });
            window.dispatchEvent(event);
          }}
          style={{
            position: 'absolute',
            top: '12px',
            right: '52px',
            padding: '4px 8px',
            fontSize: '11px',
            borderRadius: DESIGN.borderRadius.smallPill,
            background: 'rgba(255, 255, 255, 0.1)',
            color: DESIGN.colors.textPrimary,
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
          Set as Cover
        </button>
      )}
    </div>
  );
}

// Modal Components
interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  onSave: (updatedEvent: Partial<Event>) => Promise<void>;
}

function EditEventModal({ isOpen, onClose, event, onSave }: EditEventModalProps) {
  const [formData, setFormData] = useState({
    name: event.name,
    description: event.description,
    date: event.date,
    time: event.time,
    location: event.location,
    address: event.address,
    price: event.price,
    maxAttendees: event.maxAttendees,
    geofenceRadius: event.geofenceRadius,
    mediaType: event.mediaType,
    category: event.category,
    tags: event.tags.join(', '),
    notificationsEnabled: event.notificationsEnabled
  });
  
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    id: string;
    url: string;
    name: string;
    type: 'image' | 'video';
    file?: File;
    isNew: boolean;
  }>>([]);
  
  const [activeTab, setActiveTab] = useState<'details' | 'media'>('details');
  const [isSaving, setIsSaving] = useState(false);
  const [coverImage, setCoverImage] = useState<string>(event.coverImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        description: event.description,
        date: event.date,
        time: event.time,
        location: event.location,
        address: event.address,
        price: event.price,
        maxAttendees: event.maxAttendees,
        geofenceRadius: event.geofenceRadius,
        mediaType: event.mediaType,
        category: event.category,
        tags: event.tags.join(', '),
        notificationsEnabled: event.notificationsEnabled
      });
      
      const existingFiles = event.images.map((img, index) => ({
        id: `existing-${index}`,
        url: img,
        name: `${event.mediaType === 'video' ? 'Video' : 'Image'} ${index + 1}`,
        type: event.mediaType === 'video' ? 'video' as const : 'image' as const,
        isNew: false
      }));
      
      setUploadedFiles(existingFiles);
      setCoverImage(event.coverImage);
    }
  }, [event]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleSetCoverImage = (e: Event) => {
      const customEvent = e as CustomEvent;
      setCoverImage(customEvent.detail);
      toast({ 
        title: 'Cover Updated', 
        description: 'New cover image set successfully' 
      });
    };

    window.addEventListener('setCoverImage', handleSetCoverImage);
    return () => window.removeEventListener('setCoverImage', handleSetCoverImage);
  }, []);

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: Array<{
      id: string;
      url: string;
      name: string;
      type: 'image' | 'video';
      file: File;
      isNew: boolean;
    }> = [];

    Array.from(files).forEach(file => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      
      if (formData.mediaType === 'video' && !isVideo) {
        toast({ 
          title: 'Invalid file', 
          description: 'Please select video files only',
          variant: 'destructive' 
        });
        return;
      }
      
      if (formData.mediaType === 'carousel' && !isImage) {
        toast({ 
          title: 'Invalid file', 
          description: 'Please select image files only',
          variant: 'destructive' 
        });
        return;
      }

      const maxSize = formData.mediaType === 'video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({ 
          title: 'File too large', 
          description: `Maximum size is ${formData.mediaType === 'video' ? '100MB' : '10MB'}`,
          variant: 'destructive' 
        });
        return;
      }

      const url = URL.createObjectURL(file);
      newFiles.push({
        id: `new-${Date.now()}-${Math.random()}`,
        url,
        name: file.name,
        type: formData.mediaType === 'video' ? 'video' : 'image',
        file,
        isNew: true
      });
    });

    if (newFiles.length > 0) {
      if (formData.mediaType !== event.mediaType || newFiles.length > 0) {
        const existingFiles = uploadedFiles.filter(f => f.type !== formData.mediaType);
        setUploadedFiles([...existingFiles, ...newFiles]);
      } else {
        setUploadedFiles(prev => [...prev, ...newFiles]);
      }
      
      if (!coverImage && newFiles[0]?.type === 'image') {
        setCoverImage(newFiles[0].url);
      }
      
      toast({ 
        title: 'Success', 
        description: `Added ${newFiles.length} ${formData.mediaType === 'video' ? 'video(s)' : 'image(s)'}` 
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (id: string) => {
    const fileToRemove = uploadedFiles.find(f => f.id === id);
    if (fileToRemove?.url === coverImage) {
      const otherImage = uploadedFiles.find(f => f.id !== id && f.type === 'image');
      setCoverImage(otherImage?.url || '');
    }
    
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleMediaTypeChange = (type: 'carousel' | 'video') => {
    if (type === formData.mediaType) return;
    
    if (uploadedFiles.length > 0) {
      const confirm = window.confirm(
        `Switching to ${type} will remove all ${formData.mediaType} files. Continue?`
      );
      if (!confirm) return;
    }
    
    setFormData(prev => ({ ...prev, mediaType: type }));
    setUploadedFiles([]);
    setCoverImage('');
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Event name is required', variant: 'destructive' });
      return;
    }
    
    setIsSaving(true);
    try {
      const imageUrls = uploadedFiles.map(f => f.url);
      
      await onSave({
        ...formData,
        images: imageUrls,
        coverImage: coverImage || imageUrls[0] || event.coverImage,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        updatedAt: new Date().toISOString()
      });
      
      toast({ title: 'Success', description: 'Event updated successfully' });
      onClose();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update event', variant: 'destructive' });
    } finally {
      setIsSaving(false);
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
        maxWidth: '512px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Sticky Header */}
        <div style={{
          background: DESIGN.colors.card,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: DESIGN.spacing.default,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          flexShrink: 0
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: DESIGN.colors.textPrimary }}>
            Edit Event
          </h2>
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
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            <X className="w-4 h-4" style={{ color: DESIGN.colors.textPrimary }} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'sticky',
          top: '64px',
          background: DESIGN.colors.card,
          zIndex: 9,
          flexShrink: 0
        }}>
          {(['details', 'media'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '14px',
                fontWeight: '500',
                background: activeTab === tab ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: DESIGN.colors.textPrimary,
                border: 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'background 0.2s'
              }}
            >
              {tab === 'details' ? 'Event Details' : 'Media & Files'}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: DESIGN.spacing.default,
          paddingBottom: `calc(${DESIGN.spacing.default} + ${DESIGN.spacing.modalFooterHeight})`
        }}>
          {activeTab === 'details' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                  Event Name *
                </label>
                <input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter event name"
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
              </div>
              
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                  Description
                </label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter event description"
                  rows={3}
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
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                    Date *
                  </label>
                  <input 
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                </div>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                    Time *
                  </label>
                  <input 
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
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
                </div>
              </div>
              
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                  Venue Name
                </label>
                <input 
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter venue name"
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
              </div>
              
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                  Address
                </label>
                <input 
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter full address"
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
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                    Price (NAD)
                  </label>
                  <input 
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
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
                </div>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                    Max Attendees
                  </label>
                  <input 
                    type="number"
                    value={formData.maxAttendees}
                    onChange={(e) => setFormData({ ...formData, maxAttendees: parseInt(e.target.value) || 100 })}
                    placeholder="100"
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
                </div>
              </div>
              
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                  Check-in Radius (meters) *
                </label>
                <input 
                  type="number"
                  value={formData.geofenceRadius}
                  onChange={(e) => setFormData({ ...formData, geofenceRadius: parseInt(e.target.value) || 50 })}
                  placeholder="50"
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
                <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary, marginTop: '4px' }}>
                  Users must be within this radius to check in
                </p>
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: DESIGN.colors.background,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: DESIGN.borderRadius.button,
                    color: DESIGN.colors.textPrimary,
                    fontSize: '15px',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                >
                  <option value="music">Music</option>
                  <option value="sports">Sports</option>
                  <option value="conference">Conference</option>
                  <option value="workshop">Workshop</option>
                  <option value="networking">Networking</option>
                  <option value="party">Party</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                  Tags (comma separated)
                </label>
                <input 
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="music, festival, summer"
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
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                  Media Type *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleMediaTypeChange('carousel')}
                    type="button"
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: `1px solid ${formData.mediaType === 'carousel' ? DESIGN.colors.primary : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: DESIGN.borderRadius.button,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      background: formData.mediaType === 'carousel' ? `${DESIGN.colors.primary}20` : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Grid3x3 className="w-5 h-5" style={{ color: DESIGN.colors.textPrimary }} />
                    <span style={{ fontSize: '14px', color: DESIGN.colors.textPrimary }}>Carousel</span>
                  </button>
                  <button
                    onClick={() => handleMediaTypeChange('video')}
                    type="button"
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: `1px solid ${formData.mediaType === 'video' ? DESIGN.colors.primary : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: DESIGN.borderRadius.button,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      background: formData.mediaType === 'video' ? `${DESIGN.colors.primary}20` : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Film className="w-5 h-5" style={{ color: DESIGN.colors.textPrimary }} />
                    <span style={{ fontSize: '14px', color: DESIGN.colors.textPrimary }}>Video</span>
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary, marginTop: '4px' }}>
                  Display type on event details page
                </p>
              </div>

              <div>
                <ToggleSwitch
                  enabled={formData.notificationsEnabled}
                  onChange={(enabled) => setFormData({ ...formData, notificationsEnabled: enabled })}
                  label="Enable real-time notifications for attendees"
                />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Cover Image Preview */}
              {coverImage && (
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                    Cover Image Preview
                  </label>
                  <div style={{
                    width: '100%',
                    height: '160px',
                    borderRadius: DESIGN.borderRadius.cardInner,
                    overflow: 'hidden',
                    position: 'relative',
                    border: '2px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <img 
                      src={coverImage} 
                      alt="Cover" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      padding: '4px 8px',
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      fontSize: '12px',
                      borderRadius: DESIGN.borderRadius.smallPill,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Camera className="w-3 h-3" />
                      Cover Image
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Area */}
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                  Upload {formData.mediaType === 'video' ? 'Video' : 'Images'}
                </label>
                <div
                  onClick={handleFileSelect}
                  style={{
                    width: '100%',
                    padding: '32px 24px',
                    border: '2px dashed rgba(255, 255, 255, 0.2)',
                    borderRadius: DESIGN.borderRadius.button,
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = DESIGN.colors.primary;
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                >
                  <Upload className="w-10 h-10" style={{ color: DESIGN.colors.textSecondary }} />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', color: DESIGN.colors.textPrimary, marginBottom: '4px' }}>
                      Click to upload or drag and drop
                    </p>
                    <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>
                      {formData.mediaType === 'video' 
                        ? 'MP4, MOV, AVI up to 100MB' 
                        : 'JPG, PNG, WebP up to 10MB each'
                      }
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={formData.mediaType === 'video' ? 'video/*' : 'image/*'}
                  multiple={formData.mediaType !== 'video'}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>

              {/* File List */}
              {uploadedFiles.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: DESIGN.colors.textPrimary }}>
                      {formData.mediaType === 'video' ? 'Video' : 'Images'} ({uploadedFiles.length})
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          const confirm = window.confirm(`Remove all ${uploadedFiles.length} files?`);
                          if (confirm) {
                            setUploadedFiles([]);
                            setCoverImage('');
                          }
                        }}
                        type="button"
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          color: DESIGN.colors.danger,
                          background: 'transparent',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: DESIGN.borderRadius.button,
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        Clear All
                      </button>
                      {formData.mediaType === 'carousel' && (
                        <button
                          onClick={handleFileSelect}
                          type="button"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            color: DESIGN.colors.primary,
                            background: `${DESIGN.colors.primary}20`,
                            border: 'none',
                            borderRadius: DESIGN.borderRadius.button,
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = `${DESIGN.colors.primary}30`}
                          onMouseLeave={(e) => e.currentTarget.style.background = `${DESIGN.colors.primary}20`}
                        >
                          Add More
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {uploadedFiles.map((file, index) => (
                      <FilePreview
                        key={file.id}
                        file={file}
                        onRemove={() => handleRemoveFile(file.id)}
                        isCover={file.url === coverImage}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Media Type Notice */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: DESIGN.borderRadius.button,
                padding: '12px',
                borderLeft: `3px solid ${DESIGN.colors.info}`
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <Bell className="w-4 h-4" style={{ color: DESIGN.colors.info, marginTop: '2px' }} />
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: '500', color: DESIGN.colors.textPrimary, marginBottom: '4px' }}>
                      Media Type: {formData.mediaType === 'video' ? 'Video' : 'Image Carousel'}
                    </p>
                    <p style={{ fontSize: '11px', color: DESIGN.colors.textSecondary }}>
                      {formData.mediaType === 'video' 
                        ? 'Only one video can be uploaded. Uploading a new video will replace the current one.'
                        : 'Multiple images can be uploaded. The first image will be used as the cover.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
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
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: DESIGN.borderRadius.button,
              background: DESIGN.colors.primary,
              color: DESIGN.colors.background,
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'opacity 0.2s'
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// QR Code Modal
interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
}

function QRCodeModal({ isOpen, onClose, event }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && event) {
      const generateQR = async () => {
        try {
          const qrUrl = `event://checkin/${event.id}`;
          const canvas = document.createElement('canvas');
          // Simple QR generation (in production, use a proper QR library)
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = 200;
            canvas.height = 200;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 200, 200);
            ctx.fillStyle = 'black';
            ctx.font = '20px Arial';
            ctx.fillText('Event QR Code', 20, 100);
            setQrDataUrl(canvas.toDataURL());
          }
        } catch (error) {
          console.error('QR generation error:', error);
        }
      };
      generateQR();
    }
  }, [isOpen, event]);

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
        maxWidth: '320px',
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
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: DESIGN.colors.textPrimary }}>
            Event QR Code
          </h2>
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
          <div style={{
            width: '200px',
            height: '200px',
            background: 'white',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" style={{ width: '100%', height: '100%' }} />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <QrCode className="w-12 h-12" style={{ color: DESIGN.colors.textSecondary, margin: '0 auto' }} />
                <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary, marginTop: '8px' }}>Generating QR...</p>
              </div>
            )}
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: DESIGN.colors.textPrimary, marginBottom: '4px' }}>
              {event.name}
            </h3>
            <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>
              Scan to check in • Event ID: {event.id.substring(0, 8)}
            </p>
          </div>
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
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: DESIGN.borderRadius.button,
              background: 'transparent',
              color: DESIGN.colors.textPrimary,
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
          <button
            onClick={() => {
              if (qrDataUrl) {
                const link = document.createElement('a');
                link.href = qrDataUrl;
                link.download = `qr-${event.id}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast({ title: 'Downloaded!', description: 'QR code saved to device' });
              }
            }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: DESIGN.borderRadius.button,
              background: DESIGN.colors.primary,
              color: DESIGN.colors.background,
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
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
  event: Event;
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
            Are you sure you want to delete <strong>"{event.name}"</strong>? This will remove:
          </p>
          
          <div style={{
            background: DESIGN.colors.background,
            borderRadius: DESIGN.borderRadius.button,
            padding: '12px',
            marginBottom: '16px'
          }}>
            <ul style={{ fontSize: '13px', color: DESIGN.colors.textSecondary, paddingLeft: '20px' }}>
              <li>All event details</li>
              <li>{event.attendees} attendee records</li>
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

// Real-time Notification Modal
interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: Event[];
  selectedEventId?: string;
}

function SendNotificationModal({ isOpen, onClose, events, selectedEventId }: SendNotificationModalProps) {
  const [selectedEvent, setSelectedEvent] = useState<string>(selectedEventId || 'all');
  const [notificationType, setNotificationType] = useState<'announcement' | 'reminder' | 'update' | 'emergency'>('announcement');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendTo, setSendTo] = useState<'all' | 'checked-in' | 'not-checked-in'>('all');
  const [scheduleFor, setScheduleFor] = useState<'now' | 'schedule'>('now');
  const [scheduledTime, setScheduledTime] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
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
      const event = events.find(e => e.id === selectedEvent);
      const eventName = selectedEvent === 'all' ? 'All Events' : event?.name || 'Event';
      
      await mockNotificationService.sendNotification(
        selectedEvent,
        title,
        message,
        notificationType
      );

      toast({ 
        title: 'Notification Sent!', 
        description: `Sent to ${eventName} attendees`,
        duration: 5000
      });

      setTitle('');
      setMessage('');
      setSelectedEvent(selectedEventId || 'all');
      
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send notification', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
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
  const { user, events, updateEvent, deleteEvent } = useApp();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('events');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [announcementText, setAnnouncementText] = useState('');
  const [liveAttendeeCount, setLiveAttendeeCount] = useState<number>(0);
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [actionEvent, setActionEvent] = useState<Event | null>(null);

  const userEvents = events.filter(e => e.organizerId === user?.id);
  const selectedEvent = selectedEventId ? events.find(e => e.id === selectedEventId) : null;

  const isPro = user?.subscription.tier === 'pro' || user?.subscription.tier === 'max';

  // Real-time updates for live events
  useEffect(() => {
    if (selectedEvent && selectedEvent.isActive) {
      const unsubscribe = mockNotificationService.subscribeToEvent(
        selectedEvent.id,
        (data) => {
          if (data.type === 'attendee_update') {
            setLiveAttendeeCount(data.data.checkedInCount);
          }
        }
      );
      
      return unsubscribe;
    }
  }, [selectedEvent]);

  // Prevent body scrolling when modals are open
  useEffect(() => {
    if (editModalOpen || qrModalOpen || deleteModalOpen || notificationModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [editModalOpen, qrModalOpen, deleteModalOpen, notificationModalOpen]);

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

  const getEventStatus = (event: typeof events[0]) => {
    const eventDate = new Date(event.date);
    const now = new Date();
    if (eventDate < now) return 'past';
    if (eventDate.toDateString() === now.toDateString()) return 'live';
    return 'upcoming';
  };

  const handleEditEvent = (event: Event) => {
    setActionEvent(event);
    setEditModalOpen(true);
  };

  const handleQRCode = (event: Event) => {
    setActionEvent(event);
    setQrModalOpen(true);
  };

  const handleDeleteEvent = (event: Event) => {
    setActionEvent(event);
    setDeleteModalOpen(true);
  };

  const handleSaveEvent = async (updatedData: Partial<Event>) => {
    if (actionEvent && updateEvent) {
      await updateEvent(actionEvent.id, updatedData);
      toast({ 
        title: 'Event Updated', 
        description: 'Attendees will be notified of changes',
        duration: 3000
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (actionEvent && deleteEvent) {
      await deleteEvent(actionEvent.id);
      setSelectedEventId(null);
      toast({ 
        title: 'Event Deleted', 
        description: 'Attendees have been notified',
        duration: 3000
      });
    }
  };

  const handleSendAnnouncement = () => {
    if (!announcementText.trim()) {
      toast({ title: 'Error', description: 'Please enter an announcement message', variant: 'destructive' });
      return;
    }

    toast({ 
      title: 'Announcement Sent!', 
      description: 'Your message has been sent to all attendees',
      duration: 5000
    });
    
    if (selectedEvent) {
      mockNotificationService.sendNotification(
        selectedEvent.id,
        'New Announcement',
        announcementText,
        'announcement'
      );
    }
    
    setAnnouncementText('');
  };

  const handleOpenNotificationModal = () => {
    setNotificationModalOpen(true);
  };

  const mockAttendees = [
    { id: '1', name: 'Sarah Chen', photo: 'https://i.pravatar.cc/100?img=5', checkedIn: true, ticketType: 'VIP', email: 'sarah@example.com' },
    { id: '2', name: 'Mike Johnson', photo: 'https://i.pravatar.cc/100?img=12', checkedIn: true, ticketType: 'General', email: 'mike@example.com' },
    { id: '3', name: 'Emily Davis', photo: 'https://i.pravatar.cc/100?img=9', checkedIn: false, ticketType: 'General', email: 'emily@example.com' },
    { id: '4', name: 'Alex Kim', photo: 'https://i.pravatar.cc/100?img=15', checkedIn: false, ticketType: 'VIP', email: 'alex@example.com' },
  ];

  const notificationHistory = [
    { id: '1', title: 'Event Starting Soon!', type: 'reminder', sentAt: '2 hours ago', readCount: 45, totalRecipients: 150 },
    { id: '2', title: 'Check-in Reminder', type: 'announcement', sentAt: 'Yesterday', readCount: 89, totalRecipients: 150 },
    { id: '3', title: 'Venue Update', type: 'update', sentAt: '2 days ago', readCount: 120, totalRecipients: 150 },
  ];

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

        {/* Tabs */}
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
            { key: 'attendees', label: 'Attendees', icon: Users },
            { key: 'analytics', label: 'Analytics', icon: BarChart3 },
            { key: 'messages', label: 'Messages', icon: MessageSquare },
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

      {/* Scrollable Content with proper spacing */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: DESIGN.spacing.default,
        paddingBottom: '24px' // Added bottom padding for better spacing
      }}>
        {/* My Events Tab */}
        {activeTab === 'events' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {userEvents.length > 0 ? (
              userEvents.map(event => {
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

                    {/* Media and Radius Info */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      marginBottom: '20px',
                      flexWrap: 'wrap'
                    }}>
                      {event.mediaType === 'video' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Film className="w-4 h-4" style={{ color: DESIGN.colors.primary }} />
                          <span style={{ fontSize: '13px', color: DESIGN.colors.textSecondary }}>Video</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Grid3x3 className="w-4 h-4" style={{ color: DESIGN.colors.primary }} />
                          <span style={{ fontSize: '13px', color: DESIGN.colors.textSecondary }}>
                            {event.images?.length || 0} photos
                          </span>
                        </div>
                      )}
                      <span style={{ fontSize: '13px', color: DESIGN.colors.textSecondary }}>•</span>
                      <span style={{ fontSize: '13px', color: DESIGN.colors.textSecondary }}>
                        Radius: {event.geofenceRadius}m
                      </span>
                    </div>

                    {/* Action Buttons - Optimized for Mobile */}
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
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <QrCode className="w-4 h-4" />
                        <span>QR</span>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEvent(event);
                        }}
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
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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
                  No Events Yet
                </h3>
                <p style={{ fontSize: '14px', color: DESIGN.colors.textSecondary, marginBottom: '16px' }}>
                  Create your first event to get started
                </p>
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
              </div>
            )}
          </div>
        )}

        {/* Attendees Tab */}
        {activeTab === 'attendees' && (
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

            {/* Live Stats */}
            {selectedEvent && selectedEvent.isActive && (
              <div style={{
                background: DESIGN.colors.card,
                padding: '12px',
                borderRadius: DESIGN.borderRadius.card,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                animation: 'pulse 2s infinite'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: DESIGN.colors.success,
                      animation: 'blink 1s infinite'
                    }} />
                    <span style={{ fontSize: '14px', fontWeight: '500', color: DESIGN.colors.textPrimary }}>
                      Live Now
                    </span>
                  </div>
                  <span style={{ fontSize: '14px', color: DESIGN.colors.success }}>
                    {liveAttendeeCount} checked in
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary, marginTop: '4px' }}>
                  Real-time updates every 5 seconds
                </p>
              </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div style={{
                background: DESIGN.colors.card,
                padding: '12px',
                borderRadius: DESIGN.borderRadius.card,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: DESIGN.colors.primary }}>
                  {selectedEvent ? selectedEvent.attendees : userEvents.reduce((sum, e) => sum + e.attendees, 0)}
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
                  {mockAttendees.filter(a => a.checkedIn).length}
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
                  {mockAttendees.filter(a => !a.checkedIn).length}
                </p>
                <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>Pending</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  const csvContent = 'data:text/csv;charset=utf-8,' + 
                    'Name,Email,Ticket Type,Checked In\n' +
                    mockAttendees.map(a => 
                      `${a.name},${a.email},${a.ticketType},${a.checkedIn ? 'Yes' : 'No'}`
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
                }}
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
                Export CSV
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

            {/* Attendees List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {mockAttendees.map(attendee => (
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
                  <img 
                    src={attendee.photo} 
                    alt={attendee.name}
                    style={{ width: '40px', height: '40px', borderRadius: DESIGN.borderRadius.roundButton, objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: DESIGN.colors.textPrimary }}>{attendee.name}</p>
                    <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>{attendee.ticketType} • {attendee.email}</p>
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
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                  {userEvents.reduce((sum, e) => sum + e.attendees, 0)}
                </p>
                <p style={{ fontSize: '12px', color: DESIGN.colors.success, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <TrendingUp className="w-3 h-3" />
                  +12% from last month
                </p>
              </div>
              <div style={{
                background: DESIGN.colors.card,
                padding: '16px',
                borderRadius: DESIGN.borderRadius.card,
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Calendar className="w-5 h-5" style={{ color: DESIGN.colors.primary }} />
                  <span style={{ fontSize: '14px', color: DESIGN.colors.textSecondary }}>Events Created</span>
                </div>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: DESIGN.colors.textPrimary }}>{userEvents.length}</p>
                <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary, marginTop: '4px' }}>
                  All time
                </p>
              </div>
            </div>

            <div style={{
              background: DESIGN.colors.card,
              padding: '16px',
              borderRadius: DESIGN.borderRadius.card,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: DESIGN.colors.textPrimary }}>Check-in Rate</h3>
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

            <div style={{
              background: DESIGN.colors.card,
              padding: '16px',
              borderRadius: DESIGN.borderRadius.card,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: DESIGN.colors.textPrimary }}>Top Performing Events</h3>
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
                        {event.attendees} attendees • {event.mediaType === 'video' ? 'Video' : 'Carousel'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Quick Send Card */}
            <div style={{
              background: DESIGN.colors.card,
              padding: '16px',
              borderRadius: DESIGN.borderRadius.card,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: DESIGN.colors.textPrimary }}>Quick Announcement</h3>
                <button
                  onClick={handleOpenNotificationModal}
                  style={{
                    padding: '6px 12px',
                    border: 'none',
                    borderRadius: DESIGN.borderRadius.button,
                    background: DESIGN.colors.notification,
                    color: DESIGN.colors.background,
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Bell className="w-3 h-3" />
                  Advanced
                </button>
              </div>
              
              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Type a quick announcement..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: DESIGN.colors.background,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: DESIGN.borderRadius.button,
                  color: DESIGN.colors.textPrimary,
                  fontSize: '15px',
                  marginBottom: '12px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />

              <button
                onClick={handleSendAnnouncement}
                disabled={!announcementText.trim()}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  borderRadius: DESIGN.borderRadius.button,
                  background: DESIGN.colors.primary,
                  color: DESIGN.colors.background,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: !announcementText.trim() ? 0.5 : 1,
                  cursor: !announcementText.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                <Send className="w-4 h-4" />
                Send to All Events
              </button>
            </div>

            {/* Notification History */}
            <div style={{
              background: DESIGN.colors.card,
              padding: '16px',
              borderRadius: DESIGN.borderRadius.card,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: DESIGN.colors.textPrimary }}>Recent Notifications</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notificationHistory.map(notification => (
                  <div key={notification.id} style={{
                    padding: '12px',
                    borderRadius: DESIGN.borderRadius.button,
                    background: DESIGN.colors.background,
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '2px 6px',
                          fontSize: '10px',
                          borderRadius: DESIGN.borderRadius.smallPill,
                          background: notification.type === 'emergency' ? `${DESIGN.colors.danger}20` : 
                                    notification.type === 'reminder' ? `${DESIGN.colors.warning}20` :
                                    notification.type === 'update' ? `${DESIGN.colors.info}20` :
                                    `${DESIGN.colors.primary}20`,
                          color: notification.type === 'emergency' ? DESIGN.colors.danger : 
                                notification.type === 'reminder' ? DESIGN.colors.warning :
                                notification.type === 'update' ? DESIGN.colors.info :
                                DESIGN.colors.primary
                        }}>
                          {notification.type}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: DESIGN.colors.textPrimary }}>
                          {notification.title}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: DESIGN.colors.textSecondary }}>
                        {notification.sentAt}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', color: DESIGN.colors.textSecondary }}>
                        Delivered to {notification.totalRecipients} attendees
                      </span>
                      <span style={{ fontSize: '11px', color: DESIGN.colors.success }}>
                        {Math.round((notification.readCount / notification.totalRecipients) * 100)}% opened
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Templates */}
            <div style={{
              background: DESIGN.colors.card,
              padding: '16px',
              borderRadius: DESIGN.borderRadius.card,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: DESIGN.colors.textPrimary }}>Quick Templates</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  'Event starting soon! Get ready 🎉',
                  'Reminder: Check in when you arrive',
                  'Thank you for attending! Hope to see you again',
                  'Event details have been updated',
                ].map((template, i) => (
                  <button
                    key={i}
                    onClick={() => setAnnouncementText(template)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px',
                      borderRadius: DESIGN.borderRadius.button,
                      background: DESIGN.colors.background,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      fontSize: '14px',
                      color: DESIGN.colors.textPrimary,
                      transition: 'border-color 0.2s',
                      cursor: 'pointer'
                    }}
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

            <div style={{
              background: DESIGN.colors.card,
              padding: '16px',
              borderRadius: DESIGN.borderRadius.card,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: DESIGN.colors.textPrimary }}>Event Defaults</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                    Default Check-in Radius
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
          <EditEventModal
            isOpen={editModalOpen}
            onClose={() => { setEditModalOpen(false); setActionEvent(null); }}
            event={actionEvent}
            onSave={handleSaveEvent}
          />
          
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
          
          <SendNotificationModal
            isOpen={notificationModalOpen}
            onClose={() => setNotificationModalOpen(false)}
            events={userEvents}
            selectedEventId={selectedEventId || undefined}
          />
        </>
      )}

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
