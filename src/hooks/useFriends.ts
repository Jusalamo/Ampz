import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  senderProfile?: {
    id: string;
    name: string;
    photo: string;
  };
  receiverProfile?: {
    id: string;
    name: string;
    photo: string;
  };
}

export interface Friendship {
  id: string;
  friendId: string;
  friendName: string;
  friendPhoto: string;
  createdAt: string;
}

export function useFriends(userId?: string) {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch friends
  const fetchFriends = useCallback(async () => {
    if (!userId) return;
    
    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
    
    if (error) {
      console.error('Error fetching friends:', error);
      return;
    }

    // Fetch profiles for friends
    const friendIds = data.map(f => f.user1_id === userId ? f.user2_id : f.user1_id);
    
    if (friendIds.length === 0) {
      setFriends([]);
      return;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, profile_photo')
      .in('id', friendIds);

    const friendsList: Friendship[] = data.map(f => {
      const friendId = f.user1_id === userId ? f.user2_id : f.user1_id;
      const profile = profiles?.find(p => p.id === friendId);
      return {
        id: f.id,
        friendId,
        friendName: profile?.name || 'Unknown',
        friendPhoto: profile?.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friendId}`,
        createdAt: f.created_at,
      };
    });

    setFriends(friendsList);
  }, [userId]);

  // Fetch friend requests
  const fetchRequests = useCallback(async () => {
    if (!userId) return;
    
    // Fetch received requests
    const { data: received } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    // Fetch sent requests
    const { data: sent } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('sender_id', userId)
      .eq('status', 'pending');

    // Fetch profiles for senders/receivers
    const senderIds = received?.map(r => r.sender_id) || [];
    const receiverIds = sent?.map(r => r.receiver_id) || [];
    const allIds = [...new Set([...senderIds, ...receiverIds])];

    let profiles: any[] = [];
    if (allIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, name, profile_photo')
        .in('id', allIds);
      profiles = profileData || [];
    }

    const receivedRequests: FriendRequest[] = (received || []).map(r => ({
      id: r.id,
      senderId: r.sender_id,
      receiverId: r.receiver_id,
      status: r.status as 'pending' | 'accepted' | 'declined',
      createdAt: r.created_at,
      senderProfile: {
        id: r.sender_id,
        name: profiles.find(p => p.id === r.sender_id)?.name || 'Unknown',
        photo: profiles.find(p => p.id === r.sender_id)?.profile_photo || 
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.sender_id}`,
      },
    }));

    const sentRequestsList: FriendRequest[] = (sent || []).map(r => ({
      id: r.id,
      senderId: r.sender_id,
      receiverId: r.receiver_id,
      status: r.status as 'pending' | 'accepted' | 'declined',
      createdAt: r.created_at,
      receiverProfile: {
        id: r.receiver_id,
        name: profiles.find(p => p.id === r.receiver_id)?.name || 'Unknown',
        photo: profiles.find(p => p.id === r.receiver_id)?.profile_photo || 
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.receiver_id}`,
      },
    }));

    setReceivedRequests(receivedRequests);
    setSentRequests(sentRequestsList);
  }, [userId]);

  // Send friend request
  const sendFriendRequest = useCallback(async (receiverId: string): Promise<boolean> => {
    if (!userId) return false;

    const { error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: userId,
        receiver_id: receiverId,
      });

    if (error) {
      console.error('Error sending friend request:', error);
      return false;
    }

    await fetchRequests();
    return true;
  }, [userId, fetchRequests]);

  // Accept friend request
  const acceptFriendRequest = useCallback(async (requestId: string): Promise<boolean> => {
    const { error } = await supabase.rpc('accept_friend_request', { request_id: requestId });

    if (error) {
      console.error('Error accepting friend request:', error);
      return false;
    }

    await Promise.all([fetchFriends(), fetchRequests()]);
    return true;
  }, [fetchFriends, fetchRequests]);

  // Decline friend request
  const declineFriendRequest = useCallback(async (requestId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) {
      console.error('Error declining friend request:', error);
      return false;
    }

    await fetchRequests();
    return true;
  }, [fetchRequests]);

  // Cancel sent request
  const cancelFriendRequest = useCallback(async (requestId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      console.error('Error cancelling friend request:', error);
      return false;
    }

    await fetchRequests();
    return true;
  }, [fetchRequests]);

  // Remove friend
  const removeFriend = useCallback(async (friendshipId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) {
      console.error('Error removing friend:', error);
      return false;
    }

    await fetchFriends();
    return true;
  }, [fetchFriends]);

  // Search users
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, profile_photo, bio')
      .ilike('name', `%${query}%`)
      .neq('id', userId || '')
      .limit(10);

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    return data.map(p => ({
      id: p.id,
      name: p.name || 'Unknown',
      photo: p.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
      bio: p.bio || '',
    }));
  }, [userId]);

  // Initial fetch and realtime subscription
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchFriends(), fetchRequests()]);
      setIsLoading(false);
    };

    loadData();

    // Subscribe to realtime updates
    const friendRequestsChannel = supabase
      .channel('friend-requests-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friend_requests',
        filter: `receiver_id=eq.${userId}`,
      }, () => {
        fetchRequests();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friend_requests',
        filter: `sender_id=eq.${userId}`,
      }, () => {
        fetchRequests();
      })
      .subscribe();

    const friendshipsChannel = supabase
      .channel('friendships-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friendships',
      }, () => {
        fetchFriends();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(friendRequestsChannel);
      supabase.removeChannel(friendshipsChannel);
    };
  }, [userId, fetchFriends, fetchRequests]);

  return {
    friends,
    receivedRequests,
    sentRequests,
    isLoading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
    searchUsers,
    refetch: () => Promise.all([fetchFriends(), fetchRequests()]),
  };
}
