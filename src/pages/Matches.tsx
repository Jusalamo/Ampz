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
  ArrowLeft,
  Camera,
  Paperclip,
  X,
  Check,
  CheckCheck,
  UserPlus,
  Users,
  Filter,
  SortAsc,
  Sparkles,
  MapPin,
  Heart,
  User,
  Clock,
  ChevronRight,
  Plus
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { Match, Friend, Message } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { QuickAddModal } from '@/components/chats/QuickAddModal';
import { FriendRequestsModal } from '@/components/chats/FriendRequestsModal';

export default function Chats() {
  const { matches, friends } = useApp();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<Match | Friend | null>(null);
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
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'matches' | 'friends'>('matches');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [friendRequestCount] = useState(3); // Mock data
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filter based on active tab
  const filteredItems = activeTab === 'matches' 
    ? matches.filter(match =>
        match.matchProfile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.eventName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : friends.filter(friend =>
        friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Typing indicator simulation
  useEffect(() => {
    if (selectedConversation && Math.random() > 0.7) {
      const typingTimeout = setTimeout(() => {
        setIsTyping(true);
        const stopTypingTimeout = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
        return () => clearTimeout(stopTypingTimeout);
      }, 3000);
      return () => clearTimeout(typingTimeout);
    }
  }, [selectedConversation, messages]);

  // Scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

    // Simulate reply
    setTimeout(() => {
      const replies = activeTab === 'matches' 
        ? [
            'That sounds great! 😊',
            'Would love to catch up more!',
            'What are you doing this weekend?',
          ]
        : [
            'Hey! How was your day?',
            'Did you check out the new event?',
            'Want to meet up this weekend?',
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

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSendMessage(e);
    }
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

  const getMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
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
    if (selectedConversation && window.confirm('Are you sure you want to clear this chat?')) {
      setMessages([]);
      toast({
        title: 'Chat cleared',
        description: 'All messages have been cleared',
      });
      setShowMoreOptions(false);
    }
  };

  const removeConnection = () => {
    const name = 'matchProfile' in selectedConversation! 
      ? selectedConversation.matchProfile.name 
      : selectedConversation!.name;
    const action = activeTab === 'matches' ? 'unmatch' : 'remove friend';
    
    if (selectedConversation && window.confirm(`Are you sure you want to ${action} with ${name}?`)) {
      toast({
        title: activeTab === 'matches' ? 'Unmatched' : 'Friend removed',
        description: `You have ${action}ed with ${name}`,
      });
      setSelectedConversation(null);
      setShowMoreOptions(false);
    }
  };

  const blockUser = () => {
    const name = 'matchProfile' in selectedConversation! 
      ? selectedConversation.matchProfile.name 
      : selectedConversation!.name;
    
    if (selectedConversation && window.confirm(`Are you sure you want to block ${name}?`)) {
      toast({
        title: 'User blocked',
        description: `${name} has been blocked`,
      });
      setSelectedConversation(null);
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

  // Calculate unread counts
  const unreadMatchesCount = matches.filter(m => m.unread).length;

  return (
    <div className="app-container min-h-screen bg-background pb-nav">
      {/* Main Layout */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Chats List Sidebar */}
        <div className={cn(
          "w-full md:w-96 border-r border-border bg-background transition-all duration-300",
          selectedConversation ? "hidden md:block" : "block"
        )}>
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Chats</h1>
              <div className="flex items-center gap-2">
                <button 
                  className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors"
                  title="Filter conversations"
                >
                  <Filter className="w-5 h-5" />
                </button>
                <button 
                  className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors"
                  title="Sort conversations"
                >
                  <SortAsc className="w-5 h-5" />
                </button>
                {activeTab === 'friends' && (
                  <button 
                    onClick={() => setShowQuickAdd(true)}
                    className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                    title="Quick Add"
                  >
                    <Plus className="w-5 h-5 text-primary" />
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex mb-4 border-b border-border">
              <button
                onClick={() => setActiveTab('matches')}
                className={cn(
                  "flex-1 py-3 text-sm font-medium transition-all relative flex items-center justify-center gap-2",
                  activeTab === 'matches' 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Heart className={cn("w-4 h-4", activeTab === 'matches' && "fill-primary")} />
                Matches
                {unreadMatchesCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center">
                    {unreadMatchesCount}
                  </span>
                )}
                {activeTab === 'matches' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('friends')}
                className={cn(
                  "flex-1 py-3 text-sm font-medium transition-all relative flex items-center justify-center gap-2",
                  activeTab === 'friends' 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <User className={cn("w-4 h-4", activeTab === 'friends' && "fill-primary")} />
                Friends
                {friendRequestCount > 0 && (
                  <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center">
                    {friendRequestCount}
                  </span>
                )}
                {activeTab === 'friends' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-10 bg-card border-border rounded-lg"
              />
            </div>

            {/* Friend Requests Section (only in friends tab) */}
            {activeTab === 'friends' && friendRequestCount > 0 && (
              <div className="mt-4">
                <button 
                  onClick={() => setShowFriendRequests(true)}
                  className="w-full p-3 bg-card hover:bg-card/80 rounded-xl flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-sm">Friend Requests</h3>
                      <p className="text-xs text-muted-foreground">
                        {friendRequestCount} pending request{friendRequestCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </div>
            )}
          </div>

          {/* Conversations List */}
          <div className="overflow-y-auto h-[calc(100vh-200px)]">
            {filteredItems.length > 0 ? (
              <div className="divide-y divide-border">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedConversation(item)}
                    className={cn(
                      "w-full p-4 flex items-center gap-4 hover:bg-card/50 transition-all text-left",
                      selectedConversation?.id === item.id && "bg-primary/5"
                    )}
                  >
                    <div className="relative">
                      <img
                        src={'matchProfile' in item ? item.matchProfile.photo : item.photo}
                        alt={'matchProfile' in item ? item.matchProfile.name : item.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-background"
                      />
                      {item.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-brand-green rounded-full border-2 border-background" />
                      )}
                      {/* Event badge for matches */}
                      {'eventName' in item && item.eventName && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary/90 border-2 border-background flex items-center justify-center">
                          <span className="text-xs font-bold text-white">E</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm">
                          {'matchProfile' in item ? item.matchProfile.name : item.name}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(item.lastMessageTime)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mb-1">
                        {item.lastMessage || 'Say hi 👋'}
                      </p>
                      <div className="flex items-center justify-between">
                        {activeTab === 'matches' && 'eventName' in item ? (
                          <span className="text-xs text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                            {item.eventName}
                          </span>
                        ) : activeTab === 'friends' && 'mutualFriends' in item ? (
                          <span className="text-xs text-muted-foreground">
                            {item.mutualFriends} mutual friend{item.mutualFriends !== 1 ? 's' : ''}
                          </span>
                        ) : null}
                        <div className="flex items-center gap-1">
                          {item.unread && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                          )}
                          {'read' in item && item.read && (
                            <CheckCheck className="w-3 h-3 text-blue-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-4">
                {activeTab === 'matches' ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-10 h-10 text-blue-500" />
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
                      <Plus className="w-4 h-4 mr-2" />
                      Quick Add Friends
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
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
                    <img
                      src={'matchProfile' in selectedConversation ? selectedConversation.matchProfile.photo : selectedConversation.photo}
                      alt={'matchProfile' in selectedConversation ? selectedConversation.matchProfile.name : selectedConversation.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {selectedConversation.online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-brand-green rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {'matchProfile' in selectedConversation ? selectedConversation.matchProfile.name : selectedConversation.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.online ? 'Online' : `Active ${formatTime(selectedConversation.lastMessageTime)}`}
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
                    <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-lg z-10 py-2">
                      <button 
                        onClick={() => {/* View Profile */}}
                        className="w-full px-4 py-3 text-left hover:bg-card/50 text-sm flex items-center gap-3"
                      >
                        <User className="w-4 h-4" />
                        View Profile
                      </button>
                      {activeTab === 'matches' && (
                        <button 
                          onClick={() => {/* Set custom name */}}
                          className="w-full px-4 py-3 text-left hover:bg-card/50 text-sm flex items-center gap-3"
                        >
                          <span className="w-4 h-4 text-lg">🖊️</span>
                          Nicknames
                        </button>
                      )}
                      <div className="border-t border-border my-1" />
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
                        onClick={removeConnection}
                        className="w-full px-4 py-3 text-left hover:bg-card/50 text-sm flex items-center gap-3 text-amber-600"
                      >
                        <UserPlus className="w-4 h-4 rotate-45" />
                        {activeTab === 'matches' ? 'Unmatch' : 'Remove Friend'}
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
                            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
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
              {isTyping && selectedConversation && (
                <div className="flex justify-start">
                  <div className="bg-card rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-150" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-300" />
                      <span className="text-xs text-muted-foreground ml-2">
                        {'matchProfile' in selectedConversation ? selectedConversation.matchProfile.name : selectedConversation.name} is typing...
                      </span>
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
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        toast({
                          title: 'Media uploaded',
                          description: 'Ready to send',
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
                  onClick={() => {/* Share event */}}
                  className="px-3 py-1.5 bg-card text-foreground rounded-full text-xs font-medium flex items-center gap-1 whitespace-nowrap"
                >
                  <Sparkles className="w-3 h-3" />
                  Share Event
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
              {activeTab === 'matches' 
                ? 'Select a match to start chatting, or visit Connect to meet new people!'
                : 'Select a friend to chat, or add new friends to grow your network!'}
            </p>
            <div className="flex gap-3">
              <Button className="rounded-lg bg-card hover:bg-card/80">
                <Sparkles className="w-4 h-4 mr-2" />
                {activeTab === 'matches' ? 'Browse Events' : 'Find Friends'}
              </Button>
              <Button 
                onClick={() => activeTab === 'friends' && setShowQuickAdd(true)}
                className={cn(
                  "rounded-lg",
                  activeTab === 'matches' 
                    ? "gradient-pro glow-purple" 
                    : "bg-blue-500 hover:bg-blue-600"
                )}
              >
                <Plus className="w-4 h-4 mr-2" />
                {activeTab === 'matches' ? 'Find Matches' : 'Add Friend'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <QuickAddModal 
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
      />
      <FriendRequestsModal 
        isOpen={showFriendRequests}
        onClose={() => setShowFriendRequests(false)}
        requestCount={friendRequestCount}
      />

      <BottomNav />
    </div>
  );
}
