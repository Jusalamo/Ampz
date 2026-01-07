import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Heart, RotateCcw, Sparkles, MapPin, Briefcase, Info, Lock, Tag } from 'lucide-react';
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
    gold: '#D4AF37'
  }
};

// Fixed heights for each section
const HEIGHTS = {
  header: '100px',      // Header + likes counter
  cardStack: '380px',   // Fixed card height
  buttons: '120px',     // Action buttons area
  bottomSpacing: '20px' // Space above bottom nav
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
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Card with Light Purple Hue */}
      <div 
        className="w-full h-full rounded-[20px] overflow-hidden relative rotate-[-2deg]"
        style={{
          background: 'linear-gradient(135deg, rgba(196, 181, 253, 0.95) 0%, rgba(233, 213, 255, 0.95) 100%)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          border: '2px solid #D4AF37',
          position: 'relative'
        }}
      >
        {/* Overlay for light purple hue */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'rgba(196, 181, 253, 0.2)',
            mixBlendMode: 'overlay'
          }}
        />
        
        {/* Profile Photo */}
        <div className="relative h-[65%]">
          <img
            src={profile.photo}
            alt={profile.name}
            className="w-full h-full object-cover"
            style={{
              borderBottomLeftRadius: '18px',
              borderBottomRightRadius: '18px'
            }}
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Info Button - Improved styling */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile();
            }}
            className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md hover:scale-105 transition-transform"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <Info className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Simple Info - Only name, age, and tags */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-[24px] font-bold" style={{ color: DESIGN.colors.background }}>
              {profile.name}
            </h2>
            <span className="text-[24px] font-medium" style={{ color: DESIGN.colors.card, opacity: 0.9 }}>
              {profile.age}
            </span>
          </div>
          
          {/* Tags display - Show first 3 tags */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.interests.slice(0, 3).map((interest, index) => (
                <div 
                  key={index}
                  className="px-3 py-1 rounded-full flex items-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Tag className="w-3 h-3 mr-1" style={{ color: DESIGN.colors.background }} />
                  <span className="text-[12px] font-medium" style={{ color: DESIGN.colors.background }}>
                    {interest}
                  </span>
                </div>
              ))}
              {profile.interests.length > 3 && (
                <div 
                  className="px-3 py-1 rounded-full flex items-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <span className="text-[12px] font-medium" style={{ color: DESIGN.colors.background }}>
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
      {/* Fixed Header */}
      <div 
        className="flex-shrink-0 px-4 pt-4"
        style={{ height: HEIGHTS.header }}
      >
        <div className="flex items-center justify-between">
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
      </div>

      {/* Fixed Card Stack Area */}
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
      </div>

      {/* Fixed Buttons Area */}
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
            <div className="flex justify-center items-center gap-4">
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
                  history.length === 0 && "opacity-30 cursor-not-allowed"
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
              className="mx-auto block text-sm italic mt-3"
              style={{ color: DESIGN.colors.textSecondary }}
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
                color: DESIGN.colors.background
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
          {/* Drag handle */}
          <div className="w-full flex justify-center pt-3">
            <div className="w-9 h-1 rounded-full" style={{ background: DESIGN.colors.textSecondary }} />
          </div>

          <motion.div 
            className="py-6 px-5"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
                style={{ background: DESIGN.colors.gold, borderColor: DESIGN.colors.card }}
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
            
            {/* Purple buttons for match modal */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setMatchModal(null)}
                className="flex-1 h-12 rounded-[12px] hover:bg-purple-50 transition-colors"
                style={{ 
                  borderColor: DESIGN.colors.primary,
                  color: DESIGN.colors.primary,
                  background: 'transparent'
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
          {/* Drag handle */}
          <div className="w-full flex justify-center pt-3">
            <div className="w-9 h-1 rounded-full" style={{ background: DESIGN.colors.textSecondary }} />
          </div>

          <div className="overflow-y-auto max-h-[80vh]">
            {viewingProfile && (
              <>
                {/* Image with improved close button */}
                <div className="relative h-56">
                  <img
                    src={viewingProfile.photo}
                    alt={viewingProfile.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  
                  {/* Improved close button */}
                  <button
                    onClick={() => setViewingProfile(null)}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md hover:scale-105 transition-transform"
                    style={{
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <X className="w-5 h-5 text-white" />
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
                          className="inline-flex items-center px-3 py-1 rounded-full"
                          style={{ background: 'rgba(196, 181, 253, 0.1)' }}
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
                    <h3 className="text-[13px] font-semibold mb-3 uppercase tracking-wider" style={{ color: DESIGN.colors.textSecondary }}>
                      About
                    </h3>
                    <p className="text-[15px] leading-relaxed" style={{ color: DESIGN.colors.textSecondary }}>
                      {viewingProfile.bio}
                    </p>
                  </div>

                  {/* Location Section */}
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

                  {/* Tags/Interests Section */}
                  {viewingProfile.interests && viewingProfile.interests.length > 0 && (
                    <div>
                      <h3 className="text-[13px] font-semibold mb-3 uppercase tracking-wider" style={{ color: DESIGN.colors.textSecondary }}>
                        Interests
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {viewingProfile.interests.map((interest, index) => (
                          <div 
                            key={index}
                            className="flex items-center px-3 py-1.5 rounded-full"
                            style={{
                              background: 'rgba(196, 181, 253, 0.1)',
                              border: '1px solid rgba(196, 181, 253, 0.3)'
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

                {/* Action buttons */}
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
                        borderColor: '#4A4A4A',
                        color: DESIGN.colors.textPrimary,
                        background: 'transparent'
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
                      className="flex-1 h-12 rounded-[12px] hover:bg-purple-700 transition-colors"
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
    </div>
  );
}
