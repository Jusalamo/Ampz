import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  Search,
  MoreVertical,
  Send,
  Smile,
  ArrowLeft,
  X,
  Check,
  CheckCheck,
  UserPlus,
  Users,
  Heart,
  Star,
  Pin,
  BellOff,
  Trash2,
  Flag,
  ChevronRight,
  Camera,
  Sparkles,
  UserCheck,
  Clock
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { Match, Message, ConnectionProfile } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { useFriends } from '@/hooks/useFriends';

type Tab = 'matches' | 'friends';

// Quick Add Modal
function QuickAddModal({
  isOpen,
  onClose,
  onSendRequest,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSendRequest: (userId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ConnectionProfile[]>([]);
  const { connectionProfiles = [] } = useApp();

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const results = connectionProfiles
      .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 10);
    setSearchResults(results);
    setIsSearching(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background border-card rounded-ampz-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-foreground">
            <UserPlus className="w-5 h-5 text-primary" />
            Quick Add Friends
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-card rounded-full text-foreground"
          />
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {isSearching ? (
            <p className="text-sm text-center py-4 text-muted-foreground">Searching...</p>
          ) : searchResults.length > 0 ? (
            searchResults.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-3 rounded-ampz-lg bg-card border border-card">
                <img src={user.photo} alt={user.name} className="w-10 h-10 rounded-full object-cover border-2 border-background" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.location || 'User'}</p>
                </div>
                <Button size="sm" onClick={() => onSendRequest(user.id)} className="h-8 rounded-ampz-sm bg-primary text-primary-foreground">
                  <UserPlus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            ))
          ) : searchQuery ? (
            <p className="text-sm text-center py-4 text-muted-foreground">No users found</p>
          ) : (
            <p className="text-sm text-center py-8 text-muted-foreground">Type a name to search</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Friend Requests Modal
function FriendRequestsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const { toast } = useToast();
  const { user } = useApp();
  // Use the same hook as Social.tsx so data is consistent
  const { receivedRequests, sentRequests, acceptFriendRequest, declineFriendRequest, cancelFriendRequest } = useFriends(user?.id);

  const handleAccept = async (requestId: string) => {
    const success = await acceptFriendRequest(requestId);
    if (success) toast({ title: 'Friend added!' });
  };

  const handleDecline = async (requestId: string) => {
    await declineFriendRequest(requestId);
  };

  const handleCancel = async (requestId: string) => {
    await cancelFriendRequest(requestId);
    toast({ title: 'Request cancelled' });
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / 86400000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch { return 'Recently'; }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[80vh] bg-background border-card rounded-ampz-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-foreground">
            <UserCheck className="w-5 h-5 text-primary" />
            Friend Requests
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 justify-center mb-4">
          {(['received', 'sent'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-full transition-colors',
                activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-card border border-card text-muted-foreground'
              )}
            >
              {tab === 'received' ? 'Received' : 'Sent'}
              {tab === 'received' && receivedRequests.length > 0 && ` (${receivedRequests.length})`}
              {tab === 'sent' && sentRequests.length > 0 && ` (${sentRequests.length})`}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {activeTab === 'received' ? (
            receivedRequests.length > 0 ? receivedRequests.map(request => (
              <div key={request.id} className="flex items-center gap-3 p-4 bg-card border border-card rounded-ampz-lg">
                <img src={request.senderPhoto} alt={request.senderName} className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{request.senderName}</p>
                  <p className="text-xs flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />{formatTime(request.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-9 w-9 p-0 rounded-full" onClick={() => handleDecline(request.id)}>
                    <X className="w-4 h-4" />
                  </Button>
                  <Button size="sm" className="h-9 w-9 p-0 rounded-full bg-primary" onClick={() => handleAccept(request.id)}>
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )) : (
              <div className="text-center py-12">
                <UserCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No pending requests</p>
              </div>
            )
          ) : (
            sentRequests.length > 0 ? sentRequests.map(request => (
              <div key={request.id} className="flex items-center gap-3 p-4 bg-card border border-card rounded-ampz-lg">
                <img src={request.senderPhoto} alt={request.senderName} className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{request.senderName}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />{formatTime(request.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">Pending</span>
                  <Button size="sm" variant="ghost" onClick={() => handleCancel(request.id)} className="h-7 text-xs text-muted-foreground">
                    Cancel
                  </Button>
                </div>
              </div>
            )) : (
              <div className="text-center py-12">
                <Send className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No sent requests</p>
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
  const { matches = [], user } = useApp();
  // Use real useFriends hook — same source of truth as Social.tsx
  const { friends, receivedRequests, sendFriendRequest } = useFriends(user?.id);
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
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredMatches = matches.filter(match =>
    match?.matchProfile?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match?.eventName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadMatchesCount = matches.filter(m => m?.unread).length;
  const friendRequestsCount = receivedRequests.length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    } catch { return 'Recently'; }
  };

  // Use React.KeyboardEvent<HTMLInputElement> — no local type alias to avoid collision
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSendMessage(e as any);
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

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    setTimeout(() => {
      const replies = [
        'That sounds great! 😊',
        'Would love to catch up more!',
        'What are you doing this weekend?',
        'Same! It was such a vibe',
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
      setMessages(prev => [...prev, reply]);
    }, 2000);
  };

  // Real send friend request — uses useFriends hook (same as Social.tsx)
  const handleSendFriendRequest = async (userId: string) => {
    const success = await sendFriendRequest(userId);
    if (success) {
      toast({ title: 'Friend request sent!', description: 'They will be notified.' });
    }
    setShowQuickAdd(false);
  };

  // Conversation View
  if (selectedMatch) {
    return (
      <div className="app-container min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-30 border-b bg-background border-card">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedMatch(null)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 bg-card"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={selectedMatch.matchProfile?.photo}
                    alt={selectedMatch.matchProfile?.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-background"
                  />
                  {selectedMatch.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-[15px] text-foreground">{selectedMatch.matchProfile?.name || 'Unknown'}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedMatch.online ? 'Online' : `Active ${formatTime(selectedMatch.timestamp)}`}
                  </p>
                </div>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 bg-card"
              >
                <MoreVertical className="w-5 h-5 text-foreground" />
              </button>
              {showMoreOptions && (
                <div className="absolute right-0 top-full mt-2 w-48 py-2 z-50 bg-card border border-card rounded-ampz-lg shadow-lg">
                  <button className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 text-foreground hover:opacity-80">
                    <Pin className="w-4 h-4" />Pin Conversation
                  </button>
                  <button className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 text-foreground hover:opacity-80">
                    <BellOff className="w-4 h-4" />Mute Notifications
                  </button>
                  <div className="my-1 border-t border-muted-foreground/20" />
                  <button className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 text-destructive hover:opacity-80">
                    <Trash2 className="w-4 h-4" />Unmatch
                  </button>
                  <button className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 text-destructive hover:opacity-80">
                    <Flag className="w-4 h-4" />Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-center py-4">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <img
                src={selectedMatch.matchProfile?.photo}
                alt={selectedMatch.matchProfile?.name}
                className="w-full h-full rounded-full object-cover border-4 border-primary/20"
              />
            </div>
            <h3 className="font-bold text-[22px] text-foreground">{selectedMatch.matchProfile?.name || 'Unknown'}</h3>
            <p className="text-sm mb-2 text-muted-foreground">Matched at {selectedMatch.eventName}</p>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
              <Heart className="w-3 h-3" />{formatTime(selectedMatch.timestamp)}
            </span>
          </div>

          {messages.map((message, index) => {
            const isMe = message.senderId === 'me';
            const showTime = index === 0 ||
              new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 900000;

            return (
              <div key={message.id}>
                {showTime && (
                  <p className="text-center text-xs my-4 text-muted-foreground">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('flex', isMe ? 'justify-end' : 'justify-start')}
                >
                  <div className={cn(
                    'max-w-[75%] px-4 py-2.5 rounded-ampz-lg',
                    isMe ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-card text-foreground'
                  )}>
                    <p className="text-sm">{message.text}</p>
                    <div className={cn('flex items-center gap-1 mt-1', isMe ? 'justify-end' : 'justify-start')}>
                      <span className="text-[10px] opacity-70">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && (
                        message.read
                          ? <CheckCheck className="w-3 h-3 text-primary-foreground/70" />
                          : <Check className="w-3 h-3 text-primary-foreground/70" />
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="px-4 py-3 rounded-ampz-lg bg-card">
                <div className="flex gap-1">
                  {[0, 150, 300].map(delay => (
                    <span key={delay} className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="sticky bottom-0 p-4 border-t bg-background border-card pb-safe">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <button type="button" className="w-10 h-10 rounded-full flex items-center justify-center bg-card">
              <Camera className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="flex-1 relative">
              <Input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                className="pr-10 h-11 bg-card border-card rounded-full text-foreground placeholder:text-muted-foreground"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <Smile className="w-5 h-5" />
              </button>
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                newMessage.trim() ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-card text-muted-foreground'
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
    <div className="app-container min-h-screen flex flex-col pb-20 bg-background">
      <header className="sticky top-0 z-30 border-b bg-background border-card">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFriendRequests(true)}
              className="relative w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 bg-card"
            >
              <UserCheck className="w-5 h-5 text-foreground" />
              {friendRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center bg-destructive text-destructive-foreground">
                  {friendRequestsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowQuickAdd(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 bg-primary text-primary-foreground"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-card border-card rounded-full text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex border-b border-card">
          <button
            onClick={() => setActiveTab('matches')}
            className={cn('flex-1 py-3 text-sm font-medium relative', activeTab === 'matches' ? 'text-primary' : 'text-muted-foreground')}
          >
            <div className="flex items-center justify-center gap-2">
              <Heart className="w-4 h-4" />
              Matches
              {unreadMatchesCount > 0 && (
                <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center bg-primary text-primary-foreground">
                  {unreadMatchesCount}
                </span>
              )}
            </div>
            {activeTab === 'matches' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={cn('flex-1 py-3 text-sm font-medium relative', activeTab === 'friends' ? 'text-primary' : 'text-muted-foreground')}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              Friends {friends.length > 0 && `(${friends.length})`}
              {friendRequestsCount > 0 && <span className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            {activeTab === 'friends' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'matches' ? (
          filteredMatches.length > 0 ? (
            <div className="divide-y divide-card">
              {filteredMatches.map((match) => (
                <button
                  key={match.id}
                  onClick={() => setSelectedMatch(match)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-card/50 text-left"
                >
                  <div className="relative">
                    <img src={match.matchProfile?.photo} alt={match.matchProfile?.name} className="w-14 h-14 rounded-full object-cover border-2 border-background" />
                    {match.online && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-foreground">{match.matchProfile?.name || 'Unknown'}</h3>
                      <span className="text-xs text-muted-foreground">{formatTime(match.timestamp)}</span>
                    </div>
                    <p className="text-sm truncate text-muted-foreground">{match.lastMessage || 'Start a conversation!'}</p>
                    <p className="text-xs mt-1 text-primary">{match.eventName}</p>
                  </div>
                  {match.unread && <span className="w-3 h-3 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 px-8 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-primary/10">
                <Heart className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">No matches yet</h3>
              <p className="text-sm text-muted-foreground">Start swiping to find your connections!</p>
              <Button onClick={() => navigate('/connect')} className="mt-4 bg-primary text-primary-foreground">
                <Sparkles className="w-4 h-4 mr-2" />Start Connecting
              </Button>
            </div>
          )
        ) : (
          friends.length > 0 ? (
            <div className="divide-y divide-card">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center gap-3 p-4">
                  <div className="relative">
                    <img src={friend.friendPhoto} alt={friend.friendName} className="w-14 h-14 rounded-full object-cover border-2 border-background" />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{friend.friendName}</h3>
                    <p className="text-xs text-muted-foreground">
                      Friends since {new Date(friend.friendsSince).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 px-8 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-primary/10">
                <Users className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Add Friends</h3>
              <p className="text-sm text-muted-foreground">Search and add friends to start chatting!</p>
              <Button onClick={() => setShowQuickAdd(true)} className="mt-4 bg-primary text-primary-foreground">
                <UserPlus className="w-4 h-4 mr-2" />Quick Add
              </Button>
            </div>
          )
        )}
      </div>

      <BottomNav />

      <QuickAddModal isOpen={showQuickAdd} onClose={() => setShowQuickAdd(false)} onSendRequest={handleSendFriendRequest} />
      <FriendRequestsModal isOpen={showFriendRequests} onClose={() => setShowFriendRequests(false)} />
    </div>
  );
}
