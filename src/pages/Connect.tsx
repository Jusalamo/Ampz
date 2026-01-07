import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Heart, RotateCcw, Sparkles, MapPin, Briefcase, Info, Zap, Lock, AlertCircle, Calendar, Users, Music } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { ConnectionProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Design System Constants - Simplified purple theme
const DESIGN_SYSTEM = {
  colors: {
    primary: {
      purple: '#8B5CF6',
      purpleLight: '#C4B5FD',
      purpleDark: '#7C3AED'
    },
    background: {
      dark: '#0F0F23',
      card: '#1A1A2E',
      gradient: 'linear-gradient(180deg, #0F0F23 0%, #1A1A2E 100%)'
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0D0',
      accent: '#8B5CF6'
    },
    accent: {
      pink: '#EC4899',
      teal: '#2DD4BF',
      gold: '#F59E0B'
    },
    interactive: {
      yes: '#EC4899',
      no: '#4A4A4A',
      border: '#8B5CF6'
    }
  },
  typography: {
    fonts: {
      heading: "'Inter', sans-serif",
      body: "'Inter', sans-serif"
    },
    sizes: {
      h1: '32px',
      h2: '24px',
      h3: '20px',
      body: '14px',
      small: '12px'
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  spacing: {
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  borderRadius: {
    medium: '16px',
    large: '24px',
    round: '50%'
  },
  shadows: {
    card: '0 8px 32px rgba(139, 92, 246, 0.15)',
    button: '0 4px 16px rgba(139, 92, 246, 0.3)'
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
      initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }}
      animate={{ 
        scale: isTop ? 1 : 0.95, 
        y: isTop ? 0 : 10,
        opacity: isTop ? 1 : 0.8,
        rotateZ: isTop ? -1.5 : 0
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
        damping: 25 
      }}
    >
      {/* Profile Card Container - Simplified */}
      <div 
        className="w-full h-full overflow-hidden relative cursor-grab active:cursor-grabbing"
        style={{
          borderRadius: DESIGN_SYSTEM.borderRadius.large,
          boxShadow: DESIGN_SYSTEM.shadows.card,
          border: `1px solid ${DESIGN_SYSTEM.colors.primary.purple}30`,
          background: DESIGN_SYSTEM.colors.background.card
        }}
      >
        {/* Swipe Hints */}
        <AnimatePresence>
          {showHint === 'like' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-6 left-6 z-20 px-4 py-2 rounded-xl"
              style={{
                background: DESIGN_SYSTEM.colors.interactive.yes,
                transform: 'rotate(-8deg)'
              }}
            >
              <span className="text-lg font-bold text-white">LIKE</span>
            </motion.div>
          )}
          {showHint === 'pass' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-6 right-6 z-20 px-4 py-2 rounded-xl"
              style={{
                background: DESIGN_SYSTEM.colors.interactive.no,
                transform: 'rotate(8deg)'
              }}
            >
              <span className="text-lg font-bold text-white">PASS</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Profile Photo */}
        <div className="relative h-[340px]">
          <img
            src={profile.photo}
            alt={profile.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          {/* Info Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile();
            }}
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform"
            style={{
              background: 'rgba(26, 26, 46, 0.8)',
              border: `1px solid ${DESIGN_SYSTEM.colors.primary.purple}`
            }}
          >
            <Info className="w-4 h-4" style={{ color: DESIGN_SYSTEM.colors.primary.purple }} />
          </button>
        </div>

        {/* Minimal Profile Info - Only Name, Age, Gender */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 
                className="text-xl font-bold mb-1"
                style={{ 
                  color: DESIGN_SYSTEM.colors.text.primary,
                  fontFamily: DESIGN_SYSTEM.typography.fonts.heading
                }}
              >
                {profile.name}, {profile.age}
              </h2>
              {profile.gender && (
                <p 
                  className="text-sm"
                  style={{ color: DESIGN_SYSTEM.colors.text.secondary }}
                >
                  {profile.gender}
                </p>
              )}
            </div>
            {profile.isPublic && (
              <span 
                className="px-2 py-1 text-xs font-medium rounded"
                style={{
                  background: `${DESIGN_SYSTEM.colors.accent.teal}20`,
                  color: DESIGN_SYSTEM.colors.accent.teal,
                  border: `1px solid ${DESIGN_SYSTEM.colors.accent.teal}40`
                }}
              >
                Checked In
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
  const { connectionProfiles, user, addMatch, updateUser, tickets, isDemo, events } = useApp();
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

  // Get current event info
  const currentProfile = availableProfiles[currentIndex];
  const currentEvent = currentProfile?.eventId 
    ? events.find(e => e.id === currentProfile.eventId)
    : null;

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
        className="min-h-screen pb-nav flex flex-col"
        style={{
          background: DESIGN_SYSTEM.colors.background.gradient,
          minHeight: '100vh'
        }}
      >
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{
              background: `${DESIGN_SYSTEM.colors.primary.purple}20`,
              borderRadius: DESIGN_SYSTEM.borderRadius.round
            }}
          >
            <Lock className="w-10 h-10" style={{ color: DESIGN_SYSTEM.colors.primary.purple }} />
          </div>
          <h2 
            className="text-2xl font-bold mb-3 text-center"
            style={{ 
              color: DESIGN_SYSTEM.colors.text.primary,
            }}
          >
            Check In to Connect
          </h2>
          <p 
            className="text-center mb-6 max-w-xs"
            style={{ color: DESIGN_SYSTEM.colors.text.secondary }}
          >
            Get tickets and check in to an event to start connecting with people!
          </p>
          <Button 
            onClick={() => navigate('/events')} 
            className="rounded-full px-8" 
            size="lg"
            style={{
              background: DESIGN_SYSTEM.colors.primary.purple,
              color: 'white',
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
      className="min-h-screen pb-nav flex flex-col"
      style={{
        background: DESIGN_SYSTEM.colors.background.gradient,
        maxWidth: '430px',
        margin: '0 auto',
        padding: `${DESIGN_SYSTEM.spacing.lg} ${DESIGN_SYSTEM.spacing.md}`,
        minHeight: '100vh'
      }}
    >
      {/* Header with Event Name */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {currentEvent ? (
              <>
                <h1 
                  className="text-xl font-bold truncate"
                  style={{ 
                    color: DESIGN_SYSTEM.colors.text.primary,
                  }}
                >
                  {currentEvent.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-3 h-3" style={{ color: DESIGN_SYSTEM.colors.primary.purple }} />
                  <p 
                    className="text-xs truncate"
                    style={{ color: DESIGN_SYSTEM.colors.text.secondary }}
                  >
                    {availableProfiles.length - currentIndex} people here
                  </p>
                </div>
              </>
            ) : (
              <>
                <h1 
                  className="text-xl font-bold"
                  style={{ 
                    color: DESIGN_SYSTEM.colors.text.primary,
                  }}
                >
                  Connect
                </h1>
                <p 
                  className="text-xs mt-1"
                  style={{ color: DESIGN_SYSTEM.colors.text.secondary }}
                >
                  Find people at your events
                </p>
              </>
            )}
          </div>
          
          {/* Likes Counter */}
          <div 
            className="flex items-center gap-2 px-3 py-2 rounded-full"
            style={{
              background: `${DESIGN_SYSTEM.colors.primary.purple}15`,
              border: `1px solid ${DESIGN_SYSTEM.colors.primary.purple}30`
            }}
          >
            <Heart className="w-4 h-4" style={{ color: DESIGN_SYSTEM.colors.primary.purple }} />
            <span className="text-sm font-bold" style={{ color: DESIGN_SYSTEM.colors.primary.purple }}>
              {likesRemaining}
            </span>
          </div>
        </div>
      </div>

      {/* Card Stack - Fits snugly */}
      <div className="relative flex-1 mb-4 min-h-0">
        <div className="relative h-[400px] w-full mx-auto">
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
                    background: `${DESIGN_SYSTEM.colors.primary.purple}15`,
                    borderRadius: DESIGN_SYSTEM.borderRadius.round
                  }}
                >
                  <Heart className="w-10 h-10" style={{ color: DESIGN_SYSTEM.colors.primary.purple }} />
                </div>
                <h3 
                  className="text-lg font-bold mb-3"
                  style={{ 
                    color: DESIGN_SYSTEM.colors.text.primary,
                  }}
                >
                  That's Everyone!
                </h3>
                <p 
                  className="text-sm mb-6"
                  style={{ color: DESIGN_SYSTEM.colors.text.secondary }}
                >
                  Check back later or attend more events
                </p>
                <Button 
                  onClick={() => navigate('/events')} 
                  variant="outline" 
                  className="rounded-full px-6"
                  style={{
                    borderColor: DESIGN_SYSTEM.colors.primary.purple,
                    color: DESIGN_SYSTEM.colors.primary.purple,
                  }}
                >
                  Find Events
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
      </div>

      {/* Action Buttons */}
      {!noMoreProfiles && (
        <div className="flex justify-center items-center gap-6 mb-2">
          {/* Pass Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSwipe('left')}
            className="flex items-center justify-center"
            style={{
              width: '64px',
              height: '64px',
              background: DESIGN_SYSTEM.colors.interactive.no,
              color: DESIGN_SYSTEM.colors.text.primary,
              borderRadius: DESIGN_SYSTEM.borderRadius.round,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
            }}
          >
            <X className="w-6 h-6" />
          </motion.button>

          {/* Undo Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleUndo}
            disabled={history.length === 0}
            className={cn(
              "flex items-center justify-center",
              history.length === 0 && "opacity-30 cursor-not-allowed"
            )}
            style={{
              width: '48px',
              height: '48px',
              background: 'transparent',
              color: DESIGN_SYSTEM.colors.text.secondary,
              borderRadius: DESIGN_SYSTEM.borderRadius.round,
              border: `2px solid ${DESIGN_SYSTEM.colors.text.secondary}`
            }}
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>

          {/* Like Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSwipe('right')}
            className="flex items-center justify-center"
            style={{
              width: '64px',
              height: '64px',
              background: DESIGN_SYSTEM.colors.interactive.yes,
              color: 'white',
              borderRadius: DESIGN_SYSTEM.borderRadius.round,
              boxShadow: `0 4px 16px ${DESIGN_SYSTEM.colors.interactive.yes}40`
            }}
          >
            <Heart className="w-6 h-6" />
          </motion.button>
        </div>
      )}

      {/* Maybe Later Button */}
      {!noMoreProfiles && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mx-auto block mt-2 text-sm font-medium"
          style={{
            background: 'transparent',
            color: DESIGN_SYSTEM.colors.text.secondary,
          }}
        >
          Maybe later
        </motion.button>
      )}

      {/* Match Modal */}
      <Dialog open={!!matchModal} onOpenChange={() => setMatchModal(null)}>
        <DialogContent 
          className="text-center p-0 overflow-hidden border-0"
          style={{
            background: DESIGN_SYSTEM.colors.background.card,
            maxWidth: '320px',
            borderRadius: DESIGN_SYSTEM.borderRadius.large,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div className="py-6 px-5">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <motion.div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${DESIGN_SYSTEM.colors.interactive.yes} 0%, ${DESIGN_SYSTEM.colors.primary.purple} 100%)`
                }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <img
                src={matchModal?.photo}
                alt={matchModal?.name}
                className="w-full h-full rounded-full object-cover border-4 relative z-10"
                style={{
                  borderColor: DESIGN_SYSTEM.colors.background.card,
                }}
              />
            </div>
            
            <h2 
              className="text-xl font-bold mb-2"
              style={{ 
                color: DESIGN_SYSTEM.colors.text.primary,
              }}
            >
              It's a Match!
            </h2>
            <p 
              className="text-sm mb-6"
              style={{ color: DESIGN_SYSTEM.colors.text.secondary }}
            >
              You and {matchModal?.name} liked each other
            </p>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setMatchModal(null)}
                className="flex-1 h-11 text-sm"
                style={{
                  borderColor: DESIGN_SYSTEM.colors.primary.purple,
                  color: DESIGN_SYSTEM.colors.primary.purple,
                }}
              >
                Keep Swiping
              </Button>
              <Button
                onClick={() => {
                  setMatchModal(null);
                  navigate('/matches');
                }}
                className="flex-1 h-11 text-sm"
                style={{
                  background: DESIGN_SYSTEM.colors.primary.purple,
                  color: 'white',
                }}
              >
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Details Modal - Fixed layout */}
      <Dialog open={!!viewingProfile} onOpenChange={() => setViewingProfile(null)}>
        <DialogContent 
          className="p-0 overflow-hidden max-h-[85vh]"
          style={{
            background: DESIGN_SYSTEM.colors.background.card,
            maxWidth: '380px',
            borderRadius: DESIGN_SYSTEM.borderRadius.large,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
            border: `1px solid ${DESIGN_SYSTEM.colors.primary.purple}20`
          }}
        >
          {viewingProfile && (
            <div className="flex flex-col h-full">
              {/* Header with close button */}
              <div className="flex justify-end p-4">
                <button
                  onClick={() => setViewingProfile(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <X className="w-4 h-4" style={{ color: DESIGN_SYSTEM.colors.text.secondary }} />
                </button>
              </div>
              
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 pb-5">
                {/* Profile Image */}
                <div className="relative mb-6">
                  <img
                    src={viewingProfile.photo}
                    alt={viewingProfile.name}
                    className="w-full h-64 object-cover rounded-2xl"
                    style={{
                      borderRadius: DESIGN_SYSTEM.borderRadius.large,
                    }}
                  />
                  <div 
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: 'linear-gradient(to top, rgba(26, 26, 46, 0.9) 0%, transparent 40%)'
                    }}
                  />
                  <div className="absolute bottom-4 left-4">
                    <h2 
                      className="text-2xl font-bold text-white"
                      style={{ 
                        fontFamily: DESIGN_SYSTEM.typography.fonts.heading
                      }}
                    >
                      {viewingProfile.name}, {viewingProfile.age}
                    </h2>
                    {viewingProfile.gender && (
                      <p className="text-white/80">
                        {viewingProfile.gender}
                      </p>
                    )}
                  </div>
                </div>

                {/* Details Sections */}
                <div className="space-y-6">
                  {/* Occupation */}
                  {viewingProfile.occupation && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4" style={{ color: DESIGN_SYSTEM.colors.primary.purple }} />
                        <h3 
                          className="text-sm font-semibold"
                          style={{ color: DESIGN_SYSTEM.colors.text.primary }}
                        >
                          Occupation
                        </h3>
                      </div>
                      <p style={{ color: DESIGN_SYSTEM.colors.text.secondary }}>
                        {viewingProfile.occupation}
                      </p>
                    </div>
                  )}

                  {/* Location */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4" style={{ color: DESIGN_SYSTEM.colors.primary.purple }} />
                      <h3 
                        className="text-sm font-semibold"
                        style={{ color: DESIGN_SYSTEM.colors.text.primary }}
                      >
                        Location
                      </h3>
                    </div>
                    <p style={{ color: DESIGN_SYSTEM.colors.text.secondary }}>
                      {viewingProfile.location}
                    </p>
                  </div>

                  {/* Bio */}
                  {viewingProfile.bio && (
                    <div>
                      <h3 
                        className="text-sm font-semibold mb-2"
                        style={{ color: DESIGN_SYSTEM.colors.text.primary }}
                      >
                        About
                      </h3>
                      <p 
                        className="text-sm leading-relaxed"
                        style={{ color: DESIGN_SYSTEM.colors.text.secondary }}
                      >
                        {viewingProfile.bio}
                      </p>
                    </div>
                  )}

                  {/* Interests */}
                  {viewingProfile.interests && viewingProfile.interests.length > 0 && (
                    <div>
                      <h3 
                        className="text-sm font-semibold mb-3"
                        style={{ color: DESIGN_SYSTEM.colors.text.primary }}
                      >
                        Interests
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {viewingProfile.interests.map((interest) => (
                          <span
                            key={interest}
                            className="px-3 py-1.5 text-xs font-medium rounded-full"
                            style={{
                              background: `${DESIGN_SYSTEM.colors.primary.purple}15`,
                              color: DESIGN_SYSTEM.colors.primary.purple,
                              border: `1px solid ${DESIGN_SYSTEM.colors.primary.purple}30`
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

              {/* Action Buttons - Fixed at bottom */}
              <div className="p-5 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewingProfile(null);
                      handleSwipe('left');
                    }}
                    className="flex-1 h-12"
                    style={{
                      borderColor: DESIGN_SYSTEM.colors.interactive.no,
                      color: DESIGN_SYSTEM.colors.text.primary,
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
                      background: DESIGN_SYSTEM.colors.primary.purple,
                      color: 'white',
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
