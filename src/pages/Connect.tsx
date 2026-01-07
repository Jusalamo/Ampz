import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Heart, RotateCcw, Sparkles, MapPin, Briefcase, Info, ChevronDown, Eye, EyeOff, Zap, Lock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { ConnectionProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CARD_COLORS = [
  'from-violet-600 to-purple-700',
  'from-pink-500 to-rose-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
];

interface ProfileCardProps {
  profile: ConnectionProfile;
  onSwipe: (direction: 'left' | 'right') => void;
  isTop: boolean;
  onViewProfile: () => void;
}

function ProfileCard({ profile, onSwipe, isTop, onViewProfile }: ProfileCardProps) {
  const [exitX, setExitX] = useState(0);
  const [showHint, setShowHint] = useState<'like' | 'pass' | null>(null);
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

  const handleDrag = useCallback((_: unknown, info: PanInfo) => {
    if (info.offset.x > 50) {
      setShowHint('like');
    } else if (info.offset.x < -50) {
      setShowHint('pass');
    } else {
      setShowHint(null);
    }
  }, []);

  return (
    <motion.div
      className="absolute inset-0"
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 20, opacity: isTop ? 1 : 0.7 }}
      animate={{ 
        scale: isTop ? 1 : 0.95, 
        y: isTop ? 0 : 20,
        opacity: isTop ? 1 : 0.7,
        rotateZ: 0 
      }}
      exit={{ x: exitX, opacity: 0, rotateZ: exitX > 0 ? 15 : -15 }}
      whileDrag={{ cursor: 'grabbing' }}
      style={{ 
        zIndex: isTop ? 10 : 1,
        transformOrigin: '50% 100%'
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className={`w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br ${CARD_COLORS[colorIndex]} relative`}>
        {/* Swipe Hints */}
        <AnimatePresence>
          {showHint === 'like' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-8 left-8 z-20 px-6 py-3 border-4 border-green-400 rounded-xl rotate-[-20deg]"
            >
              <span className="text-green-400 text-3xl font-bold">LIKE</span>
            </motion.div>
          )}
          {showHint === 'pass' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-8 right-8 z-20 px-6 py-3 border-4 border-red-400 rounded-xl rotate-[20deg]"
            >
              <span className="text-red-400 text-3xl font-bold">PASS</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Profile Photo */}
        <div className="relative h-[60%]">
          <img
            src={profile.photo}
            alt={profile.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          
          {/* View Profile Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile();
            }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <Info className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-2xl font-bold">{profile.name}</h2>
            <span className="text-xl opacity-80">{profile.age}</span>
            {profile.isPublic && (
              <span className="px-2 py-0.5 bg-green-500/30 border border-green-400/50 rounded-full text-xs text-green-300">
                Checked In
              </span>
            )}
          </div>
          
          {profile.occupation && (
            <div className="flex items-center gap-2 mb-2 opacity-90">
              <Briefcase className="w-4 h-4" />
              <span className="text-sm">{profile.occupation}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 mb-3 opacity-80">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{profile.location}</span>
          </div>
          
          <p className="text-sm opacity-90 mb-4 line-clamp-2">{profile.bio}</p>
          
          <div className="flex flex-wrap gap-2">
            {profile.interests.slice(0, 4).map((interest) => (
              <span
                key={interest}
                className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-xs font-medium rounded-full border border-white/20"
              >
                {interest}
              </span>
            ))}
            {profile.interests.length > 4 && (
              <span className="px-3 py-1.5 bg-white/10 text-xs font-medium rounded-full">
                +{profile.interests.length - 4}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Connect() {
  const navigate = useNavigate();
  const { connectionProfiles, user, addMatch, updateUser, tickets, isDemo } = useApp();
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [matchModal, setMatchModal] = useState<ConnectionProfile | null>(null);
  const [viewingProfile, setViewingProfile] = useState<ConnectionProfile | null>(null);

  // Filter profiles based on demo mode or user's checked-in events
  const availableProfiles = useMemo(() => {
    if (isDemo) {
      return connectionProfiles;
    }
    // In production, only show profiles from events user has tickets for
    const userEventIds = tickets.map(t => t.eventId);
    return connectionProfiles.filter(p => userEventIds.includes(p.eventId));
  }, [connectionProfiles, tickets, isDemo]);

  const visibleProfiles = availableProfiles.slice(currentIndex, currentIndex + 2).reverse();
  const noMoreProfiles = currentIndex >= availableProfiles.length;

  // Get current event info
  const currentProfile = availableProfiles[currentIndex];
  const currentEventName = currentProfile?.eventId ? 
    (isDemo ? 'Windhoek Jazz Night' : 'Current Event') : null;

  // Check if user has any active events to connect at
  const hasActiveEvents = isDemo || tickets.length > 0;

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (direction === 'right') {
      // Check like limits
      if (user?.subscription.tier === 'free' && (user.likesRemaining ?? 0) <= 0) {
        toast({
          title: 'Daily Limit Reached',
          description: 'Upgrade to Pro for unlimited likes!',
          variant: 'destructive',
        });
        return;
      }

      const profile = availableProfiles[currentIndex];
      
      // Deduct like for free users
      if (user?.subscription.tier === 'free') {
        updateUser({ likesRemaining: (user.likesRemaining ?? 10) - 1 });
      }

      // Match logic (70% chance in demo)
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

    setHistory([...history, currentIndex]);
    setCurrentIndex((prev) => prev + 1);
  }, [user, availableProfiles, currentIndex, history, addMatch, updateUser, toast]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastIndex = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setCurrentIndex(lastIndex);
  };

  // Likes remaining display
  const likesRemaining = user?.subscription.tier === 'free' 
    ? (user.likesRemaining ?? 10)
    : '∞';

  const maxLikes = user?.subscription.tier === 'free' ? 25 : 
                   user?.subscription.tier === 'pro' ? 50 : 100;

  // No active events state
  if (!hasActiveEvents) {
    return (
      <div className="app-container min-h-screen bg-background pb-nav">
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Lock className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-center">Check In to Connect</h2>
          <p className="text-muted-foreground text-center mb-6 max-w-xs">
            To start connecting with people, you need to be checked in at an event. 
            Get tickets and check in to see who's there!
          </p>
          <Button onClick={() => navigate('/events')} className="rounded-xl" size="lg">
            <Sparkles className="w-5 h-5 mr-2" />
            Browse Events
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="app-container min-h-screen bg-background pb-nav">
      <div className="px-5 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Connect</h1>
            <p className="text-muted-foreground text-sm">Find your people at events</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Likes Counter */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30">
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              <span className="text-sm font-bold text-pink-500">
                {likesRemaining}
              </span>
              {user?.subscription.tier === 'free' && (
                <span className="text-xs text-muted-foreground">/{maxLikes}</span>
              )}
            </div>
          </div>
        </div>

        {/* Current Event Badge */}
        {currentEventName && (
          <div className="glass-card p-4 flex items-center gap-4 mb-6 rounded-2xl border border-border">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{currentEventName}</p>
              <p className="text-xs text-muted-foreground">
                {availableProfiles.length - currentIndex} people to discover
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/events')}>
              Change
            </Button>
          </div>
        )}

        {/* Card Stack */}
        <div className="relative h-[480px] w-full max-w-[340px] mx-auto mb-6">
          {noMoreProfiles ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="text-center px-4">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">That's Everyone!</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Check back later for more connections, or attend more events to meet new people.
                </p>
                <Button onClick={() => navigate('/events')} variant="outline" className="rounded-xl">
                  Find More Events
                </Button>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {visibleProfiles.map((profile, index) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onSwipe={handleSwipe}
                  isTop={index === visibleProfiles.length - 1}
                  onViewProfile={() => setViewingProfile(profile)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Action Buttons */}
        {!noMoreProfiles && (
          <div className="flex justify-center items-center gap-5">
            {/* Pass Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSwipe('left')}
              className="w-16 h-16 rounded-full bg-card border-2 border-red-400/30 text-red-400 flex items-center justify-center shadow-lg hover:border-red-400 hover:shadow-red-400/20 transition-all"
            >
              <X className="w-8 h-8" />
            </motion.button>

            {/* Undo Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUndo}
              disabled={history.length === 0}
              className={cn(
                "w-12 h-12 rounded-full bg-card border border-border text-amber-500 flex items-center justify-center shadow-lg transition-all",
                history.length === 0 && "opacity-30 cursor-not-allowed"
              )}
            >
              <RotateCcw className="w-5 h-5" />
            </motion.button>

            {/* Like Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSwipe('right')}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-xl shadow-pink-500/30 hover:shadow-pink-500/50 transition-all"
            >
              <Heart className="w-10 h-10" />
            </motion.button>
          </div>
        )}

        {/* Subscription Prompt for Free Users */}
        {user?.subscription.tier === 'free' && (user.likesRemaining ?? 10) < 5 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-purple-400" />
              <div className="flex-1">
                <p className="text-sm font-medium">Running low on likes!</p>
                <p className="text-xs text-muted-foreground">
                  Upgrade to Pro for unlimited daily likes
                </p>
              </div>
              <Button size="sm" onClick={() => navigate('/settings')}>
                Upgrade
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Match Modal */}
      <Dialog open={!!matchModal} onOpenChange={() => setMatchModal(null)}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border max-w-[350px] text-center p-0 overflow-hidden">
          <motion.div 
            className="py-8 px-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {/* Celebration Animation */}
            <div className="relative w-28 h-28 mx-auto mb-6">
              <motion.div 
                className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500 to-purple-600"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <img
                src={matchModal?.photo}
                alt={matchModal?.name}
                className="w-full h-full rounded-full object-cover border-4 border-background relative z-10"
              />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="absolute -top-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center z-20 border-4 border-background"
              >
                <Heart className="w-5 h-5 text-white fill-white" />
              </motion.div>
            </div>
            
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-2"
            >
              It's a Match!
            </motion.h2>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground mb-6"
            >
              You and {matchModal?.name} liked each other
            </motion.p>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex gap-3"
            >
              <Button
                variant="outline"
                onClick={() => setMatchModal(null)}
                className="flex-1 rounded-xl h-12"
              >
                Keep Swiping
              </Button>
              <Button
                onClick={() => {
                  setMatchModal(null);
                  navigate('/matches');
                }}
                className="flex-1 rounded-xl h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                Send Message
              </Button>
            </motion.div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Profile View Modal */}
      <Dialog open={!!viewingProfile} onOpenChange={() => setViewingProfile(null)}>
        <DialogContent className="bg-background border-border max-w-[400px] p-0 overflow-hidden max-h-[85vh] overflow-y-auto">
          {viewingProfile && (
            <>
              <div className="relative h-64">
                <img
                  src={viewingProfile.photo}
                  alt={viewingProfile.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-2xl font-bold text-white">
                    {viewingProfile.name}, {viewingProfile.age}
                  </h2>
                  {viewingProfile.occupation && (
                    <p className="text-white/80 flex items-center gap-2 mt-1">
                      <Briefcase className="w-4 h-4" />
                      {viewingProfile.occupation}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">About</h3>
                  <p className="text-sm">{viewingProfile.bio}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Location</h3>
                  <p className="text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    {viewingProfile.location}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewingProfile.interests.map((interest) => (
                      <span
                        key={interest}
                        className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewingProfile(null);
                      handleSwipe('left');
                    }}
                    className="flex-1 rounded-xl h-12"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Pass
                  </Button>
                  <Button
                    onClick={() => {
                      setViewingProfile(null);
                      handleSwipe('right');
                    }}
                    className="flex-1 rounded-xl h-12 bg-gradient-to-r from-pink-500 to-purple-600"
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    Like
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
