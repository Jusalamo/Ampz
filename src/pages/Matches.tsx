import { useState } from 'react';
import { MessageCircle, Search, MoreVertical, Send, Users, UserPlus, Calendar, MapPin, SwipeRight, Filter } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { Match, Message } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock friends data
const mockFriends = [
  {
    id: 'friend-1',
    name: 'Alex Johnson',
    photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
    mutualEvents: 3,
    online: true,
    lastActive: '2 min ago',
  },
  {
    id: 'friend-2',
    name: 'Sam Wilson',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w-400',
    mutualEvents: 5,
    online: false,
    lastActive: '1 hour ago',
  },
  {
    id: 'friend-3',
    name: 'Taylor Swift',
    photo: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400',
    mutualEvents: 2,
    online: true,
    lastActive: 'Now',
  },
];

export default function Matches() {
  const { matches } = useApp();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
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
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [view, setView] = useState<'matches' | 'friends'>('matches');
  const [showEmptyState, setShowEmptyState] = useState(matches.length === 0);
  const [searchQuery, setSearchQuery] = useState('');

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

    // Simulate reply after 2 seconds
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
      setMessages((prev) => [...prev, reply]);
    }, 2000);
  };

  // Filter matches based on search
  const filteredMatches = matches.filter(match =>
    match.matchProfile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.eventName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter friends based on search
  const filteredFriends = mockFriends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-container min-h-screen bg-background pb-nav">
      <div className="px-5 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Connections</h1>
            <p className="text-muted-foreground text-sm">
              {view === 'matches' ? `${matches.length} matches` : `${mockFriends.length} friends`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
              <Filter className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <Tabs value={view} onValueChange={(value) => setView(value as 'matches' | 'friends')} className="w-full mb-6">
          <TabsList className="grid grid-cols-2 w-full bg-card p-1 rounded-xl">
            <TabsTrigger value="matches" className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageCircle className="w-4 h-4" />
              Matches
            </TabsTrigger>
            <TabsTrigger value="friends" className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4" />
              Friends
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={view === 'matches' ? "Search matches..." : "Search friends..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-12 bg-card border-border rounded-xl"
          />
        </div>

        {/* Empty State - Check-in Required */}
        {showEmptyState && view === 'matches' && (
          <div className="glass-card rounded-2xl p-6 mb-6 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Check In to Connect</h3>
            <p className="text-muted-foreground mb-6">
              You need to check into an event first to see potential matches and start connecting with attendees
            </p>
            <div className="flex flex-col gap-3">
              <Button className="w-full rounded-xl h-12 gradient-pro">
                <Calendar className="w-5 h-5 mr-2" />
                Browse Events
              </Button>
              <Button variant="outline" className="w-full rounded-xl h-12" onClick={() => setShowEmptyState(false)}>
                <SwipeRight className="w-5 h-5 mr-2" />
                View Demo Matches
              </Button>
            </div>
          </div>
        )}

        {/* Matches List */}
        {view === 'matches' && !showEmptyState ? (
          filteredMatches.length > 0 ? (
            <div className="space-y-3">
              {filteredMatches.map((match) => (
                <button
                  key={match.id}
                  onClick={() => setSelectedMatch(match)}
                  className="w-full glass-card p-4 flex items-center gap-4 hover:border-primary transition-all text-left rounded-xl active:scale-[0.99]"
                >
                  <div className="relative">
                    <img
                      src={match.matchProfile.photo}
                      alt={match.matchProfile.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                    />
                    {match.online && (
                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-brand-green rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">{match.matchProfile.name}</h3>
                      <span className="text-xs text-muted-foreground">{match.lastMessageTime}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{match.lastMessage || 'New match! Say hi 👋'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-primary px-2 py-1 bg-primary/10 rounded-full">
                        {match.eventName}
                      </span>
                      {match.interests?.slice(0, 2).map(interest => (
                        <span key={interest} className="text-xs text-muted-foreground px-2 py-1 bg-card rounded-full">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                  {match.unread && (
                    <span className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 rounded-full bg-card flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">No Matches Found</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                {searchQuery ? `No matches found for "${searchQuery}"` : 'Check into events and start swiping to make connections!'}
              </p>
              {!searchQuery && (
                <Button className="rounded-xl h-12 px-6 gradient-pro">
                  <SwipeRight className="w-5 h-5 mr-2" />
                  Start Swiping
                </Button>
              )}
            </div>
          )
        ) : view === 'friends' ? (
          filteredFriends.length > 0 ? (
            <div className="space-y-3">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="w-full glass-card p-4 flex items-center gap-4 text-left rounded-xl"
                >
                  <div className="relative">
                    <img
                      src={friend.photo}
                      alt={friend.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                    />
                    {friend.online && (
                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-brand-green rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">{friend.name}</h3>
                      <span className="text-xs text-muted-foreground">
                        {friend.online ? 'Online' : friend.lastActive}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {friend.mutualEvents} mutual events
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="rounded-lg h-9">
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button size="sm" className="rounded-lg h-9">
                      Invite
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 rounded-full bg-card flex items-center justify-center mx-auto mb-6">
                <Users className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">No Friends Found</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                {searchQuery ? `No friends found for "${searchQuery}"` : 'Connect with friends to see them here!'}
              </p>
              {!searchQuery && (
                <div className="flex flex-col gap-3 max-w-xs mx-auto">
                  <Button className="rounded-xl h-12 gradient-pro">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Find Friends
                  </Button>
                  <Button variant="outline" className="rounded-xl h-12">
                    <Send className="w-5 h-5 mr-2" />
                    Invite Contacts
                  </Button>
                </div>
              )}
            </div>
          )
        ) : null}
      </div>

      {/* Chat Modal */}
      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent className="bg-background border-border max-w-app h-[85vh] p-0 flex flex-col rounded-2xl overflow-hidden">
          {selectedMatch && (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-4 p-5 border-b border-border bg-card/50">
                <img
                  src={selectedMatch.matchProfile.photo}
                  alt={selectedMatch.matchProfile.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedMatch.matchProfile.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${selectedMatch.online ? 'bg-brand-green' : 'bg-gray-400'}`} />
                    {selectedMatch.online ? 'Online' : 'Last seen recently'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="w-10 h-10 rounded-full bg-card hover:bg-card/80 flex items-center justify-center transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-background to-card/30">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-card rounded-full">
                    <div className="w-2 h-2 rounded-full bg-brand-green" />
                    <span className="text-xs text-muted-foreground">Connected at {selectedMatch.eventName}</span>
                  </div>
                </div>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'max-w-[85%] animate-fade-in',
                      message.senderId === 'me' ? 'ml-auto' : 'mr-auto'
                    )}
                  >
                    <div
                      className={cn(
                        'px-4 py-3 rounded-2xl',
                        message.senderId === 'me'
                          ? 'bg-primary text-primary-foreground rounded-br-lg shadow-sm'
                          : 'bg-card border border-border rounded-bl-lg shadow-sm'
                      )}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                    <span className={cn(
                      'text-xs text-muted-foreground mt-1 block',
                      message.senderId === 'me' ? 'text-right' : 'text-left'
                    )}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card/30">
                <div className="flex gap-3">
                  <Input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 h-12 bg-card border-border rounded-xl focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                      newMessage.trim() 
                        ? "gradient-pro shadow-lg" 
                        : "bg-card border border-border"
                    )}
                  >
                    <Send className={cn(
                      "w-5 h-5",
                      newMessage.trim() ? "text-white" : "text-muted-foreground"
                    )} />
                  </button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
