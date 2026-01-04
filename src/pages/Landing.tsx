import { useNavigate } from 'react-router-dom';
import { Zap, Users, Calendar, MapPin, QrCode, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ColorBends from '@/components/ColorBends';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    { icon: Calendar, label: 'Discover Events', description: 'Find what\'s happening near you' },
    { icon: Users, label: 'Match & Connect', description: 'Meet like-minded people' },
    { icon: MapPin, label: 'Find Nearby', description: 'Events close to you' },
    { icon: QrCode, label: 'Instant Check-in', description: 'Scan & join instantly' },
  ];

  return (
    <div className="app-container min-h-screen bg-black relative overflow-hidden">
      {/* Animated ColorBends Background */}
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

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen px-6 py-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-pro flex items-center justify-center glow-purple">
              <Zap className="w-5 h-5 text-foreground" />
            </div>
            <span className="text-2xl font-extrabold gradient-text">Amps</span>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/auth?mode=login')}
            className="text-foreground/80 hover:text-foreground"
          >
            Sign In
          </Button>
        </header>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4 tracking-tight">
            Real events.
            <br />
            <span className="gradient-text">Real connections.</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-[320px] mb-10">
            Discover events near you. Meet people. Connect instantly.
          </p>

          {/* CTA Buttons */}
          <div className="w-full max-w-[320px] space-y-3 mb-12">
            <Button
              onClick={() => navigate('/auth')}
              className="w-full h-14 text-lg font-semibold gradient-pro glow-purple hover:opacity-90 transition-all"
            >
              Get Started
            </Button>
            <Button
              onClick={() => navigate('/auth?mode=login')}
              variant="outline"
              className="w-full h-14 text-lg font-semibold border-border/50 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-primary transition-all"
            >
              I already have an account
            </Button>
          </div>

          {/* Feature Cards - Horizontal Scroll */}
          <div className="w-full overflow-x-auto no-scrollbar -mx-6 px-6">
            <div className="flex gap-3 pb-2">
              {features.map(({ icon: Icon, label, description }) => (
                <div
                  key={label}
                  className="flex-shrink-0 w-[140px] glass-card p-4 flex flex-col items-center gap-2 hover:border-primary transition-all text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-xs text-muted-foreground">{description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <MessageCircle className="w-4 h-4" />
            <span>Join 10,000+ people connecting at events</span>
          </div>
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </footer>
      </div>
    </div>
  );
}
