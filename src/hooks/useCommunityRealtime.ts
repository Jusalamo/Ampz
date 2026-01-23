import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CommunityPhoto, CommunityComment } from '@/lib/types';

interface UseCommunityRealtimeProps {
  eventId: string;
  userId?: string;
}

export function useCommunityRealtime({ eventId, userId }: UseCommunityRealtimeProps) {
  const [photos, setPhotos] = useState<CommunityPhoto[]>([]);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data
  const fetchPhotos = useCallback(async () => {
    const { data, error } = await supabase
      .from('community_photos')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching photos:', error);
      return;
    }

    // Fetch user profiles for photos
    const userIds = [...new Set(data.map(p => p.user_id).filter(Boolean))];
    let profiles: any[] = [];
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, name, profile_photo')
        .in('id', userIds);
      profiles = profileData || [];
    }

    const mappedPhotos: CommunityPhoto[] = data.map(p => {
      const profile = profiles.find(pr => pr.id === p.user_id);
      return {
        id: p.id,
        eventId: p.event_id || eventId,
        userId: p.user_id || '',
        userName: profile?.name || 'Anonymous',
        userPhoto: profile?.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_id}`,
        imageUrl: p.image_url,
        timestamp: p.created_at || new Date().toISOString(),
        likes: p.likes_count || 0,
        likedBy: p.liked_by || [],
        isLiked: userId ? (p.liked_by || []).includes(userId) : false,
      };
    });

    setPhotos(mappedPhotos);
  }, [eventId, userId]);

  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('community_comments')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return;
    }

    // Fetch user profiles for comments
    const userIds = [...new Set(data.map(c => c.user_id).filter(Boolean))];
    let profiles: any[] = [];
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, name, profile_photo')
        .in('id', userIds);
      profiles = profileData || [];
    }

    const mappedComments: CommunityComment[] = data.map(c => {
      const profile = profiles.find(pr => pr.id === c.user_id);
      return {
        id: c.id,
        eventId: c.event_id || eventId,
        userId: c.user_id || '',
        userName: profile?.name || 'Anonymous',
        userPhoto: profile?.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user_id}`,
        text: c.content,
        timestamp: c.created_at || new Date().toISOString(),
        likes: c.likes_count || 0,
        likedBy: c.liked_by || [],
        isLiked: userId ? (c.liked_by || []).includes(userId) : false,
        replyTo: c.reply_to || undefined,
      };
    });

    setComments(mappedComments);
  }, [eventId, userId]);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchPhotos(), fetchComments()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchPhotos, fetchComments]);

  // Realtime subscriptions
  useEffect(() => {
    const photosChannel = supabase
      .channel(`community-photos-${eventId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_photos',
        filter: `event_id=eq.${eventId}`,
      }, () => {
        fetchPhotos();
      })
      .subscribe();

    const commentsChannel = supabase
      .channel(`community-comments-${eventId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_comments',
        filter: `event_id=eq.${eventId}`,
      }, () => {
        fetchComments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(photosChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [eventId, fetchPhotos, fetchComments]);

  return {
    photos,
    comments,
    isLoading,
    refetchPhotos: fetchPhotos,
    refetchComments: fetchComments,
  };
}
