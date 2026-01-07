import { useState, useRef, useEffect } from 'react';
import { Send, Heart, MessageCircle, Lock } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { CommunityComment } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Design Constants matching the Connect screen
const DESIGN = {
  colors: {
    primary: '#C4B5FD',
    lavenderLight: '#E9D5FF',
    accentPink: '#FFB8E6',
    background: '#1A1A1A',
    card: '#2D2D2D',
    textPrimary: '#FFFFFF',
    textSecondary: '#B8B8B8',
    border: '#4A4A4A',
    success: '#10B981'
  },
  borderRadius: {
    card: '24px',
    inner: '20px',
    button: '12px',
    pill: '9999px',
    small: '8px'
  },
  shadows: {
    card: '0 8px 32px rgba(0, 0, 0, 0.4)',
    glow: '0 4px 16px rgba(196, 181, 253, 0.4)'
  },
  spacing: {
    section: '24px',
    element: '16px',
    small: '8px',
    inputHeight: '48px'
  }
};

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
      {/* Header with online count */}
      <div className="flex items-center justify-between mb-6">
        <h2 
          className="text-[28px] font-bold"
          style={{ color: DESIGN.colors.textPrimary }}
        >
          Community Chat
        </h2>
        <div 
          className="flex items-center gap-3 px-4 py-2 rounded-full"
          style={{ 
            background: `${DESIGN.colors.accentPink}20`,
            borderRadius: DESIGN.borderRadius.pill
          }}
        >
          <div 
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ background: DESIGN.colors.success }}
          />
          <span 
            className="text-[14px] font-bold"
            style={{ color: DESIGN.colors.accentPink }}
          >
            {onlineCount} here
          </span>
        </div>
      </div>

      {/* Chat Container */}
      <div 
        className="overflow-hidden"
        style={{
          background: DESIGN.colors.card,
          borderRadius: DESIGN.borderRadius.card,
          boxShadow: DESIGN.shadows.card,
          border: `1px solid ${DESIGN.colors.border}`
        }}
      >
        {/* Messages Area */}
        <div 
          className="max-h-[400px] overflow-y-auto p-6 space-y-6"
          style={{ background: 'rgba(45, 45, 45, 0.95)' }}
        >
          {rootComments.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <MessageCircle 
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: DESIGN.colors.textSecondary, opacity: 0.5 }}
              />
              <p 
                className="text-[15px]"
                style={{ color: DESIGN.colors.textSecondary }}
              >
                No messages yet. Start the conversation!
              </p>
            </motion.div>
          ) : (
            rootComments.map((comment) => (
              <motion.div 
                key={comment.id} 
                className="space-y-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Main Comment */}
                <div className="flex gap-4">
                  <img
                    src={comment.userPhoto || 'https://i.pravatar.cc/100'}
                    alt={comment.userName}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2"
                    style={{ borderColor: DESIGN.colors.primary }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span 
                        className="font-bold text-[15px]"
                        style={{ color: DESIGN.colors.textPrimary }}
                      >
                        {comment.userName}
                      </span>
                      <span 
                        className="text-[12px]"
                        style={{ color: DESIGN.colors.textSecondary }}
                      >
                        {getRelativeTime(comment.timestamp)}
                      </span>
                    </div>
                    <p 
                      className="text-[15px] break-words leading-relaxed"
                      style={{ color: DESIGN.colors.textSecondary }}
                    >
                      {comment.text}
                    </p>
                    <div className="flex items-center gap-6 mt-4">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => likeComment(comment.id)}
                        className="flex items-center gap-2"
                        style={{ color: DESIGN.colors.textSecondary }}
                      >
                        <Heart
                          className={cn(
                            'w-5 h-5 transition-colors',
                            comment.isLiked && 'fill-brand-pink text-brand-pink'
                          )}
                        />
                        <span className="text-[13px] font-medium">
                          {comment.likes}
                        </span>
                      </motion.button>
                      <button
                        onClick={() => handleReply(comment.id, comment.userName)}
                        className="text-[13px] font-medium transition-colors hover:text-primary"
                        style={{ color: DESIGN.colors.textSecondary }}
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {getCommentReplies(comment.id).map((reply) => (
                  <motion.div 
                    key={reply.id} 
                    className="flex gap-4 ml-16 pl-6"
                    style={{ 
                      borderLeft: `2px solid ${DESIGN.colors.primary}30`,
                      borderRadius: '0 0 0 8px'
                    }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <img
                      src={reply.userPhoto || 'https://i.pravatar.cc/100'}
                      alt={reply.userName}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0 border"
                      style={{ borderColor: DESIGN.colors.lavenderLight }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span 
                          className="font-semibold text-[14px]"
                          style={{ color: DESIGN.colors.textPrimary }}
                        >
                          {reply.userName}
                        </span>
                        <span 
                          className="text-[12px]"
                          style={{ color: DESIGN.colors.textSecondary }}
                        >
                          {getRelativeTime(reply.timestamp)}
                        </span>
                      </div>
                      <p 
                        className="text-[14px] break-words leading-relaxed"
                        style={{ color: DESIGN.colors.textSecondary }}
                      >
                        {reply.text}
                      </p>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => likeComment(reply.id)}
                        className="flex items-center gap-2 mt-3"
                        style={{ color: DESIGN.colors.textSecondary }}
                      >
                        <Heart
                          className={cn(
                            'w-4 h-4 transition-colors',
                            reply.isLiked && 'fill-brand-pink text-brand-pink'
                          )}
                        />
                        <span className="text-[12px] font-medium">
                          {reply.likes}
                        </span>
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form 
          onSubmit={handleSend} 
          className="p-4 flex gap-3 items-center"
          style={{ 
            borderTop: `1px solid ${DESIGN.colors.border}`,
            background: DESIGN.colors.card
          }}
        >
          <div className="flex-1">
            <Input
              ref={inputRef}
              type="text"
              placeholder={replyTo ? 'Write a reply...' : 'Type a message...'}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="h-12 rounded-[12px] px-4 border-0"
              style={{
                background: DESIGN.colors.background,
                color: DESIGN.colors.textPrimary,
                fontSize: '15px'
              }}
            />
          </div>
          <motion.button
            type="submit"
            disabled={!newMessage.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center rounded-[12px] disabled:opacity-50"
            style={{
              width: '48px',
              height: '48px',
              background: DESIGN.colors.primary,
              boxShadow: DESIGN.shadows.glow
            }}
          >
            <Send className="w-5 h-5" style={{ color: DESIGN.colors.background }} />
          </motion.button>
        </form>
      </div>

      {/* Upgrade Prompt Modal */}
      <Dialog open={showUpgradePrompt} onOpenChange={setShowUpgradePrompt}>
        <DialogContent 
          className="p-0 border-0 rounded-[20px] max-w-[380px] mx-auto"
          style={{
            background: DESIGN.colors.card,
            border: `1px solid ${DESIGN.colors.border}`,
            boxShadow: DESIGN.shadows.card
          }}
        >
          <motion.div 
            className="py-8 px-6 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Icon */}
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ 
                background: `${DESIGN.colors.primary}20`,
                borderRadius: '50%'
              }}
            >
              <Lock className="w-10 h-10" style={{ color: DESIGN.colors.primary }} />
            </div>
            
            {/* Title */}
            <h2 
              className="text-[24px] font-bold mb-3"
              style={{ color: DESIGN.colors.textPrimary }}
            >
              Pro Feature
            </h2>
            
            {/* Description */}
            <p 
              className="text-[15px] mb-8"
              style={{ color: DESIGN.colors.textSecondary }}
            >
              Upgrade to Pro or Max to participate in community chat.
            </p>
            
            {/* Upgrade Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUpgradePrompt(false)}
              className="w-full py-4 rounded-[12px] font-bold text-[16px]"
              style={{
                background: DESIGN.colors.primary,
                color: DESIGN.colors.background,
                boxShadow: DESIGN.shadows.glow
              }}
            >
              Upgrade Now
            </motion.button>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
