import { useNavigate } from 'react-router-dom';
import { Zap, Users, Calendar, MapPin, QrCode, MessageCircle, ChevronRight, Sparkles, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ColorBends from '@/components/ColorBends';
import { useApp } from '@/contexts/AppContext';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

// Design Constants with Purple as Primary
const DESIGN = {
  colors: {
    primary: '#C4B5FD',
    primaryLight: '#E9D5FF',
    primaryDark: '#8B5CF6',
    accentPink: '#FFB8E6',
    background: '#1A1A1A',
    card: '#2D2D2D',
    textPrimary: '#FFFFFF',
    textSecondary: '#B8B8B8',
    gradientPurple: 'linear-gradient(135deg, #C4B5FD 0%, #8B5CF6 100%)'
  },
  borderRadius: {
    card: '24px',
    cardInner: '20px',
    button: '12px',
    roundButton: '50%',
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
    h3: {
      size: '22px',
      weight: 'bold'
    },
    body: {
      size: '14px',
      weight: 'normal'
    },
    small: {
      size: '13px',
      weight: 'medium'
    },
    button: {
      size: '16px',
      weight: 'medium'
    }
  },
  spacing: {
    default: '16px',
    buttonGap: '12px'
  },
  shadows: {
    card: '0 8px 32px rgba(0, 0, 0, 0.4)',
    button: '0 4px 16px rgba(0, 0, 0, 0.3)',
    purpleGlow: '0 4px 16px rgba(196, 181, 253, 0.4)'
  }
};

export default function Landing() {
  const navigate = useNavigate();
  const { events } = useApp();
  const { scrollDirection, scrollY } = useScrollDirection();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const testimonialCarouselRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const testimonialIntervalRef = useRef<NodeJS.Timeout>();
  
  // Testimonial carousel states
  const [isTestimonialPaused, setIsTestimonialPaused] = useState(false);
  const [testimonialPosition, setTestimonialPosition] = useState(0);

  // Get only 4 featured events
  const featuredEvents = events.filter(e => e.isFeatured).slice(0, 4);
  const isHeaderSolid = scrollY > 50;

  // Simplified features array for cleaner layout
  const features = [
    { icon: Calendar, label: 'Discover Events', description: 'Find events tailored to your interests' },
    { icon: Users, label: 'Smart Matching', description: 'Connect with like-minded people' },
    { icon: MessageCircle, label: 'Real-time Chat', description: 'Chat before and during events' },
  ];

  // Testimonials for social proof - duplicated for seamless loop
  const testimonials = [
    {
      text: "Met my best friend at a concert through Amps!",
      author: "Sarah M.",
      role: "Music Lover"
    },
    {
      text: "Found amazing local events I never would have discovered.",
      author: "James T.",
      role: "Community Member"
    },
    {
      text: "The check-in system makes networking so easy.",
      author: "Priya K.",
      role: "Professional"
    },
    {
      text: "Best app for finding people with similar interests.",
      author: "Alex R.",
      role: "Tech Enthusiast"
    },
    {
      text: "Made attending events alone so much less intimidating.",
      author: "Maria L.",
      role: "Event Goer"
    }
  ];

  // Duplicate testimonials for seamless loop
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  // Auto-play event carousel
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

  // Auto-play testimonial carousel
  useEffect(() => {
    if (!isTestimonialPaused) {
      testimonialIntervalRef.current = setInterval(() => {
        setTestimonialPosition(prev => {
          // Reset to start for seamless loop
          if (prev >= 100 * (testimonials.length)) {
            return 0;
          }
          return prev + 0.5; // Adjust speed here (0.5% per interval)
        });
      }, 50); // Update every 50ms for smooth movement
    }

    return () => {
      if (testimonialIntervalRef.current) {
        clearInterval(testimonialIntervalRef.current);
      }
    };
  }, [isTestimonialPaused, testimonials.length]);

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

  const handleTestimonialMouseDown = () => {
    setIsTestimonialPaused(true);
  };

  const handleTestimonialMouseUp = () => {
    setIsTestimonialPaused(false);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-x-hidden">
      {/* Animated ColorBends Background - Purple Theme */}
      <div className="fixed inset-0 z-0">
        <ColorBends
          colors={['#C4B5FD', '#8B5CF6', '#7C3AED']}
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
              className="w-8 h-8 flex items-center justify-center"
              style={{ 
                background: DESIGN.colors.primary,
                borderRadius: DESIGN.borderRadius.card,
                boxShadow: DESIGN.shadows.purpleGlow
              }}
            >
              <Zap className="w-4 h-4" style={{ color: DESIGN.colors.background }} />
            </div>
            <span 
              className="text-xl font-extrabold"
              style={{ color: DESIGN.colors.primary }}
            >
              Amps
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/auth?mode=login')}
              className="hover:bg-white/10"
              size="sm"
              style={{
                fontSize: DESIGN.typography.body.size,
                color: DESIGN.colors.primary,
                borderRadius: DESIGN.borderRadius.button
              }}
            >
              Log In
            </Button>
            <Button
              onClick={() => navigate('/auth')}
              size="sm"
              className="font-semibold"
              style={{
                fontSize: DESIGN.typography.body.size,
                background: DESIGN.colors.primary,
                color: DESIGN.colors.background,
                borderRadius: DESIGN.borderRadius.button,
                boxShadow: DESIGN.shadows.purpleGlow
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
          <div className="text-center max-w-3xl mx-auto px-4">
            <h1 
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight"
              style={{ color: DESIGN.colors.textPrimary }}
            >
              Where events meet
              <br />
              <span style={{ color: DESIGN.colors.primary }}>meaningful connections</span>
            </h1>
            <p 
              className="text-lg sm:text-xl md:text-2xl mb-8 leading-relaxed max-w-2xl mx-auto"
              style={{ color: DESIGN.colors.textSecondary }}
            >
              Discover amazing events and connect with people who share your passions
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 max-w-md mx-auto">
              <Button
                onClick={() => navigate('/auth')}
                className="h-12 px-8 font-semibold transition-all hover:scale-105"
                style={{
                  fontSize: DESIGN.typography.button.size,
                  background: DESIGN.colors.gradientPurple,
                  color: DESIGN.colors.background,
                  borderRadius: DESIGN.borderRadius.button,
                  boxShadow: DESIGN.shadows.purpleGlow
                }}
              >
                Get Started Free
              </Button>
              <Button
                onClick={() => navigate('/auth?mode=login')}
                variant="outline"
                className="h-12 px-8 font-semibold backdrop-blur-sm hover:bg-white/10 transition-all"
                style={{
                  fontSize: DESIGN.typography.button.size,
                  color: DESIGN.colors.primary,
                  borderColor: DESIGN.colors.primary,
                  borderRadius: DESIGN.borderRadius.button
                }}
              >
                Sign In
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold mb-1" style={{ color: DESIGN.colors.primary }}>
                  10K+
                </div>
                <div className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>
                  Active Users
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1" style={{ color: DESIGN.colors.primary }}>
                  500+
                </div>
                <div className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>
                  Events Monthly
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1" style={{ color: DESIGN.colors.primary }}>
                  95%
                </div>
                <div className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>
                  Satisfaction Rate
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Clean 3-column layout */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 
                className="text-3xl sm:text-4xl font-bold mb-4"
                style={{ color: DESIGN.colors.primary }}
              >
                How it works
              </h2>
              <p 
                className="text-lg max-w-2xl mx-auto"
                style={{ color: DESIGN.colors.textSecondary }}
              >
                Simple steps to find events and connect with amazing people
              </p>
            </div>
            
            {/* Clean 3-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map(({ icon: Icon, label, description }, index) => (
                <div
                  key={label}
                  className="p-6 flex flex-col items-center text-center hover:scale-[1.02] transition-all duration-300"
                  style={{ 
                    background: DESIGN.colors.card,
                    borderRadius: DESIGN.borderRadius.card,
                    border: `1px solid ${DESIGN.colors.primary}20`,
                    boxShadow: DESIGN.shadows.card
                  }}
                >
                  <div 
                    className="w-16 h-16 flex items-center justify-center mb-4"
                    style={{ 
                      background: DESIGN.colors.primary,
                      borderRadius: DESIGN.borderRadius.card
                    }}
                  >
                    <Icon className="w-8 h-8" style={{ color: DESIGN.colors.background }} />
                  </div>
                  <h3 
                    className="text-lg font-bold mb-2"
                    style={{ color: DESIGN.colors.textPrimary }}
                  >
                    {label}
                  </h3>
                  <p 
                    className="text-sm leading-relaxed"
                    style={{ color: DESIGN.colors.textSecondary }}
                  >
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Events - Carousel */}
        {featuredEvents.length > 0 && (
          <section className="py-16 px-4 bg-black/30">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 
                  className="text-3xl sm:text-4xl font-bold mb-4"
                  style={{ color: DESIGN.colors.primary }}
                >
                  Popular Events
                </h2>
                <p 
                  className="text-lg max-w-2xl mx-auto"
                  style={{ color: DESIGN.colors.textSecondary }}
                >
                  Check out what's trending in your area
                </p>
              </div>

              {/* Carousel Container */}
              <div 
                ref={carouselRef}
                className="relative overflow-hidden"
                style={{ 
                  borderRadius: DESIGN.borderRadius.card,
                  boxShadow: DESIGN.shadows.card
                }}
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
                            className="px-3 py-1.5 font-semibold"
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
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <h3 
                            className="font-bold text-2xl mb-2 line-clamp-1"
                            style={{ color: DESIGN.colors.textPrimary }}
                          >
                            {event.name}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
                            <span 
                              className="flex items-center gap-2"
                              style={{ color: DESIGN.colors.textSecondary }}
                            >
                              <Calendar className="w-4 h-4" style={{ color: DESIGN.colors.primary }} />
                              {new Date(event.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span 
                              className="flex items-center gap-2"
                              style={{ color: DESIGN.colors.textSecondary }}
                            >
                              <MapPin className="w-4 h-4" style={{ color: DESIGN.colors.primary }} />
                              {event.location.split(',')[0]}
                            </span>
                            {event.price > 0 && (
                              <span 
                                className="font-semibold text-lg"
                                style={{ color: DESIGN.colors.primary }}
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
                    className="w-10 h-10 flex items-center justify-center transition-all hover:scale-110"
                    style={{ 
                      background: DESIGN.colors.primary,
                      color: DESIGN.colors.background,
                      borderRadius: DESIGN.borderRadius.roundButton,
                      boxShadow: DESIGN.shadows.purpleGlow
                    }}
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>

                  {/* Dots Navigation */}
                  <div className="flex items-center gap-2 mx-4">
                    {featuredEvents.slice(0, 3).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all duration-300",
                          index === currentSlide
                            ? "w-4"
                            : "bg-white/40 hover:bg-white/60"
                        )}
                        aria-label={`Go to slide ${index + 1}`}
                        style={{ 
                          borderRadius: DESIGN.borderRadius.roundButton,
                          background: index === currentSlide ? DESIGN.colors.primary : undefined
                        }}
                      />
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={nextSlide}
                    className="w-10 h-10 flex items-center justify-center transition-all hover:scale-110"
                    style={{ 
                      background: DESIGN.colors.primary,
                      color: DESIGN.colors.background,
                      borderRadius: DESIGN.borderRadius.roundButton,
                      boxShadow: DESIGN.shadows.purpleGlow
                    }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Social Proof Section - Continuous Carousel */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 
                className="text-3xl sm:text-4xl font-bold mb-4"
                style={{ color: DESIGN.colors.primary }}
              >
                Loved by thousands
              </h2>
              <p 
                className="text-lg max-w-2xl mx-auto"
                style={{ color: DESIGN.colors.textSecondary }}
              >
                Join our community of event lovers
              </p>
            </div>

            {/* Continuous Testimonial Carousel */}
            <div className="relative overflow-hidden py-8">
              {/* Pause/Play Control */}
              <div className="absolute top-0 right-0 z-20">
                <button
                  onClick={() => setIsTestimonialPaused(!isTestimonialPaused)}
                  className="w-10 h-10 flex items-center justify-center rounded-full"
                  style={{ 
                    background: DESIGN.colors.primary,
                    color: DESIGN.colors.background,
                    boxShadow: DESIGN.shadows.purpleGlow
                  }}
                >
                  {isTestimonialPaused ? (
                    <Play className="w-5 h-5 ml-0.5" />
                  ) : (
                    <Pause className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Carousel Track */}
              <div
                ref={testimonialCarouselRef}
                className="relative"
                style={{
                  transform: `translateX(-${testimonialPosition}%)`,
                  transition: isTestimonialPaused ? 'none' : 'transform 0.1s linear',
                  display: 'flex',
                  gap: '24px'
                }}
                onMouseDown={handleTestimonialMouseDown}
                onMouseUp={handleTestimonialMouseUp}
                onTouchStart={handleTestimonialMouseDown}
                onTouchEnd={handleTestimonialMouseUp}
              >
                {duplicatedTestimonials.map((testimonial, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-[calc(33.333%-16px)] md:w-[calc(25%-18px)] p-6 cursor-pointer select-none"
                    style={{ 
                      background: DESIGN.colors.card,
                      borderRadius: DESIGN.borderRadius.card,
                      border: `1px solid ${DESIGN.colors.primary}20`,
                      boxShadow: DESIGN.shadows.card
                    }}
                    onMouseDown={handleTestimonialMouseDown}
                    onMouseUp={handleTestimonialMouseUp}
                    onTouchStart={handleTestimonialMouseDown}
                    onTouchEnd={handleTestimonialMouseUp}
                  >
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <div 
                          key={i}
                          className="w-4 h-4"
                          style={{ color: DESIGN.colors.primary }}
                        >
                          ★
                        </div>
                      ))}
                    </div>
                    <p 
                      className="mb-4 italic text-base"
                      style={{ color: DESIGN.colors.textPrimary }}
                    >
                      "{testimonial.text}"
                    </p>
                    <div>
                      <div 
                        className="font-bold"
                        style={{ color: DESIGN.colors.textPrimary }}
                      >
                        {testimonial.author}
                      </div>
                      <div 
                        className="text-sm"
                        style={{ color: DESIGN.colors.textSecondary }}
                      >
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Overlay gradients for smooth edges */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
                style={{
                  background: 'linear-gradient(to right, rgba(26, 26, 26, 1), rgba(26, 26, 26, 0))'
                }}
              />
              <div 
                className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
                style={{
                  background: 'linear-gradient(to left, rgba(26, 26, 26, 1), rgba(26, 26, 26, 0))'
                }}
              />
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 px-4 text-center">
          <div 
            className="max-w-4xl mx-auto p-8 rounded-3xl"
            style={{ 
              background: `linear-gradient(135deg, ${DESIGN.colors.primaryDark}20 0%, ${DESIGN.colors.primary}20 100%)`,
              border: `1px solid ${DESIGN.colors.primary}30`,
              boxShadow: DESIGN.shadows.card
            }}
          >
            <h2 
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ color: DESIGN.colors.primary }}
            >
              Start your journey today
            </h2>
            <p 
              className="text-lg mb-8 max-w-2xl mx-auto"
              style={{ color: DESIGN.colors.textSecondary }}
            >
              Join thousands of people discovering events and making meaningful connections
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/auth')}
                className="h-12 px-8 font-semibold transition-all hover:scale-105"
                style={{
                  fontSize: DESIGN.typography.button.size,
                  background: DESIGN.colors.gradientPurple,
                  color: DESIGN.colors.background,
                  borderRadius: DESIGN.borderRadius.button,
                  boxShadow: DESIGN.shadows.purpleGlow
                }}
              >
                Create Free Account
              </Button>
              <Button
                onClick={() => navigate('/events')}
                variant="outline"
                className="h-12 px-8 font-semibold backdrop-blur-sm hover:bg-white/10 transition-all"
                style={{
                  fontSize: DESIGN.typography.button.size,
                  color: DESIGN.colors.primary,
                  borderColor: DESIGN.colors.primary,
                  borderRadius: DESIGN.borderRadius.button
                }}
              >
                Browse Events
              </Button>
            </div>
          </div>
        </section>

        {/* Simplified Footer */}
        <footer 
          className="py-12 px-4"
          style={{ 
            borderTop: `1px solid ${DESIGN.colors.primary}20`,
            background: DESIGN.colors.background
          }}
        >
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div 
                className="w-10 h-10 flex items-center justify-center"
                style={{ 
                  background: DESIGN.colors.primary,
                  borderRadius: DESIGN.borderRadius.button,
                  boxShadow: DESIGN.shadows.purpleGlow
                }}
              >
                <Zap className="w-5 h-5" style={{ color: DESIGN.colors.background }} />
              </div>
              <span 
                className="text-xl font-bold"
                style={{ color: DESIGN.colors.primary }}
              >
                Amps
              </span>
            </div>
            <p 
              className="text-xs"
              style={{ color: `${DESIGN.colors.textSecondary}60` }}
            >
              © 2025 Amps. All rights reserved. Made with ❤️ in Namibia
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
