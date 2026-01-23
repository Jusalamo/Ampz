import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Event, Match, Ticket, ConnectionProfile, CommunityPhoto, CommunityComment, AppNotification } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { generateAccessCode, generateEventToken, buildCheckInURL } from '@/lib/qr-utils';

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  isDemo: boolean;
  isLoading: boolean;
  events: Event[];
  matches: Match[];
  tickets: Ticket[];
  connectionProfiles: ConnectionProfile[];
  currentEventId: string | null;
  theme: 'dark' | 'light';
  currency: string;
  notifications: AppNotification[];
  communityPhotos: CommunityPhoto[];
  communityComments: CommunityComment[];
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string, age: number) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginDemo: () => Promise<boolean>;
  logout: () => Promise<void>;
  setCurrentEventId: (id: string | null) => void;
  toggleTheme: () => void;
  setCurrency: (currency: string) => void;
  bookmarkEvent: (eventId: string) => void;
  addMatch: (profile: ConnectionProfile) => void;
  updateUser: (updates: Partial<User>) => void;
  updateSubscription: (tier: 'free' | 'pro' | 'max') => void;
  addEvent: (event: Partial<Event>) => Promise<Event | null>;
  updateEvent: (eventId: string, updates: Partial<Event>) => Promise<boolean>;
  deleteEvent: (eventId: string) => Promise<boolean>;
  addTicket: (ticket: Ticket) => void;
  checkInToEvent: (eventId: string, isPublic: boolean, photo?: string) => void;
  addCommunityPhoto: (eventId: string, imageUrl: string) => void;
  addCommunityComment: (eventId: string, text: string, parentId?: string) => void;
  likePhoto: (photoId: string) => void;
  likeComment: (commentId: string) => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadNotificationsCount: number;
  refetchEvents: () => Promise<void>;
  generateEventQR: (eventId: string) => Promise<string | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Convert database profile to User type
const profileToUser = (profile: any, supabaseUser?: SupabaseUser): User => ({
  id: profile.id,
  email: profile.email || supabaseUser?.email || '',
  createdAt: profile.created_at || new Date().toISOString(),
  profile: {
    name: profile.name || supabaseUser?.email?.split('@')[0] || 'User',
    age: profile.age || 25,
    bio: profile.bio || '',
    occupation: profile.occupation || '',
    company: profile.company || '',
    location: profile.location || 'Windhoek, Namibia',
    gender: profile.gender || '',
    interests: profile.interests || [],
    profilePhoto: profile.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`,
    phone: profile.phone || '',
  },
  subscription: {
    tier: (profile.subscription_tier as 'free' | 'pro' | 'max') || 'free',
    expiresAt: profile.subscription_expires_at || null,
  },
  settings: profile.settings || {
    theme: 'dark',
    currency: 'NAD',
    notifications: { matches: true, messages: true, events: true, profileViews: true },
    privacy: { searchable: true, showDistance: true, showOnline: true, messageFrom: 'everyone' },
  },
  blockedUsers: profile.blocked_users || [],
  bookmarkedEvents: profile.bookmarked_events || [],
  createdEvents: profile.created_events || [],
  likesRemaining: profile.likes_remaining ?? 25,
  lastLikeReset: profile.last_like_reset || new Date().toISOString(),
  isDemo: profile.is_demo_account || false,
});

// Convert database row to Event type
const rowToEvent = (row: any): Event => ({
  id: row.id,
  name: row.name,
  description: row.description || '',
  category: row.category,
  location: row.location,
  address: row.address,
  coordinates: { lat: row.latitude, lng: row.longitude },
  date: row.date,
  time: row.time,
  price: row.price || 0,
  currency: row.currency || 'NAD',
  maxAttendees: row.max_attendees || 500,
  attendees: row.attendees_count || 0,
  organizerId: row.organizer_id,
  qrCode: row.qr_code,
  qrCodeUrl: row.qr_code ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/#/event/${row.id}`)}&format=png&bgcolor=ffffff&color=000000&qzone=1&margin=10&ecc=H` : undefined,
  geofenceRadius: row.geofence_radius || 50,
  customTheme: row.custom_theme || '#8B5CF6',
  coverImage: row.cover_image || '',
  images: row.images || [],
  videos: row.videos || [],
  tags: row.tags || [],
  isFeatured: row.is_featured || false,
  isDemo: row.is_demo || false,
  isActive: row.is_active ?? true,
  hasVideo: row.has_video || false,
  mediaType: row.media_type || 'carousel',
  notificationsEnabled: row.notifications_enabled ?? true,
  updatedAt: row.updated_at,
  ticketLink: row.ticket_link || '',
  webTicketsLink: row.ticket_link || '', // Map ticket_link to webTicketsLink
  accessCode: row.access_code || '',
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [connectionProfiles, setConnectionProfiles] = useState<ConnectionProfile[]>([]);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currency, setCurrencyState] = useState<string>('NAD');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [communityPhotos, setCommunityPhotos] = useState<CommunityPhoto[]>([]);
  const [communityComments, setCommunityComments] = useState<CommunityComment[]>([]);

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId: string): Promise<any> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  }, []);

  // Fetch events from database
  const fetchEvents = useCallback(async () => {
    try {
      let query = supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('date', { ascending: true });

      // In production mode, exclude demo events
      if (!isDemo) {
        query = query.eq('is_demo', false);
      }

      const { data, error } = await query;
      if (!error && data) {
        setEvents(data.map(rowToEvent));
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  }, [isDemo]);

  // Initialize auth state - robust and non-blocking (prevents infinite spinners)
  useEffect(() => {
    let mounted = true;

    // Load theme from storage
    const storedTheme = localStorage.getItem('amps_theme') as 'dark' | 'light';
    const storedCurrency = localStorage.getItem('amps_currency');
    if (storedTheme) {
      setTheme(storedTheme);
      // Apply the correct class for Tailwind - .dark for dark mode, remove for light
      document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    } else {
      // Default to dark mode
      document.documentElement.classList.add('dark');
    }
    if (storedCurrency) setCurrencyState(storedCurrency);

    const resolveUserFromSession = (sess: Session | null) => {
      if (!mounted) return;

      setSession(sess);

      if (!sess?.user) {
        setUser(null);
        setIsDemo(false);
        setIsLoading(false);
        return;
      }

      // Immediately set a safe fallback user so routing can proceed instantly.
      // We then hydrate with the real profile asynchronously.
      const fallbackProfile = {
        id: sess.user.id,
        email: sess.user.email,
        name:
          (sess.user.user_metadata as any)?.name ??
          sess.user.email?.split('@')[0] ??
          'User',
        is_demo_account: (sess.user.user_metadata as any)?.is_demo ?? false,
      };

      setUser(profileToUser(fallbackProfile, sess.user));
      setIsDemo(!!fallbackProfile.is_demo_account);
      setIsLoading(false);

      // Hydrate profile without calling the backend inside the auth callback.
      setTimeout(async () => {
        const profile = await fetchProfile(sess.user.id);
        if (!mounted) return;

        if (profile) {
          setUser(profileToUser(profile, sess.user));
          setIsDemo(profile.is_demo_account || false);
          return;
        }

        // Best-effort: create a profile row if missing (avoids "logged in but no app user" states).
        const { data: created, error } = await supabase
          .from('profiles')
          .upsert(
            {
              id: sess.user.id,
              email: sess.user.email,
              name: fallbackProfile.name,
              is_demo_account: fallbackProfile.is_demo_account,
            },
            { onConflict: 'id' }
          )
          .select('*')
          .single();

        if (!mounted) return;
        if (!error && created) {
          setUser(profileToUser(created, sess.user));
          setIsDemo(created.is_demo_account || false);
        }
      }, 0);
    };

    // Hard stop: never allow the app to be blocked by an infinite loading state.
    const hardTimeout = window.setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 2000);

    // Listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, newSession) => {
      resolveUserFromSession(newSession);
    });

    // THEN check for an existing session
    supabase.auth
      .getSession()
      .then(({ data: { session: existingSession } }) => {
        resolveUserFromSession(existingSession);
      })
      .catch(() => {
        if (mounted) setIsLoading(false);
      })
      .finally(() => {
        window.clearTimeout(hardTimeout);
      });

    return () => {
      mounted = false;
      window.clearTimeout(hardTimeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Fetch events and set up real-time subscription
  useEffect(() => {
    if (!isLoading) {
      fetchEvents();

      // Real-time subscription for events
      const eventsChannel = supabase
        .channel('events-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newEvent = rowToEvent(payload.new);
            if (!isDemo && newEvent.isDemo) return;
            setEvents(prev => [...prev, newEvent]);
          } else if (payload.eventType === 'UPDATE') {
            setEvents(prev => prev.map(e => e.id === payload.new.id ? rowToEvent(payload.new) : e));
          } else if (payload.eventType === 'DELETE') {
            setEvents(prev => prev.filter(e => e.id !== payload.old.id));
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(eventsChannel);
      };
    }
  }, [isLoading, isDemo, fetchEvents]);

  // Login with email/password
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return !error;
    } catch {
      return false;
    }
  };

  // Signup with email/password
  const signup = async (email: string, password: string, name: string, age: number): Promise<boolean> => {
    try {
      const redirectUrl = `${window.location.origin}${window.location.pathname}`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { name, age },
        },
      });
      return !error;
    } catch {
      return false;
    }
  };

  // Login with Google
  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const redirectUrl = `${window.location.origin}${window.location.pathname}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl },
      });
      return !error;
    } catch {
      return false;
    }
  };

  // Login Demo
  const loginDemo = async (): Promise<boolean> => {
    const DEMO_EMAIL = 'demo@amps.app';
    const DEMO_PASSWORD = 'demo123456';

    try {
      // Try to sign in first
      let { error } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });

      if (error?.message.includes('Invalid login credentials')) {
        // Create demo account
        const { data, error: signupError } = await supabase.auth.signUp({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
          options: { data: { name: 'Demo User', is_demo: true } },
        });

        if (signupError) return false;

        if (data.user) {
          await supabase.from('profiles').update({
            is_demo_account: true,
            name: 'Demo User',
            subscription_tier: 'pro',
          }).eq('id', data.user.id);
        }
        
        return true;
      }

      return !error;
    } catch {
      return false;
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsDemo(false);
    setMatches([]);
    setTickets([]);
    setNotifications([]);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    // Apply the correct class for Tailwind - .dark for dark mode, remove for light
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('amps_theme', newTheme);
  };

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('amps_currency', newCurrency);
  };

  const bookmarkEvent = async (eventId: string) => {
    if (!user) return;
    
    const bookmarked = user.bookmarkedEvents.includes(eventId)
      ? user.bookmarkedEvents.filter(id => id !== eventId)
      : [...user.bookmarkedEvents, eventId];
    
    // Update in database
    await supabase.from('profiles').update({
      bookmarked_events: bookmarked,
    }).eq('id', user.id);

    setUser({ ...user, bookmarkedEvents: bookmarked });
  };

  const addMatch = (profile: ConnectionProfile) => {
    const newMatch: Match = {
      id: crypto.randomUUID(),
      matchProfile: profile,
      eventId: profile.eventId,
      eventName: events.find(e => e.id === profile.eventId)?.name || 'Event',
      timestamp: new Date().toISOString(),
      lastMessage: '',
      lastMessageTime: 'Just now',
      unread: false,
      online: Math.random() > 0.5,
    };
    setMatches(prev => [...prev, newMatch]);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    const dbUpdates: Record<string, any> = {};
    if (updates.profile) {
      if (updates.profile.name !== undefined) dbUpdates.name = updates.profile.name;
      if (updates.profile.age !== undefined) dbUpdates.age = updates.profile.age;
      if (updates.profile.bio !== undefined) dbUpdates.bio = updates.profile.bio;
      if (updates.profile.occupation !== undefined) dbUpdates.occupation = updates.profile.occupation;
      if (updates.profile.company !== undefined) dbUpdates.company = updates.profile.company;
      if (updates.profile.location !== undefined) dbUpdates.location = updates.profile.location;
      if (updates.profile.gender !== undefined) dbUpdates.gender = updates.profile.gender;
      if (updates.profile.interests !== undefined) dbUpdates.interests = updates.profile.interests;
      if (updates.profile.profilePhoto !== undefined) dbUpdates.profile_photo = updates.profile.profilePhoto;
      if (updates.profile.phone !== undefined) dbUpdates.phone = updates.profile.phone;
    }

    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from('profiles').update(dbUpdates).eq('id', user.id);
    }

    setUser({ ...user, ...updates });
  };

  const updateSubscription = async (tier: 'free' | 'pro' | 'max') => {
    if (!user) return;
    const expiresAt = tier === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    await supabase.from('profiles').update({
      subscription_tier: tier,
      subscription_expires_at: expiresAt,
      likes_remaining: tier === 'free' ? 25 : 999,
    }).eq('id', user.id);

    setUser({ 
      ...user, 
      subscription: { tier, expiresAt },
      likesRemaining: tier === 'free' ? 25 : Infinity,
    });
  };

  // Create event in database
  const addEvent = async (eventData: Partial<Event>): Promise<Event | null> => {
    if (!user) return null;

    const accessCode = generateAccessCode();
    const eventId = crypto.randomUUID();
    
    const insertData = {
      id: eventId,
      name: eventData.name || 'Untitled Event',
      description: eventData.description || '',
      category: eventData.category || 'other',
      location: eventData.location || '',
      address: eventData.address || '',
      latitude: eventData.coordinates?.lat || -22.5609,
      longitude: eventData.coordinates?.lng || 17.0658,
      date: eventData.date || new Date().toISOString().split('T')[0],
      time: eventData.time || '18:00',
      price: eventData.price || 0,
      currency: eventData.currency || 'NAD',
      max_attendees: eventData.maxAttendees || 500,
      attendees_count: 0,
      organizer_id: user.id,
      qr_code: accessCode,
      access_code: accessCode,
      geofence_radius: eventData.geofenceRadius || 50,
      custom_theme: eventData.customTheme || '#8B5CF6',
      cover_image: eventData.coverImage || '',
      images: eventData.images || [],
      videos: eventData.videos || [],
      tags: eventData.tags || [],
      is_featured: eventData.isFeatured || false,
      is_demo: isDemo,
      is_active: true,
      has_video: (eventData.videos?.length || 0) > 0,
      media_type: eventData.mediaType || 'carousel',
      notifications_enabled: eventData.notificationsEnabled ?? true,
      ticket_link: eventData.webTicketsLink || (eventData as any).ticketLink || '',
    };

    const { data, error } = await supabase
      .from('events')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return null;
    }

    // Update user's created events
    const createdEvents = [...(user.createdEvents || []), data.id];
    await supabase.from('profiles').update({ created_events: createdEvents }).eq('id', user.id);
    setUser({ ...user, createdEvents });

    return rowToEvent(data);
  };

  // Update event in database
  const updateEvent = async (eventId: string, updates: Partial<Event>): Promise<boolean> => {
    const dbUpdates: Record<string, any> = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.coordinates !== undefined) {
      dbUpdates.latitude = updates.coordinates.lat;
      dbUpdates.longitude = updates.coordinates.lng;
    }
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.time !== undefined) dbUpdates.time = updates.time;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.geofenceRadius !== undefined) dbUpdates.geofence_radius = updates.geofenceRadius;
    if (updates.customTheme !== undefined) dbUpdates.custom_theme = updates.customTheme;
    if (updates.coverImage !== undefined) dbUpdates.cover_image = updates.coverImage;
    if (updates.images !== undefined) dbUpdates.images = updates.images;
    if (updates.videos !== undefined) {
      dbUpdates.videos = updates.videos;
      dbUpdates.has_video = updates.videos.length > 0;
    }
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.mediaType !== undefined) dbUpdates.media_type = updates.mediaType;
    if (updates.webTicketsLink !== undefined) dbUpdates.ticket_link = updates.webTicketsLink;
    if ((updates as any).ticketLink !== undefined) dbUpdates.ticket_link = (updates as any).ticketLink;

    const { error } = await supabase.from('events').update(dbUpdates).eq('id', eventId);
    return !error;
  };

  // Delete event from database
  const deleteEvent = async (eventId: string): Promise<boolean> => {
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    
    if (!error && user) {
      const createdEvents = user.createdEvents.filter(id => id !== eventId);
      await supabase.from('profiles').update({ created_events: createdEvents }).eq('id', user.id);
      setUser({ ...user, createdEvents });
    }
    
    return !error;
  };

  const addTicket = (ticket: Ticket) => {
    setTickets(prev => [...prev, ticket]);
  };

  const checkInToEvent = async (eventId: string, isPublic: boolean, photo?: string) => {
    if (!user) return;
    setCurrentEventId(eventId);
    
    if (isPublic) {
      const connectionProfile: ConnectionProfile = {
        id: crypto.randomUUID(),
        userId: user.id,
        eventId,
        name: user.profile.name,
        age: user.profile.age,
        bio: user.profile.bio,
        interests: user.profile.interests,
        photo: photo || user.profile.profilePhoto,
        location: user.profile.location,
        isPublic: true,
        occupation: user.profile.occupation,
      };
      setConnectionProfiles(prev => [...prev, connectionProfile]);
    }
  };

  const addCommunityPhoto = async (eventId: string, imageUrl: string) => {
    if (!user) return;
    
    const { data, error } = await supabase.from('community_photos').insert({
      event_id: eventId,
      user_id: user.id,
      image_url: imageUrl,
      is_demo: isDemo,
    }).select().single();

    if (!error && data) {
      const photo: CommunityPhoto = {
        id: data.id,
        eventId,
        userId: user.id,
        userName: user.profile.name,
        userPhoto: user.profile.profilePhoto,
        imageUrl,
        timestamp: data.created_at,
        likes: 0,
        likedBy: [],
      };
      setCommunityPhotos(prev => [...prev, photo]);
    }
  };

  const addCommunityComment = async (eventId: string, text: string, parentId?: string) => {
    if (!user) return;
    
    const { data, error } = await supabase.from('community_comments').insert({
      event_id: eventId,
      user_id: user.id,
      content: text,
      reply_to: parentId || null,
      is_demo: isDemo,
    }).select().single();

    if (!error && data) {
      const comment: CommunityComment = {
        id: data.id,
        eventId,
        userId: user.id,
        userName: user.profile.name,
        userPhoto: user.profile.profilePhoto,
        text,
        timestamp: data.created_at,
        likes: 0,
        likedBy: [],
        replyTo: parentId,
      };
      setCommunityComments(prev => [...prev, comment]);
    }
  };

  const likePhoto = async (photoId: string) => {
    if (!user) return;
    
    const photo = communityPhotos.find(p => p.id === photoId);
    if (!photo) return;
    
    const alreadyLiked = photo.likedBy.includes(user.id);
    const newLikedBy = alreadyLiked 
      ? photo.likedBy.filter(id => id !== user.id)
      : [...photo.likedBy, user.id];

    await supabase.from('community_photos').update({
      liked_by: newLikedBy,
      likes_count: newLikedBy.length,
    }).eq('id', photoId);

    setCommunityPhotos(prev => prev.map(p => 
      p.id === photoId ? { ...p, likes: newLikedBy.length, likedBy: newLikedBy } : p
    ));
  };

  const likeComment = async (commentId: string) => {
    if (!user) return;
    
    const comment = communityComments.find(c => c.id === commentId);
    if (!comment) return;
    
    const alreadyLiked = comment.likedBy.includes(user.id);
    const newLikedBy = alreadyLiked 
      ? comment.likedBy.filter(id => id !== user.id)
      : [...comment.likedBy, user.id];

    await supabase.from('community_comments').update({
      liked_by: newLikedBy,
      likes_count: newLikedBy.length,
    }).eq('id', commentId);

    setCommunityComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, likes: newLikedBy.length, likedBy: newLikedBy, isLiked: !alreadyLiked } : c
    ));
  };

  const addNotification = (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: AppNotification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const generateEventQR = async (eventId: string): Promise<string | null> => {
    const event = events.find(e => e.id === eventId);
    if (!event) return null;

    try {
      const QRCode = await import('qrcode');
      const token = generateEventToken(eventId);
      const checkInUrl = buildCheckInURL(eventId, token);
      return await QRCode.toDataURL(checkInUrl, { width: 300, margin: 2 });
    } catch {
      return null;
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isDemo,
        isLoading,
        events,
        matches,
        tickets,
        connectionProfiles,
        currentEventId,
        theme,
        currency,
        notifications,
        communityPhotos,
        communityComments,
        login,
        signup,
        loginWithGoogle,
        loginDemo,
        logout,
        setCurrentEventId,
        toggleTheme,
        setCurrency,
        bookmarkEvent,
        addMatch,
        updateUser,
        updateSubscription,
        addEvent,
        updateEvent,
        deleteEvent,
        addTicket,
        checkInToEvent,
        addCommunityPhoto,
        addCommunityComment,
        likePhoto,
        likeComment,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        unreadNotificationsCount,
        refetchEvents: fetchEvents,
        generateEventQR,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
