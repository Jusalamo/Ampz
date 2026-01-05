import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Map, Plus, Ticket, Calendar, Users, Heart, ChevronRight, ChevronLeft, Bell, Zap, CalendarDays, UsersRound, HeartPulse, MapPin, Sparkles } from 'lucide-react';
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
  const statsRef = useRef<HTMLDivElement>(null);

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
      const container = featuredRef.current;
      const card = container.querySelector('.snap-center');
      if (card) {
        const cardWidth = card.getBoundingClientRect().width + 16; // 16px for gap
        container.scrollTo({
          left: featuredIndex * cardWidth,
          behavior: 'smooth',
        });
      }
    }
  }, [featuredIndex, featuredEvents.length]);

  // Smooth scrolling fix
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  const handleCreateEvent = () => {
    if (user?.subscription.tier === 'free') {
      toast({ title: 'Pro Feature', description: 'Upgrade to Pro to create events' });
      setShowSubscription(true);
    } else {
      setShowEventWizard(true);
    }
  };

  // Quick Actions in 2x2 grid format
  const quickActions = [
    { 
      icon: QrCode, 
      label: 'Check In', 
      description: 'Scan QR code',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10',
      borderColor: 'border-purple-500/20',
      onClick: () => setShowCheckIn(true) 
    },
    { 
      icon: Map, 
      label: 'View Map', 
      description: 'Explore events',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10',
      borderColor: 'border-blue-500/20',
      onClick: () => navigate('/events') 
    },
    { 
      icon: Plus, 
      label: 'Create Event', 
      description: 'Host your own',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-gradient-to-br from-pink-500/10 to-rose-500/10',
      borderColor: 'border-pink-500/20',
      onClick: handleCreateEvent, 
      pro: true 
    },
    { 
      icon: Ticket, 
      label: 'Tickets', 
      description: 'My passes',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-gradient-to-br from-green-500/10 to-emerald-500/10',
      borderColor: 'border-green-500/20',
      onClick: () => setShowTickets(true) 
    },
  ];

  const stats = [
    { 
      icon: CalendarDays, 
      value: myEvents.length, 
      label: 'Events',
      description: 'Bookmarked',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    { 
      icon: UsersRound, 
      value: user?.subscription.tier === 'free' ? 2 : 12, 
      label: 'Matches',
      description: 'This month',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    { 
      icon: HeartPulse, 
      value: user?.subscription.tier === 'free' ? user?.likesRemaining ?? 10 : '∞', 
      label: 'Likes Left',
      description: 'Daily limit',
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10'
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Instagram-style Header - Hide on scroll down */}
      <header 
        className={cn(
          'fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-50 transition-transform duration-300',
          isHeaderHidden ? '-translate-y-full' : 'translate-y-0'
        )}
        style={{ maxWidth: 'calc(100% - 2rem)' }}
      >
        <div className="bg-background/95 backdrop-blur-xl border-b border-border/50 rounded-b-2xl shadow-lg mx-4">
          <div className="flex items-center justify-between px-5 h-14 pt-safe">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                Ampz
              </span>
            </div>
            <div className="flex items-center gap-3">
              {user?.subscription.tier !== 'free' && (
                <span className="px-2.5 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-lg shadow-purple-500/25">
                  {user?.subscription.tier}
                </span>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-10 h-10 rounded-xl bg-card flex items-center justify-center border border-border hover:border-primary/50 hover:shadow-md transition-all duration-200"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white shadow-lg shadow-red-500/25">
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
      <div className="px-5 pt-20">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-transparent bg-gradient-to-br from-purple-500 to-pink-500 p-0.5">
              <div className="w-full h-full rounded-full overflow-hidden bg-background">
                <img 
                  src={user?.profile.profilePhoto} 
                  alt={user?.profile.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            {user?.subscription.tier !== 'free' && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full border-2 border-background flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">Welcome back</p>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{user?.profile.name?.split(' ')[0]}</h1>
              <span className="text-2xl">👋</span>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div ref={statsRef} className="grid grid-cols-3 gap-4 mb-8">
          {stats.map(({ icon: Icon, value, label, description, color, bgColor }) => (
            <div 
              key={label} 
              className="bg-card rounded-2xl p-4 text-center border border-border hover:border-primary/30 transition-all duration-200 hover:shadow-lg"
            >
              <div className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-2xl font-bold mb-1">{value}</p>
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
          ))}
        </div>

        {/* Pro/Max Event Manager Button */}
        {user?.subscription.tier !== 'free' && user?.createdEvents && user.createdEvents.length > 0 && (
          <button
            onClick={() => navigate('/event-manager')}
            className="w-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-4 flex items-center justify-between mb-8 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 group hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-base">Manage Events</p>
                <p className="text-sm text-muted-foreground">{user.createdEvents.length} events created</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
          </button>
        )}

        {/* Quick Actions Grid - 2x2 */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Quick Actions</h2>
            <div className="text-xs text-muted-foreground px-2 py-1 bg-card rounded-full">
              Tap to explore
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map(({ icon: Icon, label, description, color, bgColor, borderColor, onClick, pro }) => (
              <button 
                key={label} 
                onClick={onClick} 
                className={cn(
                  "bg-card rounded-2xl p-4 flex flex-col items-start gap-3 transition-all duration-300 hover:shadow-xl group relative overflow-hidden",
                  borderColor
                )}
              >
                <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-6 h-6 bg-gradient-to-br ${color} bg-clip-text text-transparent`} />
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold block">{label}</span>
                  <span className="text-xs text-muted-foreground block mt-1">{description}</span>
                </div>
                {pro && user?.subscription.tier === 'free' && (
                  <span className="absolute top-3 right-3 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-[9px] font-bold text-white rounded-full shadow-lg shadow-purple-500/25">
                    PRO
                  </span>
                )}
                <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
              </button>
            ))}
          </div>
        </div>

        {/* My Events */}
        {myEvents.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">My Events</h2>
              <button className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all duration-200">
                See All 
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {myEvents.map((event) => (
                <div key={event.id} className="flex-shrink-0 w-72">
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    variant="compact" 
                    onClick={() => navigate(`/event/${event.id}`)} 
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Featured Events Carousel */}
        <section className="mb-24"> {/* Added more bottom margin */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Featured Events</h2>
            <button 
              onClick={() => navigate('/events')} 
              className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all duration-200"
            >
              View All 
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <div 
              ref={featuredRef} 
              className="flex gap-4 overflow-x-auto scroll-smooth pb-4 -mx-5 px-5"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {featuredEvents.map((event, index) => (
                <div 
                  key={event.id} 
                  className={cn(
                    "snap-center flex-shrink-0 transition-transform duration-300",
                    index === featuredIndex ? "scale-100" : "scale-95"
                  )}
                >
                  <EventCard 
                    event={event} 
                    variant="featured" 
                    onClick={() => navigate(`/event/${event.id}`)} 
                  />
                </div>
              ))}
            </div>
            
            {/* Navigation Arrows */}
            {featuredEvents.length > 1 && (
              <>
                <button
                  onClick={() => setFeaturedIndex((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/90 backdrop-blur-md flex items-center justify-center border border-border hover:border-primary transition-all duration-200 shadow-lg z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setFeaturedIndex((prev) => (prev + 1) % featuredEvents.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/90 backdrop-blur-md flex items-center justify-center border border-border hover:border-primary transition-all duration-200 shadow-lg z-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            
            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {featuredEvents.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setFeaturedIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === featuredIndex 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 w-8' 
                      : 'bg-muted w-2 hover:w-3'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
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
