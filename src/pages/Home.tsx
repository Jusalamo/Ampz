import { useNavigate } from 'react-router-dom';
import { QrCode, Map, Plus, Ticket, Calendar, Users, Heart, ChevronRight } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { EventCard } from '@/components/EventCard';
import { useEffect, useState } from 'react';

export default function Home() {
  const navigate = useNavigate();
  const { user, events } = useApp();
  const [featuredIndex, setFeaturedIndex] = useState(0);

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

  const quickActions = [
    { icon: QrCode, label: 'Check In', color: 'bg-brand-purple', onClick: () => {} },
    { icon: Map, label: 'View Map', color: 'bg-brand-blue', onClick: () => navigate('/events') },
    { icon: Plus, label: 'Create Event', color: 'bg-brand-pink', onClick: () => {}, pro: true },
    { icon: Ticket, label: 'Tickets', color: 'bg-brand-green', onClick: () => {} },
  ];

  const stats = [
    { icon: Calendar, value: myEvents.length, label: 'Events' },
    { icon: Users, value: user?.subscription.tier === 'free' ? 2 : 12, label: 'Matches' },
    { icon: Heart, value: user?.likesRemaining ?? 10, label: 'Likes Left' },
  ];

  return (
    <div className="app-container min-h-screen bg-background pb-nav">
      <div className="px-5 pt-6 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
              <img
                src={user?.profile.profilePhoto}
                alt={user?.profile.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <h1 className="text-xl font-bold">{user?.profile.name?.split(' ')[0]} 👋</h1>
            </div>
          </div>
          {user?.subscription.tier !== 'free' && (
            <span className="px-3 py-1 gradient-pro text-foreground text-xs font-semibold rounded-full uppercase">
              {user?.subscription.tier}
            </span>
          )}
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
            <button
              key={label}
              onClick={onClick}
              className="glass-card p-3 flex flex-col items-center gap-2 hover:border-primary transition-all relative"
            >
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-foreground" />
              </div>
              <span className="text-xs font-medium">{label}</span>
              {pro && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 gradient-pro text-[10px] font-bold rounded-full">
                  PRO
                </span>
              )}
            </button>
          ))}
        </div>

        {/* My Events */}
        {myEvents.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">My Events</h2>
              <button className="text-primary text-sm font-medium flex items-center gap-1">
                See All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5">
              {myEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant="compact"
                  onClick={() => navigate(`/event/${event.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Featured Events */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Featured Events</h2>
            <button
              onClick={() => navigate('/events')}
              className="text-primary text-sm font-medium flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-5 px-5 snap-x snap-mandatory">
              {featuredEvents.map((event, index) => (
                <div key={event.id} className="snap-center">
                  <EventCard
                    event={event}
                    variant="featured"
                    onClick={() => navigate(`/event/${event.id}`)}
                  />
                </div>
              ))}
            </div>
            {/* Dots */}
            <div className="flex justify-center gap-2 mt-4">
              {featuredEvents.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setFeaturedIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === featuredIndex ? 'bg-primary w-6' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
