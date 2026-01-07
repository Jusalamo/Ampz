import { useState, useEffect, useRef, KeyboardEvent, useCallback } from 'react';
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
  MessageSquare
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { Match, Message, Friend, FriendRequest } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'matches' | 'friends';

// Quick Add Modal Component
function QuickAddModal({ 
  isOpen, 
  onClose,
  onAddFriend
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onAddFriend: (userId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const { connectionProfiles } = useApp();
  
  // Filter profiles based on search
  const searchResults = connectionProfiles.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  // Suggestions - people from same events, mutual connections
  const suggestions = connectionProfiles.slice(0, 4);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Quick Add Friends
          </DialogTitle>
        </DialogHeader>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Search Results</p>
            {searchResults.length > 0 ? (
              searchResults.map(user => (
                <div key={user.id} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                  <img src={user.photo} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.location}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => onAddFriend(user.id)}
                    className="h-8"
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
            )}
          </div>
        )}

        {/* Suggestions */}
        {!searchQuery && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Suggestions</p>
            {suggestions.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                <img src={user.photo} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.floor(Math.random() * 5)} mutual friends
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onAddFriend(user.id)}
                  className="h-8"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Chats() {
  const navigate = useNavigate();
  const { matches, user, isDemo } = useApp();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('matches');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Mock friend requests
  const [friendRequests] = useState([
    { id: '1', name: 'Jessica Martinez', photo: 'https://i.pravatar.cc/100?img=45', mutualFriends: 1 },
    { id: '2', name: 'Alex Kumar', photo: 'https://i.pravatar.cc/100?img=68', mutualFriends: 3 },
  ]);

  // Mock friends list
  const [friends] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter matches based on search
  const filteredMatches = matches.filter(match =>
    match.matchProfile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.eventName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadMatchesCount = matches.filter(m => m.unread).length;
  const unreadFriendsCount = 0; // Will be dynamic when friends are implemented

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

  const handleAddFriend = (userId: string) => {
    toast({
      title: 'Friend request sent!',
      description: 'They will be notified of your request.',
    });
    setShowQuickAdd(false);
  };

  const handleAcceptRequest = (requestId: string) => {
    toast({
      title: 'Friend request accepted!',
      description: 'You can now message each other.',
    });
  };

  const handleDeclineRequest = (requestId: string) => {
    toast({
      title: 'Request declined',
    });
  };

  // Conversation View
  if (selectedMatch) {
    return (
      <div className="app-container min-h-screen bg-background flex flex-col">
        {/* Chat Header */}
        <header className="sticky top-0 z-30 bg-background border-b border-border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedMatch(null)}
                className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={selectedMatch.matchProfile.photo}
                    alt={selectedMatch.matchProfile.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {selectedMatch.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedMatch.matchProfile.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedMatch.online ? 'Online' : `Active ${formatTime(selectedMatch.timestamp)}`}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              {showMoreOptions && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50 py-2">
                  <button className="w-full px-4 py-3 text-left hover:bg-muted/50 text-sm flex items-center gap-3">
                    <Users className="w-4 h-4" />
                    View Profile
                  </button>
                  <button className="w-full px-4 py-3 text-left hover:bg-muted/50 text-sm flex items-center gap-3">
                    <Pin className="w-4 h-4" />
                    Pin Conversation
                  </button>
                  <button className="w-full px-4 py-3 text-left hover:bg-muted/50 text-sm flex items-center gap-3">
                    <BellOff className="w-4 h-4" />
                    Mute Notifications
                  </button>
                  <div className="border-t border-border my-1" />
                  <button className="w-full px-4 py-3 text-left hover:bg-muted/50 text-sm flex items-center gap-3 text-red-500">
                    <Trash2 className="w-4 h-4" />
                    Unmatch
                  </button>
                  <button className="w-full px-4 py-3 text-left hover:bg-muted/50 text-sm flex items-center gap-3 text-red-500">
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
                src={selectedMatch.matchProfile.photo}
                alt={selectedMatch.matchProfile.name}
                className="w-full h-full rounded-full object-cover border-4 border-primary/20"
              />
            </div>
            <h3 className="font-bold text-lg">{selectedMatch.matchProfile.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Matched at {selectedMatch.eventName}
            </p>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
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
                  <p className="text-center text-xs text-muted-foreground my-4">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('flex', isMe ? 'justify-end' : 'justify-start')}
                >
                  <div className={cn(
                    'max-w-[75%] px-4 py-2.5 rounded-2xl',
                    isMe 
                      ? 'bg-primary text-primary-foreground rounded-br-md' 
                      : 'bg-card border border-border rounded-bl-md'
                  )}>
                    <p className="text-sm">{message.text}</p>
                    <div className={cn(
                      'flex items-center gap-1 mt-1',
                      isMe ? 'justify-end' : 'justify-start'
                    )}>
                      <span className="text-[10px] opacity-70">
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
              <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="sticky bottom-0 bg-background border-t border-border p-4">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors"
            >
              <Paperclip className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors"
            >
              <Camera className="w-5 h-5 text-muted-foreground" />
            </button>
            <Input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 bg-card border-border rounded-full h-10"
            />
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors"
            >
              <Smile className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                newMessage.trim()
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-card text-muted-foreground'
              )}
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
    <div className="app-container min-h-screen bg-background pb-nav">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
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
        <div className="flex px-4 pb-3 gap-2">
          <button
            onClick={() => setActiveTab('matches')}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'matches' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-card border border-border text-muted-foreground'
            )}
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
              'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'friends' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-card border border-border text-muted-foreground'
            )}
          >
            <Users className="w-4 h-4" />
            Friends
            {unreadFriendsCount > 0 && (
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs',
                activeTab === 'friends' ? 'bg-white/20' : 'bg-blue-500 text-white'
              )}>
                {unreadFriendsCount}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-10 bg-card border-border rounded-xl"
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
                      'w-full p-4 bg-card rounded-xl border border-border flex items-center gap-4 hover:bg-card/80 transition-all text-left',
                      match.unread && 'border-l-4 border-l-primary bg-primary/5'
                    )}
                  >
                    <div className="relative">
                      <img
                        src={match.matchProfile.photo}
                        alt={match.matchProfile.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-background"
                      />
                      {match.online && (
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={cn('font-semibold', match.unread && 'font-bold')}>
                          {match.matchProfile.name}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(match.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mb-1.5">
                        {match.lastMessage || 'Say hi 👋'}
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                        <Star className="w-3 h-3" />
                        {match.eventName}
                      </span>
                    </div>
                    {match.unread && (
                      <span className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              // Empty State for Matches
              <div className="text-center py-16">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">No Matches Yet</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                  Visit the Connect page to start meeting people at events! You'll see matches here once someone likes you back.
                </p>
                <Button onClick={() => navigate('/connect')} className="rounded-xl">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Go to Connect
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Friend Requests Section */}
            {friendRequests.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Friend Requests ({friendRequests.length})
                </h2>
                <div className="space-y-2">
                  {friendRequests.map(request => (
                    <div key={request.id} className="bg-card rounded-xl p-4 border border-border">
                      <div className="flex items-center gap-3">
                        <img
                          src={request.photo}
                          alt={request.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{request.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {request.mutualFriends} mutual friends
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-9 w-9 p-0 rounded-full"
                            onClick={() => handleDeclineRequest(request.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            className="h-9 w-9 p-0 rounded-full"
                            onClick={() => handleAcceptRequest(request.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends List */}
            {friends.length > 0 ? (
              <div className="space-y-2">
                {/* Friends would be listed here similar to matches */}
              </div>
            ) : (
              // Empty State for Friends
              <div className="text-center py-16">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Users className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Build Your Network</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                  Add friends to see their event plans, chat anytime, and make the most of your social experiences!
                </p>
                <Button onClick={() => setShowQuickAdd(true)} className="rounded-xl">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Quick Add Friends
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal 
        isOpen={showQuickAdd} 
        onClose={() => setShowQuickAdd(false)}
        onAddFriend={handleAddFriend}
      />

      <BottomNav />
    </div>
  );
}
