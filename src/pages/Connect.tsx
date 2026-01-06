import { useState, useCallback } from 'react';
import { X, Heart, RotateCcw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { ConnectionProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const CARD_COLORS = [
  'from-violet-600 to-purple-700',
  'from-pink-500 to-rose-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
];

function ProfileCard({ 
  profile, 
  onSwipe, 
  isTop 
}: { 
  profile: ConnectionProfile; 
  onSwipe: (direction: 'left' | 'right') => void;
  isTop: boolean;
}) {
  const [exitX, setExitX] = useState(0);
  const colorIndex = profile.id.charCodeAt(0) % CARD_COLORS.length;

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (info.offset.x > 100) {
      setExitX(500);
      onSwipe('right');
    } else if (info.offset.x < -100) {
      setExitX(-500);
      onSwipe('left');
    }
  }, [onSwipe]);

  return (
    <motion.div
      className="absolute inset-0"
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 20 }}
      animate={{ 
        scale: isTop ? 1 : 0.95, 
        y: isTop ? 0 : 20,
        rotateZ: 0 
      }}
      exit={{ x: exitX, opacity: 0, rotateZ: exitX > 0 ? 20 : -20 }}
      whileDrag={{ cursor: 'grabbing' }}
      style={{ 
        zIndex: isTop ? 10 : 1,
        transformOrigin: '50% 100%'
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className={`w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br ${CARD_COLORS[colorIndex]} relative`}>
        {/* Gold frame effect */}
        <div className="absolute -inset-1 bg-gradient-to-br from-amber-300/30 to-orange-400/30 rounded-3xl -z-10 rotate-2" />
        
        {/* Profile Photo */}
        <div className="relative h-[65%]">
          <img
            src={profile.photo}
            alt={profile.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>

        {/* Profile Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold">{profile.name}</h2>
            <span className="text-xl opacity-80">{profile.age}</span>
          </div>
          
          {profile.occupation && (
            <p className="text-sm opacity-80 mb-2">{profile.occupation}</p>
          )}
          
          <p className="text-sm opacity-90 mb-3 line-clamp-2">{profile.bio}</p>
          
          <div className="flex flex-wrap gap-2">
            {profile.interests.slice(0, 4).map((interest) => (
              <span
                key={interest}
                className="px-3 py-1 bg-white/20 backdrop-blur-sm text-xs font-medium rounded-full"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Connect() {
  const { connectionProfiles, user, addMatch, updateUser } = useApp();
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [matchModal, setMatchModal] = useState<ConnectionProfile | null>(null);

  const visibleProfiles = connectionProfiles.slice(currentIndex, currentIndex + 2).reverse();

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    // Handle right swipe (like)
    if (direction === 'right') {
      // Check if free user has likes remaining
      if (user?.subscription.tier === 'free' && (user.likesRemaining ?? 0) <= 0) {
        toast({
          title: 'Daily Limit Reached',
          description: 'Upgrade to Pro for unlimited likes!',
          variant: 'destructive',
        });
        return;
      }

      const profile = connectionProfiles[currentIndex];
      
      // Deduct like for free users
      if (user?.subscription.tier === 'free') {
        updateUser({ likesRemaining: (user.likesRemaining ?? 10) - 1 });
      }

      // 70% chance of a match
      if (Math.random() > 0.7) {
        addMatch(profile);
        setMatchModal(profile);
      } else {
        toast({
          title: `Liked ${profile.name} ❤️`,
          duration: 1500,
        });
      }
    }

    // Handle left swipe (pass) or after processing right swipe
    setHistory([...history, currentIndex]);
    setCurrentIndex((prev) => prev + 1);
  }, [user, connectionProfiles, currentIndex, history, addMatch, updateUser, toast]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastIndex = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setCurrentIndex(lastIndex);
  };

  const noMoreProfiles = currentIndex >= connectionProfiles.length;

  // Calculate likes remaining display
  const likesRemaining = user?.subscription.tier === 'free' 
    ? (user.likesRemaining ?? 10)
    : '∞';

  return (
    <div className="app-container min-h-screen bg-background pb-nav">
      <div className="px-5 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Connect</h1>
            <p className="text-muted-foreground text-sm">Find your people at events</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10">
            <Heart className="w-4 h-4 text-brand-pink" />
            <span className="text-sm font-medium">
              {likesRemaining}
              {user?.subscription.tier === 'free' ? '/10' : ''}
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
        <div className="relative h-[450px] w-full max-w-[320px] mx-auto mb-6">
          {noMoreProfiles ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">That's Everyone!</h3>
                <p className="text-muted-foreground text-sm">
                  Check back later for more connections
                </p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {visibleProfiles.map((profile, index) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onSwipe={handleSwipe}
                  isTop={index === visibleProfiles.length - 1}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Action Buttons */}
        {!noMoreProfiles && (
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={() => handleSwipe('left')}
              className="w-16 h-16 rounded-full bg-card border-2 border-brand-red/30 text-brand-red flex items-center justify-center transition-all hover:scale-110 hover:border-brand-red active:scale-95"
            >
              <X className="w-7 h-7" />
            </button>
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="w-12 h-12 rounded-full bg-card border border-border text-brand-yellow flex items-center justify-center transition-all hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleSwipe('right')}
              className="w-20 h-20 rounded-full gradient-pro glow-pink text-foreground flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            >
              <Heart className="w-9 h-9" />
            </button>
          </div>
        )}
      </div>

      {/* Match Modal */}
      <Dialog open={!!matchModal} onOpenChange={() => setMatchModal(null)}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border max-w-[350px] text-center">
          <motion.div 
            className="py-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="relative w-32 h-32 mx-auto mb-6">
              <motion.div 
                className="absolute inset-0 rounded-full gradient-pro"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
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
          </motion.div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
