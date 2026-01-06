import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, Map, Plus, Ticket, Calendar, Users, Heart, 
  ChevronRight, ChevronLeft, Bell, Zap, Bookmark, Star, 
  MapPin, Clock, Users as UsersIcon 
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { EventCard } from '@/components/EventCard';
import { CheckInModal } from '@/components/modals/CheckInModal';
import { TicketsModal } from '@/components/modals/TicketsModal';
import { EventWizardModal } from '@/components/modals/EventWizardModal';
import { SubscriptionModal } from '@/components/modals/SubscriptionModal';
import { NotificationsDropdown } from '@/components/modals/NotificationsDropdown';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Home() {
  const navigate = useNavigate();
  const { user, events, unreadNotificationsCount } = useApp();
  const { toast } = useToast();
  const { scrollDirection, scrollY } = useScrollDirection();
  
  // State management
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showTickets, setShowTickets] = useState(false);
  const [showEventWizard, setShowEventWizard] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [myEventsPage, setMyEventsPage] = useState(0);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  
  const myEventsRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);

  // Filter events
  const bookmarkedEvents = events.filter(e => user?.bookmarkedEvents.includes(e.id));
  const userCreatedEvents = events.filter(e => e.organizerId === user?.id);
  const allMyEvents = [...new Set([...bookmarkedEvents, ...userCreatedEvents])];
  const featuredEvents = events.filter(e => e.isFeatured);

  const isHeaderHidden = scrollDirection === 'down' && scrollY > 100;

  // Auto-rotate featured events
  useEffect(() => {
    if (featuredEvents.length <= 1) return;
    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredEvents.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredEvents.length]);

  // Scroll to current featured event
  useEffect(() => {
    if (featuredRef.current && featuredEvents.length > 0) {
      const cardWidth = featuredRef.current.offsetWidth;
      featuredRef.current.scrollTo({
        left: featuredIndex * cardWidth,
        behavior: 'smooth',
      });
    }
  }, [featuredIndex, featuredEvents.length]);

  const handleCreateEvent = () => {
    if (user?.subscription.tier === 'free') {
      toast({ title: 'Pro Feature', description: 'Upgrade to Pro to create events' });
      setShowSubscription(true);
    } else {
      setShowEventWizard(true);
    }
  };

  // Quick Actions in 2x2 grid
  const quickActions = [
    { 
      icon: QrCode, 
      label: 'QR Scan', 
      color: 'bg-brand-purple hover:bg-brand-purple/90', 
      onClick: () => setShowCheckIn(true) 
    },
    { 
      icon: Map, 
      label: 'View Map', 
      color: 'bg-brand-blue hover:bg-brand-blue/90', 
      onClick: () => navigate('/events') 
    },
    { 
      icon: Plus, 
      label: 'Create Event', 
      color: 'bg-brand-pink hover:bg-brand-pink/90', 
      onClick: handleCreateEvent, 
      pro: true 
    },
    { 
      icon: Ticket, 
      label: 'Ticket Box', 
      color: 'bg-brand-green hover:bg-brand-green/90', 
      onClick: () => setShowTickets(true) 
    },
  ];

  // Stats - smaller squares
  const stats = [
    { 
      icon: Calendar, 
      value: allMyEvents.length, 
      label: 'Events',
      color: 'text-brand-purple'
    },
    { 
      icon: Users, 
      value: user?.subscription.tier === 'free' ? 2 : 12, 
      label: 'Matches',
      color: 'text-brand-blue'
    },
    { 
      icon: Heart, 
      value: user?.subscription.tier === 'free' ? (user?.likesRemaining ?? 10) : '∞', 
      label: 'Likes Left',
      color: 'text-brand-pink'
    },
  ];

  // My Events Carousel Navigation
  const nextMyEvents = () => {
    if (allMyEvents.length <= 4) return;
    setMyEventsPage((prev) => (prev + 1) % Math.ceil(allMyEvents.length / 4));
  };

  const prevMyEvents = () => {
    if (allMyEvents.length <= 4) return;
    setMyEventsPage((prev) => (prev - 1 + Math.ceil(allMyEvents.length / 4)) % Math.ceil(allMyEvents.length / 4));
  };

  // Get current events for carousel
  const getCurrentMyEvents = () => {
    const itemsPerPage = 4;
    const start = myEventsPage * itemsPerPage;
    return allMyEvents.slice(start, start + itemsPerPage);
  };

  return (
    <div className="app-container min-h-screen bg-background pb-nav">
      {/* Header */}
      <header 
        className={cn(
          'fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-app z-40 transition-transform duration-300',
          isHeaderHidden ? '-translate-y-full' : 'translate-y-0'
        )}
      >
        <div className="bg-background/95 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-5 h-14 pt-safe">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-pro flex items-center justify-center">
                <Zap className="w-4 h-4 text-foreground" />
              </div>
              <span className="text-xl font-extrabold gradient-text">Amps</span>
            </div>
            <div className="flex items-center gap-3">
              {user?.subscription.tier !== 'free' && (
                <span className="px-2.5 py-1 gradient-pro text-foreground text-[10px] font-bold rounded-full uppercase">
                  {user?.subscription.tier}
                </span>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-10 h-10 rounded-full bg-card flex items-center justify-center border border-border hover:border-primary transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-brand-red rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                      {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                    </span>
                  )}
                </button>
                <NotificationsDropdown isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-5 pt-20 pb-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary">
            <img 
              src={user?.profile.profilePhoto} 
              alt={user?.profile.name} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">Welcome back</p>
            <h1 className="text-2xl font-bold text-foreground">{user?.profile.name?.split(' ')[0]}</h1>
          </div>
        </div>

        {/* Stats - Smaller Square Design */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {stats.map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="relative">
              <div className="bg-card rounded-xl p-4 text-center aspect-square flex flex-col items-center justify-center border border-border hover:border-primary/50 transition-colors">
                <Icon className={`w-6 h-6 mb-2 ${color}`} />
                <p className="text-xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions - 2x2 Grid with Larger Icons */}
        <div className="mb-10">
          <h2 className="text-lg font-bold mb-4 text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ icon: Icon, label, color, onClick, pro }) => (
              <button 
                key={label} 
                onClick={onClick}
                className="relative group"
              >
                <div className="bg-card rounded-xl p-4 flex flex-col items-center justify-center gap-3 border border-border hover:border-primary transition-all duration-200 group-hover:shadow-lg min-h-[120px]">
                  <div className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-sm font-medium text-foreground text-center leading-tight">{label}</span>
                </div>
                {pro && user?.subscription.tier === 'free' && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 gradient-pro text-[10px] font-bold rounded-full text-white z-10">
                    PRO
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* My Events - Horizontal Carousel */}
        {allMyEvents.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">My Events</h2>
              <button 
                onClick={() => navigate('/my-events')}
                className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
              >
                See All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="relative">
              {/* Carousel Container */}
              <div className="overflow-hidden rounded-xl">
                <div 
                  ref={myEventsRef}
                  className="flex gap-4 transition-transform duration-300"
                  style={{ transform: `translateX(-${myEventsPage * 100}%)` }}
                >
                  {getCurrentMyEvents().map((event) => (
                    <div key={event.id} className="min-w-full">
                      <div 
                        onClick={() => navigate(`/event/${event.id}`)}
                        className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary transition-all duration-200 hover:shadow-lg cursor-pointer"
                      >
                        {/* Event Image with Bookmark Badge */}
                        <div className="relative h-40">
                          <img 
                            src={event.coverImage} 
                            alt={event.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          
                          {/* Bookmark Badge */}
                          {bookmarkedEvents.includes(event) && (
                            <div className="absolute top-3 right-3 bg-yellow-500/90 text-yellow-900 px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold backdrop-blur-sm">
                              <Bookmark className="w-3 h-3 fill-current" />
                              Bookmarked
                            </div>
                          )}
                          
                          {/* Created Badge */}
                          {userCreatedEvents.includes(event) && (
                            <div className="absolute top-3 left-3 bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                              Created
                            </div>
                          )}
                        </div>
                        
                        {/* Event Info */}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-foreground line-clamp-1">{event.name}</h3>
                            <span className="text-sm font-bold text-primary">
                              {event.price === 0 ? 'FREE' : `N$${event.price}`}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{event.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{event.time}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <UsersIcon className="w-4 h-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {event.attendees} attending
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i}
                                  className={`w-3 h-3 ${i < Math.floor(event.rating || 4) ? 'fill-yellow-500 text-yellow-500' : 'fill-gray-300 text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Carousel Navigation */}
              {allMyEvents.length > 4 && (
                <>
                  <button
                    onClick={prevMyEvents}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center border border-border hover:border-primary transition-colors z-10 shadow-lg"
                  >
                    <ChevronLeft className="w-5 h-5 text-foreground" />
                  </button>
                  <button
                    onClick={nextMyEvents}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center border border-border hover:border-primary transition-colors z-10 shadow-lg"
                  >
                    <ChevronRight className="w-5 h-5 text-foreground" />
                  </button>
                  
                  {/* Dots Indicator */}
                  <div className="flex justify-center gap-2 mt-4">
                    {Array.from({ length: Math.ceil(allMyEvents.length / 4) }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setMyEventsPage(index)}
                        className={`h-2 rounded-full transition-all ${
                          index === myEventsPage 
                            ? 'bg-primary w-6' 
                            : 'bg-muted w-2 hover:bg-primary/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* Featured Events - Reduced spacing */}
        {featuredEvents.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Featured Events</h2>
              <button 
                onClick={() => navigate('/events')}
                className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="relative">
              <div 
                ref={featuredRef}
                className="flex gap-4 overflow-x-auto no-scrollbar -mx-5 px-5 snap-x snap-mandatory scroll-smooth pb-2"
              >
                {featuredEvents.map((event) => (
                  <div key={event.id} className="snap-center flex-shrink-0 w-[calc(100vw-60px)] max-w-sm">
                    <div 
                      onClick={() => navigate(`/event/${event.id}`)}
                      className="bg-card rounded-2xl overflow-hidden border border-border hover:border-primary transition-all duration-200 hover:shadow-xl cursor-pointer"
                    >
                      {/* Featured Badge */}
                      <div className="absolute top-4 left-4 z-10">
                        <span className="px-3 py-1 gradient-pro text-white text-xs font-bold rounded-full uppercase">
                          Featured
                        </span>
                      </div>
                      
                      <div className="relative h-48">
                        <img 
                          src={event.coverImage} 
                          alt={event.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      </div>
                      
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-foreground mb-1 line-clamp-1">{event.name}</h3>
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground truncate">{event.location}</span>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-primary whitespace-nowrap ml-3">
                            {event.price === 0 ? 'FREE' : `N$${event.price}`}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{event.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{event.time}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <UsersIcon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{event.attendees}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Featured Events Navigation */}
              {featuredEvents.length > 1 && (
                <>
                  <button
                    onClick={() => setFeaturedIndex((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center border border-border hover:border-primary transition-colors z-10 shadow-lg"
                  >
                    <ChevronLeft className="w-5 h-5 text-foreground" />
                  </button>
                  <button
                    onClick={() => setFeaturedIndex((prev) => (prev + 1) % featuredEvents.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center border border-border hover:border-primary transition-colors z-10 shadow-lg"
                  >
                    <ChevronRight className="w-5 h-5 text-foreground" />
                  </button>
                  
                  {/* Dots */}
                  <div className="flex justify-center gap-2 mt-4">
                    {featuredEvents.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setFeaturedIndex(index)}
                        className={`h-2 rounded-full transition-all ${
                          index === featuredIndex 
                            ? 'bg-primary w-6' 
                            : 'bg-muted w-2 hover:bg-primary/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        )}
        
        {/* Empty State for My Events */}
        {allMyEvents.length === 0 && (
          <div className="bg-card rounded-xl p-8 text-center border border-dashed border-border mb-10">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-bold text-foreground mb-2">No events yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Bookmark events you're interested in or create your own!
            </p>
            <button
              onClick={() => navigate('/events')}
              className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Browse Events
            </button>
          </div>
        )}
      </div>

      {/* Bottom Nav - Ensured proper spacing */}
      <div className="mt-6">
        <BottomNav />
      </div>

      {/* Modals */}
      <CheckInModal isOpen={showCheckIn} onClose={() => setShowCheckIn(false)} />
      <TicketsModal isOpen={showTickets} onClose={() => setShowTickets(false)} />
      <EventWizardModal isOpen={showEventWizard} onClose={() => setShowEventWizard(false)} />
      <SubscriptionModal isOpen={showSubscription} onClose={() => setShowSubscription(false)} />
    </div>
  );
}
