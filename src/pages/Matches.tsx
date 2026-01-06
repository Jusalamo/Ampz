import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { 
  MessageCircle, 
  Search, 
  MoreVertical, 
  Send, 
  Image, 
  Smile, 
  Mic, 
  Video, 
  Phone, 
  Info, 
  ArrowLeft,
  Camera,
  Paperclip,
  X,
  Check,
  CheckCheck,
  Clock,
  UserPlus,
  Users,
  Filter,
  SortAsc,
  Menu,
  Sparkles,
  MapPin
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { Match, Message } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function Matches() {
  const { matches } = useApp();
  const { toast } = useToast();
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
    {
      id: '2',
      chatId: 'match-1',
      senderId: 'me',
      text: 'Thanks! You were amazing too! Let\'s jam again soon?',
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
    {
      id: '4',
      chatId: 'match-1',
      senderId: 'other',
      text: 'Here\'s the venue location I was thinking about',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      read: true,
      type: 'location',
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'messages' | 'requests'>('messages');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const filteredMatches = matches.filter(match =>
    match.matchProfile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.eventName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Simulate typing indicator
  useEffect(() => {
    if (selectedMatch && Math.random() > 0.7) {
      const typingTimeout = setTimeout(() => {
        setIsTyping(true);
        const stopTypingTimeout = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
        return () => clearTimeout(stopTypingTimeout);
      }, 3000);
      return () => clearTimeout(typingTimeout);
    }
  }, [selectedMatch, messages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const handleFileUpload = (type: 'image' | 'video' | 'audio') => {
    const input = type === 'image' ? fileInputRef : type === 'video' ? videoInputRef : audioInputRef;
    input.current?.click();
  };

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

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isYesterday = (dateString: string) => {
    const date = new Date(dateString);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.getDate() === yesterday.getDate() &&
           date.getMonth() === yesterday.getMonth() &&
           date.getFullYear() === yesterday.getFullYear();
  };

  const getMessageDate = (dateString: string) => {
    if (isToday(dateString)) return 'Today';
    if (isYesterday(dateString)) return 'Yesterday';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', 'day': 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = getMessageDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  const clearChat = () => {
    if (selectedMatch && window.confirm('Are you sure you want to clear this chat?')) {
      setMessages([]);
      toast({
        title: 'Chat cleared',
        description: 'All messages have been cleared',
      });
      setShowMoreOptions(false);
    }
  };

  const unmatchUser = () => {
    if (selectedMatch && window.confirm(`Are you sure you want to unmatch with ${selectedMatch.matchProfile.name}?`)) {
      toast({
        title: 'Unmatched',
        description: `You have unmatched with ${selectedMatch.matchProfile.name}`,
      });
      setSelectedMatch(null);
      setShowMoreOptions(false);
    }
  };

  const blockUser = () => {
    if (selectedMatch && window.confirm(`Are you sure you want to block ${selectedMatch.matchProfile.name}?`)) {
      toast({
        title: 'User blocked',
        description: `${selectedMatch.matchProfile.name} has been blocked`,
      });
      setSelectedMatch(null);
      setShowMoreOptions(false);
    }
  };

  const markAsRead = () => {
    setMessages(prev => prev.map(msg => ({ ...msg, read: true })));
    toast({
      title: 'Marked as read',
      description: 'All messages have been marked as read',
    });
    setShowMoreOptions(false);
  };

  return (
    <div className="app-container min-h-screen bg-background pb-nav">
      {/* Main Layout */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Matches List Sidebar */}
        <div className={cn(
          "w-full md:w-96 border-r border-border bg-background transition-all duration-300",
          selectedMatch ? "hidden md:block" : "block"
        )}>
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Messages</h1>
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors">
                  <Filter className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors">
                  <SortAsc className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                  <UserPlus className="w-5 h-5 text-primary" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4">
              <button
                onClick={() => setActiveTab('messages')}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                  activeTab === 'messages' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-card hover:bg-card/80"
                )}
              >
                <div className="flex items-center justify-center">
                  Messages
                  {matches.filter(m => m.unread).length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                      {matches.filter(m => m.unread).length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                  activeTab === 'requests' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-card hover:bg-card/80"
                )}
              >
                <div className="flex items-center justify-center">
                  Requests
                  <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">3</span>
                </div>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-10 bg-card border-border rounded-lg"
              />
            </div>
          </div>

          {/* Matches List */}
          <div className="overflow-y-auto h-[calc(100vh-200px)]">
            {activeTab === 'messages' ? (
              <>
                {filteredMatches.length > 0 ? (
                  <div className="divide-y divide-border">
                    {filteredMatches.map((match) => (
                      <button
                        key={match.id}
                        onClick={() => setSelectedMatch(match)}
                        className={cn(
                          "w-full p-4 flex items-center gap-4 hover:bg-card/50 transition-all text-left",
                          selectedMatch?.id === match.id && "bg-primary/5"
                        )}
                      >
                        <div className="relative">
                          <img
                            src={match.matchProfile.photo}
                            alt={match.matchProfile.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-background"
                          />
                          {match.online && (
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
                            <span className="text-xs text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                              {match.eventName}
                            </span>
                            {match.unread && (
                              <span className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 px-4">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No Matches Yet</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      Check in at events and start swiping to connect!
                    </p>
                    <Button className="gradient-pro glow-purple rounded-lg">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Browse Events
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4">
                <h3 className="font-semibold mb-4">Connection Requests</h3>
                <div className="space-y-3">
                  {/* Request items would go here */}
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No pending requests</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedMatch ? (
          <div className="flex-1 flex flex-col bg-background">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="md:hidden w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors"
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
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-brand-green rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedMatch.matchProfile.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedMatch.online ? 'Online' : `Last seen ${formatTime(selectedMatch.lastMessageTime)}`}
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
                <div className="relative">
                  <button 
                    onClick={() => setShowMoreOptions(!showMoreOptions)}
                    className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  {/* More Options Dropdown */}
                  {showMoreOptions && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-10 py-2">
                      <button 
                        onClick={markAsRead}
                        className="w-full px-4 py-3 text-left hover:bg-card/50 text-sm flex items-center gap-3"
                      >
                        <CheckCheck className="w-4 h-4" />
                        Mark as read
                      </button>
                      <button 
                        onClick={clearChat}
                        className="w-full px-4 py-3 text-left hover:bg-card/50 text-sm flex items-center gap-3"
                      >
                        <X className="w-4 h-4" />
                        Clear chat
                      </button>
                      <div className="border-t border-border my-1" />
                      <button 
                        onClick={unmatchUser}
                        className="w-full px-4 py-3 text-left hover:bg-card/50 text-sm flex items-center gap-3 text-red-500"
                      >
                        <UserPlus className="w-4 h-4 rotate-45" />
                        Unmatch
                      </button>
                      <button 
                        onClick={blockUser}
                        className="w-full px-4 py-3 text-left hover:bg-card/50 text-sm flex items-center gap-3 text-red-500"
                      >
                        <X className="w-4 h-4" />
                        Block
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4">
              {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                <div key={date} className="mb-6">
                  {/* Date Separator */}
                  <div className="flex items-center justify-center my-4">
                    <div className="px-4 py-1 bg-card rounded-full text-xs text-muted-foreground">
                      {date}
                    </div>
                  </div>

                  {/* Messages for this date */}
                  <div className="space-y-3">
                    {dateMessages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          'flex',
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
                            {message.type === 'text' ? (
                              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                            ) : message.type === 'location' ? (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm">Venue Location</span>
                              </div>
                            ) : null}
                          </div>
                          
                          {/* Message Status and Time */}
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
                    ))}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && selectedMatch && (
                <div className="flex justify-start">
                  <div className="bg-card rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-150" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-300" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
              <div className="flex items-center gap-2">
                {/* Attachment Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => handleFileUpload('image')}
                    className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        toast({
                          title: 'Image uploaded',
                          description: 'Image ready to send',
                        });
                      }
                    }}
                  />
                </div>

                {/* Camera Button */}
                <button
                  type="button"
                  className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                </button>

                {/* Message Input */}
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="Message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="h-12 pl-4 pr-12 bg-card border-border rounded-full"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full hover:bg-card/50 flex items-center justify-center"
                  >
                    <Smile className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {/* Send/Voice Button */}
                {newMessage.trim() ? (
                  <button
                    type="submit"
                    className="w-12 h-12 rounded-full gradient-pro flex items-center justify-center hover:opacity-90 transition-opacity"
                  >
                    <Send className="w-5 h-5 text-white" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <Mic className="w-5 h-5 text-primary" />
                  </button>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-2">
                <button
                  type="button"
                  className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium flex items-center gap-1 whitespace-nowrap"
                >
                  <Video className="w-3 h-3" />
                  Video call
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 bg-card text-foreground rounded-full text-xs font-medium flex items-center gap-1 whitespace-nowrap"
                >
                  <Image className="w-3 h-3" />
                  Photo
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 bg-card text-foreground rounded-full text-xs font-medium flex items-center gap-1 whitespace-nowrap"
                >
                  <Paperclip className="w-3 h-3" />
                  File
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 bg-card text-foreground rounded-full text-xs font-medium flex items-center gap-1 whitespace-nowrap"
                >
                  <MapPin className="w-3 h-3" />
                  Location
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
              Select a conversation from the list to start chatting, 
              or connect with new people at events!
            </p>
            <div className="flex gap-3">
              <Button className="rounded-lg bg-card hover:bg-card/80">
                <Users className="w-4 h-4 mr-2" />
                Browse Events
              </Button>
              <Button className="rounded-lg gradient-pro glow-purple">
                <Sparkles className="w-4 h-4 mr-2" />
                Find Matches
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" />
      <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" />

      <BottomNav />
    </div>
  );
}
