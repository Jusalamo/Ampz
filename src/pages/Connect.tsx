import { useState } from 'react';
import { X, Heart, RotateCcw, Sparkles } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { SwipeCard } from '@/components/SwipeCard';
import { ConnectionProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

export default function Connect() {
  const { connectionProfiles, user, addMatch, updateUser } = useApp();
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [matchModal, setMatchModal] = useState<ConnectionProfile | null>(null);

  const currentProfiles = connectionProfiles.slice(currentIndex, currentIndex + 2);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      // Check like limit for free users
      if (user?.subscription.tier === 'free' && (user.likesRemaining ?? 0) <= 0) {
        toast({
          title: 'Daily Limit Reached',
          description: 'Upgrade to Pro for unlimited likes!',
          variant: 'destructive',
        });
        return;
      }

      // Decrease likes remaining
      if (user?.subscription.tier === 'free') {
        updateUser({ likesRemaining: (user.likesRemaining ?? 10) - 1 });
      }

      // Simulate match (30% chance)
      const profile = connectionProfiles[currentIndex];
      if (Math.random() > 0.7) {
        addMatch(profile);
        setMatchModal(profile);
      }
    }

    setHistory([...history, currentIndex]);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastIndex = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setCurrentIndex(lastIndex);
  };

  const noMoreProfiles = currentIndex >= connectionProfiles.length;

  return (
    <div className="app-container min-h-screen bg-background pb-nav">
      <div className="px-5 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Connect</h1>
            <p className="text-muted-foreground text-sm">Find your people at events</p>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-brand-pink" />
            <span className="text-sm font-medium">
              {user?.subscription.tier === 'free'
                ? `${user?.likesRemaining ?? 10}/10`
                : '∞'}
            </span>
          </div>
        </div>

        {/* Event Badge */}
        <div className="glass-card p-3 flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl gradient-pro flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Windhoek Jazz Night</p>
            <p className="text-xs text-muted-foreground">342 people checked in</p>
          </div>
        </div>

        {/* Card Stack */}
        <div className="relative h-[450px] flex items-center justify-center mb-6">
          {noMoreProfiles ? (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">That's Everyone!</h3>
              <p className="text-muted-foreground text-sm">
                Check back later for more connections
              </p>
            </div>
          ) : (
            currentProfiles.map((profile, index) => (
              <SwipeCard
                key={profile.id}
                profile={profile}
                onSwipe={handleSwipe}
                isTop={index === 0}
              />
            ))
          )}
        </div>

        {/* Action Buttons */}
        {!noMoreProfiles && (
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={() => handleSwipe('left')}
              className="action-btn w-16 h-16 bg-card border border-border text-brand-red"
            >
              <X className="w-7 h-7" />
            </button>
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="action-btn w-12 h-12 bg-card border border-border text-brand-yellow disabled:opacity-50"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleSwipe('right')}
              className="action-btn w-20 h-20 gradient-pro glow-pink text-foreground"
            >
              <Heart className="w-8 h-8" />
            </button>
          </div>
        )}
      </div>

      {/* Match Modal */}
      <Dialog open={!!matchModal} onOpenChange={() => setMatchModal(null)}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border max-w-[350px] text-center">
          <div className="py-6">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full gradient-pro animate-pulse-glow" />
              <img
                src={matchModal?.photo}
                alt={matchModal?.name}
                className="w-full h-full rounded-full object-cover border-4 border-background relative z-10"
              />
            </div>
            <h2 className="text-2xl font-bold gradient-text mb-2">It's a Match!</h2>
            <p className="text-muted-foreground mb-6">
              You and {matchModal?.name} liked each other
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setMatchModal(null)}
                className="flex-1 py-3 rounded-xl bg-card border border-border font-semibold hover:border-primary transition-all"
              >
                Keep Swiping
              </button>
              <button
                onClick={() => setMatchModal(null)}
                className="flex-1 py-3 rounded-xl gradient-pro font-semibold glow-purple"
              >
                Send Message
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
