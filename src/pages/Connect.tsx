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

// Design System Constants from JSON
const DESIGN_SYSTEM = {
  colors: {
    primary: {
      lavender: '#C4B5FD',
      lavenderLight: '#E9D5FF',
      lavenderDark: '#A78BFA'
    },
    background: {
      dark: '#1A1A1A',
      card: '#2D2D2D',
      gradient: 'linear-gradient(180deg, #1A1A1A 0%, #2D2D2D 100%)'
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B8B8B8',
      accent: '#C4B5FD'
    },
    accent: {
      pink: '#FFB8E6',
      gold: '#D4AF37',
      goldLight: '#E8C878'
    },
    interactive: {
      yes: '#FFB8E6',
      no: '#4A4A4A',
      border: '#C4B5FD'
    }
  },
  typography: {
    fonts: {
      heading: "'Playfair Display', 'Georgia', serif",
      subheading: "'Poppins', 'Inter', sans-serif",
      body: "'Inter', 'Roboto', sans-serif",
      decorative: "'Pacifico', 'Brush Script MT', cursive"
    },
    sizes: {
      h1: '48px',
      h2: '36px',
      h3: '28px',
      h4: '24px',
      body: '16px',
      caption: '14px',
      small: '12px'
    },
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    xxxl: '64px'
  },
  borderRadius: {
    small: '8px',
    medium: '16px',
    large: '24px',
    xlarge: '32px',
    round: '50%'
  },
  shadows: {
    card: '0 8px 32px rgba(0, 0, 0, 0.4)',
    button: '0 4px 16px rgba(196, 181, 253, 0.3)',
    elevated: '0 12px 48px rgba(0, 0, 0, 0.5)'
  },
  animations: {
    cardSwipe: {
      duration: '300ms',
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
    },
    buttonHover: {
      duration: '200ms',
      easing: 'ease-in-out'
    },
    fadeIn: {
      duration: '400ms',
      easing: 'ease-out'
    },
    slideUp: {
      duration: '500ms',
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
    }
  }
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
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 20, opacity: isTop ? 1 : 0.7 }}
      animate={{ 
        scale: isTop ? 1 : 0.95, 
        y: isTop ? 0 : 20,
        opacity: isTop ? 1 : 0.7,
        rotateZ: isTop ? -2 : 0
      }}
      exit={{ x: exitX, opacity: 0, rotateZ: exitX > 0 ? 15 : -15 }}
      whileDrag={{ cursor: 'grabbing' }}
      style={{ 
        zIndex: isTop ? 10 : 1,
        transformOrigin: '50% 100%'
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 30 
      }}
    >
      {/* Profile Card Container with Design System Styles */}
      <div 
        className="w-full h-full rounded-[24px] overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, #C4B5FD 0%, #E9D5FF 100%)',
          boxShadow: DESIGN_SYSTEM.shadows.card,
          border: '2px solid #D4AF37',
          padding: '20px'
        }}
      >
        {/* Swipe Hints */}
        <AnimatePresence>
          {showHint === 'like' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-8 left-8 z-20 px-6 py-3 border-4 border-[#C4B5FD] rounded-xl rotate-[-20deg]"
              style={{
                background: DESIGN_SYSTEM.colors.background.dark,
                borderColor: DESIGN_SYSTEM.colors.interactive.border
              }}
            >
              <span className="text-[32px] font-bold" style={{ color: DESIGN_SYSTEM.colors.primary.lavender }}>
                LIKE
              </span>
            </motion.div>
          )}
          {showHint === 'pass' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-8 right-8 z-20 px-6 py-3 border-4 border-[#4A4A4A] rounded-xl rotate-[20deg]"
              style={{
                background: DESIGN_SYSTEM.colors.background.dark,
                borderColor: DESIGN_SYSTEM.colors.interactive.no
              }}
            >
              <span className="text-[32px] font-bold" style={{ color: DESIGN_SYSTEM.colors.text.secondary }}>
                PASS
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Profile Photo */}
        <div className="relative h-[60%] mb-[16px]">
          <img
            src={profile.photo}
            alt={profile.name}
            className="w-full h-full object-cover"
            style={{
              borderRadius: '20px',
              border: '3px solid #FFFFFF'
            }}
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent rounded-[20px]" />
          
          {/* View Profile Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile();
            }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
            style={{ borderRadius: DESIGN_SYSTEM.borderRadius.round }}
          >
            <Info className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="text-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <h2 
              className="text-[28px] font-semibold"
              style={{ fontFamily: DESIGN_SYSTEM.typography.fonts.subheading }}
            >
              {profile.name}
            </h2>
            <span 
              className="text-[28px] opacity-80"
              style={{ color: DESIGN_SYSTEM.colors.background.card }}
            >
              {profile.age}
            </span>
            {profile.isPublic && (
              <span 
                className="px-3 py-1 rounded-[8px] text-[12px] font-medium"
                style={{
                  background: DESIGN_SYSTEM.colors.accent.goldLight,
                  color: DESIGN_SYSTEM.colors.background.dark
                }}
              >
                Checked In
              </span>
            )}
          </div>
          
          {profile.occupation && (
            <div className="flex items-center gap-2 mb-2 opacity-90">
              <Briefcase className="w-4 h-4" style={{ color: DESIGN_SYSTEM.colors.background.card }} />
              <span className="text-[14px]" style={{ color: DESIGN_SYSTEM.colors.background.card }}>
                {profile.occupation}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2 mb-3 opacity-80">
            <MapPin className="w-4 h-4" style={{ color: DESIGN_SYSTEM.colors.background.card }} />
            <span className="text-[14px]" style={{ color: DESIGN_SYSTEM.colors.background.card }}>
              {profile.location}
            </span>
          </div>
          
          <p 
            className="text-[14px] opacity-90 mb-4 line-clamp-2"
            style={{ 
              color: DESIGN_SYSTEM.colors.background.card,
              lineHeight: 1.6
            }}
          >
            {profile.bio}
          </p>
          
          <div className="flex flex-wrap gap-2">
            {profile.interests.slice(0, 4).map((interest) => (
              <span
                key={interest}
                className="px-3 py-1.5 text-[12px] font-medium rounded-full border"
                style={{
                  background: DESIGN_SYSTEM.colors.background.dark,
                  color: DESIGN_SYSTEM.colors.text.primary,
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: DESIGN_SYSTEM.borderRadius.round,
                  backdropFilter: 'blur(8px)'
                }}
              >
                {interest}
              </span>
            ))}
            {profile.interests.length > 4 && (
              <span 
                className="px-3 py-1.5 text-[12px] font-medium rounded-full"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: DESIGN_SYSTEM.colors.text.primary,
                  borderRadius: DESIGN_SYSTEM.borderRadius.round
                }}
              >
                +{profile.interests.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Match Percentage Indicator */}
        <div 
          className="absolute bottom-6 right-6 flex items-center gap-2"
          style={{
            background: DESIGN_SYSTEM.colors.background.dark,
            padding: '8px 16px',
            borderRadius: DESIGN_SYSTEM.borderRadius.large,
            boxShadow: DESIGN_SYSTEM.shadows.elevated
          }}
        >
          <span 
            className="text-[24px] font-bold"
            style={{ color: DESIGN_SYSTEM.colors.text.primary }}
          >
            92%
          </span>
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              border: `2px solid ${DESIGN_SYSTEM.colors.text.primary}`,
              borderRadius: DESIGN_SYSTEM.borderRadius.round
            }}
          >
            <Heart className="w-6 h-6" style={{ color: DESIGN_SYSTEM.colors.accent.pink }} />
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

  // No active events state
  if (!hasActiveEvents) {
    return (
      <div 
        className="app-container min-h-screen pb-nav"
        style={{
          background: DESIGN_SYSTEM.colors.background.gradient,
          minHeight: '100vh'
        }}
      >
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{
              background: `${DESIGN_SYSTEM.colors.primary.lavender}20`,
              borderRadius: DESIGN_SYSTEM.borderRadius.round
            }}
          >
            <Lock className="w-12 h-12" style={{ color: DESIGN_SYSTEM.colors.primary.lavender }} />
          </div>
          <h2 
            className="text-2xl font-bold mb-3 text-center"
            style={{ 
              color: DESIGN_SYSTEM.colors.text.primary,
              fontFamily: DESIGN_SYSTEM.typography.fonts.subheading
            }}
          >
            Check In to Connect
          </h2>
          <p 
            className="text-center mb-6 max-w-xs"
            style={{ color: DESIGN_SYSTEM.colors.text.secondary }}
          >
            To start connecting with people, you need to be checked in at an event. 
            Get tickets and check in to see who's there!
          </p>
          <Button 
            onClick={() => navigate('/events')} 
            className="rounded-xl" 
            size="lg"
            style={{
              background: DESIGN_SYSTEM.colors.primary.lavender,
              color: DESIGN_SYSTEM.colors.background.dark,
              borderRadius: DESIGN_SYSTEM.borderRadius.large
            }}
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
      className="app-container min-h-screen pb-nav"
      style={{
        background: DESIGN_SYSTEM.colors.background.gradient,
        maxWidth: '430px',
        margin: '0 auto',
        padding: DESIGN_SYSTEM.spacing.lg,
        minHeight: '100vh'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 
            className="text-[36px] font-bold mb-1"
            style={{ 
              color: DESIGN_SYSTEM.colors.text.primary,
              fontFamily: DESIGN_SYSTEM.typography.fonts.heading
            }}
          >
            Connect
          </h1>
          <p 
            className="text-[14px]"
            style={{ color: DESIGN_SYSTEM.colors.text.secondary }}
          >
            Find your people at events
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Likes Counter */}
          <div 
            className="flex items-center gap-2 px-4 py-2 rounded-full border"
            style={{
              background: `linear-gradient(135deg, ${DESIGN_SYSTEM.colors.accent.pink}20 0%, ${DESIGN_SYSTEM.colors.primary.lavender}20 100%)`,
              borderColor: `${DESIGN_SYSTEM.colors.accent.pink}30`,
              borderRadius: DESIGN_SYSTEM.borderRadius.round
            }}
          >
            <Heart className="w-4 h-4" style={{ color: DESIGN_SYSTEM.colors.accent.pink }} />
            <span className="text-sm font-bold" style={{ color: DESIGN_SYSTEM.colors.accent.pink }}>
              {likesRemaining}
            </span>
          </div>
        </div>
      </div>

      {/* Card Stack */}
      <div className="relative h-[520px] w-full mx-auto mb-8">
        {noMoreProfiles ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="text-center px-4">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{
                  background: `${DESIGN_SYSTEM.colors.primary.lavender}20`,
                  borderRadius: DESIGN_SYSTEM.borderRadius.round
                }}
              >
                <Heart className="w-12 h-12" style={{ color: DESIGN_SYSTEM.colors.primary.lavender }} />
              </div>
              <h3 
                className="text-[28px] font-bold mb-3"
                style={{ 
                  color: DESIGN_SYSTEM.colors.text.primary,
                  fontFamily: DESIGN_SYSTEM.typography.fonts.heading
                }}
              >
                That's Everyone!
              </h3>
              <p 
                className="text-sm mb-6"
                style={{ color: DESIGN_SYSTEM.colors.text.secondary }}
              >
                Check back later for more connections, or attend more events to meet new people.
              </p>
              <Button 
                onClick={() => navigate('/events')} 
                variant="outline" 
                className="rounded-xl"
                style={{
                  borderColor: DESIGN_SYSTEM.colors.primary.lavender,
                  color: DESIGN_SYSTEM.colors.primary.lavender,
                  borderRadius: DESIGN_SYSTEM.borderRadius.large
                }}
              >
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
        <div className="flex justify-center items-center gap-6 mb-4">
          {/* Pass Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSwipe('left')}
            className="flex items-center justify-center shadow-lg transition-all"
            style={{
              width: '72px',
              height: '72px',
              background: DESIGN_SYSTEM.colors.interactive.no,
              color: DESIGN_SYSTEM.colors.text.primary,
              borderRadius: DESIGN_SYSTEM.borderRadius.round,
              boxShadow: DESIGN_SYSTEM.shadows.button
            }}
          >
            <X className="w-8 h-8" />
          </motion.button>

          {/* Undo Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleUndo}
            disabled={history.length === 0}
            className={cn(
              "flex items-center justify-center shadow-lg transition-all",
              history.length === 0 && "opacity-30 cursor-not-allowed"
            )}
            style={{
              width: '56px',
              height: '56px',
              background: 'transparent',
              color: DESIGN_SYSTEM.colors.text.secondary,
              borderRadius: DESIGN_SYSTEM.borderRadius.round,
              border: `2px solid ${DESIGN_SYSTEM.colors.text.secondary}`
            }}
          >
            <RotateCcw className="w-5 h-5" />
          </motion.button>

          {/* Like Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSwipe('right')}
            className="flex items-center justify-center shadow-xl transition-all"
            style={{
              width: '72px',
              height: '72px',
              background: DESIGN_SYSTEM.colors.interactive.yes,
              color: DESIGN_SYSTEM.colors.background.dark,
              borderRadius: DESIGN_SYSTEM.borderRadius.round,
              boxShadow: `0 4px 16px ${DESIGN_SYSTEM.colors.accent.pink}40`,
              fontWeight: 600,
              fontSize: '18px'
            }}
          >
            <Heart className="w-8 h-8" />
          </motion.button>
        </div>
      )}

      {/* Umm Button */}
      {!noMoreProfiles && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mx-auto block"
          style={{
            background: 'transparent',
            color: DESIGN_SYSTEM.colors.text.secondary,
            fontSize: '14px',
            fontStyle: 'italic',
            border: 'none'
          }}
        >
          Maybe Later
        </motion.button>
      )}

      {/* Match Modal */}
      <Dialog open={!!matchModal} onOpenChange={() => setMatchModal(null)}>
        <DialogContent 
          className="text-center p-0 overflow-hidden border-0"
          style={{
            background: DESIGN_SYSTEM.colors.background.card,
            maxWidth: '350px',
            borderRadius: DESIGN_SYSTEM.borderRadius.xlarge,
            boxShadow: DESIGN_SYSTEM.shadows.elevated
          }}
        >
          <motion.div 
            className="py-8 px-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {/* Celebration Animation */}
            <div className="relative w-28 h-28 mx-auto mb-6">
              <motion.div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${DESIGN_SYSTEM.colors.accent.pink} 0%, ${DESIGN_SYSTEM.colors.primary.lavender} 100%)`
                }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <img
                src={matchModal?.photo}
                alt={matchModal?.name}
                className="w-full h-full rounded-full object-cover border-4 relative z-10"
                style={{
                  borderColor: DESIGN_SYSTEM.colors.background.card,
                  borderRadius: DESIGN_SYSTEM.borderRadius.round
                }}
              />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center z-20 border-4"
                style={{
                  background: DESIGN_SYSTEM.colors.accent.gold,
                  borderColor: DESIGN_SYSTEM.colors.background.card,
                  borderRadius: DESIGN_SYSTEM.borderRadius.round
                }}
              >
                <Heart className="w-5 h-5 text-white fill-white" />
              </motion.div>
            </div>
            
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-[32px] font-bold mb-2"
              style={{ 
                fontFamily: DESIGN_SYSTEM.typography.fonts.decorative,
                color: DESIGN_SYSTEM.colors.text.primary
              }}
            >
              It's a Match!
            </motion.h2>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
              style={{ color: DESIGN_SYSTEM.colors.text.secondary }}
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
                className="flex-1 h-12"
                style={{
                  borderRadius: DESIGN_SYSTEM.borderRadius.large,
                  borderColor: DESIGN_SYSTEM.colors.primary.lavender,
                  color: DESIGN_SYSTEM.colors.primary.lavender
                }}
              >
                Keep Swiping
              </Button>
              <Button
                onClick={() => {
                  setMatchModal(null);
                  navigate('/matches');
                }}
                className="flex-1 h-12"
                style={{
                  background: DESIGN_SYSTEM.colors.primary.lavender,
                  color: DESIGN_SYSTEM.colors.background.dark,
                  borderRadius: DESIGN_SYSTEM.borderRadius.large,
                  fontWeight: 600
                }}
              >
                Send Message
              </Button>
            </motion.div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Profile View Modal */}
      <Dialog open={!!viewingProfile} onOpenChange={() => setViewingProfile(null)}>
        <DialogContent 
          className="p-0 overflow-hidden"
          style={{
            background: DESIGN_SYSTEM.colors.background.card,
            maxWidth: '400px',
            borderRadius: DESIGN_SYSTEM.borderRadius.xlarge,
            boxShadow: DESIGN_SYSTEM.shadows.elevated
          }}
        >
          {viewingProfile && (
            <div 
              className="p-6"
              style={{ padding: DESIGN_SYSTEM.spacing.xl }}
            >
              <div className="relative h-64 mb-6">
                <img
                  src={viewingProfile.photo}
                  alt={viewingProfile.name}
                  className="w-full h-full object-cover rounded-[24px]"
                  style={{
                    borderRadius: DESIGN_SYSTEM.borderRadius.large,
                    border: `4px solid ${DESIGN_SYSTEM.colors.primary.lavender}`
                  }}
                />
                <div 
                  className="absolute inset-0 rounded-[24px]"
                  style={{
                    background: 'linear-gradient(to top, rgba(45, 45, 45, 0.9) 0%, rgba(45, 45, 45, 0.3) 50%, transparent 100%)'
                  }}
                />
              </div>
              
              <div className="space-y-6">
                <div>
                  <h2 
                    className="text-[32px] font-bold mb-1"
                    style={{ 
                      color: DESIGN_SYSTEM.colors.text.primary,
                      fontFamily: DESIGN_SYSTEM.typography.fonts.subheading
                    }}
                  >
                    {viewingProfile.name}, {viewingProfile.age}
                  </h2>
                  {viewingProfile.occupation && (
                    <p 
                      className="text-[16px] flex items-center gap-2"
                      style={{ color: DESIGN_SYSTEM.colors.primary.lavender }}
                    >
                      <Briefcase className="w-4 h-4" />
                      {viewingProfile.occupation}
                    </p>
                  )}
                </div>

                <div>
                  <h3 
                    className="text-sm font-semibold mb-2"
                    style={{ color: DESIGN_SYSTEM.colors.text.secondary }}
                  >
                    About
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ 
                      color: DESIGN_SYSTEM.colors.text.secondary,
                      lineHeight: 1.8
                    }}
                  >
                    {viewingProfile.bio}
                  </p>
                </div>

                <div>
                  <h3 
                    className="text-sm font-semibold mb-2"
                    style={{ color: DESIGN_SYSTEM.colors.text.secondary }}
                  >
                    Location
                  </h3>
                  <p 
                    className="text-sm flex items-center gap-2"
                    style={{ color: DESIGN_SYSTEM.colors.text.secondary }}
                  >
                    <MapPin className="w-4 h-4" style={{ color: DESIGN_SYSTEM.colors.primary.lavender }} />
                    {viewingProfile.location}
                  </p>
                </div>
                
                <div>
                  <h3 
                    className="text-sm font-semibold mb-2"
                    style={{ color: DESIGN_SYSTEM.colors.text.secondary }}
                  >
                    Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {viewingProfile.interests.map((interest) => (
                      <span
                        key={interest}
                        className="px-3 py-1.5 text-xs font-medium rounded-full"
                        style={{
                          background: `${DESIGN_SYSTEM.colors.primary.lavender}20`,
                          color: DESIGN_SYSTEM.colors.primary.lavender,
                          borderRadius: DESIGN_SYSTEM.borderRadius.small
                        }}
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
                    className="flex-1 h-12"
                    style={{
                      borderRadius: DESIGN_SYSTEM.borderRadius.large,
                      borderColor: DESIGN_SYSTEM.colors.interactive.no,
                      color: DESIGN_SYSTEM.colors.text.primary
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
                    className="flex-1 h-12"
                    style={{
                      background: DESIGN_SYSTEM.colors.primary.lavender,
                      color: DESIGN_SYSTEM.colors.background.dark,
                      borderRadius: DESIGN_SYSTEM.borderRadius.large,
                      fontWeight: 600
                    }}
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    Like
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
