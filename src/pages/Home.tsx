import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Map, Plus, Ticket, Calendar, Users, Heart, ChevronRight, ChevronLeft, Bell, Zap, Bookmark, Star, MoreVertical } from 'lucide-react';
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
  const [myEventsIndex, setMyEventsIndex] = useState(0);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showTickets, setShowTickets] = useState(false);
  const [showEventWizard, setShowEventWizard] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const featuredRef = useRef<HTMLDivElement>(null);
  const myEventsRef = useRef<HTMLDivElement>(null);

  // Get bookmarked events (My Events)
  const myEvents = events.filter(e => user?.bookmarkedEvents?.includes(e.id));
  const featuredEvents = events.filter(e => e.isFeatured);
  
  // Get events created by user
  const userCreatedEvents = events.filter(e => e.organizerId === user?.id);

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

  // Scroll to current my events slide
  useEffect(() => {
    if (myEventsRef.current && myEvents.length > 0) {
      const cardWidth = myEventsRef.current.offsetWidth;
      myEventsRef.current.scrollTo({
        left: myEventsIndex * cardWidth,
        behavior: 'smooth',
      });
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
      color: 'bg-brand-purple', 
      onClick: () => setShowCheckIn(true) 
    },
    { 
      icon: Map, 
      label: 'View Map', 
      color: 'bg-brand-blue', 
      onClick: () => navigate('/events') 
    },
    { 
      icon: Plus, 
      label: 'Create Event', 
      color: 'bg-brand-pink', 
      onClick: handleCreateEvent, 
      pro: true 
    },
    { 
      icon: Ticket, 
      label: 'Tickets', 
      color: 'bg-brand-green', 
      onClick: () => setShowTickets(true) 
    },
  ];

  const stats = [
    { 
      icon: Calendar, 
      value: myEvents.length, 
      label: 'Events',
      color: 'text-blue-500'
    },
    { 
      icon: Users, 
      value: user?.subscription.tier === 'free' ? 2 : 12, 
      label: 'Matches',
      color: 'text-purple-500'
    },
    { 
      icon: Heart, 
      value: user?.subscription.tier === 'free' ? user?.likesRemaining ?? 10 : '∞', 
      label: 'Likes Left',
      color: 'text-pink-500'
    },
  ];

  // Calculate items per slide for My Events carousel
  const getItemsPerSlide = () => {
    if (typeof window === 'undefined') return 2;
    const width = window.innerWidth;
    if (width < 640) return 2; // Mobile
    if (width < 768) return 3; // Tablet
    if (width < 1024) return 4; // Small desktop
    return 4; // Large desktop
  };

  const itemsPerSlide = getItemsPerSlide();
  const myEventsSlides = Math.ceil(myEvents.length / itemsPerSlide);

  return (
    <div className="app-container min-h-screen bg-background pb-24">
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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Ampz
              </span>
            </div>
            <div className="flex items-center gap-3">
              {user?.subscription.tier !== 'free' && (
                <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                  {user?.subscription.tier}
                </span>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-10 h-10 rounded-full bg-card flex items-center justify-center border border-border hover:border-purple-500 transition-colors"
                >
                  <Bell className="w-5 h-5" />
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

      <div className="px-4 sm:px-6 pt-20 pb-6 max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-500">
            <img 
              src={user?.profile.profilePhoto} 
              alt={user?.profile.name} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h1 className="text-2xl font-bold text-foreground">
              {user?.profile.name?.split(' ')[0]}
            </h1>
          </div>
        </div>

        {/* Analytics Stats - Smaller, more square */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {stats.map(({ icon: Icon, value, label, color }) => (
            <div 
              key={label} 
              className="bg-card rounded-xl p-3 text-center border border-border hover:border-purple-500/50 transition-colors"
            >
              <div className={`w-8 h-8 ${color} mx-auto mb-2 flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Pro/Max Event Manager Button */}
        {user?.subscription.tier !== 'free' && userCreatedEvents.length > 0 && (
          <button
            onClick={() => navigate('/event-manager')}
            className="w-full bg-card rounded-xl p-4 flex items-center justify-between mb-8 border border-border hover:border-purple-500 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Manage Events</p>
                <p className="text-xs text-muted-foreground">{userCreatedEvents.length} events created</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-purple-500 transition-colors" />
          </button>
        )}

        {/* Quick Actions - 2x2 Grid */}
        <div className="mb-10">
          <h2 className="text-lg font-bold mb-4 text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ icon: Icon, label, color, onClick, pro }) => (
              <button 
                key={label} 
                onClick={onClick} 
                className="bg-card rounded-xl p-4 flex flex-col items-center justify-center gap-3 border border-border hover:border-purple-500 transition-all relative group"
              >
                <div className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <span className="text-sm font-medium text-center text-foreground">{label}</span>
                {pro && user?.subscription.tier === 'free' && (
                  <span className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold rounded-full uppercase">
                    PRO
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* My Events - Horizontal Carousel */}
        {myEvents.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-purple-500" />
                My Events
              </h2>
              <button 
                onClick={() => navigate('/my-events')}
                className="text-purple-500 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
              >
                See All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="relative">
              <div 
                ref={myEventsRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth px-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {Array.from({ length: myEventsSlides }).map((_, slideIndex) => (
                  <div 
                    key={slideIndex}
                    className="snap-center flex-shrink-0 w-full"
                    style={{ width: '100%' }}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {myEvents
                        .slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide)
                        .map((event) => (
                          <div key={event.id} className="relative">
                            <EventCard 
                              event={event} 
                              variant="compact" 
                              onClick={() => navigate(`/event/${event.id}`)}
                              showBookmark={false}
                            />
                            <div className="absolute top-2 right-2">
                              <Bookmark className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Navigation Arrows for My Events */}
              {myEvents.length > itemsPerSlide && (
                <>
                  <button
                    onClick={() => setMyEventsIndex((prev) => 
                      (prev - 1 + myEventsSlides) % myEventsSlides
                    )}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center border border-border hover:border-purple-500 transition-colors z-10 shadow-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setMyEventsIndex((prev) => 
                      (prev + 1) % myEventsSlides
                    )}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center border border-border hover:border-purple-500 transition-colors z-10 shadow-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              
              {/* Dots for My Events */}
              {myEventsSlides > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: myEventsSlides }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setMyEventsIndex(index)}
                      className={`h-2 rounded-full transition-all ${index === myEventsIndex 
                        ? 'bg-purple-500 w-8' 
                        : 'bg-muted w-2 hover:bg-purple-500/50'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Featured Events - Reduced spacing */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Featured Events
            </h2>
            <button 
              onClick={() => navigate('/events')} 
              className="text-purple-500 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="relative">
            <div 
              ref={featuredRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {featuredEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="snap-center flex-shrink-0 w-full px-1"
                  style={{ width: '100%' }}
                >
                  <EventCard 
                    event={event} 
                    variant="featured" 
                    onClick={() => navigate(`/event/${event.id}`)}
                  />
                </div>
              ))}
            </div>
            
            {/* Navigation Arrows for Featured Events */}
            {featuredEvents.length > 1 && (
              <>
                <button
                  onClick={() => setFeaturedIndex((prev) => 
                    (prev - 1 + featuredEvents.length) % featuredEvents.length
                  )}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center border border-border hover:border-purple-500 transition-colors z-10 shadow-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setFeaturedIndex((prev) => 
                    (prev + 1) % featuredEvents.length
                  )}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center border border-border hover:border-purple-500 transition-colors z-10 shadow-lg"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            
            {/* Dots for Featured Events */}
            {featuredEvents.length > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {featuredEvents.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setFeaturedIndex(index)}
                    className={`h-2 rounded-full transition-all ${index === featuredIndex 
                      ? 'bg-purple-500 w-8' 
                      : 'bg-muted w-2 hover:bg-purple-500/50'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Additional spacing before bottom nav */}
        <div className="h-8" />
      </div>

      <BottomNav />

      {/* Modals */}
      <CheckInModal isOpen={showCheckIn} onClose={() => setShowCheckIn(false)} />
      <TicketsModal isOpen={showTickets} onClose={() => setShowTickets(false)} />
      <EventWizardModal isOpen={showEventWizard} onClose={() => setShowEventWizard(false)} />
      <SubscriptionModal isOpen={showSubscription} onClose={() => setShowSubscription(false)} />
    </div>
  );
}
