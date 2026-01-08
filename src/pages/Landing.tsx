import { useNavigate } from 'react-router-dom';
import { Zap, Users, Calendar, MapPin, QrCode, MessageCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ColorBends from '@/components/ColorBends';
import { useApp } from '@/contexts/AppContext';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

// Design System Structure (matching Connect screen's layout system)
const DESIGN = {
  spacing: {
    screenPadding: '20px',
    sectionGap: '80px',
    elementGap: '16px',
    buttonGap: '12px',
    containerMaxWidth: '1200px'
  },
  heights: {
    header: '64px',
    button: '56px',
    buttonSmall: '44px',
    card: '400px',
    carousel: '500px',
    featureIcon: '56px'
  },
  borderRadius: {
    large: '24px',
    medium: '16px',
    small: '12px',
    round: '50%',
    pill: '9999px'
  },
  typography: {
    h1: { size: '56px', weight: 'bold', lineHeight: '1.2' },
    h2: { size: '40px', weight: 'bold', lineHeight: '1.3' },
    h3: { size: '32px', weight: 'bold', lineHeight: '1.3' },
    bodyLarge: { size: '18px', weight: 'normal', lineHeight: '1.5' },
    body: { size: '16px', weight: 'normal', lineHeight: '1.4' },
    small: { size: '14px', weight: 'normal', lineHeight: '1.3' },
    caption: { size: '12px', weight: 'medium', lineHeight: '1.2' }
  },
  layout: {
    headerZIndex: 50,
    backgroundZIndex: 0,
    overlayZIndex: 1,
    contentZIndex: 10
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

  const featuredEvents = events.filter(e => e.isFeatured).slice(0, 4);
  const isHeaderSolid = scrollY > 50;

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
      <div 
        className="fixed inset-0"
        style={{ zIndex: DESIGN.layout.backgroundZIndex }}
      >
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
      <div 
        className="fixed inset-0 bg-black/50 pointer-events-none"
        style={{ zIndex: DESIGN.layout.overlayZIndex }}
      />

      {/* Persistent Header */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 transition-all duration-300 flex items-center',
          isHeaderSolid ? 'bg-black/90 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
        )}
        style={{ 
          height: DESIGN.heights.header,
          zIndex: DESIGN.layout.headerZIndex
        }}
      >
        <div 
          className="w-full mx-auto flex items-center justify-between"
          style={{ 
            maxWidth: DESIGN.spacing.containerMaxWidth,
            padding: `0 ${DESIGN.spacing.screenPadding}`
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="rounded-[12px] flex items-center justify-center gradient-pro"
              style={{ 
                width: '36px',
                height: '36px'
              }}
            >
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span 
              className="font-bold text-white"
              style={{ fontSize: '20px' }}
            >
              Amps
            </span>
          </div>
          <div 
            className="flex items-center"
            style={{ gap: DESIGN.spacing.buttonGap }}
          >
            <Button
              variant="ghost"
              onClick={() => navigate('/auth?mode=login')}
              className="text-white/80 hover:text-white hover:bg-white/10"
              style={{ 
                height: '40px',
                borderRadius: DESIGN.borderRadius.small
              }}
            >
              Log In
            </Button>
            <Button
              onClick={() => navigate('/auth')}
              className="gradient-pro text-white font-semibold"
              style={{ 
                height: '40px',
                borderRadius: DESIGN.borderRadius.small
              }}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ zIndex: DESIGN.layout.contentZIndex }}>
        {/* Hero Section */}
        <section 
          className="flex flex-col items-center justify-center"
          style={{ 
            minHeight: `calc(100vh - ${DESIGN.heights.header})`,
            padding: `80px ${DESIGN.spacing.screenPadding}`
          }}
        >
          <div 
            className="w-full mx-auto text-center"
            style={{ maxWidth: '800px' }}
          >
            <h1 
              className="font-extrabold leading-tight mb-6 tracking-tight text-white"
              style={{ 
                fontSize: DESIGN.typography.h1.size,
                lineHeight: DESIGN.typography.h1.lineHeight
              }}
            >
              Real events.
              <br />
              <span className="gradient-text">Real connections.</span>
            </h1>
            <p 
              className="text-white/70 mb-10 leading-relaxed"
              style={{ 
                fontSize: DESIGN.typography.bodyLarge.size,
                lineHeight: DESIGN.typography.bodyLarge.lineHeight
              }}
            >
              Discover events near you. Meet people. Connect instantly.
            </p>

            {/* CTA Buttons */}
            <div 
              className="flex flex-col max-w-[400px] mx-auto mb-12"
              style={{ gap: DESIGN.spacing.elementGap }}
            >
              <Button
                onClick={() => navigate('/auth')}
                className="font-semibold gradient-pro glow-purple hover:opacity-90 transition-all"
                style={{ 
                  height: DESIGN.heights.button,
                  borderRadius: DESIGN.borderRadius.small,
                  fontSize: DESIGN.typography.body.size
                }}
              >
                Get Started
              </Button>
              <Button
                onClick={() => navigate('/auth?mode=login')}
                variant="outline"
                className="font-semibold border-white/30 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 hover:border-primary transition-all"
                style={{ 
                  height: DESIGN.heights.button,
                  borderRadius: DESIGN.borderRadius.small,
                  fontSize: DESIGN.typography.body.size
                }}
              >
                I already have an account
              </Button>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute animate-bounce" style={{ bottom: '32px' }}>
            <div 
              className="rounded-full border-2 border-white/30 flex items-start justify-center p-2"
              style={{ 
                width: '24px',
                height: '40px'
              }}
            >
              <div className="w-1.5 h-3 rounded-full bg-white/50 animate-pulse" />
            </div>
          </div>
        </section>

        {/* How Amps Works */}
        <section 
          className="px-5"
          style={{ 
            paddingTop: DESIGN.spacing.sectionGap,
            paddingBottom: DESIGN.spacing.sectionGap
          }}
        >
          <div 
            className="mx-auto"
            style={{ maxWidth: DESIGN.spacing.containerMaxWidth }}
          >
            <h2 
              className="font-bold text-white text-center mb-12"
              style={{ 
                fontSize: DESIGN.typography.h2.size,
                lineHeight: DESIGN.typography.h2.lineHeight
              }}
            >
              How Amps Works
            </h2>
            
            {/* Features Grid */}
            <div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
              style={{ gap: DESIGN.spacing.elementGap }}
            >
              {features.map(({ icon: Icon, label, description }, index) => (
                <div
                  key={label}
                  className={cn(
                    "glass-card p-5 flex flex-col items-center text-center hover:border-primary transition-all",
                    "bg-white/5 backdrop-blur-xl border border-white/10",
                    index === 4 ? "sm:col-span-2 lg:col-span-1 lg:col-start-3" : ""
                  )}
                  style={{ 
                    borderRadius: DESIGN.borderRadius.medium,
                    gap: '16px'
                  }}
                >
                  <div 
                    className="rounded-[16px] bg-primary/20 flex items-center justify-center"
                    style={{ 
                      width: DESIGN.heights.featureIcon,
                      height: DESIGN.heights.featureIcon
                    }}
                  >
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <span 
                    className="font-bold text-white"
                    style={{ fontSize: DESIGN.typography.small.size }}
                  >
                    {label}
                  </span>
                  <span 
                    className="text-white/60 leading-relaxed"
                    style={{ fontSize: DESIGN.typography.caption.size }}
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
          <section 
            className="px-5"
            style={{ 
              paddingTop: DESIGN.spacing.sectionGap,
              paddingBottom: DESIGN.spacing.sectionGap
            }}
          >
            <div 
              className="mx-auto"
              style={{ maxWidth: DESIGN.spacing.containerMaxWidth }}
            >
              {/* Section Header */}
              <div 
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12"
                style={{ gap: DESIGN.spacing.elementGap }}
              >
                <div>
                  <h2 
                    className="font-bold text-white mb-2"
                    style={{ fontSize: DESIGN.typography.h3.size }}
                  >
                    Featured Events
                  </h2>
                  <p 
                    className="text-white/60"
                    style={{ fontSize: DESIGN.typography.small.size }}
                  >
                    Discover what's happening
                  </p>
                </div>
                <button 
                  onClick={() => navigate('/events')}
                  className="text-primary font-medium flex items-center gap-1 hover:underline"
                  style={{ fontSize: DESIGN.typography.small.size }}
                >
                  See All <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Carousel */}
              <div 
                ref={carouselRef}
                className="relative overflow-hidden"
                style={{ borderRadius: DESIGN.borderRadius.large }}
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
                            className="px-3 py-1.5 bg-primary/90 text-white font-semibold rounded-full"
                            style={{ fontSize: DESIGN.typography.small.size }}
                          >
                            Featured
                          </span>
                        </div>
                        
                        {/* Event Info */}
                        <div 
                          className="absolute bottom-0 left-0 right-0 p-8"
                          style={{ padding: '32px' }}
                        >
                          <h3 
                            className="text-white font-bold mb-3 line-clamp-1"
                            style={{ fontSize: DESIGN.typography.h3.size }}
                          >
                            {event.name}
                          </h3>
                          <div 
                            className="flex flex-col sm:flex-row sm:items-center"
                            style={{ gap: '24px' }}
                          >
                            <span 
                              className="flex items-center gap-2 text-white/80"
                              style={{ fontSize: DESIGN.typography.small.size }}
                            >
                              <Calendar className="w-5 h-5" />
                              {new Date(event.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span 
                              className="flex items-center gap-2 text-white/80"
                              style={{ fontSize: DESIGN.typography.small.size }}
                            >
                              <MapPin className="w-5 h-5" />
                              {event.location.split(',')[0]}
                            </span>
                            {event.price > 0 && (
                              <span className="text-white font-semibold">
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
                    className="rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-all"
                    style={{ 
                      width: '40px',
                      height: '40px'
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
                          index === currentSlide
                            ? "bg-primary"
                            : "bg-white/40 hover:bg-white/60"
                        )}
                        style={{
                          width: index === currentSlide ? '24px' : '8px',
                          height: '8px'
                        }}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={nextSlide}
                    className="rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-all"
                    style={{ 
                      width: '40px',
                      height: '40px'
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
        <section 
          className="text-center px-5"
          style={{ 
            paddingTop: DESIGN.spacing.sectionGap,
            paddingBottom: DESIGN.spacing.sectionGap
          }}
        >
          <div 
            className="mx-auto"
            style={{ maxWidth: '800px' }}
          >
            <h2 
              className="font-bold text-white mb-4"
              style={{ fontSize: DESIGN.typography.h2.size }}
            >
              Ready to connect?
            </h2>
            <p 
              className="text-white/60 mb-8"
              style={{ fontSize: DESIGN.typography.body.size }}
            >
              Join 10,000+ people connecting at events
            </p>
            <Button
              onClick={() => navigate('/auth')}
              className="font-semibold gradient-pro glow-purple"
              style={{ 
                height: DESIGN.heights.button,
                borderRadius: DESIGN.borderRadius.small,
                fontSize: DESIGN.typography.body.size,
                paddingLeft: '40px',
                paddingRight: '40px'
              }}
            >
              Get Started Free
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer 
          className="border-t border-white/10 px-5"
          style={{ 
            paddingTop: '40px',
            paddingBottom: '40px'
          }}
        >
          <div 
            className="mx-auto"
            style={{ maxWidth: DESIGN.spacing.containerMaxWidth }}
          >
            <div 
              className="flex items-center justify-center gap-3 mb-6"
              style={{ gap: '12px' }}
            >
              <div 
                className="rounded-[12px] gradient-pro flex items-center justify-center"
                style={{ 
                  width: '32px',
                  height: '32px'
                }}
              >
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Amps</span>
            </div>
            <p 
              className="text-center mb-4 text-white/40"
              style={{ fontSize: DESIGN.typography.caption.size }}
            >
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
            <p 
              className="text-center text-white/30"
              style={{ fontSize: DESIGN.typography.caption.size }}
            >
              © 2025 Amps. All rights reserved. Made with ❤️ in Namibia
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
