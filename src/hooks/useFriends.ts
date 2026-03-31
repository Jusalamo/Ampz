import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Friend {
  id: string;
  friendId: string;
  friendName: string;
  friendPhoto: string;
  friendBio: string;
  friendsSince: string;
  mutualConnections: number;
}

interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  senderBio: string;
  receiverId: string;
  status: string;
  createdAt: string;
  mutualConnections: number;
}

interface SuggestedUser {
  id: string;
  name: string;
  photo: string;
  bio: string;
  mutualConnections: number;
  sharedEvents: number;
}

export function useFriends(userId?: string) {
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    if (!userId) return;

    try {
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('id, user1_id, user2_id, created_at')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (error) throw error;

      if (!friendships || friendships.length === 0) {
        setFriends([]);
        return;
      }

      const friendIds = friendships.map(f =>
        f.user1_id === userId ? f.user2_id : f.user1_id
      );

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, profile_photo, bio')
        .in('id', friendIds);

      const friendsList: Friend[] = friendships.map(f => {
        const friendId = f.user1_id === userId ? f.user2_id : f.user1_id;
        const profile = profiles?.find(p => p.id === friendId);

        return {
          id: f.id,
          friendId,
          friendName: profile?.name || 'Unknown',
          friendPhoto: profile?.profile_photo || '/default-avatar.png',
          friendBio: profile?.bio || '',
          friendsSince: f.created_at,
          mutualConnections: 0,
        };
      });

      setFriends(friendsList);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  }, [userId]);

  const fetchRequests = useCallback(async () => {
    if (!userId) return;

    try {
      const { data: received } = await supabase
        .from('friend_requests')
        .select('id, sender_id, receiver_id, status, created_at')
        .eq('receiver_id', userId)
        .eq('status', 'pending');

      const { data: sent } = await supabase
        .from('friend_requests')
        .select('id, sender_id, receiver_id, status, created_at')
        .eq('sender_id', userId)
        .eq('status', 'pending');

      if (received && received.length > 0) {
        const senderIds = received.map(r => r.sender_id);
        const { data: senderProfiles } = await supabase
          .from('profiles')
          .select('id, name, profile_photo, bio')
          .in('id', senderIds);

        setReceivedRequests(received.map(r => {
          const profile = senderProfiles?.find(p => p.id === r.sender_id);
          return {
            id: r.id,
            senderId: r.sender_id,
            senderName: profile?.name || 'Unknown',
            senderPhoto: profile?.profile_photo || '/default-avatar.png',
            senderBio: profile?.bio || '',
            receiverId: r.receiver_id,
            status: r.status,
            createdAt: r.created_at,
            mutualConnections: 0,
          };
        }));
      } else {
        setReceivedRequests([]);
      }

      if (sent && sent.length > 0) {
        const receiverIds = sent.map(s => s.receiver_id);
        const { data: receiverProfiles } = await supabase
          .from('profiles')
          .select('id, name, profile_photo, bio')
          .in('id', receiverIds);

        setSentRequests(sent.map(s => {
          const profile = receiverProfiles?.find(p => p.id === s.receiver_id);
          return {
            id: s.id,
            senderId: s.sender_id,
            senderName: profile?.name || 'Unknown',
            senderPhoto: profile?.profile_photo || '/default-avatar.png',
            senderBio: profile?.bio || '',
            receiverId: s.receiver_id,
            status: s.status,
            createdAt: s.created_at,
            mutualConnections: 0,
          };
        }));
      } else {
        setSentRequests([]);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  }, [userId]);

  const fetchSuggestedUsers = useCallback(async () => {
    if (!userId) return;

    try {
      const { data: suggested, error } = await supabase
        .rpc('get_suggested_users', { current_user_id: userId, limit_count: 20 });

      if (error || !suggested) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, profile_photo, bio')
          .neq('id', userId)
          .limit(20);

        if (profiles) {
          setSuggestedUsers(profiles.map(p => ({
            id: p.id,
            name: p.name || 'User',
            photo: p.profile_photo || '/default-avatar.png',
            bio: p.bio || '',
            mutualConnections: 0,
            sharedEvents: 0,
          })));
        }
        return;
      }

      setSuggestedUsers(suggested.map((s: any) => ({
        id: s.id,
        name: s.name || 'User',
        photo: s.profile_photo || '/default-avatar.png',
        bio: s.bio || '',
        mutualConnections: s.mutual_count || 0,
        sharedEvents: s.shared_events || 0,
      })));
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    }
  }, [userId]);

  const searchUsers = useCallback(async (query: string): Promise<SuggestedUser[]> => {
    if (!query || query.length < 2 || !userId) return [];

    try {
      const { data, error } = await supabase
        .from('profiles_public')
        .select('id, name, profile_photo, bio')
        .or(`name.ilike.%${query}%,bio.ilike.%${query}%`)
        .neq('id', userId)
        .order('name')
        .limit(20);

      if (error) return [];

      const friendIds = friends.map(f => f.friendId);
      const sentIds = sentRequests.map(r => r.receiverId);
      const receivedIds = receivedRequests.map(r => r.senderId);

      return (data || [])
        .filter(p => p.id && !friendIds.includes(p.id) && !sentIds.includes(p.id) && !receivedIds.includes(p.id))
        .map(p => ({
          id: p.id || '',
          name: p.name || 'User',
          photo: p.profile_photo || '/default-avatar.png',
          bio: p.bio || '',
          mutualConnections: 0,
          sharedEvents: 0,
        }));
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }, [userId, friends, sentRequests, receivedRequests]);

  const sendFriendRequest = useCallback(async (receiverId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const { error } = await supabase.from('friend_requests').insert({
        sender_id: userId,
        receiver_id: receiverId,
        status: 'pending',
      });

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Request already sent', variant: 'destructive' });
        } else {
          throw error;
        }
        return false;
      }

      toast({ title: 'Request sent!' });
      // Refresh sent requests so getRelationshipStatus is accurate immediately
      await fetchRequests();
      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({ title: 'Error', description: 'Failed to send friend request', variant: 'destructive' });
      return false;
    }
  }, [userId, toast, fetchRequests]);

  const acceptFriendRequest = useCallback(async (requestId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const { error } = await supabase.rpc('accept_friend_request', { request_id: requestId });
      if (error) throw error;

      toast({ title: 'Friend added!' });
      // Refresh both friends list AND requests so all derived state is current
      await Promise.all([fetchFriends(), fetchRequests()]);
      return true;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast({ title: 'Error', description: 'Failed to accept request', variant: 'destructive' });
      return false;
    }
  }, [userId, toast, fetchFriends, fetchRequests]);

  const declineFriendRequest = useCallback(async (requestId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'declined' })
        .eq('id', requestId)
        .eq('receiver_id', userId);

      if (error) throw error;

      toast({ title: 'Request declined' });
      // Refresh requests so status is accurate
      await fetchRequests();
      return true;
    } catch (error) {
      console.error('Error declining friend request:', error);
      return false;
    }
  }, [userId, toast, fetchRequests]);

  const cancelFriendRequest = useCallback(async (requestId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId)
        .eq('sender_id', userId);

      if (error) throw error;

      toast({ title: 'Request cancelled' });
      // Refresh sent requests so getRelationshipStatus is accurate
      await fetchRequests();
      return true;
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      return false;
    }
  }, [userId, toast, fetchRequests]);

  // Returns current status based on live state arrays
  const getRelationshipStatus = useCallback((otherUserId: string): 'friend' | 'pending_sent' | 'pending_received' | 'none' => {
    if (friends.some(f => f.friendId === otherUserId)) return 'friend';
    if (sentRequests.some(r => r.receiverId === otherUserId)) return 'pending_sent';
    if (receivedRequests.some(r => r.senderId === otherUserId)) return 'pending_received';
    return 'none';
  }, [friends, sentRequests, receivedRequests]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchFriends(), fetchRequests(), fetchSuggestedUsers()]);
      setIsLoading(false);
    };

    if (userId) loadData();
  }, [userId, fetchFriends, fetchRequests, fetchSuggestedUsers]);

  // Real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('friends-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
        fetchFriends();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchFriends, fetchRequests]);

  return {
    friends,
    receivedRequests,
    sentRequests,
    suggestedUsers,
    isLoading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    searchUsers,
    getRelationshipStatus,
    refreshFriends: fetchFriends,
    refreshRequests: fetchRequests,
  };
}
