import { useState, useRef, useEffect } from 'react';
import { Send, Heart, MessageCircle, Lock } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { CommunityComment } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface CommunityCommentsProps {
  eventId: string;
  comments: CommunityComment[];
}

export function CommunityComments({ eventId, comments }: CommunityCommentsProps) {
  const { user, addCommunityComment, likeComment } = useApp();
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isPaidUser = user?.subscription.tier === 'pro' || user?.subscription.tier === 'max';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (!isPaidUser) {
      setShowUpgradePrompt(true);
      return;
    }

    addCommunityComment(eventId, newMessage, replyTo || undefined);
    setNewMessage('');
    setReplyTo(null);
  };

  const handleReply = (commentId: string, userName: string) => {
    if (!isPaidUser) {
      setShowUpgradePrompt(true);
      return;
    }
    setReplyTo(commentId);
    setNewMessage(`@${userName} `);
    inputRef.current?.focus();
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Group comments by parent
  const rootComments = comments.filter((c) => !c.replyTo);
  const replyComments = comments.filter((c) => c.replyTo);

  const getCommentReplies = (commentId: string) =>
    replyComments.filter((r) => r.replyTo === commentId);

  const onlineCount = Math.floor(Math.random() * 50) + 20;

  return (
    <div className="mb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Community Chat</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
          {onlineCount} here
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="max-h-[400px] overflow-y-auto p-4 space-y-4">
          {rootComments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            rootComments.map((comment) => (
              <div key={comment.id} className="space-y-3">
                <div className="flex gap-3">
                  <img
                    src={comment.userPhoto || 'https://i.pravatar.cc/100'}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{comment.userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {getRelativeTime(comment.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm mt-1 break-words">{comment.text}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <button
                        onClick={() => likeComment(comment.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Heart
                          className={cn(
                            'w-4 h-4',
                            comment.isLiked && 'fill-brand-pink text-brand-pink'
                          )}
                        />
                        {comment.likes}
                      </button>
                      <button
                        onClick={() => handleReply(comment.id, comment.userName)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {getCommentReplies(comment.id).map((reply) => (
                  <div key={reply.id} className="flex gap-3 ml-12 pl-4 border-l border-border">
                    <img
                      src={reply.userPhoto || 'https://i.pravatar.cc/100'}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{reply.userName}</span>
                        <span className="text-xs text-muted-foreground">
                          {getRelativeTime(reply.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm mt-1 break-words">{reply.text}</p>
                      <button
                        onClick={() => likeComment(reply.id)}
                        className="flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Heart
                          className={cn(
                            'w-4 h-4',
                            reply.isLiked && 'fill-brand-pink text-brand-pink'
                          )}
                        />
                        {reply.likes}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-3">
          <Input
            ref={inputRef}
            type="text"
            placeholder={replyTo ? 'Write a reply...' : 'Type a message...'}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 h-12 bg-background-secondary border-border"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="w-12 h-12 rounded-xl gradient-pro flex items-center justify-center disabled:opacity-50"
          >
            <Send className="w-5 h-5 text-foreground" />
          </button>
        </form>
      </div>

      {/* Upgrade Prompt */}
      <Dialog open={showUpgradePrompt} onOpenChange={setShowUpgradePrompt}>
        <DialogContent className="bg-background border-border max-w-[350px] text-center">
          <div className="py-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Pro Feature</h2>
            <p className="text-muted-foreground mb-6">
              Upgrade to Pro or Max to participate in community chat.
            </p>
            <button
              onClick={() => setShowUpgradePrompt(false)}
              className="w-full py-3 rounded-xl gradient-pro font-semibold glow-purple"
            >
              Upgrade Now
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
