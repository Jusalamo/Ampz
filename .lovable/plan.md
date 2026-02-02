

# AMPZ QR Check-in & Feature Improvements Plan

## Overview

This plan addresses 8 key areas of improvement for the AMPZ event management app, focusing on the QR check-in flow, real-time updates, friend features, and map optimization. All changes follow the established design system patterns and maintain existing layouts.

---

## 1. QR Check-in Flow - Error Messages & Success States

### Current State Analysis
- `useCheckIn.ts` has comprehensive error handling but some edge cases need clearer messages
- `QRScannerModal.tsx` shows different states but messages could be more descriptive
- The `secure_check_in` RPC function handles server-side validation

### Implementation

**A. Enhanced Error Messages in `useCheckIn.ts`**

Add specific error states for:
- Event has ended (past `end_time`)
- Event hasn't started yet
- User is outside geofence with distance display
- Location permission denied
- Network connectivity issues

**B. Success Flow Improvements in `QRScannerModal.tsx`**

- Add celebratory animation on successful check-in
- Display event details and distance from venue
- Provide option to view event or close modal
- Auto-navigate to event details after 3 seconds (optional)

### Files to Modify
- `src/hooks/useCheckIn.ts` - Enhanced error message parsing
- `src/components/modals/QRScannerModal.tsx` - UI feedback improvements

---

## 2. Geofence Verification Improvements

### Current State Analysis
- Server-side validation exists via `secure_check_in` RPC
- Client provides preview feedback but server makes final decision
- Geofence radius is stored per-event in database

### Implementation

**A. Pre-flight Geofence Check**

Before attempting check-in, show user their current distance from venue:

```text
+-----------------------------------+
|  📍 Checking Location...          |
|                                   |
|  You are 45m from the venue       |
|  ✅ Within check-in range (50m)   |
|                                   |
|  [Continue to Check-in]           |
+-----------------------------------+
```

**B. Clear Out-of-Range Messaging**

When user is outside geofence:

```text
+-----------------------------------+
|  ⚠️ Too Far Away                  |
|                                   |
|  You are 156m from Event Name     |
|  Check-in requires being within   |
|  50m of the venue.                |
|                                   |
|  📍 Venue: Location Name          |
|                                   |
|  [Get Directions]  [Try Again]    |
+-----------------------------------+
```

### Files to Modify
- `src/hooks/useCheckIn.ts` - Add distance preview function
- `src/components/modals/QRScannerModal.tsx` - Geofence feedback UI

---

## 3. Event Timing - QR Code Validity

### Current State Analysis
- Current validation checks `is_active` and compares `date` with current date
- The date comparison is too strict (rejects same-day events)
- No `end_time` or `ended_at` field check for duration-based validity

### Implementation

**A. Update `secure_check_in` RPC Function**

Modify the validation logic:

```sql
-- Valid if:
-- 1. Event is_active = true
-- 2. Event has NOT ended (ended_at IS NULL)
-- 3. Current time is within event day/timeframe
```

**B. Update Client-side Validation**

```typescript
// In validateQRCodeFast:
// Check if event is currently active (not ended)
if (eventData.ended_at) {
  return { valid: false, error: 'This event has ended' };
}

// Check if event date is today or in future
const eventDate = new Date(eventData.date);
const today = new Date();
today.setHours(0, 0, 0, 0);
eventDate.setHours(0, 0, 0, 0);

if (eventDate < today) {
  return { valid: false, error: 'This event has already passed' };
}
```

### Database Migration
- Add `end_time` field if not exists (already present)
- Use `ended_at` timestamp to determine if event is over

### Files to Modify
- `src/hooks/useCheckIn.ts` - Fix date comparison logic
- Database migration for any schema changes

---

## 4. Check-in Privacy Flow

### Current State Analysis
- `QRScannerModal.tsx` jumps directly to check-in after QR scan
- Privacy choice (public/private) is handled in `CheckInModal.tsx` but not in `QRScannerModal.tsx`

### Implementation

**A. Add Privacy Selection Step**

After successful QR validation, before final check-in:

```text
+-----------------------------------+
|  How would you like to appear?    |
|                                   |
|  [👥 Public]                      |
|  Others can see you at this event |
|                                   |
|  [🔒 Private]                     |
|  Browse anonymously               |
+-----------------------------------+
```

**B. Update processQRCodeScan Call**

Pass visibility mode to the check-in function based on user selection.

### Files to Modify
- `src/components/modals/QRScannerModal.tsx` - Add privacy step
- Add new step type `privacy_choice` before final check-in

---

## 5. Real-Time Database Updates

### Current State Analysis
- `useRealtimeSubscriptions.ts` exists with hooks for check-ins, photos, comments
- Realtime is enabled for relevant tables
- Organizer notifications trigger on check-in

### Implementation

**A. Ensure Organizer Notifications Work**

The trigger `notify_organizer_on_check_in` exists. Verify it fires correctly:

1. Check trigger is attached to `check_ins` table
2. Ensure notification is inserted with correct data
3. Update Event Manager UI to listen for these notifications

**B. Real-time Attendee Count Updates**

Subscribe to check-ins in Event Manager:

```typescript
// In EventManager.tsx
useCheckInRealtime(selectedEventId, (checkIn) => {
  // Update attendee count
  setAttendeeCount(prev => prev + 1);
  // Add to recent check-ins list
  setRecentCheckIns(prev => [checkIn, ...prev.slice(0, 9)]);
  // Show toast notification
  toast({ title: `${userName} just checked in!` });
});
```

### Files to Modify
- `src/pages/EventManager.tsx` - Add realtime check-in subscription
- Verify database trigger is active

---

## 6. Friends Feature - Search & Add

### Current State Analysis
- `useFriends.ts` has `searchUsers` function that queries profiles
- `Social.tsx` shows static demo data instead of using the hook
- Friend requests and friendships tables exist

### Implementation

**A. Connect Social Page to Real Database**

Replace demo data with actual database queries:

```typescript
const { friends, searchUsers, sendFriendRequest } = useFriends(user?.id);

// Search with debounce
const handleSearch = debounce(async (query) => {
  if (query.length >= 2) {
    const results = await searchUsers(query);
    setSearchResults(results);
  }
}, 300);
```

**B. Add User Search UI**

```text
+-----------------------------------+
|  🔍 Search users...               |
|                                   |
|  Suggestions:                     |
|  [Avatar] Sarah Chen    [Add]     |
|  [Avatar] Marcus J.     [Add]     |
|                                   |
|  Recent Searches:                 |
|  - John Smith                     |
|  - Emma Wilson                    |
+-----------------------------------+
```

**C. Friend Request States**

- "Add" button for new users
- "Pending" for sent requests
- "Accept/Decline" for received requests
- "Friends" badge for existing friends

### Files to Modify
- `src/pages/Social.tsx` - Connect to useFriends hook
- `src/hooks/useFriends.ts` - Add debounced search, pending check

---

## 7. Map Initialization Persistence

### Current State Analysis
- Map initializes on component mount in `MapDrawer.tsx`
- Map gets destroyed and recreated on navigation
- Events page layout causes map re-renders

### Implementation

**A. Persist Map Instance**

Move map initialization to a higher-level context or use a singleton pattern:

```typescript
// Create MapContext to maintain map instance across navigations
const MapContext = createContext<{
  map: mapboxgl.Map | null;
  isReady: boolean;
}>({ map: null, isReady: false });
```

**B. Lazy Initialization with Caching**

```typescript
// Only create map once
useEffect(() => {
  if (!mapContainer.current || map.current) return;
  // Initialize only if not already initialized
  map.current = getOrCreateMap(mapContainer.current);
}, []);
```

**C. Prevent Unnecessary Re-renders**

- Memoize map container ref
- Use stable callbacks for map events
- Don't destroy map on drawer close, just hide it

### Files to Modify
- `src/components/MapDrawer.tsx` - Optimize map lifecycle
- Create `src/contexts/MapContext.tsx` - Shared map instance

---

## 8. Friend Locations on Map (Future Feature)

### Database Schema Required
```sql
-- Add location tracking for friends (opt-in)
CREATE TABLE user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  latitude DECIMAL NOT NULL,
  longitude DECIMAL NOT NULL,
  accuracy DECIMAL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_visible BOOLEAN DEFAULT false,
  UNIQUE(user_id)
);
```

### Implementation Outline
1. Add privacy setting for location sharing
2. Create location update service
3. Subscribe to friend locations via realtime
4. Display friend markers on map with different styling

### Files to Create (Future)
- `src/hooks/useUserLocation.ts` - Location tracking
- `src/hooks/useFriendLocations.ts` - Friend locations subscription

---

## Technical Details

### Database Changes Required

1. **Verify Trigger Exists**
```sql
-- Ensure check-in notification trigger is active
SELECT tgname, tgrelid::regclass, tgenabled
FROM pg_trigger
WHERE tgname = 'on_check_in_notify_organizer';
```

2. **Enable Realtime for Tables** (if not already)
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.check_ins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

### Component State Flow

```text
QR Scan Flow:
1. Open QRScannerModal
2. Scan QR code
3. Extract event ID
4. Validate event (active, timing)
5. Check user location
6. Preview geofence status
7. Show privacy choice
8. Execute secure_check_in RPC
9. Handle success/error
10. Show result + navigation options
```

### Error State Mapping

| Error Condition | User Message |
|-----------------|--------------|
| Event not found | "This event doesn't exist. Please check the QR code." |
| Event ended | "This event has ended. Check-in is no longer available." |
| Event not started | "This event hasn't started yet. Check back on [date]." |
| Outside geofence | "You're [X]m from the venue. Move within [Y]m to check in." |
| Location denied | "Location access is required. Please enable it in settings." |
| Already checked in | "You're already checked in to this event!" |
| Network error | "Connection issue. Please check your internet and try again." |

---

## Implementation Order

1. **Phase 1: QR Check-in Flow (Critical)**
   - Fix event timing validation
   - Add privacy selection step
   - Improve error messages

2. **Phase 2: Geofence UX**
   - Add pre-flight location check
   - Improve out-of-range messaging
   - Add "Get Directions" option

3. **Phase 3: Real-time Updates**
   - Verify notification trigger
   - Add Event Manager realtime subscription
   - Test end-to-end notification flow

4. **Phase 4: Friends Feature**
   - Connect Social page to database
   - Implement user search
   - Add friend request UI

5. **Phase 5: Map Optimization**
   - Create MapContext
   - Optimize map lifecycle
   - Prevent unnecessary re-renders

6. **Phase 6: Friend Locations (Future)**
   - Design privacy controls
   - Implement location sharing
   - Add friend markers to map

---

## Testing Checklist

- [ ] Scan valid QR code within geofence - should succeed
- [ ] Scan valid QR code outside geofence - should show distance error
- [ ] Scan QR for ended event - should show "event ended" error
- [ ] Scan invalid QR code - should show format error
- [ ] Deny location permission - should show permission error
- [ ] Check-in twice - should show "already checked in"
- [ ] Verify organizer receives notification on check-in
- [ ] Search for user by name - should show results
- [ ] Send friend request - should update status
- [ ] Accept friend request - should create friendship
- [ ] Navigate between pages - map should not reload

