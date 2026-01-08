import { useNavigate } from 'react-router-dom';
import { Zap, Users, Calendar, MapPin, QrCode, MessageCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ColorBends from '@/components/ColorBends';
import { useApp } from '@/contexts/AppContext';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

// Design Constants from JSON
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
  borderRadius: {
    card: '24px',
    button: '12px',
    roundButton: '50%',
    modalTop: '20px',
    smallPill: '8px'
  },
  typography: {
    h1: {
      size: '28px',
      weight: 'bold'
    },
    h2: {
      size: '24px',
      weight: 'semibold'
    },
    body: {
      size: '14px',
      weight: 'normal'
    },
    small: {
      size: '13px',
      weight: 'medium'
    },
    caption: {
      size: '13px',
      weight: 'semibold',
      transform: 'uppercase',
      tracking: '0.05em'
    }
  },
  spacing: {
    default: '16px',
    buttonGap: '12px'
  }
};

export default function Landing() {
  const navigate = useNavigate();
  const { events } = useApp();
  const { scrollDirection, scrollY } = useScrollDirection();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Get only 4 featured events
  const featuredEvents = events.filter(e => e.isFeatured).slice(0, 4);
  const isHeaderSolid = scrollY > 50;

  // Features in grid format
  const features = [
    { icon: Calendar, label: 'Discover', description: 'Find events happening near you' },
    { icon: Users, label: 'Match', description: 'Connect with people at events' },
    { icon: MessageCircle, label: 'Connect', description: 'Chat and plan together' },
    { icon: MapPin, label: 'Nearby', description: 'See who\'s going and what\'s happening' },
    { icon: QrCode, label: 'Instant Check-in', description: 'Scan to check in instantly' },
  ];

  // Auto-play carousel
  useEffect(() => {
    if (isAutoPlaying && featuredEvents.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % Math.min(3, featuredEvents.length));
      }, 3000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlaying, featuredEvents.length]);

  // Handle manual slide change
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      setTimeout(() => setIsAutoPlaying(true), 5000);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.min(3, featuredEvents.length));
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      setTimeout(() => setIsAutoPlaying(true), 5000);
    }
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.min(3, featuredEvents.length)) % Math.min(3, featuredEvents.length));
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      setTimeout(() => setIsAutoPlaying(true), 5000);
    }
  };

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
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-16 pt-safe">
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-xl gradient-pro flex items-center justify-center"
              style={{ borderRadius: DESIGN.borderRadius.card }}
            >
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span 
              className="text-xl font-extrabold"
              style={{ color: DESIGN.colors.textPrimary }}
            >
              Amps
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/auth?mode=login')}
              className="text-white/80 hover:text-white hover:bg-white/10"
              size="sm"
              style={{
                fontSize: DESIGN.typography.body.size,
                color: DESIGN.colors.textSecondary
              }}
            >
              Log In
            </Button>
            <Button
              onClick={() => navigate('/auth')}
              size="sm"
              className="gradient-pro text-white font-semibold"
              style={{
                fontSize: DESIGN.typography.body.size,
                background: DESIGN.colors.primary,
                borderRadius: DESIGN.borderRadius.button
              }}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-[85vh] flex flex-col items-center justify-center px-4 pt-12 pb-8">
          <div className="text-center max-w-2xl mx-auto px-4">
            <h1 
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-4 tracking-tight"
              style={{ color: DESIGN.colors.textPrimary }}
            >
              Real events.
              <br />
              <span className="gradient-text">Real connections.</span>
            </h1>
            <p 
              className="text-white/70 text-base sm:text-lg md:text-xl mb-8 leading-relaxed max-w-xl mx-auto"
              style={{ color: DESIGN.colors.textSecondary }}
            >
              Discover events near you. Meet people. Connect instantly.
            </p>

            {/* CTA Buttons */}
            <div className="space-y-3 mb-8 max-w-sm mx-auto">
              <Button
                onClick={() => navigate('/auth')}
                className="w-full h-12 text-base font-semibold gradient-pro glow-purple hover:opacity-90 transition-all"
                style={{
                  borderRadius: DESIGN.borderRadius.button,
                  background: DESIGN.colors.primary
                }}
              >
                Get Started
              </Button>
              <Button
                onClick={() => navigate('/auth?mode=login')}
                variant="outline"
                className="w-full h-12 text-base font-semibold border-white/30 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 hover:border-primary transition-all"
                style={{
                  borderRadius: DESIGN.borderRadius.button,
                  color: DESIGN.colors.textPrimary,
                  borderColor: `${DESIGN.colors.textSecondary}30`
                }}
              >
                I already have an account
              </Button>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce">
            <div 
              className="w-6 h-10 rounded-full border-2 flex items-start justify-center p-2"
              style={{ borderColor: `${DESIGN.colors.textSecondary}30` }}
            >
              <div 
                className="w-1.5 h-3 rounded-full"
                style={{ background: `${DESIGN.colors.textSecondary}50` }}
              />
            </div>
          </div>
        </section>

        {/* How Amps Works - Grid format */}
        <section className="py-10 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 
              className="text-2xl sm:text-3xl font-bold text-center mb-6"
              style={{ color: DESIGN.colors.textPrimary }}
            >
              How Amps Works
            </h2>
            
            {/* Grid layout for features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {features.map(({ icon: Icon, label, description }, index) => (
                <div
                  key={label}
                  className={cn(
                    "glass-card p-4 flex flex-col items-center gap-3 hover:border-primary transition-all text-center bg-white/5 backdrop-blur-xl border border-white/10",
                    index === 4 ? "sm:col-span-2 lg:col-span-1 lg:col-start-3" : ""
                  )}
                  style={{ 
                    borderRadius: DESIGN.borderRadius.card,
                    borderColor: `${DESIGN.colors.textSecondary}10`
                  }}
                >
                  <div 
                    className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center"
                    style={{ borderRadius: DESIGN.borderRadius.card }}
                  >
                    <Icon className="w-6 h-6" style={{ color: DESIGN.colors.primary }} />
                  </div>
                  <span 
                    className="text-sm font-bold"
                    style={{ color: DESIGN.colors.textPrimary }}
                  >
                    {label}
                  </span>
                  <span 
                    className="text-xs text-white/60 leading-relaxed"
                    style={{ color: DESIGN.colors.textSecondary }}
                  >
                    {description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Events - Carousel format */}
        {featuredEvents.length > 0 && (
          <section className="py-12 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
                <div className="mb-4 sm:mb-0">
                  <h2 
                    className="text-2xl font-bold"
                    style={{ color: DESIGN.colors.textPrimary }}
                  >
                    Featured Events
                  </h2>
                  <p 
                    className="text-white/60 mt-1"
                    style={{ 
                      color: DESIGN.colors.textSecondary,
                      fontSize: DESIGN.typography.body.size
                    }}
                  >
                    Discover what's happening
                  </p>
                </div>
                <button 
                  onClick={() => navigate('/events')}
                  className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
                  style={{ 
                    color: DESIGN.colors.primary,
                    fontSize: DESIGN.typography.body.size
                  }}
                >
                  See All <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Carousel Container */}
              <div 
                ref={carouselRef}
                className="relative overflow-hidden"
                style={{ borderRadius: DESIGN.borderRadius.card }}
              >
                {/* Carousel Slides */}
                <div className="relative h-[400px]">
                  {featuredEvents.slice(0, 3).map((event, index) => (
                    <div
                      key={event.id}
                      className={cn(
                        "absolute inset-0 transition-all duration-500 ease-in-out",
                        index === currentSlide 
                          ? "opacity-100 translate-x-0" 
                          : index < currentSlide 
                            ? "opacity-0 -translate-x-full"
                            : "opacity-0 translate-x-full"
                      )}
                    >
                      <button
                        onClick={() => navigate(`/event/${event.id}`)}
                        className="relative w-full h-full overflow-hidden group text-left"
                      >
                        <img
                          src={event.coverImage}
                          alt={event.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
                        
                        {/* Featured Badge */}
                        <div className="absolute top-4 left-4">
                          <span 
                            className="px-3 py-1.5 text-xs font-semibold rounded-full"
                            style={{ 
                              background: DESIGN.colors.primary,
                              color: DESIGN.colors.background,
                              borderRadius: DESIGN.borderRadius.roundButton,
                              fontSize: DESIGN.typography.small.size
                            }}
                          >
                            Featured
                          </span>
                        </div>
                        
                        {/* Event Info */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 
                            className="text-white font-bold text-xl mb-2 line-clamp-1"
                            style={{ color: DESIGN.colors.textPrimary }}
                          >
                            {event.name}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-white/80 text-sm">
                            <span className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {new Date(event.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {event.location.split(',')[0]}
                            </span>
                            {event.price > 0 && (
                              <span 
                                className="text-white font-semibold"
                                style={{ color: DESIGN.colors.textPrimary }}
                              >
                                N${event.price}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Carousel Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={prevSlide}
                    className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-all"
                    style={{ 
                      borderRadius: DESIGN.borderRadius.roundButton,
                      borderColor: `${DESIGN.colors.textSecondary}20`
                    }}
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>

                  {/* Dots Navigation */}
                  <div className="flex items-center gap-2 mx-2">
                    {featuredEvents.slice(0, 3).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all duration-300",
                          index === currentSlide
                            ? "bg-primary w-4"
                            : "bg-white/40 hover:bg-white/60"
                        )}
                        aria-label={`Go to slide ${index + 1}`}
                        style={{ borderRadius: DESIGN.borderRadius.roundButton }}
                      />
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={nextSlide}
                    className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-all"
                    style={{ 
                      borderRadius: DESIGN.borderRadius.roundButton,
                      borderColor: `${DESIGN.colors.textSecondary}20`
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Footer CTA */}
        <section className="py-12 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 
              className="text-2xl font-bold mb-4"
              style={{ color: DESIGN.colors.textPrimary }}
            >
              Ready to connect?
            </h2>
            <p 
              className="text-white/60 mb-6"
              style={{ 
                color: DESIGN.colors.textSecondary,
                fontSize: DESIGN.typography.body.size
              }}
            >
              Join 10,000+ people connecting at events
            </p>
            <Button
              onClick={() => navigate('/auth')}
              className="h-12 px-8 text-base font-semibold gradient-pro glow-purple"
              style={{
                borderRadius: DESIGN.borderRadius.button,
                background: DESIGN.colors.primary
              }}
            >
              Get Started Free
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-white/10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div 
                className="w-8 h-8 rounded-lg gradient-pro flex items-center justify-center"
                style={{ borderRadius: DESIGN.borderRadius.button }}
              >
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span 
                className="text-lg font-bold"
                style={{ color: DESIGN.colors.textPrimary }}
              >
                Amps
              </span>
            </div>
            <p 
              className="text-center text-xs mb-4"
              style={{ color: `${DESIGN.colors.textSecondary}40` }}
            >
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
            <p 
              className="text-center text-xs"
              style={{ color: `${DESIGN.colors.textSecondary}30` }}
            >
              © 2025 Amps. All rights reserved. Made with ❤️ in Namibia
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
