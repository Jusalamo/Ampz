import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: 'text' | 'image' | 'audio';
  mediaUrl?: string;
  isRead: boolean;
  readAt?: string;
  sentAt: string;
  createdAt: string;
}

export function useMessages(matchId: string | null, userId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Fetch existing messages
  const fetchMessages = useCallback(async () => {
    if (!matchId || !userId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('sent_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
      } else if (data) {
        const mappedMessages: ChatMessage[] = data.map(m => ({
          id: m.id,
          matchId: m.match_id || '',
          senderId: m.sender_id || '',
          receiverId: m.receiver_id || '',
          content: m.content || '',
          messageType: (m.message_type as 'text' | 'image' | 'audio') || 'text',
          mediaUrl: m.media_url || undefined,
          isRead: m.is_read || false,
          readAt: m.read_at || undefined,
          sentAt: m.sent_at || m.created_at || '',
          createdAt: m.created_at || '',
        }));
        setMessages(mappedMessages);

        // Mark messages as read that are for us
        const unreadIds = data
          .filter(m => m.receiver_id === userId && !m.is_read)
          .map(m => m.id);

        if (unreadIds.length > 0) {
          await supabase
            .from('messages')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .in('id', unreadIds);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [matchId, userId]);

  // Send a message
  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!matchId || !userId || !content.trim()) return false;

    setIsSending(true);

    try {
      // Get the match to find the other user
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .eq('id', matchId)
        .single();

      if (matchError || !match) {
        console.error('Error fetching match:', matchError);
        return false;
      }

      const receiverId = match.user1_id === userId ? match.user2_id : match.user1_id;

      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: userId,
          receiver_id: receiverId,
          content: content.trim(),
          message_type: 'text',
          is_read: false,
          sent_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error sending message:', insertError);
        return false;
      }

      // Update match with last message
      await supabase
        .from('matches')
        .update({
          last_message: content.trim(),
          last_message_time: new Date().toISOString(),
          last_message_unread: true,
        })
        .eq('id', matchId);

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [matchId, userId]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string): Promise<void> => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!matchId || !userId) return;

    const channel = supabase
      .channel(`chat-${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      }, (payload) => {
        const newMessage = payload.new as any;
        
        const mappedMessage: ChatMessage = {
          id: newMessage.id,
          matchId: newMessage.match_id || '',
          senderId: newMessage.sender_id || '',
          receiverId: newMessage.receiver_id || '',
          content: newMessage.content || '',
          messageType: newMessage.message_type || 'text',
          mediaUrl: newMessage.media_url || undefined,
          isRead: newMessage.is_read || false,
          readAt: newMessage.read_at || undefined,
          sentAt: newMessage.sent_at || newMessage.created_at || '',
          createdAt: newMessage.created_at || '',
        };

        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === mappedMessage.id)) return prev;
          return [...prev, mappedMessage];
        });

        // Mark as read if we're the receiver
        if (newMessage.receiver_id === userId) {
          markAsRead(newMessage.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, userId, markAsRead]);

  return {
    messages,
    isLoading,
    isSending,
    sendMessage,
    markAsRead,
    refetch: fetchMessages,
  };
}
