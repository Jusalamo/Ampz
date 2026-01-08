// demo.ts - Complete Demo Mode System
import { User, Event, ConnectionProfile, Match, Ticket, AppNotification, CommunityPhoto, CommunityComment } from './types';

// ============================================================================
// DEMO STATE MANAGEMENT
// ============================================================================

const DEMO_KEY = 'amps_demo_mode';
const DEMO_TIMESTAMP_KEY = 'amps_demo_timestamp';
const DEMO_USER_KEY = 'amps_demo_user_data';
const DEMO_ACTIONS_KEY = 'amps_demo_user_actions';

// Demo expiration time (2 hours in milliseconds)
const DEMO_EXPIRY_MS = 2 * 60 * 60 * 1000;

export const getDemoMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(DEMO_KEY) === 'true';
};

export const setDemoMode = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;
  
  if (enabled) {
    sessionStorage.setItem(DEMO_KEY, 'true');
    sessionStorage.setItem(DEMO_TIMESTAMP_KEY, Date.now().toString());
    initializeDemoSession();
  } else {
    // Clear all demo data
    sessionStorage.removeItem(DEMO_KEY);
    sessionStorage.removeItem(DEMO_TIMESTAMP_KEY);
    sessionStorage.removeItem(DEMO_USER_KEY);
    sessionStorage.removeItem(DEMO_ACTIONS_KEY);
  }
};

export const isDemoExpired = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  const timestamp = sessionStorage.getItem(DEMO_TIMESTAMP_KEY);
  if (!timestamp) return true;
  
  const demoStart = parseInt(timestamp, 10);
  const now = Date.now();
  return (now - demoStart) > DEMO_EXPIRY_MS;
};

export const isDemoUser = getDemoMode() && !isDemoExpired();

// Initialize demo session with fresh data
const initializeDemoSession = (): void => {
  // Store the initial demo user
  const demoUserData = {
    id: `demo-user-${Date.now()}`,
    email: 'demo@amps.app',
    createdAt: new Date().toISOString(),
    profile: {
      name: 'Alex Demo',
      age: 28,
      bio: 'Music lover, adventure seeker, and tech enthusiast. Always looking for the next great event!',
      occupation: 'Software Developer',
      company: 'TechCorp Namibia',
      location: 'Windhoek, Namibia',
      gender: 'Non-binary',
      interests: ['Music', 'Tech', 'Travel', 'Photography', 'Art'],
      profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      phone: '+264 81 123 4567',
    },
    subscription: {
      tier: 'pro',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    settings: {
      theme: 'dark',
      currency: 'NAD',
      notifications: {
        matches: true,
        messages: true,
        events: true,
        profileViews: true,
      },
      privacy: {
        searchable: true,
        showDistance: true,
        showOnline: true,
        messageFrom: 'everyone',
      },
    },
    blockedUsers: [],
    bookmarkedEvents: ['event-1', 'event-3'],
    createdEvents: [],
    likesRemaining: Infinity,
    lastLikeReset: new Date().toISOString(),
    isDemo: true,
  };
  
  sessionStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUserData));
  sessionStorage.setItem(DEMO_ACTIONS_KEY, JSON.stringify({
    likes: [],
    messages: [],
    created: [],
    joined: [],
    uploadedPhotos: [],
    comments: [],
  }));
};

// ============================================================================
// DEMO DATA FUNCTIONS
// ============================================================================

// Base demo data (read-only)
const demoEventsData: Event[] = [
  {
    id: 'event-1',
    name: 'Windhoek Jazz Night',
    description: 'An evening of smooth jazz under the stars at the beautiful Gardens Amphitheatre. Featuring local and international artists.',
    category: 'Music',
    location: 'Gardens Amphitheatre',
    address: '123 Independence Ave, Windhoek',
    coordinates: { lat: -22.5609, lng: 17.0658 },
    date: '2026-01-15',
    time: '19:00',
    price: 150,
    currency: 'NAD',
    maxAttendees: 500,
    attendees: 342,
    organizerId: 'org-1',
    qrCode: 'JAZZ-2026',
    geofenceRadius: 200,
    customTheme: '#8B5CF6',
    coverImage: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800',
    tags: ['Jazz', 'Live Music', 'Outdoor'],
    isFeatured: true,
    isDemo: true,
  },
  {
    id: 'event-2',
    name: 'Tech Meetup Namibia',
    description: 'Connect with fellow tech enthusiasts, share ideas, and learn about the latest innovations in the Namibian tech scene.',
    category: 'Tech',
    location: 'Innovation Hub',
    address: '45 Tech Street, Windhoek',
    coordinates: { lat: -22.5700, lng: 17.0800 },
    date: '2026-01-20',
    time: '18:00',
    price: 0,
    currency: 'NAD',
    maxAttendees: 100,
    attendees: 67,
    organizerId: 'org-2',
    qrCode: 'TECH-JAN',
    geofenceRadius: 100,
    customTheme: '#3B82F6',
    coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    tags: ['Tech', 'Networking', 'Free'],
    isFeatured: true,
    isDemo: true,
  },
  {
    id: 'event-3',
    name: 'Sunset Beach Party',
    description: 'Dance the night away on the beautiful beaches of Swakopmund. DJ sets, fire dancers, and ocean vibes.',
    category: 'Party',
    location: 'Swakopmund Beach',
    address: 'Beach Road, Swakopmund',
    coordinates: { lat: -22.6792, lng: 14.5266 },
    date: '2026-01-25',
    time: '16:00',
    price: 200,
    currency: 'NAD',
    maxAttendees: 1000,
    attendees: 756,
    organizerId: 'org-3',
    qrCode: 'BEACH-2026',
    geofenceRadius: 300,
    customTheme: '#EC4899',
    coverImage: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
    tags: ['Party', 'Beach', 'DJ'],
    isFeatured: true,
    isDemo: true,
  },
  {
    id: 'event-4',
    name: 'Art Gallery Opening',
    description: 'Exclusive opening night of the new contemporary African art exhibition featuring works from emerging Namibian artists.',
    category: 'Art',
    location: 'National Art Gallery',
    address: '78 Robert Mugabe Ave, Windhoek',
    coordinates: { lat: -22.5580, lng: 17.0840 },
    date: '2026-02-01',
    time: '17:00',
    price: 75,
    currency: 'NAD',
    maxAttendees: 150,
    attendees: 89,
    organizerId: 'org-4',
    qrCode: 'ART-FEB',
    geofenceRadius: 100,
    customTheme: '#F59E0B',
    coverImage: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800',
    tags: ['Art', 'Gallery', 'Exhibition'],
    isFeatured: false,
    isDemo: true,
  },
  {
    id: 'event-5',
    name: 'Namibian Food Festival',
    description: 'Taste the best of Namibian cuisine! Local chefs showcase traditional and modern dishes from across the country.',
    category: 'Food',
    location: 'Zoo Park',
    address: 'Zoo Park, Central Windhoek',
    coordinates: { lat: -22.5690, lng: 17.0830 },
    date: '2026-02-10',
    time: '11:00',
    price: 50,
    currency: 'NAD',
    maxAttendees: 2000,
    attendees: 1234,
    organizerId: 'org-5',
    qrCode: 'FOOD-2026',
    geofenceRadius: 250,
    customTheme: '#10B981',
    coverImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    tags: ['Food', 'Festival', 'Local'],
    isFeatured: true,
    isDemo: true,
  },
  {
    id: 'event-6',
    name: 'Marathon Windhoek',
    description: 'Annual city marathon with 5K, 10K, 21K and full marathon options. Run through the scenic streets of Windhoek.',
    category: 'Sports',
    location: 'Independence Stadium',
    address: 'Independence Stadium, Windhoek',
    coordinates: { lat: -22.5550, lng: 17.0750 },
    date: '2026-02-15',
    time: '06:00',
    price: 100,
    currency: 'NAD',
    maxAttendees: 5000,
    attendees: 2100,
    organizerId: 'org-6',
    qrCode: 'MARATHON-2026',
    geofenceRadius: 500,
    customTheme: '#10B981',
    coverImage: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800',
    tags: ['Sports', 'Running', 'Fitness'],
    isFeatured: false,
    isDemo: true,
  },
];

const demoConnectionProfilesData: ConnectionProfile[] = [
  {
    id: 'conn-1',
    userId: 'user-1',
    eventId: 'event-1',
    name: 'Sarah Mbeki',
    age: 26,
    bio: 'Jazz enthusiast and aspiring photographer. Love meeting creative souls.',
    interests: ['Jazz', 'Photography', 'Art', 'Travel'],
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    location: 'Windhoek',
    occupation: 'Photographer',
    isPublic: true,
    isDemo: true,
  },
  {
    id: 'conn-2',
    userId: 'user-2',
    eventId: 'event-1',
    name: 'Michael Chen',
    age: 31,
    bio: 'Music producer by night, developer by day. Looking for good vibes.',
    interests: ['Music', 'Tech', 'Gaming', 'Coffee'],
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    location: 'Windhoek',
    occupation: 'Music Producer',
    isPublic: true,
    isDemo: true,
  },
  {
    id: 'conn-3',
    userId: 'user-3',
    eventId: 'event-1',
    name: 'Amara Nkosi',
    age: 24,
    bio: 'Event planner with a passion for connecting people. Life is better together!',
    interests: ['Events', 'Fashion', 'Dance', 'Fitness'],
    photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400',
    location: 'Swakopmund',
    occupation: 'Event Planner',
    isPublic: true,
    isDemo: true,
  },
  {
    id: 'conn-4',
    userId: 'user-4',
    eventId: 'event-2',
    name: 'David Shikongo',
    age: 29,
    bio: 'Startup founder, tech enthusiast. Building the future of African fintech.',
    interests: ['Tech', 'Startups', 'Finance', 'Running'],
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    location: 'Windhoek',
    occupation: 'CEO',
    isPublic: true,
    isDemo: true,
  },
  {
    id: 'conn-5',
    userId: 'user-5',
    eventId: 'event-3',
    name: 'Lena Fischer',
    age: 27,
    bio: 'Beach lover and sunset chaser. Looking for adventure partners!',
    interests: ['Beach', 'Surfing', 'Yoga', 'Travel'],
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
    location: 'Swakopmund',
    occupation: 'Travel Blogger',
    isPublic: true,
    isDemo: true,
  },
];

const demoMatchesData: Match[] = [
  {
    id: 'match-1',
    matchProfile: {
      id: 'conn-1',
      userId: 'user-1',
      eventId: 'event-1',
      name: 'Sarah Mbeki',
      age: 26,
      bio: 'Jazz enthusiast and aspiring photographer. Love meeting creative souls.',
      interests: ['Jazz', 'Photography', 'Art', 'Travel'],
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      location: 'Windhoek',
      occupation: 'Photographer',
      isPublic: true,
      isDemo: true,
    },
    eventId: 'event-1',
    eventName: 'Windhoek Jazz Night',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    lastMessage: 'Hey! Loved the jazz set last night 🎷',
    lastMessageTime: '2h ago',
    unread: true,
    online: true,
    isDemo: true,
  },
  {
    id: 'match-2',
    matchProfile: {
      id: 'conn-4',
      userId: 'user-4',
      eventId: 'event-2',
      name: 'David Shikongo',
      age: 29,
      bio: 'Startup founder, tech enthusiast. Building the future of African fintech.',
      interests: ['Tech', 'Startups', 'Finance', 'Running'],
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      location: 'Windhoek',
      occupation: 'CEO',
      isPublic: true,
      isDemo: true,
    },
    eventId: 'event-2',
    eventName: 'Tech Meetup Namibia',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    lastMessage: 'Great meeting you at the meetup!',
    lastMessageTime: '1d ago',
    unread: false,
    online: false,
    isDemo: true,
  },
];

const demoTicketsData: Ticket[] = [
  {
    id: 'ticket-1',
    eventId: 'event-1',
    eventName: 'Windhoek Jazz Night',
    eventDate: '2026-01-15',
    eventTime: '19:00',
    eventLocation: 'Gardens Amphitheatre',
    purchaseDate: new Date().toISOString(),
    price: 150,
    currency: 'NAD',
    quantity: 2,
    qrCode: 'JAZZ-TKT-001',
    status: 'active',
    isDemo: true,
  },
];

const demoNotificationsData: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'match',
    title: "It's a Match!",
    message: 'You and Sarah Mbeki liked each other',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
    data: { matchId: 'match-1' },
    isDemo: true,
  },
  {
    id: 'notif-2',
    type: 'message',
    title: 'New Message',
    message: 'Sarah sent you a message',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
    data: { matchId: 'match-1' },
    isDemo: true,
  },
  {
    id: 'notif-3',
    type: 'event',
    title: 'Event Reminder',
    message: 'Windhoek Jazz Night starts tomorrow at 7pm',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    data: { eventId: 'event-1' },
    isDemo: true,
  },
];

const demoCommunityPhotosData: CommunityPhoto[] = [
  {
    id: 'photo-1',
    eventId: 'event-1',
    userId: 'user-1',
    userName: 'Sarah Mbeki',
    userPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    likes: 24,
    likedBy: [],
    isDemo: true,
  },
  {
    id: 'photo-2',
    eventId: 'event-1',
    userId: 'user-2',
    userName: 'Michael Chen',
    userPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    likes: 18,
    likedBy: [],
    isDemo: true,
  },
];

const demoCommunityCommentsData: CommunityComment[] = [
  {
    id: 'comment-1',
    eventId: 'event-1',
    userId: 'user-1',
    userName: 'Sarah Mbeki',
    userPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    text: 'This event is amazing! 🎉 The jazz is on point!',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    likes: 12,
    likedBy: [],
    isDemo: true,
  },
  {
    id: 'comment-2',
    eventId: 'event-1',
    userId: 'user-2',
    userName: 'Michael Chen',
    userPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    text: 'Anyone near the main stage? Looking for fellow music lovers!',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    likes: 5,
    likedBy: [],
    isDemo: true,
  },
  {
    id: 'reply-1',
    eventId: 'event-1',
    userId: 'user-3',
    userName: 'Amara Nkosi',
    userPhoto: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400',
    text: 'Yes! Come over, we have a great spot! 🎵',
    timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    likes: 2,
    likedBy: [],
    replyTo: 'comment-2',
    isDemo: true,
  },
];

// ============================================================================
// PUBLIC API FUNCTIONS
// ============================================================================

export const getDemoUser = (): User | null => {
  if (!isDemoUser) return null;
  
  try {
    const stored = sessionStorage.getItem(DEMO_USER_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error parsing demo user:', error);
  }
  
  // Fallback to default
  return {
    id: `demo-user-${Date.now()}`,
    email: 'demo@amps.app',
    createdAt: new Date().toISOString(),
    profile: {
      name: 'Alex Demo',
      age: 28,
      bio: 'Music lover, adventure seeker, and tech enthusiast. Always looking for the next great event!',
      occupation: 'Software Developer',
      company: 'TechCorp Namibia',
      location: 'Windhoek, Namibia',
      gender: 'Non-binary',
      interests: ['Music', 'Tech', 'Travel', 'Photography', 'Art'],
      profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      phone: '+264 81 123 4567',
    },
    subscription: {
      tier: 'pro',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    settings: {
      theme: 'dark',
      currency: 'NAD',
      notifications: {
        matches: true,
        messages: true,
        events: true,
        profileViews: true,
      },
      privacy: {
        searchable: true,
        showDistance: true,
        showOnline: true,
        messageFrom: 'everyone',
      },
    },
    blockedUsers: [],
    bookmarkedEvents: ['event-1', 'event-3'],
    createdEvents: [],
    likesRemaining: Infinity,
    lastLikeReset: new Date().toISOString(),
    isDemo: true,
  };
};

export const getDemoEvents = (): Event[] => {
  if (!isDemoUser) return [];
  return [...demoEventsData];
};

export const getDemoConnectionProfiles = (): ConnectionProfile[] => {
  if (!isDemoUser) return [];
  return [...demoConnectionProfilesData];
};

export const getDemoMatches = (): Match[] => {
  if (!isDemoUser) return [];
  return [...demoMatchesData];
};

export const getDemoTickets = (): Ticket[] => {
  if (!isDemoUser) return [];
  return [...demoTicketsData];
};

export const getDemoNotifications = (): AppNotification[] => {
  if (!isDemoUser) return [];
  return [...demoNotificationsData];
};

export const getDemoCommunityPhotos = (): CommunityPhoto[] => {
  if (!isDemoUser) return [];
  return [...demoCommunityPhotosData];
};

export const getDemoCommunityComments = (): CommunityComment[] => {
  if (!isDemoUser) return [];
  return [...demoCommunityCommentsData];
};

// ============================================================================
// DEMO ACTIONS TRACKING (User interactions in demo mode)
// ============================================================================

export interface DemoUserActions {
  likes: string[]; // IDs of liked profiles/photos/comments
  messages: Array<{
    matchId: string;
    message: string;
    timestamp: string;
  }>;
  created: Array<{
    type: 'event' | 'comment' | 'photo';
    id: string;
    data: any;
  }>;
  joined: string[]; // Event IDs
  uploadedPhotos: Array<{
    eventId: string;
    imageUrl: string;
    timestamp: string;
  }>;
  comments: Array<{
    eventId: string;
    text: string;
    timestamp: string;
  }>;
}

export const getDemoUserActions = (): DemoUserActions => {
  try {
    const stored = sessionStorage.getItem(DEMO_ACTIONS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error parsing demo actions:', error);
  }
  
  return {
    likes: [],
    messages: [],
    created: [],
    joined: [],
    uploadedPhotos: [],
    comments: [],
  };
};

export const updateDemoUserActions = (updates: Partial<DemoUserActions>): void => {
  if (!isDemoUser) return;
  
  const currentActions = getDemoUserActions();
  const updatedActions = {
    ...currentActions,
    ...updates,
  };
  
  sessionStorage.setItem(DEMO_ACTIONS_KEY, JSON.stringify(updatedActions));
};

// Helper functions for common actions
export const demoLikeProfile = (profileId: string): void => {
  const actions = getDemoUserActions();
  if (!actions.likes.includes(profileId)) {
    actions.likes.push(profileId);
    updateDemoUserActions({ likes: actions.likes });
  }
};

export const demoJoinEvent = (eventId: string): void => {
  const actions = getDemoUserActions();
  if (!actions.joined.includes(eventId)) {
    actions.joined.push(eventId);
    updateDemoUserActions({ joined: actions.joined });
  }
};

export const demoAddMessage = (matchId: string, message: string): void => {
  const actions = getDemoUserActions();
  actions.messages.push({
    matchId,
    message,
    timestamp: new Date().toISOString(),
  });
  updateDemoUserActions({ messages: actions.messages });
};

// ============================================================================
// DEMO COMPONENTS & HOOKS
// ============================================================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DemoContextType {
  isDemo: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  demoUser: User | null;
  demoActions: DemoUserActions;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within DemoProvider');
  }
  return context;
};

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDemo, setIsDemo] = useState(false);
  const [demoUser, setDemoUser] = useState<User | null>(null);
  const [demoActions, setDemoActions] = useState<DemoUserActions>(getDemoUserActions());

  useEffect(() => {
    const demoMode = getDemoMode();
    if (demoMode && isDemoExpired()) {
      exitDemoMode();
    } else {
      setIsDemo(demoMode);
      if (demoMode) {
        setDemoUser(getDemoUser());
        setDemoActions(getDemoUserActions());
      }
    }
  }, []);

  const enterDemoMode = () => {
    setDemoMode(true);
    setIsDemo(true);
    setDemoUser(getDemoUser());
    setDemoActions(getDemoUserActions());
    
    // Refresh to apply demo mode to all components
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const exitDemoMode = () => {
    setDemoMode(false);
    setIsDemo(false);
    setDemoUser(null);
    setDemoActions(getDemoUserActions());
    
    // Clear demo data
    const demoKeys = Object.keys(sessionStorage).filter(key => 
      key.includes('demo') || key.includes('DEMO')
    );
    demoKeys.forEach(key => sessionStorage.removeItem(key));
    
    // Redirect to home
    window.location.href = '/';
  };

  return (
    <DemoContext.Provider value={{ 
      isDemo, 
      enterDemoMode, 
      exitDemoMode, 
      demoUser, 
      demoActions 
    }}>
      {children}
    </DemoContext.Provider>
  );
};

// Demo Button Component
export const TryDemoButton: React.FC<{ className?: string }> = ({ className }) => {
  const { enterDemoMode } = useDemo();
  
  return (
    <button
      onClick={enterDemoMode}
      className={`px-4 py-2 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors ${className || ''}`}
    >
      Try Demo
    </button>
  );
};

// Demo Banner Component
export const DemoBanner: React.FC = () => {
  const { isDemo, exitDemoMode } = useDemo();
  
  if (!isDemo) return null;
  
  const demoStart = sessionStorage.getItem(DEMO_TIMESTAMP_KEY);
  const timeLeft = demoStart ? 
    Math.max(0, DEMO_EXPIRY_MS - (Date.now() - parseInt(demoStart, 10))) : 0;
  const minutesLeft = Math.floor(timeLeft / (1000 * 60));
  
  return (
    <div className="bg-purple-100 border-b border-purple-300 text-purple-800 p-2 text-center">
      <div className="container mx-auto flex items-center justify-between">
        <span className="font-medium">DEMO MODE ACTIVE</span>
        <div className="flex items-center gap-4">
          <span className="text-sm">
            {minutesLeft > 0 ? `${minutesLeft} minutes remaining` : 'Expiring soon'}
          </span>
          <button
            onClick={exitDemoMode}
            className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
          >
            Exit Demo
          </button>
        </div>
      </div>
    </div>
  );
};

// Demo Guard Hook
export const useDemoGuard = (redirectTo: string = '/') => {
  const { isDemo } = useDemo();
  
  useEffect(() => {
    if (!isDemo) {
      window.location.href = redirectTo;
    }
  }, [isDemo, redirectTo]);
  
  return isDemo;
};

// Check if data is demo data
export const isDemoData = (data: any): boolean => {
  return data?.isDemo === true;
};

// Reset demo to initial state
export const resetDemo = (): void => {
  if (isDemoUser) {
    initializeDemoSession();
    sessionStorage.setItem(DEMO_TIMESTAMP_KEY, Date.now().toString());
    window.location.reload();
  }
};

export default {
  // State management
  getDemoMode,
  setDemoMode,
  isDemoExpired,
  isDemoUser,
  
  // Data getters
  getDemoUser,
  getDemoEvents,
  getDemoConnectionProfiles,
  getDemoMatches,
  getDemoTickets,
  getDemoNotifications,
  getDemoCommunityPhotos,
  getDemoCommunityComments,
  
  // Actions
  getDemoUserActions,
  updateDemoUserActions,
  demoLikeProfile,
  demoJoinEvent,
  demoAddMessage,
  
  // Components & Context
  DemoProvider,
  useDemo,
  TryDemoButton,
  DemoBanner,
  useDemoGuard,
  
  // Utilities
  isDemoData,
  resetDemo,
};
