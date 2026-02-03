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

export interface SearchResult {
  id: string;
  name: string;
  photo: string;
  bio: string;
  mutualConnections?: number;
  sharedEvents?: number;
}

export function useFriends(userId?: string) {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SearchResult[]>([]);
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

  // Fetch suggested users (like Snapchat Quick Add)
  const fetchSuggestedUsers = useCallback(async () => {
    if (!userId) return;

    try {
      // Get users who are not friends, not in pending requests, and have mutual connections
      const { data: mutualConnections, error } = await supabase.rpc(
        'get_suggested_users',
        {
          current_user_id: userId,
          limit_count: 20
        }
      );

      if (error) {
        console.error('Error fetching suggested users:', error);
        // Fallback: get random users who are not friends
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, profile_photo, bio')
          .neq('id', userId)
          .limit(10);

        if (profiles) {
          const suggested = await Promise.all(
            profiles.map(async (profile) => {
              // Check mutual connections count
              const { count: mutualCount } = await supabase
                .from('friendships')
                .select('*', { count: 'exact', head: true })
                .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
                .or(`user1_id.in.(${friends.map(f => f.friendId).join(',')}),user2_id.in.(${friends.map(f => f.friendId).join(',')})`);

              return {
                id: profile.id,
                name: profile.name || 'Unknown',
                photo: profile.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
                bio: profile.bio || '',
                mutualConnections: mutualCount || 0,
              };
            })
          );

          setSuggestedUsers(suggested.filter(user => user.id !== userId));
        }
        return;
      }

      if (mutualConnections) {
        const suggested = mutualConnections.map((user: any) => ({
          id: user.id,
          name: user.name || 'Unknown',
          photo: user.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          bio: user.bio || '',
          mutualConnections: user.mutual_count || 0,
          sharedEvents: user.shared_events || 0,
        }));
        setSuggestedUsers(suggested);
      }
    } catch (error) {
      console.error('Error in fetchSuggestedUsers:', error);
    }
  }, [userId, friends]);

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

    await Promise.all([fetchRequests(), fetchSuggestedUsers()]);
    return true;
  }, [userId, fetchRequests, fetchSuggestedUsers]);

  // Accept friend request
  const acceptFriendRequest = useCallback(async (requestId: string): Promise<boolean> => {
    const { error } = await supabase.rpc('accept_friend_request', { request_id: requestId });

    if (error) {
      console.error('Error accepting friend request:', error);
      return false;
    }

    await Promise.all([fetchFriends(), fetchRequests(), fetchSuggestedUsers()]);
    return true;
  }, [fetchFriends, fetchRequests, fetchSuggestedUsers]);

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

    await Promise.all([fetchRequests(), fetchSuggestedUsers()]);
    return true;
  }, [fetchRequests, fetchSuggestedUsers]);

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

    await Promise.all([fetchFriends(), fetchSuggestedUsers()]);
    return true;
  }, [fetchFriends, fetchSuggestedUsers]);

  // Search users with multiple criteria (like Snapchat)
  const searchUsers = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!query.trim()) {
      return suggestedUsers;
    }

    try {
      // Search by name, bio, and email (if available)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, profile_photo, bio, email')
        .or(`name.ilike.%${query}%,bio.ilike.%${query}%,email.ilike.%${query}%`)
        .neq('id', userId || '')
        .limit(20);

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }

      // Get relationship status and mutual connections for each result
      const resultsWithDetails = await Promise.all(
        data.map(async (profile) => {
          // Count mutual connections
          const { count: mutualCount } = await supabase
            .from('friendships')
            .select('*', { count: 'exact', head: true })
            .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
            .or(`user1_id.in.(${friends.map(f => f.friendId).join(',')}),user2_id.in.(${friends.map(f => f.friendId).join(',')})`);

          // Count shared events (if you have an events table)
          let sharedEvents = 0;
          if (userId) {
            const { count: eventsCount } = await supabase
              .from('event_attendees')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', profile.id)
              .in('event_id', [/* Add user's event IDs here if available */]);

            sharedEvents = eventsCount || 0;
          }

          return {
            id: profile.id,
            name: profile.name || 'Unknown',
            photo: profile.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
            bio: profile.bio || '',
            mutualConnections: mutualCount || 0,
            sharedEvents,
          };
        })
      );

      // Sort by mutual connections and relevance
      return resultsWithDetails.sort((a, b) => {
        // First sort by mutual connections
        if (b.mutualConnections !== a.mutualConnections) {
          return b.mutualConnections - a.mutualConnections;
        }
        // Then sort by name match relevance
        const aNameMatch = a.name.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
        const bNameMatch = b.name.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
        return bNameMatch - aNameMatch;
      });
    } catch (error) {
      console.error('Error in searchUsers:', error);
      return [];
    }
  }, [userId, friends, suggestedUsers]);

  // Check if user is already a friend or has pending request
  const getRelationshipStatus = useCallback((userId: string): 'friend' | 'pending_sent' | 'pending_received' | 'none' => {
    if (friends.some(f => f.friendId === userId)) return 'friend';
    if (sentRequests.some(r => r.receiverId === userId)) return 'pending_sent';
    if (receivedRequests.some(r => r.senderId === userId)) return 'pending_received';
    return 'none';
  }, [friends, sentRequests, receivedRequests]);

  // Initial fetch and realtime subscription
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchFriends(), fetchRequests(), fetchSuggestedUsers()]);
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
  }, [userId, fetchFriends, fetchRequests, fetchSuggestedUsers]);

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
    removeFriend,
    searchUsers,
    getRelationshipStatus,
    refetch: () => Promise.all([fetchFriends(), fetchRequests(), fetchSuggestedUsers()]),
  };
}
