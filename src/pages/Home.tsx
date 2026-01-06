import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, Map, Plus, Ticket, Calendar, Users, Heart, 
  ChevronRight, ChevronLeft, Bell, Zap, Bookmark, MapPin, 
  Clock, User, ArrowRight, MoreHorizontal
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
  const { user, events, unreadNotificationsCount, toggleBookmark } = useApp();
  const { toast } = useToast();
  const { scrollDirection, scrollY } = useScrollDirection();
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [myEventsIndex, setMyEventsIndex] = useState(0);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showTickets, setShowTickets] = useState(false);
  const [showEventWizard, setShowEventWizard] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const featuredRef = useRef<HTMLDivElement>(null);
  const myEventsRef = useRef<HTMLDivElement>(null);
  const myEventsCarouselRef = useRef<HTMLDivElement>(null);

  const myEvents = events.filter(e => user?.bookmarkedEvents.includes(e.id));
  const featuredEvents = events.filter(e => e.isFeatured);
  const createdEvents = events.filter(e => e.organizerId === user?.id);
  
  // Group myEvents into slides for carousel (2 events per slide on mobile)
  const myEventsSlides = [];
  if (myEvents.length > 0) {
    const itemsPerSlide = window.innerWidth < 640 ? 2 : 3;
    for (let i = 0; i < myEvents.length; i += itemsPerSlide) {
      myEventsSlides.push(myEvents.slice(i, i + itemsPerSlide));
    }
  }

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
      const cardWidth = window.innerWidth < 640 ? 300 : 320;
      featuredRef.current.scrollTo({
        left: featuredIndex * cardWidth,
        behavior: 'smooth',
      });
    }
  }, [featuredIndex, featuredEvents.length]);

  // Handle my events carousel navigation
  const handleMyEventsNext = () => {
    if (myEventsSlides.length === 0) return;
    setMyEventsIndex((prev) => (prev + 1) % myEventsSlides.length);
  };

  const handleMyEventsPrev = () => {
    if (myEventsSlides.length === 0) return;
    setMyEventsIndex((prev) => (prev - 1 + myEventsSlides.length) % myEventsSlides.length);
  };

  // Update my events carousel position
  useEffect(() => {
    if (myEventsCarouselRef.current && myEventsSlides.length > 0) {
      const slideWidth = 100; // percentage
      myEventsCarouselRef.current.style.transform = `translateX(-${myEventsIndex * slideWidth}%)`;
    }
  }, [myEventsIndex, myEventsSlides.length]);

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      // Force re-render on resize to adjust layout
      setMyEventsIndex(0);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCreateEvent = () => {
    if (user?.subscription.tier === 'free') {
      toast({ title: 'Pro Feature', description: 'Upgrade to Pro to create events' });
      setShowSubscription(true);
    } else {
      setShowEventWizard(true);
    }
  };

  const handleBookmark = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(eventId);
    const event = events.find(e => e.id === eventId);
    if (event && user?.bookmarkedEvents.includes(eventId)) {
      toast({ title: 'Removed from bookmarks', description: `${event.name} removed` });
    } else if (event) {
      toast({ title: 'Added to bookmarks', description: `${event.name} saved` });
    }
  };

  const quickActions = [
    { 
      icon: QrCode, 
      label: 'Check In', 
      bgColor: 'bg-brand-purple', 
      iconColor: 'text-white',
      onClick: () => setShowCheckIn(true) 
    },
    { 
      icon: Map, 
      label: 'View Map', 
      bgColor: 'bg-brand-blue', 
      iconColor: 'text-white',
      onClick: () => navigate('/events') 
    },
    { 
      icon: Plus, 
      label: 'Create Event', 
      bgColor: 'bg-brand-pink', 
      iconColor: 'text-white',
      onClick: handleCreateEvent, 
      pro: true 
    },
    { 
      icon: Ticket, 
      label: 'Tickets', 
      bgColor: 'bg-brand-green', 
      iconColor: 'text-white',
      onClick: () => setShowTickets(true) 
    },
  ];

  const stats = [
    { 
      icon: Calendar, 
      value: myEvents.length, 
      label: 'My Events',
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
      value: user?.subscription.tier === 'free' ? user?.likesRemaining ?? 10 : '∞', 
      label: 'Likes Left',
      color: 'text-brand-pink'
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header 
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-transform duration-300 bg-background/95 backdrop-blur-xl border-b border-border',
          isHeaderHidden ? '-translate-y-full' : 'translate-y-0'
        )}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-pro flex items-center justify-center">
                <Zap className="w-4 h-4 text-foreground" />
              </div>
              <span className="text-xl font-bold">Amps</span>
            </div>
            <div className="flex items-center gap-3">
              {user?.subscription.tier !== 'free' && (
                <span className="px-2.5 py-1 gradient-pro text-foreground text-xs font-bold rounded-full uppercase">
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
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center text-white">
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
      <main className="pt-16 pb-6 px-4 max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30">
              <img 
                src={user?.profile.profilePhoto} 
                alt={user?.profile.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <h1 className="text-xl font-bold">{user?.profile.name?.split(' ')[0]}</h1>
            </div>
          </div>
        </div>

        {/* Stats Grid - Smaller and square */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {stats.map(({ icon: Icon, value, label, color }) => (
            <div 
              key={label} 
              className="bg-card rounded-xl p-3 text-center border border-border min-h-[80px] flex flex-col items-center justify-center"
            >
              <Icon className={`w-4 h-4 mb-1 ${color}`} />
              <p className="text-lg font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions Grid - 2x2 */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {quickActions.map(({ icon: Icon, label, bgColor, iconColor, onClick, pro }) => (
            <button 
              key={label} 
              onClick={onClick} 
              className={cn(
                "bg-card rounded-xl p-4 flex flex-col items-center justify-center gap-2 border border-border transition-all hover:border-primary hover:shadow-md",
                "min-h-[100px]"
              )}
            >
              <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <div className="text-center">
                <span className="text-sm font-medium">{label}</span>
                {pro && user?.subscription.tier === 'free' && (
                  <span className="block text-xs text-brand-pink font-medium mt-1">PRO</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Created Events Manager (if any) */}
        {createdEvents.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">My Created Events</h2>
              <button
                onClick={() => navigate('/event-manager')}
                className="text-primary text-sm font-medium flex items-center gap-1"
              >
                Manage All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{createdEvents.length} Events Created</p>
                    <p className="text-sm text-muted-foreground">Manage your events</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </div>
        )}

        {/* My Events Carousel */}
        {myEvents.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">My Events</h2>
              <button 
                onClick={() => navigate('/events?tab=bookmarked')}
                className="text-primary text-sm font-medium flex items-center gap-1"
              >
                See All
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="relative overflow-hidden rounded-xl">
              {/* Carousel Container */}
              <div 
                ref={myEventsCarouselRef}
                className="flex transition-transform duration-300 ease-out"
                style={{ width: `${myEventsSlides.length * 100}%` }}
              >
                {myEventsSlides.map((slide, slideIndex) => (
                  <div 
                    key={slideIndex}
                    className="w-full flex-shrink-0 px-1"
                    style={{ width: `${100 / myEventsSlides.length}%` }}
                  >
                    <div className="grid grid-cols-2 gap-3">
                      {slide.map((event) => (
                        <div 
                          key={event.id}
                          onClick={() => navigate(`/event/${event.id}`)}
                          className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary transition-colors cursor-pointer group"
                        >
                          {/* Event Image */}
                          <div className="relative h-32 overflow-hidden">
                            <img 
                              src={event.coverImage} 
                              alt={event.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Bookmark Badge */}
                            <button
                              onClick={(e) => handleBookmark(event.id, e)}
                              className={cn(
                                "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                user?.bookmarkedEvents.includes(event.id)
                                  ? "bg-yellow-500/20 text-yellow-500"
                                  : "bg-black/40 text-white/80 hover:bg-black/60"
                              )}
                            >
                              <Bookmark className={cn(
                                "w-4 h-4",
                                user?.bookmarkedEvents.includes(event.id) ? "fill-yellow-500" : ""
                              )} />
                            </button>
                            {/* Category Badge */}
                            <div className="absolute top-2 left-2">
                              <span className="px-2 py-1 bg-black/60 text-white text-xs rounded-md backdrop-blur-sm">
                                {event.category}
                              </span>
                            </div>
                          </div>

                          {/* Event Details */}
                          <div className="p-3">
                            <h3 className="font-medium text-sm line-clamp-1 mb-1">{event.name}</h3>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground truncate">
                                  {event.location}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {event.time}
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {event.attendees} attending
                                  </span>
                                </div>
                                <span className={cn(
                                  "text-xs font-medium px-2 py-0.5 rounded",
                                  event.price === 0 
                                    ? "bg-green-500/10 text-green-500" 
                                    : "bg-primary/10 text-primary"
                                )}>
                                  {event.price === 0 ? 'FREE' : `N$${event.price}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Arrows */}
              {myEventsSlides.length > 1 && (
                <>
                  <button
                    onClick={handleMyEventsPrev}
                    className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border hover:border-primary transition-colors z-10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleMyEventsNext}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border hover:border-primary transition-colors z-10"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Dots Indicator */}
            {myEventsSlides.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {myEventsSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setMyEventsIndex(index)}
                    className={`h-1.5 rounded-full transition-all ${index === myEventsIndex ? 'bg-primary w-6' : 'bg-muted w-1.5'}`}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Featured Events Carousel */}
        <section className="mb-4"> {/* Reduced margin from bottom */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Featured Events</h2>
            <button 
              onClick={() => navigate('/events')}
              className="text-primary text-sm font-medium flex items-center gap-1"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            {/* Carousel Container */}
            <div 
              ref={featuredRef}
              className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth -mx-1 px-1"
            >
              {featuredEvents.map((event) => (
                <div 
                  key={event.id}
                  className="snap-center flex-shrink-0 w-full max-w-sm px-1"
                >
                  <div 
                    onClick={() => navigate(`/event/${event.id}`)}
                    className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary transition-colors cursor-pointer group"
                  >
                    {/* Event Image */}
                    <div className="relative h-40 overflow-hidden">
                      <img 
                        src={event.coverImage} 
                        alt={event.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Featured Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 bg-primary text-white text-xs font-bold rounded-full">
                          FEATURED
                        </span>
                      </div>
                      
                      {/* Event Info Overlay */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-white font-bold text-lg mb-1">{event.name}</h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-white/80" />
                            <span className="text-white/90 text-sm">{event.location}</span>
                          </div>
                          <span className="text-white font-bold bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm">
                            {event.price === 0 ? 'FREE' : `N$${event.price}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Date & Time</p>
                          <p className="text-sm font-medium">{event.date} • {event.time}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Attendees</p>
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium">{event.attendees} going</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <button className="text-primary text-sm font-medium flex items-center gap-1">
                          View Details
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button className="text-muted-foreground hover:text-primary transition-colors">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            {featuredEvents.length > 1 && (
              <>
                <button
                  onClick={() => setFeaturedIndex((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length)}
                  className="absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border hover:border-primary transition-colors z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setFeaturedIndex((prev) => (prev + 1) % featuredEvents.length)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border hover:border-primary transition-colors z-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {featuredEvents.map((_, index) => (
              <button
                key={index}
                onClick={() => setFeaturedIndex(index)}
                className={`h-2 rounded-full transition-all ${index === featuredIndex ? 'bg-primary w-6' : 'bg-muted w-2'}`}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Modals */}
      <CheckInModal isOpen={showCheckIn} onClose={() => setShowCheckIn(false)} />
      <TicketsModal isOpen={showTickets} onClose={() => setShowTickets(false)} />
      <EventWizardModal isOpen={showEventWizard} onClose={() => setShowEventWizard(false)} />
      <SubscriptionModal isOpen={showSubscription} onClose={() => setShowSubscription(false)} />
    </div>
  );
}
