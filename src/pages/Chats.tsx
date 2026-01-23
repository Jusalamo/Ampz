import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  Search, 
  MoreVertical, 
  Send, 
  Image as ImageIcon, 
  Smile, 
  ArrowLeft,
  Paperclip,
  X,
  Check,
  CheckCheck,
  UserPlus,
  Users,
  Heart,
  Star,
  Filter,
  Pin,
  Bell,
  BellOff,
  Trash2,
  Ban,
  Flag,
  ChevronRight,
  Camera,
  Sparkles,
  Copy,
  Reply,
  MessageSquare,
  UserCheck,
  Clock
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { Match, Message, Friend, FriendRequest, ConnectionProfile } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'matches' | 'friends';

// Design Constants
const DESIGN = {
  colors: {
    primary: '#C4B5FD',
    lavenderLight: '#E9D5FF',
    accentPink: '#FFB8E6',
    background: '#1A1A1A',
    card: '#2D2D2D',
    textPrimary: '#FFFFFF',
    textSecondary: '#B8B8B8'
  },
  borderRadius: {
    card: '24px',
    cardInner: '20px',
    button: '12px',
    roundButton: '50%',
    modalTop: '20px',
    smallPill: '8px',
    message: '20px',
    input: '9999px'
  },
  shadows: {
    card: '0 8px 32px rgba(0, 0, 0, 0.4)',
    button: '0 4px 16px rgba(0, 0, 0, 0.3)',
    likeButton: '0 4px 16px rgba(255, 184, 230, 0.4)'
  },
  typography: {
    h1: '28px',
    h2: '24px',
    h3: '22px',
    bodyLarge: '15px',
    body: '14px',
    small: '13px',
    caption: '13px',
    button: '16px'
  }
};

// Quick Add Modal Component
function QuickAddModal({ 
  isOpen, 
  onClose,
  onSendRequest
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSendRequest: (userId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ConnectionProfile[]>([]);
  const { connectionProfiles = [] } = useApp();
  
  // Stub implementations - friend features not yet implemented
  const friends: ConnectionProfile[] = [];
  const sentRequests: { toUserId: string }[] = [];
  const searchUsers = async (query: string): Promise<ConnectionProfile[]> => {
    // Filter connectionProfiles by name
    return connectionProfiles.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase())
    );
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Call the searchUsers function from context which should query the database
      const results = await searchUsers(query);
      // Filter out already friends and people with pending requests
      const filteredResults = results.filter(profile => 
        !friends.some(friend => friend.id === profile.id) &&
        !sentRequests.some(request => request.toUserId === profile.id)
      );
      setSearchResults(filteredResults.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Get suggestions - you might want to replace this with actual suggestions from your backend
  const suggestions = searchResults.slice(0, 4);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" style={{
        background: DESIGN.colors.background,
        borderColor: DESIGN.colors.card,
        borderRadius: DESIGN.borderRadius.card
      }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{
            fontSize: DESIGN.typography.h2,
            color: DESIGN.colors.textPrimary
          }}>
            <UserPlus className="w-5 h-5" style={{ color: DESIGN.colors.primary }} />
            Quick Add Friends
          </DialogTitle>
        </DialogHeader>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
            style={{ color: DESIGN.colors.textSecondary }} />
          <Input
            type="text"
            placeholder="Search by name or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            style={{
              background: DESIGN.colors.card,
              borderColor: DESIGN.colors.card,
              borderRadius: DESIGN.borderRadius.input,
              color: DESIGN.colors.textPrimary
            }}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-transparent border-t-current rounded-full animate-spin"
                style={{ color: DESIGN.colors.primary }} />
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="space-y-2">
            <p className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
              Search Results
            </p>
            {searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map(user => (
                  <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{
                      background: DESIGN.colors.card,
                      border: `1px solid ${DESIGN.colors.card}`,
                      borderRadius: DESIGN.borderRadius.card
                    }}>
                    <img src={user.photo} alt={user.name} 
                      className="w-10 h-10 rounded-full object-cover" 
                      style={{ border: `2px solid ${DESIGN.colors.background}` }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm" style={{ color: DESIGN.colors.textPrimary }}>
                        {user.name}
                      </p>
                      <p className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                        {user.location || 'User'}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => onSendRequest(user.id)}
                      className="h-8 rounded-[8px]"
                      style={{
                        background: DESIGN.colors.primary,
                        color: DESIGN.colors.background,
                        borderRadius: DESIGN.borderRadius.smallPill
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            ) : !isSearching ? (
              <p className="text-sm text-center py-4" style={{ color: DESIGN.colors.textSecondary }}>
                No users found
              </p>
            ) : null}
          </div>
        )}

        {/* Suggestions - Show when no search query */}
        {!searchQuery && (
          <div className="space-y-2">
            <p className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
              Start typing to search for users
            </p>
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{
                  background: `${DESIGN.colors.primary}10`,
                  borderRadius: DESIGN.borderRadius.roundButton
                }}>
                <Search className="w-8 h-8" style={{ color: DESIGN.colors.primary }} />
              </div>
              <p className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>
                Type a name or username to find people
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isSearching && searchQuery && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-transparent border-t-current rounded-full animate-spin mx-auto mb-4"
              style={{ color: DESIGN.colors.primary }} />
            <p className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>
              Searching users...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Friend Requests Modal Component
function FriendRequestsModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const { toast } = useToast();
  const { connectionProfiles = [] } = useApp();
  
  // Stub implementations - friend request features not yet implemented
  const friendRequests: FriendRequest[] = [];
  const sentRequests: FriendRequest[] = [];
  const acceptFriendRequest = async (requestId: string): Promise<void> => {
    console.log('Accept friend request:', requestId);
  };
  const declineFriendRequest = async (requestId: string): Promise<void> => {
    console.log('Decline friend request:', requestId);
  };
  const cancelFriendRequest = async (requestId: string): Promise<void> => {
    console.log('Cancel friend request:', requestId);
  };

  // Safe default functions
  const safeAcceptFriendRequest = acceptFriendRequest;
  const safeDeclineFriendRequest = declineFriendRequest;
  const safeCancelFriendRequest = cancelFriendRequest;

  // Enrich requests with user data
  const enrichedReceivedRequests = friendRequests.map(request => {
    const user = connectionProfiles.find(p => p.id === request.fromUser?.id);
    return {
      ...request,
      name: user?.name || request.fromUser?.name || 'Unknown User',
      photo: user?.photo || request.fromUser?.photo || 'https://i.pravatar.cc/100?img=0',
      mutualFriends: request.mutualFriends || Math.floor(Math.random() * 5)
    };
  });

  const enrichedSentRequests = sentRequests.map(request => {
    const user = connectionProfiles.find(p => p.id === request.toUserId);
    return {
      ...request,
      name: user?.name || 'Unknown User',
      photo: user?.photo || 'https://i.pravatar.cc/100?img=0',
      mutualFriends: Math.floor(Math.random() * 5)
    };
  });

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await safeAcceptFriendRequest(requestId);
      toast({
        title: 'Friend request accepted!',
        description: 'You can now message each other.',
      });
    } catch (error) {
      toast({
        title: 'Error accepting request',
        description: 'Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await safeDeclineFriendRequest(requestId);
      toast({
        title: 'Request declined',
        description: 'The request has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Error declining request',
        description: 'Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await safeCancelFriendRequest(requestId);
      toast({
        title: 'Request cancelled',
        description: 'Your friend request has been cancelled.',
      });
    } catch (error) {
      toast({
        title: 'Error cancelling request',
        description: 'Please try again.',
        variant: 'destructive'
      });
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[80vh]" style={{
        background: DESIGN.colors.background,
        borderColor: DESIGN.colors.card,
        borderRadius: DESIGN.borderRadius.card
      }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{
            fontSize: DESIGN.typography.h2,
            color: DESIGN.colors.textPrimary
          }}>
            <UserCheck className="w-5 h-5" style={{ color: DESIGN.colors.primary }} />
            Friend Requests
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 justify-center mb-4">
          <button
            onClick={() => setActiveTab('received')}
            className={cn(
              'px-4 py-1.5 text-sm font-medium transition-all',
              activeTab === 'received' ? '' : ''
            )}
            style={{
              borderRadius: DESIGN.borderRadius.input,
              ...(activeTab === 'received' 
                ? { 
                    background: DESIGN.colors.primary, 
                    color: DESIGN.colors.background 
                  }
                : { 
                    background: DESIGN.colors.card, 
                    border: `1px solid ${DESIGN.colors.card}`,
                    color: DESIGN.colors.textSecondary 
                  })
            }}
          >
            Received {enrichedReceivedRequests.length > 0 && `(${enrichedReceivedRequests.length})`}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={cn(
              'px-4 py-1.5 text-sm font-medium transition-all',
              activeTab === 'sent' ? '' : ''
            )}
            style={{
              borderRadius: DESIGN.borderRadius.input,
              ...(activeTab === 'sent' 
                ? { 
                    background: DESIGN.colors.primary, 
                    color: DESIGN.colors.background 
                  }
                : { 
                    background: DESIGN.colors.card, 
                    border: `1px solid ${DESIGN.colors.card}`,
                    color: DESIGN.colors.textSecondary 
                  })
            }}
          >
            Sent {enrichedSentRequests.length > 0 && `(${enrichedSentRequests.length})`}
          </button>
        </div>

        {/* Requests List */}
        <div className="flex-1 overflow-y-auto pb-4" style={{ 
          marginBottom: '-16px',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)'
        }}>
          {activeTab === 'received' ? (
            enrichedReceivedRequests.length > 0 ? (
              <div className="space-y-3">
                {enrichedReceivedRequests.map(request => (
                  <div key={request.id} className="flex items-center gap-3 p-4"
                    style={{
                      background: DESIGN.colors.card,
                      border: `1px solid ${DESIGN.colors.card}`,
                      borderRadius: DESIGN.borderRadius.card
                    }}>
                    <img src={request.photo} alt={request.name} 
                      className="w-12 h-12 rounded-full object-cover" 
                      style={{ border: `2px solid ${DESIGN.colors.background}` }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm" style={{ color: DESIGN.colors.textPrimary }}>
                        {request.name}
                      </p>
                      <p className="text-xs flex items-center gap-1" style={{ color: DESIGN.colors.textSecondary }}>
                        <Users className="w-3 h-3" />
                        {request.mutualFriends} mutual friends
                      </p>
                      <p className="text-xs mt-1" style={{ color: DESIGN.colors.textSecondary }}>
                        {formatTime(request.timestamp || new Date().toISOString())}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-9 w-9 p-0 rounded-full"
                        onClick={() => handleDeclineRequest(request.id)}
                        style={{
                          borderColor: DESIGN.colors.card,
                          borderRadius: DESIGN.borderRadius.roundButton
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-9 w-9 p-0 rounded-full"
                        onClick={() => handleAcceptRequest(request.id)}
                        style={{
                          background: DESIGN.colors.primary,
                          color: DESIGN.colors.background,
                          borderRadius: DESIGN.borderRadius.roundButton
                        }}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: `${DESIGN.colors.primary}10`,
                    borderRadius: DESIGN.borderRadius.roundButton
                  }}>
                  <UserCheck className="w-10 h-10" style={{ color: DESIGN.colors.primary }} />
                </div>
                <p className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>
                  No friend requests at the moment
                </p>
              </div>
            )
          ) : (
            enrichedSentRequests.length > 0 ? (
              <div className="space-y-3">
                {enrichedSentRequests.map(request => (
                  <div key={request.id} className="flex items-center gap-3 p-4"
                    style={{
                      background: DESIGN.colors.card,
                      border: `1px solid ${DESIGN.colors.card}`,
                      borderRadius: DESIGN.borderRadius.card
                    }}>
                    <img src={request.photo} alt={request.name} 
                      className="w-12 h-12 rounded-full object-cover" 
                      style={{ border: `2px solid ${DESIGN.colors.background}` }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm" style={{ color: DESIGN.colors.textPrimary }}>
                        {request.name}
                      </p>
                      <p className="text-xs flex items-center gap-1" style={{ color: DESIGN.colors.textSecondary }}>
                        <Users className="w-3 h-3" />
                        {request.mutualFriends} mutual friends
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" style={{ color: DESIGN.colors.textSecondary }} />
                        <p className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                          {formatTime(request.timestamp || new Date().toISOString())}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs px-2 py-1 rounded-full"
                        style={{
                          color: DESIGN.colors.primary,
                          background: `${DESIGN.colors.primary}10`,
                          borderRadius: DESIGN.borderRadius.smallPill
                        }}>
                        Pending
                      </span>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleCancelRequest(request.id)}
                        className="h-8 text-xs"
                        style={{
                          color: DESIGN.colors.textSecondary
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: `${DESIGN.colors.primary}10`,
                    borderRadius: DESIGN.borderRadius.roundButton
                  }}>
                  <Send className="w-10 h-10" style={{ color: DESIGN.colors.primary }} />
                </div>
                <p className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>
                  No sent friend requests
                </p>
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Chats() {
  const navigate = useNavigate();
  const { 
    matches = [], 
    user, 
    isDemo, 
    connectionProfiles = [] 
  } = useApp();
  
  // Stub implementations - friend features not yet implemented
  const friends: ConnectionProfile[] = [];
  const friendRequests: FriendRequest[] = [];
  const sentRequests: FriendRequest[] = [];
  const sendFriendRequest = async (userId: string): Promise<void> => {
    console.log('Send friend request to:', userId);
  };
  
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('matches');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      chatId: 'match-1',
      senderId: 'other',
      text: 'Hey! Loved the jazz set last night 🎷',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: true,
      type: 'text',
    },
    {
      id: '2',
      chatId: 'match-1',
      senderId: 'me',
      text: "Thanks! You were amazing too! Let's jam again soon?",
      timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      read: true,
      type: 'text',
    },
    {
      id: '3',
      chatId: 'match-1',
      senderId: 'other',
      text: 'Definitely! What about this Friday?',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      read: true,
      type: 'text',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter matches based on search
  const filteredMatches = matches.filter(match =>
    match?.matchProfile?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match?.eventName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadMatchesCount = matches.filter(m => m?.unread).length;
  const friendRequestsCount = friendRequests.length;
  const hasFriends = friends && friends.length > 0;
  const hasFriendRequests = friendRequests.length > 0;

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate typing indicator
  useEffect(() => {
    if (selectedMatch && Math.random() > 0.7) {
      const typingTimeout = setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }, 3000);
      return () => clearTimeout(typingTimeout);
    }
  }, [selectedMatch, messages]);

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedMatch) return;

    const message: Message = {
      id: crypto.randomUUID(),
      chatId: selectedMatch.id,
      senderId: 'me',
      text: newMessage,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'text',
    };

    setMessages([...messages, message]);
    setNewMessage('');

    // Simulate reply
    setTimeout(() => {
      const replies = [
        'That sounds great! 😊',
        'Would love to catch up more!',
        'What are you doing this weekend?',
        'Same! It was such a vibe',
        "Can't wait! 🎶",
      ];
      const reply: Message = {
        id: crypto.randomUUID(),
        chatId: selectedMatch.id,
        senderId: 'other',
        text: replies[Math.floor(Math.random() * replies.length)],
        timestamp: new Date().toISOString(),
        read: false,
        type: 'text',
      };
      setMessages((prev) => [...prev, reply]);
    }, 2000);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSendMessage(e);
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    try {
      if (sendFriendRequest) {
        await sendFriendRequest(userId);
        toast({
          title: 'Friend request sent!',
          description: 'They will be notified of your request.',
        });
      } else {
        toast({
          title: 'Feature not available',
          description: 'Friend requests are not implemented yet.',
        });
      }
      setShowQuickAdd(false);
    } catch (error) {
      toast({
        title: 'Error sending request',
        description: 'Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Conversation View
  if (selectedMatch) {
    return (
      <div className="app-container min-h-screen flex flex-col" style={{
        background: DESIGN.colors.background
      }}>
        {/* Chat Header */}
        <header className="sticky top-0 z-30 border-b" style={{
          background: DESIGN.colors.background,
          borderColor: DESIGN.colors.card
        }}>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedMatch(null)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                style={{
                  background: DESIGN.colors.card,
                  borderRadius: DESIGN.borderRadius.roundButton
                }}
              >
                <ArrowLeft className="w-5 h-5" style={{ color: DESIGN.colors.textPrimary }} />
              </button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={selectedMatch.matchProfile?.photo}
                    alt={selectedMatch.matchProfile?.name}
                    className="w-10 h-10 rounded-full object-cover"
                    style={{ border: `2px solid ${DESIGN.colors.background}` }}
                  />
                  {selectedMatch.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full" 
                      style={{ border: `2px solid ${DESIGN.colors.background}` }} />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold" style={{
                    fontSize: DESIGN.typography.bodyLarge,
                    color: DESIGN.colors.textPrimary
                  }}>
                    {selectedMatch.matchProfile?.name || 'Unknown'}
                  </h3>
                  <p className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                    {selectedMatch.online ? 'Online' : `Active ${formatTime(selectedMatch.timestamp)}`}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                style={{
                  background: DESIGN.colors.card,
                  borderRadius: DESIGN.borderRadius.roundButton
                }}
              >
                <MoreVertical className="w-5 h-5" style={{ color: DESIGN.colors.textPrimary }} />
              </button>
              
              {showMoreOptions && (
                <div className="absolute right-0 top-full mt-2 w-48 py-2 z-50"
                  style={{
                    background: DESIGN.colors.card,
                    border: `1px solid ${DESIGN.colors.card}`,
                    borderRadius: DESIGN.borderRadius.card,
                    boxShadow: DESIGN.shadows.card
                  }}>
                  <button className="w-full px-4 py-3 text-left hover:opacity-80 transition-opacity text-sm flex items-center gap-3"
                    style={{ color: DESIGN.colors.textPrimary }}>
                    <Users className="w-4 h-4" />
                    View Profile
                  </button>
                  <button className="w-full px-4 py-3 text-left hover:opacity-80 transition-opacity text-sm flex items-center gap-3"
                    style={{ color: DESIGN.colors.textPrimary }}>
                    <Pin className="w-4 h-4" />
                    Pin Conversation
                  </button>
                  <button className="w-full px-4 py-3 text-left hover:opacity-80 transition-opacity text-sm flex items-center gap-3"
                    style={{ color: DESIGN.colors.textPrimary }}>
                    <BellOff className="w-4 h-4" />
                    Mute Notifications
                  </button>
                  <div className="my-1" style={{ borderTop: `1px solid ${DESIGN.colors.textSecondary}20` }} />
                  <button className="w-full px-4 py-3 text-left hover:opacity-80 transition-opacity text-sm flex items-center gap-3 text-red-500">
                    <Trash2 className="w-4 h-4" />
                    Unmatch
                  </button>
                  <button className="w-full px-4 py-3 text-left hover:opacity-80 transition-opacity text-sm flex items-center gap-3 text-red-500">
                    <Flag className="w-4 h-4" />
                    Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Match Info Card */}
          <div className="text-center py-4">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <img
                src={selectedMatch.matchProfile?.photo}
                alt={selectedMatch.matchProfile?.name}
                className="w-full h-full rounded-full object-cover"
                style={{ border: `4px solid ${DESIGN.colors.primary}20` }}
              />
            </div>
            <h3 className="font-bold" style={{
              fontSize: DESIGN.typography.h3,
              color: DESIGN.colors.textPrimary
            }}>
              {selectedMatch.matchProfile?.name || 'Unknown'}
            </h3>
            <p className="text-sm mb-2" style={{ color: DESIGN.colors.textSecondary }}>
              Matched at {selectedMatch.eventName}
            </p>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: `${DESIGN.colors.primary}10`,
                color: DESIGN.colors.primary,
                borderRadius: DESIGN.borderRadius.smallPill
              }}>
              <Heart className="w-3 h-3" />
              {formatTime(selectedMatch.timestamp)}
            </span>
          </div>

          {/* Messages List */}
          {messages.map((message, index) => {
            const isMe = message.senderId === 'me';
            const showTime = index === 0 || 
              new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 900000;
            
            return (
              <div key={message.id}>
                {showTime && (
                  <p className="text-center text-xs my-4" style={{ color: DESIGN.colors.textSecondary }}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('flex', isMe ? 'justify-end' : 'justify-start')}
                >
                  <div className={cn(
                    'max-w-[75%] px-4 py-2.5',
                    isMe 
                      ? 'rounded-br-md' 
                      : 'rounded-bl-md'
                  )}
                  style={{
                    borderRadius: DESIGN.borderRadius.message,
                    ...(isMe 
                      ? { 
                          background: DESIGN.colors.primary, 
                          color: DESIGN.colors.background 
                        }
                      : { 
                          background: DESIGN.colors.card, 
                          border: `1px solid ${DESIGN.colors.card}`,
                          color: DESIGN.colors.textPrimary 
                        })
                  }}>
                    <p className="text-sm">{message.text}</p>
                    <div className={cn(
                      'flex items-center gap-1 mt-1',
                      isMe ? 'justify-end' : 'justify-start'
                    )}>
                      <span className="text-[10px]" style={{ opacity: 0.7 }}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && (
                        <CheckCheck className={cn(
                          'w-3 h-3',
                          message.read ? 'text-primary-foreground' : 'opacity-50'
                        )} />
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="px-4 py-3" style={{
                background: DESIGN.colors.card,
                border: `1px solid ${DESIGN.colors.card}`,
                borderRadius: DESIGN.borderRadius.message,
                borderBottomLeftRadius: '4px'
              }}>
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full animate-bounce" 
                    style={{ 
                      background: `${DESIGN.colors.textSecondary}80`,
                      animationDelay: '0ms' 
                    }} />
                  <span className="w-2 h-2 rounded-full animate-bounce" 
                    style={{ 
                      background: `${DESIGN.colors.textSecondary}80`,
                      animationDelay: '150ms' 
                    }} />
                  <span className="w-2 h-2 rounded-full animate-bounce" 
                    style={{ 
                      background: `${DESIGN.colors.textSecondary}80`,
                      animationDelay: '300ms' 
                    }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="sticky bottom-0 border-t p-4" style={{
          background: DESIGN.colors.background,
          borderColor: DESIGN.colors.card
        }}>
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <button
              type="button"
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{
                background: DESIGN.colors.card,
                borderRadius: DESIGN.borderRadius.roundButton
              }}
            >
              <Paperclip className="w-5 h-5" style={{ color: DESIGN.colors.textSecondary }} />
            </button>
            <button
              type="button"
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{
                background: DESIGN.colors.card,
                borderRadius: DESIGN.borderRadius.roundButton
              }}
            >
              <Camera className="w-5 h-5" style={{ color: DESIGN.colors.textSecondary }} />
            </button>
            <Input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 h-10"
              style={{
                background: DESIGN.colors.card,
                borderColor: DESIGN.colors.card,
                borderRadius: DESIGN.borderRadius.input,
                color: DESIGN.colors.textPrimary
              }}
            />
            <button
              type="button"
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{
                background: DESIGN.colors.card,
                borderRadius: DESIGN.borderRadius.roundButton
              }}
            >
              <Smile className="w-5 h-5" style={{ color: DESIGN.colors.textSecondary }} />
            </button>
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                newMessage.trim()
                  ? 'hover:opacity-90'
                  : ''
              )}
              style={{
                background: newMessage.trim() ? DESIGN.colors.primary : DESIGN.colors.card,
                color: newMessage.trim() ? DESIGN.colors.background : DESIGN.colors.textSecondary,
                borderRadius: DESIGN.borderRadius.roundButton
              }}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main Chats List View
  return (
    <div className="app-container min-h-screen pb-nav" style={{
      background: DESIGN.colors.background
    }}>
      {/* Header */}
      <div className="sticky top-0 z-30 border-b" style={{
        background: DESIGN.colors.background,
        borderColor: DESIGN.colors.card
      }}>
        <div className="flex items-center justify-between p-4">
          <h1 className="font-bold" style={{
            fontSize: DESIGN.typography.h1,
            color: DESIGN.colors.textPrimary
          }}>
            Chats
          </h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowFriendRequests(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity relative"
              style={{
                background: DESIGN.colors.card,
                borderRadius: DESIGN.borderRadius.roundButton
              }}>
              <UserCheck className="w-5 h-5" style={{ color: DESIGN.colors.textPrimary }} />
              {friendRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                  style={{
                    background: DESIGN.colors.primary,
                    color: DESIGN.colors.background
                  }}>
                  {friendRequestsCount}
                </span>
              )}
            </button>
            {activeTab === 'friends' && (
              <button 
                onClick={() => setShowQuickAdd(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                style={{
                  background: `${DESIGN.colors.primary}10`,
                  borderRadius: DESIGN.borderRadius.roundButton
                }}
              >
                <UserPlus className="w-5 h-5" style={{ color: DESIGN.colors.primary }} />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 pb-3 gap-2">
          <button
            onClick={() => setActiveTab('matches')}
            className={cn(
              'flex-1 py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'matches' 
                ? '' 
                : ''
            )}
            style={{
              borderRadius: DESIGN.borderRadius.card,
              ...(activeTab === 'matches' 
                ? { 
                    background: DESIGN.colors.primary, 
                    color: DESIGN.colors.background 
                  }
                : { 
                    background: DESIGN.colors.card, 
                    border: `1px solid ${DESIGN.colors.card}`,
                    color: DESIGN.colors.textSecondary 
                  })
            }}
          >
            <Heart className="w-4 h-4" />
            Matches
            {unreadMatchesCount > 0 && (
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs',
                activeTab === 'matches' ? 'bg-white/20' : 'bg-red-500 text-white'
              )}>
                {unreadMatchesCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={cn(
              'flex-1 py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'friends' 
                ? '' 
                : ''
            )}
            style={{
              borderRadius: DESIGN.borderRadius.card,
              ...(activeTab === 'friends' 
                ? { 
                    background: DESIGN.colors.primary, 
                    color: DESIGN.colors.background 
                  }
                : { 
                    background: DESIGN.colors.card, 
                    border: `1px solid ${DESIGN.colors.card}`,
                    color: DESIGN.colors.textSecondary 
                  })
            }}
          >
            <Users className="w-4 h-4" />
            Friends
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" 
              style={{ color: DESIGN.colors.textSecondary }} />
            <Input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-10"
              style={{
                background: DESIGN.colors.card,
                borderColor: DESIGN.colors.card,
                borderRadius: DESIGN.borderRadius.card,
                color: DESIGN.colors.textPrimary
              }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'matches' ? (
          <>
            {/* Matches List */}
            {filteredMatches.length > 0 ? (
              <div className="space-y-2">
                {filteredMatches.map((match) => (
                  <button
                    key={match.id}
                    onClick={() => setSelectedMatch(match)}
                    className={cn(
                      'w-full p-4 flex items-center gap-4 text-left hover:opacity-80 transition-all',
                      match.unread && 'border-l-4'
                    )}
                    style={{
                      background: DESIGN.colors.card,
                      border: `1px solid ${DESIGN.colors.card}`,
                      borderRadius: DESIGN.borderRadius.card,
                      ...(match.unread && {
                        borderLeftColor: DESIGN.colors.primary,
                        background: `${DESIGN.colors.primary}05`
                      })
                    }}
                  >
                    <div className="relative">
                      <img
                        src={match.matchProfile?.photo}
                        alt={match.matchProfile?.name}
                        className="w-14 h-14 rounded-full object-cover"
                        style={{ border: `2px solid ${DESIGN.colors.background}` }}
                      />
                      {match.online && (
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full"
                          style={{ border: `2px solid ${DESIGN.colors.background}` }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={cn('font-semibold', match.unread && 'font-bold')}
                          style={{ color: DESIGN.colors.textPrimary }}>
                          {match.matchProfile?.name || 'Unknown'}
                        </h3>
                        <span className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                          {formatTime(match.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm truncate mb-1.5" style={{ color: DESIGN.colors.textSecondary }}>
                        {match.lastMessage || 'Say hi 👋'}
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                        style={{
                          color: DESIGN.colors.primary,
                          background: `${DESIGN.colors.primary}10`,
                          borderRadius: DESIGN.borderRadius.smallPill
                        }}>
                        <Star className="w-3 h-3" />
                        {match.eventName}
                      </span>
                    </div>
                    {match.unread && (
                      <span className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: DESIGN.colors.primary }} />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              // Empty State for Matches
              <div className="text-center py-16">
                <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{
                    background: `${DESIGN.colors.primary}10`,
                    borderRadius: DESIGN.borderRadius.roundButton
                  }}>
                  <Heart className="w-12 h-12" style={{ color: DESIGN.colors.primary }} />
                </div>
                <h3 className="font-bold mb-2" style={{
                  fontSize: DESIGN.typography.h3,
                  color: DESIGN.colors.textPrimary
                }}>
                  No Matches Yet
                </h3>
                <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: DESIGN.colors.textSecondary }}>
                  Visit the Connect page to start meeting people at events! You'll see matches here once someone likes you back.
                </p>
                <Button onClick={() => navigate('/connect')} 
                  className="rounded-xl"
                  style={{
                    background: DESIGN.colors.primary,
                    color: DESIGN.colors.background,
                    borderRadius: DESIGN.borderRadius.button
                  }}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Go to Connect
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Friends List */}
            {hasFriends ? (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => {/* Navigate to friend chat */}}
                    className="w-full p-4 flex items-center gap-4 text-left hover:opacity-80 transition-all"
                    style={{
                      background: DESIGN.colors.card,
                      border: `1px solid ${DESIGN.colors.card}`,
                      borderRadius: DESIGN.borderRadius.card
                    }}
                  >
                    <div className="relative">
                      <img
                        src={friend.photo}
                        alt={friend.name}
                        className="w-14 h-14 rounded-full object-cover"
                        style={{ border: `2px solid ${DESIGN.colors.background}` }}
                      />
                      {friend.isPublic && (
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full"
                          style={{ border: `2px solid ${DESIGN.colors.background}` }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold"
                          style={{ color: DESIGN.colors.textPrimary }}>
                          {friend.name}
                        </h3>
                        <span className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
                          {friend.location || ''}
                        </span>
                      </div>
                      <p className="text-sm truncate" style={{ color: DESIGN.colors.textSecondary }}>
                        {friend.bio || 'Start a conversation'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              // Empty State for Friends - Only show if no friend requests and no friends
              !hasFriendRequests && !hasFriends && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{
                      background: `${DESIGN.colors.primary}10`,
                      borderRadius: DESIGN.borderRadius.roundButton
                    }}>
                    <Users className="w-12 h-12" style={{ color: DESIGN.colors.primary }} />
                  </div>
                  <h3 className="font-bold mb-2" style={{
                    fontSize: DESIGN.typography.h3,
                    color: DESIGN.colors.textPrimary
                  }}>
                    Build Your Network
                  </h3>
                  <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: DESIGN.colors.textSecondary }}>
                    Add friends to see their event plans, chat anytime, and make the most of your social experiences!
                  </p>
                  <div className="flex justify-center">
                    <Button onClick={() => setShowQuickAdd(true)} 
                      className="rounded-xl w-full max-w-xs"
                      style={{
                        background: DESIGN.colors.primary,
                        color: DESIGN.colors.background,
                        borderRadius: DESIGN.borderRadius.button
                      }}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Quick Add Friends
                    </Button>
                  </div>
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* Friend Requests Modal */}
      <FriendRequestsModal 
        isOpen={showFriendRequests} 
        onClose={() => setShowFriendRequests(false)}
      />

      {/* Quick Add Modal */}
      <QuickAddModal 
        isOpen={showQuickAdd} 
        onClose={() => setShowQuickAdd(false)}
        onSendRequest={handleSendFriendRequest}
      />

      <BottomNav />
    </div>
  );
}
