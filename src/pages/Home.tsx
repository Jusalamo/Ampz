import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Map, Plus, Ticket, Calendar, Users, Heart, ChevronRight, ChevronLeft, Bell } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { EventCard } from '@/components/EventCard';
import { CheckInModal } from '@/components/modals/CheckInModal';
import { TicketsModal } from '@/components/modals/TicketsModal';
import { EventWizardModal } from '@/components/modals/EventWizardModal';
import { SubscriptionModal } from '@/components/modals/SubscriptionModal';
import { NotificationsDropdown } from '@/components/modals/NotificationsDropdown';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const navigate = useNavigate();
  const { user, events, unreadNotificationsCount } = useApp();
  const { toast } = useToast();
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showTickets, setShowTickets] = useState(false);
  const [showEventWizard, setShowEventWizard] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const featuredRef = useRef<HTMLDivElement>(null);

  const myEvents = events.filter(e => user?.bookmarkedEvents.includes(e.id));
  const featuredEvents = events.filter(e => e.isFeatured);

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
      const cardWidth = 316; // 300px + 16px gap
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
    { icon: QrCode, label: 'Check In', color: 'bg-brand-purple', onClick: () => setShowCheckIn(true) },
    { icon: Map, label: 'View Map', color: 'bg-brand-blue', onClick: () => navigate('/events') },
    { icon: Plus, label: 'Create Event', color: 'bg-brand-pink', onClick: handleCreateEvent, pro: true },
    { icon: Ticket, label: 'Tickets', color: 'bg-brand-green', onClick: () => setShowTickets(true) },
  ];

  const stats = [
    { icon: Calendar, value: myEvents.length, label: 'Events' },
    { icon: Users, value: user?.subscription.tier === 'free' ? 2 : 12, label: 'Matches' },
    { icon: Heart, value: user?.subscription.tier === 'free' ? user?.likesRemaining ?? 10 : '∞', label: 'Likes Left' },
  ];

  return (
    <div className="app-container min-h-screen bg-background pb-nav">
      <div className="px-5 pt-6 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
              <img src={user?.profile.profilePhoto} alt={user?.profile.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <h1 className="text-xl font-bold">{user?.profile.name?.split(' ')[0]} 👋</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user?.subscription.tier !== 'free' && (
              <span className="px-3 py-1 gradient-pro text-foreground text-xs font-semibold rounded-full uppercase">
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
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-red rounded-full text-[10px] font-bold flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
              <NotificationsDropdown isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="glass-card p-4 text-center">
              <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {quickActions.map(({ icon: Icon, label, color, onClick, pro }) => (
            <button key={label} onClick={onClick} className="glass-card p-3 flex flex-col items-center gap-2 hover:border-primary transition-all relative">
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-foreground" />
              </div>
              <span className="text-xs font-medium">{label}</span>
              {pro && user?.subscription.tier === 'free' && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 gradient-pro text-[10px] font-bold rounded-full">PRO</span>
              )}
            </button>
          ))}
        </div>

        {/* My Events */}
        {myEvents.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">My Events</h2>
              <button className="text-primary text-sm font-medium flex items-center gap-1">See All <ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5">
              {myEvents.map((event) => (
                <EventCard key={event.id} event={event} variant="compact" onClick={() => navigate(`/event/${event.id}`)} />
              ))}
            </div>
          </section>
        )}

        {/* Featured Events */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Featured Events</h2>
            <button onClick={() => navigate('/events')} className="text-primary text-sm font-medium flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <div ref={featuredRef} className="flex gap-4 overflow-x-auto no-scrollbar -mx-5 px-5 snap-x snap-mandatory scroll-smooth">
              {featuredEvents.map((event) => (
                <div key={event.id} className="snap-center flex-shrink-0">
                  <EventCard event={event} variant="featured" onClick={() => navigate(`/event/${event.id}`)} />
                </div>
              ))}
            </div>
            {/* Navigation Arrows */}
            {featuredEvents.length > 1 && (
              <>
                <button
                  onClick={() => setFeaturedIndex((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border hover:border-primary transition-colors z-10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setFeaturedIndex((prev) => (prev + 1) % featuredEvents.length)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border hover:border-primary transition-colors z-10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
            {/* Dots */}
            <div className="flex justify-center gap-2 mt-4">
              {featuredEvents.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setFeaturedIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${index === featuredIndex ? 'bg-primary w-6' : 'bg-muted'}`}
                />
              ))}
            </div>
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
