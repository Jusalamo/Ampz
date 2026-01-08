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
  Grid3x3
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Event } from '@/lib/types';
import QRCode from 'qrcode';

type Tab = 'events' | 'attendees' | 'analytics' | 'messages' | 'settings';

// Modal Components
interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  onSave: (updatedEvent: Partial<Event>) => void;
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
  const [isSaving, setIsSaving] = useState(false);
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
      });
    }
  }, [event]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Event name is required', variant: 'destructive' });
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(formData);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Edit Event</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Event Name</label>
            <Input 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter event name"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <Textarea 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter event description"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Date</label>
              <Input 
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Time</label>
              <Input 
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Venue Name</label>
            <Input 
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Enter venue name"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Address</label>
            <Input 
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter full address"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Price (NAD)</label>
              <Input 
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Max Attendees</label>
              <Input 
                type="number"
                value={formData.maxAttendees}
                onChange={(e) => setFormData({ ...formData, maxAttendees: parseInt(e.target.value) || 100 })}
                placeholder="100"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Check-in Radius (meters)</label>
            <Input 
              type="number"
              value={formData.geofenceRadius}
              onChange={(e) => setFormData({ ...formData, geofenceRadius: parseInt(e.target.value) || 50 })}
              placeholder="50"
            />
            <p className="text-xs text-muted-foreground mt-1">Users must be within this radius to check in</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Media Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormData({ ...formData, mediaType: 'carousel' })}
                className={cn(
                  'flex-1 p-3 border rounded-lg flex flex-col items-center gap-2',
                  formData.mediaType === 'carousel' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border'
                )}
              >
                <Grid3x3 className="w-5 h-5" />
                <span className="text-sm">Carousel</span>
              </button>
              <button
                onClick={() => setFormData({ ...formData, mediaType: 'video' })}
                className={cn(
                  'flex-1 p-3 border rounded-lg flex flex-col items-center gap-2',
                  formData.mediaType === 'video' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border'
                )}
              >
                <Film className="w-5 h-5" />
                <span className="text-sm">Video</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Display type on event details page</p>
          </div>
        </div>
        
        <div className="sticky bottom-0 bg-card border-t border-border p-4 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && event) {
      generateQRCode();
    }
  }, [isOpen, event]);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      // Create unique QR data for this event
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl w-full max-w-sm overflow-hidden border border-border">
        <div className="p-4 flex items-center justify-between border-b border-border">
          <h2 className="text-lg font-bold">Event QR Code</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="bg-white rounded-xl p-4 mb-4 flex items-center justify-center">
            {isGenerating ? (
              <div className="w-48 h-48 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <img src={qrCodeDataUrl} alt="Event QR Code" className="w-48 h-48" />
            )}
          </div>
          
          <div className="text-center mb-4">
            <h3 className="font-bold">{event.name}</h3>
            <p className="text-sm text-muted-foreground">{event.date} at {event.time}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Media: {event.mediaType === 'video' ? 'Video' : 'Image Carousel'}
            </p>
          </div>
          
          <div className="bg-muted rounded-xl p-3 mb-4">
            <p className="text-xs text-muted-foreground mb-1">Access Code</p>
            <div className="flex items-center justify-between">
              <code className="font-mono text-lg font-bold tracking-wider">{event.qrCode}</code>
              <button onClick={copyAccessCode} className="p-2 hover:bg-background rounded-lg transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={shareQRCode} className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button onClick={downloadQRCode} disabled={!qrCodeDataUrl} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DeleteEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  onDelete: () => void;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl w-full max-w-sm overflow-hidden border border-border">
        <div className="p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          
          <h2 className="text-xl font-bold mb-2">Delete Event?</h2>
          <p className="text-muted-foreground text-sm mb-4">
            This will permanently delete <strong>"{event.name}"</strong> and all associated data including attendees and tickets.
          </p>
          
          <div className="bg-destructive/10 rounded-xl p-3 mb-4 text-left">
            <p className="text-xs text-destructive mb-2">This action cannot be undone. Type DELETE to confirm:</p>
            <Input 
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="Type DELETE"
              className="border-destructive/50 focus:border-destructive"
            />
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={confirmText !== 'DELETE' || isDeleting}
              className="flex-1"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          </div>
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
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [actionEvent, setActionEvent] = useState<Event | null>(null);

  const userEvents = events.filter(e => e.organizerId === user?.id);
  const selectedEvent = selectedEventId ? events.find(e => e.id === selectedEventId) : null;

  const isPro = user?.subscription.tier === 'pro' || user?.subscription.tier === 'max';

  if (!isPro) {
    return (
      <div className="app-container min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Event Manager</h1>
          <p className="text-muted-foreground mb-6">
            Upgrade to Pro or Max to create and manage events
          </p>
          <Button onClick={() => navigate('/settings')} className="w-full">
            Upgrade Now
          </Button>
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

  return (
    <div className="app-container min-h-screen bg-background pb-nav">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Event Manager</h1>
            <p className="text-xs text-muted-foreground">{userEvents.length} events</p>
          </div>
          <Button size="sm" onClick={() => navigate('/events')}>
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-1 pb-3 overflow-x-auto no-scrollbar">
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
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5',
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* My Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            {userEvents.length > 0 ? (
              userEvents.map(event => {
                const status = getEventStatus(event);
                return (
                  <div 
                    key={event.id} 
                    className={cn(
                      "bg-card rounded-xl border overflow-hidden",
                      selectedEventId === event.id ? "border-primary" : "border-border"
                    )}
                  >
                    <div className="flex">
                      <img 
                        src={event.coverImage} 
                        alt={event.name}
                        className="w-24 h-24 object-cover"
                      />
                      <div className="flex-1 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-sm line-clamp-1">{event.name}</h3>
                          <span className={cn(
                            'px-2 py-0.5 text-xs rounded-full font-medium',
                            status === 'live' && 'bg-green-500/20 text-green-500',
                            status === 'upcoming' && 'bg-primary/20 text-primary',
                            status === 'past' && 'bg-muted text-muted-foreground'
                          )}>
                            {status === 'live' ? '🔴 Live' : status === 'upcoming' ? 'Upcoming' : 'Past'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {event.date} • {event.attendees} attendees
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {event.mediaType === 'video' ? (
                            <div className="flex items-center gap-1">
                              <Film className="w-3 h-3 text-primary" />
                              <span className="text-xs text-muted-foreground">Video</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Grid3x3 className="w-3 h-3 text-primary" />
                              <span className="text-xs text-muted-foreground">
                                {event.images?.length || 0} photos
                              </span>
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            Radius: {event.geofenceRadius}m
                          </span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs"
                            onClick={() => navigate(`/event/${event.id}`)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs"
                            onClick={() => handleEditEvent(event)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs"
                            onClick={() => handleQRCode(event)}
                          >
                            <QrCode className="w-3 h-3 mr-1" />
                            QR
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={() => handleDeleteEvent(event)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-bold mb-2">No Events Yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Create your first event to get started
                </p>
                <Button onClick={() => navigate('/events')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Attendees Tab */}
        {activeTab === 'attendees' && (
          <div className="space-y-4">
            {/* Event Selector */}
            {userEvents.length > 0 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {userEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEventId(event.id)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all border',
                      selectedEventId === event.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-muted-foreground border-border'
                    )}
                  >
                    {event.name}
                  </button>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card p-3 rounded-xl border border-border text-center">
                <p className="text-2xl font-bold text-primary">{mockAttendees.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="bg-card p-3 rounded-xl border border-border text-center">
                <p className="text-2xl font-bold text-green-500">
                  {mockAttendees.filter(a => a.checkedIn).length}
                </p>
                <p className="text-xs text-muted-foreground">Checked In</p>
              </div>
              <div className="bg-card p-3 rounded-xl border border-border text-center">
                <p className="text-2xl font-bold text-yellow-500">
                  {mockAttendees.filter(a => !a.checkedIn).length}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>

            {/* Export Button */}
            <Button variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Export Attendee List (CSV)
            </Button>

            {/* Attendees List */}
            <div className="space-y-2">
              {mockAttendees.map(attendee => (
                <div key={attendee.id} className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
                  <img 
                    src={attendee.photo} 
                    alt={attendee.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{attendee.name}</p>
                    <p className="text-xs text-muted-foreground">{attendee.ticketType}</p>
                  </div>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs flex items-center gap-1',
                    attendee.checkedIn 
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-yellow-500/20 text-yellow-500'
                  )}>
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
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card p-4 rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Total Attendees</span>
                </div>
                <p className="text-3xl font-bold">
                  {userEvents.reduce((sum, e) => sum + e.attendees, 0)}
                </p>
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  +12% from last month
                </p>
              </div>
              <div className="bg-card p-4 rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Events Created</span>
                </div>
                <p className="text-3xl font-bold">{userEvents.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All time
                </p>
              </div>
            </div>

            <div className="bg-card p-4 rounded-xl border border-border">
              <h3 className="font-semibold mb-4">Check-in Rate</h3>
              <div className="h-40 flex items-end justify-center gap-2">
                {[65, 78, 45, 90, 82, 55, 70].map((val, i) => (
                  <div 
                    key={i}
                    className="w-8 rounded-t-lg bg-primary/20"
                    style={{ height: `${val}%` }}
                  >
                    <div 
                      className="w-full bg-primary rounded-t-lg transition-all duration-500"
                      style={{ height: `${val}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>

            <div className="bg-card p-4 rounded-xl border border-border">
              <h3 className="font-semibold mb-3">Top Performing Events</h3>
              <div className="space-y-3">
                {userEvents.slice(0, 3).map((event, i) => (
                  <div key={event.id} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.name}</p>
                      <p className="text-xs text-muted-foreground">
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
          <div className="space-y-4">
            <div className="bg-card p-4 rounded-xl border border-border">
              <h3 className="font-semibold mb-3">Send Announcement</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Send a message to all attendees of your events
              </p>
              
              {/* Event Selector */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Select Event</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  <button className="px-3 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground">
                    All Events
                  </button>
                  {userEvents.map(event => (
                    <button
                      key={event.id}
                      className="px-3 py-2 rounded-lg text-xs font-medium bg-card text-muted-foreground border border-border whitespace-nowrap"
                    >
                      {event.name}
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Type your announcement..."
                rows={4}
                className="mb-3"
              />

              <Button className="w-full" disabled={!announcementText.trim()}>
                <Send className="w-4 h-4 mr-2" />
                Send Announcement
              </Button>
            </div>

            <div className="bg-card p-4 rounded-xl border border-border">
              <h3 className="font-semibold mb-3">Quick Templates</h3>
              <div className="space-y-2">
                {[
                  'Event starting soon! Get ready 🎉',
                  'Reminder: Check in when you arrive',
                  'Thank you for attending! Hope to see you again',
                  'Event details have been updated',
                ].map((template, i) => (
                  <button
                    key={i}
                    onClick={() => setAnnouncementText(template)}
                    className="w-full text-left p-3 rounded-lg bg-background border border-border text-sm hover:border-primary transition-colors"
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
          <div className="space-y-4">
            <div className="bg-card p-4 rounded-xl border border-border">
              <h3 className="font-semibold mb-4">Event Defaults</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Default Check-in Radius</label>
                  <Input type="number" defaultValue={100} className="h-12" />
                  <p className="text-xs text-muted-foreground mt-1">Default radius in meters</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Default Theme Color</label>
                  <div className="flex gap-2">
                    {['#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#3B82F6'].map(color => (
                      <button
                        key={color}
                        className="w-10 h-10 rounded-full border-2 border-border"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Default Media Type</label>
                  <div className="flex gap-2">
                    <button className="flex-1 p-3 border border-border rounded-lg flex flex-col items-center gap-2">
                      <Grid3x3 className="w-5 h-5" />
                      <span className="text-sm">Carousel</span>
                    </button>
                    <button className="flex-1 p-3 border border-border rounded-lg flex flex-col items-center gap-2">
                      <Film className="w-5 h-5" />
                      <span className="text-sm">Video</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card p-4 rounded-xl border border-border">
              <h3 className="font-semibold mb-4">Notifications</h3>
              <div className="space-y-3">
                {[
                  'Email me when someone checks in',
                  'Push notifications for new attendees',
                  'Weekly analytics summary',
                ].map((setting, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <span className="text-sm">{setting}</span>
                    <div className="w-12 h-6 bg-primary/20 rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-primary rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button variant="destructive" className="w-full" onClick={() => {
              toast({ 
                title: 'Confirm deletion', 
                description: 'Use the delete button on individual events instead',
                variant: 'destructive'
              });
            }}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete All Events
            </Button>
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
