import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

// Persistent real-time subscriptions manager
export function useRealtimeSubscriptions() {
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const subscribersRef = useRef<Map<string, Set<(payload: any) => void>>>(new Map());

  // Subscribe to a table with a specific callback
  const subscribeToTable = useCallback((
    table: string, 
    callback: (payload: any) => void,
    filter?: { column: string; value: string }
  ) => {
    const channelKey = filter ? `${table}:${filter.column}=${filter.value}` : table;
    
    // Add callback to subscribers
    if (!subscribersRef.current.has(channelKey)) {
      subscribersRef.current.set(channelKey, new Set());
    }
    subscribersRef.current.get(channelKey)!.add(callback);

    // Create channel if not exists
    if (!channelsRef.current.has(channelKey)) {
      const channelConfig: any = {
        event: '*',
        schema: 'public',
        table: table,
      };
      
      if (filter) {
        channelConfig.filter = `${filter.column}=eq.${filter.value}`;
      }

      const channel = supabase
        .channel(`realtime-${channelKey}`)
        .on('postgres_changes', channelConfig, (payload) => {
          // Notify all subscribers
          const subscribers = subscribersRef.current.get(channelKey);
          if (subscribers) {
            subscribers.forEach(cb => cb(payload));
          }
        })
        .subscribe((status) => {
          console.log(`Realtime ${channelKey}:`, status);
        });

      channelsRef.current.set(channelKey, channel);
    }

    // Return unsubscribe function
    return () => {
      const subscribers = subscribersRef.current.get(channelKey);
      if (subscribers) {
        subscribers.delete(callback);
        
        // If no more subscribers, remove channel
        if (subscribers.size === 0) {
          const channel = channelsRef.current.get(channelKey);
          if (channel) {
            supabase.removeChannel(channel);
            channelsRef.current.delete(channelKey);
          }
          subscribersRef.current.delete(channelKey);
        }
      }
    };
  }, []);

  // Cleanup all channels on unmount
  useEffect(() => {
    return () => {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current.clear();
      subscribersRef.current.clear();
    };
  }, []);

  return { subscribeToTable };
}

// Hook for subscribing to event check-ins in real-time
export function useCheckInRealtime(eventId: string, onCheckIn: (checkIn: any) => void) {
  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`check-ins-${eventId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'check_ins',
        filter: `event_id=eq.${eventId}`,
      }, (payload) => {
        onCheckIn(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, onCheckIn]);
}

// Hook for subscribing to community content in real-time
export function useCommunityRealtime(
  eventId: string, 
  onPhoto: (photo: any) => void,
  onComment: (comment: any) => void
) {
  useEffect(() => {
    if (!eventId) return;

    const photosChannel = supabase
      .channel(`photos-${eventId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_photos',
        filter: `event_id=eq.${eventId}`,
      }, (payload) => {
        onPhoto(payload);
      })
      .subscribe();

    const commentsChannel = supabase
      .channel(`comments-${eventId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_comments',
        filter: `event_id=eq.${eventId}`,
      }, (payload) => {
        onComment(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(photosChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [eventId, onPhoto, onComment]);
}

// Hook for subscribing to notifications in real-time
export function useNotificationsRealtime(userId: string, onNotification: (notification: any) => void) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        onNotification(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onNotification]);
}
