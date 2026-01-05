import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Users, Calendar, MapPin, QrCode, MessageCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ColorBends from '@/components/ColorBends';
import { useApp } from '@/contexts/AppContext';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';

export default function Landing() {
  const navigate = useNavigate();
  const { events } = useApp();
  const { scrollDirection, scrollY } = useScrollDirection();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoSlideIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const featuredEvents = events.filter(e => e.isFeatured).slice(0, 6);
  const isHeaderSolid = scrollY > 50;

  const features = [
    { icon: Calendar, label: 'Discover', description: 'Find events happening near you' },
    { icon: Users, label: 'Match', description: 'Connect with people at events' },
    { icon: MessageCircle, label: 'Connect', description: 'Chat and plan together' },
    { icon: MapPin, label: 'Nearby', description: 'See who\'s going and what\'s happening' },
    { icon: QrCode, label: 'Instant Check-in', description: 'Scan to check in instantly' },
  ];

  // Auto slide functionality
  const startAutoSlide = useCallback(() => {
    if (autoSlideIntervalRef.current) {
      clearInterval(autoSlideIntervalRef.current);
    }

    autoSlideIntervalRef.current = setInterval(() => {
      if (!isPaused && featuredEvents.length > 0) {
        setCurrentSlide((prev) => (prev + 1) % featuredEvents.length);
      }
    }, 4000);
  }, [featuredEvents.length, isPaused]);

  useEffect(() => {
    if (featuredEvents.length > 0) {
      startAutoSlide();
    }

    return () => {
      if (autoSlideIntervalRef.current) {
        clearInterval(autoSlideIntervalRef.current);
      }
    };
  }, [featuredEvents.length, startAutoSlide]);

  const handleDotClick = (index: number) => {
    setCurrentSlide(index);
    if (autoSlideIntervalRef.current) {
      clearInterval(autoSlideIntervalRef.current);
      startAutoSlide();
    }
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length);
    if (autoSlideIntervalRef.current) {
      clearInterval(autoSlideIntervalRef.current);
      startAutoSlide();
    }
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredEvents.length);
    if (autoSlideIntervalRef.current) {
      clearInterval(autoSlideIntervalRef.current);
      startAutoSlide();
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
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-2',
          isHeaderSolid ? 'bg-black/90 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14 lg:h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl gradient-pro flex items-center justify-center">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-extrabold text-white">Amps</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/auth?mode=login')}
              className="text-white/80 hover:text-white hover:bg-white/10 text-sm sm:text-base"
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
      <div className="relative z-10 pt-16">
        {/* Hero Section - Reduced spacing from header */}
        <section className="min-h-[90vh] sm:min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-8 sm:pt-12 pb-12">
          <div className="text-center max-w-xl lg:max-w-2xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 sm:mb-6 tracking-tight text-white">
              Real events.
              <br />
              <span className="gradient-text">Real connections.</span>
            </h1>
            <p className="text-white/70 text-base sm:text-lg lg:text-xl mb-8 sm:mb-10 leading-relaxed max-w-lg mx-auto">
              Discover events near you. Meet people. Connect instantly.
            </p>

            {/* CTA Buttons */}
            <div className="space-y-3 sm:space-y-4 mb-12 sm:mb-16 max-w-sm mx-auto">
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
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
              <div className="w-1.5 h-3 rounded-full bg-white/50 animate-pulse" />
            </div>
          </div>
        </section>

        {/* How Amps Works - Grid Layout (Reduced spacing) */}
        <section className="py-10 sm:py-12 lg:py-14 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 sm:mb-10 lg:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">How Amps Works</h2>
              <p className="text-white/60 text-sm sm:text-base max-w-xl mx-auto">
                From discovery to connection - all in one seamless experience
              </p>
            </div>
            
            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
              {features.map(({ icon: Icon, label, description }, index) => (
                <div
                  key={label}
                  className={cn(
                    'glass-card p-5 sm:p-6 flex flex-col items-center text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-primary transition-all duration-300',
                    index === 4 ? 'sm:col-span-2 lg:col-span-1 lg:col-start-3' : ''
                  )}
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-3 sm:mb-4">
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  </div>
                  <span className="text-base sm:text-lg font-bold text-white mb-2">{label}</span>
                  <span className="text-xs sm:text-sm text-white/60 leading-relaxed">
                    {description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Events Carousel - Reduced spacing */}
        {featuredEvents.length > 0 && (
          <section className="py-10 sm:py-12 lg:py-14 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 lg:mb-10">
                <div className="text-center sm:text-left mb-4 sm:mb-0">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Featured Events</h2>
                  <p className="text-white/60 text-sm sm:text-base mt-1 sm:mt-2">Discover what's happening near you</p>
                </div>
                <button 
                  onClick={() => navigate('/events')}
                  className="text-primary text-sm sm:text-base font-medium flex items-center gap-1 hover:underline transition-all"
                >
                  See All Events <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Carousel Container */}
              <div 
                ref={carouselRef}
                className="relative"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {/* Carousel Content */}
                <div className="overflow-hidden rounded-2xl">
                  <div 
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                  >
                    {featuredEvents.map((event) => (
                      <div 
                        key={event.id}
                        className="w-full flex-shrink-0"
                      >
                        <button
                          onClick={() => navigate(`/event/${event.id}`)}
                          className="relative overflow-hidden rounded-2xl aspect-[16/9] sm:aspect-[21/9] w-full group text-left"
                        >
                          <img
                            src={event.coverImage}
                            alt={event.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
                          <div className="absolute top-4 left-4">
                            <span className="px-3 py-1.5 bg-primary/90 text-white text-xs sm:text-sm font-semibold rounded-full">
                              Featured
                            </span>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8">
                            <h3 className="text-white font-bold text-lg sm:text-xl lg:text-2xl mb-2 line-clamp-1">{event.name}</h3>
                            <p className="text-white/80 text-sm sm:text-base mb-3 line-clamp-2">{event.description}</p>
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-white/80 text-xs sm:text-sm">
                              <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                                {new Date(event.date).toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                              <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                                {event.location.split(',')[0]}
                              </span>
                              <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                                {event.attendees} attending
                              </span>
                            </div>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Carousel Navigation Buttons */}
                {featuredEvents.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevSlide}
                      className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-black/80 hover:border-primary transition-all"
                      aria-label="Previous slide"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={handleNextSlide}
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-black/80 hover:border-primary transition-all"
                      aria-label="Next slide"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </>
                )}

                {/* Carousel Dots */}
                {featuredEvents.length > 1 && (
                  <div className="flex justify-center gap-2 mt-4 sm:mt-6">
                    {featuredEvents.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handleDotClick(index)}
                        className={cn(
                          'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300',
                          currentSlide === index 
                            ? 'bg-primary w-4 sm:w-6' 
                            : 'bg-white/30 hover:bg-white/50'
                        )}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile View: Grid for smaller screens */}
              <div className="mt-8 sm:hidden">
                <div className="grid grid-cols-1 gap-4">
                  {featuredEvents.slice(0, 2).map((event) => (
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
                        <h3 className="text-white font-bold text-sm mb-1 line-clamp-1">{event.name}</h3>
                        <div className="flex items-center gap-2 text-white/80 text-xs">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location.split(',')[0]}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Footer CTA */}
        <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">Ready to connect?</h2>
            <p className="text-white/60 text-base sm:text-lg mb-6 sm:mb-8 max-w-xl mx-auto">
              Join thousands of people connecting at amazing events in your area
            </p>
            <Button
              onClick={() => navigate('/auth')}
              className="h-12 sm:h-14 px-8 sm:px-12 text-base sm:text-lg font-semibold gradient-pro glow-purple"
            >
              Get Started Free
            </Button>
            <p className="text-white/40 text-xs sm:text-sm mt-4 sm:mt-6">
              No credit card required • Free forever plan available
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 border-t border-white/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-pro flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Amps</span>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
                <button 
                  onClick={() => navigate('/terms')}
                  className="text-white/60 text-sm hover:text-white transition-colors"
                >
                  Terms of Service
                </button>
                <button 
                  onClick={() => navigate('/privacy')}
                  className="text-white/60 text-sm hover:text-white transition-colors"
                >
                  Privacy Policy
                </button>
                <a 
                  href="mailto:support@amps.com"
                  className="text-white/60 text-sm hover:text-white transition-colors"
                >
                  Contact Support
                </a>
              </div>
            </div>
            
            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/10">
              <p className="text-center text-xs text-white/40">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
              <p className="text-center text-xs text-white/30 mt-2">
                © {new Date().getFullYear()} Amps. All rights reserved. Made with ❤️ in Namibia
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
