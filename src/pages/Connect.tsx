import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Heart, RotateCcw, MapPin, Briefcase, Info, 
  Zap, Lock, MessageCircle, User, Search, ChevronLeft,
  MoreHorizontal, Calendar, Users, Filter
} from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { ConnectionProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// iOS Design System Constants
const IOS_DESIGN = {
  colors: {
    light: {
      primary: '#000000',
      secondary: 'rgba(60, 60, 67, 0.6)',
      tertiary: 'rgba(60, 60, 67, 0.3)',
      background: {
        primary: '#FFFFFF',
        secondary: '#F2F2F7',
        tertiary: '#FFFFFF',
        grouped: '#F2F2F7',
      },
      system: {
        blue: '#007AFF',
        green: '#34C759',
        indigo: '#5856D6',
        orange: '#FF9500',
        red: '#FF3B30',
        gray: '#8E8E93',
        gray2: '#AEAEB2',
        gray3: '#C7C7CC',
        gray4: '#D1D1D6',
        gray5: '#E5E5EA',
        gray6: '#F2F2F7'
      },
      separator: 'rgba(60, 60, 67, 0.12)'
    },
    dark: {
      primary: '#FFFFFF',
      secondary: 'rgba(235, 235, 245, 0.6)',
      tertiary: 'rgba(235, 235, 245, 0.3)',
      background: {
        primary: '#000000',
        secondary: '#1C1C1E',
        tertiary: '#2C2C2E',
        grouped: '#000000',
      },
      system: {
        blue: '#0A84FF',
        green: '#30D158',
        indigo: '#5E5CE6',
        orange: '#FF9F0A',
        red: '#FF453A',
        gray: '#8E8E93',
        gray2: '#636366',
        gray3: '#48484A',
        gray4: '#3A3A3C',
        gray5: '#2C2C2E',
        gray6: '#1C1C1E'
      },
      separator: 'rgba(84, 84, 88, 0.65)'
    }
  },
  typography: {
    fontFamily: `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif`,
    sizes: {
      largeTitle: { fontSize: '34px', lineHeight: '41px', fontWeight: 400 },
      title1: { fontSize: '28px', lineHeight: '34px', fontWeight: 400 },
      title2: { fontSize: '22px', lineHeight: '28px', fontWeight: 400 },
      title3: { fontSize: '20px', lineHeight: '25px', fontWeight: 400 },
      headline: { fontSize: '17px', lineHeight: '22px', fontWeight: 600 },
      body: { fontSize: '17px', lineHeight: '22px', fontWeight: 400 },
      callout: { fontSize: '16px', lineHeight: '21px', fontWeight: 400 },
      subhead: { fontSize: '15px', lineHeight: '20px', fontWeight: 400 },
      footnote: { fontSize: '13px', lineHeight: '18px', fontWeight: 400 },
      caption1: { fontSize: '12px', lineHeight: '16px', fontWeight: 400 },
      caption2: { fontSize: '11px', lineHeight: '13px', fontWeight: 400 }
    }
  },
  spacing: {
    xs: '8px',
    sm: '16px',
    md: '24px',
    lg: '32px',
    xl: '40px',
    xxl: '48px'
  },
  borderRadius: {
    small: '8px',
    medium: '10px',
    large: '12px',
    xlarge: '20px',
    round: '9999px'
  },
  shadows: {
    subtle: '0 2px 8px rgba(0, 0, 0, 0.04)',
    medium: '0 4px 12px rgba(0, 0, 0, 0.08)',
    strong: '0 8px 24px rgba(0, 0, 0, 0.12)'
  },
  animations: {
    spring: { type: 'spring', stiffness: 300, damping: 30 },
    fast: { duration: 0.2 },
    medium: { duration: 0.3 },
    slow: { duration: 0.4 }
  }
};

// Custom hook for iOS-style theme
const useIOSTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handleChange);
    
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return {
    colors: isDarkMode ? IOS_DESIGN.colors.dark : IOS_DESIGN.colors.light,
    isDarkMode
  };
};

interface ProfileCardProps {
  profile: ConnectionProfile;
  onSwipe: (direction: 'left' | 'right') => void;
  isTop: boolean;
  onViewProfile: () => void;
}

function ProfileCard({ profile, onSwipe, isTop, onViewProfile }: ProfileCardProps) {
  const { colors } = useIOSTheme();
  const [exitX, setExitX] = useState(0);
  const [showHint, setShowHint] = useState<'like' | 'pass' | null>(null);

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (info.offset.x > 120) {
      setExitX(500);
      onSwipe('right');
    } else if (info.offset.x < -120) {
      setExitX(-500);
      onSwipe('left');
    }
  }, [onSwipe]);

  const handleDrag = useCallback((_: unknown, info: PanInfo) => {
    if (info.offset.x > 60) {
      setShowHint('like');
    } else if (info.offset.x < -60) {
      setShowHint('pass');
    } else {
      setShowHint(null);
    }
  }, []);

  return (
    <motion.div
      className="absolute inset-0"
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: -200, right: 200, top: 0, bottom: 0 }}
      dragElastic={0.8}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 20, opacity: isTop ? 1 : 0.7 }}
      animate={{ 
        scale: isTop ? 1 : 0.95, 
        y: isTop ? 0 : 20,
        opacity: isTop ? 1 : 0.7,
      }}
      exit={{ x: exitX, opacity: 0, rotate: exitX * 0.05 }}
      whileDrag={{ cursor: 'grabbing' }}
      style={{ 
        zIndex: isTop ? 10 : 1,
        transformOrigin: 'center'
      }}
      transition={IOS_DESIGN.animations.spring}
    >
      {/* Profile Card Container - iOS Style */}
      <div 
        className="w-full h-full overflow-hidden relative"
        style={{
          background: colors.background.primary,
          borderRadius: IOS_DESIGN.borderRadius.xlarge,
          boxShadow: IOS_DESIGN.shadows.medium,
          border: `1px solid ${colors.separator}`
        }}
      >
        {/* Swipe Hints */}
        <AnimatePresence>
          {showHint === 'like' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -100 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -100 }}
              className="absolute top-8 left-8 z-20 px-6 py-3 rounded-[14px]"
              style={{
                background: colors.system.green + '20',
                border: `2px solid ${colors.system.green}`,
                backdropFilter: 'blur(20px)'
              }}
            >
              <span 
                className="text-[24px] font-bold"
                style={{ color: colors.system.green }}
              >
                LIKE
              </span>
            </motion.div>
          )}
          {showHint === 'pass' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 100 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 100 }}
              className="absolute top-8 right-8 z-20 px-6 py-3 rounded-[14px]"
              style={{
                background: colors.system.red + '20',
                border: `2px solid ${colors.system.red}`,
                backdropFilter: 'blur(20px)'
              }}
            >
              <span 
                className="text-[24px] font-bold"
                style={{ color: colors.system.red }}
              >
                PASS
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Profile Photo */}
        <div className="relative h-[70%]">
          <img
            src={profile.photo}
            alt={profile.name}
            className="w-full h-full object-cover"
            style={{
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0
            }}
            draggable={false}
          />
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.1), transparent 30%)'
            }}
          />
          
          {/* Info Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile();
            }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <Info className="w-5 h-5" style={{ color: colors.primary }} />
          </motion.button>
          
          {/* Event Badge */}
          <div 
            className="absolute top-4 left-4 px-3 py-1.5 rounded-full flex items-center gap-1.5"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <Calendar className="w-3 h-3" style={{ color: colors.primary }} />
            <span 
              className="text-[13px] font-medium"
              style={{ color: colors.primary }}
            >
              {profile.eventName || "Current Event"}
            </span>
          </div>
        </div>

        {/* Profile Info - iOS Style */}
        <div 
          className="p-6"
          style={{ padding: IOS_DESIGN.spacing.lg }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 
                className="mb-1"
                style={IOS_DESIGN.typography.sizes.headline}
              >
                {profile.name}, {profile.age}
              </h2>
              <p 
                className="mb-2"
                style={{
                  ...IOS_DESIGN.typography.sizes.subhead,
                  color: colors.secondary
                }}
              >
                {profile.gender || "Preferred not to say"}
              </p>
            </div>
            {profile.isPublic && (
              <div 
                className="px-2 py-1 rounded-[6px]"
                style={{
                  background: colors.system.green + '20'
                }}
              >
                <span 
                  className="text-[11px] font-medium"
                  style={{ color: colors.system.green }}
                >
                  Checked In
                </span>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {profile.interests.slice(0, 3).map((interest) => (
              <span
                key={interest}
                className="px-3 py-1.5 rounded-full"
                style={{
                  background: colors.background.secondary,
                  ...IOS_DESIGN.typography.sizes.caption1,
                  color: colors.primary
                }}
              >
                {interest}
              </span>
            ))}
            {profile.interests.length > 3 && (
              <span 
                className="px-3 py-1.5 rounded-full"
                style={{
                  background: colors.background.secondary,
                  ...IOS_DESIGN.typography.sizes.caption1,
                  color: colors.secondary
                }}
              >
                +{profile.interests.length - 3}
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
  const { colors } = useIOSTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [matchModal, setMatchModal] = useState<ConnectionProfile | null>(null);
  const [viewingProfile, setViewingProfile] = useState<ConnectionProfile | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  // Filter profiles
  const availableProfiles = useMemo(() => {
    if (isDemo) return connectionProfiles;
    const userEventIds = tickets.map(t => t.eventId);
    return connectionProfiles.filter(p => userEventIds.includes(p.eventId));
  }, [connectionProfiles, tickets, isDemo]);

  const visibleProfiles = availableProfiles.slice(currentIndex, currentIndex + 2).reverse();
  const noMoreProfiles = currentIndex >= availableProfiles.length;

  // Get current event
  const currentEventName = useMemo(() => {
    if (isDemo && availableProfiles.length > 0) {
      return availableProfiles[0].eventName || "Windhoek Jazz Night";
    }
    if (tickets.length > 0) {
      return tickets[0].eventName || "Current Event";
    }
    return "Nearby";
  }, [isDemo, availableProfiles, tickets]);

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

  const likesRemaining = user?.subscription.tier === 'free' 
    ? (user.likesRemaining ?? 10)
    : '∞';

  // No active events state
  if (!hasActiveEvents) {
    return (
      <div 
        className="min-h-screen"
        style={{
          background: colors.background.primary,
          fontFamily: IOS_DESIGN.typography.fontFamily
        }}
      >
        {/* iOS Navigation Header */}
        <div 
          className="sticky top-0 z-50 px-4 pt-12 pb-4"
          style={{
            background: colors.background.primary,
            borderBottom: `1px solid ${colors.separator}`,
            backdropFilter: 'blur(20px)'
          }}
        >
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1"
              style={{ color: colors.system.blue }}
            >
              <ChevronLeft className="w-5 h-5" />
              <span style={IOS_DESIGN.typography.sizes.body}>Back</span>
            </button>
            <h1 style={IOS_DESIGN.typography.sizes.title3}>Connect</h1>
            <div className="w-10"></div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{
              background: colors.background.secondary,
            }}
          >
            <Lock className="w-10 h-10" style={{ color: colors.secondary }} />
          </div>
          <h2 
            className="mb-3 text-center"
            style={IOS_DESIGN.typography.sizes.title3}
          >
            Check In to Connect
          </h2>
          <p 
            className="text-center mb-6 max-w-xs"
            style={{
              ...IOS_DESIGN.typography.sizes.body,
              color: colors.secondary
            }}
          >
            To start connecting with people, you need to be checked in at an event.
          </p>
          <button
            onClick={() => navigate('/events')}
            className="w-full max-w-[280px] h-[50px] rounded-[12px] flex items-center justify-center gap-2"
            style={{
              background: colors.system.blue,
              color: '#FFFFFF'
            }}
          >
            <span style={IOS_DESIGN.typography.sizes.headline}>
              Browse Events
            </span>
          </button>
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen pb-[calc(49px+env(safe-area-inset-bottom))]"
      style={{
        background: colors.background.primary,
        fontFamily: IOS_DESIGN.typography.fontFamily,
        paddingBottom: 'calc(49px + env(safe-area-inset-bottom))'
      }}
    >
      {/* iOS Navigation Header */}
      <div 
        className="sticky top-0 z-50 px-4 pt-12 pb-4"
        style={{
          background: colors.background.primary,
          borderBottom: `1px solid ${colors.separator}`,
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h1 style={IOS_DESIGN.typography.sizes.title3}>
            {currentEventName}
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-8 h-8 flex items-center justify-center"
            >
              <Search className="w-5 h-5" style={{ color: colors.system.blue }} />
            </button>
            <button
              onClick={() => navigate('/connect/filters')}
              className="w-8 h-8 flex items-center justify-center"
            >
              <Filter className="w-5 h-5" style={{ color: colors.system.blue }} />
            </button>
          </div>
        </div>
        
        {/* Subtitle */}
        <p 
          style={{
            ...IOS_DESIGN.typography.sizes.subhead,
            color: colors.secondary
          }}
        >
          {availableProfiles.length - currentIndex} people here • {likesRemaining} likes today
        </p>
        
        {/* Search Bar (when active) */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <div 
                className="h-10 rounded-[10px] flex items-center px-3"
                style={{
                  background: colors.background.secondary
                }}
              >
                <Search className="w-4 h-4 mr-3" style={{ color: colors.secondary }} />
                <input
                  type="text"
                  placeholder="Search people..."
                  className="flex-1 bg-transparent outline-none"
                  style={{
                    ...IOS_DESIGN.typography.sizes.body,
                    color: colors.primary
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="px-4 pt-6">
        {/* Card Stack */}
        <div className="relative h-[480px] w-full mx-auto mb-8">
          {noMoreProfiles ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="text-center px-4">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{
                    background: colors.background.secondary,
                  }}
                >
                  <Users className="w-10 h-10" style={{ color: colors.secondary }} />
                </div>
                <h3 
                  className="mb-3"
                  style={IOS_DESIGN.typography.sizes.title3}
                >
                  That's Everyone!
                </h3>
                <p 
                  className="mb-6"
                  style={{
                    ...IOS_DESIGN.typography.sizes.body,
                    color: colors.secondary
                  }}
                >
                  Check back later for more connections.
                </p>
                <button
                  onClick={() => navigate('/events')}
                  className="h-[44px] px-6 rounded-[12px]"
                  style={{
                    background: colors.background.secondary,
                    color: colors.system.blue,
                    ...IOS_DESIGN.typography.sizes.body
                  }}
                >
                  Find More Events
                </button>
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

        {/* Action Buttons - iOS Style */}
        {!noMoreProfiles && (
          <div className="flex justify-center items-center gap-8 mb-6">
            {/* Undo Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleUndo}
              disabled={history.length === 0}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                history.length === 0 && "opacity-30"
              )}
              style={{
                background: colors.background.secondary,
                border: `1px solid ${colors.separator}`
              }}
            >
              <RotateCcw className="w-5 h-5" style={{ color: colors.primary }} />
            </motion.button>

            {/* Pass Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe('left')}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
              style={{
                background: colors.background.primary,
                border: `2px solid ${colors.system.red}`,
                boxShadow: `0 4px 12px ${colors.system.red}20`
              }}
            >
              <X className="w-7 h-7" style={{ color: colors.system.red }} />
            </motion.button>

            {/* Like Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe('right')}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
              style={{
                background: colors.system.green,
                boxShadow: `0 4px 12px ${colors.system.green}40`
              }}
            >
              <Heart className="w-7 h-7" fill="#FFFFFF" color="#FFFFFF" />
            </motion.button>

            {/* Info Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => visibleProfiles[visibleProfiles.length - 1] && 
                setViewingProfile(visibleProfiles[visibleProfiles.length - 1])}
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: colors.background.secondary,
                border: `1px solid ${colors.separator}`
              }}
            >
              <Info className="w-5 h-5" style={{ color: colors.primary }} />
            </motion.button>
          </div>
        )}

        {/* Tips */}
        <div 
          className="p-4 rounded-[12px] mb-6"
          style={{
            background: colors.background.secondary,
            border: `1px solid ${colors.separator}`
          }}
        >
          <p 
            className="text-center"
            style={{
              ...IOS_DESIGN.typography.sizes.footnote,
              color: colors.secondary
            }}
          >
            💡 Swipe right to like, left to pass • Tap info for details
          </p>
        </div>
      </div>

      {/* Match Modal - iOS Action Sheet Style */}
      <Dialog open={!!matchModal} onOpenChange={() => setMatchModal(null)}>
        <DialogContent 
          className="p-0 border-0 max-w-[500px] mx-4"
          style={{
            borderRadius: IOS_DESIGN.borderRadius.xlarge,
            background: colors.background.primary,
            boxShadow: '0 0 40px rgba(0,0,0,0.2)',
            margin: '20px',
            overflow: 'hidden'
          }}
        >
          <div className="relative">
            {/* Drag Handle */}
            <div className="flex justify-center pt-3">
              <div 
                className="w-10 h-1 rounded-full"
                style={{ background: colors.separator }}
              />
            </div>

            <motion.div 
              className="py-8 px-6 text-center"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={IOS_DESIGN.animations.spring}
            >
              {/* Match Animation */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <motion.div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${colors.system.green} 0%, ${colors.system.blue} 100%)`
                  }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <img
                  src={matchModal?.photo}
                  alt={matchModal?.name}
                  className="w-full h-full rounded-full object-cover border-4 relative z-10"
                  style={{
                    borderColor: colors.background.primary,
                  }}
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center z-20 border-4"
                  style={{
                    background: colors.system.green,
                    borderColor: colors.background.primary,
                  }}
                >
                  <Heart className="w-4 h-4" fill="#FFFFFF" color="#FFFFFF" />
                </motion.div>
              </div>
              
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-2"
                style={IOS_DESIGN.typography.sizes.title3}
              >
                It's a Match!
              </motion.h2>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
                style={{
                  ...IOS_DESIGN.typography.sizes.body,
                  color: colors.secondary
                }}
              >
                You and {matchModal?.name} liked each other
              </motion.p>
              
              <div className="space-y-3">
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => {
                    setMatchModal(null);
                    navigate('/matches');
                  }}
                  className="w-full h-[50px] rounded-[12px] flex items-center justify-center gap-2"
                  style={{
                    background: colors.system.blue,
                    color: '#FFFFFF'
                  }}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span style={IOS_DESIGN.typography.sizes.headline}>
                    Send Message
                  </span>
                </motion.button>
                
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => setMatchModal(null)}
                  className="w-full h-[44px] rounded-[12px]"
                  style={{
                    background: colors.background.secondary,
                    color: colors.system.blue,
                    ...IOS_DESIGN.typography.sizes.body
                  }}
                >
                  Keep Swiping
                </motion.button>
              </div>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Detail Sheet - iOS Style */}
      <Dialog open={!!viewingProfile} onOpenChange={() => setViewingProfile(null)}>
        <DialogContent 
          className="p-0 border-0 max-w-[500px] mx-4"
          style={{
            borderRadius: IOS_DESIGN.borderRadius.xlarge,
            background: colors.background.primary,
            boxShadow: '0 0 40px rgba(0,0,0,0.2)',
            margin: '20px',
            maxHeight: '85vh',
            overflow: 'hidden'
          }}
        >
          {viewingProfile && (
            <div className="flex flex-col h-full">
              {/* Drag Handle */}
              <div className="flex justify-center pt-3">
                <div 
                  className="w-10 h-1 rounded-full"
                  style={{ background: colors.separator }}
                />
              </div>

              <div className="overflow-y-auto flex-1">
                {/* Profile Header */}
                <div className="relative h-56">
                  <img
                    src={viewingProfile.photo}
                    alt={viewingProfile.name}
                    className="w-full h-full object-cover"
                  />
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent 40%)'
                    }}
                  />
                  
                  {/* Back Button */}
                  <button
                    onClick={() => setViewingProfile(null)}
                    className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      backdropFilter: 'blur(20px)'
                    }}
                  >
                    <ChevronLeft className="w-5 h-5" style={{ color: '#FFFFFF' }} />
                  </button>
                  
                  {/* Like Button */}
                  <button
                    onClick={() => {
                      setViewingProfile(null);
                      handleSwipe('right');
                    }}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: colors.system.green,
                      color: '#FFFFFF'
                    }}
                  >
                    <Heart className="w-5 h-5" fill="#FFFFFF" color="#FFFFFF" />
                  </button>
                </div>
                
                {/* Profile Content */}
                <div className="p-6">
                  <div className="mb-6">
                    <h2 
                      className="mb-1"
                      style={IOS_DESIGN.typography.sizes.title3}
                    >
                      {viewingProfile.name}, {viewingProfile.age}
                    </h2>
                    {viewingProfile.gender && (
                      <p 
                        className="mb-3"
                        style={{
                          ...IOS_DESIGN.typography.sizes.body,
                          color: colors.secondary
                        }}
                      >
                        {viewingProfile.gender}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mb-4">
                      {viewingProfile.occupation && (
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4" style={{ color: colors.secondary }} />
                          <span style={{
                            ...IOS_DESIGN.typography.sizes.footnote,
                            color: colors.secondary
                          }}>
                            {viewingProfile.occupation}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" style={{ color: colors.secondary }} />
                        <span style={{
                          ...IOS_DESIGN.typography.sizes.footnote,
                          color: colors.secondary
                        }}>
                          {viewingProfile.location}
                        </span>
                      </div>
                    </div>
                    
                    {viewingProfile.isPublic && (
                      <div 
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] mb-4"
                        style={{
                          background: colors.system.green + '20'
                        }}
                      >
                        <Zap className="w-3 h-3" style={{ color: colors.system.green }} />
                        <span style={{
                          ...IOS_DESIGN.typography.sizes.caption1,
                          color: colors.system.green
                        }}>
                          Checked In
                        </span>
                      </div>
                    )}
                  </div>

                  {/* About Section */}
                  {viewingProfile.bio && (
                    <div className="mb-6">
                      <h3 
                        className="mb-3"
                        style={{
                          ...IOS_DESIGN.typography.sizes.headline,
                          color: colors.primary
                        }}
                      >
                        About
                      </h3>
                      <p 
                        style={{
                          ...IOS_DESIGN.typography.sizes.body,
                          color: colors.secondary,
                          lineHeight: '1.6'
                        }}
                      >
                        {viewingProfile.bio}
                      </p>
                    </div>
                  )}
                  
                  {/* Interests */}
                  {viewingProfile.interests && viewingProfile.interests.length > 0 && (
                    <div>
                      <h3 
                        className="mb-3"
                        style={{
                          ...IOS_DESIGN.typography.sizes.headline,
                          color: colors.primary
                        }}
                      >
                        Interests
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {viewingProfile.interests.map((interest) => (
                          <span
                            key={interest}
                            className="px-3 py-2 rounded-[10px]"
                            style={{
                              background: colors.background.secondary,
                              ...IOS_DESIGN.typography.sizes.callout,
                              color: colors.primary
                            }}
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div 
                className="p-4 border-t"
                style={{ borderColor: colors.separator }}
              >
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setViewingProfile(null);
                      handleSwipe('left');
                    }}
                    className="flex-1 h-[50px] rounded-[12px] flex items-center justify-center gap-2"
                    style={{
                      background: colors.background.secondary,
                      color: colors.system.red,
                      border: `1px solid ${colors.separator}`
                    }}
                  >
                    <X className="w-5 h-5" />
                    <span style={IOS_DESIGN.typography.sizes.headline}>
                      Pass
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setViewingProfile(null);
                      handleSwipe('right');
                    }}
                    className="flex-1 h-[50px] rounded-[12px] flex items-center justify-center gap-2"
                    style={{
                      background: colors.system.green,
                      color: '#FFFFFF'
                    }}
                  >
                    <Heart className="w-5 h-5" fill="#FFFFFF" color="#FFFFFF" />
                    <span style={IOS_DESIGN.typography.sizes.headline}>
                      Like
                    </span>
                  </button>
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
