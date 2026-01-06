import { useState, useRef, KeyboardEvent } from 'react';
import { 
  MessageCircle, 
  Search, 
  MoreVertical, 
  Send, 
  Image, 
  Smile, 
  Phone, 
  Video,
  ArrowLeft,
  Camera,
  Paperclip,
  X,
  Check,
  CheckCheck,
  UserPlus,
  Users,
  Filter,
  Heart,
  User,
  Calendar,
  MapPin,
  Mail,
  UserCheck,
  UserX,
  Bell,
  BellOff,
  Archive,
  Trash2,
  Flag,
  Shield,
  Sparkles,
  Handshake,
  MoreHorizontal,
  Pin,
  UserMinus,
  Users as UsersIcon,
  ThumbsUp,
  Fire,
  PartyPopper,
  MessageSquare,
  Copy,
  Forward,
  Plus,
  Send as SendIcon
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { Match, Message, FriendRequest, Conversation } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

// Mock data for matches
const mockMatches: Match[] = [
  {
    id: '1',
    matchProfile: {
      id: 'user1',
      name: 'Sarah Jones',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      bio: 'Jazz enthusiast 🎷 | Coffee lover ☕️ | Travel addict ✈️',
      age: 28,
      location: 'New York, NY',
      interests: ['Jazz', 'Coffee', 'Travel', 'Photography'],
      online: true,
    },
    eventName: 'Brooklyn Jazz Festival',
    eventId: 'event1',
    eventPhoto: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
    matchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastMessage: 'Hey! Loved the jazz set last night 🎷',
    lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    unread: true,
    unreadCount: 3,
    isMatch: true,
    conversationId: 'conv1',
  },
  {
    id: '2',
    matchProfile: {
      id: 'user2',
      name: 'Alex Chen',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      bio: 'Tech startup founder 💻 | Rock climber 🧗‍♂️ | Foodie 🍣',
      age: 32,
      location: 'San Francisco, CA',
      interests: ['Tech', 'Climbing', 'Food', 'Travel'],
      online: false,
    },
    eventName: 'Tech Startup Mixer',
    eventId: 'event2',
    eventPhoto: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w-400',
    matchedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    lastMessage: 'Let\'s grab coffee sometime!',
    lastMessageTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    unread: false,
    unreadCount: 0,
    isMatch: true,
    conversationId: 'conv2',
  },
];

// Mock data for friends
const mockFriends: Conversation[] = [
  {
    id: 'friend1',
    userId: 'user3',
    userName: 'Michael Brown',
    userPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    lastMessage: 'Are you going to the food festival this weekend?',
    lastMessageTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    unread: true,
    unreadCount: 2,
    isFriend: true,
    friendSince: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    sharedEvents: ['Food Festival', 'Tech Conference'],
    online: true,
  },
  {
    id: 'friend2',
    userId: 'user4',
    userName: 'Jessica Wilson',
    userPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica',
    lastMessage: 'Thanks for the book recommendation!',
    lastMessageTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    unread: false,
    unreadCount: 0,
    isFriend: true,
    friendSince: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    sharedEvents: ['Book Club', 'Art Exhibition'],
    online: false,
  },
];

// Mock data for friend requests
const mockFriendRequests: FriendRequest[] = [
  {
    id: 'req1',
    fromUser: {
      id: 'user5',
      name: 'David Miller',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
      bio: 'Photographer 📸 | Hiker 🥾 | Dog lover 🐕',
      mutualFriends: 2,
      sharedEvents: ['Photography Workshop'],
    },
    sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
  {
    id: 'req2',
    fromUser: {
      id: 'user6',
      name: 'Emma Garcia',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
      bio: 'Yoga instructor 🧘‍♀️ | Painter 🎨 | Vegan chef 🌱',
      mutualFriends: 1,
      sharedEvents: ['Yoga Retreat', 'Art Fair'],
    },
    sentAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
];

export default function Matches() {
  const { matches: contextMatches } = useApp();
  const { toast } = useToast();
  
  // State for the page
  const [selectedConversation, setSelectedConversation] = useState<Match | Conversation | null>(null);
  const [activeTab, setActiveTab] = useState<'matches' | 'friends'>('matches');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFriendRequests, setShowFriendRequests] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddSearch, setQuickAddSearch] = useState('');
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(mockFriendRequests);
  
  // State for conversation view
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
      text: 'Thanks! You were amazing too! Let\'s jam again soon?',
      timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      read: true,
      type: 'text',
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Combine context matches with mock data for now
  const allMatches = [...contextMatches, ...mockMatches];
  const allFriends = mockFriends;
  
  // Filter conversations based on search
  const filteredMatches = allMatches.filter(match =>
    match.matchProfile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.eventName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredFriends = allFriends.filter(friend =>
    friend.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Calculate unread counts
  const unreadMatchesCount = allMatches.filter(m => m.unread).length;
  const unreadFriendsCount = allFriends.filter(f => f.unread).length;
  const pendingRequestsCount = friendRequests.filter(r => r.status === 'pending').length;

  // Format time helper
  const formatTime = (dateString: string) => {
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
  };

  // Format date for friend since
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Handle sending a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: crypto.randomUUID(),
      chatId: selectedConversation.id,
      senderId: 'me',
      text: newMessage,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'text',
    };

    setMessages([...messages, message]);
    setNewMessage('');

    // Simulate reply after 2 seconds
    setTimeout(() => {
      const replies = [
        'That sounds great! 😊',
        'Would love to catch up more!',
        'What are you doing this weekend?',
        'Same! It was such a vibe',
        'Perfect timing!',
        'Can\'t wait! 🎶',
      ];
      const reply: Message = {
        id: crypto.randomUUID(),
        chatId: selectedConversation.id,
        senderId: 'other',
        text: replies[Math.floor(Math.random() * replies.length)],
        timestamp: new Date().toISOString(),
        read: false,
        type: 'text',
      };
      setMessages((prev) => [...prev, reply]);
    }, 2000);
  };

  // Handle friend request actions
  const handleAcceptRequest = (requestId: string) => {
    setFriendRequests(prev => 
      prev.map(req => 
        req.id === requestId ? { ...req, status: 'accepted' } : req
      )
    );
    toast({
      title: 'Friend request accepted',
      description: 'You are now friends!',
    });
  };

  const handleDeclineRequest = (requestId: string) => {
    setFriendRequests(prev => prev.filter(req => req.id !== requestId));
    toast({
      title: 'Friend request declined',
    });
  };

  const handleBlockRequest = (requestId: string) => {
    setFriendRequests(prev => prev.filter(req => req.id !== requestId));
    toast({
      title: 'User blocked',
      description: 'This user can no longer send you friend requests',
    });
  };

  // Handle unmatching/removing friend
  const handleUnmatch = () => {
    if (selectedConversation && window.confirm(`Are you sure you want to unmatch with ${'matchProfile' in selectedConversation ? selectedConversation.matchProfile.name : selectedConversation.userName}?`)) {
      toast({
        title: 'Unmatched',
        description: `You have unmatched with ${'matchProfile' in selectedConversation ? selectedConversation.matchProfile.name : selectedConversation.userName}`,
      });
      setSelectedConversation(null);
    }
  };

  const handleRemoveFriend = () => {
    if (selectedConversation && window.confirm(`Are you sure you want to remove ${'matchProfile' in selectedConversation ? selectedConversation.matchProfile.name : selectedConversation.userName} as a friend?`)) {
      toast({
        title: 'Friend removed',
        description: `${'matchProfile' in selectedConversation ? selectedConversation.matchProfile.name : selectedConversation.userName} has been removed from your friends list`,
      });
      setSelectedConversation(null);
    }
  };

  return (
    <div className="app-container min-h-screen bg-background pb-nav">
      {/* Main Layout */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Conversations List Sidebar */}
        <div className={cn(
          "w-full md:w-96 border-r border-border bg-background transition-all duration-300",
          selectedConversation ? "hidden md:block" : "block"
        )}>
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Chats</h1>
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors">
                  <Filter className="w-5 h-5" />
                </button>
                {activeTab === 'friends' && (
                  <button 
                    onClick={() => setShowQuickAdd(true)}
                    className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <UserPlus className="w-5 h-5 text-primary" />
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="matches" value={activeTab} onValueChange={(v) => setActiveTab(v as 'matches' | 'friends')}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="matches" className="relative">
                  <Heart className="w-4 h-4 mr-2" />
                  Matches
                  {unreadMatchesCount > 0 && (
                    <Badge className="ml-2 px-1.5 py-0.5 min-w-5 h-5 flex items-center justify-center text-xs bg-red-500 text-white">
                      {unreadMatchesCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="friends" className="relative">
                  <User className="w-4 h-4 mr-2" />
                  Friends
                  {unreadFriendsCount > 0 && (
                    <Badge className="ml-2 px-1.5 py-0.5 min-w-5 h-5 flex items-center justify-center text-xs bg-blue-500 text-white">
                      {unreadFriendsCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={`Search ${activeTab === 'matches' ? 'matches' : 'friends'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-10 bg-card border-border rounded-lg"
              />
            </div>
          </div>

          {/* Conversations List */}
          <ScrollArea className="h-[calc(100vh-200px)]">
            {/* Friend Requests Section (only in Friends tab) */}
            {activeTab === 'friends' && pendingRequestsCount > 0 && (
              <div className="border-b border-border">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <h3 className="font-semibold">Friend Requests</h3>
                    <Badge className="ml-1 bg-red-500 text-white">
                      {pendingRequestsCount}
                    </Badge>
                  </div>
                  <button
                    onClick={() => setShowFriendRequests(!showFriendRequests)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {showFriendRequests ? 'Hide' : 'Show'}
                  </button>
                </div>
                
                {showFriendRequests && (
                  <div className="px-4 pb-4 space-y-3">
                    {friendRequests
                      .filter(req => req.status === 'pending')
                      .map((request) => (
                        <div key={request.id} className="bg-card rounded-xl p-3 space-y-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={request.fromUser.photo} />
                              <AvatarFallback>{request.fromUser.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">{request.fromUser.name}</h4>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {request.fromUser.mutualFriends > 0 && (
                                  <span>{request.fromUser.mutualFriends} mutual friend{request.fromUser.mutualFriends !== 1 ? 's' : ''}</span>
                                )}
                                {request.fromUser.sharedEvents.length > 0 && (
                                  <span>• {request.fromUser.sharedEvents.length} shared event{request.fromUser.sharedEvents.length !== 1 ? 's' : ''}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-primary hover:bg-primary/90"
                              onClick={() => handleAcceptRequest(request.id)}
                            >
                              <UserCheck className="w-3 h-3 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleDeclineRequest(request.id)}
                            >
                              <UserX className="w-3 h-3 mr-1" />
                              Decline
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" className="px-2">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-red-500"
                                  onClick={() => handleBlockRequest(request.id)}
                                >
                                  <Shield className="w-4 h-4 mr-2" />
                                  Block User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Empty States */}
            {activeTab === 'matches' && filteredMatches.length === 0 && (
              <div className="text-center py-16 px-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">No Matches Yet</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Visit the Connect page to start meeting people at events!
                  You'll see matches here once someone likes you back.
                </p>
                <Button className="gradient-pro glow-purple rounded-lg">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Go to Connect
                </Button>
              </div>
            )}

            {activeTab === 'friends' && filteredFriends.length === 0 && pendingRequestsCount === 0 && (
              <div className="text-center py-16 px-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Handshake className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Build Your Network</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Add friends to see their event plans, chat anytime, 
                  and make the most of your social experiences!
                </p>
                <Button 
                  onClick={() => setShowQuickAdd(true)}
                  className="gradient-pro glow-purple rounded-lg"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Quick Add Friends
                </Button>
              </div>
            )}

            {/* Matches List */}
            {activeTab === 'matches' && filteredMatches.length > 0 && (
              <div className="divide-y divide-border">
                {filteredMatches.map((match) => (
                  <ContextMenu key={match.id}>
                    <ContextMenuTrigger asChild>
                      <button
                        onClick={() => setSelectedConversation(match)}
                        className={cn(
                          "w-full p-4 flex items-center gap-4 hover:bg-card/50 transition-all text-left",
                          selectedConversation?.id === match.id && "bg-primary/5"
                        )}
                      >
                        <div className="relative">
                          <Avatar className="h-12 w-12 border-2 border-background">
                            <AvatarImage src={match.matchProfile.photo} />
                            <AvatarFallback>{match.matchProfile.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {match.matchProfile.online && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-brand-green rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-sm">{match.matchProfile.name}</h3>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(match.lastMessageTime)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mb-1">
                            {match.lastMessage || 'Say hi 👋'}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs px-2 py-0.5">
                              {match.eventName}
                            </Badge>
                            {match.unread && (
                              <div className="flex items-center gap-1">
                                {match.unreadCount > 0 && (
                                  <Badge className="h-5 min-w-5 px-1 bg-primary text-white text-xs">
                                    {match.unreadCount}
                                  </Badge>
                                )}
                                <CheckCheck className="w-4 h-4 text-primary" />
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem>
                        <Pin className="w-4 h-4 mr-2" />
                        Pin Conversation
                      </ContextMenuItem>
                      <ContextMenuItem>
                        <BellOff className="w-4 h-4 mr-2" />
                        Mute Notifications
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem className="text-red-500" onClick={handleUnmatch}>
                        <UserX className="w-4 h-4 mr-2" />
                        Unmatch
                      </ContextMenuItem>
                      <ContextMenuItem className="text-red-500">
                        <Shield className="w-4 h-4 mr-2" />
                        Block
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </div>
            )}

            {/* Friends List */}
            {activeTab === 'friends' && filteredFriends.length > 0 && (
              <div className="divide-y divide-border">
                {filteredFriends.map((friend) => (
                  <ContextMenu key={friend.id}>
                    <ContextMenuTrigger asChild>
                      <button
                        onClick={() => setSelectedConversation(friend)}
                        className={cn(
                          "w-full p-4 flex items-center gap-4 hover:bg-card/50 transition-all text-left",
                          selectedConversation?.id === friend.id && "bg-primary/5"
                        )}
                      >
                        <div className="relative">
                          <Avatar className="h-12 w-12 border-2 border-background">
                            <AvatarImage src={friend.userPhoto} />
                            <AvatarFallback>{friend.userName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {friend.online && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-brand-green rounded-full border-2 border-background" />
                          )}
                          {friend.sharedEvents && friend.sharedEvents.length > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 border-2 border-background flex items-center justify-center">
                              <Calendar className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-sm">{friend.userName}</h3>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(friend.lastMessageTime)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mb-1">
                            {friend.lastMessage}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                Friends since {formatDate(friend.friendSince)}
                              </span>
                              {friend.sharedEvents && friend.sharedEvents.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {friend.sharedEvents.length} shared event{friend.sharedEvents.length !== 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                            {friend.unread && (
                              <div className="flex items-center gap-1">
                                {friend.unreadCount > 0 && (
                                  <Badge className="h-5 min-w-5 px-1 bg-blue-500 text-white text-xs">
                                    {friend.unreadCount}
                                  </Badge>
                                )}
                                <CheckCheck className="w-4 h-4 text-blue-500" />
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem>
                        <Calendar className="w-4 h-4 mr-2" />
                        View Shared Events
                      </ContextMenuItem>
                      <ContextMenuItem>
                        <UsersIcon className="w-4 h-4 mr-2" />
                        See Mutual Friends
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem>
                        <BellOff className="w-4 h-4 mr-2" />
                        Mute Notifications
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem className="text-red-500" onClick={handleRemoveFriend}>
                        <UserMinus className="w-4 h-4 mr-2" />
                        Remove Friend
                      </ContextMenuItem>
                      <ContextMenuItem className="text-red-500">
                        <Shield className="w-4 h-4 mr-2" />
                        Block
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area / Empty State */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col bg-background">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={'matchProfile' in selectedConversation ? selectedConversation.matchProfile.photo : selectedConversation.userPhoto} />
                      <AvatarFallback>
                        {('matchProfile' in selectedConversation ? selectedConversation.matchProfile.name : selectedConversation.userName).charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {('matchProfile' in selectedConversation ? selectedConversation.matchProfile.online : selectedConversation.online) && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-brand-green rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {'matchProfile' in selectedConversation ? selectedConversation.matchProfile.name : selectedConversation.userName}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {('matchProfile' in selectedConversation ? selectedConversation.matchProfile.online : selectedConversation.online) 
                        ? 'Online' 
                        : `Active ${formatTime('matchProfile' in selectedConversation ? selectedConversation.lastMessageTime : selectedConversation.lastMessageTime)}`}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors">
                  <Video className="w-5 h-5" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <User className="w-4 h-4 mr-2" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Bell className="w-4 h-4 mr-2" />
                        Mute Notifications
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem>For 1 hour</DropdownMenuItem>
                          <DropdownMenuItem>For 8 hours</DropdownMenuItem>
                          <DropdownMenuItem>Until I unmute</DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Search className="w-4 h-4 mr-2" />
                      Search in Conversation
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Image className="w-4 h-4 mr-2" />
                      View Media, Files & Links
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Archive className="w-4 h-4 mr-2" />
                      Clear Chat History
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {'matchProfile' in selectedConversation ? (
                      <DropdownMenuItem className="text-red-500" onClick={handleUnmatch}>
                        <UserX className="w-4 h-4 mr-2" />
                        Unmatch
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem className="text-red-500" onClick={handleRemoveFriend}>
                        <UserMinus className="w-4 h-4 mr-2" />
                        Remove Friend
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="text-red-500">
                      <Shield className="w-4 h-4 mr-2" />
                      Block
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-500">
                      <Flag className="w-4 h-4 mr-2" />
                      Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages Container */}
            <ScrollArea className="flex-1 p-4">
              {messages.map((message) => (
                <ContextMenu key={message.id}>
                  <ContextMenuTrigger asChild>
                    <div
                      className={cn(
                        'flex mb-4',
                        message.senderId === 'me' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div className="max-w-[70%]">
                        <div
                          className={cn(
                            'px-4 py-3 rounded-2xl',
                            message.senderId === 'me'
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-card rounded-bl-md'
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                        </div>
                        <div className={cn(
                          'flex items-center gap-2 mt-1 text-xs text-muted-foreground',
                          message.senderId === 'me' ? 'justify-end' : 'justify-start'
                        )}>
                          {message.senderId === 'me' && (
                            <>
                              {message.read ? (
                                <CheckCheck className="w-3 h-3 text-blue-500" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                            </>
                          )}
                          <span>{formatTime(message.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Reply
                    </ContextMenuItem>
                    <ContextMenuSub>
                      <ContextMenuSubTrigger>
                        <Sparkles className="w-4 h-4 mr-2" />
                        React
                      </ContextMenuSubTrigger>
                      <ContextMenuSubContent>
                        <div className="flex gap-2 p-2">
                          <button
                            className="w-8 h-8 rounded-full bg-card flex items-center justify-center hover:bg-card/80"
                            onClick={() => toast({ title: '❤️ Reaction sent' })}
                          >
                            <Heart className="w-5 h-5 text-red-500" />
                          </button>
                          <button
                            className="w-8 h-8 rounded-full bg-card flex items-center justify-center hover:bg-card/80"
                            onClick={() => toast({ title: '👍 Reaction sent' })}
                          >
                            <ThumbsUp className="w-5 h-5 text-blue-500" />
                          </button>
                          <button
                            className="w-8 h-8 rounded-full bg-card flex items-center justify-center hover:bg-card/80"
                            onClick={() => toast({ title: '🔥 Reaction sent' })}
                          >
                            <Fire className="w-5 h-5 text-orange-500" />
                          </button>
                          <button
                            className="w-8 h-8 rounded-full bg-card flex items-center justify-center hover:bg-card/80"
                            onClick={() => toast({ title: '🎉 Reaction sent' })}
                          >
                            <PartyPopper className="w-5 h-5 text-yellow-500" />
                          </button>
                        </div>
                      </ContextMenuSubContent>
                    </ContextMenuSub>
                    <ContextMenuItem>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </ContextMenuItem>
                    <ContextMenuItem>
                      <Forward className="w-4 h-4 mr-2" />
                      Forward
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem className="text-red-500">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem>
                      <Camera className="w-4 h-4 mr-2" />
                      Camera
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Image className="w-4 h-4 mr-2" />
                      Photo & Video
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Paperclip className="w-4 h-4 mr-2" />
                      File
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <MapPin className="w-4 h-4 mr-2" />
                      Location
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Message Input */}
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="h-12 pl-4 pr-12 bg-card border-border rounded-full"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full hover:bg-card/50 flex items-center justify-center"
                  >
                    <Smile className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                    newMessage.trim()
                      ? "gradient-pro hover:opacity-90"
                      : "bg-card hover:bg-card/80"
                  )}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Empty Chat State */
          <div className="flex-1 hidden md:flex flex-col items-center justify-center p-8">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <MessageCircle className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Your Messages</h3>
            <p className="text-muted-foreground text-center mb-8 max-w-md">
              {activeTab === 'matches' 
                ? 'Select a match to start chatting, or meet new people at events!'
                : 'Select a friend to chat, or add new friends to grow your network!'}
            </p>
            <div className="flex gap-3">
              <Button className="rounded-lg bg-card hover:bg-card/80">
                <Calendar className="w-4 h-4 mr-2" />
                Browse Events
              </Button>
              {activeTab === 'matches' ? (
                <Button className="rounded-lg gradient-pro glow-purple">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Find Matches
                </Button>
              ) : (
                <Button 
                  onClick={() => setShowQuickAdd(true)}
                  className="rounded-lg gradient-pro glow-purple"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Friends
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-bold">Quick Add</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Search for people to add as friends
                </p>
              </div>
              <button
                onClick={() => setShowQuickAdd(false)}
                className="w-10 h-10 rounded-full hover:bg-card/80 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-6 border-b border-border">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by username, name, or email..."
                  value={quickAddSearch}
                  onChange={(e) => setQuickAddSearch(e.target.value)}
                  className="h-12 pl-10 bg-background"
                />
              </div>
            </div>

            {/* Results */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Suggestions</h3>
                
                {/* Mock results */}
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Search for users to add as friends</p>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
