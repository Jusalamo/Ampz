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

  // Fetch friends list
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

      // Get friend IDs
      const friendIds = friendships.map(f => 
        f.user1_id === userId ? f.user2_id : f.user1_id
      );

      // Fetch friend profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, profile_photo, bio')
        .in('id', friendIds);

      if (profilesError) throw profilesError;

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

  // Fetch friend requests
  const fetchRequests = useCallback(async () => {
    if (!userId) return;

    try {
      // Received requests
      const { data: received, error: receivedError } = await supabase
        .from('friend_requests')
        .select('id, sender_id, receiver_id, status, created_at')
        .eq('receiver_id', userId)
        .eq('status', 'pending');

      if (receivedError) throw receivedError;

      // Sent requests
      const { data: sent, error: sentError } = await supabase
        .from('friend_requests')
        .select('id, sender_id, receiver_id, status, created_at')
        .eq('sender_id', userId)
        .eq('status', 'pending');

      if (sentError) throw sentError;

      // Get sender profiles for received requests
      if (received && received.length > 0) {
        const senderIds = received.map(r => r.sender_id);
        const { data: senderProfiles } = await supabase
          .from('profiles')
          .select('id, name, profile_photo, bio')
          .in('id', senderIds);

        const receivedList: FriendRequest[] = received.map(r => {
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
        });
        setReceivedRequests(receivedList);
      } else {
        setReceivedRequests([]);
      }

      // Get receiver profiles for sent requests
      if (sent && sent.length > 0) {
        const receiverIds = sent.map(s => s.receiver_id);
        const { data: receiverProfiles } = await supabase
          .from('profiles')
          .select('id, name, profile_photo, bio')
          .in('id', receiverIds);

        const sentList: FriendRequest[] = sent.map(s => {
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
        });
        setSentRequests(sentList);
      } else {
        setSentRequests([]);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  }, [userId]);

  // Fetch suggested users
  const fetchSuggestedUsers = useCallback(async () => {
    if (!userId) return;

    try {
      // Try using the RPC function if it exists
      const { data: suggested, error } = await supabase
        .rpc('get_suggested_users', { current_user_id: userId, limit_count: 20 });

      if (error) {
        console.log('Falling back to basic user suggestion');
        // Fallback: get random users who are not friends
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, profile_photo, bio')
          .neq('id', userId)
          .limit(20);

        if (profiles) {
          const suggestions: SuggestedUser[] = profiles.map(p => ({
            id: p.id,
            name: p.name || 'User',
            photo: p.profile_photo || '/default-avatar.png',
            bio: p.bio || '',
            mutualConnections: 0,
            sharedEvents: 0,
          }));
          setSuggestedUsers(suggestions);
        }
        return;
      }

      if (suggested) {
        const suggestions: SuggestedUser[] = suggested.map((s: any) => ({
          id: s.id,
          name: s.name || 'User',
          photo: s.profile_photo || '/default-avatar.png',
          bio: s.bio || '',
          mutualConnections: s.mutual_count || 0,
          sharedEvents: s.shared_events || 0,
        }));
        setSuggestedUsers(suggestions);
      }
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    }
  }, [userId]);

  // Search users
  const searchUsers = useCallback(async (query: string): Promise<SuggestedUser[]> => {
    if (!query || query.length < 2 || !userId) return [];

    try {
      // Use ilike for fuzzy matching
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, profile_photo, bio, email')
        .or(`name.ilike.%${query}%,bio.ilike.%${query}%,email.ilike.%${query}%`)
        .neq('id', userId)
        .order('name')
        .limit(20);

      if (error) {
        console.error('Search error:', error);
        return [];
      }

      return (data || []).map(p => ({
        id: p.id,
        name: p.name || p.email?.split('@')[0] || 'User',
        photo: p.profile_photo || '/default-avatar.png',
        bio: p.bio || '',
        mutualConnections: 0,
        sharedEvents: 0,
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }, [userId]);

  // Send friend request
  const sendFriendRequest = useCallback(async (receiverId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: userId,
          receiver_id: receiverId,
          status: 'pending',
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Request already sent',
            description: 'You have already sent a friend request to this user',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return false;
      }

      toast({
        title: 'Request sent!',
        description: 'Friend request sent successfully',
      });

      await fetchRequests();
      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: 'Error',
        description: 'Failed to send friend request',
        variant: 'destructive',
      });
      return false;
    }
  }, [userId, toast, fetchRequests]);

  // Accept friend request
  const acceptFriendRequest = useCallback(async (requestId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      // Use the RPC function to accept the request
      const { data, error } = await supabase
        .rpc('accept_friend_request', { request_id: requestId });

      if (error) throw error;

      toast({
        title: 'Friend added!',
        description: 'You are now friends',
      });

      await Promise.all([fetchFriends(), fetchRequests()]);
      return true;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept friend request',
        variant: 'destructive',
      });
      return false;
    }
  }, [userId, toast, fetchFriends, fetchRequests]);

  // Decline friend request
  const declineFriendRequest = useCallback(async (requestId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'declined' })
        .eq('id', requestId)
        .eq('receiver_id', userId);

      if (error) throw error;

      toast({
        title: 'Request declined',
        description: 'Friend request has been declined',
      });

      await fetchRequests();
      return true;
    } catch (error) {
      console.error('Error declining friend request:', error);
      return false;
    }
  }, [userId, toast, fetchRequests]);

  // Cancel sent request
  const cancelFriendRequest = useCallback(async (requestId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId)
        .eq('sender_id', userId);

      if (error) throw error;

      toast({
        title: 'Request cancelled',
        description: 'Friend request has been cancelled',
      });

      await fetchRequests();
      return true;
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      return false;
    }
  }, [userId, toast, fetchRequests]);

  // Get relationship status with a user
  const getRelationshipStatus = useCallback((otherUserId: string): 'friend' | 'pending_sent' | 'pending_received' | 'none' => {
    if (friends.some(f => f.friendId === otherUserId)) return 'friend';
    if (sentRequests.some(r => r.receiverId === otherUserId)) return 'pending_sent';
    if (receivedRequests.some(r => r.senderId === otherUserId)) return 'pending_received';
    return 'none';
  }, [friends, sentRequests, receivedRequests]);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchFriends(), fetchRequests(), fetchSuggestedUsers()]);
      setIsLoading(false);
    };

    if (userId) {
      loadData();
    }
  }, [userId, fetchFriends, fetchRequests, fetchSuggestedUsers]);

  // Real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('friends-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friendships',
      }, () => {
        fetchFriends();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friend_requests',
      }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
