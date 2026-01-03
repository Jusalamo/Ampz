import { useState } from 'react';
import { MessageCircle, Search, MoreVertical, Send } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { Match, Message } from '@/lib/types';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

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

  return (
    <div className="app-container min-h-screen bg-background pb-nav">
      <div className="px-5 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Matches</h1>
            <p className="text-muted-foreground text-sm">{matches.length} connections</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search matches..."
            className="h-12 pl-12 bg-card border-border"
          />
        </div>

        {/* Matches List */}
        {matches.length > 0 ? (
          <div className="space-y-3">
            {matches.map((match) => (
              <button
                key={match.id}
                onClick={() => setSelectedMatch(match)}
                className="w-full glass-card p-4 flex items-center gap-4 hover:border-primary transition-all text-left"
              >
                <div className="relative">
                  <img
                    src={match.matchProfile.photo}
                    alt={match.matchProfile.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  {match.online && (
                    <span className="absolute bottom-0 right-0 w-4 h-4 bg-brand-green rounded-full border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{match.matchProfile.name}</h3>
                    <span className="text-xs text-muted-foreground">{match.lastMessageTime}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{match.lastMessage || 'New match! Say hi 👋'}</p>
                  <span className="text-xs text-primary mt-1 inline-block">{match.eventName}</span>
                </div>
                {match.unread && (
                  <span className="w-3 h-3 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Matches Yet</h3>
            <p className="text-muted-foreground text-sm">
              Check in at events and start swiping to connect!
            </p>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent className="bg-background border-border max-w-app h-[80vh] p-0 flex flex-col">
          {selectedMatch && (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-4 p-4 border-b border-border">
                <img
                  src={selectedMatch.matchProfile.photo}
                  alt={selectedMatch.matchProfile.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedMatch.matchProfile.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedMatch.online ? 'Online' : 'Offline'}
                  </p>
                </div>
                <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'max-w-[80%]',
                      message.senderId === 'me' ? 'ml-auto' : 'mr-auto'
                    )}
                  >
                    <div
                      className={cn(
                        'px-4 py-3 rounded-2xl',
                        message.senderId === 'me'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-card rounded-bl-md'
                      )}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-border flex gap-3">
                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 h-12 bg-card border-border"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-12 h-12 rounded-xl gradient-pro flex items-center justify-center disabled:opacity-50"
                >
                  <Send className="w-5 h-5 text-foreground" />
                </button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
