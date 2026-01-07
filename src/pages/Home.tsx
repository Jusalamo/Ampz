import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Map, Plus, Ticket, Calendar, Users, Heart, ChevronRight, ChevronLeft, Bell, Zap, Bookmark, Star, Settings } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { CheckInModal } from '@/components/modals/CheckInModal';
import { TicketsModal } from '@/components/modals/TicketsModal';
import { EventWizardModal } from '@/components/modals/EventWizardModal';
import { SubscriptionModal } from '@/components/modals/SubscriptionModal';
import { NotificationsDropdown } from '@/components/modals/NotificationsDropdown';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Design Constants
const DESIGN = {
  colors: {
    primary: '#C4B5FD',
    lavenderLight: '#E9D5FF',
    accentPink: '#FFB8E6',
    background: '#1A1A1A',
    card: '#2D2D2D',
    textPrimary: '#FFFFFF',
    textSecondary: '#B8B8B8'
  },
  spacing: {
    default: '16px',
    cardPadding: '16px',
    buttonGap: '12px',
    sectionSpacing: '24px'
  },
  borderRadius: {
    card: '24px',
    button: '12px',
    roundButton: '50%',
    smallPill: '8px'
  }
};

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
      const cardWidth = (container.offsetWidth - 12) / 2;
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
      color: 'bg-purple-500', 
      onClick: () => setShowCheckIn(true),
      pro: false
    },
    { 
      icon: Plus, 
      label: 'Create Event', 
      color: 'bg-pink-500', 
      onClick: handleCreateEvent, 
      pro: !isProUser
    },
    { 
      icon: Settings, 
      label: 'Manage Events', 
      color: 'bg-orange-500', 
      onClick: handleManageEvents,
      pro: !isProUser
    },
    { 
      icon: Ticket, 
      label: 'Tickets', 
      color: 'bg-green-500', 
      onClick: () => setShowTickets(true),
      pro: false
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
    <div 
      className="min-h-screen pb-20"
      style={{ background: DESIGN.colors.background, color: DESIGN.colors.textPrimary }}
    >
      {/* Header */}
      <header 
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-transform duration-300 backdrop-blur-xl',
          isHeaderHidden ? '-translate-y-full' : 'translate-y-0'
        )}
        style={{ 
          background: `${DESIGN.colors.background}95`,
          borderBottom: `1px solid ${DESIGN.colors.textSecondary}20`
        }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: DESIGN.colors.primary }}
              >
                <Zap className="w-4 h-4" style={{ color: DESIGN.colors.background }} />
              </div>
              <span className="text-xl font-bold">Ampz</span>
            </div>
            <div className="flex items-center gap-3">
              {user?.subscription?.tier !== 'free' && (
                <span 
                  className="px-3 py-1 text-xs font-bold rounded-full uppercase"
                  style={{ 
                    background: DESIGN.colors.primary,
                    color: DESIGN.colors.background
                  }}
                >
                  {user?.subscription?.tier}
                </span>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                  style={{ 
                    background: DESIGN.colors.card,
                    border: `1px solid ${DESIGN.colors.textSecondary}20`
                  }}
                >
                  <Bell className="w-5 h-5" style={{ color: DESIGN.colors.textPrimary }} />
                  {unreadNotificationsCount > 0 && (
                    <span 
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
                      style={{ background: '#EF4444', color: '#FFFFFF' }}
                    >
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
            <div 
              className="w-12 h-12 rounded-full overflow-hidden border-2"
              style={{ borderColor: DESIGN.colors.primary }}
            >
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
              <p className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>
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
          {stats.map(({ icon: Icon, value, label, color, bgColor }) => (
            <div 
              key={label} 
              className="rounded-xl p-3 text-center"
              style={{ 
                background: DESIGN.colors.card,
                border: `1px solid ${DESIGN.colors.textSecondary}20`,
                borderRadius: DESIGN.borderRadius.card
              }}
            >
              <Icon className={cn("w-5 h-5 mx-auto mb-1", color)} />
              <p className="text-lg font-bold" style={{ color: DESIGN.colors.textPrimary }}>
                {value}
              </p>
              <p className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Quick Actions - 2x2 Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ icon: Icon, label, color, onClick, pro }) => (
              <button 
                key={label} 
                onClick={onClick}
                className="rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all relative group active:scale-95"
                style={{ 
                  background: DESIGN.colors.card,
                  border: `1px solid ${DESIGN.colors.textSecondary}20`,
                  borderRadius: DESIGN.borderRadius.card
                }}
              >
                <div 
                  className={cn("w-12 h-12 rounded-xl flex items-center justify-center", color)}
                  style={{ borderRadius: DESIGN.borderRadius.card }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium" style={{ color: DESIGN.colors.textPrimary }}>
                  {label}
                </span>
                {pro && (
                  <span 
                    className="absolute top-2 right-2 px-1.5 py-0.5 text-xs font-bold rounded"
                    style={{ 
                      background: DESIGN.colors.primary,
                      color: DESIGN.colors.background
                    }}
                  >
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
            className="w-full text-white rounded-xl p-4 flex items-center justify-center gap-3 transition-all active:scale-98"
            style={{ 
              background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              border: '1px solid #1E40AF',
              borderRadius: DESIGN.borderRadius.card
            }}
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
                <Bookmark className="w-5 h-5" style={{ color: DESIGN.colors.primary }} />
                My Events
              </h2>
              <div className="flex items-center gap-2">
                {createdEvents.length > 0 && isProUser && (
                  <button 
                    onClick={() => navigate('/event-manager')}
                    className="text-sm font-medium flex items-center gap-1 hover:underline"
                    style={{ color: DESIGN.colors.primary }}
                  >
                    <Settings className="w-4 h-4" />
                    Manage
                  </button>
                )}
                <button 
                  onClick={() => navigate('/events')}
                  className="text-sm font-medium flex items-center gap-1 hover:underline"
                  style={{ color: DESIGN.colors.primary }}
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
                              className="rounded-xl overflow-hidden transition-all group cursor-pointer active:scale-98"
                              style={{ 
                                background: DESIGN.colors.card,
                                border: `1px solid ${DESIGN.colors.textSecondary}20`,
                                borderRadius: DESIGN.borderRadius.card
                              }}
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
                                    <div 
                                      className="w-8 h-8 rounded-full flex items-center justify-center"
                                      style={{ background: 'rgba(234, 179, 8, 0.9)' }}
                                    >
                                      <Bookmark className="w-4 h-4 text-white fill-white" />
                                    </div>
                                  )}
                                </div>
                                {isCreated && (
                                  <div className="absolute top-2 left-2">
                                    <div 
                                      className="px-2 py-1 rounded text-xs font-bold text-white"
                                      style={{ background: `${DESIGN.colors.primary}90` }}
                                    >
                                      CREATED
                                    </div>
                                  </div>
                                )}
                                <div 
                                  className="absolute bottom-2 left-2 text-white text-xs px-2 py-1 rounded"
                                  style={{ background: 'rgba(0, 0, 0, 0.7)' }}
                                >
                                  {event.attendees || 0} going
                                </div>
                              </div>
                              
                              {/* Event Info */}
                              <div className="p-3">
                                <h3 className="font-semibold text-sm line-clamp-1 mb-1">
                                  {event.name}
                                </h3>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                                    {event.category || 'Event'}
                                  </span>
                                  <span className="text-xs font-semibold">
                                    {event.price === 0 ? 'FREE' : `N$${event.price}`}
                                  </span>
                                </div>
                                <p className="text-xs mt-1 line-clamp-1" style={{ color: DESIGN.colors.textSecondary }}>
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
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10 active:scale-95"
                    style={{ 
                      background: `${DESIGN.colors.background}80`,
                      backdropFilter: 'blur(4px)',
                      border: `1px solid ${DESIGN.colors.textSecondary}20`
                    }}
                    aria-label="Previous events"
                  >
                    <ChevronLeft className="w-4 h-4" style={{ color: DESIGN.colors.textPrimary }} />
                  </button>
                  <button
                    onClick={handleMyEventsNext}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10 active:scale-95"
                    style={{ 
                      background: `${DESIGN.colors.background}80`,
                      backdropFilter: 'blur(4px)',
                      border: `1px solid ${DESIGN.colors.textSecondary}20`
                    }}
                    aria-label="Next events"
                  >
                    <ChevronRight className="w-4 h-4" style={{ color: DESIGN.colors.textPrimary }} />
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
                            ? "w-4" 
                            : "w-1.5"
                        )}
                        style={{
                          backgroundColor: index === myEventsIndex 
                            ? DESIGN.colors.primary 
                            : DESIGN.colors.textSecondary
                        }}
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
                <Bookmark className="w-5 h-5" style={{ color: DESIGN.colors.primary }} />
                My Events
              </h2>
            </div>
            <div 
              className="rounded-xl p-8 text-center border border-dashed"
              style={{ 
                background: DESIGN.colors.card,
                borderColor: DESIGN.colors.textSecondary,
                borderRadius: DESIGN.borderRadius.card
              }}
            >
              <Bookmark className="w-12 h-12 mx-auto mb-3" style={{ color: DESIGN.colors.textSecondary }} />
              <p style={{ color: DESIGN.colors.textSecondary }}>No events yet</p>
              <p className="text-sm mt-1" style={{ color: DESIGN.colors.textSecondary }}>
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
                <Star className="w-5 h-5" style={{ color: '#FBBF24' }} />
                Featured Events
              </h2>
              <button 
                onClick={() => navigate('/events')}
                className="text-sm font-medium flex items-center gap-1 hover:underline"
                style={{ color: DESIGN.colors.primary }}
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
                      className="rounded-xl overflow-hidden transition-all cursor-pointer active:scale-98"
                      style={{ 
                        background: DESIGN.colors.card,
                        border: `1px solid ${DESIGN.colors.textSecondary}20`,
                        borderRadius: DESIGN.borderRadius.card
                      }}
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
                          <div 
                            className="px-3 py-1 rounded-full text-xs font-bold text-white"
                            style={{ background: `${DESIGN.colors.primary}90` }}
                          >
                            FEATURED
                          </div>
                        </div>
                        <div 
                          className="absolute bottom-3 left-3 text-white text-sm px-3 py-1 rounded"
                          style={{ background: 'rgba(0, 0, 0, 0.7)' }}
                        >
                          {event.attendees || 0} going
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
                          <span 
                            className="px-2 py-1 text-xs font-medium rounded"
                            style={{ 
                              background: `${DESIGN.colors.primary}10`,
                              color: DESIGN.colors.primary
                            }}
                          >
                            {event.category || 'Event'}
                          </span>
                          <span className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                            {event.date || 'TBA'} • {event.time || 'TBA'}
                          </span>
                        </div>
                        
                        <p className="text-sm line-clamp-2 mb-3" style={{ color: DESIGN.colors.textSecondary }}>
                          {event.description || 'Join this amazing event!'}
                        </p>
                        
                        {/* Location only */}
                        <div className="flex items-center gap-2 pt-3" style={{ borderTop: `1px solid ${DESIGN.colors.textSecondary}20` }}>
                          <Map className="w-4 h-4" style={{ color: DESIGN.colors.textSecondary }} />
                          <span className="text-sm line-clamp-1" style={{ color: DESIGN.colors.textSecondary }}>
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
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10 active:scale-95"
                    style={{ 
                      background: `${DESIGN.colors.background}80`,
                      backdropFilter: 'blur(4px)',
                      border: `1px solid ${DESIGN.colors.textSecondary}20`
                    }}
                    aria-label="Previous featured event"
                  >
                    <ChevronLeft className="w-4 h-4" style={{ color: DESIGN.colors.textPrimary }} />
                  </button>
                  <button
                    onClick={handleFeaturedNext}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10 active:scale-95"
                    style={{ 
                      background: `${DESIGN.colors.background}80`,
                      backdropFilter: 'blur(4px)',
                      border: `1px solid ${DESIGN.colors.textSecondary}20`
                    }}
                    aria-label="Next featured event"
                  >
                    <ChevronRight className="w-4 h-4" style={{ color: DESIGN.colors.textPrimary }} />
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
                            ? "w-4" 
                            : "w-1.5"
                        )}
                        style={{
                          backgroundColor: index === featuredIndex 
                            ? DESIGN.colors.primary 
                            : DESIGN.colors.textSecondary
                        }}
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
                <Star className="w-5 h-5" style={{ color: '#FBBF24' }} />
                Featured Events
              </h2>
            </div>
            <div 
              className="rounded-xl p-8 text-center border border-dashed"
              style={{ 
                background: DESIGN.colors.card,
                borderColor: DESIGN.colors.textSecondary,
                borderRadius: DESIGN.borderRadius.card
              }}
            >
              <Star className="w-12 h-12 mx-auto mb-3" style={{ color: DESIGN.colors.textSecondary }} />
              <p style={{ color: DESIGN.colors.textSecondary }}>No featured events</p>
              <p className="text-sm mt-1" style={{ color: DESIGN.colors.textSecondary }}>
                Check back later for featured events
              </p>
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
