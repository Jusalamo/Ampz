import { useNavigate } from 'react-router-dom';
import { Zap, Users, Calendar, MapPin, QrCode, MessageCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ColorBends from '@/components/ColorBends';
import { useApp } from '@/contexts/AppContext';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

// Design System Constants
const DESIGN = {
  colors: {
    primary: '#C4B5FD',
    lavenderLight: '#E9D5FF',
    accentPink: '#FFB8E6',
    background: '#1A1A1A',
    card: '#2D2D2D',
    textPrimary: '#FFFFFF',
    textSecondary: '#B8B8B8',
    border: 'rgba(255, 255, 255, 0.1)'
  },
  typography: {
    h1: { size: '56px', weight: 'bold', lineHeight: '1.2' },
    h2: { size: '40px', weight: 'bold', lineHeight: '1.3' },
    h3: { size: '32px', weight: 'bold', lineHeight: '1.3' },
    h4: { size: '24px', weight: 'bold', lineHeight: '1.4' },
    bodyLarge: { size: '18px', weight: 'normal', lineHeight: '1.5' },
    body: { size: '16px', weight: 'normal', lineHeight: '1.4' },
    small: { size: '14px', weight: 'normal', lineHeight: '1.3' },
    caption: { size: '12px', weight: 'medium', lineHeight: '1.2' }
  },
  spacing: {
    screenPadding: '20px',
    sectionGap: '80px',
    elementGap: '16px',
    buttonGap: '12px',
    containerMaxWidth: '1200px'
  },
  borderRadius: {
    large: '24px',
    medium: '16px',
    small: '12px',
    round: '50%'
  },
  heights: {
    header: '64px',
    button: '56px',
    buttonSmall: '44px',
    card: '400px',
    carousel: '500px'
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
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-16 flex items-center',
          isHeaderSolid ? 'bg-black/90 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
        )}
      >
        <div className="w-full max-w-[1200px] mx-auto flex items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-[12px] flex items-center justify-center"
              style={{ 
                background: `linear-gradient(135deg, ${DESIGN.colors.primary} 0%, ${DESIGN.colors.lavenderLight} 100%)`
              }}
            >
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span 
              className="text-xl font-bold"
              style={{ color: DESIGN.colors.textPrimary }}
            >
              Amps
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/auth?mode=login')}
              size="sm"
              className="h-[40px] rounded-[12px]"
              style={{ 
                color: DESIGN.colors.textPrimary,
                borderColor: DESIGN.colors.border
              }}
            >
              Log In
            </Button>
            <Button
              onClick={() => navigate('/auth')}
              size="sm"
              className="h-[40px] rounded-[12px] font-semibold"
              style={{ 
                background: DESIGN.colors.primary,
                color: DESIGN.colors.background
              }}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 pt-16">
        {/* Hero Section */}
        <section className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-5 py-20">
          <div className="w-full max-w-[800px] mx-auto text-center">
            <h1 
              className="mb-6 font-bold leading-[1.1] tracking-tight"
              style={{ 
                fontSize: DESIGN.typography.h1.size,
                color: DESIGN.colors.textPrimary
              }}
            >
              Real events.
              <br />
              <span style={{ color: DESIGN.colors.primary }}>
                Real connections.
              </span>
            </h1>
            <p 
              className="mb-10 leading-relaxed"
              style={{ 
                fontSize: DESIGN.typography.bodyLarge.size,
                color: DESIGN.colors.textSecondary
              }}
            >
              Discover events near you. Meet people. Connect instantly.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 max-w-[400px] mx-auto mb-12">
              <Button
                onClick={() => navigate('/auth')}
                className="h-14 rounded-[12px] font-semibold text-base"
                style={{ 
                  background: DESIGN.colors.primary,
                  color: DESIGN.colors.background
                }}
              >
                Get Started
              </Button>
              <Button
                onClick={() => navigate('/auth?mode=login')}
                variant="outline"
                className="h-14 rounded-[12px] font-semibold text-base"
                style={{ 
                  borderColor: DESIGN.colors.border,
                  color: DESIGN.colors.textPrimary
                }}
              >
                I already have an account
              </Button>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div 
              className="w-6 h-10 rounded-full flex items-start justify-center p-2"
              style={{ 
                border: `2px solid ${DESIGN.colors.textSecondary}40`,
                borderRadius: '9999px'
              }}
            >
              <div 
                className="w-1.5 h-3 rounded-full animate-pulse"
                style={{ background: DESIGN.colors.textSecondary }}
              />
            </div>
          </div>
        </section>

        {/* How Amps Works */}
        <section className="py-20 px-5">
          <div className="w-full max-w-[1200px] mx-auto">
            <h2 
              className="text-center mb-12 font-bold"
              style={{ 
                fontSize: DESIGN.typography.h2.size,
                color: DESIGN.colors.textPrimary
              }}
            >
              How Amps Works
            </h2>
            
            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {features.map(({ icon: Icon, label, description }, index) => (
                <div
                  key={label}
                  className={cn(
                    "p-5 flex flex-col items-center gap-4 text-center transition-all",
                    "bg-white/5 backdrop-blur-xl border border-white/10 rounded-[16px]",
                    "hover:border-primary",
                    index === 4 ? "sm:col-span-2 lg:col-span-1 lg:col-start-3" : ""
                  )}
                >
                  <div 
                    className="w-14 h-14 rounded-[16px] flex items-center justify-center"
                    style={{ background: `${DESIGN.colors.primary}20` }}
                  >
                    <Icon 
                      className="w-7 h-7" 
                      style={{ color: DESIGN.colors.primary }} 
                    />
                  </div>
                  <span 
                    className="font-bold"
                    style={{ 
                      fontSize: DESIGN.typography.small.size,
                      color: DESIGN.colors.textPrimary
                    }}
                  >
                    {label}
                  </span>
                  <span 
                    className="leading-relaxed"
                    style={{ 
                      fontSize: DESIGN.typography.caption.size,
                      color: DESIGN.colors.textSecondary
                    }}
                  >
                    {description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Events */}
        {featuredEvents.length > 0 && (
          <section className="py-20 px-5">
            <div className="w-full max-w-[1200px] mx-auto">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12">
                <div className="mb-6 sm:mb-0">
                  <h2 
                    className="font-bold mb-2"
                    style={{ 
                      fontSize: DESIGN.typography.h3.size,
                      color: DESIGN.colors.textPrimary
                    }}
                  >
                    Featured Events
                  </h2>
                  <p 
                    style={{ 
                      fontSize: DESIGN.typography.small.size,
                      color: DESIGN.colors.textSecondary
                    }}
                  >
                    Discover what's happening
                  </p>
                </div>
                <button 
                  onClick={() => navigate('/events')}
                  className="flex items-center gap-1 hover:underline"
                  style={{ 
                    fontSize: DESIGN.typography.small.size,
                    color: DESIGN.colors.primary
                  }}
                >
                  See All <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Carousel */}
              <div 
                ref={carouselRef}
                className="relative overflow-hidden rounded-[24px]"
              >
                {/* Carousel Slides */}
                <div 
                  className="relative"
                  style={{ height: DESIGN.heights.carousel }}
                >
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
                        <div className="absolute top-6 left-6">
                          <span 
                            className="px-3 py-1.5 text-sm font-semibold rounded-full"
                            style={{ 
                              background: DESIGN.colors.primary,
                              color: DESIGN.colors.background
                            }}
                          >
                            Featured
                          </span>
                        </div>
                        
                        {/* Event Info */}
                        <div className="absolute bottom-0 left-0 right-0 p-8">
                          <h3 
                            className="font-bold mb-3 line-clamp-1"
                            style={{ 
                              fontSize: DESIGN.typography.h3.size,
                              color: DESIGN.colors.textPrimary
                            }}
                          >
                            {event.name}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                            <span 
                              className="flex items-center gap-2"
                              style={{ 
                                fontSize: DESIGN.typography.small.size,
                                color: DESIGN.colors.textSecondary
                              }}
                            >
                              <Calendar className="w-5 h-5" />
                              {new Date(event.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span 
                              className="flex items-center gap-2"
                              style={{ 
                                fontSize: DESIGN.typography.small.size,
                                color: DESIGN.colors.textSecondary
                              }}
                            >
                              <MapPin className="w-5 h-5" />
                              {event.location.split(',')[0]}
                            </span>
                            {event.price > 0 && (
                              <span 
                                className="font-semibold"
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
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={prevSlide}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                    style={{ 
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: `1px solid ${DESIGN.colors.border}`,
                      color: DESIGN.colors.textPrimary
                    }}
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>

                  {/* Dots Navigation */}
                  <div className="flex items-center gap-2 mx-2">
                    {featuredEvents.slice(0, 3).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={cn(
                          "rounded-full transition-all duration-300",
                          "h-2"
                        )}
                        style={{
                          width: index === currentSlide ? '24px' : '8px',
                          background: index === currentSlide 
                            ? DESIGN.colors.primary 
                            : `${DESIGN.colors.textSecondary}60`
                        }}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={nextSlide}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                    style={{ 
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: `1px solid ${DESIGN.colors.border}`,
                      color: DESIGN.colors.textPrimary
                    }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Footer CTA */}
        <section className="py-20 px-5 text-center">
          <div className="w-full max-w-[800px] mx-auto">
            <h2 
              className="font-bold mb-4"
              style={{ 
                fontSize: DESIGN.typography.h2.size,
                color: DESIGN.colors.textPrimary
              }}
            >
              Ready to connect?
            </h2>
            <p 
              className="mb-8"
              style={{ 
                fontSize: DESIGN.typography.body.size,
                color: DESIGN.colors.textSecondary
              }}
            >
              Join 10,000+ people connecting at events
            </p>
            <Button
              onClick={() => navigate('/auth')}
              className="h-14 px-10 rounded-[12px] text-base font-semibold"
              style={{ 
                background: DESIGN.colors.primary,
                color: DESIGN.colors.background
              }}
            >
              Get Started Free
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 px-5 border-t" style={{ borderColor: DESIGN.colors.border }}>
          <div className="w-full max-w-[1200px] mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div 
                className="w-8 h-8 rounded-[12px] flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, ${DESIGN.colors.primary} 0%, ${DESIGN.colors.lavenderLight} 100%)`
                }}
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
              className="text-center mb-4"
              style={{ 
                fontSize: DESIGN.typography.caption.size,
                color: `${DESIGN.colors.textSecondary}60`
              }}
            >
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
            <p 
              className="text-center"
              style={{ 
                fontSize: DESIGN.typography.caption.size,
                color: `${DESIGN.colors.textSecondary}40`
              }}
            >
              © 2025 Amps. All rights reserved. Made with ❤️ in Namibia
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
