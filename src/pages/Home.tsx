import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Map, Plus, Ticket, Calendar, Users, Heart, ChevronRight, ChevronLeft, Bell, Zap, Bookmark, Star, Settings } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { CheckInModal } from '@/components/modals/CheckInModal';
import { TicketsModal } from '@/components/modals/TicketsModal';
import { EventWizardModal } from '@/components/modals/EventWizardModal';
import { EventManager } from '.@/pages/EventManager';
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
  const myEventsCarouselRef = useRef<HTMLDivElement>(null);

  // Get all user events (created + bookmarked) - FIXED: added null checks
  const createdEvents = events?.filter(e => e.organizerId === user?.id) || [];
  const bookmarkedEvents = events?.filter(e => user?.bookmarkedEvents?.includes(e.id)) || [];
  const myEvents = [...createdEvents, ...bookmarkedEvents];
  const featuredEvents = events?.filter(e => e.isFeatured) || [];

  const isHeaderHidden = scrollDirection === 'down' && scrollY > 100;

  // Check if user has Pro or Max subscription
  const isProUser = user?.subscription?.tier === 'pro' || user?.subscription?.tier === 'max';

  // Auto-rotate featured events - FIXED: added length check
  useEffect(() => {
    if (!featuredEvents || featuredEvents.length <= 1) return;
    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredEvents.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredEvents]);

  // Scroll to current featured event - FIXED: added null checks
  useEffect(() => {
    if (featuredRef.current && featuredEvents?.length > 0) {
      const container = featuredRef.current;
      const cardWidth = container.offsetWidth - 40; // Account for padding
      container.scrollTo({
        left: featuredIndex * cardWidth,
        behavior: 'smooth',
      });
    }
  }, [featuredIndex, featuredEvents?.length]);

  // Handle my events carousel scroll - FIXED: added null checks
  useEffect(() => {
    if (myEventsCarouselRef.current && myEvents?.length > 0) {
      const container = myEventsCarouselRef.current;
      // Calculate card width based on actual card dimensions (2 cards + gap)
      const cardWidth = (container.offsetWidth - 12) / 2; // 12px = gap(3px) * 3 (gaps between 2 cards)
      container.scrollTo({
        left: myEventsIndex * container.offsetWidth, // Scroll by full container width
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
      navigate('/EventManager');
    }
  };

  // Quick actions in 2x2 grid - UPDATED: Added Manage Events button
  const quickActions = [
    { 
      icon: QrCode, 
      label: 'QR Scan', 
      color: 'bg-purple-500', 
      onClick: () => setShowCheckIn(true),
      iconSize: 'w-6 h-6',
      pro: false
    },
    { 
      icon: Plus, 
      label: 'Create Event', 
      color: 'bg-pink-500', 
      onClick: handleCreateEvent, 
      pro: !isProUser,
      iconSize: 'w-6 h-6'
    },
    { 
      icon: Settings, 
      label: 'Manage Events', 
      color: 'bg-orange-500', 
      onClick: handleManageEvents,
      pro: !isProUser,
      iconSize: 'w-6 h-6'
    },
    { 
      icon: Ticket, 
      label: 'Tickets', 
      color: 'bg-green-500', 
      onClick: () => setShowTickets(true),
      iconSize: 'w-6 h-6',
      pro: false
    },
  ];

  // Compact stats grid - FIXED: added null checks
  const stats = [
    { 
      icon: Calendar, 
      value: myEvents.length, 
      label: 'My Events',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    { 
      icon: Users, 
      value: user?.subscription?.tier === 'free' ? 2 : 12, 
      label: 'Matches',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    { 
      icon: Heart, 
      value: user?.subscription?.tier === 'free' ? (user?.likesRemaining ?? 10) : '∞', 
      label: 'Likes Left',
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10'
    },
  ];

  // Calculate my events carousel items per slide
  const itemsPerSlide = 2;
  const totalMyEventsSlides = Math.ceil(myEvents.length / itemsPerSlide);

  // Handle my events carousel navigation
  const handleMyEventsPrev = () => {
    setMyEventsIndex(prev => (prev - 1 + totalMyEventsSlides) % totalMyEventsSlides);
  };

  const handleMyEventsNext = () => {
    setMyEventsIndex(prev => (prev + 1) % totalMyEventsSlides);
  };

  // Handle featured events navigation
  const handleFeaturedPrev = () => {
    setFeaturedIndex(prev => (prev - 1 + featuredEvents.length) % featuredEvents.length);
  };

  const handleFeaturedNext = () => {
    setFeaturedIndex(prev => (prev + 1) % featuredEvents.length);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <header 
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-transform duration-300 bg-background/95 backdrop-blur-xl border-b border-border',
          isHeaderHidden ? '-translate-y-full' : 'translate-y-0'
        )}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Ampz</span>
            </div>
            <div className="flex items-center gap-3">
              {user?.subscription?.tier !== 'free' && (
                <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase">
                  {user?.subscription?.tier}
                </span>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-9 h-9 rounded-full bg-card flex items-center justify-center border border-border hover:border-primary transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center text-white">
                      {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <NotificationsDropdown isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
                )}
              </div>
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
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <h1 className="text-xl font-bold">{user?.profile?.name?.split(' ')[0] || 'Guest'}</h1>
            </div>
          </div>
        </div>

        {/* Stats Grid - Compact Squares */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {stats.map(({ icon: Icon, value, label, color, bgColor }) => (
            <div 
              key={label} 
              className={cn(
                "rounded-xl p-3 text-center border border-border",
                bgColor
              )}
            >
              <Icon className={cn("w-5 h-5 mx-auto mb-1", color)} />
              <p className="text-lg font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions - 2x2 Grid - UPDATED: Now has Manage Events */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ icon: Icon, label, color, onClick, pro, iconSize }) => (
              <button 
                key={label} 
                onClick={onClick}
                className="bg-card rounded-xl p-4 flex flex-col items-center justify-center gap-2 border border-border hover:border-primary transition-all relative group active:scale-95"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", color)}>
                  <Icon className={cn("text-white", iconSize)} />
                </div>
                <span className="text-sm font-medium">{label}</span>
                {pro && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-primary text-white text-xs font-bold rounded">PRO</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Map Button moved here as a separate section */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/events')}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 flex items-center justify-center gap-3 border border-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all active:scale-98"
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
                    onClick={() => navigate('/manage-events')}
                    className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
                  >
                    <Settings className="w-4 h-4" />
                    Manage
                  </button>
                )}
                <button 
                  onClick={() => navigate('/events')}
                  className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
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
                style={{ scrollBehavior: 'smooth' }}
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
                              className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary transition-all group cursor-pointer active:scale-98"
                              onClick={() => navigate(`/event/${event.id}`)}
                            >
                              {/* Event Image with Bookmark Badge */}
                              <div className="relative h-32">
                                <img 
                                  src={event.coverImage} 
                                  alt={event.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = '/default-event.jpg';
                                  }}
                                />
                                <div className="absolute top-2 right-2">
                                  {isBookmarked && (
                                    <div className="w-8 h-8 bg-yellow-500/90 rounded-full flex items-center justify-center">
                                      <Bookmark className="w-4 h-4 text-white fill-white" />
                                    </div>
                                  )}
                                </div>
                                {isCreated && (
                                  <div className="absolute top-2 left-2">
                                    <div className="px-2 py-1 bg-primary/90 rounded text-xs font-bold text-white">
                                      CREATED
                                    </div>
                                  </div>
                                )}
                                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
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
                                  <span className="text-xs font-semibold">
                                    {event.price === 0 ? 'FREE' : `N$${event.price}`}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
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

              {/* Carousel Navigation */}
              {totalMyEventsSlides > 1 && (
                <>
                  <button
                    onClick={handleMyEventsPrev}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border hover:border-primary transition-colors z-10 active:scale-95"
                    aria-label="Previous events"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleMyEventsNext}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border hover:border-primary transition-colors z-10 active:scale-95"
                    aria-label="Next events"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  {/* Dots Indicator */}
                  <div className="flex justify-center gap-1.5 mt-4">
                    {Array.from({ length: totalMyEventsSlides }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setMyEventsIndex(index)}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          index === myEventsIndex 
                            ? "bg-primary w-4" 
                            : "bg-muted w-1.5"
                        )}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
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
            <div className="bg-card rounded-xl p-8 text-center border border-dashed border-border">
              <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No events yet</p>
              <p className="text-sm text-muted-foreground mt-1">
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
                <Star className="w-5 h-5 text-yellow-500" />
                Featured Events
              </h2>
              <button 
                onClick={() => navigate('/events')}
                className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <div 
                ref={featuredRef}
                className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
                style={{ scrollBehavior: 'smooth' }}
              >
                {featuredEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className="flex-shrink-0 w-full snap-start px-1"
                  >
                    <div 
                      className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary transition-all cursor-pointer active:scale-98"
                      onClick={() => navigate(`/event/${event.id}`)}
                    >
                      {/* Featured Event Image */}
                      <div className="relative h-48">
                        <img 
                          src={event.coverImage} 
                          alt={event.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/default-event.jpg';
                          }}
                        />
                        <div className="absolute top-3 right-3">
                          <div className="px-3 py-1 bg-primary/90 rounded-full text-xs font-bold text-white">
                            FEATURED
                          </div>
                        </div>
                        <div className="absolute bottom-3 left-3 bg-black/70 text-white text-sm px-3 py-1 rounded">
                          {event.attendees || 0} going
                        </div>
                      </div>
                      
                      {/* Event Details - Removed host info and check-in button */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-bold line-clamp-1">{event.name}</h3>
                          <span className="text-sm font-semibold">
                            {event.price === 0 ? 'FREE' : `N$${event.price}`}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                            {event.category || 'Event'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {event.date || 'TBA'} • {event.time || 'TBA'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {event.description || 'Join this amazing event!'}
                        </p>
                        
                        {/* Location only */}
                        <div className="flex items-center gap-2 pt-3 border-t border-border">
                          <Map className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground line-clamp-1">
                            {event.location || 'Location not specified'}
                          </span>
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
                    onClick={handleFeaturedPrev}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border hover:border-primary transition-colors z-10 active:scale-95"
                    aria-label="Previous featured event"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleFeaturedNext}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border hover:border-primary transition-colors z-10 active:scale-95"
                    aria-label="Next featured event"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  {/* Dots Indicator */}
                  <div className="flex justify-center gap-1.5 mt-4">
                    {featuredEvents.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setFeaturedIndex(index)}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          index === featuredIndex 
                            ? "bg-primary w-4" 
                            : "bg-muted w-1.5"
                        )}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        ) : (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Featured Events
              </h2>
            </div>
            <div className="bg-card rounded-xl p-8 text-center border border-dashed border-border">
              <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No featured events</p>
              <p className="text-sm text-muted-foreground mt-1">Check back later for featured events</p>
            </div>
          </section>
        )}
      </main>

      <BottomNav />

      {/* Modals */}
      <CheckInModal isOpen={showCheckIn} onClose={() => setShowCheckIn(false)} />
      <TicketsModal isOpen={showTickets} onClose={() => setShowTickets(false)} />
      <EventWizardModal isOpen={showEventWizard} onClose={() => setShowEventWizard(false)} />
      <SubscriptionModal isOpen={showSubscription} onClose={() => setShowSubscription(false)} />
    </div>
  );
}
