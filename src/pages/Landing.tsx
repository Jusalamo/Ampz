import { useNavigate } from 'react-router-dom';
import { Zap, Users, Calendar, MapPin, QrCode, MessageCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ColorBends from '@/components/ColorBends';
import { useApp } from '@/contexts/AppContext';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';

export default function Landing() {
  const navigate = useNavigate();
  const { events } = useApp();
  const { scrollDirection, scrollY } = useScrollDirection();

  const featuredEvents = events.filter(e => e.isFeatured).slice(0, 4);
  const isHeaderSolid = scrollY > 50;

  const features = [
    { icon: Calendar, label: 'Discover', description: 'Find events happening near you' },
    { icon: Users, label: 'Match', description: 'Connect with people at events' },
    { icon: MessageCircle, label: 'Connect', description: 'Chat and plan together' },
    { icon: MapPin, label: 'Nearby', description: 'See who\'s going and what\'s happening' },
    { icon: QrCode, label: 'Instant Check-in', description: 'Scan to check in instantly' },
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-x-hidden">
      {/* Animated ColorBends Background */}
      <div className="fixed inset-0 z-0">
        <ColorBends
          colors={['#8B5CF6', '#A78BFA', '#7C3AED']}
          rotation={30}
          speed={0.15}
          scale={1.2}
          frequency={1.2}
          warpStrength={1.0}
          mouseInfluence={0.5}
          parallax={0.3}
          noise={0.05}
          transparent
        />
      </div>

      {/* Dark overlay for readability */}
      <div className="fixed inset-0 bg-black/50 pointer-events-none z-[1]" />

      {/* Persistent Header */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isHeaderSolid ? 'bg-black/90 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
        )}
      >
        <div className="max-w-app mx-auto flex items-center justify-between px-5 h-16 pt-safe">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-pro flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-white">Amps</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/auth?mode=login')}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              Log In
            </Button>
            <Button
              onClick={() => navigate('/auth')}
              size="sm"
              className="gradient-pro text-white font-semibold"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section - Full Viewport */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-12">
          <div className="text-center max-w-[400px]">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-5 tracking-tight text-white">
              Real events.
              <br />
              <span className="gradient-text">Real connections.</span>
            </h1>
            <p className="text-white/70 text-lg mb-10 leading-relaxed">
              Discover events near you. Meet people. Connect instantly.
            </p>

            {/* CTA Buttons */}
            <div className="space-y-3 mb-12">
              <Button
                onClick={() => navigate('/auth')}
                className="w-full h-14 text-lg font-semibold gradient-pro glow-purple hover:opacity-90 transition-all"
              >
                Get Started
              </Button>
              <Button
                onClick={() => navigate('/auth?mode=login')}
                variant="outline"
                className="w-full h-14 text-lg font-semibold border-white/30 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 hover:border-primary transition-all"
              >
                I already have an account
              </Button>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
              <div className="w-1.5 h-3 rounded-full bg-white/50 animate-pulse" />
            </div>
          </div>
        </section>

        {/* How Amps Works */}
        <section className="py-16 px-6">
          <div className="max-w-app mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">How Amps Works</h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 pb-4 snap-x snap-mandatory">
              {features.map(({ icon: Icon, label, description }) => (
                <div
                  key={label}
                  className="flex-shrink-0 w-[160px] snap-center glass-card p-5 flex flex-col items-center gap-3 hover:border-primary transition-all text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-white">{label}</span>
                  <span className="text-xs text-white/60 leading-relaxed">{description}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Events */}
        {featuredEvents.length > 0 && (
          <section className="py-16 px-6">
            <div className="max-w-app mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Featured Events</h2>
                  <p className="text-white/60 text-sm mt-1">Discover what's happening</p>
                </div>
                <button 
                  onClick={() => navigate('/events')}
                  className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
                >
                  See All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {featuredEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => navigate(`/event/${event.id}`)}
                    className="relative overflow-hidden rounded-2xl aspect-[16/10] group text-left"
                  >
                    <img
                      src={event.coverImage}
                      alt={event.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 bg-primary/90 text-white text-xs font-semibold rounded-full">
                        Featured
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-bold text-lg mb-1 line-clamp-1">{event.name}</h3>
                      <div className="flex items-center gap-3 text-white/80 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.location.split(',')[0]}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Footer CTA */}
        <section className="py-20 px-6 text-center">
          <div className="max-w-app mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to connect?</h2>
            <p className="text-white/60 mb-8">Join 10,000+ people connecting at events</p>
            <Button
              onClick={() => navigate('/auth')}
              className="h-14 px-10 text-lg font-semibold gradient-pro glow-purple"
            >
              Get Started Free
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 px-6 border-t border-white/10">
          <div className="max-w-app mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg gradient-pro flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Amps</span>
            </div>
            <p className="text-center text-xs text-white/40 mb-4">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
            <p className="text-center text-xs text-white/30">
              © 2025 Amps. All rights reserved. Made with ❤️ in Namibia
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
