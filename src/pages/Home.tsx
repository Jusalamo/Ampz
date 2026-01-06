import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Map, Plus, Ticket, Calendar, Users, Heart, ChevronRight, ChevronLeft, Bell, Zap, Bookmark, Star } from 'lucide-react';
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
  const myEventsCarouselRef = useRef<HTMLDivElement>(null);

  // Get all user events (created + bookmarked)
  const createdEvents = events.filter(e => e.organizerId === user?.id);
  const bookmarkedEvents = events.filter(e => user?.bookmarkedEvents.includes(e.id));
  const myEvents = [...createdEvents, ...bookmarkedEvents];
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
      const container = featuredRef.current;
      const cardWidth = container.offsetWidth - 40; // Account for padding
      container.scrollTo({
        left: featuredIndex * cardWidth,
        behavior: 'smooth',
      });
    }
  }, [featuredIndex, featuredEvents.length]);

  // Handle my events carousel scroll
  useEffect(() => {
    if (myEventsCarouselRef.current && myEvents.length > 0) {
      const container = myEventsCarouselRef.current;
      const cardWidth = container.offsetWidth / 2; // Show 2 cards at a time
      container.scrollTo({
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

  // Quick actions in 2x2 grid with only 4 items
  const quickActions = [
    { 
      icon: QrCode, 
      label: 'QR Scan', 
      color: 'bg-purple-500', 
      onClick: () => setShowCheckIn(true),
      iconSize: 'w-6 h-6' 
    },
    { 
      icon: Plus, 
      label: 'Create Event', 
      color: 'bg-pink-500', 
      onClick: handleCreateEvent, 
      pro: user?.subscription.tier === 'free',
      iconSize: 'w-6 h-6'
    },
    { 
      icon: Map, 
      label: 'View Map', 
      color: 'bg-blue-500', 
      onClick: () => navigate('/events'),
      iconSize: 'w-6 h-6'
    },
    { 
      icon: Ticket, 
      label: 'Tickets', 
      color: 'bg-green-500', 
      onClick: () => setShowTickets(true),
      iconSize: 'w-6 h-6'
    },
  ];

  // Compact stats grid
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
      value: user?.subscription.tier === 'free' ? 2 : 12, 
      label: 'Matches',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    { 
      icon: Heart, 
      value: user?.subscription.tier === 'free' ? user?.likesRemaining ?? 10 : '∞', 
      label: 'Likes Left',
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10'
    },
  ];

  // Calculate my events carousel items per slide
  const itemsPerSlide = 2;
  const totalMyEventsSlides = Math.ceil(myEvents.length / itemsPerSlide);

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
              {user?.subscription.tier !== 'free' && (
                <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase">
                  {user?.subscription.tier}
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
                      {unreadNotificationsCount}
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
      <main className="container mx-auto px-4 pt-20">
        {/* Welcome Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
              <img 
                src={user?.profile.profilePhoto || '/default-avatar.png'} 
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

        {/* Quick Actions - 2x2 Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ icon: Icon, label, color, onClick, pro, iconSize }) => (
              <button 
                key={label} 
                onClick={onClick}
                className="bg-card rounded-xl p-4 flex flex-col items-center justify-center gap-2 border border-border hover:border-primary transition-all relative group"
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

        {/* My Events - Horizontal Carousel */}
        {myEvents.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-primary" />
                My Events
              </h2>
              <button 
                onClick={() => navigate('/events')}
                className="text-primary text-sm font-medium flex items-center gap-1"
              >
                See All
                <ChevronRight className="w-4 h-4" />
              </button>
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
                          const isBookmarked = user?.bookmarkedEvents.includes(event.id);
                          const isCreated = event.organizerId === user?.id;
                          
                          return (
                            <div 
                              key={event.id} 
                              className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary transition-all group cursor-pointer"
                              onClick={() => navigate(`/event/${event.id}`)}
                            >
                              {/* Event Image with Bookmark Badge */}
                              <div className="relative h-32">
                                <img 
                                  src={event.coverImage} 
                                  alt={event.name}
                                  className="w-full h-full object-cover"
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
                                  {event.attendees} going
                                </div>
                              </div>
                              
                              {/* Event Info */}
                              <div className="p-3">
                                <h3 className="font-semibold text-sm line-clamp-1 mb-1">
                                  {event.name}
                                </h3>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    {event.category}
                                  </span>
                                  <span className="text-xs font-semibold">
                                    {event.price === 0 ? 'FREE' : `N$${event.price}`}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                  {event.location}
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
                    onClick={() => setMyEventsIndex(prev => (prev - 1 + totalMyEventsSlides) % totalMyEventsSlides)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border hover:border-primary transition-colors z-10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setMyEventsIndex(prev => (prev + 1) % totalMyEventsSlides)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border hover:border-primary transition-colors z-10"
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
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* Featured Events - Carousel */}
        {featuredEvents.length > 0 && (
          <section className="mb-6"> {/* Reduced margin from bottom */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Featured Events
              </h2>
              <button 
                onClick={() => navigate('/events')}
                className="text-primary text-sm font-medium flex items-center gap-1"
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
                      className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary transition-all cursor-pointer"
                      onClick={() => navigate(`/event/${event.id}`)}
                    >
                      {/* Featured Event Image */}
                      <div className="relative h-48">
                        <img 
                          src={event.coverImage} 
                          alt={event.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3">
                          <div className="px-3 py-1 bg-primary/90 rounded-full text-xs font-bold text-white">
                            FEATURED
                          </div>
                        </div>
                        <div className="absolute bottom-3 left-3 bg-black/70 text-white text-sm px-3 py-1 rounded">
                          {event.attendees} attendees
                        </div>
                      </div>
                      
                      {/* Event Details */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-bold line-clamp-1">{event.name}</h3>
                          <span className="text-sm font-semibold">
                            {event.price === 0 ? 'FREE' : `N$${event.price}`}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                            {event.category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {event.date} • {event.time}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {event.description || 'Join this amazing event!'}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden">
                              <img 
                                src={event.organizerId === user?.id ? user.profile.profilePhoto : '/default-avatar.png'} 
                                alt="Organizer"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {event.organizerId === user?.id ? 'You' : 'Host'} • {event.location}
                            </span>
                          </div>
                          <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                            Check In
                          </button>
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
                    onClick={() => setFeaturedIndex(prev => (prev - 1 + featuredEvents.length) % featuredEvents.length)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border hover:border-primary transition-colors z-10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setFeaturedIndex(prev => (prev + 1) % featuredEvents.length)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border hover:border-primary transition-colors z-10"
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
                      />
                    ))}
                  </div>
                </>
              )}
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
