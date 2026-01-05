import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  MapPin, 
  QrCode, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  MoreVertical,
  BarChart,
  Share2,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Event } from '@/lib/types';

export default function EventManager() {
  const navigate = useNavigate();
  const { user, events } = useApp();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'past'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventMenu, setShowEventMenu] = useState<string | null>(null);

  // Filter events created by current user
  const createdEvents = events.filter(e => e.organizerId === user?.id);

  // Apply filters
  const filteredEvents = createdEvents.filter(event => {
    // Date filtering
    const eventDate = new Date(`${event.date}T${event.time}`);
    const now = new Date();
    
    if (filter === 'active') {
      return eventDate >= now;
    } else if (filter === 'upcoming') {
      return eventDate > new Date(now.getTime() + 24 * 60 * 60 * 1000); // Next 24+ hours
    } else if (filter === 'past') {
      return eventDate < now;
    }
    
    // Search filtering
    if (searchQuery) {
      return event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             event.location.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    return true;
  });

  // Stats calculation
  const stats = {
    total: createdEvents.length,
    active: createdEvents.filter(e => new Date(`${e.date}T${e.time}`) >= new Date()).length,
    attendees: createdEvents.reduce((sum, e) => sum + e.attendees, 0),
    capacity: createdEvents.reduce((sum, e) => sum + e.maxAttendees, 0),
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        // API call to delete event would go here
        toast({ 
          title: 'Event deleted', 
          description: 'Event has been successfully deleted.' 
        });
        setShowEventMenu(null);
      } catch (error) {
        toast({ 
          title: 'Error', 
          description: 'Failed to delete event. Please try again.' 
        });
      }
    }
  };

  const handleEditEvent = (event: Event) => {
    navigate(`/event/${event.id}/edit`);
  };

  const handleShareEvent = (event: Event) => {
    navigator.clipboard.writeText(`${window.location.origin}/event/${event.id}`);
    toast({ 
      title: 'Link copied!', 
      description: 'Event link copied to clipboard.' 
    });
    setShowEventMenu(null);
  };

  const handleExportAttendees = (event: Event) => {
    // In a real app, this would generate a CSV
    toast({ 
      title: 'Export started', 
      description: 'Attendee list export will begin shortly.' 
    });
    setShowEventMenu(null);
  };

  const getEventStatus = (event: Event) => {
    const eventDate = new Date(`${event.date}T${event.time}`);
    const now = new Date();
    
    if (eventDate < now) {
      return { label: 'Past', color: 'bg-gray-500', icon: XCircle };
    } else if (eventDate < new Date(now.getTime() + 24 * 60 * 60 * 1000)) {
      return { label: 'Active', color: 'bg-green-500', icon: CheckCircle };
    } else {
      return { label: 'Upcoming', color: 'bg-blue-500', icon: Clock };
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-card transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Event Manager</h1>
              <p className="text-xs text-muted-foreground">Manage your created events</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-5 pt-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Events</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-green-500" />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">{stats.attendees}/{stats.capacity}</p>
            <p className="text-xs text-muted-foreground">Total Attendees</p>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="flex items-center justify-between mb-6 p-3 bg-card rounded-xl border border-border">
          <div className="text-center">
            <p className="text-lg font-bold text-primary">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="text-center">
            <p className="text-lg font-bold">{Math.round((stats.attendees / stats.capacity) * 100)}%</p>
            <p className="text-xs text-muted-foreground">Avg. Capacity</p>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="text-center">
            <p className="text-lg font-bold">{createdEvents.filter(e => e.isFeatured).length}</p>
            <p className="text-xs text-muted-foreground">Featured</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-card rounded-xl border border-border focus:border-primary focus:outline-none text-sm"
            />
          </div>
          <button 
            onClick={() => setFilter(filter === 'all' ? 'active' : filter === 'active' ? 'upcoming' : filter === 'upcoming' ? 'past' : 'all')}
            className="w-11 h-11 flex items-center justify-center bg-card rounded-xl border border-border hover:border-primary transition-colors"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'active', 'upcoming', 'past'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all',
                filter === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border hover:border-primary'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-card flex items-center justify-center">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No events found</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {searchQuery ? 'Try a different search term' : 'Create your first event to get started'}
              </p>
              <button 
                onClick={() => navigate('/home')}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Create Event
              </button>
            </div>
          ) : (
            filteredEvents.map((event) => {
              const status = getEventStatus(event);
              const StatusIcon = status.icon;
              
              return (
                <div 
                  key={event.id} 
                  className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 transition-all group"
                >
                  {/* Event Header */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 ${status.color} text-white text-xs font-bold rounded-full flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                          {event.isFeatured && (
                            <span className="px-2 py-1 bg-gradient-to-r from-primary to-primary/70 text-white text-xs font-bold rounded-full">
                              FEATURED
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-lg mb-1">{event.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {event.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location.split(',')[0]}
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <button 
                          onClick={() => setShowEventMenu(showEventMenu === event.id ? null : event.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-border transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {/* Event Menu Dropdown */}
                        {showEventMenu === event.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setShowEventMenu(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                              <button
                                onClick={() => handleEditEvent(event)}
                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-border transition-colors text-left"
                              >
                                <Edit className="w-4 h-4" />
                                Edit Event
                              </button>
                              <button
                                onClick={() => navigate(`/event/${event.id}/analytics`)}
                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-border transition-colors text-left"
                              >
                                <BarChart className="w-4 h-4" />
                                View Analytics
                              </button>
                              <button
                                onClick={() => handleShareEvent(event)}
                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-border transition-colors text-left"
                              >
                                <Share2 className="w-4 h-4" />
                                Share Event
                              </button>
                              <button
                                onClick={() => handleExportAttendees(event)}
                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-border transition-colors text-left"
                              >
                                <Download className="w-4 h-4" />
                                Export Attendees
                              </button>
                              <div className="border-t border-border" />
                              <button
                                onClick={() => handleDeleteEvent(event.id)}
                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-500/10 text-red-500 transition-colors text-left"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Event
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Attendance</span>
                        <span className="font-medium">{event.attendees}/{event.maxAttendees}</span>
                      </div>
                      <div className="h-2 bg-border rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                          style={{ width: `${(event.attendees / event.maxAttendees) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 divide-x divide-border">
                    <button 
                      onClick={() => navigate(`/event/${event.id}/checkins`)}
                      className="py-3 flex flex-col items-center gap-1 hover:bg-border/50 transition-colors"
                    >
                      <QrCode className="w-5 h-5 text-primary" />
                      <span className="text-xs font-medium">Check-ins</span>
                      <span className="text-xs text-muted-foreground">{event.attendees}</span>
                    </button>
                    <button 
                      onClick={() => navigate(`/event/${event.id}/analytics`)}
                      className="py-3 flex flex-col items-center gap-1 hover:bg-border/50 transition-colors"
                    >
                      <BarChart className="w-5 h-5 text-blue-500" />
                      <span className="text-xs font-medium">Analytics</span>
                      <span className="text-xs text-muted-foreground">View</span>
                    </button>
                    <button 
                      onClick={() => navigate(`/event/${event.id}`)}
                      className="py-3 flex flex-col items-center gap-1 hover:bg-border/50 transition-colors"
                    >
                      <Eye className="w-5 h-5 text-green-500" />
                      <span className="text-xs font-medium">Preview</span>
                      <span className="text-xs text-muted-foreground">Public View</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      <BottomNav />

      {/* Create Event FAB */}
      <button
        onClick={() => navigate('/create-event')}
        className="fixed bottom-24 right-5 w-14 h-14 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all z-30"
      >
        <Calendar className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}
