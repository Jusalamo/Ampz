import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Map, Plus, Ticket, Calendar, Users, Heart, ChevronRight, Bell, Zap, Bookmark, Star, Settings } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { QRScannerModal } from '@/components/modals/QRScannerModal';
import { TicketsModal } from '@/components/modals/TicketsModal';
import { EventWizardModal } from '@/components/modals/EventWizardModal';
import { SubscriptionModal } from '@/components/modals/SubscriptionModal';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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
  const [metrics, setMetrics] = useState({ events: 0, matches: 0, likesLeft: 0 as number | string });
  const featuredRef = useRef<HTMLDivElement>(null);
  const myEventsCarouselRef = useRef<HTMLDivElement>(null);

  // Fetch real metrics from database
  useEffect(() => {
    if (!user?.id) return;
    
    const fetchMetrics = async () => {
      try {
        // Fixed: Removed 'head: true' from check_ins query
        const { count: eventsCount, error: eventsError } = await supabase
          .from('check_ins')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id);
        
        if (eventsError) {
          console.error('Error fetching check-ins:', eventsError);
          throw eventsError;
        }
        
        // Fixed: Removed 'head: true' from matches query
        const { count: matchesCount, error: matchesError } = await supabase
          .from('matches')
          .select('*', { count: 'exact' })
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .eq('status', 'active');
        
        if (matchesError) {
          console.error('Error fetching matches:', matchesError);
          throw matchesError;
        }
        
        setMetrics({
          events: eventsCount || 0,
          matches: matchesCount || 0,
          likesLeft: user.subscription?.tier === 'free' 
            ? (user.likesRemaining ?? 10) 
            : '∞'
        });
      } catch (err) {
        console.error('Error fetching metrics:', err);
        // Set default values on error
        setMetrics({
          events: 0,
          matches: 0,
          likesLeft: user?.subscription?.tier === 'free' ? 10 : '∞'
        });
      }
    };
    
    fetchMetrics();
  }, [user?.id, user?.subscription?.tier, user?.likesRemaining]);

  // Get all user events (created + bookmarked)
  const createdEvents = events?.filter(e => e.organizerId === user?.id) || [];
  const bookmarkedEvents = events?.filter(e => user?.bookmarkedEvents?.includes(e.id)) || [];
  const myEvents = [...createdEvents, ...bookmarkedEvents];
  const featuredEvents = events?.filter(e => e.isFeatured) || [];

  const isHeaderHidden = scrollDirection === 'down' && scrollY > 100;

  // Check if user has Pro or Max subscription
  const isProUser = user?.subscription?.tier === 'pro' || user?.subscription?.tier === 'max';

  // Auto-rotate featured events
  useEffect(() => {
    if (!featuredEvents || featuredEvents.length <= 1) return;
    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredEvents.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredEvents]);

  // Scroll to current featured event
  useEffect(() => {
    if (featuredRef.current && featuredEvents?.length > 0) {
      const container = featuredRef.current;
      const cardWidth = container.offsetWidth - 40;
      container.scrollTo({
        left: featuredIndex * cardWidth,
        behavior: 'smooth',
      });
    }
  }, [featuredIndex, featuredEvents?.length]);

  // Handle my events carousel scroll
  useEffect(() => {
    if (myEventsCarouselRef.current && myEvents?.length > 0) {
      const container = myEventsCarouselRef.current;
      container.scrollTo({
        left: myEventsIndex * container.offsetWidth,
        behavior: 'smooth',
      });
    }
  }, [myEventsIndex, myEvents?.length]);

  const handleCreateEvent = () => {
    if (!isProUser) {
      toast({ 
        title: 'Pro Feature', 
        description: 'Upgrade to Pro to create events' 
      });
      setShowSubscription(true);
    } else {
      setShowEventWizard(true);
    }
  };

  const handleManageEvents = () => {
    if (!isProUser) {
      toast({ 
        title: 'Pro Feature', 
        description: 'Upgrade to Pro to manage events' 
      });
      setShowSubscription(true);
    } else if (createdEvents.length === 0) {
      toast({
        title: 'No events to manage',
        description: 'Create an event first to manage it',
        variant: 'destructive'
      });
    } else {
      navigate('/event-manager');
    }
  };

  // Quick actions in 2x2 grid
  const quickActions = [
    { 
      icon: QrCode, 
      label: 'QR Scan', 
      colorClass: 'bg-brand-purple', 
      onClick: () => setShowCheckIn(true),
      pro: false
    },
    { 
      icon: Plus, 
      label: 'Create Event', 
      colorClass: 'bg-brand-pink', 
      onClick: handleCreateEvent, 
      pro: !isProUser
    },
    { 
      icon: Settings, 
      label: 'Manage Events', 
      colorClass: 'bg-brand-orange', 
      onClick: handleManageEvents,
      pro: !isProUser
    },
    { 
      icon: Ticket, 
      label: 'Tickets', 
      colorClass: 'bg-brand-green', 
      onClick: () => setShowTickets(true),
      pro: false
    },
  ];

  // Compact stats grid - using real metrics
  const stats = [
    { 
      icon: Calendar, 
      value: metrics.events, 
      label: 'Events',
      colorClass: 'text-brand-blue'
    },
    { 
      icon: Users, 
      value: metrics.matches, 
      label: 'Matches',
      colorClass: 'text-brand-green'
    },
    { 
      icon: Heart, 
      value: metrics.likesLeft, 
      label: 'Likes Left',
      colorClass: 'text-brand-pink'
    },
  ];

  // Calculate my events carousel items per slide
  const itemsPerSlide = 2;
  const totalMyEventsSlides = Math.ceil(myEvents.length / itemsPerSlide);

  return (
    <div className="min-h-screen pb-20 bg-background text-foreground">
      {/* Header - Fixed size with larger logo */}
      <header 
        className={cn(
          'fixed top-0 left-0 right-0 z-50 ampz-transition backdrop-blur-xl h-16 flex items-center bg-background/95 border-b border-border/20',
          isHeaderHidden ? '-translate-y-full' : 'translate-y-0'
        )}
      >
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
              <button
                onClick={() => navigate('/activity')}
                className="relative w-10 h-10 rounded-full flex items-center justify-center bg-card border border-border/20 ampz-transition hover:scale-105 active:scale-95"
              >
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
        {/* Welcome Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
              <img 
                src={user?.profile?.profilePhoto || '/default-avatar.png'} 
                alt={user?.profile?.name || 'User'} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/default-avatar.png';
                }}
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Welcome back
              </p>
              <h1 className="text-xl font-bold">
                {user?.profile?.name?.split(' ')[0] || 'Guest'}
              </h1>
            </div>
          </div>
        </div>

        {/* Stats Grid - Compact Squares */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {stats.map(({ icon: Icon, value, label, colorClass }) => (
            <div 
              key={label} 
              className="ampz-card p-3 text-center"
            >
              <Icon className={cn("w-5 h-5 mx-auto mb-1", colorClass)} />
              <p className="text-lg font-bold text-foreground">
                {value}
              </p>
              <p className="text-xs text-muted-foreground">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Quick Actions - 2x2 Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ icon: Icon, label, colorClass, onClick, pro }) => (
              <button 
                key={label} 
                onClick={onClick}
                className="ampz-card p-4 flex flex-col items-center justify-center gap-2 relative ampz-interactive"
              >
                <div className={cn("w-12 h-12 rounded-ampz-lg flex items-center justify-center", colorClass)}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {label}
                </span>
                {pro && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 text-xs font-bold rounded-ampz-sm bg-primary text-primary-foreground">
                    PRO
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Map Button */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/events')}
            className="w-full rounded-ampz-lg p-4 flex items-center justify-center gap-3 ampz-interactive bg-brand-blue text-white border border-brand-blue"
          >
            <Map className="w-6 h-6" />
            <span className="text-lg font-bold">Explore Events Map</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* My Events - Horizontal Carousel */}
        {myEvents.length > 0 ? (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-primary" />
                My Events
              </h2>
              <div className="flex items-center gap-2">
                {createdEvents.length > 0 && isProUser && (
                  <button 
                    onClick={() => navigate('/event-manager')}
                    className="text-sm font-medium flex items-center gap-1 hover:underline text-primary"
                  >
                    <Settings className="w-4 h-4" />
                    Manage
                  </button>
                )}
                <button 
                  onClick={() => navigate('/events')}
                  className="text-sm font-medium flex items-center gap-1 hover:underline text-primary"
                >
                  See All
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="relative">
              <div 
                ref={myEventsCarouselRef}
                className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
              >
                {Array.from({ length: totalMyEventsSlides }).map((_, slideIndex) => (
                  <div 
                    key={slideIndex} 
                    className="flex-shrink-0 w-full snap-start px-1"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      {myEvents
                        .slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide)
                        .map((event) => {
                          const isBookmarked = user?.bookmarkedEvents?.includes(event.id);
                          const isCreated = event.organizerId === user?.id;
                          
                          return (
                            <div 
                              key={event.id} 
                              className="ampz-card overflow-hidden cursor-pointer ampz-interactive"
                              onClick={() => navigate(`/event/${event.id}`)}
                            >
                              {/* Event Image with Bookmark Badge */}
                              <div className="relative h-32">
                                <img 
                                  src={event.coverImage} 
                                  alt={event.name}
                                  className="w-full h-full object-cover rounded-t-ampz-lg"
                                  onError={(e) => {
                                    e.currentTarget.src = '/default-event.jpg';
                                  }}
                                />
                                <div className="absolute top-2 right-2">
                                  {isBookmarked && (
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary">
                                      <Bookmark className="w-4 h-4 text-white fill-white" />
                                    </div>
                                  )}
                                </div>
                                {isCreated && (
                                  <div className="absolute top-2 left-2">
                                    <div className="px-2 py-1 rounded-ampz-sm text-xs font-bold text-white bg-primary/90">
                                      CREATED
                                    </div>
                                  </div>
                                )}
                                <div className="absolute bottom-2 left-2 text-white text-xs px-2 py-1 rounded-ampz-sm bg-black/70">
                                  {event.attendees || 0} going
                                </div>
                              </div>
                              
                              {/* Event Info */}
                              <div className="p-3">
                                <h3 className="font-semibold text-sm line-clamp-1 mb-1">
                                  {event.name}
                                </h3>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    {event.category || 'Event'}
                                  </span>
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-ampz-sm bg-primary text-primary-foreground">
                                    {event.price === 0 ? 'FREE' : `N$${event.price}`}
                                  </span>
                                </div>
                                <p className="text-xs mt-1 line-clamp-1 text-muted-foreground">
                                  {event.location || 'Location not specified'}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Carousel Navigation Pills */}
              {totalMyEventsSlides > 1 && (
                <div className="flex justify-center gap-1.5 mt-4">
                  {Array.from({ length: totalMyEventsSlides }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setMyEventsIndex(index)}
                      className={cn(
                        "h-1.5 rounded-full ampz-transition",
                        index === myEventsIndex 
                          ? "w-4 bg-primary" 
                          : "w-1.5 bg-muted-foreground"
                      )}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-primary" />
                My Events
              </h2>
            </div>
            <div className="ampz-card p-8 text-center border border-dashed border-muted-foreground">
              <Bookmark className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No events yet</p>
              <p className="text-sm mt-1 text-muted-foreground">
                {isProUser ? 'Create or bookmark events to see them here' : 'Upgrade to Pro to create events'}
              </p>
            </div>
          </section>
        )}

        {/* Featured Events - Carousel */}
        {featuredEvents.length > 0 ? (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Star className="w-5 h-5 text-brand-yellow" />
                Featured Events
              </h2>
              <button 
                onClick={() => navigate('/events')}
                className="text-sm font-medium flex items-center gap-1 hover:underline text-primary"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <div 
                ref={featuredRef}
                className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
              >
                {featuredEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className="flex-shrink-0 w-full snap-start px-1"
                  >
                    <div 
                      className="ampz-card overflow-hidden cursor-pointer ampz-interactive scale-95"
                      onClick={() => navigate(`/event/${event.id}`)}
                    >
                      {/* Featured Event Image */}
                      <div className="relative h-44">
                        <img 
                          src={event.coverImage} 
                          alt={event.name}
                          className="w-full h-full object-cover rounded-t-ampz-lg"
                          onError={(e) => {
                            e.currentTarget.src = '/default-event.jpg';
                          }}
                        />
                        <div className="absolute top-3 right-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-brand-yellow/90 backdrop-blur-sm">
                            <Star className="w-5 h-5 text-black fill-black" />
                          </div>
                        </div>
                        <div className="absolute bottom-3 left-3 text-white text-sm px-3 py-1 rounded-ampz-sm bg-black/70">
                          {event.attendees || 0} going
                        </div>
                      </div>
                      
                      {/* Event Details */}
                      <div className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-base font-bold line-clamp-1">{event.name}</h3>
                          <span className="text-sm font-semibold px-2 py-0.5 rounded-ampz-sm bg-primary text-primary-foreground">
                            {event.price === 0 ? 'FREE' : `N$${event.price}`}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-ampz-sm bg-primary/10 text-primary">
                            {event.category || 'Event'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {event.date || 'TBA'} • {event.time || 'TBA'}
                          </span>
                        </div>
                        
                        <p className="text-xs line-clamp-2 mb-2 text-muted-foreground">
                          {event.description || 'Join this amazing event!'}
                        </p>
                        
                        {/* Location */}
                        <div className="flex items-center gap-2 pt-2 border-t border-border/20">
                          <Map className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs line-clamp-1 text-muted-foreground">
                            {event.location || 'Location not specified'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Featured Events Navigation Pills */}
              {featuredEvents.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-4">
                  {featuredEvents.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setFeaturedIndex(index)}
                      className={cn(
                        "h-1.5 rounded-full ampz-transition",
                        index === featuredIndex 
                          ? "w-4 bg-primary" 
                          : "w-1.5 bg-muted-foreground"
                      )}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Star className="w-5 h-5 text-brand-yellow" />
                Featured Events
              </h2>
            </div>
            <div className="ampz-card p-8 text-center border border-dashed border-muted-foreground">
              <Star className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No featured events</p>
              <p className="text-sm mt-1 text-muted-foreground">
                Check back later for featured events
              </p>
            </div>
          </section>
        )}
      </main>

      <BottomNav />

      {/* Modals */}
      <QRScannerModal
        isOpen={showCheckIn}
        onClose={() => setShowCheckIn(false)}
        userId={user?.id}
        onCheckInSuccess={() => {
          // keep UI responsive; navigation happens inside the modal on success
          setShowCheckIn(false);
        }}
      />
      <TicketsModal isOpen={showTickets} onClose={() => setShowTickets(false)} />
      <EventWizardModal isOpen={showEventWizard} onClose={() => setShowEventWizard(false)} />
      <SubscriptionModal isOpen={showSubscription} onClose={() => setShowSubscription(false)} />
    </div>
  );
}
