import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Send, ArrowLeft, X, Check, CheckCheck, UserPlus, Users, Heart,
  Sparkles, UserCheck, MoreVertical, Camera, Smile,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useFriends } from '@/hooks/useFriends';
import { useMessages } from '@/hooks/useMessages';
import { BottomNav } from '@/components/BottomNav';
import { Match } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';

type Tab = 'matches' | 'friends';

const DEFAULT_AVATAR = '/default-avatar.png';

// ---------------- Quick Add Modal ----------------
function QuickAddModal({
  isOpen,
  onClose,
  userId,
}: {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}) {
  const { searchUsers, sendFriendRequest } = useFriends(userId);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Array<{ id: string; name: string; photo: string; bio: string }>>([]);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    const t = setTimeout(async () => {
      const found = await searchUsers(searchQuery.trim());
      setResults(found.map(u => ({ id: u.id, name: u.name, photo: u.photo, bio: u.bio })));
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, searchUsers]);

  const handleAdd = async (targetId: string) => {
    setSendingId(targetId);
    const ok = await sendFriendRequest(targetId);
    setSendingId(null);
    if (ok) {
      setResults(prev => prev.filter(r => r.id !== targetId));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background border-border rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-foreground">
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
            className="pl-10 rounded-full"
            autoFocus
          />
        </div>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {isSearching && (
            <>
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-40" />
                  </div>
                </div>
              ))}
            </>
          )}

          {!isSearching && searchQuery.length >= 2 && results.length === 0 && (
            <p className="text-sm text-center py-6 text-muted-foreground">No users found</p>
          )}

          {!isSearching && searchQuery.length < 2 && (
            <p className="text-sm text-center py-6 text-muted-foreground">
              Type at least 2 characters to search
            </p>
          )}

          {!isSearching && results.map(user => (
            <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg bg-card">
              <img
                src={user.photo || DEFAULT_AVATAR}
                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{user.name}</p>
                {user.bio && <p className="text-xs text-muted-foreground truncate">{user.bio}</p>}
              </div>
              <Button
                size="sm"
                disabled={sendingId === user.id}
                onClick={() => handleAdd(user.id)}
              >
                {sendingId === user.id ? '...' : (<><UserPlus className="w-4 h-4 mr-1" /> Add</>)}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Friend Requests Modal ----------------
function FriendRequestsModal({
  isOpen,
  onClose,
  userId,
}: {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}) {
  const { receivedRequests, sentRequests, acceptFriendRequest, declineFriendRequest, cancelFriendRequest, isLoading } = useFriends(userId);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleAccept = async (id: string) => {
    setBusyId(id);
    await acceptFriendRequest(id);
    setBusyId(null);
  };
  const handleDecline = async (id: string) => {
    setBusyId(id);
    await declineFriendRequest(id);
    setBusyId(null);
  };
  const handleCancel = async (id: string) => {
    setBusyId(id);
    await cancelFriendRequest(id);
    setBusyId(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[80vh] bg-background border-border rounded-lg flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-foreground">
            <UserCheck className="w-5 h-5 text-primary" />
            Friend Requests
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setActiveTab('received')}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-full transition-colors',
              activeTab === 'received' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'
            )}
          >
            Received {receivedRequests.length > 0 && `(${receivedRequests.length})`}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-full transition-colors',
              activeTab === 'sent' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'
            )}
          >
            Sent {sentRequests.length > 0 && `(${sentRequests.length})`}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2 w-24" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && activeTab === 'received' && (
            receivedRequests.length > 0 ? (
              <div className="space-y-3">
                {receivedRequests.map(r => (
                  <div key={r.id} className="flex items-center gap-3 p-4 bg-card rounded-lg">
                    <img
                      src={r.senderPhoto || DEFAULT_AVATAR}
                      onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                      alt={r.senderName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{r.senderName}</p>
                      {r.senderBio && <p className="text-xs text-muted-foreground truncate">{r.senderBio}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm" variant="outline"
                        className="h-9 w-9 p-0 rounded-full"
                        disabled={busyId === r.id}
                        onClick={() => handleDecline(r.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="h-9 w-9 p-0 rounded-full"
                        disabled={busyId === r.id}
                        onClick={() => handleAccept(r.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-primary/10">
                  <UserCheck className="w-10 h-10 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">No friend requests</p>
              </div>
            )
          )}

          {!isLoading && activeTab === 'sent' && (
            sentRequests.length > 0 ? (
              <div className="space-y-3">
                {sentRequests.map(r => (
                  <div key={r.id} className="flex items-center gap-3 p-4 bg-card rounded-lg">
                    <img
                      src={r.senderPhoto || DEFAULT_AVATAR}
                      onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                      alt={r.senderName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{r.senderName}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                    <Button
                      size="sm" variant="outline"
                      disabled={busyId === r.id}
                      onClick={() => handleCancel(r.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">No sent requests</p>
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Conversation View ----------------
function ConversationView({
  match,
  userId,
  onBack,
}: {
  match: Match;
  userId?: string;
  onBack: () => void;
}) {
  const { messages, isLoading, isSending, sendMessage } = useMessages(match.id, userId);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || isSending) return;
    setNewMessage('');
    await sendMessage(text);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) handleSend(e as any);
  };

  return (
    <div className="app-container min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-background border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-card bg-card"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <img
              src={match.matchProfile?.photo || DEFAULT_AVATAR}
              onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
              alt={match.matchProfile?.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h3 className="font-semibold text-[15px] text-foreground">
                {match.matchProfile?.name || 'Unknown'}
              </h3>
              <p className="text-xs text-muted-foreground">{match.eventName}</p>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full flex items-center justify-center bg-card">
            <MoreVertical className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className={cn('h-10 rounded-lg', i % 2 ? 'w-1/2' : 'w-2/3 ml-auto')} />
            ))}
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-primary/10">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Say hi to start the conversation</p>
          </div>
        )}

        {messages.map((m) => {
          const isMe = m.senderId === userId;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex', isMe ? 'justify-end' : 'justify-start')}
            >
              <div className={cn(
                'max-w-[75%] px-4 py-2.5 rounded-2xl',
                isMe ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-card text-foreground'
              )}>
                <p className="text-sm break-words">{m.content}</p>
                <div className={cn('flex items-center gap-1 mt-1', isMe ? 'justify-end' : 'justify-start')}>
                  <span className="text-[10px] opacity-70">
                    {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && (m.isRead
                    ? <CheckCheck className="w-3 h-3 opacity-70" />
                    : <Check className="w-3 h-3 opacity-70" />)}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 p-4 border-t bg-background border-border pb-safe">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <button type="button" className="w-10 h-10 rounded-full flex items-center justify-center bg-card">
            <Camera className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex-1 relative">
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKey}
              placeholder="Type a message..."
              className="pr-10 h-11 rounded-full"
              disabled={isSending}
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Smile className="w-5 h-5" />
            </button>
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all',
              newMessage.trim() && !isSending
                ? 'bg-primary text-primary-foreground shadow-lg'
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

// ---------------- Main Chats Page ----------------
export default function Chats() {
  const navigate = useNavigate();
  const { matches = [], user } = useApp();
  const userId = user?.id;
  const { receivedRequests, friends } = useFriends(userId);

  const [activeTab, setActiveTab] = useState<Tab>('matches');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const filteredMatches = matches.filter(match =>
    match?.matchProfile?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match?.eventName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadMatchesCount = matches.filter(m => m?.unread).length;
  const friendRequestsCount = receivedRequests.length;

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

  if (selectedMatch) {
    return <ConversationView match={selectedMatch} userId={userId} onBack={() => setSelectedMatch(null)} />;
  }

  return (
    <div className="app-container min-h-screen flex flex-col pb-20 bg-background">
      <header className="sticky top-0 z-30 border-b bg-background border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Messages</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFriendRequests(true)}
              className="relative w-10 h-10 rounded-full flex items-center justify-center bg-card"
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
              className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-primary-foreground"
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
              className="pl-10 h-10 rounded-full"
            />
          </div>
        </div>

        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('matches')}
            className={cn(
              'flex-1 py-3 text-sm font-medium relative',
              activeTab === 'matches' ? 'text-primary' : 'text-muted-foreground'
            )}
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
            {activeTab === 'matches' && (
              <motion.div layoutId="tabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={cn(
              'flex-1 py-3 text-sm font-medium relative',
              activeTab === 'friends' ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              Friends
              {friends.length > 0 && (
                <span className="text-xs text-muted-foreground">({friends.length})</span>
              )}
            </div>
            {activeTab === 'friends' && (
              <motion.div layoutId="tabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'matches' ? (
          filteredMatches.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredMatches.map((match) => (
                <button
                  key={match.id}
                  onClick={() => setSelectedMatch(match)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-card/50 text-left transition-colors"
                >
                  <img
                    src={match.matchProfile?.photo || DEFAULT_AVATAR}
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                    alt={match.matchProfile?.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {match.matchProfile?.name || 'Unknown'}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(match.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm truncate text-muted-foreground">
                      {match.lastMessage || 'Start a conversation!'}
                    </p>
                    {match.eventName && (
                      <p className="text-xs mt-1 text-primary truncate">{match.eventName}</p>
                    )}
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
              <h3 className="text-lg font-semibold mb-2 text-foreground">No connections yet</h3>
              <p className="text-sm text-muted-foreground">Start connecting at events.</p>
              <Button onClick={() => navigate('/connect')} className="mt-4">
                <Sparkles className="w-4 h-4 mr-2" />
                Start Connecting
              </Button>
            </div>
          )
        ) : (
          friends.length > 0 ? (
            <div className="divide-y divide-border">
              {friends.map(f => (
                <div key={f.id} className="flex items-center gap-3 p-4">
                  <img
                    src={f.friendPhoto || DEFAULT_AVATAR}
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                    alt={f.friendName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{f.friendName}</p>
                    {f.friendBio && <p className="text-xs text-muted-foreground truncate">{f.friendBio}</p>}
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
              <p className="text-sm text-muted-foreground">Search and add friends to start chatting.</p>
              <Button onClick={() => setShowQuickAdd(true)} className="mt-4">
                <UserPlus className="w-4 h-4 mr-2" />
                Quick Add
              </Button>
            </div>
          )
        )}
      </div>

      <BottomNav />

      <QuickAddModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        userId={userId}
      />
      <FriendRequestsModal
        isOpen={showFriendRequests}
        onClose={() => setShowFriendRequests(false)}
        userId={userId}
      />
    </div>
  );
}
