import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  mutualConnections?: number;
}

export function useFriends(userId?: string) {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch friends
  const fetchFriends = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
      
      if (error) {
        console.error('Error fetching friends:', error);
        return;
      }

      const friendIds = data?.map(f => f.user1_id === userId ? f.user2_id : f.user1_id) || [];
      
      if (friendIds.length === 0) {
        setFriends([]);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, profile_photo, bio')
        .in('id', friendIds);

      const friendsList: Friendship[] = (data || []).map(f => {
        const friendId = f.user1_id === userId ? f.user2_id : f.user1_id;
        const profile = profiles?.find(p => p.id === friendId);
        return {
          id: f.id,
          friendId,
          friendName: profile?.name || 'Unknown User',
          friendPhoto: profile?.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friendId}`,
          createdAt: f.created_at,
        };
      });

      setFriends(friendsList);
    } catch (error) {
      console.error('Error in fetchFriends:', error);
    }
  }, [userId]);

  // Fetch friend requests
  const fetchRequests = useCallback(async () => {
    if (!userId) return;
    
    try {
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

      // Fetch profiles
      const senderIds = received?.map(r => r.sender_id) || [];
      const receiverIds = sent?.map(r => r.receiver_id) || [];
      const allIds = [...new Set([...senderIds, ...receiverIds])];

      let profiles: any[] = [];
      if (allIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, name, profile_photo, bio')
          .in('id', allIds);
        profiles = profileData || [];
      }

      const receivedRequestsList: FriendRequest[] = (received || []).map(r => {
        const profile = profiles.find(p => p.id === r.sender_id);
        return {
          id: r.id,
          senderId: r.sender_id,
          receiverId: r.receiver_id,
          status: r.status as 'pending' | 'accepted' | 'declined',
          createdAt: r.created_at,
          senderProfile: {
            id: r.sender_id,
            name: profile?.name || 'Unknown User',
            photo: profile?.profile_photo || 
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.sender_id}`,
          },
        };
      });

      const sentRequestsList: FriendRequest[] = (sent || []).map(r => {
        const profile = profiles.find(p => p.id === r.receiver_id);
        return {
          id: r.id,
          senderId: r.sender_id,
          receiverId: r.receiver_id,
          status: r.status as 'pending' | 'accepted' | 'declined',
          createdAt: r.created_at,
          receiverProfile: {
            id: r.receiver_id,
            name: profile?.name || 'Unknown User',
            photo: profile?.profile_photo || 
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.receiver_id}`,
          },
        };
      });

      setReceivedRequests(receivedRequestsList);
      setSentRequests(sentRequestsList);
    } catch (error) {
      console.error('Error in fetchRequests:', error);
    }
  }, [userId]);

  // SIMPLE SEARCH - Searches name and bio
  const searchUsers = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!query.trim() || query.length < 2 || !userId) {
      return [];
    }

    try {
      console.log(`🔍 Searching for: "${query}"`);
      
      // Search in name and bio fields
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, profile_photo, bio')
        .neq('id', userId) // Exclude current user
        .or(`name.ilike.%${query}%,bio.ilike.%${query}%`)
        .limit(20);

      if (error) {
        console.error('Search error:', error);
        return [];
      }

      if (!profiles || profiles.length === 0) {
        console.log('No users found');
        return [];
      }

      console.log(`Found ${profiles.length} users`);

      // Get mutual connections for each result
      const results = await Promise.all(
        profiles.map(async (profile) => {
          let mutualConnections = 0;
          
          try {
            if (friends.length > 0) {
              // Get this user's friends
              const { data: userFriends } = await supabase
                .from('friendships')
                .select('user1_id, user2_id')
                .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`);
              
              if (userFriends && userFriends.length > 0) {
                const userFriendIds = userFriends.map(f => 
                  f.user1_id === profile.id ? f.user2_id : f.user1_id
                );
                
                mutualConnections = userFriendIds.filter(friendId => 
                  friends.some(f => f.friendId === friendId)
                ).length;
              }
            }
          } catch (error) {
            console.error('Error calculating mutual connections:', error);
          }

          return {
            id: profile.id,
            name: profile.name || 'Unknown User',
            photo: profile.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
            bio: profile.bio || '',
            mutualConnections,
          };
        })
      );

      // Sort by mutual connections (highest first), then by name
      return results.sort((a, b) => {
        if (b.mutualConnections !== a.mutualConnections) {
          return b.mutualConnections - a.mutualConnections;
        }
        return a.name.localeCompare(b.name);
      });

    } catch (error) {
      console.error('Error in searchUsers:', error);
      return [];
    }
  }, [userId, friends]);

  // Fetch ALL users for suggestions
  const fetchSuggestedUsers = useCallback(async () => {
    if (!userId) return;

    try {
      console.log('Fetching all users for suggestions...');
      
      // Get ALL users from database except current user
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, profile_photo, bio')
        .neq('id', userId)
        .order('created_at', { ascending: false })
        .limit(50); // Limit to 50 most recent users

      if (error) {
        console.error('Error fetching users:', error);
        setSuggestedUsers([]);
        return;
      }

      if (!profiles || profiles.length === 0) {
        console.log('No other users in database');
        setSuggestedUsers([]);
        return;
      }

      console.log(`Total users in database: ${profiles.length}`);

      // Get current user's friends
      const { data: userFriendships } = await supabase
        .from('friendships')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      const friendIds = userFriendships?.map(conn => 
        conn.user1_id === userId ? conn.user2_id : conn.user1_id
      ) || [];

      console.log(`Current user has ${friendIds.length} friends`);

      // Get pending requests
      const { data: pendingRequests } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id')
        .eq('status', 'pending')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

      const pendingIds = pendingRequests?.map(req => 
        req.sender_id === userId ? req.receiver_id : req.sender_id
      ) || [];

      console.log(`Current user has ${pendingIds.length} pending requests`);

      // Filter out friends and pending requests
      const availableUsers = profiles.filter(profile => {
        const isFriend = friendIds.includes(profile.id);
        const isPending = pendingIds.includes(profile.id);
        const isAvailable = !isFriend && !isPending;
        
        if (!isAvailable) {
          console.log(`Excluding ${profile.name}: friend=${isFriend}, pending=${isPending}`);
        }
        
        return isAvailable;
      });

      console.log(`Available users for suggestions: ${availableUsers.length}`);

      if (availableUsers.length === 0) {
        setSuggestedUsers([]);
        return;
      }

      // Get mutual connections for each user
      const suggestions = await Promise.all(
        availableUsers.slice(0, 20).map(async (profile) => {
          let mutualConnections = 0;
          
          try {
            if (friendIds.length > 0) {
              // Get this user's friends
              const { data: userFriends } = await supabase
                .from('friendships')
                .select('user1_id, user2_id')
                .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`);
              
              if (userFriends && userFriends.length > 0) {
                const userFriendIds = userFriends.map(f => 
                  f.user1_id === profile.id ? f.user2_id : f.user1_id
                );
                
                mutualConnections = userFriendIds.filter(friendId => 
                  friendIds.includes(friendId)
                ).length;
              }
            }
          } catch (error) {
            console.error(`Error calculating mutual for ${profile.name}:`, error);
          }

          return {
            id: profile.id,
            name: profile.name || 'Unknown User',
            photo: profile.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
            bio: profile.bio || '',
            mutualConnections,
          };
        })
      );

      // Sort suggestions by:
      // 1. Mutual connections (highest first)
      // 2. Most recent users first
      const sortedSuggestions = suggestions.sort((a, b) => {
        if (b.mutualConnections !== a.mutualConnections) {
          return b.mutualConnections - a.mutualConnections;
        }
        return 0; // Already sorted by created_at in the query
      });

      console.log(`Setting ${Math.min(sortedSuggestions.length, 10)} suggested users`);
      setSuggestedUsers(sortedSuggestions.slice(0, 10));

    } catch (error) {
      console.error('Error in fetchSuggestedUsers:', error);
      setSuggestedUsers([]);
    }
  }, [userId]);

  // Send friend request
  const sendFriendRequest = useCallback(async (receiverId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      // Check if request already exists
      const { data: existing } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('sender_id', userId)
        .eq('receiver_id', receiverId)
        .eq('status', 'pending')
        .single();

      if (existing) {
        toast({ title: 'Friend request already sent!' });
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
        toast({ title: 'Failed to send request', variant: 'destructive' });
        return false;
      }

      toast({ title: 'Friend request sent!' });
      await Promise.all([fetchRequests(), fetchSuggestedUsers()]);
      return true;
    } catch (error) {
      console.error('Error in sendFriendRequest:', error);
      toast({ title: 'Failed to send request', variant: 'destructive' });
      return false;
    }
  }, [userId, fetchRequests, fetchSuggestedUsers, toast]);

  // Accept friend request
  const acceptFriendRequest = useCallback(async (requestId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('accept_friend_request', { request_id: requestId });

      if (error) {
        console.error('Error accepting friend request:', error);
        toast({ title: 'Failed to accept request', variant: 'destructive' });
        return false;
      }

      toast({ title: 'Friend request accepted!' });
      await Promise.all([fetchFriends(), fetchRequests(), fetchSuggestedUsers()]);
      return true;
    } catch (error) {
      console.error('Error in acceptFriendRequest:', error);
      toast({ title: 'Failed to accept request', variant: 'destructive' });
      return false;
    }
  }, [fetchFriends, fetchRequests, fetchSuggestedUsers, toast]);

  // Decline friend request
  const declineFriendRequest = useCallback(async (requestId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) {
        console.error('Error declining friend request:', error);
        toast({ title: 'Failed to decline request', variant: 'destructive' });
        return false;
      }

      toast({ title: 'Friend request declined' });
      await fetchRequests();
      return true;
    } catch (error) {
      console.error('Error in declineFriendRequest:', error);
      toast({ title: 'Failed to decline request', variant: 'destructive' });
      return false;
    }
  }, [fetchRequests, toast]);

  // Cancel sent request
  const cancelFriendRequest = useCallback(async (requestId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId);

      if (error) {
        console.error('Error cancelling friend request:', error);
        toast({ title: 'Failed to cancel request', variant: 'destructive' });
        return false;
      }

      toast({ title: 'Friend request cancelled' });
      await Promise.all([fetchRequests(), fetchSuggestedUsers()]);
      return true;
    } catch (error) {
      console.error('Error in cancelFriendRequest:', error);
      toast({ title: 'Failed to cancel request', variant: 'destructive' });
      return false;
    }
  }, [fetchRequests, fetchSuggestedUsers, toast]);

  // Get relationship status
  const getRelationshipStatus = useCallback((targetUserId: string): 'friend' | 'pending_sent' | 'pending_received' | 'none' => {
    if (friends.some(f => f.friendId === targetUserId)) return 'friend';
    if (sentRequests.some(r => r.receiverId === targetUserId)) return 'pending_sent';
    if (receivedRequests.some(r => r.senderId === targetUserId)) return 'pending_received';
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
      try {
        await Promise.all([
          fetchFriends(),
          fetchRequests(),
          fetchSuggestedUsers()
        ]);
      } catch (error) {
        console.error('Error loading friend data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Realtime subscriptions
    const friendRequestsChannel = supabase
      .channel('friend-requests')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friend_requests',
        filter: `receiver_id=eq.${userId}`,
      }, () => {
        fetchRequests();
      })
      .subscribe();

    const friendshipsChannel = supabase
      .channel('friendships')
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
    searchUsers,
    getRelationshipStatus,
    refetch: () => Promise.all([fetchFriends(), fetchRequests(), fetchSuggestedUsers()]),
  };
}
