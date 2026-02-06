export interface User {
  id: string;
  email: string;
  createdAt: string;
  profile: UserProfile;
  subscription: Subscription;
  settings: UserSettings;
  blockedUsers: string[];
  bookmarkedEvents: string[];
  createdEvents: string[];
  likesRemaining: number;
  lastLikeReset: string;
  isDemo?: boolean;
}

export interface UserProfile {
  name: string;
  age: number;
  bio: string;
  occupation: string;
  company: string;
  location: string;
  gender: string;
  interests: string[];
  profilePhoto: string;
  phone: string;
}

export interface Subscription {
  tier: 'free' | 'pro' | 'max';
  expiresAt: string | null;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  currency: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  matches: boolean;
  messages: boolean;
  events: boolean;
  profileViews: boolean;
}

export interface PrivacySettings {
  searchable: boolean;
  showDistance: boolean;
  showOnline: boolean;
  messageFrom: 'everyone' | 'matches' | 'none';
}

export interface Event {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  date: string;
  time: string;
  endTime?: string;
  endedAt?: string;
  price: number;
  currency: string;
  maxAttendees: number;
  attendees: number;
  organizerId: string;
  qrCode: string;
  qrCodeUrl?: string; // Generated QR code image data URL
  geofenceRadius: number;
  customTheme: string;
  coverImage: string;
  images?: string[];
  videos?: string[];
  tags: string[];
  isFeatured: boolean;
  isDemo?: boolean;
  isActive?: boolean;
  hasVideo?: boolean;
  mediaType?: 'carousel' | 'video';
  selectedVideoIndex?: number;
  notificationsEnabled?: boolean;
  updatedAt?: string;
  ticketLink?: string;
  accessCode?: string;
  webTicketsLink?: string;
  createdAt?: string;
  duration?: number; // Event duration in hours
}

export interface ConnectionProfile {
  id: string;
  userId: string;
  eventId: string;
  eventName?: string;
  name: string;
  age: number;
  bio: string;
  interests: string[];
  photo: string;
  location: string;
  isPublic: boolean;
  occupation?: string;
  gender?: string;
  isDemo?: boolean;
}

export interface Match {
  id: string;
  matchProfile: ConnectionProfile;
  eventId: string;
  eventName: string;
  timestamp: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
  online: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  isDemo?: boolean;
}

export interface Friend {
  id: string;
  friendProfile: ConnectionProfile;
  friendsSince: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
  online: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  sharedEvents?: string[];
}

export interface FriendRequest {
  id: string;
  fromUser: ConnectionProfile;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: string;
  mutualFriends?: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string;
  read: boolean;
  type: 'text' | 'event' | 'location' | 'image';
}

export interface Ticket {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  purchaseDate: string;
  price: number;
  currency: string;
  quantity: number;
  qrCode: string;
  status: 'active' | 'used' | 'cancelled';
  isDemo?: boolean;
}

export interface CommunityPhoto {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userPhoto: string;
  imageUrl: string;
  timestamp: string;
  likes: number;
  likedBy: string[];
  isLiked?: boolean;
  isDemo?: boolean;
}

export interface CommunityComment {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userPhoto: string;
  text: string;
  timestamp: string;
  likes: number;
  likedBy: string[];
  isLiked?: boolean;
  replyTo?: string;
  isDemo?: boolean;
}

export interface AppNotification {
  id: string;
  type: 'match' | 'message' | 'event' | 'like' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  isDemo?: boolean;
  data?: {
    matchId?: string;
    eventId?: string;
    userId?: string;
  };
}
