import { useNavigate } from 'react-router-dom';
import { Zap, Users, Calendar, MapPin, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ColorBends from '@/components/ColorBends';
import { useApp } from '@/contexts/AppContext';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

export default function Landing() {
  const navigate = useNavigate();
  const { events } = useApp();
  const { scrollY } = useScrollDirection();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const [testimonialPosition, setTestimonialPosition] = useState(0);
  const [isTestimonialPaused, setIsTestimonialPaused] = useState(false);
  const testimonialIntervalRef = useRef<NodeJS.Timeout>();

  const featuredEvents = events.filter(e => e.isFeatured).slice(0, 4);
  const isHeaderSolid = scrollY > 50;

  const features = [
    { icon: Calendar, label: 'Discover Events', description: 'Find events tailored to your interests' },
    { icon: Users, label: 'Smart Matching', description: 'Connect with like-minded people' },
    { icon: MessageCircle, label: 'Real-time Chat', description: 'Chat before and during events' },
  ];

  const testimonials = [
    { text: "Met my best friend at a concert through Amps!", author: "Sarah M.", role: "Music Lover" },
    { text: "Found amazing local events I never would have discovered.", author: "James T.", role: "Community Member" },
    { text: "The check-in system makes networking so easy.", author: "Priya K.", role: "Professional" },
    { text: "Best app for finding people with similar interests.", author: "Alex R.", role: "Tech Enthusiast" },
    { text: "Made attending events alone so much less intimidating.", author: "Maria L.", role: "Event Goer" }
  ];

  const duplicatedTestimonials = [...testimonials, ...testimonials];

  useEffect(() => {
    if (isAutoPlaying && featuredEvents.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % Math.min(3, featuredEvents.length));
      }, 3000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAutoPlaying, featuredEvents.length]);

  useEffect(() => {
    if (!isTestimonialPaused) {
      testimonialIntervalRef.current = setInterval(() => {
        setTestimonialPosition(prev => prev >= 100 * testimonials.length ? 0 : prev + 0.3);
      }, 30);
    }
    return () => {
      if (testimonialIntervalRef.current) clearInterval(testimonialIntervalRef.current);
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

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Animated ColorBends Background */}
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
          isHeaderSolid ? 'bg-background/90 backdrop-blur-xl border-b border-border' : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-16 pt-safe">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-ampz-lg bg-primary shadow-glow">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-extrabold text-primary">Amps</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/auth?mode=login')}
              className="hover:bg-muted text-primary"
              size="sm"
            >
              Log In
            </Button>
            <Button
              onClick={() => navigate('/auth')}
              size="sm"
              className="font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
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
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight text-foreground">
              Where events meet
              <br />
              <span className="text-primary">meaningful connections</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-8 leading-relaxed max-w-2xl mx-auto text-muted-foreground">
              Discover amazing events and connect with people who share your passions
            </p>

            <div className="flex justify-center mb-12">
              <Button
                onClick={() => navigate('/auth')}
                className="h-12 px-8 font-semibold transition-all hover:scale-105 gradient-amps text-primary-foreground"
              >
                Get Started Free
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-primary">
                How it works
              </h2>
              <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
                Simple steps to find events and connect with amazing people
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map(({ icon: Icon, label, description }) => (
                <div
                  key={label}
                  className="ampz-card p-6 flex flex-col items-center text-center ampz-interactive"
                >
                  <div className="w-16 h-16 flex items-center justify-center mb-4 bg-primary rounded-ampz-lg">
                    <Icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">{label}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Events */}
        {featuredEvents.length > 0 && (
          <section className="py-16 px-4 bg-background/30">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-primary">Popular Events</h2>
                <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
                  Check out what's trending in your area
                </p>
              </div>

              <div ref={carouselRef} className="relative overflow-hidden rounded-ampz-lg shadow-card">
                <div className="relative h-[400px]">
                  {featuredEvents.slice(0, 3).map((event, index) => (
                    <div
                      key={event.id}
                      className={cn(
                        "absolute inset-0 transition-all duration-500 ease-in-out",
                        index === currentSlide ? "opacity-100 translate-x-0" 
                          : index < currentSlide ? "opacity-0 -translate-x-full"
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
                        
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1.5 font-semibold rounded-full bg-primary text-primary-foreground text-sm">
                            Featured
                          </span>
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <h3 className="font-bold text-2xl mb-2 line-clamp-1 text-foreground">{event.name}</h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4 text-primary" />
                              {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="w-4 h-4 text-primary" />
                              {event.location.split(',')[0]}
                            </span>
                            {event.price > 0 && (
                              <span className="font-semibold text-lg text-primary">N${event.price}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  <button
                    onClick={prevSlide}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-background/80 backdrop-blur hover:bg-background transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 text-foreground" />
                  </button>
                  {featuredEvents.slice(0, 3).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        index === currentSlide ? "bg-primary w-6" : "bg-muted-foreground/50"
                      )}
                    />
                  ))}
                  <button
                    onClick={nextSlide}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-background/80 backdrop-blur hover:bg-background transition-all"
                  >
                    <ChevronRight className="w-5 h-5 text-foreground" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Testimonials */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-primary">What people say</h2>
              <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
                Join thousands of happy users
              </p>
            </div>

            <div 
              className="overflow-hidden"
              onMouseDown={() => setIsTestimonialPaused(true)}
              onMouseUp={() => setIsTestimonialPaused(false)}
              onMouseLeave={() => setIsTestimonialPaused(false)}
            >
              <div 
                className="flex gap-4 transition-transform"
                style={{ transform: `translateX(-${testimonialPosition}%)` }}
              >
                {duplicatedTestimonials.map((testimonial, index) => (
                  <div
                    key={index}
                    className="ampz-card p-6 min-w-[300px] flex-shrink-0"
                  >
                    <p className="text-foreground mb-4 italic">"{testimonial.text}"</p>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
              Ready to discover amazing events?
            </h2>
            <p className="text-lg mb-8 text-muted-foreground">
              Join Amps today and start connecting with people who share your passions.
            </p>
            <Button
              onClick={() => navigate('/auth')}
              className="h-14 px-10 text-lg font-semibold gradient-amps text-primary-foreground hover:scale-105 transition-all"
            >
              Get Started Free
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-border">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 flex items-center justify-center rounded-lg bg-primary">
                <Zap className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="font-bold text-primary">Amps</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Amps. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
