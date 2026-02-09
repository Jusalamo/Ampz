
# Attendee Profiles, Live Photo Capture & Connection Flow Implementation

## Overview

This plan covers 5 interconnected features:
1. Real attendee profile cards in Event Manager (with actual data from database)
2. Live photo capture step during public check-in
3. Connect page fetches real public profiles from the event's `match_profiles` table
4. Like limit enforcement (block swiping when likes run out)
5. Connection access tied to geofence and event lifecycle

---

## 1. Event Manager: Real Attendee Profile Cards

### Current Problem
The "Attendees & Messages" tab in `EventManager.tsx` uses a `getRealAttendees()` function that returns hardcoded mock data for demo users and an empty array for real users. Attendee cards show a generic icon instead of real profile photos.

### Changes to `src/pages/EventManager.tsx`

- Import and use the existing `useEventAttendees` hook instead of `getRealAttendees()`
- For each event selected, call `useEventAttendees(selectedEventId)` to get real check-in data with profile photos and names
- Replace the generic `<User>` icon placeholder with actual `<img>` elements showing `attendee.profilePhoto` (fallback to `/default-avatar.png`)
- Each attendee card will display:
  - Profile photo (real image, not icon)
  - Name
  - Visibility mode badge (Public/Private)
  - Check-in time
  - If organizer's event has reports, show a small flag icon indicator

### Attendee Card Layout
```
[Photo] Name                    [Public] [Checked In]
        Checked in 5 min ago
```

---

## 2. Live Photo Capture During Public Check-In

### Current Problem
When a user selects "Public" in the privacy choice step, the flow immediately calls `completeCheckIn('public')` -- skipping the live photo capture. The connection profile uses the user's existing profile photo instead of a fresh event photo.

### Changes to `src/components/modals/QRScannerModal.tsx`

- Add new step type: `'photo_capture'` to the `ScannerStep` union
- Add state for captured photo: `capturedPhoto` (base64 string)
- Add a `photoVideoRef` for the camera feed in photo capture mode

**Updated Flow:**
1. User selects "Public" -> transition to `photo_capture` step (instead of `checking_in`)
2. User selects "Private" -> transition directly to `checking_in` (unchanged)

**Photo Capture Step UI:**
- Full-screen camera preview with a circular capture button
- "Take Photo" button at the bottom
- "Skip" option (uses existing profile photo as fallback)
- After capture, show preview with "Retake" and "Use This Photo" buttons
- On confirm, call `completeCheckIn('public')` with the captured photo passed along

**Photo Flow:**
- Capture photo from video stream using canvas
- Convert to blob, upload to `community-photos` storage bucket
- Pass the public URL to `processCheckIn` as a new parameter

### Changes to `src/hooks/useCheckIn.ts`

- Add optional `connectionPhoto?: string` parameter to `processCheckIn`
- When creating the `match_profiles` entry, use `connectionPhoto` as the first item in `profile_photos` array (if provided), falling back to the user's existing profile photo

---

## 3. Connect Page: Fetch Real Event Profiles

### Current Problem
The Connect page filters `connectionProfiles` from AppContext (which are demo/locally managed), not from the database's `match_profiles` table.

### Changes to `src/pages/Connect.tsx`

- Add a `useEffect` that fetches real match profiles from the database on mount
- Query: Get the user's most recent public check-in, then fetch all other public `match_profiles` for that same event
- Replace the `availableProfiles` computation with database-fetched profiles
- Map `match_profiles` rows to `ConnectionProfile` type:
  - `photo` = `profile_photos[0]` or `/default-avatar.png`
  - `name` = `display_name`
  - Include `age`, `bio`, `interests`, `occupation`, `gender`, `location`

```typescript
// Pseudocode for fetching
const { data: myCheckIn } = await supabase
  .from('check_ins')
  .select('event_id')
  .eq('user_id', userId)
  .eq('visibility_mode', 'public')
  .order('checked_in_at', { ascending: false })
  .limit(1)
  .single();

const { data: profiles } = await supabase
  .from('match_profiles')
  .select('*')
  .eq('event_id', myCheckIn.event_id)
  .eq('is_public', true)
  .eq('is_active', true)
  .neq('user_id', userId);
```

- Show event name from the check-in's event in the header
- Add real-time subscription to `match_profiles` for the active event so new public check-ins appear live

---

## 4. Like Limit Enforcement

### Current Problem
The `handleSwipe` function in Connect.tsx checks `likesRemaining` but the toast fires and the swipe still proceeds (the index increments regardless).

### Fix in `src/pages/Connect.tsx`

- When `likesRemaining <= 0` for free users, return early from `handleSwipe` BEFORE incrementing `currentIndex`
- Disable the "Like" button visually when likes are exhausted
- Show a clear "Upgrade to continue swiping" prompt instead of just a toast

---

## 5. Connection Access: Geofence & Event Lifecycle

### Changes to `src/pages/Connect.tsx`

- On mount and periodically (every 60 seconds), check:
  1. Is the event still active? (not ended via `ended_at`)
  2. Is the user still within geofence range?
- If the event has ended OR user leaves geofence, show a "Connection session ended" overlay and prevent further swiping
- The match profiles remain accessible (for existing matches/chats) but no new swipes allowed

---

## Files Summary

| File | Changes |
|------|---------|
| `src/pages/EventManager.tsx` | Replace mock attendees with `useEventAttendees` hook; render real profile cards with photos |
| `src/components/modals/QRScannerModal.tsx` | Add `photo_capture` step with camera UI between privacy choice and check-in |
| `src/hooks/useCheckIn.ts` | Add `connectionPhoto` parameter; use it in `match_profiles` upsert |
| `src/pages/Connect.tsx` | Fetch real profiles from `match_profiles` table; enforce like limits properly; add geofence/event-end checks |

No database migrations are needed -- all required tables and columns already exist.
