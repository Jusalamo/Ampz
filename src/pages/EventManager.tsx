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
  Copy,
  Share2,
  MapPin,
  DollarSign,
  Image as ImageIcon,
  AlertTriangle,
  Loader2,
  Film,
  Grid3x3,
  Upload,
  Link,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Event } from '@/lib/types';
import QRCode from 'qrcode';

// Design Constants matching Connect screen
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
    info: '#3B82F6'
  },
  spacing: {
    default: '16px',
    cardPadding: '16px',
    buttonGap: '12px',
    modalPadding: '20px',
    modalFooterHeight: '72px' // Height for sticky footer buttons
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
  });
  
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(event.images || []);
  const [activeTab, setActiveTab] = useState<'details' | 'media'>('details');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);

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
      });
      setUploadedFiles(event.images || []);
    }
  }, [event]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: string[] = [];
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newFiles.push(e.target.result as string);
          if (newFiles.length === files.length) {
            setUploadedFiles(prev => [...prev, ...newFiles]);
            toast({ title: 'Success', description: `${files.length} files uploaded` });
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Event name is required', variant: 'destructive' });
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        images: uploadedFiles,
        coverImage: uploadedFiles[0] || event.coverImage
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
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ 
      background: 'rgba(0, 0, 0, 0.7)', 
      backdropFilter: 'blur(4px)',
      padding: DESIGN.spacing.default 
    }}>
      <div style={{
        background: DESIGN.colors.card,
        borderRadius: DESIGN.borderRadius.card,
        width: '100%',
        maxWidth: '512px',
        maxHeight: '90vh',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          background: DESIGN.colors.card,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: DESIGN.spacing.default,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: DESIGN.colors.textPrimary }}>Edit Event</h2>
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

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
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
                textTransform: 'capitalize'
              }}
            >
              {tab === 'details' ? 'Event Details' : 'Media'}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div 
          ref={contentRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: DESIGN.spacing.default,
            paddingBottom: `calc(${DESIGN.spacing.modalFooterHeight} + ${DESIGN.spacing.default})`
          }}
        >
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
                  Media Type *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setFormData({ ...formData, mediaType: 'carousel' })}
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
                      cursor: 'pointer'
                    }}
                  >
                    <Grid3x3 className="w-5 h-5" style={{ color: DESIGN.colors.textPrimary }} />
                    <span style={{ fontSize: '14px', color: DESIGN.colors.textPrimary }}>Carousel</span>
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, mediaType: 'video' })}
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
                      cursor: 'pointer'
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
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                  Upload {formData.mediaType === 'video' ? 'Video' : 'Images'}
                </label>
                <div
                  onClick={() => document.getElementById('file-upload')?.click()}
                  style={{
                    width: '100%',
                    padding: '24px',
                    border: '2px dashed rgba(255, 255, 255, 0.2)',
                    borderRadius: DESIGN.borderRadius.button,
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s'
                  }}
                >
                  <Upload className="w-8 h-8" style={{ color: DESIGN.colors.textSecondary }} />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', color: DESIGN.colors.textPrimary, marginBottom: '4px' }}>
                      Click to upload or drag and drop
                    </p>
                    <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>
                      {formData.mediaType === 'video' 
                        ? 'MP4, MOV up to 100MB' 
                        : 'JPG, PNG up to 10MB each'
                      }
                    </p>
                  </div>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept={formData.mediaType === 'video' ? 'video/*' : 'image/*'}
                  multiple={formData.mediaType !== 'video'}
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: DESIGN.colors.textPrimary }}>
                      Uploaded Files ({uploadedFiles.length})
                    </label>
                    <button
                      onClick={() => setUploadedFiles([])}
                      type="button"
                      style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        color: DESIGN.colors.danger,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          background: DESIGN.colors.background,
                          borderRadius: DESIGN.borderRadius.button,
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        {formData.mediaType === 'video' ? (
                          <Film className="w-5 h-5" style={{ color: DESIGN.colors.primary }} />
                        ) : (
                          <ImageIcon className="w-5 h-5" style={{ color: DESIGN.colors.primary }} />
                        )}
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '13px', color: DESIGN.colors.textPrimary }}>
                            {formData.mediaType === 'video' ? `Video ${index + 1}` : `Image ${index + 1}`}
                          </p>
                          <p style={{ fontSize: '11px', color: DESIGN.colors.textSecondary }}>
                            {index === 0 ? 'Main Cover' : 'Gallery'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveFile(index)}
                          type="button"
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
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Footer Buttons */}
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
          flexShrink: 0
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
            onClick={handleSave}
            disabled={isSaving}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: DESIGN.borderRadius.button,
              background: DESIGN.colors.primary,
              color: DESIGN.colors.background,
              fontSize: '15px',
              fontWeight: '500',
              opacity: isSaving ? 0.7 : 1,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
}

function QRCodeModal({ isOpen, onClose, event }: QRCodeModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && event) {
      generateQRCode();
    }
  }, [isOpen, event]);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      const qrData = JSON.stringify({
        eventId: event.id,
        eventName: event.name,
        type: 'event_checkin',
        timestamp: new Date().toISOString(),
        accessCode: event.qrCode
      });

      const dataUrl = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      });
      
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({ title: 'Error', description: 'Failed to generate QR code', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `${event.name.replace(/\s+/g, '-')}-QR-Code.png`;
    link.href = qrCodeDataUrl;
    link.click();
    
    toast({ title: 'Downloaded!', description: 'QR code saved to your device' });
  };

  const copyAccessCode = () => {
    navigator.clipboard.writeText(event.qrCode);
    toast({ title: 'Copied!', description: 'Access code copied to clipboard' });
  };

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        const blob = await (await fetch(qrCodeDataUrl)).blob();
        const file = new File([blob], `${event.name}-QR.png`, { type: 'image/png' });
        await navigator.share({
          title: event.name,
          text: `Scan this QR code to check in to ${event.name}`,
          files: [file]
        });
      } catch (error) {
        copyAccessCode();
      }
    } else {
      copyAccessCode();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ 
      background: 'rgba(0, 0, 0, 0.7)', 
      backdropFilter: 'blur(4px)',
      padding: DESIGN.spacing.default 
    }}>
      <div style={{
        background: DESIGN.colors.card,
        borderRadius: DESIGN.borderRadius.card,
        width: '100%',
        maxWidth: '384px',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: DESIGN.spacing.default,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          flexShrink: 0
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: DESIGN.colors.textPrimary }}>Event QR Code</h2>
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
        
        {/* Scrollable Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          paddingBottom: `calc(${DESIGN.spacing.modalFooterHeight} + 24px)`
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: DESIGN.borderRadius.cardInner,
            padding: '16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isGenerating ? (
              <div style={{ width: '192px', height: '192px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#9CA3AF' }} />
              </div>
            ) : (
              <img src={qrCodeDataUrl} alt="Event QR Code" style={{ width: '192px', height: '192px' }} />
            )}
          </div>
          
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: DESIGN.colors.textPrimary }}>{event.name}</h3>
            <p style={{ fontSize: '14px', color: DESIGN.colors.textSecondary }}>
              {event.date} at {event.time}
            </p>
            <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary, marginTop: '4px' }}>
              Media: {event.mediaType === 'video' ? 'Video' : 'Image Carousel'}
            </p>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: DESIGN.borderRadius.cardInner,
            padding: '12px',
            marginBottom: '16px'
          }}>
            <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary, marginBottom: '4px' }}>Access Code</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <code style={{
                fontFamily: 'monospace',
                fontSize: '18px',
                fontWeight: 'bold',
                letterSpacing: '0.05em',
                color: DESIGN.colors.textPrimary
              }}>
                {event.qrCode}
              </code>
              <button 
                onClick={copyAccessCode} 
                style={{
                  padding: '8px',
                  borderRadius: DESIGN.borderRadius.button,
                  background: 'transparent',
                  color: DESIGN.colors.textPrimary,
                  transition: 'background 0.2s',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div style={{
          position: 'sticky',
          bottom: 0,
          background: DESIGN.colors.card,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '16px 24px',
          display: 'flex',
          gap: '12px',
          flexShrink: 0
        }}>
          <button
            onClick={shareQRCode}
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
              cursor: 'pointer'
            }}
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button
            onClick={downloadQRCode}
            disabled={!qrCodeDataUrl}
            style={{
              flex: 1,
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
              opacity: !qrCodeDataUrl ? 0.5 : 1,
              cursor: !qrCodeDataUrl ? 'not-allowed' : 'pointer'
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

interface DeleteEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  onDelete: () => Promise<void>;
}

function DeleteEventModal({ isOpen, onClose, event, onDelete }: DeleteEventModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      toast({ title: 'Error', description: 'Please type DELETE to confirm', variant: 'destructive' });
      return;
    }
    
    setIsDeleting(true);
    try {
      await onDelete();
      toast({ title: 'Deleted', description: 'Event has been permanently deleted' });
      onClose();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete event', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ 
      background: 'rgba(0, 0, 0, 0.7)', 
      backdropFilter: 'blur(4px)',
      padding: DESIGN.spacing.default 
    }}>
      <div style={{
        background: DESIGN.colors.card,
        borderRadius: DESIGN.borderRadius.card,
        width: '100%',
        maxWidth: '384px',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Content */}
        <div style={{ 
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          paddingBottom: `calc(${DESIGN.spacing.modalFooterHeight} + 24px)`,
          textAlign: 'center' 
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: DESIGN.borderRadius.roundButton,
            background: `${DESIGN.colors.danger}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <AlertTriangle className="w-8 h-8" style={{ color: DESIGN.colors.danger }} />
          </div>
          
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: DESIGN.colors.textPrimary }}>
            Delete Event?
          </h2>
          <p style={{ fontSize: '14px', color: DESIGN.colors.textSecondary, marginBottom: '16px' }}>
            This will permanently delete <strong>"{event.name}"</strong> and all associated data including attendees and tickets.
          </p>
          
          <div style={{
            background: `${DESIGN.colors.danger}10`,
            borderRadius: DESIGN.borderRadius.cardInner,
            padding: '12px',
            marginBottom: '16px',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '12px', color: DESIGN.colors.danger, marginBottom: '8px' }}>
              This action cannot be undone. Type DELETE to confirm:
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="Type DELETE"
              style={{
                width: '100%',
                padding: '12px',
                background: DESIGN.colors.background,
                border: `1px solid ${DESIGN.colors.danger}50`,
                borderRadius: DESIGN.borderRadius.button,
                color: DESIGN.colors.textPrimary,
                fontSize: '15px'
              }}
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div style={{
          position: 'sticky',
          bottom: 0,
          background: DESIGN.colors.card,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '16px 24px',
          display: 'flex',
          gap: '12px',
          flexShrink: 0
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
            onClick={handleDelete}
            disabled={confirmText !== 'DELETE' || isDeleting}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: DESIGN.borderRadius.button,
              background: DESIGN.colors.danger,
              color: DESIGN.colors.textPrimary,
              fontSize: '15px',
              fontWeight: '500',
              opacity: (confirmText !== 'DELETE' || isDeleting) ? 0.5 : 1,
              cursor: (confirmText !== 'DELETE' || isDeleting) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Delete
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
  
  // Settings state
  const [settings, setSettings] = useState({
    defaultRadius: 100,
    defaultThemeColor: '#8B5CF6',
    defaultMediaType: 'carousel' as 'carousel' | 'video',
    notifications: {
      emailCheckin: true,
      pushNewAttendees: true,
      weeklyAnalytics: false
    }
  });
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [actionEvent, setActionEvent] = useState<Event | null>(null);

  const userEvents = events.filter(e => e.organizerId === user?.id);
  const selectedEvent = selectedEventId ? events.find(e => e.id === selectedEventId) : null;

  const isPro = user?.subscription.tier === 'pro' || user?.subscription.tier === 'max';

  // Load saved settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('eventManagerSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('eventManagerSettings', JSON.stringify(settings));
  }, [settings]);

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
      updateEvent(actionEvent.id, updatedData);
    }
  };

  const handleConfirmDelete = async () => {
    if (actionEvent && deleteEvent) {
      deleteEvent(actionEvent.id);
      setSelectedEventId(null);
    }
  };

  // Mock attendees data
  const mockAttendees = [
    { id: '1', name: 'Sarah Chen', photo: 'https://i.pravatar.cc/100?img=5', checkedIn: true, ticketType: 'VIP' },
    { id: '2', name: 'Mike Johnson', photo: 'https://i.pravatar.cc/100?img=12', checkedIn: true, ticketType: 'General' },
    { id: '3', name: 'Emily Davis', photo: 'https://i.pravatar.cc/100?img=9', checkedIn: false, ticketType: 'General' },
    { id: '4', name: 'Alex Kim', photo: 'https://i.pravatar.cc/100?img=15', checkedIn: false, ticketType: 'VIP' },
  ];

  const handleSendAnnouncement = () => {
    if (!announcementText.trim()) {
      toast({ title: 'Error', description: 'Please enter an announcement message', variant: 'destructive' });
      return;
    }

    // In a real app, this would send to a backend
    toast({ 
      title: 'Announcement Sent!', 
      description: 'Your message has been sent to all attendees'
    });
    setAnnouncementText('');
  };

  const handleExportAttendees = () => {
    // In a real app, this would generate and download a CSV
    toast({ 
      title: 'Export Started', 
      description: 'CSV file will download shortly'
    });
    
    // Mock CSV generation
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      'Name,Email,Ticket Type,Checked In\n' +
      mockAttendees.map(a => 
        `${a.name},${a.name.toLowerCase().replace(' ', '.')}@example.com,${a.ticketType},${a.checkedIn ? 'Yes' : 'No'}`
      ).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedEvent?.name || 'attendees'}_list.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              cursor: 'pointer'
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
              cursor: 'pointer'
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
                padding: '8px 12px',
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
                cursor: 'pointer'
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
        padding: DESIGN.spacing.default 
      }}>
        {/* My Events Tab */}
        {activeTab === 'events' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex' }}>
                      <img 
                        src={event.coverImage} 
                        alt={event.name}
                        style={{ width: '96px', height: '96px', objectFit: 'cover' }}
                      />
                      <div style={{ flex: 1, padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: DESIGN.colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {event.name}
                          </h3>
                          <span style={{
                            padding: '2px 8px',
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
                        <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary, marginTop: '4px' }}>
                          {event.date} • {event.attendees} attendees
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          {event.mediaType === 'video' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Film className="w-3 h-3" style={{ color: DESIGN.colors.primary }} />
                              <span style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>Video</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Grid3x3 className="w-3 h-3" style={{ color: DESIGN.colors.primary }} />
                              <span style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>
                                {event.images?.length || 0} photos
                              </span>
                            </div>
                          )}
                          <span style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>•</span>
                          <span style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>
                            Radius: {event.geofenceRadius}m
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <button
                            onClick={() => navigate(`/event/${event.id}`)}
                            style={{
                              height: '28px',
                              padding: '0 12px',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              borderRadius: DESIGN.borderRadius.button,
                              background: 'transparent',
                              color: DESIGN.colors.textPrimary,
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                          <button
                            onClick={() => handleEditEvent(event)}
                            style={{
                              height: '28px',
                              padding: '0 12px',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              borderRadius: DESIGN.borderRadius.button,
                              background: 'transparent',
                              color: DESIGN.colors.textPrimary,
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleQRCode(event)}
                            style={{
                              height: '28px',
                              padding: '0 12px',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              borderRadius: DESIGN.borderRadius.button,
                              background: 'transparent',
                              color: DESIGN.colors.textPrimary,
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <QrCode className="w-3 h-3" />
                            QR
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event)}
                            style={{
                              height: '28px',
                              width: '28px',
                              borderRadius: DESIGN.borderRadius.button,
                              background: 'transparent',
                              color: DESIGN.colors.danger,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
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

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div style={{
                background: DESIGN.colors.card,
                padding: '12px',
                borderRadius: DESIGN.borderRadius.card,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: DESIGN.colors.primary }}>{mockAttendees.length}</p>
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

            {/* Export Button */}
            <button
              onClick={handleExportAttendees}
              style={{
                width: '100%',
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
                cursor: 'pointer'
              }}
            >
              <Download className="w-4 h-4" />
              Export Attendee List (CSV)
            </button>

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
                  gap: '12px'
                }}>
                  <img 
                    src={attendee.photo} 
                    alt={attendee.name}
                    style={{ width: '40px', height: '40px', borderRadius: DESIGN.borderRadius.roundButton, objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: DESIGN.colors.textPrimary }}>{attendee.name}</p>
                    <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary }}>{attendee.ticketType}</p>
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
                        transition: 'height 0.5s',
                        position: 'absolute',
                        bottom: 0,
                        height: `${val}%`
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
            <div style={{
              background: DESIGN.colors.card,
              padding: '16px',
              borderRadius: DESIGN.borderRadius.card,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: DESIGN.colors.textPrimary }}>Send Announcement</h3>
              <p style={{ fontSize: '14px', color: DESIGN.colors.textSecondary, marginBottom: '16px' }}>
                Send a message to all attendees of your events
              </p>
              
              {/* Event Selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>Select Event</label>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                  <button style={{
                    padding: '8px 12px',
                    borderRadius: DESIGN.borderRadius.button,
                    fontSize: '12px',
                    fontWeight: '500',
                    whiteSpace: 'nowrap',
                    background: DESIGN.colors.primary,
                    color: DESIGN.colors.background,
                    border: 'none',
                    cursor: 'pointer'
                  }}>
                    All Events
                  </button>
                  {userEvents.map(event => (
                    <button
                      key={event.id}
                      style={{
                        padding: '8px 12px',
                        borderRadius: DESIGN.borderRadius.button,
                        fontSize: '12px',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                        background: DESIGN.colors.card,
                        color: DESIGN.colors.textSecondary,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer'
                      }}
                    >
                      {event.name}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Type your announcement..."
                rows={4}
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
                Send Announcement
              </button>
            </div>

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
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: DESIGN.colors.textPrimary }}>Event Defaults</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                    Default Check-in Radius
                  </label>
                  <input 
                    type="number" 
                    value={settings.defaultRadius}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      defaultRadius: parseInt(e.target.value) || 100 
                    }))}
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
                  <p style={{ fontSize: '12px', color: DESIGN.colors.textSecondary, marginTop: '4px' }}>Default radius in meters</p>
                </div>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                    Default Theme Color
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#3B82F6'].map(color => (
                      <button
                        key={color}
                        onClick={() => setSettings(prev => ({ ...prev, defaultThemeColor: color }))}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: DESIGN.borderRadius.roundButton,
                          border: `2px solid ${settings.defaultThemeColor === color ? DESIGN.colors.textPrimary : 'rgba(255, 255, 255, 0.1)'}`,
                          background: color,
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: DESIGN.colors.textPrimary }}>
                    Default Media Type
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => setSettings(prev => ({ ...prev, defaultMediaType: 'carousel' }))}
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: `1px solid ${settings.defaultMediaType === 'carousel' ? DESIGN.colors.primary : 'rgba(255, 255, 255, 0.1)'}`,
                        borderRadius: DESIGN.borderRadius.button,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        background: settings.defaultMediaType === 'carousel' ? `${DESIGN.colors.primary}20` : 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <Grid3x3 className="w-5 h-5" style={{ color: DESIGN.colors.textPrimary }} />
                      <span style={{ fontSize: '14px', color: DESIGN.colors.textPrimary }}>Carousel</span>
                    </button>
                    <button 
                      onClick={() => setSettings(prev => ({ ...prev, defaultMediaType: 'video' }))}
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: `1px solid ${settings.defaultMediaType === 'video' ? DESIGN.colors.primary : 'rgba(255, 255, 255, 0.1)'}`,
                        borderRadius: DESIGN.borderRadius.button,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        background: settings.defaultMediaType === 'video' ? `${DESIGN.colors.primary}20` : 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <Film className="w-5 h-5" style={{ color: DESIGN.colors.textPrimary }} />
                      <span style={{ fontSize: '14px', color: DESIGN.colors.textPrimary }}>Video</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              background: DESIGN.colors.card,
              padding: '16px',
              borderRadius: DESIGN.borderRadius.card,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: DESIGN.colors.textPrimary }}>Notifications</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <ToggleSwitch
                  enabled={settings.notifications.emailCheckin}
                  onChange={(enabled) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, emailCheckin: enabled }
                  }))}
                  label="Email me when someone checks in"
                />
                <ToggleSwitch
                  enabled={settings.notifications.pushNewAttendees}
                  onChange={(enabled) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, pushNewAttendees: enabled }
                  }))}
                  label="Push notifications for new attendees"
                />
                <ToggleSwitch
                  enabled={settings.notifications.weeklyAnalytics}
                  onChange={(enabled) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, weeklyAnalytics: enabled }
                  }))}
                  label="Weekly analytics summary"
                />
              </div>
            </div>

            <button
              onClick={() => {
                toast({ 
                  title: 'Confirm deletion', 
                  description: 'Use the delete button on individual events instead',
                  variant: 'destructive'
                });
              }}
              style={{
                width: '100%',
                padding: '12px',
                border: 'none',
                borderRadius: DESIGN.borderRadius.button,
                background: DESIGN.colors.danger,
                color: DESIGN.colors.textPrimary,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <Trash2 className="w-4 h-4" />
              Delete All Events
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
            onDelete={handleConfirmDelete}
          />
        </>
      )}

      <BottomNav />
    </div>
  );
}
