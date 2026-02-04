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
  const { toast } = useToast();

  // Fetch friends
  const fetchFriends = useCallback(async () => {
    if (!userId) return;
    
    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
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

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, profile_photo, bio')
      .in('id', friendIds);

    if (profilesError) {
      console.error('Error fetching friend profiles:', profilesError);
      return;
    }

    const friendsList: Friendship[] = data.map(f => {
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
  }, [userId]);

  // Fetch friend requests
  const fetchRequests = useCallback(async () => {
    if (!userId) return;
    
    try {
      // Fetch received requests
      const { data: received, error: receivedError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (receivedError) {
        console.error('Error fetching received requests:', receivedError);
      }

      // Fetch sent requests
      const { data: sent, error: sentError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('sender_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (sentError) {
        console.error('Error fetching sent requests:', sentError);
      }

      // Fetch profiles for senders/receivers
      const senderIds = received?.map(r => r.sender_id) || [];
      const receiverIds = sent?.map(r => r.receiver_id) || [];
      const allIds = [...new Set([...senderIds, ...receiverIds])];

      let profiles: any[] = [];
      if (allIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, profile_photo, bio')
          .in('id', allIds);
        
        if (profileError) {
          console.error('Error fetching profiles:', profileError);
        } else {
          profiles = profileData || [];
        }
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

  // Search users from database
  const searchUsers = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!query.trim() || query.length < 2 || !userId) {
      return [];
    }

    try {
      console.log('🔍 Searching for:', query);
      
      // Use the database function to search users
      const { data: users, error } = await supabase
        .rpc('search_all_users', {
          search_query: query,
          current_user_id: userId
        });

      if (error) {
        console.error('Error searching users:', error);
        // Fallback to simple profile search
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, profile_photo, bio, username')
          .neq('id', userId)
          .or(`name.ilike.%${query}%,bio.ilike.%${query}%,username.ilike.%${query}%`)
          .limit(20);

        if (!profilesData || profilesData.length === 0) {
          return [];
        }

        const results = await Promise.all(
          profilesData.map(async (profile) => {
            // Get mutual connections
            const { data: mutualCount } = await supabase
              .rpc('get_mutual_connections_count', {
                user1_id: userId,
                user2_id: profile.id
              });

            return {
              id: profile.id,
              name: profile.name || profile.username || 'Unknown User',
              photo: profile.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
              bio: profile.bio || '',
              username: profile.username,
              mutualConnections: mutualCount || 0,
            };
          })
        );

        return results;
      }

      if (!users || users.length === 0) {
        return [];
      }

      console.log('🎯 Users found:', users.length);

      // Get mutual connections for each user
      const results = await Promise.all(
        users.map(async (user: any) => {
          const { data: mutualCount } = await supabase
            .rpc('get_mutual_connections_count', {
              user1_id: userId,
              user2_id: user.id
            });

          return {
            id: user.id,
            name: user.name || user.username || 'Unknown User',
            photo: user.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
            bio: user.bio || '',
            email: user.email,
            username: user.username,
            mutualConnections: mutualCount || 0,
          };
        })
      );

      // Sort by mutual connections, then by name
      const sortedResults = results.sort((a, b) => {
        if (b.mutualConnections !== a.mutualConnections) {
          return b.mutualConnections - a.mutualConnections;
        }
        return a.name.localeCompare(b.name);
      });

      console.log('✅ Final results:', sortedResults.length);
      return sortedResults;

    } catch (error) {
      console.error('❌ Error in searchUsers:', error);
      return [];
    }
  }, [userId]);

  // Fetch suggested users (all users who are not friends or pending)
  const fetchSuggestedUsers = useCallback(async () => {
    if (!userId) return;

    try {
      // Get all users except current user
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, profile_photo, bio, username')
        .neq('id', userId)
        .limit(50); // Increased limit for better suggestions

      if (error) {
        console.error('Error fetching suggested users:', error);
        setSuggestedUsers([]);
        return;
      }

      if (!profiles || profiles.length === 0) {
        setSuggestedUsers([]);
        return;
      }

      // Get current user's connections
      const { data: userConnections } = await supabase
        .from('friendships')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      const friendIds = userConnections?.map(conn => 
        conn.user1_id === userId ? conn.user2_id : conn.user1_id
      ) || [];

      // Get pending requests
      const { data: pendingRequests } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id, status')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'pending');

      const pendingIds = pendingRequests?.map(req => 
        req.sender_id === userId ? req.receiver_id : req.sender_id
      ) || [];

      // Filter out friends and pending requests
      const filteredProfiles = profiles.filter(profile => {
        const isFriend = friendIds.includes(profile.id);
        const isPending = pendingIds.includes(profile.id);
        return !isFriend && !isPending;
      });

      // Get mutual connections for each suggested user
      const suggested = await Promise.all(
        filteredProfiles.slice(0, 20).map(async (profile) => {
          const { data: mutualCount } = await supabase
            .rpc('get_mutual_connections_count', {
              user1_id: userId,
              user2_id: profile.id
            });

          // Count shared events (if you have an events table)
          let sharedEvents = 0;
          try {
            const { data: events } = await supabase
              .from('event_attendees')
              .select('event_id')
              .eq('user_id', userId);

            const { data: otherEvents } = await supabase
              .from('event_attendees')
              .select('event_id')
              .eq('user_id', profile.id);

            if (events && otherEvents) {
              const eventIds = events.map(e => e.event_id);
              const otherEventIds = otherEvents.map(e => e.event_id);
              sharedEvents = eventIds.filter(id => otherEventIds.includes(id)).length;
            }
          } catch (eventError) {
            // Event tracking might not be implemented yet
            console.log('Event tracking not available');
          }

          return {
            id: profile.id,
            name: profile.name || profile.username || 'Unknown User',
            photo: profile.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
            bio: profile.bio || '',
            username: profile.username,
            mutualConnections: mutualCount || 0,
            sharedEvents,
          };
        })
      );

      // Sort by mutual connections and shared events
      const sortedSuggested = suggested.sort((a, b) => {
        if (b.mutualConnections !== a.mutualConnections) {
          return b.mutualConnections - a.mutualConnections;
        }
        if (b.sharedEvents !== a.sharedEvents) {
          return b.sharedEvents - a.sharedEvents;
        }
        return a.name.localeCompare(b.name);
      });

      setSuggestedUsers(sortedSuggested.slice(0, 10)); // Show top 10 suggestions
    } catch (error) {
      console.error('Error fetching suggested users:', error);
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
        toast({ 
          title: 'Friend request already sent!', 
          description: 'You have already sent a request to this user.',
          variant: 'default' 
        });
        return false;
      }

      // Check if already friends
      const { data: existingFriendship } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user1_id.eq.${userId},user2_id.eq.${receiverId}),and(user1_id.eq.${receiverId},user2_id.eq.${userId})`)
        .single();

      if (existingFriendship) {
        toast({ 
          title: 'Already friends!', 
          description: 'You are already friends with this user.',
          variant: 'default' 
        });
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
        toast({ 
          title: 'Failed to send request', 
          description: 'Please try again later.',
          variant: 'destructive' 
        });
        return false;
      }

      toast({ 
        title: 'Friend request sent!', 
        description: 'They will be notified of your request.',
        variant: 'default' 
      });

      // Refresh data
      await Promise.all([fetchRequests(), fetchSuggestedUsers()]);
      return true;
    } catch (error) {
      console.error('Error in sendFriendRequest:', error);
      toast({ 
        title: 'Failed to send request', 
        description: 'An unexpected error occurred.',
        variant: 'destructive' 
      });
      return false;
    }
  }, [userId, fetchRequests, fetchSuggestedUsers, toast]);

  // Accept friend request
  const acceptFriendRequest = useCallback(async (requestId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('accept_friend_request', { request_id: requestId });

      if (error) {
        console.error('Error accepting friend request:', error);
        toast({ 
          title: 'Failed to accept request', 
          description: 'Please try again later.',
          variant: 'destructive' 
        });
        return false;
      }

      toast({ 
        title: 'Friend request accepted!', 
        description: 'You are now friends.',
        variant: 'default' 
      });

      await Promise.all([fetchFriends(), fetchRequests(), fetchSuggestedUsers()]);
      return true;
    } catch (error) {
      console.error('Error in acceptFriendRequest:', error);
      toast({ 
        title: 'Failed to accept request', 
        description: 'An unexpected error occurred.',
        variant: 'destructive' 
      });
      return false;
    }
  }, [fetchFriends, fetchRequests, fetchSuggestedUsers, toast]);

  // Decline friend request
  const declineFriendRequest = useCallback(async (requestId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ 
          status: 'declined', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error declining friend request:', error);
        toast({ 
          title: 'Failed to decline request', 
          description: 'Please try again later.',
          variant: 'destructive' 
        });
        return false;
      }

      toast({ 
        title: 'Friend request declined', 
        variant: 'default' 
      });

      await fetchRequests();
      return true;
    } catch (error) {
      console.error('Error in declineFriendRequest:', error);
      toast({ 
        title: 'Failed to decline request', 
        description: 'An unexpected error occurred.',
        variant: 'destructive' 
      });
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
        toast({ 
          title: 'Failed to cancel request', 
          description: 'Please try again later.',
          variant: 'destructive' 
        });
        return false;
      }

      toast({ 
        title: 'Friend request cancelled', 
        variant: 'default' 
      });

      await Promise.all([fetchRequests(), fetchSuggestedUsers()]);
      return true;
    } catch (error) {
      console.error('Error in cancelFriendRequest:', error);
      toast({ 
        title: 'Failed to cancel request', 
        description: 'An unexpected error occurred.',
        variant: 'destructive' 
      });
      return false;
    }
  }, [fetchRequests, fetchSuggestedUsers, toast]);

  // Remove friend
  const removeFriend = useCallback(async (friendshipId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) {
        console.error('Error removing friend:', error);
        toast({ 
          title: 'Failed to remove friend', 
          description: 'Please try again later.',
          variant: 'destructive' 
        });
        return false;
      }

      toast({ 
        title: 'Friend removed', 
        variant: 'default' 
      });

      await Promise.all([fetchFriends(), fetchSuggestedUsers()]);
      return true;
    } catch (error) {
      console.error('Error in removeFriend:', error);
      toast({ 
        title: 'Failed to remove friend', 
        description: 'An unexpected error occurred.',
        variant: 'destructive' 
      });
      return false;
    }
  }, [fetchFriends, fetchSuggestedUsers, toast]);

  // Check if user is already a friend or has pending request
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
        await Promise.all([fetchFriends(), fetchRequests(), fetchSuggestedUsers()]);
      } catch (error) {
        console.error('Error loading friend data:', error);
      } finally {
        setIsLoading(false);
      }
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
