
# Comprehensive Fix Plan: Real-Time Database Integration & Check-In Flow

## Overview
This plan addresses all critical build errors, removes mock data dependencies, fixes the check-in flow, implements WebSocket real-time chat, and converts remaining files to semantic Tailwind CSS.

---

## Phase 1: Fix Critical Build Errors

### 1.1 Fix `useCheckIn.ts` - Database Column Mismatch

**Problem**: The code uses `check_in_location` but the table has `check_in_latitude` and `check_in_longitude`

**File**: `src/hooks/useCheckIn.ts`

**Changes** (Lines 203-214):
```typescript
// BEFORE (incorrect)
.insert({
  user_id: userId,
  event_id: event.id,
  visibility_mode: visibilityMode,
  check_in_location: `POINT(${location.longitude} ${location.latitude})`,
  ...
})

// AFTER (correct - matching database schema)
.insert({
  event_id: event.id,
  visibility_mode: visibilityMode,
  verification_method: 'geolocation',
  check_in_latitude: location.latitude,
  check_in_longitude: location.longitude,
  within_geofence: true,
  distance_from_venue: calculateDistance(
    location.latitude,
    location.longitude,
    event.coordinates.lat,
    event.coordinates.lng
  ),
  checked_in_at: new Date().toISOString(),
})
```

**Remove**: Line 229 - The `increment_event_attendees` RPC call (function doesn't exist, use direct update instead)

### 1.2 Fix `useFriends.ts` - Remove `username` Column References

**Problem**: The `profiles` table doesn't have a `username` column

**File**: `src/hooks/useFriends.ts`

**Changes**:
- Remove `username` from all `.select()` queries (lines 166, 286)
- Remove `username` from search filter `.or()` clause
- Add missing `toast` import from `@/hooks/use-toast`
- Handle RPC function gracefully (it exists but may have different return type)

### 1.3 Fix `EventManager.tsx` - Event Type Properties

**Problem**: TypeScript errors with `duration` property and `payload.new` type casting

**File**: `src/pages/EventManager.tsx`

**Changes**:
- Add `duration?: number` to Event type in `src/lib/types.ts`
- Properly type-cast `payload.new` in the realtime subscription handler
- Remove `duration` from the mapped event or handle it properly

---

## Phase 2: Fix Check-In Flow Loop

### 2.1 Prevent State Loop in QRScannerModal

**Problem**: The flow switches repeatedly between "Checking Location" and "Choose Visibility"

**Root Cause**: The `processQRCode` function is being re-called or state is not being properly locked

**File**: `src/components/modals/QRScannerModal.tsx`

**Solution**:
```text
Flow Fix:
1. Add a `geofenceCheckComplete` boolean flag
2. Once geofence check passes, set flag to true
3. Never re-run geofence check after flag is set
4. Direct transition: scanning → verifying → geofence_check → privacy_choice → checking_in → success
5. Remove any state that could cause loops
```

**Key Changes**:
- Cache geofence result in state to prevent re-verification
- Lock the step progression with explicit transitions
- Ensure `completeCheckIn` is only called once per flow

### 2.2 Fix Public Check-In Navigation

**Problem**: Public check-in shows "failed" instead of navigating to Connect page

**Solution**:
- After successful check-in with `visibility_mode = 'public'`:
  1. Show success briefly (1.5s)
  2. Navigate to `/connect` page
- After successful check-in with `visibility_mode = 'private'`:
  1. Show "Welcome to [Event Name]!" message
  2. User can close modal or view event

---

## Phase 3: Remove All Mock Data Dependencies

### 3.1 Files to Update

| File | Current State | Required Change |
|------|---------------|-----------------|
| `demo-data.ts` | `isDemoUser = false` | Already production-ready, verify no imports leak mock data |
| `AppContext.tsx` | Imports demo data | Remove conditional demo data usage in production flows |
| `useFriends.ts` | Uses DiceBear avatars | Replace with `/default-avatar.png` |
| `Home.tsx` | Hardcoded stats | Use real database queries |
| `Profile.tsx` | Mock metrics | Use real database queries |
| `Social.tsx` | May show demo data | Use only real friend data |

### 3.2 Database-Backed Profile Metrics

**Implementation** (Home.tsx + Profile.tsx):
```typescript
// Real metrics from database
const fetchRealMetrics = async (userId: string) => {
  const [checkIns, matches, profile] = await Promise.all([
    supabase.from('check_ins').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('matches').select('id', { count: 'exact', head: true })
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('status', 'active'),
    supabase.from('profiles').select('likes_remaining, subscription_tier').eq('id', userId).single()
  ]);
  
  return {
    eventsAttended: checkIns.count || 0,
    matches: matches.count || 0,
    likesRemaining: profile.data?.subscription_tier === 'free' 
      ? (profile.data?.likes_remaining ?? 25) 
      : '∞'
  };
};
```

---

## Phase 4: Real-Time WebSocket Chat

### 4.1 Enable Real-Time for Messages Table

**Database Migration**:
```sql
-- Enable realtime for messages table if not already
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
```

### 4.2 Update Chat Component

**File**: `src/pages/Chats.tsx`

**Implementation**:
```typescript
// Subscribe to new messages
useEffect(() => {
  if (!matchId) return;
  
  const channel = supabase
    .channel(`chat:${matchId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `match_id=eq.${matchId}`
    }, (payload) => {
      // Add new message to local state instantly
      setMessages(prev => [...prev, payload.new as Message]);
      // Mark as read if user is viewing
      if (payload.new.receiver_id === userId) {
        markMessageAsRead(payload.new.id);
      }
    })
    .subscribe();
  
  return () => supabase.removeChannel(channel);
}, [matchId, userId]);
```

### 4.3 Typing Indicators

**Implementation**:
- Use Supabase Realtime Presence for typing status
- Debounce typing events (300ms)
- Show "User is typing..." indicator

---

## Phase 5: Friend Location on Map (Foundation)

### 5.1 Database Schema

**Migration**:
```sql
CREATE TABLE IF NOT EXISTS public.user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL UNIQUE,
  latitude DECIMAL NOT NULL,
  longitude DECIMAL NOT NULL,
  accuracy DECIMAL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_visible BOOLEAN DEFAULT false
);

-- RLS Policies
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can update their own location" ON user_locations
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Friends can view visible locations" ON user_locations
  FOR SELECT USING (
    is_visible = true AND 
    user_id IN (
      SELECT CASE WHEN user1_id = auth.uid() THEN user2_id ELSE user1_id END
      FROM friendships
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;
```

### 5.2 New Hook: `useFriendLocations.ts`

```typescript
export function useFriendLocations(userId?: string) {
  const [friendLocations, setFriendLocations] = useState<FriendLocation[]>([]);
  
  useEffect(() => {
    if (!userId) return;
    
    // Initial fetch
    fetchFriendLocations();
    
    // Real-time subscription
    const channel = supabase
      .channel('friend-locations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_locations',
      }, () => {
        fetchFriendLocations();
      })
      .subscribe();
    
    return () => supabase.removeChannel(channel);
  }, [userId]);
  
  return friendLocations;
}
```

---

## Phase 6: Convert to Semantic Tailwind CSS

### 6.1 EventDetail.tsx

**Remove**: Lines 17-56 (DESIGN object)

**Replace inline styles with Tailwind**:
```text
DESIGN.colors.background → bg-background
DESIGN.colors.card → bg-card
DESIGN.colors.primary → text-primary, bg-primary
DESIGN.colors.textPrimary → text-foreground
DESIGN.colors.textSecondary → text-muted-foreground
DESIGN.borderRadius.card → rounded-[24px]
```

### 6.2 EventManager.tsx

**Remove**: Lines 212-248 (DESIGN object)

**Apply same Tailwind replacements**

### 6.3 MapDrawer.tsx

**Remove**: Lines 14-43 (DESIGN object)

**Apply same Tailwind replacements**

---

## Phase 7: Event Image Map Pins

### 7.1 Update MapDrawer.tsx Marker Creation

**Current** (generic markers):
```typescript
markerEl.style.background = 'linear-gradient(...)';
```

**New** (image-based like Instagram):
```typescript
markerEl.innerHTML = `
  <div class="relative w-12 h-12">
    <div class="w-full h-full rounded-full overflow-hidden border-3 border-white shadow-lg">
      <img 
        src="${sanitizeImageUrl(event.coverImage)}" 
        class="w-full h-full object-cover"
        onerror="this.src='/placeholder.svg'"
      />
    </div>
    ${event.isFeatured ? `
      <div class="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
        <svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      </div>
    ` : ''}
  </div>
`;
```

### 7.2 Friend Markers (Different Style)

```typescript
// Blue border for friends
friendMarkerEl.innerHTML = `
  <div class="w-10 h-10 rounded-full overflow-hidden border-3 border-blue-500 shadow-lg">
    <img 
      src="${friendPhoto}" 
      class="w-full h-full object-cover"
      onerror="this.src='/default-avatar.png'"
    />
  </div>
`;
```

---

## Phase 8: Modal Safe Area Fixes

### 8.1 Global CSS Updates

**File**: `src/index.css`

```css
/* Modal safe area helpers */
.modal-container {
  max-height: calc(100vh - 2rem);
  max-height: calc(100dvh - 2rem);
}

.modal-header {
  padding-top: max(1rem, env(safe-area-inset-top));
}

.modal-footer {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}

/* Bottom nav spacing */
.pb-nav {
  padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px));
}
```

### 8.2 Apply to All Modals

- QRScannerModal
- CheckInModal
- EditEventModal
- SubscriptionModal
- FiltersModal
- TicketsModal

---

## Phase 9: User Search Enhancement

### 9.1 Fuzzy Search with Progressive Filtering

**File**: `src/hooks/useFriends.ts`

```typescript
const searchUsers = async (query: string): Promise<SearchResult[]> => {
  if (!query || query.length < 2) return [];
  
  // Use ilike for fuzzy matching
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, profile_photo, bio, email')
    .or(`name.ilike.%${query}%,bio.ilike.%${query}%,email.ilike.%${query}%`)
    .neq('id', userId || '')
    .order('name')
    .limit(20);
  
  if (error) {
    console.error('Search error:', error);
    return [];
  }
  
  return data.map(p => ({
    id: p.id,
    name: p.name || p.email?.split('@')[0] || 'User',
    photo: p.profile_photo || '/default-avatar.png',
    bio: p.bio || '',
    email: p.email,
  }));
};
```

---

## Phase 10: Event Manager Real-Time Sync

### 10.1 Real-Time Check-In Notifications

**File**: `src/pages/EventManager.tsx`

```typescript
// Subscribe to check-ins for organizer's events
useEffect(() => {
  if (!myEvents.length) return;
  
  const channel = supabase
    .channel('organizer-check-ins')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'check_ins',
    }, async (payload) => {
      const checkIn = payload.new;
      // Check if this is for one of our events
      if (myEvents.some(e => e.id === checkIn.event_id)) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, profile_photo')
          .eq('id', checkIn.user_id)
          .single();
        
        // Update attendee count
        setAttendeeCount(prev => ({
          ...prev,
          [checkIn.event_id]: (prev[checkIn.event_id] || 0) + 1
        }));
        
        // Show toast
        toast({
          title: 'New Check-in!',
          description: `${profile?.name || 'Someone'} just checked in`,
        });
      }
    })
    .subscribe();
  
  return () => supabase.removeChannel(channel);
}, [myEvents]);
```

### 10.2 Event Status Badges

- Use `ended_at` timestamp to determine if event is "Live" or "Ended"
- Show "Live" badge with pulse animation for active events
- Show "Ended" badge for past events

---

## Implementation Order

| Priority | Phase | Files Modified |
|----------|-------|----------------|
| Critical | Phase 1: Build Errors | `useCheckIn.ts`, `useFriends.ts`, `EventManager.tsx`, `types.ts` |
| Critical | Phase 2: Check-In Flow | `QRScannerModal.tsx` |
| High | Phase 3: Remove Mock Data | `AppContext.tsx`, `Home.tsx`, `Profile.tsx`, `useFriends.ts` |
| High | Phase 6: Tailwind CSS | `EventDetail.tsx`, `EventManager.tsx`, `MapDrawer.tsx` |
| Medium | Phase 4: WebSocket Chat | `Chats.tsx`, Database migration |
| Medium | Phase 5: Friend Locations | New hook, `MapDrawer.tsx`, Database migration |
| Medium | Phase 7: Map Pins | `MapDrawer.tsx` |
| Medium | Phase 8: Modal Fixes | `index.css`, All modal components |
| Low | Phase 9: Search | `useFriends.ts`, `Social.tsx` |
| Low | Phase 10: Event Manager | `EventManager.tsx` |

---

## Database Migrations Required

1. **Enable realtime for messages** (if not already)
2. **Create user_locations table** with RLS policies
3. **Enable realtime for user_locations**

---

## Files to Create

1. `src/hooks/useFriendLocations.ts` - Friend location tracking hook

---

## Files to Modify

- `src/hooks/useCheckIn.ts` - Fix column names
- `src/hooks/useFriends.ts` - Remove username, add toast, fix search
- `src/pages/EventManager.tsx` - Fix types, add realtime, convert to Tailwind
- `src/pages/EventDetail.tsx` - Convert to Tailwind
- `src/components/MapDrawer.tsx` - Convert to Tailwind, add image pins
- `src/components/modals/QRScannerModal.tsx` - Fix flow loop
- `src/lib/types.ts` - Add duration to Event type
- `src/pages/Home.tsx` - Real database metrics
- `src/pages/Profile.tsx` - Real database metrics
- `src/index.css` - Safe area classes

---

## Testing Checklist

- [ ] Build compiles without errors
- [ ] Check-in flow completes (Scan → Geofence → Privacy → Success)
- [ ] Public check-in navigates to Connect page
- [ ] Private check-in shows welcome message
- [ ] User search works with 2+ characters
- [ ] Profile shows real events/matches/likes counts
- [ ] Event pins show cover images on map
- [ ] Modals don't clip at top/bottom edges
- [ ] All pages use consistent Tailwind styling
- [ ] Real-time chat messages appear instantly
- [ ] Event Manager updates when attendees check in
