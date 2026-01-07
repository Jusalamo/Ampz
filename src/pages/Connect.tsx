import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Heart, RotateCcw, Sparkles, MapPin, Briefcase, Info, Zap, Lock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { ConnectionProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Apple HIG Design System Constants
const APPLE_HIG = {
  spacing: {
    xs: '8px',    // 8pt grid
    sm: '16px',   // Standard margin
    md: '24px',   // Between major elements
    lg: '32px',   // Section spacing
    xl: '40px',   // Large spacing
    xxl: '48px'   // Major section spacing
  },
  sizing: {
    touchTarget: '44px',      // Minimum touch target
    buttonHeight: '50px',     // Filled button height
    segmentedControl: '32px', // Segmented control height
    listRow: '44px',         // Minimum list row height
    inputHeight: '44px',     // Input field height
    switchHeight: '31px',    // Switch height
    switchWidth: '51px',     // Switch width
    tabBarHeight: '49px',    // Tab bar height
    iconSize: '28px',        // Tab bar icon size
    modalTopRadius: '20px',  // Modal corner radius
    cardRadius: '12px',      // Card corner radius
    largeCardRadius: '20px'  // Large card radius
  },
  typography: {
    button: {
      size: '17px',
      weight: '600' // Semi-bold
    },
    body: {
      size: '17px',
      weight: '400' // Regular
    },
    caption: {
      size: '13px',
      weight: '600' // Bold for section headers
    },
    small: {
      size: '10px', // Tab bar labels
      weight: '400'
    }
  },
  colors: {
    // Keeping your existing theme colors
    primary: '#C4B5FD',      // Your lavender as primary
    destructive: '#FF3B30',  // Apple red
    background: {
      dark: '#1A1A1A',
      card: '#2D2D2D'
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B8B8B8',
      tertiary: '#8E8E93'    // Apple gray
    },
    system: {
      blue: '#007AFF',       // Apple system blue
      gray: '#8E8E93',       // Apple system gray
      gray2: '#636366',      // Apple system gray 2
      gray3: '#48484A',      // Apple system gray 3
      gray4: '#3A3A3C',      // Apple system gray 4
      gray5: '#2C2C2E',      // Apple system gray 5
      gray6: '#1C1C1E'       // Apple system gray 6
    }
  },
  shadows: {
    card: '0 2px 8px rgba(0, 0, 0, 0.04)',
    button: '0 4px 12px rgba(0, 0, 0, 0.08)'
  },
  animations: {
    spring: {
      tension: 300,
      friction: 30,
      duration: '0.65s',
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
    },
    microInteraction: {
      scale: 0.95,
      duration: '0.2s'
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
      initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 12, opacity: isTop ? 1 : 0.6 }}
      animate={{ 
        scale: isTop ? 1 : 0.95, 
        y: isTop ? 0 : 12,
        opacity: isTop ? 1 : 0.6
      }}
      exit={{ x: exitX, opacity: 0, rotateZ: exitX > 0 ? 15 : -15 }}
      whileTap={{ scale: 0.95 }} // Micro-interaction on press
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
      {/* Profile Card Container - Apple HIG Style */}
      <div 
        className="w-full h-full overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, #C4B5FD 0%, #E9D5FF 100%)',
          borderRadius: APPLE_HIG.sizing.largeCardRadius,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: APPLE_HIG.shadows.card
        }}
      >
        {/* Swipe Hints */}
        <AnimatePresence>
          {showHint === 'like' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-4 left-4 z-20 px-3 py-2 border-2 border-white/30 rounded-xl rotate-[-15deg] backdrop-blur-md"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: APPLE_HIG.sizing.cardRadius
              }}
            >
              <span 
                className="text-[20px] font-semibold"
                style={{ color: APPLE_HIG.colors.primary }}
              >
                LIKE
              </span>
            </motion.div>
          )}
          {showHint === 'pass' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-4 right-4 z-20 px-3 py-2 border-2 border-white/30 rounded-xl rotate-[15deg] backdrop-blur-md"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: APPLE_HIG.sizing.cardRadius
              }}
            >
              <span 
                className="text-[20px] font-semibold"
                style={{ color: APPLE_HIG.colors.text.tertiary }}
              >
                PASS
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Profile Photo */}
        <div className="relative h-[70%]"> {/* Adjusted for better fit */}
          <img
            src={profile.photo}
            alt={profile.name}
            className="w-full h-full object-cover"
            style={{
              borderBottomLeftRadius: APPLE_HIG.sizing.cardRadius,
              borderBottomRightRadius: APPLE_HIG.sizing.cardRadius
            }}
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* View Profile Button - Apple HIG touch target */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile();
            }}
            className="absolute top-3 right-3 flex items-center justify-center hover:opacity-80 active:scale-95 transition-all"
            style={{
              width: APPLE_HIG.sizing.touchTarget,
              height: APPLE_HIG.sizing.touchTarget,
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(20px)',
              borderRadius: APPLE_HIG.sizing.cardRadius
            }}
          >
            <Info className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Profile Info - SIMPLIFIED: Only name, age, gender */}
        <div 
          className="absolute bottom-0 left-0 right-0 p-4"
          style={{ 
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent)',
            borderBottomLeftRadius: APPLE_HIG.sizing.largeCardRadius,
            borderBottomRightRadius: APPLE_HIG.sizing.largeCardRadius
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <h2 
              className="text-[20px] font-semibold"
              style={{ 
                color: APPLE_HIG.colors.text.primary,
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
              }}
            >
              {profile.name}
            </h2>
            <span 
              className="text-[20px]"
              style={{ 
                color: APPLE_HIG.colors.text.secondary,
                opacity: 0.9
              }}
            >
              {profile.age}
            </span>
          </div>
          
          {/* Gender/Identity - Centered badge */}
          <div className="flex justify-center">
            <div 
              className="px-3 py-1.5 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: APPLE_HIG.sizing.cardRadius,
                minHeight: APPLE_HIG.sizing.touchTarget
              }}
            >
              <span 
                className="text-[15px] font-medium text-center"
                style={{ 
                  color: APPLE_HIG.colors.text.primary,
                  lineHeight: '1.2'
                }}
              >
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

  // Filter profiles based on demo mode or user's checked-in events
  const availableProfiles = useMemo(() => {
    if (isDemo) {
      return connectionProfiles;
    }
    const userEventIds = tickets.map(t => t.eventId);
    return connectionProfiles.filter(p => userEventIds.includes(p.eventId));
  }, [connectionProfiles, tickets, isDemo]);

  const visibleProfiles = availableProfiles.slice(currentIndex, currentIndex + 2).reverse();
  const noMoreProfiles = currentIndex >= availableProfiles.length;

  // Get current event name for header
  const currentEventName = useMemo(() => {
    if (isDemo && availableProfiles.length > 0) {
      return availableProfiles[0].eventName || "Windhoek Jazz Night";
    }
    if (tickets.length > 0) {
      return tickets[0].eventName || "Current Event";
    }
    return "Connect";
  }, [isDemo, availableProfiles, tickets]);

  // Check if user has any active events to connect at
  const hasActiveEvents = isDemo || tickets.length > 0;

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (direction === 'right') {
      if (user?.subscription.tier === 'free' && (user.likesRemaining ?? 0) <= 0) {
        toast({
          title: 'Daily Limit Reached',
          description: 'Upgrade to Pro for unlimited likes!',
          variant: 'destructive',
        });
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
        className="app-container min-h-screen"
        style={{
          background: APPLE_HIG.colors.background.dark,
          padding: APPLE_HIG.spacing.sm,
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
        }}
      >
        <div 
          className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-4"
          style={{ paddingTop: '20px' }}
        >
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{
              background: 'rgba(196, 181, 253, 0.1)',
              borderRadius: APPLE_HIG.sizing.largeCardRadius
            }}
          >
            <Lock className="w-10 h-10" style={{ color: APPLE_HIG.colors.primary }} />
          </div>
          <h2 
            className="text-[28px] font-bold mb-3 text-center"
            style={{ 
              color: APPLE_HIG.colors.text.primary,
              fontWeight: '700'
            }}
          >
            Check In to Connect
          </h2>
          <p 
            className="text-center mb-6 max-w-xs"
            style={{ 
              color: APPLE_HIG.colors.text.secondary,
              fontSize: '17px',
              lineHeight: '1.4'
            }}
          >
            To start connecting with people, you need to be checked in at an event. 
            Get tickets and check in to see who's there!
          </p>
          <Button 
            onClick={() => navigate('/events')} 
            className="w-full max-w-[280px] active:scale-95"
            style={{
              height: APPLE_HIG.sizing.buttonHeight,
              background: APPLE_HIG.colors.primary,
              color: APPLE_HIG.colors.background.dark,
              borderRadius: APPLE_HIG.sizing.cardRadius,
              fontSize: APPLE_HIG.typography.button.size,
              fontWeight: APPLE_HIG.typography.button.weight,
              marginBottom: APPLE_HIG.spacing.lg
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
      className="app-container"
      style={{
        background: APPLE_HIG.colors.background.dark,
        padding: APPLE_HIG.spacing.sm,
        paddingBottom: `calc(${APPLE_HIG.sizing.tabBarHeight} + 20px)`, // Space for tab bar
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between mb-4"
        style={{ paddingTop: '8px' }}
      >
        <div>
          <h1 
            className="text-[34px] font-bold mb-1"
            style={{ 
              color: APPLE_HIG.colors.text.primary,
              fontWeight: '700'
            }}
          >
            {currentEventName}
          </h1>
          <p 
            className="text-[15px]"
            style={{ 
              color: APPLE_HIG.colors.text.secondary,
              opacity: 0.8
            }}
          >
            {availableProfiles.length - currentIndex} people here
          </p>
        </div>
        <div className="flex items-center">
          {/* Likes Counter - Apple HIG style */}
          <div 
            className="flex items-center gap-2 px-3 py-2 rounded-full"
            style={{
              background: 'rgba(255, 184, 230, 0.1)',
              borderRadius: APPLE_HIG.sizing.cardRadius
            }}
          >
            <Heart className="w-4 h-4" style={{ color: APPLE_HIG.colors.primary }} />
            <span 
              className="text-[15px] font-semibold"
              style={{ color: APPLE_HIG.colors.primary }}
            >
              {likesRemaining}
            </span>
          </div>
        </div>
      </div>

      {/* Card Stack - Fixed height to prevent scrolling */}
      <div 
        className="relative w-full mx-auto mb-4"
        style={{ 
          height: 'calc(100vh - 280px)', // Dynamic height calculation
          maxHeight: '500px',
          flexShrink: 0
        }}
      >
        {noMoreProfiles ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="text-center px-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{
                  background: 'rgba(196, 181, 253, 0.1)',
                  borderRadius: APPLE_HIG.sizing.largeCardRadius
                }}
              >
                <Heart className="w-8 h-8" style={{ color: APPLE_HIG.colors.primary }} />
              </div>
              <h3 
                className="text-[22px] font-bold mb-2"
                style={{ 
                  color: APPLE_HIG.colors.text.primary,
                  fontWeight: '600'
                }}
              >
                That's Everyone!
              </h3>
              <p 
                className="text-[15px] mb-4"
                style={{ 
                  color: APPLE_HIG.colors.text.secondary,
                  lineHeight: '1.4'
                }}
              >
                Check back later for more connections.
              </p>
              <Button 
                onClick={() => navigate('/events')} 
                variant="outline" 
                className="w-full max-w-[200px] active:scale-95"
                style={{
                  height: APPLE_HIG.sizing.buttonHeight,
                  borderColor: APPLE_HIG.colors.primary,
                  color: APPLE_HIG.colors.primary,
                  borderRadius: APPLE_HIG.sizing.cardRadius,
                  fontSize: APPLE_HIG.typography.button.size,
                  fontWeight: APPLE_HIG.typography.button.weight
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

      {/* Action Buttons - Apple HIG spacing */}
      {!noMoreProfiles && (
        <div 
          className="flex justify-center items-center gap-4 mb-6"
          style={{ marginTop: 'auto' }} // Push to bottom
        >
          {/* Pass Button - 44px minimum touch target */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSwipe('left')}
            className="flex items-center justify-center transition-all active:scale-95"
            style={{
              width: APPLE_HIG.sizing.touchTarget,
              height: APPLE_HIG.sizing.touchTarget,
              background: 'rgba(74, 74, 74, 0.8)',
              backdropFilter: 'blur(20px)',
              color: APPLE_HIG.colors.text.primary,
              borderRadius: APPLE_HIG.sizing.round,
              boxShadow: APPLE_HIG.shadows.button
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
              "flex items-center justify-center transition-all active:scale-95",
              history.length === 0 && "opacity-30"
            )}
            style={{
              width: '40px',
              height: '40px',
              background: 'transparent',
              color: APPLE_HIG.colors.text.secondary,
              borderRadius: APPLE_HIG.sizing.round,
              border: `1px solid ${APPLE_HIG.colors.text.secondary}`
            }}
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>

          {/* Like Button - 44px minimum touch target */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSwipe('right')}
            className="flex items-center justify-center transition-all active:scale-95"
            style={{
              width: APPLE_HIG.sizing.touchTarget,
              height: APPLE_HIG.sizing.touchTarget,
              background: '#FFB8E6',
              color: APPLE_HIG.colors.background.dark,
              borderRadius: APPLE_HIG.sizing.round,
              boxShadow: '0 4px 16px rgba(255, 184, 230, 0.3)',
              fontSize: '17px',
              fontWeight: '600'
            }}
          >
            <Heart className="w-6 h-6" />
          </motion.button>
        </div>
      )}

      {/* Maybe Later Button - Text button style */}
      {!noMoreProfiles && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="mx-auto block mb-8 transition-all"
          style={{
            background: 'transparent',
            color: APPLE_HIG.colors.text.secondary,
            fontSize: '15px',
            border: 'none',
            padding: '8px 16px',
            opacity: 0.8
          }}
        >
          Maybe Later
        </motion.button>
      )}

      {/* Match Modal - Apple HIG bottom sheet */}
      <Dialog open={!!matchModal} onOpenChange={() => setMatchModal(null)}>
        <DialogContent 
          className="p-0 border-0 rounded-t-[20px] rounded-b-none bottom-0 fixed max-w-none w-full"
          style={{
            background: APPLE_HIG.colors.system.gray6,
            borderRadius: `${APPLE_HIG.sizing.modalTopRadius} ${APPLE_HIG.sizing.modalTopRadius} 0 0`,
            maxHeight: '90vh',
            margin: 0,
            bottom: 0,
            left: 0,
            right: 0,
            transform: 'none',
            top: 'auto'
          }}
        >
          {/* Drag handle */}
          <div className="w-full flex justify-center pt-3 pb-2">
            <div 
              className="w-9 h-1 rounded-full"
              style={{ background: APPLE_HIG.colors.system.gray2 }}
            />
          </div>

          <motion.div 
            className="py-6 px-5"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30
            }}
          >
            {/* Celebration Animation */}
            <div className="relative w-20 h-20 mx-auto mb-5">
              <motion.div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${APPLE_HIG.colors.primary} 0%, #E9D5FF 100%)`
                }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <img
                src={matchModal?.photo}
                alt={matchModal?.name}
                className="w-full h-full rounded-full object-cover border-4 relative z-10"
                style={{
                  borderColor: APPLE_HIG.colors.system.gray6,
                  borderRadius: APPLE_HIG.sizing.round
                }}
              />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center z-20 border-2"
                style={{
                  background: '#D4AF37',
                  borderColor: APPLE_HIG.colors.system.gray6,
                  borderRadius: APPLE_HIG.sizing.round
                }}
              >
                <Heart className="w-3 h-3 text-white fill-white" />
              </motion.div>
            </div>
            
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-[28px] font-bold mb-2 text-center"
              style={{ 
                color: APPLE_HIG.colors.text.primary,
                fontWeight: '700'
              }}
            >
              It's a Match!
            </motion.h2>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6 text-center"
              style={{ 
                color: APPLE_HIG.colors.text.secondary,
                fontSize: '17px'
              }}
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
                className="flex-1 h-12 active:scale-95"
                style={{
                  borderRadius: APPLE_HIG.sizing.cardRadius,
                  borderColor: APPLE_HIG.colors.system.gray4,
                  color: APPLE_HIG.colors.text.primary,
                  fontSize: '17px',
                  fontWeight: '600'
                }}
              >
                Keep Swiping
              </Button>
              <Button
                onClick={() => {
                  setMatchModal(null);
                  navigate('/matches');
                }}
                className="flex-1 h-12 active:scale-95"
                style={{
                  background: APPLE_HIG.colors.primary,
                  color: APPLE_HIG.colors.background.dark,
                  borderRadius: APPLE_HIG.sizing.cardRadius,
                  fontSize: '17px',
                  fontWeight: '600'
                }}
              >
                Message
              </Button>
            </motion.div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Profile View Modal - Apple HIG bottom sheet */}
      <Dialog open={!!viewingProfile} onOpenChange={() => setViewingProfile(null)}>
        <DialogContent 
          className="p-0 border-0 rounded-t-[20px] rounded-b-none bottom-0 fixed max-w-none w-full"
          style={{
            background: APPLE_HIG.colors.system.gray6,
            borderRadius: `${APPLE_HIG.sizing.modalTopRadius} ${APPLE_HIG.sizing.modalTopRadius} 0 0`,
            maxHeight: '90vh',
            margin: 0,
            bottom: 0,
            left: 0,
            right: 0,
            transform: 'none',
            top: 'auto'
          }}
        >
          {/* Drag handle */}
          <div className="w-full flex justify-center pt-3 pb-2">
            <div 
              className="w-9 h-1 rounded-full"
              style={{ background: APPLE_HIG.colors.system.gray2 }}
            />
          </div>

          <div className="overflow-y-auto flex-1 max-h-[80vh]">
            {viewingProfile && (
              <div className="flex flex-col">
                <div className="relative h-56">
                  <img
                    src={viewingProfile.photo}
                    alt={viewingProfile.name}
                    className="w-full h-full object-cover"
                  />
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(to top, rgba(28, 28, 30, 0.95), rgba(28, 28, 30, 0.4), transparent)'
                    }}
                  />
                  
                  {/* Close button */}
                  <button
                    onClick={() => setViewingProfile(null)}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center active:scale-95"
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      backdropFilter: 'blur(20px)',
                      borderRadius: APPLE_HIG.sizing.cardRadius
                    }}
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                
                <div className="p-5 space-y-6">
                  <div>
                    <h2 
                      className="text-[28px] font-bold mb-1"
                      style={{ 
                        color: APPLE_HIG.colors.text.primary,
                        fontWeight: '700'
                      }}
                    >
                      {viewingProfile.name}, {viewingProfile.age}
                    </h2>
                    {viewingProfile.gender && (
                      <p 
                        className="text-[17px] mb-2"
                        style={{ color: APPLE_HIG.colors.text.secondary }}
                      >
                        {viewingProfile.gender}
                      </p>
                    )}
                    {viewingProfile.occupation && (
                      <div className="flex items-center gap-2 mt-2">
                        <Briefcase className="w-4 h-4" style={{ color: APPLE_HIG.colors.primary }} />
                        <span 
                          className="text-[15px]"
                          style={{ color: APPLE_HIG.colors.primary }}
                        >
                          {viewingProfile.occupation}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 
                      className="text-[13px] font-semibold mb-3 uppercase tracking-wider"
                      style={{ 
                        color: APPLE_HIG.colors.text.tertiary,
                        fontWeight: '600'
                      }}
                    >
                      About
                    </h3>
                    <p 
                      className="text-[17px]"
                      style={{ 
                        color: APPLE_HIG.colors.text.secondary,
                        lineHeight: '1.5'
                      }}
                    >
                      {viewingProfile.bio}
                    </p>
                  </div>

                  <div>
                    <h3 
                      className="text-[13px] font-semibold mb-3 uppercase tracking-wider"
                      style={{ 
                        color: APPLE_HIG.colors.text.tertiary,
                        fontWeight: '600'
                      }}
                    >
                      Location
                    </h3>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" style={{ color: APPLE_HIG.colors.primary }} />
                      <span 
                        className="text-[17px]"
                        style={{ color: APPLE_HIG.colors.text.secondary }}
                      >
                        {viewingProfile.location}
                      </span>
                    </div>
                  </div>
                  
                  {viewingProfile.interests && viewingProfile.interests.length > 0 && (
                    <div>
                      <h3 
                        className="text-[13px] font-semibold mb-3 uppercase tracking-wider"
                        style={{ 
                          color: APPLE_HIG.colors.text.tertiary,
                          fontWeight: '600'
                        }}
                      >
                        Interests
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {viewingProfile.interests.map((interest) => (
                          <span
                            key={interest}
                            className="px-3 py-1.5 text-[14px] font-medium"
                            style={{
                              background: 'rgba(196, 181, 253, 0.1)',
                              color: APPLE_HIG.colors.primary,
                              borderRadius: APPLE_HIG.sizing.cardRadius
                            }}
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons at bottom - Apple HIG style */}
                <div 
                  className="p-5 border-t"
                  style={{ 
                    borderColor: APPLE_HIG.colors.system.gray4,
                    paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))'
                  }}
                >
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setViewingProfile(null);
                        handleSwipe('left');
                      }}
                      className="flex-1 h-12 active:scale-95"
                      style={{
                        borderRadius: APPLE_HIG.sizing.cardRadius,
                        borderColor: APPLE_HIG.colors.system.gray4,
                        color: APPLE_HIG.colors.text.primary,
                        fontSize: '17px',
                        fontWeight: '600'
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
                      className="flex-1 h-12 active:scale-95"
                      style={{
                        background: APPLE_HIG.colors.primary,
                        color: APPLE_HIG.colors.background.dark,
                        borderRadius: APPLE_HIG.sizing.cardRadius,
                        fontSize: '17px',
                        fontWeight: '600'
                      }}
                    >
                      <Heart className="w-5 h-5 mr-2" />
                      Like
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom spacing for safe area */}
      <div style={{ height: '20px' }} />
      
      <BottomNav />
    </div>
  );
}
