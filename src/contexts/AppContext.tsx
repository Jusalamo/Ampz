import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Event, Match, Ticket, ConnectionProfile, CommunityPhoto, CommunityComment, AppNotification } from '@/lib/types';
import { demoUser, demoEvents, demoMatches, demoTickets, demoConnectionProfiles, demoNotifications } from '@/lib/demo-data';

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  isDemo: boolean;
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
  loginDemo: () => void;
  logout: () => void;
  setCurrentEventId: (id: string | null) => void;
  toggleTheme: () => void;
  setCurrency: (currency: string) => void;
  bookmarkEvent: (eventId: string) => void;
  addMatch: (profile: ConnectionProfile) => void;
  updateUser: (updates: Partial<User>) => void;
  updateSubscription: (tier: 'free' | 'pro' | 'max') => void;
  addEvent: (event: Event) => void;
  updateEvent: (eventId: string, updates: Partial<Event>) => void;
  deleteEvent: (eventId: string) => void;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [events, setEvents] = useState<Event[]>(demoEvents);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [connectionProfiles, setConnectionProfiles] = useState<ConnectionProfile[]>(demoConnectionProfiles);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currency, setCurrencyState] = useState<string>('NAD');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [communityPhotos, setCommunityPhotos] = useState<CommunityPhoto[]>([]);
  const [communityComments, setCommunityComments] = useState<CommunityComment[]>([]);

  useEffect(() => {
    // Load persisted data
    const storedUser = localStorage.getItem('amps_user');
    const storedTheme = localStorage.getItem('amps_theme') as 'dark' | 'light';
    const storedCurrency = localStorage.getItem('amps_currency');
    
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      const storedMatches = localStorage.getItem('amps_matches');
      const storedTickets = localStorage.getItem('amps_tickets');
      const storedEvents = localStorage.getItem('amps_events');
      const storedNotifications = localStorage.getItem('amps_notifications');
      const storedPhotos = localStorage.getItem('amps_photos');
      const storedComments = localStorage.getItem('amps_comments');
      
      if (storedMatches) setMatches(JSON.parse(storedMatches));
      if (storedTickets) setTickets(JSON.parse(storedTickets));
      if (storedEvents) setEvents(JSON.parse(storedEvents));
      if (storedNotifications) setNotifications(JSON.parse(storedNotifications));
      if (storedPhotos) setCommunityPhotos(JSON.parse(storedPhotos));
      if (storedComments) setCommunityComments(JSON.parse(storedComments));
    }
    
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.classList.toggle('light', storedTheme === 'light');
    }
    
    if (storedCurrency) {
      setCurrencyState(storedCurrency);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (email && password) {
      const newUser: User = {
        id: crypto.randomUUID(),
        email,
        createdAt: new Date().toISOString(),
        profile: {
          name: email.split('@')[0],
          age: 25,
          bio: '',
          occupation: '',
          company: '',
          location: 'Windhoek, Namibia',
          gender: '',
          interests: [],
          profilePhoto: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          phone: '',
        },
        subscription: { tier: 'free', expiresAt: null },
        settings: {
          theme: 'dark',
          currency: 'NAD',
          notifications: { matches: true, messages: true, events: true, profileViews: true },
          privacy: { searchable: true, showDistance: true, showOnline: true, messageFrom: 'everyone' },
        },
        blockedUsers: [],
        bookmarkedEvents: [],
        createdEvents: [],
        likesRemaining: 10,
        lastLikeReset: new Date().toISOString(),
      };
      setUser(newUser);
      setIsDemo(false);
      setMatches([]);
      setTickets([]);
      setNotifications([]);
      localStorage.setItem('amps_user', JSON.stringify(newUser));
      localStorage.removeItem('amps_matches');
      localStorage.removeItem('amps_tickets');
      localStorage.removeItem('amps_notifications');
      return true;
    }
    return false;
  };

  const signup = async (email: string, password: string, name: string, age: number): Promise<boolean> => {
    if (email && password && name) {
      const newUser: User = {
        id: crypto.randomUUID(),
        email,
        createdAt: new Date().toISOString(),
        profile: {
          name,
          age: age || 25,
          bio: '',
          occupation: '',
          company: '',
          location: 'Windhoek, Namibia',
          gender: '',
          interests: [],
          profilePhoto: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          phone: '',
        },
        subscription: { tier: 'free', expiresAt: null },
        settings: {
          theme: 'dark',
          currency: 'NAD',
          notifications: { matches: true, messages: true, events: true, profileViews: true },
          privacy: { searchable: true, showDistance: true, showOnline: true, messageFrom: 'everyone' },
        },
        blockedUsers: [],
        bookmarkedEvents: [],
        createdEvents: [],
        likesRemaining: 10,
        lastLikeReset: new Date().toISOString(),
      };
      setUser(newUser);
      setIsDemo(false);
      setMatches([]);
      setTickets([]);
      setNotifications([]);
      localStorage.setItem('amps_user', JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const loginDemo = () => {
    setUser(demoUser);
    setIsDemo(true);
    setMatches(demoMatches);
    setTickets(demoTickets);
    setNotifications(demoNotifications);
    localStorage.setItem('amps_user', JSON.stringify(demoUser));
    localStorage.setItem('amps_matches', JSON.stringify(demoMatches));
    localStorage.setItem('amps_tickets', JSON.stringify(demoTickets));
    localStorage.setItem('amps_notifications', JSON.stringify(demoNotifications));
  };

  const logout = () => {
    setUser(null);
    setIsDemo(false);
    setMatches([]);
    setTickets([]);
    setNotifications([]);
    setCommunityPhotos([]);
    setCommunityComments([]);
    localStorage.removeItem('amps_user');
    localStorage.removeItem('amps_matches');
    localStorage.removeItem('amps_tickets');
    localStorage.removeItem('amps_notifications');
    localStorage.removeItem('amps_photos');
    localStorage.removeItem('amps_comments');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('light', newTheme === 'light');
    localStorage.setItem('amps_theme', newTheme);
  };

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('amps_currency', newCurrency);
  };

  const bookmarkEvent = (eventId: string) => {
    if (!user) return;
    const bookmarked = user.bookmarkedEvents.includes(eventId)
      ? user.bookmarkedEvents.filter(id => id !== eventId)
      : [...user.bookmarkedEvents, eventId];
    
    const updatedUser = { ...user, bookmarkedEvents: bookmarked };
    setUser(updatedUser);
    localStorage.setItem('amps_user', JSON.stringify(updatedUser));
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
    const updatedMatches = [...matches, newMatch];
    setMatches(updatedMatches);
    localStorage.setItem('amps_matches', JSON.stringify(updatedMatches));
    
    addNotification({
      type: 'match',
      title: "It's a Match!",
      message: `You and ${profile.name} liked each other`,
      data: { matchId: newMatch.id },
    });
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('amps_user', JSON.stringify(updatedUser));
  };

  const updateSubscription = (tier: 'free' | 'pro' | 'max') => {
    if (!user) return;
    const expiresAt = tier === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const updatedUser = { 
      ...user, 
      subscription: { tier, expiresAt },
      likesRemaining: tier === 'free' ? 10 : Infinity,
    };
    setUser(updatedUser);
    localStorage.setItem('amps_user', JSON.stringify(updatedUser));
  };

  const addEvent = (event: Event) => {
    const updatedEvents = [...events, event];
    setEvents(updatedEvents);
    localStorage.setItem('amps_events', JSON.stringify(updatedEvents));
    
    if (user) {
      const updatedUser = { ...user, createdEvents: [...user.createdEvents, event.id] };
      setUser(updatedUser);
      localStorage.setItem('amps_user', JSON.stringify(updatedUser));
    }
  };

  const updateEvent = (eventId: string, updates: Partial<Event>) => {
    const updatedEvents = events.map(e => e.id === eventId ? { ...e, ...updates } : e);
    setEvents(updatedEvents);
    localStorage.setItem('amps_events', JSON.stringify(updatedEvents));
  };

  const deleteEvent = (eventId: string) => {
    const updatedEvents = events.filter(e => e.id !== eventId);
    setEvents(updatedEvents);
    localStorage.setItem('amps_events', JSON.stringify(updatedEvents));
    
    if (user) {
      const updatedUser = { ...user, createdEvents: user.createdEvents.filter(id => id !== eventId) };
      setUser(updatedUser);
      localStorage.setItem('amps_user', JSON.stringify(updatedUser));
    }
  };

  const addTicket = (ticket: Ticket) => {
    const updatedTickets = [...tickets, ticket];
    setTickets(updatedTickets);
    localStorage.setItem('amps_tickets', JSON.stringify(updatedTickets));
  };

  const checkInToEvent = (eventId: string, isPublic: boolean, photo?: string) => {
    if (!user) return;
    
    setCurrentEventId(eventId);
    
    // Add user to connection profiles if public
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
      const updatedProfiles = [...connectionProfiles, connectionProfile];
      setConnectionProfiles(updatedProfiles);
    }
    
    // Update event attendees
    const updatedEvents = events.map(e => 
      e.id === eventId ? { ...e, attendees: e.attendees + 1 } : e
    );
    setEvents(updatedEvents);
    localStorage.setItem('amps_events', JSON.stringify(updatedEvents));
  };

  const addCommunityPhoto = (eventId: string, imageUrl: string) => {
    if (!user) return;
    const photo: CommunityPhoto = {
      id: crypto.randomUUID(),
      eventId,
      userId: user.id,
      userName: user.profile.name,
      userPhoto: user.profile.profilePhoto,
      imageUrl,
      timestamp: new Date().toISOString(),
      likes: 0,
      likedBy: [],
    };
    const updated = [...communityPhotos, photo];
    setCommunityPhotos(updated);
    localStorage.setItem('amps_photos', JSON.stringify(updated));
  };

  const addCommunityComment = (eventId: string, text: string, parentId?: string) => {
    if (!user) return;
    const comment: CommunityComment = {
      id: crypto.randomUUID(),
      eventId,
      userId: user.id,
      userName: user.profile.name,
      userPhoto: user.profile.profilePhoto,
      text,
      timestamp: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      replyTo: parentId,
    };
    
    const updated = [...communityComments, comment];
    setCommunityComments(updated);
    localStorage.setItem('amps_comments', JSON.stringify(updated));
  };

  const likePhoto = (photoId: string) => {
    if (!user) return;
    const updated = communityPhotos.map(p => {
      if (p.id === photoId) {
        const alreadyLiked = p.likedBy.includes(user.id);
        return {
          ...p,
          likes: alreadyLiked ? p.likes - 1 : p.likes + 1,
          likedBy: alreadyLiked 
            ? p.likedBy.filter(id => id !== user.id)
            : [...p.likedBy, user.id],
        };
      }
      return p;
    });
    setCommunityPhotos(updated);
    localStorage.setItem('amps_photos', JSON.stringify(updated));
  };

  const likeComment = (commentId: string) => {
    if (!user) return;
    const updated = communityComments.map(c => {
      if (c.id === commentId) {
        const alreadyLiked = c.likedBy.includes(user.id);
        return {
          ...c,
          likes: alreadyLiked ? c.likes - 1 : c.likes + 1,
          likedBy: alreadyLiked 
            ? c.likedBy.filter(id => id !== user.id)
            : [...c.likedBy, user.id],
          isLiked: !alreadyLiked,
        };
      }
      return c;
    });
    setCommunityComments(updated);
    localStorage.setItem('amps_comments', JSON.stringify(updated));
  };

  const addNotification = (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: AppNotification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    const updated = [newNotification, ...notifications];
    setNotifications(updated);
    localStorage.setItem('amps_notifications', JSON.stringify(updated));
  };

  const markNotificationRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    localStorage.setItem('amps_notifications', JSON.stringify(updated));
  };

  const markAllNotificationsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('amps_notifications', JSON.stringify(updated));
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isDemo,
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
