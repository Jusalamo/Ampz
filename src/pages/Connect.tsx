import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, RotateCcw, Sparkles, MapPin, Briefcase, Info, Lock, Tag, X } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { ConnectionProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Design Constants
const DESIGN = {
  colors: {
    primary: '#C4B5FD',
    lavenderLight: '#E9D5FF',
    accentPink: '#FFB8E6',
    background: '#1A1A1A',
    card: '#2D2D2D',
    textPrimary: '#FFFFFF',
    textSecondary: '#B8B8B8',
    gold: '#D4AF37',
    red: '#EF4444',
    purple: '#8B5CF6'
  }
};

// Adjusted heights for better spacing
// Adjusted heights for better spacing
const HEIGHTS = {
  header: '85px',       // Reduced header height
  cardStack: '440px',   // Increased card height to reduce gap with buttons
  buttons: '110px',     // Increased button area for better spacing
  bottomSpacing: '35px' // Increased space above bottom nav
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
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 30 
      }}
    >
      {/* Card with Light Purple Hue - Taller design */}
      <div 
        className="w-full h-full rounded-[20px] overflow-hidden relative rotate-[-2deg]"
        style={{
          background: 'linear-gradient(135deg, rgba(196, 181, 253, 0.95) 0%, rgba(233, 213, 255, 0.95) 100%)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
          border: '2px solid #D4AF37',
          position: 'relative'
        }}
      >
        {/* Overlay for light purple hue */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'rgba(196, 181, 253, 0.15)',
            mixBlendMode: 'overlay'
          }}
        />
        
        {/* Profile Photo - Centered properly */}
        <div className="relative h-[72%] flex items-center justify-center">
          <div className="relative w-[85%] h-full mt-4">
            <img
              src={profile.photo}
              alt={profile.name}
              className="w-full h-full object-cover rounded-[16px]"
              style={{
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
              }}
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-[16px]" />
            
            {/* Info Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewProfile();
              }}
              className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md hover:scale-105 transition-transform"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <Info className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Simple Info - Only name, age, and tags */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pt-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="text-[26px] font-bold" style={{ color: DESIGN.colors.background }}>
              {profile.name}
            </h2>
            <span className="text-[26px] font-medium" style={{ color: DESIGN.colors.card, opacity: 0.9 }}>
              {profile.age}
            </span>
          </div>
          
          {/* Tags display - Show first 3 tags */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {profile.interests.slice(0, 3).map((interest, index) => (
                <div 
                  key={index}
                  className="px-3 py-1.5 rounded-full flex items-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Tag className="w-3 h-3 mr-1.5" style={{ color: DESIGN.colors.background }} />
                  <span className="text-[12px] font-semibold" style={{ color: DESIGN.colors.background }}>
                    {interest}
                  </span>
                </div>
              ))}
              {profile.interests.length > 3 && (
                <div 
                  className="px-3 py-1.5 rounded-full flex items-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <span className="text-[12px] font-semibold" style={{ color: DESIGN.colors.background }}>
                    +{profile.interests.length - 3}
                  </span>
                </div>
              )}
            </div>
          )}
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
        className="fixed inset-0 overflow-hidden"
        style={{ background: DESIGN.colors.background }}
      >
        <div className="h-full flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center px-4">
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
          <div className="flex-shrink-0">
            <BottomNav />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 overflow-hidden"
      style={{ 
        background: DESIGN.colors.background,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Fixed Header - Reduced height */}
      <div 
        className="flex-shrink-0 px-4 pt-4 pb-2"
        style={{ height: HEIGHTS.header }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[26px] font-bold mb-1" style={{ color: DESIGN.colors.textPrimary }}>
              {currentEventName}
            </h1>
            <p className="text-[13px]" style={{ color: DESIGN.colors.textSecondary }}>
              {availableProfiles.length - currentIndex} people here
            </p>
          </div>
          <div 
            className="flex items-center gap-2 px-3 py-2 rounded-full"
            style={{ 
              background: `${DESIGN.colors.accentPink}20`,
              border: `1px solid ${DESIGN.colors.accentPink}30`
            }}
          >
            <ThumbsUp className="w-4 h-4" style={{ color: DESIGN.colors.accentPink }} />
            <span className="text-sm font-bold" style={{ color: DESIGN.colors.accentPink }}>
              {likesRemaining}
            </span>
          </div>
        </div>
      </div>

      {/* Fixed Card Stack Area - Increased height */}
      <div 
        className="flex-shrink-0 px-4"
        style={{ height: HEIGHTS.cardStack }}
      >
        <div className="relative w-full h-full">
          {noMoreProfiles ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ 
                    background: `${DESIGN.colors.primary}20`,
                    borderRadius: '50%',
                    border: `2px solid ${DESIGN.colors.primary}30`
                  }}
                >
                  <ThumbsUp className="w-8 h-8" style={{ color: DESIGN.colors.primary }} />
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
      </div>

      {/* Fixed Buttons Area - Professional icons with purple theme */}
      <div 
        className="flex-shrink-0 px-4"
        style={{ 
          height: HEIGHTS.buttons,
          marginTop: 'auto',
          marginBottom: HEIGHTS.bottomSpacing
        }}
      >
        {!noMoreProfiles ? (
          <>
            <div className="flex justify-center items-center gap-5">
              {/* Pass Button - Red with ThumbsDown */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSwipe('left')}
                className="flex items-center justify-center"
                style={{
                  width: '70px',
                  height: '70px',
                  background: DESIGN.colors.red,
                  color: DESIGN.colors.textPrimary,
                  borderRadius: '50%',
                  boxShadow: `0 6px 20px ${DESIGN.colors.red}40`
                }}
              >
                <ThumbsDown className="w-8 h-8" />
              </motion.button>

              {/* Undo Button - Purple outline */}
              <motion.button
                whileHover={{ scale: 1.05 }}
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
                  color: DESIGN.colors.textSecondary,
                  borderRadius: '50%',
                  border: `2px solid ${DESIGN.colors.primary}`
                }}
              >
                <RotateCcw className="w-5 h-5" />
              </motion.button>

              {/* Like Button - Pink with ThumbsUp */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSwipe('right')}
                className="flex items-center justify-center"
                style={{
                  width: '70px',
                  height: '70px',
                  background: DESIGN.colors.accentPink,
                  color: DESIGN.colors.background,
                  borderRadius: '50%',
                  boxShadow: `0 6px 20px ${DESIGN.colors.accentPink}40`,
                  fontWeight: '600'
                }}
              >
                <ThumbsUp className="w-8 h-8" />
              </motion.button>
            </div>

            {/* Maybe Later Button - Purple text */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="mx-auto block text-sm italic mt-4"
              style={{ 
                color: DESIGN.colors.primary,
                opacity: 0.8
              }}
            >
              Maybe Later
            </motion.button>
          </>
        ) : (
          <div className="flex justify-center">
            <Button
              onClick={() => navigate('/events')}
              className="w-full max-w-[200px] h-[50px] rounded-[12px]"
              style={{ 
                background: DESIGN.colors.primary,
                color: DESIGN.colors.background,
                boxShadow: `0 4px 16px ${DESIGN.colors.primary}40`
              }}
            >
              Find More Events
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex-shrink-0">
        <BottomNav />
      </div>

      {/* Match Modal - Bottom Sheet with smooth animation */}
      <Dialog open={!!matchModal} onOpenChange={() => setMatchModal(null)}>
        <DialogContent 
          className="p-0 border-0 rounded-t-[24px] rounded-b-none bottom-0 fixed max-w-none w-full"
          style={{
            background: DESIGN.colors.card,
            margin: 0,
            bottom: 0,
            left: 0,
            right: 0,
            transform: 'none',
            top: 'auto',
            maxHeight: '85vh'
          }}
        >
          {/* Drag handle with top spacing */}
          <div className="w-full flex justify-center pt-4 pb-1">
            <div className="w-12 h-1 rounded-full" style={{ 
              background: DESIGN.colors.textSecondary,
              opacity: 0.5
            }} />
          </div>

          <motion.div 
            className="py-6 px-5"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ 
              type: 'spring',
              damping: 25,
              stiffness: 300
            }}
          >
            <div className="relative w-24 h-24 mx-auto mb-5">
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
                style={{ 
                  borderColor: DESIGN.colors.card,
                  objectPosition: 'center center'
                }}
              />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center z-20 border-2"
                style={{ 
                  background: DESIGN.colors.gold,
                  borderColor: DESIGN.colors.card 
                }}
              >
                <ThumbsUp className="w-3 h-3 text-white fill-white" />
              </motion.div>
            </div>
            
            <motion.h2 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-[28px] font-bold mb-2 text-center"
              style={{ color: DESIGN.colors.textPrimary }}
            >
              It's a Match!
            </motion.h2>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mb-6 text-center"
              style={{ 
                color: DESIGN.colors.textSecondary,
                fontSize: '16px'
              }}
            >
              You and {matchModal?.name} liked each other
            </motion.p>
            
            {/* Purple buttons for match modal */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setMatchModal(null)}
                className="flex-1 h-12 rounded-[12px] hover:bg-purple-50/10 transition-colors"
                style={{ 
                  borderColor: DESIGN.colors.primary,
                  color: DESIGN.colors.primary,
                  background: 'transparent',
                  fontSize: '16px',
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
                className="flex-1 h-12 rounded-[12px] hover:bg-purple-700 transition-colors"
                style={{ 
                  background: DESIGN.colors.primary,
                  color: DESIGN.colors.background,
                  fontSize: '16px',
                  fontWeight: '600',
                  boxShadow: `0 4px 16px ${DESIGN.colors.primary}40`
                }}
              >
                Message
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Profile View Modal - Bottom Sheet with smooth animation */}
      <Dialog open={!!viewingProfile} onOpenChange={() => setViewingProfile(null)}>
        <DialogContent 
          className="p-0 border-0 rounded-t-[24px] rounded-b-none bottom-0 fixed max-w-none w-full"
          style={{
            background: DESIGN.colors.card,
            margin: 0,
            bottom: 0,
            left: 0,
            right: 0,
            transform: 'none',
            top: 'auto',
            maxHeight: '95vh'
          }}
        >
          {/* Drag handle with top spacing */}
        <div className="w-full flex justify-center pt-4 pb-1">
          <div className="w-12 h-1 rounded-full" style={{ 
            background: DESIGN.colors.textSecondary,
            opacity: 0.5
          }} />
        </div>

          <motion.div 
            className="overflow-y-auto max-h-[90vh]"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ 
              type: 'spring',
              damping: 25,
              stiffness: 300
            }}
          >
            {viewingProfile && (
              <>
                {/* Image with centered close button */}
                <div className="relative h-64">
                  <img
                    src={viewingProfile.photo}
                    alt={viewingProfile.name}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: 'center center' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  
                  {/* Single close button - improved styling */}
                  <button
                    onClick={() => setViewingProfile(null)}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md hover:scale-105 transition-transform"
                    style={{
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: `1px solid ${DESIGN.colors.primary}30`,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <X className="w-5 h-5" style={{ color: DESIGN.colors.textPrimary }} />
                  </button>
                </div>
                
                {/* Profile Details */}
                <div className="p-5 space-y-6">
                  <div>
                    <h2 className="text-[28px] font-bold mb-1" style={{ color: DESIGN.colors.textPrimary }}>
                      {viewingProfile.name}, {viewingProfile.age}
                    </h2>
                    
                    {/* Occupation */}
                    {viewingProfile.occupation && (
                      <div className="flex items-center gap-2 mb-3">
                        <Briefcase className="w-4 h-4" style={{ color: DESIGN.colors.primary }} />
                        <span className="text-[16px]" style={{ color: DESIGN.colors.primary }}>
                          {viewingProfile.occupation}
                        </span>
                      </div>
                    )}
                    
                    {/* Gender (if available) */}
                    {viewingProfile.gender && (
                      <div className="mb-2">
                        <div 
                          className="inline-flex items-center px-3 py-1.5 rounded-full"
                          style={{ 
                            background: 'rgba(196, 181, 253, 0.15)',
                            border: `1px solid ${DESIGN.colors.primary}30`
                          }}
                        >
                          <span className="text-[14px] font-medium" style={{ color: DESIGN.colors.primary }}>
                            {viewingProfile.gender}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* About Section */}
                  <div>
                    <h3 className="text-[13px] font-semibold mb-3 uppercase tracking-wider" 
                      style={{ color: DESIGN.colors.textSecondary }}>
                      About
                    </h3>
                    <p className="text-[15px] leading-relaxed" style={{ color: DESIGN.colors.textSecondary }}>
                      {viewingProfile.bio}
                    </p>
                  </div>

                  {/* Location Section */}
                  <div>
                    <h3 className="text-[13px] font-semibold mb-3 uppercase tracking-wider" 
                      style={{ color: DESIGN.colors.textSecondary }}>
                      Location
                    </h3>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" style={{ color: DESIGN.colors.primary }} />
                      <span className="text-[15px]" style={{ color: DESIGN.colors.textSecondary }}>
                        {viewingProfile.location}
                      </span>
                    </div>
                  </div>

                  {/* Tags/Interests Section */}
                  {viewingProfile.interests && viewingProfile.interests.length > 0 && (
                    <div>
                      <h3 className="text-[13px] font-semibold mb-3 uppercase tracking-wider" 
                        style={{ color: DESIGN.colors.textSecondary }}>
                        Interests
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {viewingProfile.interests.map((interest, index) => (
                          <div 
                            key={index}
                            className="flex items-center px-3 py-1.5 rounded-full"
                            style={{
                              background: 'rgba(196, 181, 253, 0.1)',
                              border: `1px solid ${DESIGN.colors.primary}30`
                            }}
                          >
                            <Tag className="w-3 h-3 mr-2" style={{ color: DESIGN.colors.primary }} />
                            <span className="text-[13px] font-medium" style={{ color: DESIGN.colors.primary }}>
                              {interest}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons - Purple theme */}
                <div 
                  className="p-5 border-t"
                  style={{ 
                    borderColor: `${DESIGN.colors.textSecondary}20`,
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
                      className="flex-1 h-12 rounded-[12px] hover:bg-gray-800 transition-colors"
                      style={{ 
                        borderColor: DESIGN.colors.red,
                        color: DESIGN.colors.red,
                        background: 'transparent',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}
                    >
                      <ThumbsDown className="w-5 h-5 mr-2" />
                      Pass
                    </Button>
                    <Button
                      onClick={() => {
                        setViewingProfile(null);
                        handleSwipe('right');
                      }}
                      className="flex-1 h-12 rounded-[12px] hover:bg-purple-700 transition-colors"
                      style={{ 
                        background: DESIGN.colors.primary,
                        color: DESIGN.colors.background,
                        fontSize: '16px',
                        fontWeight: '600',
                        boxShadow: `0 4px 16px ${DESIGN.colors.primary}40`
                      }}
                    >
                      <ThumbsUp className="w-5 h-5 mr-2" />
                      Like
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
