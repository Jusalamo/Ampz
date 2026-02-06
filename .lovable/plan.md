
# Comprehensive Check-In Flow & Real-Time Features Implementation Plan

## Overview

This plan addresses the core user flow issues and implements proper real-time database integration for:
1. **Complete Event Check-In Flow** - QR scan → Geofence verification → Privacy choice → Live photo (if public) → Navigate to Connect page
2. **Real-Time Event Manager Dashboard** - Live attendee updates when users check in
3. **User Search in Quick Add** - Proper fuzzy search filter for finding and adding friends
4. **WebSocket-based Chat** - Real-time messaging between matched users

---

## Phase 1: Fix the Check-In Flow (Critical)

### Current Problem
The check-in flow is stuck between "checking location" and "choose visibility" states. After selecting public mode, it incorrectly shows "Check-in failed" instead of proceeding to the Connect page.

### Root Cause Analysis
The `QRScannerModal.tsx` correctly validates geofence and shows privacy choice, but:
1. The `completeCheckIn` function may fail silently due to database column issues
2. No live photo capture step exists for public profiles
3. Navigation to `/connect` happens but the flow state isn't properly managed

### Solution

**A. Add Live Photo Capture Step for Public Mode**

Add new step type `photo_capture` between `privacy_choice` and `checking_in`:

```text
Flow:
1. scan → Scan QR code
2. verifying → Validate event exists and is active
3. geofence_check → Verify user is within geofence (ONE TIME)
4. privacy_choice → User chooses public or private
5. photo_capture → (PUBLIC ONLY) Capture live photo for connection profile
6. checking_in → Execute check-in with cached location
7. success → Show confirmation
   - If public: Auto-navigate to /connect after 1.5s
   - If private: Show "Welcome to [Event]!" and close
```

**B. Update QRScannerModal.tsx**

- Add `photo_capture` step with camera interface
- Cache the captured photo in state
- Pass photo to `processCheckIn` for match profile creation
- Add `geofenceCheckComplete` flag to prevent re-verification loops
- Fix state transitions to be one-directional

**C. Update useCheckIn.ts**

- Add `connectionPhoto` parameter to `processCheckIn` function
- Update `match_profiles` insert to include the live photo
- Ensure the check-in insert uses correct column names (`check_in_latitude`, `check_in_longitude`)
- Return proper success/error states

### Files to Modify
- `src/components/modals/QRScannerModal.tsx`
- `src/hooks/useCheckIn.ts`

---

## Phase 2: Real-Time Event Manager Dashboard

### Current Problem
When attendees check in, the Event Manager dashboard doesn't update in real-time. Organizers can't see live arrival data.

### Solution

**A. Add Real-Time Check-In Subscription**

In `EventManager.tsx`, subscribe to the `check_ins` table for the organizer's events:

```typescript
useEffect(() => {
  if (!userEvents.length) return;
  
  const eventIds = userEvents.map(e => e.id);
  
  const channel = supabase
    .channel('organizer-checkins')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'check_ins',
    }, async (payload) => {
      const checkIn = payload.new;
      
      // Check if this check-in is for one of our events
      if (eventIds.includes(checkIn.event_id)) {
        // Fetch the user's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, profile_photo')
          .eq('id', checkIn.user_id)
          .single();
        
        // Update local attendee count
        setAttendeeData(prev => ({
          ...prev,
          [checkIn.event_id]: {
            count: (prev[checkIn.event_id]?.count || 0) + 1,
            recent: [
              { 
                id: checkIn.id,
                name: profile?.name || 'Someone',
                photo: profile?.profile_photo,
                time: checkIn.checked_in_at
              },
              ...(prev[checkIn.event_id]?.recent || []).slice(0, 9)
            ]
          }
        }));
        
        // Show toast notification
        toast({
          title: '🎉 New Check-in!',
          description: `${profile?.name || 'Someone'} just arrived`,
        });
      }
    })
    .subscribe();
  
  return () => supabase.removeChannel(channel);
}, [userEvents]);
```

**B. Create Attendee Data Hook**

Create `src/hooks/useEventAttendees.ts` (or update existing):

```typescript
export function useEventAttendees(eventId?: string) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch initial attendees from check_ins
  useEffect(() => {
    if (!eventId) return;
    
    const fetchAttendees = async () => {
      const { data, error } = await supabase
        .from('check_ins')
        .select(`
          id,
          user_id,
          checked_in_at,
          visibility_mode,
          profiles!check_ins_user_id_fkey(name, profile_photo, email)
        `)
        .eq('event_id', eventId)
        .order('checked_in_at', { ascending: false });
      
      if (data) {
        setAttendees(data.map(c => ({
          id: c.id,
          userId: c.user_id,
          name: c.profiles?.name || 'Unknown',
          photo: c.profiles?.profile_photo || '/default-avatar.png',
          email: c.profiles?.email,
          checkedInAt: c.checked_in_at,
          isPublic: c.visibility_mode === 'public'
        })));
      }
      setIsLoading(false);
    };
    
    fetchAttendees();
  }, [eventId]);
  
  // Real-time subscription
  useEffect(() => {
    if (!eventId) return;
    
    const channel = supabase
      .channel(`attendees-${eventId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'check_ins',
        filter: `event_id=eq.${eventId}`
      }, async (payload) => {
        // Fetch profile for new check-in
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, profile_photo, email')
          .eq('id', payload.new.user_id)
          .single();
        
        setAttendees(prev => [{
          id: payload.new.id,
          userId: payload.new.user_id,
          name: profile?.name || 'Unknown',
          photo: profile?.profile_photo || '/default-avatar.png',
          email: profile?.email,
          checkedInAt: payload.new.checked_in_at,
          isPublic: payload.new.visibility_mode === 'public'
        }, ...prev]);
      })
      .subscribe();
    
    return () => supabase.removeChannel(channel);
  }, [eventId]);
  
  return { attendees, isLoading };
}
```

### Files to Modify
- `src/pages/EventManager.tsx` - Add real-time subscription and live attendee list
- `src/hooks/useEventAttendees.ts` - Update with real-time capabilities

---

## Phase 3: Fix User Search in Quick Add (Social Page)

### Current Problem
The search in the Quick Add section doesn't properly query the database for other users. Results don't appear correctly when typing.

### Solution

**A. Update useFriends.ts `searchUsers` Function**

The current implementation looks correct but needs to be tested and potentially refined:

```typescript
const searchUsers = useCallback(async (query: string): Promise<SuggestedUser[]> => {
  if (!query || query.length < 2 || !userId) return [];

  try {
    // Use ilike for fuzzy matching across multiple fields
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

    // Filter out existing friends and pending requests
    const friendIds = friends.map(f => f.friendId);
    const sentRequestIds = sentRequests.map(r => r.receiverId);
    const receivedRequestIds = receivedRequests.map(r => r.senderId);
    
    const filteredData = data?.filter(p => 
      !friendIds.includes(p.id) &&
      !sentRequestIds.includes(p.id) &&
      !receivedRequestIds.includes(p.id)
    ) || [];

    return filteredData.map(p => ({
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
}, [userId, friends, sentRequests, receivedRequests]);
```

**B. Fix Social.tsx Search Implementation**

Ensure the debounced search properly triggers:

```typescript
// Debounced search in add friends sheet
useEffect(() => {
  if (sheetSearchQuery.length === 0) {
    setSearchResults(suggestedUsers);
    return;
  }

  if (sheetSearchQuery.length < 2) {
    setSearchResults([]);
    return;
  }

  const timer = setTimeout(async () => {
    setIsSearching(true);
    try {
      const results = await searchUsers(sheetSearchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 300); // 300ms debounce

  return () => clearTimeout(timer);
}, [sheetSearchQuery, searchUsers, suggestedUsers]);
```

**C. Verify RLS Policies**

The `profiles` table currently only allows users to read their own profile. We need a view or policy update to allow searching other profiles:

```sql
-- Add policy to allow authenticated users to search profiles
CREATE POLICY "Users can search profiles" ON profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
  );
```

However, looking at the existing code, it uses `profiles_public` view which should be accessible. Verify this view has proper access.

### Files to Modify
- `src/hooks/useFriends.ts` - Verify search function works correctly
- `src/pages/Social.tsx` - Fix debounce and search result display
- Database migration (if needed) - Update RLS for profile search

---

## Phase 4: Real-Time WebSocket Chat

### Current Problem
Chat messages are hardcoded/mock data. Need real-time messaging via Supabase.

### Solution

**A. Enable Realtime for Messages Table**

Database migration:
```sql
-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
```

**B. Create useMessages Hook**

```typescript
// src/hooks/useMessages.ts
export function useMessages(matchId: string, userId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch existing messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('sent_at', { ascending: true });
      
      if (data) setMessages(data);
      setIsLoading(false);
    };
    
    fetchMessages();
  }, [matchId]);
  
  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
        
        // Mark as read if we're the receiver
        if (payload.new.receiver_id === userId) {
          markMessageAsRead(payload.new.id);
        }
      })
      .subscribe();
    
    return () => supabase.removeChannel(channel);
  }, [matchId, userId]);
  
  // Send message function
  const sendMessage = async (content: string) => {
    const { data: match } = await supabase
      .from('matches')
      .select('user1_id, user2_id')
      .eq('id', matchId)
      .single();
    
    const receiverId = match?.user1_id === userId 
      ? match?.user2_id 
      : match?.user1_id;
    
    const { error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: userId,
        receiver_id: receiverId,
        content,
        message_type: 'text',
        is_read: false,
      });
    
    return !error;
  };
  
  return { messages, isLoading, sendMessage };
}
```

**C. Update Chats.tsx**

Replace mock messages with real database queries and real-time subscription.

### Files to Create
- `src/hooks/useMessages.ts`

### Files to Modify
- `src/pages/Chats.tsx` - Use real messages from database
- Database migration - Enable realtime for messages

---

## Phase 5: Connect Page - Show Event Profiles

### Current Problem
The Connect page shows connection profiles but isn't properly filtered to the event the user just checked into.

### Solution

**A. Update Connect.tsx**

After public check-in, the user should see other public profiles at the SAME event:

```typescript
// Get match profiles for the current event
const [eventProfiles, setEventProfiles] = useState<ConnectionProfile[]>([]);

useEffect(() => {
  const fetchEventProfiles = async () => {
    // Get the user's most recent public check-in
    const { data: checkIn } = await supabase
      .from('check_ins')
      .select('event_id')
      .eq('user_id', user?.id)
      .eq('visibility_mode', 'public')
      .order('checked_in_at', { ascending: false })
      .limit(1)
      .single();
    
    if (!checkIn) return;
    
    // Get other public profiles at this event
    const { data: profiles } = await supabase
      .from('match_profiles')
      .select('*')
      .eq('event_id', checkIn.event_id)
      .eq('is_public', true)
      .eq('is_active', true)
      .neq('user_id', user?.id);
    
    if (profiles) {
      setEventProfiles(profiles.map(p => ({
        id: p.id,
        userId: p.user_id,
        eventId: p.event_id,
        name: p.display_name,
        age: p.age,
        bio: p.bio || '',
        interests: p.interests || [],
        photo: p.profile_photos?.[0] || '/default-avatar.png',
        location: p.location || '',
        isPublic: true,
        occupation: p.occupation,
        gender: p.gender,
      })));
    }
  };
  
  if (user?.id) fetchEventProfiles();
}, [user?.id]);
```

### Files to Modify
- `src/pages/Connect.tsx` - Fetch real match profiles from database

---

## Technical Details

### Database Schema Verification

The existing tables are correctly structured:
- `check_ins` - Has `check_in_latitude`, `check_in_longitude`, `visibility_mode`
- `match_profiles` - Has `profile_photos` array, `event_id`, `is_public`
- `messages` - Has `match_id`, `sender_id`, `receiver_id`, `content`
- `friendships` and `friend_requests` - Properly structured

### Required Database Migrations

```sql
-- 1. Enable realtime for messages (if not already)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 2. Create a view for searchable profiles (if profiles RLS is too restrictive)
CREATE OR REPLACE VIEW profiles_searchable AS
SELECT 
  id,
  name,
  profile_photo,
  bio
FROM profiles
WHERE id != auth.uid();

-- Enable RLS on view
ALTER VIEW profiles_searchable OWNER TO authenticated;
```

### State Flow Diagram

```text
QR Check-In Flow:

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌────────┐   ┌──────────┐   ┌──────────────┐   ┌────────────┐ │
│  │  Scan  │──▶│ Verifying│──▶│Geofence Check│──▶│Privacy Mode│ │
│  └────────┘   └──────────┘   └──────────────┘   └────────────┘ │
│                                     │                   │       │
│                                     │ (fail)            │       │
│                                     ▼                   │       │
│                              ┌──────────────┐           │       │
│                              │Outside Fence │           │       │
│                              │ + Retry Btn  │           │       │
│                              └──────────────┘           │       │
│                                                         │       │
│                              ┌─────────────────────────┬┘       │
│                              ▼ (public)                │        │
│                        ┌────────────┐           (private)       │
│                        │Photo Capture│                │         │
│                        └────────────┘                 │         │
│                              │                        │         │
│                              ▼                        ▼         │
│                        ┌────────────┐          ┌────────────┐   │
│                        │Checking In │          │Checking In │   │
│                        └────────────┘          └────────────┘   │
│                              │                        │         │
│                              ▼                        ▼         │
│                        ┌────────────┐          ┌────────────┐   │
│                        │  Success   │          │  Success   │   │
│                        │Navigate to │          │Show Welcome│   │
│                        │  /connect  │          │  + Close   │   │
│                        └────────────┘          └────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Order

| Priority | Phase | Description | Files |
|----------|-------|-------------|-------|
| 1 | Phase 1 | Fix Check-In Flow | `QRScannerModal.tsx`, `useCheckIn.ts` |
| 2 | Phase 3 | Fix User Search | `useFriends.ts`, `Social.tsx` |
| 3 | Phase 2 | Real-Time Event Manager | `EventManager.tsx`, `useEventAttendees.ts` |
| 4 | Phase 5 | Connect Page Profiles | `Connect.tsx` |
| 5 | Phase 4 | Real-Time Chat | `Chats.tsx`, new `useMessages.ts` |

---

## Files Summary

### Files to Create
1. `src/hooks/useMessages.ts` - Real-time chat hook

### Files to Modify
1. `src/components/modals/QRScannerModal.tsx` - Add photo capture step, fix flow
2. `src/hooks/useCheckIn.ts` - Add connectionPhoto parameter
3. `src/pages/EventManager.tsx` - Add real-time check-in subscription
4. `src/hooks/useEventAttendees.ts` - Add real-time updates
5. `src/hooks/useFriends.ts` - Fix search filtering
6. `src/pages/Social.tsx` - Fix debounced search
7. `src/pages/Connect.tsx` - Fetch real event profiles
8. `src/pages/Chats.tsx` - Use real messages

### Database Migrations
- Enable realtime for messages table (if not already enabled)

---

## Testing Checklist

- [ ] Scan QR code at event venue
- [ ] Verify geofence check passes when within radius
- [ ] Choose "Public" mode and capture live photo
- [ ] Confirm check-in success message appears
- [ ] Auto-navigate to Connect page after public check-in
- [ ] See other public profiles at the same event
- [ ] Swipe right and create a match
- [ ] Navigate to chat and send real-time message
- [ ] Event Manager shows new check-in in real-time
- [ ] Search for users in Quick Add by name
- [ ] Send friend request and see it appear for recipient
