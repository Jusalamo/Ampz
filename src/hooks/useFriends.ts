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
  email?: string;
  username?: string;
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

  // Search users from both auth and profiles tables
  const searchUsers = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!query.trim() || query.length < 2) {
      return [];
    }

    try {
      console.log('🔍 Searching for:', query);
      
      // First, let's check what's in our profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, profile_photo, bio, username')
        .or(`name.ilike.%${query}%,bio.ilike.%${query}%,username.ilike.%${query}%`)
        .neq('id', userId || '')
        .limit(20);

      if (profilesError) {
        console.error('Profiles search error:', profilesError);
      }

      console.log('📊 Profiles found:', profilesData?.length || 0);

      // Also search auth.users via RPC if available
      let authUsers: any[] = [];
      try {
        // Try to use a stored procedure to search auth.users
        const { data: authData, error: authError } = await supabase.rpc(
          'search_users_by_email_or_name',
          { search_query: query }
        );
        
        if (!authError && authData) {
          authUsers = authData;
        }
      } catch (rpcError) {
        console.log('RPC search not available, using profiles only');
      }

      // Combine results
      const allUsers = [...(profilesData || [])];
      
      // Add auth users that aren't already in profiles
      authUsers.forEach(authUser => {
        if (!allUsers.find(u => u.id === authUser.id)) {
          allUsers.push({
            id: authUser.id,
            name: authUser.name || authUser.email?.split('@')[0] || 'User',
            profile_photo: authUser.profile_photo || null,
            bio: authUser.bio || '',
            username: authUser.username || null
          });
        }
      });

      if (allUsers.length === 0) {
        console.log('No users found');
        return [];
      }

      console.log('🎯 Total users found:', allUsers.length);

      // Get relationship status and mutual connections for each result
      const resultsWithDetails = await Promise.all(
        allUsers.map(async (userData) => {
          // Check mutual connections
          let mutualConnections = 0;
          
          if (userId && friends.length > 0) {
            try {
              // Get this user's friends
              const { data: userFriends } = await supabase
                .from('friendships')
                .select('user1_id, user2_id')
                .or(`user1_id.eq.${userData.id},user2_id.eq.${userData.id}`);
              
              if (userFriends && userFriends.length > 0) {
                const userFriendIds = userFriends.map(f => 
                  f.user1_id === userData.id ? f.user2_id : f.user1_id
                );
                
                mutualConnections = userFriendIds.filter(friendId => 
                  friends.some(f => f.friendId === friendId)
                ).length;
              }
            } catch (error) {
              console.error('Error calculating mutual connections:', error);
            }
          }

          return {
            id: userData.id,
            name: userData.name || userData.username || 'Unknown',
            photo: userData.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.id}`,
            bio: userData.bio || '',
            email: userData.email,
            username: userData.username,
            mutualConnections,
          };
        })
      );

      // Remove duplicates and sort
      const uniqueResults = resultsWithDetails.filter((result, index, self) =>
        index === self.findIndex(r => r.id === result.id)
      );

      // Sort by mutual connections, then by name
      const sortedResults = uniqueResults.sort((a, b) => {
        if (b.mutualConnections !== a.mutualConnections) {
          return b.mutualConnections - a.mutualConnections;
        }
        return a.name.localeCompare(b.name);
      });

      console.log('✅ Final results:', sortedResults.length);
      return sortedResults.slice(0, 20); // Limit to 20 results

    } catch (error) {
      console.error('❌ Error in searchUsers:', error);
      return [];
    }
  }, [userId, friends]);

  // Simple suggested users (users who are not friends)
  const fetchSuggestedUsers = useCallback(async () => {
    if (!userId) return;

    try {
      // Get random users who are not friends and not in pending requests
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, profile_photo, bio, username')
        .neq('id', userId)
        .limit(10);

      if (!profiles || profiles.length === 0) {
        setSuggestedUsers([]);
        return;
      }

      // Filter out friends and pending requests
      const filteredProfiles = profiles.filter(profile => {
        const isFriend = friends.some(f => f.friendId === profile.id);
        const hasPendingSent = sentRequests.some(r => r.receiverId === profile.id);
        const hasPendingReceived = receivedRequests.some(r => r.senderId === profile.id);
        return !isFriend && !hasPendingSent && !hasPendingReceived;
      });

      const suggested = filteredProfiles.map(profile => ({
        id: profile.id,
        name: profile.name || profile.username || 'Unknown',
        photo: profile.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
        bio: profile.bio || '',
        mutualConnections: 0,
      }));

      setSuggestedUsers(suggested);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
      setSuggestedUsers([]);
    }
  }, [userId, friends, sentRequests, receivedRequests]);

  // Send friend request
  const sendFriendRequest = useCallback(async (receiverId: string): Promise<boolean> => {
    if (!userId) return false;

    // Check if request already exists
    const { data: existing } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('sender_id', userId)
      .eq('receiver_id', receiverId)
      .eq('status', 'pending')
      .single();

    if (existing) {
      toast({ title: 'Friend request already sent!', variant: 'default' });
      return false;
    }

    const { error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: userId,
        receiver_id: receiverId,
        status: 'pending'
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

  // Check if user is already a friend or has pending request
  const getRelationshipStatus = useCallback((userId: string): 'friend' | 'pending_sent' | 'pending_received' | 'none' => {
    if (friends.some(f => f.friendId === userId)) return 'friend';
    if (sentRequests.some(r => r.receiverId === userId)) return 'pending_sent';
    if (receivedRequests.some(r => r.senderId === userId)) return 'pending_received';
    return 'none';
  }, [friends, sentRequests, receivedRequests]);

  // Initial fetch
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
