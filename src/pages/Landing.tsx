import { useState, useEffect, useCallback } from 'react';
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
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const featuredEvents = events.filter(e => e.isFeatured).slice(0, 4);
  const isHeaderSolid = scrollY > 50;

  const features = [
    { icon: Calendar, label: 'Discover', description: 'Find events happening near you' },
    { icon: Users, label: 'Match', description: 'Connect with people at events' },
    { icon: MessageCircle, label: 'Connect', description: 'Chat and plan together' },
    { icon: MapPin, label: 'Nearby', description: 'See who\'s going and what\'s happening' },
    { icon: QrCode, label: 'Instant Check-in', description: 'Scan to check in instantly' },
  ];

  // Grid layout for features (1-2-2 pattern)
  const gridFeatures = [
    features.slice(0, 4), // First 4 items in 2x2 grid
    features[4] // Last item centered below
  ];

  // Carousel autoplay
  useEffect(() => {
    if (!isAutoPlaying || featuredEvents.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredEvents.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredEvents.length]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % featuredEvents.length);
  }, [featuredEvents.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length);
  }, [featuredEvents.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

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
        <div className="max-w-app mx-auto flex items-center justify-between px-4 sm:px-5 h-16 pt-safe">
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
      <div className="relative z-10">
        {/* Hero Section - Reduced spacing from navbar */}
        <section className="min-h-[90vh] sm:min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-16 pb-8 sm:pb-12">
          <div className="text-center max-w-[90%] sm:max-w-[400px]">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-4 sm:mb-5 tracking-tight text-white">
              Real events.
              <br />
              <span className="gradient-text">Real connections.</span>
            </h1>
            <p className="text-white/70 text-base sm:text-lg mb-8 sm:mb-10 leading-relaxed">
              Discover events near you. Meet people. Connect instantly.
            </p>

            {/* CTA Buttons */}
            <div className="space-y-3 mb-8 sm:mb-12">
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
        </section>

        {/* How Amps Works - Reduced spacing */}
        <section className="py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-6 sm:mb-8">How Amps Works</h2>
            
            {/* Grid Layout for Features */}
            <div className="max-w-3xl mx-auto">
              {/* First 4 features in 2x2 grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {gridFeatures[0].map(({ icon: Icon, label, description }, index) => (
                  <div
                    key={label}
                    className={cn(
                      'glass-card p-4 sm:p-5 flex flex-col gap-3 hover:border-primary transition-all text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl',
                      index === 0 && 'sm:rounded-tl-2xl',
                      index === 1 && 'sm:rounded-tr-2xl',
                      index === 2 && 'sm:rounded-bl-2xl',
                      index === 3 && 'sm:rounded-br-2xl'
                    )}
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-primary/20 flex items-center justify-center mx-auto">
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                    </div>
                    <span className="text-base sm:text-lg font-bold text-white">{label}</span>
                    <span className="text-xs sm:text-sm text-white/60 leading-relaxed">{description}</span>
                  </div>
                ))}
              </div>
              
              {/* Last feature centered below */}
              {gridFeatures[1] && (
                <div className="flex justify-center">
                  <div className="max-w-md mx-auto w-full">
                    <div className="glass-card p-4 sm:p-5 flex flex-col items-center gap-3 hover:border-primary transition-all text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-primary/20 flex items-center justify-center">
                        <gridFeatures[1].icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                      </div>
                      <span className="text-base sm:text-lg font-bold text-white">{gridFeatures[1].label}</span>
                      <span className="text-xs sm:text-sm text-white/60 leading-relaxed max-w-xs mx-auto">
                        {gridFeatures[1].description}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Featured Events Carousel */}
        {featuredEvents.length > 0 && (
          <section className="py-12 sm:py-16 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Featured Events</h2>
                  <p className="text-white/60 text-sm mt-1">Discover what's happening</p>
                </div>
                <button 
                  onClick={() => navigate('/events')}
                  className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
                >
                  See All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              {/* Carousel Container */}
              <div className="relative">
                {/* Carousel Navigation - Mobile only */}
                {featuredEvents.length > 1 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-all md:hidden"
                      aria-label="Previous slide"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-all md:hidden"
                      aria-label="Next slide"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
                
                {/* Carousel Slides */}
                <div 
                  className="overflow-hidden rounded-2xl"
                  onMouseEnter={() => setIsAutoPlaying(false)}
                  onMouseLeave={() => setIsAutoPlaying(true)}
                >
                  <div className="flex transition-transform duration-500 ease-in-out"
                       style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                    {featuredEvents.map((event, index) => (
                      <div key={event.id} className="w-full flex-shrink-0">
                        <button
                          onClick={() => navigate(`/event/${event.id}`)}
                          className="relative overflow-hidden rounded-2xl aspect-[16/9] sm:aspect-[21/9] w-full group text-left"
                        >
                          <img
                            src={event.coverImage}
                            alt={event.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                          <div className="absolute top-4 left-4">
                            <span className="px-3 py-1.5 bg-primary/90 text-white text-sm font-semibold rounded-full">
                              Featured
                            </span>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                            <h3 className="text-white font-bold text-lg sm:text-2xl mb-2 line-clamp-1">{event.name}</h3>
                            <div className="flex flex-wrap items-center gap-3 text-white/80 text-sm sm:text-base">
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
                                <span className="max-w-[150px] sm:max-w-xs truncate">{event.location.split(',')[0]}</span>
                              </span>
                            </div>
                            {event.description && (
                              <p className="text-white/70 text-sm mt-3 line-clamp-2 hidden sm:block">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Carousel Dots - Always visible */}
                {featuredEvents.length > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    {featuredEvents.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={cn(
                          'w-2 h-2 rounded-full transition-all duration-300',
                          index === currentSlide 
                            ? 'bg-primary w-6' 
                            : 'bg-white/30 hover:bg-white/50'
                        )}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Grid View for Desktop */}
              {featuredEvents.length > 1 && (
                <div className="hidden md:grid md:grid-cols-2 gap-4 mt-8">
                  {featuredEvents.slice(1).map((event) => (
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
              )}
            </div>
          </section>
        )}

        {/* Footer CTA */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 text-center">
          <div className="max-w-app mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Ready to connect?</h2>
            <p className="text-white/60 mb-6 sm:mb-8 text-sm sm:text-base">
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

        {/* Footer - Removed bouncing mouse */}
        <footer className="py-8 sm:py-10 px-4 sm:px-6 border-t border-white/10">
          <div className="max-w-app mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg gradient-pro flex items-center justify-center">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <span className="text-base sm:text-lg font-bold text-white">Amps</span>
            </div>
            <p className="text-center text-xs text-white/40 mb-3 sm:mb-4 px-4">
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
