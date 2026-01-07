import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Heart, RotateCcw, Sparkles, MapPin, Briefcase, Info, Lock } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { ConnectionProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Original Design System
const DESIGN = {
  colors: {
    primary: '#C4B5FD',
    lavenderLight: '#E9D5FF',
    accentPink: '#FFB8E6',
    background: '#1A1A1A',
    card: '#2D2D2D',
    textPrimary: '#FFFFFF',
    textSecondary: '#B8B8B8'
  },
  spacing: {
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  borderRadius: {
    card: '24px',
    button: '50%',
    modal: '32px'
  }
};

// Apple HIG Constants
const HIG = {
  touchTarget: '44px',
  buttonHeight: '50px',
  modalRadius: '20px',
  spring: { type: 'spring', stiffness: 300, damping: 30 }
};

interface ProfileCardProps {
  profile: ConnectionProfile;
  onSwipe: (direction: 'left' | 'right') => void;
  isTop: boolean;
  onViewProfile: () => void;
}

function ProfileCard({ profile, onSwipe, isTop, onViewProfile }: ProfileCardProps) {
  const [exitX, setExitX] = useState(0);
  const [showHint, setShowHint] = useState<'like' | 'pass' | null>(null);

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
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 12 }}
      animate={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 12 }}
      exit={{ x: exitX, opacity: 0, rotateZ: exitX > 0 ? 15 : -15 }}
      whileTap={{ scale: 0.95 }}
      style={{ zIndex: isTop ? 10 : 1 }}
      transition={HIG.spring}
    >
      {/* Original Card Design */}
      <div 
        className="w-full h-full rounded-[24px] overflow-hidden relative rotate-[-2deg]"
        style={{
          background: 'linear-gradient(135deg, #C4B5FD 0%, #E9D5FF 100%)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          border: '2px solid #D4AF37',
          padding: '16px'
        }}
      >
        {/* Profile Photo */}
        <div className="relative h-[70%] mb-3">
          <img
            src={profile.photo}
            alt={profile.name}
            className="w-full h-full object-cover rounded-[20px] border-3 border-white"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-[20px]" />
          
          {/* Info Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile();
            }}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
            style={{ borderRadius: '50%' }}
          >
            <Info className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Simple Info */}
        <div className="px-1">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-[24px] font-semibold" style={{ color: DESIGN.colors.background }}>
              {profile.name}
            </h2>
            <span className="text-[24px]" style={{ color: DESIGN.colors.card, opacity: 0.8 }}>
              {profile.age}
            </span>
          </div>
          
          <div className="flex justify-center">
            <div 
              className="px-3 py-1.5 rounded-[8px] flex items-center justify-center"
              style={{
                background: '#FFFFFF',
                minHeight: '28px'
              }}
            >
              <span className="text-[13px] font-medium text-center" style={{ color: DESIGN.colors.background }}>
                {profile.gender || "Preferred not to say"}
              </span>
            </div>
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

  const availableProfiles = useMemo(() => {
    if (isDemo) return connectionProfiles;
    const userEventIds = tickets.map(t => t.eventId);
    return connectionProfiles.filter(p => userEventIds.includes(p.eventId));
  }, [connectionProfiles, tickets, isDemo]);

  const visibleProfiles = availableProfiles.slice(currentIndex, currentIndex + 2).reverse();
  const noMoreProfiles = currentIndex >= availableProfiles.length;

  const currentEventName = useMemo(() => {
    if (isDemo && availableProfiles.length > 0) {
      return availableProfiles[0].eventName || "Windhoek Jazz Night";
    }
    if (tickets.length > 0) {
      return tickets[0].eventName || "Current Event";
    }
    return "Connect";
  }, [isDemo, availableProfiles, tickets]);

  const hasActiveEvents = isDemo || tickets.length > 0;

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (direction === 'right') {
      if (user?.subscription.tier === 'free' && (user.likesRemaining ?? 0) <= 0) {
        toast({ title: 'Daily Limit Reached', description: 'Upgrade to Pro!' });
        return;
      }

      const profile = availableProfiles[currentIndex];
      
      if (user?.subscription.tier === 'free') {
        updateUser({ likesRemaining: (user.likesRemaining ?? 10) - 1 });
      }

      if (Math.random() > 0.7) {
        addMatch(profile);
        setMatchModal(profile);
      } else {
        toast({ title: `Liked ${profile.name} ❤️`, duration: 1500 });
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

  const likesRemaining = user?.subscription.tier === 'free' ? (user.likesRemaining ?? 10) : '∞';

  if (!hasActiveEvents) {
    return (
      <div 
        className="min-h-screen px-4"
        style={{ background: DESIGN.colors.background }}
      >
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ background: `${DESIGN.colors.primary}20`, borderRadius: '50%' }}
          >
            <Lock className="w-10 h-10" style={{ color: DESIGN.colors.primary }} />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-center" style={{ color: DESIGN.colors.textPrimary }}>
            Check In to Connect
          </h2>
          <p className="text-center mb-6 max-w-xs" style={{ color: DESIGN.colors.textSecondary }}>
            Get tickets and check in to see who's there!
          </p>
          <Button 
            onClick={() => navigate('/events')} 
            className="w-full max-w-[280px] h-[50px] rounded-[12px]"
            style={{ background: DESIGN.colors.primary, color: DESIGN.colors.background }}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Browse Events
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div 
      className="px-4 pb-nav"
      style={{ 
        background: DESIGN.colors.background,
        minHeight: '100vh',
        paddingBottom: '80px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pt-4 mb-4">
        <div>
          <h1 className="text-[28px] font-bold mb-1" style={{ color: DESIGN.colors.textPrimary }}>
            {currentEventName}
          </h1>
          <p className="text-[14px]" style={{ color: DESIGN.colors.textSecondary }}>
            {availableProfiles.length - currentIndex} people here
          </p>
        </div>
        <div 
          className="flex items-center gap-2 px-3 py-2 rounded-full"
          style={{ background: `${DESIGN.colors.accentPink}20` }}
        >
          <Heart className="w-4 h-4" style={{ color: DESIGN.colors.accentPink }} />
          <span className="text-sm font-bold" style={{ color: DESIGN.colors.accentPink }}>
            {likesRemaining}
          </span>
        </div>
      </div>

      {/* Card Stack */}
      <div className="relative h-[380px] w-full mx-auto mb-4">
        {noMoreProfiles ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: `${DESIGN.colors.primary}20`, borderRadius: '50%' }}
              >
                <Heart className="w-8 h-8" style={{ color: DESIGN.colors.primary }} />
              </div>
              <h3 className="text-[22px] font-bold mb-2" style={{ color: DESIGN.colors.textPrimary }}>
                That's Everyone!
              </h3>
              <p className="text-sm mb-4" style={{ color: DESIGN.colors.textSecondary }}>
                Check back later for more connections.
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
                onViewProfile={() => setViewingProfile(profile)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Action Buttons */}
      {!noMoreProfiles && (
        <>
          <div className="flex justify-center items-center gap-4 mb-4">
            {/* Pass Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSwipe('left')}
              className="flex items-center justify-center"
              style={{
                width: '64px',
                height: '64px',
                background: '#4A4A4A',
                color: DESIGN.colors.textPrimary,
                borderRadius: '50%',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
              }}
            >
              <X className="w-6 h-6" />
            </motion.button>

            {/* Undo Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUndo}
              disabled={history.length === 0}
              className={cn(
                "flex items-center justify-center",
                history.length === 0 && "opacity-30"
              )}
              style={{
                width: '44px',
                height: '44px',
                background: 'transparent',
                color: DESIGN.colors.textSecondary,
                borderRadius: '50%',
                border: `2px solid ${DESIGN.colors.textSecondary}`
              }}
            >
              <RotateCcw className="w-4 h-4" />
            </motion.button>

            {/* Like Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSwipe('right')}
              className="flex items-center justify-center"
              style={{
                width: '64px',
                height: '64px',
                background: DESIGN.colors.accentPink,
                color: DESIGN.colors.background,
                borderRadius: '50%',
                boxShadow: '0 4px 16px rgba(255, 184, 230, 0.4)'
              }}
            >
              <Heart className="w-6 h-6" />
            </motion.button>
          </div>

          {/* Maybe Later Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="mx-auto block text-sm italic"
            style={{ color: DESIGN.colors.textSecondary }}
          >
            Maybe Later
          </motion.button>
        </>
      )}

      {/* Match Modal - Bottom Sheet */}
      <Dialog open={!!matchModal} onOpenChange={() => setMatchModal(null)}>
        <DialogContent 
          className="p-0 border-0 rounded-t-[20px] rounded-b-none bottom-0 fixed max-w-none w-full"
          style={{
            background: DESIGN.colors.card,
            margin: 0,
            bottom: 0,
            left: 0,
            right: 0,
            transform: 'none',
            top: 'auto'
          }}
        >
          <div className="w-full flex justify-center pt-3">
            <div className="w-9 h-1 rounded-full bg-gray-400" />
          </div>

          <motion.div 
            className="py-6 px-5"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={HIG.spring}
          >
            <div className="relative w-20 h-20 mx-auto mb-5">
              <motion.div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${DESIGN.colors.primary} 0%, ${DESIGN.colors.lavenderLight} 100%)`
                }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <img
                src={matchModal?.photo}
                alt={matchModal?.name}
                className="w-full h-full rounded-full object-cover border-4 relative z-10"
                style={{ borderColor: DESIGN.colors.card }}
              />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center z-20 border-2"
                style={{ background: '#D4AF37', borderColor: DESIGN.colors.card }}
              >
                <Heart className="w-3 h-3 text-white fill-white" />
              </motion.div>
            </div>
            
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-[28px] font-bold mb-2 text-center"
              style={{ color: DESIGN.colors.textPrimary }}
            >
              It's a Match!
            </motion.h2>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6 text-center"
              style={{ color: DESIGN.colors.textSecondary }}
            >
              You and {matchModal?.name} liked each other
            </motion.p>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setMatchModal(null)}
                className="flex-1 h-12 rounded-[12px]"
                style={{ 
                  borderColor: DESIGN.colors.primary,
                  color: DESIGN.colors.textPrimary 
                }}
              >
                Keep Swiping
              </Button>
              <Button
                onClick={() => {
                  setMatchModal(null);
                  navigate('/matches');
                }}
                className="flex-1 h-12 rounded-[12px]"
                style={{ 
                  background: DESIGN.colors.primary,
                  color: DESIGN.colors.background 
                }}
              >
                Message
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Profile View Modal - Bottom Sheet */}
      <Dialog open={!!viewingProfile} onOpenChange={() => setViewingProfile(null)}>
        <DialogContent 
          className="p-0 border-0 rounded-t-[20px] rounded-b-none bottom-0 fixed max-w-none w-full"
          style={{
            background: DESIGN.colors.card,
            margin: 0,
            bottom: 0,
            left: 0,
            right: 0,
            transform: 'none',
            top: 'auto',
            maxHeight: '90vh'
          }}
        >
          <div className="w-full flex justify-center pt-3">
            <div className="w-9 h-1 rounded-full bg-gray-400" />
          </div>

          <div className="overflow-y-auto max-h-[80vh]">
            {viewingProfile && (
              <>
                <div className="relative h-56">
                  <img
                    src={viewingProfile.photo}
                    alt={viewingProfile.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                </div>
                
                <div className="p-5 space-y-6">
                  <div>
                    <h2 className="text-[28px] font-bold mb-1" style={{ color: DESIGN.colors.textPrimary }}>
                      {viewingProfile.name}, {viewingProfile.age}
                    </h2>
                    {viewingProfile.gender && (
                      <p className="text-[15px] mb-2" style={{ color: DESIGN.colors.textSecondary }}>
                        {viewingProfile.gender}
                      </p>
                    )}
                    {viewingProfile.occupation && (
                      <div className="flex items-center gap-2 mt-2">
                        <Briefcase className="w-4 h-4" style={{ color: DESIGN.colors.primary }} />
                        <span className="text-[15px]" style={{ color: DESIGN.colors.primary }}>
                          {viewingProfile.occupation}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-[13px] font-semibold mb-3 uppercase tracking-wider" style={{ color: DESIGN.colors.textSecondary }}>
                      About
                    </h3>
                    <p className="text-[15px]" style={{ color: DESIGN.colors.textSecondary }}>
                      {viewingProfile.bio}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-[13px] font-semibold mb-3 uppercase tracking-wider" style={{ color: DESIGN.colors.textSecondary }}>
                      Location
                    </h3>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" style={{ color: DESIGN.colors.primary }} />
                      <span className="text-[15px]" style={{ color: DESIGN.colors.textSecondary }}>
                        {viewingProfile.location}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="p-5 border-t" style={{ borderColor: `${DESIGN.colors.textSecondary}20` }}>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setViewingProfile(null);
                        handleSwipe('left');
                      }}
                      className="flex-1 h-12 rounded-[12px]"
                      style={{ 
                        borderColor: '#4A4A4A',
                        color: DESIGN.colors.textPrimary 
                      }}
                    >
                      <X className="w-5 h-5 mr-2" />
                      Pass
                    </Button>
                    <Button
                      onClick={() => {
                        setViewingProfile(null);
                        handleSwipe('right');
                      }}
                      className="flex-1 h-12 rounded-[12px]"
                      style={{ 
                        background: DESIGN.colors.primary,
                        color: DESIGN.colors.background 
                      }}
                    >
                      <Heart className="w-5 h-5 mr-2" />
                      Like
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="h-4" />
      <BottomNav />
    </div>
  );
}
