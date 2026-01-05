import { useNavigate } from 'react-router-dom';
import { Zap, Users, Calendar, MapPin, QrCode, MessageCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ColorBends from '@/components/ColorBends';
import { useApp } from '@/contexts/AppContext';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

export default function Landing() {
  const navigate = useNavigate();
  const { events } = useApp();
  const { scrollDirection, scrollY } = useScrollDirection();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Get only 4 featured events (remove redundant list)
  const featuredEvents = events.filter(e => e.isFeatured).slice(0, 4);
  const isHeaderSolid = scrollY > 50;

  // Features in grid format (2-3-2 for desktop)
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

      {/* Persistent Header - Reduced top padding */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isHeaderSolid ? 'bg-black/90 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 pt-safe">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl gradient-pro flex items-center justify-center">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-white">Amps</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/auth?mode=login')}
              className="text-white/80 hover:text-white hover:bg-white/10 text-sm sm:text-base"
              size="sm"
            >
              Log In
            </Button>
            <Button
              onClick={() => navigate('/auth')}
              size="sm"
              className="gradient-pro text-white font-semibold text-sm sm:text-base"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section - Reduced spacing from top bar and next section */}
        <section className="min-h-[85vh] sm:min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-12 sm:pt-16 pb-8">
          <div className="text-center max-w-2xl mx-auto px-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-4 sm:mb-5 tracking-tight text-white">
              Real events.
              <br />
              <span className="gradient-text">Real connections.</span>
            </h1>
            <p className="text-white/70 text-base sm:text-lg md:text-xl mb-8 sm:mb-10 leading-relaxed max-w-xl mx-auto">
              Discover events near you. Meet people. Connect instantly.
            </p>

            {/* CTA Buttons */}
            <div className="space-y-3 mb-8 sm:mb-12 max-w-sm mx-auto">
              <Button
                onClick={() => navigate('/auth')}
                className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold gradient-pro glow-purple hover:opacity-90 transition-all"
              >
                Get Started
              </Button>
              <Button
                onClick={() => navigate('/auth?mode=login')}
                variant="outline"
                className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold border-white/30 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 hover:border-primary transition-all"
              >
                I already have an account
              </Button>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
              <div className="w-1.5 h-3 rounded-full bg-white/50 animate-pulse" />
            </div>
          </div>
        </section>

        {/* How Amps Works - Grid format with reduced spacing from hero */}
        <section className="py-10 sm:py-12 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-6 sm:mb-8">
              How Amps Works
            </h2>
            
            {/* Grid layout for features - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
              {features.map(({ icon: Icon, label, description }, index) => (
                <div
                  key={label}
                  className={cn(
                    "glass-card p-4 sm:p-5 flex flex-col items-center gap-3 sm:gap-4 hover:border-primary transition-all text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl",
                    // Last item spans across on mobile, centered on desktop
                    index === 4 ? "sm:col-span-2 lg:col-span-1 lg:col-start-3" : ""
                  )}
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-primary/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  </div>
                  <span className="text-sm sm:text-base font-bold text-white">{label}</span>
                  <span className="text-xs sm:text-sm text-white/60 leading-relaxed">{description}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Events - Carousel format with dots */}
        {featuredEvents.length > 0 && (
          <section className="py-12 sm:py-16 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8">
                <div className="mb-4 sm:mb-0">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">Featured Events</h2>
                  <p className="text-white/60 text-sm sm:text-base mt-1">Discover what's happening</p>
                </div>
                <button 
                  onClick={() => navigate('/events')}
                  className="text-primary text-sm sm:text-base font-medium flex items-center gap-1 hover:underline"
                >
                  See All <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Carousel Container */}
              <div 
                ref={carouselRef}
                className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
              >
                {/* Carousel Slides */}
                <div className="relative h-[400px] sm:h-[500px]">
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
                        <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
                          <span className="px-3 py-1.5 bg-primary/90 text-white text-xs sm:text-sm font-semibold rounded-full">
                            Featured
                          </span>
                        </div>
                        
                        {/* Event Info */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
                          <h3 className="text-white font-bold text-xl sm:text-2xl md:text-3xl mb-2 sm:mb-3 line-clamp-1">
                            {event.name}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-white/80 text-sm sm:text-base">
                            <span className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                              {new Date(event.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
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
                <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={prevSlide}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-all"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
                  </button>

                  {/* Dots Navigation */}
                  <div className="flex items-center gap-2 mx-2">
                    {featuredEvents.slice(0, 3).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={cn(
                          "w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300",
                          index === currentSlide
                            ? "bg-primary w-4 sm:w-6"
                            : "bg-white/40 hover:bg-white/60"
                        )}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={nextSlide}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-all"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Footer CTA */}
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to connect?
            </h2>
            <p className="text-white/60 text-base sm:text-lg mb-6 sm:mb-8">
              Join 10,000+ people connecting at events
            </p>
            <Button
              onClick={() => navigate('/auth')}
              className="h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg font-semibold gradient-pro glow-purple"
            >
              Get Started Free
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 sm:py-10 px-4 sm:px-6 border-t border-white/10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
              <div className="w-8 h-8 rounded-lg gradient-pro flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Amps</span>
            </div>
            <p className="text-center text-xs sm:text-sm text-white/40 mb-4">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
            <p className="text-center text-xs sm:text-sm text-white/30">
              © 2025 Amps. All rights reserved. Made with ❤️ in Namibia
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
