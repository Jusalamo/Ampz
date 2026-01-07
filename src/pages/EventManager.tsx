import { useState } from 'react';
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
  Send
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Tab = 'events' | 'attendees' | 'analytics' | 'messages' | 'settings';

export default function EventManager() {
  const navigate = useNavigate();
  const { user, events } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('events');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [announcementText, setAnnouncementText] = useState('');

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
                        <div className="flex gap-2 mt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs"
                            onClick={() => setSelectedEventId(event.id)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs"
                          >
                            <QrCode className="w-3 h-3 mr-1" />
                            QR
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
                      <p className="text-xs text-muted-foreground">{event.attendees} attendees</p>
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

            <Button variant="destructive" className="w-full">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete All Events
            </Button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
