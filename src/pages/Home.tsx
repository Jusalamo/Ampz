import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Map, Plus, Ticket, Calendar, Users, Heart, ChevronRight, ChevronLeft, Bell, Zap, Settings, BarChart } from 'lucide-react';
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

  const myEvents = events.filter(e => user?.bookmarkedEvents.includes(e.id));
  const featuredEvents = events.filter(e => e.isFeatured);
  const createdEvents = events.filter(e => e.organizerId === user?.id);

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

  const handleCreateEvent = () => {
    if (user?.subscription.tier === 'free') {
      toast({ title: 'Pro Feature', description: 'Upgrade to Pro to create events' });
      setShowSubscription(true);
    } else {
      setShowEventWizard(true);
    }
  };

  const quickActions = [
    { icon: QrCode, label: 'Check In', color: 'bg-purple-500', onClick: () => setShowCheckIn(true) },
    { icon: Map, label: 'View Map', color: 'bg-blue-500', onClick: () => navigate('/events') },
    { icon: Plus, label: 'Create', color: 'bg-pink-500', onClick: handleCreateEvent, pro: true },
    { icon: Ticket, label: 'Tickets', color: 'bg-green-500', onClick: () => setShowTickets(true) },
  ];

  const stats = [
    { icon: Calendar, value: myEvents.length, label: 'Events' },
    { icon: Users, value: user?.subscription.tier === 'free' ? 2 : 12, label: 'Matches' },
    { icon: Heart, value: user?.subscription.tier === 'free' ? user?.likesRemaining ?? 10 : '∞', label: 'Likes Left' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pb-20">
      {/* Header */}
      <header 
        className={cn(
          'sticky top-0 z-40 w-full bg-background/95 backdrop-blur-xl border-b border-border transition-transform duration-300',
          isHeaderHidden ? '-translate-y-full' : 'translate-y-0'
        )}
      >
        <div className="px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Ampz
              </h1>
              <p className="text-xs text-muted-foreground">Event Network</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user?.subscription.tier !== 'free' && (
              <span className="px-3 py-1.5 bg-gradient-to-r from-primary to-primary/70 text-primary-foreground text-xs font-bold rounded-full uppercase tracking-wide">
                {user?.subscription.tier}
              </span>
            )}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-xl bg-card flex items-center justify-center border border-border hover:border-primary hover:bg-card/80 transition-all"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white animate-pulse">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>
              <NotificationsDropdown isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
            </div>
          </div>
        </div>
      </header>

      <main className="px-5 pt-4">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-8 p-4 bg-card rounded-2xl border border-border shadow-sm">
          <div className="relative">
            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-primary/20">
              <img 
                src={user?.profile.profilePhoto} 
                alt={user?.profile.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-background">
              <Zap className="w-3 h-3 text-primary-foreground" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Welcome back</p>
            <h2 className="text-xl font-bold">{user?.profile.name}</h2>
            <p className="text-sm text-muted-foreground">@{user?.profile.username}</p>
          </div>
          <button 
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:border-primary hover:bg-card/80 transition-all"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="bg-card rounded-xl p-4 border border-border hover:border-primary/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-bold mb-1">{value}</p>
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Event Manager Button (For Pro Users) */}
        {user?.subscription.tier !== 'free' && createdEvents.length > 0 && (
          <button
            onClick={() => navigate('/event-manager')}
            className="w-full mb-8 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 hover:border-primary/40 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <BarChart className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Manage Events</p>
                <p className="text-xs text-muted-foreground">{createdEvents.length} active events</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        )}

        {/* Quick Actions Grid - Updated with larger icons */}
        <div className="grid grid-cols-2 gap-3 mb-10">
          {quickActions.map(({ icon: Icon, label, color, onClick, pro }) => (
            <button 
              key={label} 
              onClick={onClick} 
              className="bg-card rounded-xl p-4 border border-border hover:border-primary/40 hover:shadow-md transition-all relative group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" /> {/* Increased icon size */}
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">Tap to {label.toLowerCase()}</p>
                </div>
              </div>
              {pro && user?.subscription.tier === 'free' && (
                <span className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-primary to-primary/70 text-[10px] font-bold text-white rounded-full">
                  PRO
                </span>
              )}
            </button>
          ))}
        </div>

        {/* My Events Section */}
        {myEvents.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">My Events</h2>
                <p className="text-xs text-muted-foreground">Events you're attending</p>
              </div>
              <button 
                onClick={() => navigate('/my-events')}
                className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
              >
                See All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-5 px-5 pb-4">
              {myEvents.map((event) => (
                <div key={event.id} className="flex-shrink-0 w-[280px]">
                  <EventCard 
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
        {featuredEvents.length > 0 && (
          <section className="mb-20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">Featured Events</h2>
                <p className="text-xs text-muted-foreground">Popular events near you</p>
              </div>
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
                className="flex gap-4 overflow-x-auto no-scrollbar -mx-5 px-5 snap-x snap-mandatory scroll-smooth pb-4"
              >
                {featuredEvents.map((event, index) => (
                  <div key={event.id} className="snap-center flex-shrink-0 w-[300px]">
                    <EventCard 
                      event={event} 
                      variant="featured" 
                      onClick={() => navigate(`/event/${event.id}`)}
                      isActive={index === featuredIndex}
                    />
                  </div>
                ))}
              </div>
              
              {/* Navigation Arrows */}
              {featuredEvents.length > 1 && (
                <>
                  <button
                    onClick={() => setFeaturedIndex((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border hover:border-primary hover:bg-background transition-all z-10 shadow-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setFeaturedIndex((prev) => (prev + 1) % featuredEvents.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border hover:border-primary hover:bg-background transition-all z-10 shadow-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
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
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === featuredIndex 
                          ? 'bg-primary w-8' 
                          : 'bg-muted w-2 hover:bg-primary/50'
                      }`}
                    />
                  ))}
                </div>
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
