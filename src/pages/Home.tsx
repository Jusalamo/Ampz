import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Map, Plus, Ticket, Calendar, Users, Heart, ChevronRight, ChevronLeft, Bell, Zap, Bookmark, BookmarkCheck } from 'lucide-react';
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
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Get bookmarked events
  const bookmarkedEvents = events.filter(e => user?.bookmarkedEvents?.includes(e.id));
  // Get user's created events
  const userCreatedEvents = events.filter(e => e.organizerId === user?.id);
  // Combine both for "My Events" section
  const myEvents = [...bookmarkedEvents, ...userCreatedEvents];
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
      const cardWidth = 316;
      featuredRef.current.scrollTo({
        left: featuredIndex * cardWidth,
        behavior: 'smooth',
      });
    }
  }, [featuredIndex, featuredEvents.length]);

  // Calculate carousel slides
  const eventsPerSlide = 2;
  const carouselSlides = Math.ceil(myEvents.length / eventsPerSlide);
  
  const handleCreateEvent = () => {
    if (user?.subscription.tier === 'free') {
      toast({ title: 'Pro Feature', description: 'Upgrade to Pro to create events' });
      setShowSubscription(true);
    } else {
      setShowEventWizard(true);
    }
  };

  // Updated Quick Actions - 2x2 grid with larger icons
  const quickActions = [
    { 
      icon: QrCode, 
      label: 'QR Scan', 
      color: 'bg-brand-purple', 
      onClick: () => setShowCheckIn(true),
      iconSize: 'w-7 h-7' 
    },
    { 
      icon: Map, 
      label: 'View Map', 
      color: 'bg-brand-blue', 
      onClick: () => navigate('/events'),
      iconSize: 'w-7 h-7' 
    },
    { 
      icon: Plus, 
      label: 'Create Event', 
      color: 'bg-brand-pink', 
      onClick: handleCreateEvent, 
      pro: true,
      iconSize: 'w-7 h-7' 
    },
    { 
      icon: Ticket, 
      label: 'Tickets', 
      color: 'bg-brand-green', 
      onClick: () => setShowTickets(true),
      iconSize: 'w-7 h-7' 
    },
  ];

  // Updated stats - smaller, square format
  const stats = [
    { icon: Calendar, value: myEvents.length, label: 'Events' },
    { icon: Users, value: user?.subscription.tier === 'free' ? 2 : 12, label: 'Matches' },
    { icon: Heart, value: user?.subscription.tier === 'free' ? user?.likesRemaining ?? 10 : '∞', label: 'Likes Left' },
  ];

  // Navigation for events carousel
  const nextSlide = () => {
    if (carouselIndex < carouselSlides - 1) {
      setCarouselIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (carouselIndex > 0) {
      setCarouselIndex(prev => prev - 1);
    }
  };

  // Get events for current carousel slide
  const getEventsForSlide = (slideIndex: number) => {
    const startIndex = slideIndex * eventsPerSlide;
    return myEvents.slice(startIndex, startIndex + eventsPerSlide);
  };

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

      <div className="px-5 pt-20 pb-4">
        {/* Profile Header - No emoji */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary">
            <img src={user?.profile.profilePhoto} alt={user?.profile.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h1 className="text-xl font-bold">{user?.profile.name?.split(' ')[0]}</h1>
          </div>
        </div>

        {/* Stats - Smaller, square format */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="aspect-square bg-card border border-border rounded-xl p-3 flex flex-col items-center justify-center">
              <Icon className="w-5 h-5 text-primary mb-2" />
              <p className="text-lg font-bold mb-0.5">{value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions - 2x2 Grid with larger icons */}
        <div className="mb-8">
          <h3 className="text-base font-semibold mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ icon: Icon, label, color, onClick, pro, iconSize }) => (
              <button 
                key={label} 
                onClick={onClick} 
                className="action-card bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-3 hover:border-primary hover:shadow-md transition-all relative group"
              >
                <div className={`${color} w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  <Icon className={`${iconSize} text-white`} />
                </div>
                <span className="text-xs font-medium text-center">{label}</span>
                {pro && user?.subscription.tier === 'free' && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 gradient-pro text-[9px] font-bold rounded-full">PRO</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* My Events with Bookmarked Badge */}
        {myEvents.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">My Events</h2>
              <button 
                className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                onClick={() => navigate('/my-events')}
              >
                See All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {/* Horizontal Carousel */}
            <div className="events-carousel-container relative overflow-hidden">
              <div 
                ref={eventsCarouselRef}
                className="events-carousel"
              >
                <div 
                  className="carousel-track transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
                >
                  {Array.from({ length: carouselSlides }).map((_, slideIndex) => (
                    <div key={slideIndex} className="carousel-slide min-w-full px-1">
                      <div className="grid grid-cols-2 gap-3">
                        {getEventsForSlide(slideIndex).map((event) => {
                          const isBookmarked = user?.bookmarkedEvents?.includes(event.id);
                          const isUserCreated = event.organizerId === user?.id;
                          
                          return (
                            <div 
                              key={event.id} 
                              className="event-card-featured bg-card border border-border rounded-xl overflow-hidden relative group cursor-pointer hover:border-primary transition-all"
                              onClick={() => navigate(`/event/${event.id}`)}
                            >
                              {/* Event Image */}
                              <div 
                                className="event-card-image h-32 w-full relative"
                                style={{ backgroundImage: `url(${event.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                              >
                                {/* Bookmark Badge */}
                                {(isBookmarked || isUserCreated) && (
                                  <div className="absolute top-2 right-2 z-10">
                                    <div className="flex flex-col gap-1">
                                      {isBookmarked && (
                                        <div className="w-8 h-8 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center">
                                          <BookmarkCheck className="w-4 h-4 text-accent-gold" />
                                        </div>
                                      )}
                                      {isUserCreated && (
                                        <div className="px-2 py-1 bg-primary/90 backdrop-blur-sm text-white text-xs font-bold rounded-full">
                                          YOURS
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Attendee Count */}
                                <div className="attendee-count absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full text-white text-xs flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span>{event.attendees}</span>
                                </div>
                              </div>
                              
                              {/* Event Content */}
                              <div className="event-card-content p-3">
                                <div className="flex items-start justify-between mb-1">
                                  <h3 className="font-semibold text-sm truncate">{event.name}</h3>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {event.price === 0 ? 'FREE' : `N$${event.price}`}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 mb-2">
                                  <span 
                                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                    style={{ 
                                      backgroundColor: `${event.customTheme || '#8B5CF6'}20`,
                                      color: event.customTheme || '#8B5CF6'
                                    }}
                                  >
                                    {event.category}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span className="truncate">{event.location}</span>
                                  <span>{event.date}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Navigation Arrows */}
              {carouselSlides > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    disabled={carouselIndex === 0}
                    className={cn(
                      "carousel-nav prev absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center border border-white/20 text-white transition-all",
                      carouselIndex === 0 && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextSlide}
                    disabled={carouselIndex === carouselSlides - 1}
                    className={cn(
                      "carousel-nav next absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center border border-white/20 text-white transition-all",
                      carouselIndex === carouselSlides - 1 && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
              
              {/* Dots Indicator */}
              {carouselSlides > 1 && (
                <div className="carousel-dots flex justify-center gap-2 mt-4">
                  {Array.from({ length: carouselSlides }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCarouselIndex(index)}
                      className={cn(
                        "dot h-1.5 rounded-full transition-all",
                        index === carouselIndex 
                          ? "bg-primary w-6" 
                          : "bg-border w-1.5 hover:bg-border/60"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Featured Events Carousel */}
        {featuredEvents.length > 0 && (
          <section className="mb-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Featured Events</h2>
              <button 
                onClick={() => navigate('/events')} 
                className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="relative">
              {/* Featured Events Carousel */}
              <div 
                ref={featuredRef} 
                className="flex gap-4 overflow-x-auto no-scrollbar -mx-5 px-5 snap-x snap-mandatory scroll-smooth"
              >
                {featuredEvents.map((event) => (
                  <div key={event.id} className="snap-center flex-shrink-0 w-[calc(100vw-40px)]">
                    <div className="event-card-featured bg-card border border-border rounded-2xl overflow-hidden relative group cursor-pointer hover:border-primary transition-all">
                      {/* Event Image */}
                      <div 
                        className="event-card-image h-48 w-full relative"
                        style={{ backgroundImage: `url(${event.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                      >
                        {/* Featured Badge */}
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1.5 gradient-pro text-white text-xs font-bold rounded-full backdrop-blur-sm">
                            FEATURED
                          </span>
                        </div>
                        
                        {/* Attendee Count */}
                        <div className="attendee-count absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>{event.attendees} attending</span>
                        </div>
                        
                        {/* Price Badge */}
                        <div className="absolute bottom-3 right-3">
                          <span className="px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white text-sm font-bold rounded-full">
                            {event.price === 0 ? 'FREE' : `N$${event.price}`}
                          </span>
                        </div>
                      </div>
                      
                      {/* Event Content */}
                      <div className="event-card-content p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-lg">{event.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span 
                              className="text-xs px-3 py-1 rounded-full font-medium"
                              style={{ 
                                backgroundColor: `${event.customTheme || '#8B5CF6'}20`,
                                color: event.customTheme || '#8B5CF6'
                              }}
                            >
                              {event.category}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">{event.date}</span>
                          </div>
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
            </div>
          </section>
        )}
      </div>

      <BottomNav />

      <CheckInModal isOpen={showCheckIn} onClose={() => setShowCheckIn(false)} />
      <TicketsModal isOpen={showTickets} onClose={() => setShowTickets(false)} />
      <EventWizardModal isOpen={showEventWizard} onClose={() => setShowEventWizard(false)} />
      <SubscriptionModal isOpen={showSubscription} onClose={() => setShowSubscription(false)} />
    </div>
  );
}
