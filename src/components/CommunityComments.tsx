import { useState, useRef, useEffect } from 'react';
import { Send, Heart, MessageCircle, Lock } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { CommunityComment } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
    if (!isPaidUser) { setShowUpgradePrompt(true); return; }
    addCommunityComment(eventId, newMessage, replyTo || undefined);
    setNewMessage('');
    setReplyTo(null);
  };

  const handleReply = (commentId: string, userName: string) => {
    if (!isPaidUser) { setShowUpgradePrompt(true); return; }
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

  const rootComments = comments.filter((c) => !c.replyTo);
  const replyComments = comments.filter((c) => c.replyTo);
  const getCommentReplies = (commentId: string) => replyComments.filter((r) => r.replyTo === commentId);
  const onlineCount = Math.floor(Math.random() * 50) + 20;

  return (
    <div className="mb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[28px] font-bold text-foreground">Community Chat</h2>
        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-brand-pink/20">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-bold text-brand-pink">{onlineCount} here</span>
        </div>
      </div>

      {/* Chat Container */}
      <div className="overflow-hidden bg-card rounded-[24px] shadow-md border border-border">
        {/* Messages */}
        <div className="max-h-[400px] overflow-y-auto p-6 space-y-6 bg-card/95">
          {rootComments.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-[15px] text-muted-foreground">No messages yet. Start the conversation!</p>
            </motion.div>
          ) : (
            rootComments.map((comment) => (
              <motion.div key={comment.id} className="space-y-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <div className="flex gap-4">
                  <img src={comment.userPhoto || 'https://i.pravatar.cc/100'} alt={comment.userName} className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-[15px] text-foreground">{comment.userName}</span>
                      <span className="text-xs text-muted-foreground">{getRelativeTime(comment.timestamp)}</span>
                    </div>
                    <p className="text-[15px] break-words leading-relaxed text-muted-foreground">{comment.text}</p>
                    <div className="flex items-center gap-6 mt-4">
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => likeComment(comment.id)} className="flex items-center gap-2 text-muted-foreground">
                        <Heart className={cn('w-5 h-5 transition-colors', comment.isLiked && 'fill-brand-pink text-brand-pink')} />
                        <span className="text-[13px] font-medium">{comment.likes}</span>
                      </motion.button>
                      <button onClick={() => handleReply(comment.id, comment.userName)} className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-primary">Reply</button>
                    </div>
                  </div>
                </div>

                {getCommentReplies(comment.id).map((reply) => (
                  <motion.div key={reply.id} className="flex gap-4 ml-16 pl-6 border-l-2 border-primary/30" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                    <img src={reply.userPhoto || 'https://i.pravatar.cc/100'} alt={reply.userName} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-accent" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-sm text-foreground">{reply.userName}</span>
                        <span className="text-xs text-muted-foreground">{getRelativeTime(reply.timestamp)}</span>
                      </div>
                      <p className="text-sm break-words leading-relaxed text-muted-foreground">{reply.text}</p>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => likeComment(reply.id)} className="flex items-center gap-2 mt-3 text-muted-foreground">
                        <Heart className={cn('w-4 h-4 transition-colors', reply.isLiked && 'fill-brand-pink text-brand-pink')} />
                        <span className="text-xs font-medium">{reply.likes}</span>
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 flex gap-3 items-center border-t border-border bg-card">
          <div className="flex-1">
            <Input
              ref={inputRef}
              type="text"
              placeholder={replyTo ? 'Write a reply...' : 'Type a message...'}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="h-12 rounded-xl px-4 border-0 bg-background text-foreground text-[15px]"
            />
          </div>
          <motion.button
            type="submit"
            disabled={!newMessage.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50 shadow-md"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </form>
      </div>

      {/* Upgrade Prompt */}
      <Dialog open={showUpgradePrompt} onOpenChange={setShowUpgradePrompt}>
        <DialogContent className="p-0 border border-border rounded-[20px] max-w-[380px] mx-auto bg-card">
          <motion.div className="py-8 px-6 text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-foreground">Pro Feature</h2>
            <p className="text-[15px] mb-8 text-muted-foreground">Upgrade to Pro or Max to participate in community chat.</p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowUpgradePrompt(false)} className="w-full py-4 rounded-xl font-bold text-base bg-primary text-primary-foreground shadow-md">
              Upgrade Now
            </motion.button>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
