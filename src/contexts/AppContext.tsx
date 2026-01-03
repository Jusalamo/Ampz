import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Event, Match, Ticket, ConnectionProfile } from '@/lib/types';
import { demoUser, demoEvents, demoMatches, demoTickets, demoConnectionProfiles } from '@/lib/demo-data';

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
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  loginDemo: () => void;
  logout: () => void;
  setCurrentEventId: (id: string | null) => void;
  toggleTheme: () => void;
  bookmarkEvent: (eventId: string) => void;
  addMatch: (profile: ConnectionProfile) => void;
  updateUser: (updates: Partial<User>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [events, setEvents] = useState<Event[]>(demoEvents);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [connectionProfiles] = useState<ConnectionProfile[]>(demoConnectionProfiles);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Load persisted data
    const storedUser = localStorage.getItem('amps_user');
    const storedTheme = localStorage.getItem('amps_theme') as 'dark' | 'light';
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      const storedMatches = localStorage.getItem('amps_matches');
      const storedTickets = localStorage.getItem('amps_tickets');
      if (storedMatches) setMatches(JSON.parse(storedMatches));
      if (storedTickets) setTickets(JSON.parse(storedTickets));
    }
    
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.classList.toggle('light', storedTheme === 'light');
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate login
    if (email && password) {
      const newUser: User = {
        ...demoUser,
        id: crypto.randomUUID(),
        email,
        profile: { ...demoUser.profile, name: email.split('@')[0] },
      };
      setUser(newUser);
      setIsDemo(false);
      localStorage.setItem('amps_user', JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    if (email && password && name) {
      const newUser: User = {
        ...demoUser,
        id: crypto.randomUUID(),
        email,
        profile: { ...demoUser.profile, name },
        subscription: { tier: 'free', expiresAt: null },
      };
      setUser(newUser);
      setIsDemo(false);
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
    localStorage.setItem('amps_user', JSON.stringify(demoUser));
    localStorage.setItem('amps_matches', JSON.stringify(demoMatches));
    localStorage.setItem('amps_tickets', JSON.stringify(demoTickets));
  };

  const logout = () => {
    setUser(null);
    setIsDemo(false);
    setMatches([]);
    setTickets([]);
    localStorage.removeItem('amps_user');
    localStorage.removeItem('amps_matches');
    localStorage.removeItem('amps_tickets');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('light', newTheme === 'light');
    localStorage.setItem('amps_theme', newTheme);
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
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('amps_user', JSON.stringify(updatedUser));
  };

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
        login,
        signup,
        loginDemo,
        logout,
        setCurrentEventId,
        toggleTheme,
        bookmarkEvent,
        addMatch,
        updateUser,
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
