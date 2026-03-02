import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Map, Plus, Ticket, Calendar, Users, Heart, ChevronRight, Bell, Zap, Bookmark, Star, Settings, User } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { QRScannerModal } from '@/components/modals/QRScannerModal';
import { TicketsModal } from '@/components/modals/TicketsModal';
import { EventWizardModal } from '@/components/modals/EventWizardModal';
import { SubscriptionModal } from '@/components/modals/SubscriptionModal';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const GREETINGS = [
  (name: string) => `Welcome back, ${name}!`,
  (name: string) => `Getting ready to party, ${name}?`,
  (name: string) => `What's the agenda today, ${name}?`,
  (name: string) => `Good to see you, ${name}!`,
  (name: string) => `Let's find something fun, ${name}!`,
];

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
  const featuredRef = useRef<HTMLDivElement>(null);
  const myEventsCarouselRef = useRef<HTMLDivElement>(null);

  // Dynamic greeting - random on mount
  const greeting = useMemo(() => {
    const firstName = user?.profile?.name?.split(' ')[0] || 'Guest';
    const randomIndex = Math.floor(Math.random() * GREETINGS.length);
    return GREETINGS[randomIndex](firstName);
  }, [user?.profile?.name]);

  // Get all user events (created + bookmarked)
  const createdEvents = events?.filter(e => e.organizerId === user?.id) || [];
  const bookmarkedEvents = events?.filter(e => user?.bookmarkedEvents?.includes(e.id)) || [];
  const myEvents = [...createdEvents, ...bookmarkedEvents];
  const featuredEvents = events?.filter(e => e.isFeatured) || [];

  const isHeaderHidden = scrollDirection === 'down' && scrollY > 100;
  const isProUser = user?.subscription?.tier === 'pro' || user?.subscription?.tier === 'max';

  // Auto-rotate featured events
  useEffect(() => {
    if (!featuredEvents || featuredEvents.length <= 1) return;
    const interval = setInterval(() => setFeaturedIndex((prev) => (prev + 1) % featuredEvents.length), 5000);
    return () => clearInterval(interval);
  }, [featuredEvents]);

  useEffect(() => {
    if (featuredRef.current && featuredEvents?.length > 0) {
      const container = featuredRef.current;
      container.scrollTo({ left: featuredIndex * (container.offsetWidth - 40), behavior: 'smooth' });
    }
  }, [featuredIndex, featuredEvents?.length]);

  useEffect(() => {
    if (myEventsCarouselRef.current && myEvents?.length > 0) {
      myEventsCarouselRef.current.scrollTo({ left: myEventsIndex * myEventsCarouselRef.current.offsetWidth, behavior: 'smooth' });
    }
  }, [myEventsIndex, myEvents?.length]);

  const handleCreateEvent = () => {
    if (!isProUser) {
      toast({ title: 'Pro Feature', description: 'Upgrade to Pro to create events' });
      setShowSubscription(true);
    } else {
      setShowEventWizard(true);
    }
  };

  // Quick actions - 3 buttons: Create Event, Scan QR, View Profile
  const quickActions = [
    { icon: Plus, label: 'Create Event', colorClass: 'bg-brand-pink', onClick: handleCreateEvent, pro: !isProUser },
    { icon: QrCode, label: 'Scan QR', colorClass: 'bg-brand-purple', onClick: () => setShowCheckIn(true), pro: false },
    { icon: User, label: 'View Profile', colorClass: 'bg-brand-blue', onClick: () => navigate('/profile'), pro: false },
  ];

  const itemsPerSlide = 2;
  const totalMyEventsSlides = Math.ceil(myEvents.length / itemsPerSlide);

  return (
    <div className="min-h-screen pb-20 bg-background text-foreground">
      {/* Header */}
      <header className={cn(
        'fixed top-0 left-0 right-0 z-50 ampz-transition backdrop-blur-xl h-16 flex items-center bg-background/95 border-b border-border/20',
        isHeaderHidden ? '-translate-y-full' : 'translate-y-0'
      )}>
        <div className="container mx-auto px-4 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-ampz-md flex items-center justify-center bg-primary">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold tracking-tight">Ampz</span>
            </div>
            <div className="flex items-center gap-3">
              {user?.subscription?.tier !== 'free' && (
                <span className="px-3 py-1 text-xs font-bold rounded-full uppercase bg-primary text-primary-foreground">
                  {user?.subscription?.tier}
                </span>
              )}
              <button onClick={() => navigate('/activity')}
                className="relative w-10 h-10 rounded-full flex items-center justify-center bg-card border border-border/20 ampz-transition hover:scale-105 active:scale-95">
                <Bell className="w-5 h-5 text-foreground" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center bg-destructive text-destructive-foreground">
                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-20">
        {/* Welcome Section - Dynamic Greeting */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
              <img src={user?.profile?.profilePhoto || '/default-avatar.png'} alt={user?.profile?.name || 'User'}
                className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }} />
            </div>
            <div>
              <h1 className="text-xl font-bold">{greeting}</h1>
            </div>
          </div>
        </div>

        {/* Quick Actions - 3 buttons in a row */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map(({ icon: Icon, label, colorClass, onClick, pro }) => (
              <button key={label} onClick={onClick}
                className="ampz-card p-4 flex flex-col items-center justify-center gap-2 relative ampz-interactive min-h-[100px]">
                <div className={cn("w-12 h-12 rounded-ampz-lg flex items-center justify-center", colorClass)}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">{label}</span>
                {pro && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 text-xs font-bold rounded-ampz-sm bg-primary text-primary-foreground">PRO</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Map Button */}
        <div className="mb-8">
          <button onClick={() => navigate('/events')}
            className="w-full rounded-ampz-lg p-4 flex items-center justify-center gap-3 ampz-interactive bg-brand-blue text-white border border-brand-blue">
            <Map className="w-6 h-6" />
            <span className="text-lg font-bold">Explore Events Map</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* My Events */}
        {myEvents.length > 0 ? (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-primary" /> My Events
              </h2>
              <div className="flex items-center gap-2">
                {createdEvents.length > 0 && isProUser && (
                  <button onClick={() => navigate('/event-manager')} className="text-sm font-medium flex items-center gap-1 hover:underline text-primary">
                    <Settings className="w-4 h-4" /> Manage
                  </button>
                )}
                <button onClick={() => navigate('/events')} className="text-sm font-medium flex items-center gap-1 hover:underline text-primary">
                  See All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="relative">
              <div ref={myEventsCarouselRef} className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar">
                {Array.from({ length: totalMyEventsSlides }).map((_, slideIndex) => (
                  <div key={slideIndex} className="flex-shrink-0 w-full snap-start px-1">
                    <div className="grid grid-cols-2 gap-3">
                      {myEvents.slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide).map((event) => {
                        const isBookmarked = user?.bookmarkedEvents?.includes(event.id);
                        const isCreated = event.organizerId === user?.id;
                        return (
                          <div key={event.id} className="ampz-card overflow-hidden cursor-pointer ampz-interactive" onClick={() => navigate(`/event/${event.id}`)}>
                            <div className="relative h-32">
                              <img src={event.coverImage} alt={event.name} className="w-full h-full object-cover rounded-t-ampz-lg"
                                onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} />
                              <div className="absolute top-2 right-2">
                                {isBookmarked && (
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary">
                                    <Bookmark className="w-4 h-4 text-white fill-white" />
                                  </div>
                                )}
                              </div>
                              {isCreated && (
                                <div className="absolute top-2 left-2">
                                  <div className="px-2 py-1 rounded-ampz-sm text-xs font-bold text-white bg-primary/90">CREATED</div>
                                </div>
                              )}
                              <div className="absolute bottom-2 left-2 text-white text-xs px-2 py-1 rounded-ampz-sm bg-black/70">
                                {event.attendees || 0} going
                              </div>
                            </div>
                            <div className="p-3">
                              <h3 className="font-semibold text-sm line-clamp-1 mb-1">{event.name}</h3>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">{event.category || 'Event'}</span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-ampz-sm bg-primary text-primary-foreground">
                                  {event.price === 0 ? 'FREE' : `N$${event.price}`}
                                </span>
                              </div>
                              <p className="text-xs mt-1 line-clamp-1 text-muted-foreground">{event.location || 'Location not specified'}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {totalMyEventsSlides > 1 && (
                <div className="flex justify-center gap-1.5 mt-4">
                  {Array.from({ length: totalMyEventsSlides }).map((_, index) => (
                    <button key={index} onClick={() => setMyEventsIndex(index)}
                      className={cn('h-1.5 rounded-full transition-all', myEventsIndex === index ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30')} />
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="mb-8">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Bookmark className="w-5 h-5 text-primary" /> My Events
            </h2>
            <div className="ampz-card p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No upcoming events. Explore events nearby!</p>
              <button onClick={() => navigate('/events')} className="mt-3 text-sm font-medium text-primary hover:underline">Browse Events</button>
            </div>
          </section>
        )}

        {/* Featured Events */}
        {featuredEvents.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" /> Featured Events
              </h2>
              <button onClick={() => navigate('/events')} className="text-sm font-medium flex items-center gap-1 hover:underline text-primary">
                See All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div ref={featuredRef} className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar gap-4 pb-2">
              {featuredEvents.map((event) => (
                <div key={event.id} className="flex-shrink-0 w-[calc(100%-32px)] snap-start cursor-pointer ampz-interactive"
                  onClick={() => navigate(`/event/${event.id}`)}>
                  <div className="ampz-card overflow-hidden">
                    <div className="relative h-48">
                      <img src={event.coverImage} alt={event.name} className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} />
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <h3 className="text-lg font-bold text-white">{event.name}</h3>
                        <p className="text-sm text-white/80">{event.location} • {event.attendees} going</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {featuredEvents.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {featuredEvents.map((_, index) => (
                  <button key={index} onClick={() => setFeaturedIndex(index)}
                    className={cn('h-1.5 rounded-full transition-all', featuredIndex === index ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30')} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <BottomNav />

      {/* Modals */}
      <QRScannerModal isOpen={showCheckIn} onClose={() => setShowCheckIn(false)} userId={user?.id} onCheckInSuccess={(eventId) => { toast({ title: 'Checked in!', description: 'You have successfully checked in' }); }} />
      <TicketsModal isOpen={showTickets} onClose={() => setShowTickets(false)} />
      <EventWizardModal isOpen={showEventWizard} onClose={() => setShowEventWizard(false)} />
      {showSubscription && <SubscriptionModal isOpen={showSubscription} onClose={() => setShowSubscription(false)} />}
    </div>
  );
}
