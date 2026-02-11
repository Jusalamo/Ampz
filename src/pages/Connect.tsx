import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, RotateCcw, Sparkles, MapPin, Briefcase, Info, Lock, Tag, X, AlertTriangle, Crown } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { ConnectionProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

// Adjusted heights for better spacing
const HEIGHTS = {
  header: '85px',
  cardStack: '440px',
  buttons: '110px',
  bottomSpacing: '35px'
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
  const [imgLoaded, setImgLoaded] = useState(false);

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
      {/* Card with gradient - using semantic colors */}
      <div 
        className="w-full h-full rounded-ampz-lg overflow-hidden relative rotate-[-2deg] border-2 border-primary shadow-xl bg-gradient-to-br from-primary/95 to-accent/95"
      >
        {/* Overlay for light purple hue */}
        <div className="absolute inset-0 bg-primary/15 mix-blend-overlay" />
        
        {/* Profile Photo - Centered properly */}
        <div className="relative h-[72%] flex items-center justify-center">
          <div className="relative w-[85%] h-full mt-4">
            {!imgLoaded && <Skeleton className="absolute inset-0 rounded-ampz-md" />}
            <img
              src={profile.photo || '/default-avatar.png'}
              alt={profile.name}
              className={cn("w-full h-full object-cover rounded-ampz-md shadow-lg", !imgLoaded && "opacity-0")}
              draggable={false}
              onLoad={() => setImgLoaded(true)}
              onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png'; setImgLoaded(true); }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-ampz-md" />
            
            {/* Info Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewProfile();
              }}
              className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md hover:scale-105 ampz-transition bg-black/50 border border-white/20"
            >
              <Info className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Simple Info - Only name, age, and tags */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pt-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="text-[26px] font-bold text-background">
              {profile.name}
            </h2>
            {profile.age > 0 && (
              <span className="text-[26px] font-medium text-card opacity-90">
                {profile.age}
              </span>
            )}
          </div>
          
          {/* Tags display - Show first 3 tags */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {profile.interests.slice(0, 3).map((interest, index) => (
                <div 
                  key={index}
                  className="px-3 py-1.5 rounded-full flex items-center bg-white/95 backdrop-blur-sm shadow-sm"
                >
                  <Tag className="w-3 h-3 mr-1.5 text-background" />
                  <span className="text-[12px] font-semibold text-background">
                    {interest}
                  </span>
                </div>
              ))}
              {profile.interests.length > 3 && (
                <div className="px-3 py-1.5 rounded-full flex items-center bg-white/80 backdrop-blur-sm">
                  <span className="text-[12px] font-semibold text-background">
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
  const { user, addMatch, updateUser, isDemo } = useApp();
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [matchModal, setMatchModal] = useState<ConnectionProfile | null>(null);
  const [viewingProfile, setViewingProfile] = useState<ConnectionProfile | null>(null);

  // Real data state
  const [realProfiles, setRealProfiles] = useState<ConnectionProfile[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [activeEventName, setActiveEventName] = useState<string>('Connect');
  const [loading, setLoading] = useState(true);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionEndReason, setSessionEndReason] = useState('');
  const geofenceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch real profiles from match_profiles table
  useEffect(() => {
    if (!user?.id || isDemo) {
      setLoading(false);
      return;
    }

    const fetchProfiles = async () => {
      setLoading(true);
      try {
        // Get user's most recent public check-in
        const { data: myCheckIn } = await supabase
          .from('check_ins')
          .select('event_id')
          .eq('user_id', user.id)
          .eq('visibility_mode', 'public')
          .order('checked_in_at', { ascending: false })
          .limit(1)
          .single();

        if (!myCheckIn) {
          setLoading(false);
          return;
        }

        setActiveEventId(myCheckIn.event_id);

        // Get event name
        const { data: eventData } = await supabase
          .from('events_public')
          .select('name, ended_at')
          .eq('id', myCheckIn.event_id)
          .single();

        if (eventData?.name) setActiveEventName(eventData.name);

        // Check if event already ended
        if (eventData?.ended_at) {
          setSessionEnded(true);
          setSessionEndReason('This event has ended.');
          setLoading(false);
          return;
        }

        // Fetch all other public match profiles for this event
        const { data: profiles } = await supabase
          .from('match_profiles')
          .select('*')
          .eq('event_id', myCheckIn.event_id)
          .eq('is_public', true)
          .eq('is_active', true)
          .neq('user_id', user.id);

        if (profiles) {
          const mapped: ConnectionProfile[] = profiles.map(p => ({
            id: p.id,
            userId: p.user_id || '',
            eventId: p.event_id || '',
            eventName: eventData?.name || '',
            name: p.display_name || 'Anonymous',
            age: p.age || 0,
            bio: p.bio || '',
            interests: p.interests || [],
            photo: (p.profile_photos && p.profile_photos.length > 0) ? p.profile_photos[0] : '/default-avatar.png',
            location: p.location || '',
            isPublic: true,
            occupation: p.occupation || undefined,
            gender: p.gender || undefined,
          }));
          setRealProfiles(mapped);
        }
      } catch (err) {
        console.error('Error fetching profiles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [user?.id, isDemo]);

  // Real-time subscription for new profiles
  useEffect(() => {
    if (!activeEventId || !user?.id || isDemo) return;

    const channel = supabase
      .channel(`connect-profiles-${activeEventId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'match_profiles',
        filter: `event_id=eq.${activeEventId}`,
      }, (payload) => {
        const p = payload.new as any;
        if (p.user_id === user.id || !p.is_public || !p.is_active) return;

        const newProfile: ConnectionProfile = {
          id: p.id,
          userId: p.user_id || '',
          eventId: p.event_id || '',
          eventName: activeEventName,
          name: p.display_name || 'Anonymous',
          age: p.age || 0,
          bio: p.bio || '',
          interests: p.interests || [],
          photo: (p.profile_photos?.length > 0) ? p.profile_photos[0] : '/default-avatar.png',
          location: p.location || '',
          isPublic: true,
          occupation: p.occupation || undefined,
          gender: p.gender || undefined,
        };
        setRealProfiles(prev => [...prev, newProfile]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeEventId, user?.id, isDemo, activeEventName]);

  // Periodic geofence & event lifecycle check
  useEffect(() => {
    if (!activeEventId || !user?.id || isDemo || sessionEnded) return;

    const checkAccess = async () => {
      try {
        // Check event still active
        const { data: event } = await supabase
          .from('events')
          .select('ended_at, is_active, latitude, longitude, geofence_radius')
          .eq('id', activeEventId)
          .single();

        if (!event) return;
        if (event.ended_at || !event.is_active) {
          setSessionEnded(true);
          setSessionEndReason('This event has ended. Your matches are still available in Chats.');
          return;
        }

        // Check geofence (only if we can get location without prompting)
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 30000 });
          });
          const R = 6371e3;
          const φ1 = (pos.coords.latitude * Math.PI) / 180;
          const φ2 = (Number(event.latitude) * Math.PI) / 180;
          const Δφ = ((Number(event.latitude) - pos.coords.latitude) * Math.PI) / 180;
          const Δλ = ((Number(event.longitude) - pos.coords.longitude) * Math.PI) / 180;
          const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
          const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

          if (dist > (event.geofence_radius || 50) * 3) { // 3x buffer before cutting off
            setSessionEnded(true);
            setSessionEndReason('You\'ve left the event area. Your matches are still available in Chats.');
          }
        } catch { /* location not available, skip check */ }
      } catch (err) {
        console.error('Access check error:', err);
      }
    };

    checkAccess();
    geofenceIntervalRef.current = setInterval(checkAccess, 60000);
    return () => { if (geofenceIntervalRef.current) clearInterval(geofenceIntervalRef.current); };
  }, [activeEventId, user?.id, isDemo, sessionEnded]);

  // Use real profiles when not in demo mode
  const availableProfiles = useMemo(() => {
    return realProfiles;
  }, [realProfiles]);

  const visibleProfiles = availableProfiles.slice(currentIndex, currentIndex + 2).reverse();
  const noMoreProfiles = currentIndex >= availableProfiles.length;

  const likesRemaining = user?.subscription.tier === 'free' ? (user.likesRemaining ?? 10) : Infinity;
  const likesExhausted = user?.subscription.tier === 'free' && likesRemaining <= 0;

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (sessionEnded) return;

    if (direction === 'right') {
      // Enforce like limit BEFORE processing
      if (user?.subscription.tier === 'free' && (user.likesRemaining ?? 0) <= 0) {
        toast({ title: 'Daily Limit Reached', description: 'Upgrade to Pro for unlimited likes!' });
        return; // Don't increment index
      }

      const profile = availableProfiles[currentIndex];
      if (!profile) return;

      if (user?.subscription.tier === 'free') {
        updateUser({ likesRemaining: (user.likesRemaining ?? 10) - 1 });
      }

      // Record the swipe in the database
      if (user?.id && profile.userId) {
        supabase.from('swipes').insert({
          swiper_id: user.id,
          swiped_id: profile.userId,
          event_id: profile.eventId,
          direction: 'right',
        }).then(() => {});
      }

      if (Math.random() > 0.7) {
        addMatch(profile);
        setMatchModal(profile);
      } else {
        toast({ title: `Liked ${profile.name} ❤️`, duration: 1500 });
      }
    } else {
      // Record left swipe
      const profile = availableProfiles[currentIndex];
      if (user?.id && profile?.userId) {
        supabase.from('swipes').insert({
          swiper_id: user.id,
          swiped_id: profile.userId,
          event_id: profile.eventId,
          direction: 'left',
        }).then(() => {});
      }
    }

    setHistory([...history, currentIndex]);
    setCurrentIndex((prev) => prev + 1);
  }, [user, availableProfiles, currentIndex, history, addMatch, updateUser, toast, sessionEnded]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastIndex = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setCurrentIndex(lastIndex);
  };

  const displayLikes = user?.subscription.tier === 'free' ? (user.likesRemaining ?? 10) : '∞';

  // No active event / not checked in
  if (!loading && !activeEventId && !isDemo) {
    return (
      <div className="fixed inset-0 overflow-hidden bg-background">
        <div className="h-full flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-primary/20">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-center text-foreground">
              Check In to Connect
            </h2>
            <p className="text-center mb-6 max-w-xs text-muted-foreground">
              Check in publicly at an event to see who's there and start matching!
            </p>
            <Button 
              onClick={() => navigate('/events')} 
              className="w-full max-w-[280px] h-[50px] rounded-ampz-md bg-primary text-primary-foreground"
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

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 overflow-hidden bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
        <div className="flex-shrink-0"><BottomNav /></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-background flex flex-col">
      {/* Session ended overlay */}
      {sessionEnded && (
        <div className="absolute inset-0 z-40 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center px-6">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-center text-foreground">Session Ended</h2>
          <p className="text-muted-foreground text-center mb-6 max-w-xs">{sessionEndReason}</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/chats')} className="h-12">
              View Matches
            </Button>
            <Button onClick={() => navigate('/events')} className="h-12">
              Browse Events
            </Button>
          </div>
        </div>
      )}

      {/* Fixed Header - Reduced height */}
      <div 
        className="flex-shrink-0 px-4 pt-4 pb-2"
        style={{ height: HEIGHTS.header }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[26px] font-bold mb-1 text-foreground">
              {activeEventName}
            </h1>
            <p className="text-[13px] text-muted-foreground">
              {availableProfiles.length - currentIndex} people here
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-brand-pink/20 border border-brand-pink/30">
            <ThumbsUp className="w-4 h-4 text-brand-pink" />
            <span className="text-sm font-bold text-brand-pink">
              {displayLikes}
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
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-primary/20 border-2 border-primary/30">
                  <ThumbsUp className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-[22px] font-bold mb-2 text-foreground">
                  That's Everyone!
                </h3>
                <p className="text-sm mb-4 text-muted-foreground">
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
            {/* Like limit warning */}
            {likesExhausted && (
              <div className="text-center mb-3">
                <p className="text-sm text-destructive font-medium">No likes remaining today</p>
                <Button
                  variant="link"
                  className="text-primary text-xs p-0 h-auto"
                  onClick={() => navigate('/settings')}
                >
                  Upgrade to Pro for unlimited likes
                </Button>
              </div>
            )}
            <div className="flex justify-center items-center gap-5">
              {/* Pass Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSwipe('left')}
                disabled={sessionEnded}
                className="flex items-center justify-center w-[70px] h-[70px] bg-destructive text-destructive-foreground rounded-full shadow-lg"
              >
                <ThumbsDown className="w-8 h-8" />
              </motion.button>

              {/* Undo Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleUndo}
                disabled={history.length === 0}
                className={cn(
                  "flex items-center justify-center w-12 h-12 bg-transparent text-muted-foreground rounded-full border-2 border-primary",
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
                disabled={sessionEnded || likesExhausted}
                className={cn(
                  "flex items-center justify-center w-[70px] h-[70px] bg-brand-pink text-background rounded-full shadow-lg font-semibold",
                  likesExhausted && "opacity-40 cursor-not-allowed"
                )}
              >
                <ThumbsUp className="w-8 h-8" />
              </motion.button>
            </div>

            {!likesExhausted && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="mx-auto block text-sm italic mt-4 text-primary opacity-80"
              >
                Maybe Later
              </motion.button>
            )}
          </>
        ) : (
          <div className="flex justify-center">
            <Button
              onClick={() => navigate('/events')}
              className="w-full max-w-[200px] h-[50px] rounded-ampz-md bg-primary text-primary-foreground shadow-lg"
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

      {/* Match Modal */}
      <Dialog open={!!matchModal} onOpenChange={() => setMatchModal(null)}>
        <DialogContent 
          className="p-0 border-0 rounded-t-[24px] rounded-b-none bottom-0 fixed max-w-none w-full bg-card m-0"
          style={{ bottom: 0, left: 0, right: 0, transform: 'none', top: 'auto', maxHeight: '85vh' }}
        >
          <div className="w-full flex justify-center pt-4 pb-1">
            <div className="w-12 h-1 rounded-full bg-muted-foreground/50" />
          </div>
          <motion.div 
            className="py-6 px-5"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="relative w-24 h-24 mx-auto mb-5">
              <motion.div 
                className="absolute inset-0 rounded-full gradient-primary"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <img
                src={matchModal?.photo || '/default-avatar.png'}
                alt={matchModal?.name}
                className="w-full h-full rounded-full object-cover border-4 border-card relative z-10 object-center"
                onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }}
              />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center z-20 border-2 border-card bg-brand-gold"
              >
                <ThumbsUp className="w-3 h-3 text-white fill-white" />
              </motion.div>
            </div>
            
            <motion.h2 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-[28px] font-bold mb-2 text-center text-foreground"
            >
              It's a Match!
            </motion.h2>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mb-6 text-center text-muted-foreground text-base"
            >
              You and {matchModal?.name} liked each other
            </motion.p>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setMatchModal(null)}
                className="flex-1 h-12 rounded-ampz-md border-primary text-primary bg-transparent hover:bg-primary/10 text-base font-semibold"
              >
                Keep Swiping
              </Button>
              <Button
                onClick={() => { setMatchModal(null); navigate('/matches'); }}
                className="flex-1 h-12 rounded-ampz-md bg-primary text-primary-foreground hover:bg-accent text-base font-semibold shadow-lg"
              >
                Message
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Profile View Modal */}
      <Dialog open={!!viewingProfile} onOpenChange={() => setViewingProfile(null)}>
        <DialogContent 
          className="p-0 border-0 rounded-t-[24px] rounded-b-none bottom-0 fixed max-w-none w-full bg-card m-0"
          style={{ bottom: 0, left: 0, right: 0, transform: 'none', top: 'auto', maxHeight: '95vh' }}
        >
          <div className="w-full flex justify-center pt-4 pb-1">
            <div className="w-12 h-1 rounded-full bg-muted-foreground/50" />
          </div>
          <motion.div 
            className="overflow-y-auto max-h-[90vh]"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {viewingProfile && (
              <>
                <div className="relative h-64">
                  <img
                    src={viewingProfile.photo || '/default-avatar.png'}
                    alt={viewingProfile.name}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <button
                    onClick={() => setViewingProfile(null)}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md hover:scale-105 ampz-transition bg-black/60 border border-primary/30 shadow-lg"
                  >
                    <X className="w-5 h-5 text-foreground" />
                  </button>
                </div>
                
                <div className="p-5 space-y-6">
                  <div>
                    <h2 className="text-[28px] font-bold mb-1 text-foreground">
                      {viewingProfile.name}{viewingProfile.age > 0 ? `, ${viewingProfile.age}` : ''}
                    </h2>
                    {viewingProfile.occupation && (
                      <div className="flex items-center gap-2 mb-3">
                        <Briefcase className="w-4 h-4 text-primary" />
                        <span className="text-base text-primary">{viewingProfile.occupation}</span>
                      </div>
                    )}
                    {viewingProfile.gender && (
                      <div className="mb-2">
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30">
                          <span className="text-sm font-medium text-primary">{viewingProfile.gender}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {viewingProfile.bio && (
                    <div>
                      <h3 className="text-[13px] font-semibold mb-3 uppercase tracking-wider text-muted-foreground">About</h3>
                      <p className="text-[15px] leading-relaxed text-muted-foreground">{viewingProfile.bio}</p>
                    </div>
                  )}

                  {viewingProfile.location && (
                    <div>
                      <h3 className="text-[13px] font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Location</h3>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-[15px] text-muted-foreground">{viewingProfile.location}</span>
                      </div>
                    </div>
                  )}

                  {viewingProfile.interests && viewingProfile.interests.length > 0 && (
                    <div>
                      <h3 className="text-[13px] font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Interests</h3>
                      <div className="flex flex-wrap gap-2">
                        {viewingProfile.interests.map((interest, index) => (
                          <div key={index} className="flex items-center px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
                            <Tag className="w-3 h-3 mr-2 text-primary" />
                            <span className="text-[13px] font-medium text-primary">{interest}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-5 border-t border-muted-foreground/20 pb-safe">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => { setViewingProfile(null); handleSwipe('left'); }}
                      className="flex-1 h-12 rounded-ampz-md border-destructive text-destructive bg-transparent hover:bg-destructive/10 text-base font-semibold"
                    >
                      <ThumbsDown className="w-5 h-5 mr-2" />
                      Pass
                    </Button>
                    <Button
                      onClick={() => { setViewingProfile(null); handleSwipe('right'); }}
                      disabled={likesExhausted}
                      className="flex-1 h-12 rounded-ampz-md bg-primary text-primary-foreground hover:bg-accent text-base font-semibold shadow-lg"
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
