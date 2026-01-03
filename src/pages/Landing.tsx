import { useNavigate } from 'react-router-dom';
import { Zap, Users, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="app-container min-h-screen bg-background relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/30 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen px-6 py-12">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className="w-12 h-12 rounded-2xl gradient-pro flex items-center justify-center glow-purple">
            <Zap className="w-7 h-7 text-foreground" />
          </div>
          <span className="text-3xl font-extrabold gradient-text">Amps</span>
        </div>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl font-extrabold leading-tight mb-4">
            Connect at
            <br />
            <span className="gradient-text">Live Events</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-[300px] mb-8">
            Meet amazing people at concerts, festivals, and events across Namibia
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-[320px] mb-12">
            {[
              { icon: Calendar, label: 'Discover Events' },
              { icon: Users, label: 'Match & Connect' },
              { icon: MapPin, label: 'Find Nearby' },
              { icon: Zap, label: 'Instant Check-in' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="glass-card p-4 flex flex-col items-center gap-2 hover:border-primary transition-all"
              >
                <Icon className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/auth')}
            className="w-full h-14 text-lg font-semibold gradient-pro glow-purple hover:opacity-90 transition-all"
          >
            Get Started
          </Button>
          <Button
            onClick={() => navigate('/auth?mode=login')}
            variant="outline"
            className="w-full h-14 text-lg font-semibold border-border hover:bg-card hover:border-primary transition-all"
          >
            I have an account
          </Button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
