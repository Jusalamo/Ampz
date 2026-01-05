import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Map, Plus, Ticket, Calendar, Users, Heart, ChevronRight, ChevronLeft, Bell, Zap, MessageSquare, Star, Settings, User } from 'lucide-react';
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
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showTickets, setShowTickets] = useState(false);
  const [showEventWizard, setShowEventWizard] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const featuredRef = useRef<HTMLDivElement>(null);
  const eventsCarouselRef = useRef<HTMLDivElement>(null);
  const [myEventsIndex, setMyEventsIndex] = useState(0);

  const myEvents = events.filter(e => user?.bookmarkedEvents.includes(e.id));
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
      const cardWidth = 320; // Approximate card width with margins
      featuredRef.current.scrollTo({
        left: featuredIndex * cardWidth,
        behavior: 'smooth',
      });
    }
  }, [featuredIndex, featuredEvents.length]);

  // Auto-rotate my events carousel
  useEffect(() => {
    if (myEvents.length <= 2) return;
    const interval = setInterval(() => {
      setMyEventsIndex((prev) => (prev + 1) % Math.ceil(myEvents.length / 2));
    }, 7000);
    return () => clearInterval(interval);
  }, [myEvents.length]);

  // Update carousel position
  useEffect(() => {
    if (eventsCarouselRef.current && myEvents.length > 0) {
      const slideWidth = eventsCarouselRef.current.offsetWidth;
      eventsCarouselRef.current.style.transform = `translateX(-${myEventsIndex * slideWidth}px)`;
    }
  }, [myEventsIndex, myEvents.length]);

  const handleCreateEvent = () => {
    if (user?.subscription.tier === 'free') {
      toast({ title: 'Pro Feature', description: 'Upgrade to Pro to create events' });
      setShowSubscription(true);
    } else {
      setShowEventWizard(true);
    }
  };

  const quickActions = [
    { 
      icon: QrCode, 
      label: 'Check In', 
      color: 'bg-primary/10', 
      iconColor: 'text-primary',
      onClick: () => setShowCheckIn(true) 
    },
    { 
      icon: Map, 
      label: 'View Map', 
      color: 'bg-blue-500/10', 
      iconColor: 'text-blue-500',
      onClick: () => navigate('/events') 
    },
    { 
      icon: Plus, 
      label: 'Create Event', 
      color: 'bg-pink-500/10', 
      iconColor: 'text-pink-500',
      onClick: handleCreateEvent, 
      pro: true 
    },
    { 
      icon: Ticket, 
      label: 'Tickets', 
      color: 'bg-green-500/10', 
      iconColor: 'text-green-500',
      onClick: () => setShowTickets(true) 
    },
    { 
      icon: MessageSquare, 
      label: 'Messages', 
      color: 'bg-purple-500/10', 
      iconColor: 'text-purple-500',
      onClick: () => navigate('/messages') 
    },
    { 
      icon: User, 
      label: 'Profile', 
      color: 'bg-orange-500/10', 
      iconColor: 'text-orange-500',
      onClick: () => navigate('/profile') 
    },
    { 
      icon: Star, 
      label: 'Featured', 
      color: 'bg-yellow-500/10', 
      iconColor: 'text-yellow-500',
      onClick: () => navigate('/events?filter=featured') 
    },
    { 
      icon: Settings, 
      label: 'Settings', 
      color: 'bg-gray-500/10', 
      iconColor: 'text-gray-500',
      onClick: () => navigate('/settings') 
    },
  ];

  const stats = [
    { icon: Calendar, value: myEvents.length, label: 'Events' },
    { icon: Users, value: user?.subscription.tier === 'free' ? 2 : 12, label: 'Matches' },
    { icon: Heart, value: user?.subscription.tier === 'free' ? user?.likesRemaining ?? 10 : '∞', label: 'Likes Left' },
  ];

  const getMyEventsSlides = () => {
    const slides = [];
    for (let i = 0; i < myEvents.length; i += 2) {
      slides.push(myEvents.slice(i, i + 2));
    }
    return slides;
  };

  const myEventsSlides = getMyEventsSlides();

  return (
    <div className="app-container min-h-screen bg-background pb-nav">
      {/* Instagram-style Header - Hide on scroll down */}
      <header 
        className={cn(
          'fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-app z-40 transition-transform duration-300',
          isHeaderHidden ? '-translate-y-full' : 'translate-y-0'
        )}
      >
        <div className="bg-background/95 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-5 h-14 pt-safe">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">Amps</span>
            </div>
            <div className="flex items-center gap-3">
              {user?.subscription.tier !== 'free' && (
                <span className="px-2.5 py-1 bg-primary text-white text-[10px] font-bold rounded-full uppercase">
                  {user?.subscription.tier}
                </span>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-10 h-10 rounded-full bg-card flex items-center justify-center border border-border hover:border-primary transition-colors"
                >
                  <Bell className="w-5 h-5 text-foreground" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
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

      <div className="px-5 pt-20 pb-24">
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map(({ icon: Icon, value, label }) => (
            <div 
              key={label} 
              className="bg-card border border-border rounded-2xl p-4 text-center hover:border-primary/50 transition-all"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Pro/Max Event Manager Button */}
        {user?.subscription.tier !== 'free' && user?.createdEvents && user.createdEvents.length > 0 && (
          <button
            onClick={() => navigate('/event-manager')}
            className="w-full bg-card border border-border rounded-2xl p-4 flex items-center justify-between mb-8 hover:border-primary transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Manage Events</p>
                <p className="text-xs text-muted-foreground">{user.createdEvents.length} events created</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        )}

        {/* Quick Actions Grid */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.slice(0, 4).map(({ icon: Icon, label, color, iconColor, onClick, pro }) => (
              <button 
                key={label} 
                onClick={onClick} 
                className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-3 hover:border-primary hover:shadow-lg transition-all relative group"
              >
                <div className={`w-14 h-14 ${color} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-7 h-7 ${iconColor}`} />
                </div>
                <span className="text-xs font-medium text-foreground text-center">{label}</span>
                {pro && user?.subscription.tier === 'free' && (
                  <span className="absolute -top-2 -right-2 px-2 py-1 bg-primary text-white text-[10px] font-bold rounded-full">PRO</span>
                )}
              </button>
            ))}
          </div>
          {/* Second row of quick actions */}
          <div className="grid grid-cols-4 gap-3 mt-3">
            {quickActions.slice(4).map(({ icon: Icon, label, color, iconColor, onClick }) => (
              <button 
                key={label} 
                onClick={onClick} 
                className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-3 hover:border-primary hover:shadow-lg transition-all group"
              >
                <div className={`w-14 h-14 ${color} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-7 h-7 ${iconColor}`} />
                </div>
                <span className="text-xs font-medium text-foreground text-center">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* My Events - Horizontal Carousel */}
        {myEvents.length > 0 && (
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
              <div className="overflow-hidden rounded-2xl">
                <div 
                  ref={eventsCarouselRef}
                  className="flex transition-transform duration-400 ease-out"
                  style={{ 
                    width: `${myEventsSlides.length * 100}%`,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${myEventsSlides.length}, 1fr)`
                  }}
                >
                  {myEventsSlides.map((slide, slideIndex) => (
                    <div key={slideIndex} className="w-full">
                      <div className="grid grid-cols-2 gap-3 px-1">
                        {slide.map((event) => (
                          <EventCard 
                            key={event.id} 
                            event={event} 
                            variant="compact" 
                            onClick={() => navigate(`/event/${event.id}`)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Arrows */}
              {myEventsSlides.length > 1 && (
                <>
                  <button
                    onClick={() => setMyEventsIndex(prev => (prev - 1 + myEventsSlides.length) % myEventsSlides.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border hover:border-primary transition-colors z-10 shadow-lg"
                  >
                    <ChevronLeft className="w-5 h-5 text-foreground" />
                  </button>
                  <button
                    onClick={() => setMyEventsIndex(prev => (prev + 1) % myEventsSlides.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border hover:border-primary transition-colors z-10 shadow-lg"
                  >
                    <ChevronRight className="w-5 h-5 text-foreground" />
                  </button>
                </>
              )}

              {/* Dots Indicator */}
              {myEventsSlides.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {myEventsSlides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setMyEventsIndex(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === myEventsIndex 
                          ? 'bg-primary w-8' 
                          : 'bg-muted w-2 hover:bg-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Featured Events Carousel */}
        <section className="mb-20">
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
              className="flex gap-4 overflow-x-auto no-scrollbar -mx-5 px-5 snap-x snap-mandatory scroll-smooth"
            >
              {featuredEvents.map((event) => (
                <div key={event.id} className="snap-center flex-shrink-0 w-[calc(100vw-2.5rem)]">
                  <EventCard 
                    event={event} 
                    variant="featured" 
                    onClick={() => navigate(`/event/${event.id}`)}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
            
            {/* Navigation Arrows */}
            {featuredEvents.length > 1 && (
              <>
                <button
                  onClick={() => setFeaturedIndex(prev => (prev - 1 + featuredEvents.length) % featuredEvents.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border hover:border-primary transition-colors z-10 shadow-lg"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
                <button
                  onClick={() => setFeaturedIndex(prev => (prev + 1) % featuredEvents.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border hover:border-primary transition-colors z-10 shadow-lg"
                >
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </button>
              </>
            )}
            
            {/* Dots Indicator */}
            {featuredEvents.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {featuredEvents.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setFeaturedIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === featuredIndex 
                        ? 'bg-primary w-8' 
                        : 'bg-muted w-2 hover:bg-muted-foreground'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <BottomNav />

      <CheckInModal isOpen={showCheckIn} onClose={() => setShowCheckIn(false)} />
      <TicketsModal isOpen={showTickets} onClose={() => setShowTickets(false)} />
      <EventWizardModal isOpen={showEventWizard} onClose={() => setShowEventWizard(false)} />
      <SubscriptionModal isOpen={showSubscription} onClose={() => setShowSubscription(false)} />
    </div>
  );
}
