import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Heart, RotateCcw, Sparkles, MapPin, Briefcase, Info, ChevronRight, Zap, Lock, AlertCircle, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { ConnectionProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Design System Constants following Apple HIG
const APPLE_HIG = {
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '40px',
    xxxl: '48px'
  },
  typography: {
    sizes: {
      largeTitle: '34px',
      title1: '28px',
      title2: '22px',
      title3: '20px',
      body: '17px',
      callout: '16px',
      subhead: '15px',
      footnote: '13px',
      caption1: '12px',
      caption2: '11px'
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  dimensions: {
    touchTarget: '44px',
    buttonHeight: '50px',
    inputHeight: '44px',
    navBarHeight: '44px',
    tabBarHeight: '49px',
    sectionSpacing: '32px'
  },
  borderRadius: {
    small: '8px',
    medium: '12px',
    large: '20px'
  },
  shadows: {
    subtle: '0 2px 8px rgba(0, 0, 0, 0.04)',
    medium: '0 4px 16px rgba(0, 0, 0, 0.08)',
    elevated: '0 8px 32px rgba(0, 0, 0, 0.12)'
  },
  animations: {
    spring: { tension: 300, friction: 30 },
    durations: {
      fast: '0.2s',
      medium: '0.4s',
      slow: '0.65s'
    },
    easings: {
      standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      deceleration: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      acceleration: 'cubic-bezier(0.4, 0.0, 1, 1)'
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
  const [isPressed, setIsPressed] = useState(false);

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    setIsPressed(false);
    if (info.offset.x > 120) {
      setExitX(500);
      onSwipe('right');
    } else if (info.offset.x < -120) {
      setExitX(-500);
      onSwipe('left');
    }
  }, [onSwipe]);

  const handleDragStart = () => {
    setIsPressed(true);
  };

  return (
    <motion.div
      className="absolute inset-0"
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.8}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 8, opacity: isTop ? 1 : 0.8 }}
      animate={{ 
        scale: isTop ? (isPressed ? 0.98 : 1) : 0.95,
        y: isTop ? 0 : 8,
        opacity: isTop ? 1 : 0.8,
        rotateZ: 0 
      }}
      exit={{ x: exitX, opacity: 0, rotateZ: exitX > 0 ? 15 : -15 }}
      style={{ 
        zIndex: isTop ? 10 : 1,
        transformOrigin: 'center'
      }}
      transition={{ 
        type: 'spring',
        stiffness: 300,
        damping: 30
      }}
    >
      {/* Profile Card Container following iOS card design */}
      <div 
        className="w-full h-full overflow-hidden relative bg-white dark:bg-gray-900"
        style={{
          borderRadius: APPLE_HIG.borderRadius.large,
          boxShadow: APPLE_HIG.shadows.elevated
        }}
      >
        {/* Profile Photo with gradient overlay */}
        <div className="relative h-[70%]">
          <img
            src={profile.photo}
            alt={profile.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Info Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile();
            }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center hover:bg-black/30 active:bg-black/40 transition-colors"
            style={{ borderRadius: '50%' }}
          >
            <Info className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Profile Info - Simplified */}
        <div className="p-5 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 
                className="font-semibold mb-1 text-gray-900 dark:text-white"
                style={{ fontSize: APPLE_HIG.typography.sizes.title2 }}
              >
                {profile.name}, {profile.age}
              </h2>
              {profile.gender && (
                <p 
                  className="text-gray-600 dark:text-gray-400"
                  style={{ fontSize: APPLE_HIG.typography.sizes.callout }}
                >
                  {profile.gender}
                </p>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewProfile();
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
              style={{ borderRadius: '50%' }}
            >
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          {/* Swipe Hints */}
          <div className="flex items-center justify-center gap-8 mt-4">
            <div className="flex flex-col items-center">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center mb-2 border-2 border-red-400"
                style={{ borderRadius: '50%' }}
              >
                <X className="w-6 h-6 text-red-400" />
              </div>
              <span 
                className="text-gray-600 dark:text-gray-400"
                style={{ fontSize: APPLE_HIG.typography.sizes.footnote }}
              >
                Swipe left
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center mb-2"
                style={{
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #C4B5FD 0%, #FFB8E6 100%)'
                }}
              >
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span 
                className="text-gray-600 dark:text-gray-400"
                style={{ fontSize: APPLE_HIG.typography.sizes.footnote }}
              >
                Swipe right
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-[calc(49px+env(safe-area-inset-bottom))]">
        {/* Navigation Header */}
        <div 
          className="sticky top-0 z-50 px-5 pt-4 pb-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800"
          style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}
        >
          <h1 
            className="font-semibold text-gray-900 dark:text-white"
            style={{ fontSize: APPLE_HIG.typography.sizes.title3 }}
          >
            Connect
          </h1>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center px-5" style={{ minHeight: 'calc(100vh - 140px)' }}>
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{
              background: 'rgba(196, 181, 253, 0.1)',
              borderRadius: '50%'
            }}
          >
            <Lock className="w-10 h-10" style={{ color: '#C4B5FD' }} />
          </div>
          <h2 
            className="font-semibold text-center mb-2 text-gray-900 dark:text-white"
            style={{ fontSize: APPLE_HIG.typography.sizes.title2 }}
          >
            Check In to Connect
          </h2>
          <p 
            className="text-center mb-6 max-w-xs text-gray-600 dark:text-gray-400"
            style={{ fontSize: APPLE_HIG.typography.sizes.body }}
          >
            Get tickets and check in to see who's at the event!
          </p>
          <Button 
            onClick={() => navigate('/events')} 
            className="w-full max-w-[280px]"
            style={{
              height: APPLE_HIG.dimensions.buttonHeight,
              borderRadius: APPLE_HIG.borderRadius.medium,
              background: '#C4B5FD'
            }}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            <span style={{ fontSize: APPLE_HIG.typography.sizes.body, fontWeight: APPLE_HIG.typography.weights.semibold }}>
              Browse Events
            </span>
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-[calc(49px+env(safe-area-inset-bottom))]">
      {/* Navigation Header */}
      <div 
        className="sticky top-0 z-50 px-5 pt-4 pb-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800"
        style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 
              className="font-semibold text-gray-900 dark:text-white mb-1"
              style={{ fontSize: APPLE_HIG.typography.sizes.title3 }}
            >
              {currentEventName}
            </h1>
            <p 
              className="text-gray-600 dark:text-gray-400"
              style={{ fontSize: APPLE_HIG.typography.sizes.footnote }}
            >
              {availableProfiles.length - currentIndex} people here
            </p>
          </div>
          
          {/* Likes Counter */}
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: 'rgba(196, 181, 253, 0.1)',
              borderRadius: '50px'
            }}
          >
            <Heart className="w-4 h-4" style={{ color: '#C4B5FD' }} />
            <span 
              className="font-semibold"
              style={{ 
                fontSize: APPLE_HIG.typography.sizes.footnote,
                color: '#C4B5FD'
              }}
            >
              {likesRemaining}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content - Fixed height container */}
      <div className="px-5 pt-5">
        {/* Card Stack */}
        <div className="relative" style={{ height: 'calc(100vh - 280px)' }}>
          {noMoreProfiles ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-4">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{
                    background: 'rgba(196, 181, 253, 0.1)',
                    borderRadius: '50%'
                  }}
                >
                  <Heart className="w-10 h-10" style={{ color: '#C4B5FD' }} />
                </div>
                <h3 
                  className="font-semibold mb-2 text-gray-900 dark:text-white"
                  style={{ fontSize: APPLE_HIG.typography.sizes.title2 }}
                >
                  That's Everyone!
                </h3>
                <p 
                  className="text-gray-600 dark:text-gray-400 mb-5"
                  style={{ fontSize: APPLE_HIG.typography.sizes.body }}
                >
                  Check back later for more connections.
                </p>
                <Button 
                  onClick={() => navigate('/events')} 
                  variant="outline"
                  className="w-full max-w-[200px]"
                  style={{
                    height: APPLE_HIG.dimensions.buttonHeight,
                    borderRadius: APPLE_HIG.borderRadius.medium,
                    borderColor: '#C4B5FD',
                    color: '#C4B5FD'
                  }}
                >
                  Find More Events
                </Button>
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
          <div className="flex justify-center items-center gap-5 mt-6">
            {/* Pass Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSwipe('left')}
              className="w-16 h-16 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 shadow-lg active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
              style={{
                borderRadius: '50%',
                boxShadow: APPLE_HIG.shadows.medium
              }}
            >
              <X className="w-7 h-7 text-gray-400" />
            </motion.button>

            {/* Undo Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUndo}
              disabled={history.length === 0}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 shadow-lg active:bg-gray-100 dark:active:bg-gray-700 transition-colors",
                history.length === 0 && "opacity-30 cursor-not-allowed"
              )}
              style={{
                borderRadius: '50%',
                boxShadow: APPLE_HIG.shadows.medium
              }}
            >
              <RotateCcw className="w-5 h-5 text-gray-400" />
            </motion.button>

            {/* Like Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSwipe('right')}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl active:opacity-90 transition-opacity"
              style={{
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #C4B5FD 0%, #FFB8E6 100%)',
                boxShadow: '0 8px 32px rgba(196, 181, 253, 0.3)'
              }}
            >
              <Heart className="w-7 h-7 text-white" />
            </motion.button>
          </div>
        )}
      </div>

      {/* Match Modal - iOS Style Sheet */}
      <Dialog open={!!matchModal} onOpenChange={() => setMatchModal(null)}>
        <DialogContent 
          className="fixed bottom-0 left-0 right-0 mx-auto max-w-[500px] rounded-t-[20px] rounded-b-none p-0 border-0"
          style={{
            boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.15)'
          }}
        >
          {/* Drag Handle */}
          <div className="pt-3 pb-1 flex justify-center">
            <div className="w-9 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
          </div>

          <div className="px-5 pb-8">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <motion.div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #C4B5FD 0%, #FFB8E6 100%)'
                }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <img
                src={matchModal?.photo}
                alt={matchModal?.name}
                className="w-full h-full rounded-full object-cover border-8 relative z-10"
                style={{
                  borderColor: 'white',
                  borderRadius: '50%'
                }}
              />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center z-20 border-4"
                style={{
                  background: '#D4AF37',
                  borderColor: 'white',
                  borderRadius: '50%'
                }}
              >
                <Heart className="w-4 h-4 text-white fill-white" />
              </motion.div>
            </div>
            
            <h2 
              className="text-center font-semibold mb-2 text-gray-900 dark:text-white"
              style={{ fontSize: APPLE_HIG.typography.sizes.title1 }}
            >
              It's a Match!
            </h2>
            <p 
              className="text-center mb-6 text-gray-600 dark:text-gray-400"
              style={{ fontSize: APPLE_HIG.typography.sizes.body }}
            >
              You and {matchModal?.name} liked each other
            </p>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setMatchModal(null)}
                className="flex-1"
                style={{
                  height: APPLE_HIG.dimensions.buttonHeight,
                  borderRadius: APPLE_HIG.borderRadius.medium,
                  borderColor: '#C4B5FD',
                  color: '#C4B5FD'
                }}
              >
                Keep Swiping
              </Button>
              <Button
                onClick={() => {
                  setMatchModal(null);
                  navigate('/matches');
                }}
                className="flex-1"
                style={{
                  height: APPLE_HIG.dimensions.buttonHeight,
                  borderRadius: APPLE_HIG.borderRadius.medium,
                  background: '#C4B5FD',
                  color: '#1A1A1A'
                }}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile View Modal - iOS Style */}
      <Dialog open={!!viewingProfile} onOpenChange={() => setViewingProfile(null)}>
        <DialogContent 
          className="fixed bottom-0 left-0 right-0 mx-auto max-w-[500px] rounded-t-[20px] rounded-b-none p-0 border-0 max-h-[85vh] overflow-hidden"
          style={{
            boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.15)'
          }}
        >
          {/* Drag Handle */}
          <div className="pt-3 pb-1 flex justify-center sticky top-0 bg-white dark:bg-gray-900">
            <div className="w-9 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
          </div>

          {viewingProfile && (
            <div className="overflow-y-auto">
              <div className="relative h-64">
                <img
                  src={viewingProfile.photo}
                  alt={viewingProfile.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                {/* Close Button */}
                <button
                  onClick={() => setViewingProfile(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/50 active:bg-black/60 transition-colors"
                  style={{ borderRadius: '50%' }}
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              
              <div className="px-5 py-6 bg-white dark:bg-gray-900">
                <div className="mb-6">
                  <h2 
                    className="font-semibold text-gray-900 dark:text-white mb-1"
                    style={{ fontSize: APPLE_HIG.typography.sizes.title1 }}
                  >
                    {viewingProfile.name}, {viewingProfile.age}
                  </h2>
                  <div className="flex items-center gap-4">
                    {viewingProfile.gender && (
                      <span 
                        className="px-3 py-1 rounded-full text-gray-700 dark:text-gray-300"
                        style={{
                          fontSize: APPLE_HIG.typography.sizes.caption1,
                          background: 'rgba(196, 181, 253, 0.1)',
                          borderRadius: '50px'
                        }}
                      >
                        {viewingProfile.gender}
                      </span>
                    )}
                    {viewingProfile.occupation && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Briefcase className="w-4 h-4" />
                        <span style={{ fontSize: APPLE_HIG.typography.sizes.callout }}>
                          {viewingProfile.occupation}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <h3 
                      className="font-semibold text-gray-900 dark:text-white mb-2"
                      style={{ fontSize: APPLE_HIG.typography.sizes.callout }}
                    >
                      About
                    </h3>
                    <p 
                      className="text-gray-600 dark:text-gray-400"
                      style={{ fontSize: APPLE_HIG.typography.sizes.body, lineHeight: 1.5 }}
                    >
                      {viewingProfile.bio}
                    </p>
                  </div>

                  <div>
                    <h3 
                      className="font-semibold text-gray-900 dark:text-white mb-2"
                      style={{ fontSize: APPLE_HIG.typography.sizes.callout }}
                    >
                      Location
                    </h3>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span style={{ fontSize: APPLE_HIG.typography.sizes.body }}>
                        {viewingProfile.location}
                      </span>
                    </div>
                  </div>
                  
                  {viewingProfile.interests && viewingProfile.interests.length > 0 && (
                    <div>
                      <h3 
                        className="font-semibold text-gray-900 dark:text-white mb-3"
                        style={{ fontSize: APPLE_HIG.typography.sizes.callout }}
                      >
                        Interests
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {viewingProfile.interests.map((interest) => (
                          <span
                            key={interest}
                            className="px-3 py-1.5 rounded-full"
                            style={{
                              fontSize: APPLE_HIG.typography.sizes.caption1,
                              background: 'rgba(196, 181, 253, 0.1)',
                              color: '#C4B5FD',
                              borderRadius: '50px'
                            }}
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewingProfile(null);
                      handleSwipe('left');
                    }}
                    className="flex-1"
                    style={{
                      height: APPLE_HIG.dimensions.buttonHeight,
                      borderRadius: APPLE_HIG.borderRadius.medium,
                      borderColor: '#4A4A4A',
                      color: '#4A4A4A'
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
                    className="flex-1"
                    style={{
                      height: APPLE_HIG.dimensions.buttonHeight,
                      borderRadius: APPLE_HIG.borderRadius.medium,
                      background: '#C4B5FD',
                      color: '#1A1A1A'
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

      {/* Add safe area spacing before bottom nav */}
      <div style={{ height: '16px' }}></div>
      <BottomNav />
    </div>
  );
}
