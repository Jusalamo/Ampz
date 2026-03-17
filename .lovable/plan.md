

# Remaining Implementation Plan

After reviewing the codebase, here's what's already done and what still needs implementation.

## Already Completed
- EventDetail.tsx: DESIGN object removed, semantic Tailwind applied, RSVP/Buy buttons, real attendees from DB
- MapDrawer.tsx: No DESIGN object (already clean)
- Home.tsx: Dynamic greeting rotation, 3 quick actions, no stats grid
- Profile.tsx: Real DB metrics (check_ins, matches, likes_remaining)
- Event duration: Uses actual `end_time` from DB (not hardcoded 4h)
- Caching: localStorage cache-first pattern in AppContext
- Realtime: Subscriptions for events, check-ins, photos, comments, notifications
- Subscription persistence: Stored in profiles table, cached locally
- CommunityPhotos moderation panel exists with approve/reject

## Still Needs Implementation

### 1. Remove DESIGN Objects from 6 Files
Files still containing hardcoded `DESIGN` constants:
- `src/pages/EventManager.tsx` (line 223)
- `src/components/modals/CheckInModal.tsx` (line 11)
- `src/components/modals/EventWizardModal.tsx` (line 31)
- `src/components/modals/SubscriptionModal.tsx` (line 8)
- `src/components/CommunityComments.tsx` (line 11)
- `src/components/EventCard.tsx` (line 7)
- `src/components/BottomNav.tsx` (line 7)

For each file: delete the DESIGN object and replace all `style={{ color: DESIGN.colors.* }}` and `style={{ background: DESIGN.colors.* }}` with semantic Tailwind classes (`text-foreground`, `bg-primary`, `text-muted-foreground`, `bg-card`, `border-border`, `rounded-xl`, etc).

### 2. QR Scanner Time-Range Validation
**File:** `src/components/modals/QRScannerModal.tsx`

In `processQRCode()` after event validation (around line 197), add a time-range check:
```typescript
// Check event time range
const now = new Date();
const eventDate = new Date(event.date);
const [startH, startM] = (event.time || '00:00').split(':').map(Number);
eventDate.setHours(startH, startM, 0, 0);

if (now < eventDate) {
  setErrorMessage("This event hasn't started yet.");
  setStep('error');
  return;
}

if (event.endTime) {
  const endDate = new Date(eventDate);
  const [endH, endM] = event.endTime.split(':').map(Number);
  endDate.setHours(endH, endM, 0, 0);
  if (endDate <= eventDate) endDate.setDate(endDate.getDate() + 1);
  if (now > endDate) {
    setErrorMessage("This event has ended.");
    setStep('error');
    return;
  }
}
```

### 3. "End Event Now" Button in Event Manager
**File:** `src/pages/EventManager.tsx`

Add to the event card actions or detail view:
- Red "End Event Now" button (visible only for `live` status events)
- Confirmation dialog before ending
- On confirm: update Supabase `events` table with `is_active: false`, `ended_at: new Date().toISOString()`, `ended_by: 'manual'`
- Show success toast

### 4. CommunityPhotos: Filter by Approved Status
**File:** `src/components/CommunityPhotos.tsx`

The component receives photos as props from parent. The filtering needs to happen in `useCommunityRealtime.ts` where photos are fetched:
- Add `.eq('moderation_status', 'approved')` to the `fetchPhotos` query in `useCommunityRealtime.ts`
- This ensures only approved photos appear in the public EventDetail view

### 5. Realtime Subscriptions for Messages
**File:** `src/hooks/useRealtimeSubscriptions.ts`

Add a new hook:
```typescript
export function useMessagesRealtime(userId: string, onMessage: (msg: any) => void) {
  // Subscribe to messages where receiver_id = userId
}
```

### 6. Connection Status Indicator
**File:** `src/contexts/AppContext.tsx` or new component

Add a small banner that shows when WebSocket connection drops. Supabase client exposes channel status -- listen for `CHANNEL_ERROR` or `CLOSED` events and show an offline indicator at the top of the screen.

### 7. Avatar Preload on Login
**File:** `src/contexts/AppContext.tsx`

After successful auth and profile fetch, preload the user's avatar:
```typescript
if (profile.profile_photo) {
  const img = new Image();
  img.src = profile.profile_photo;
}
```

## Files Summary

| File | Change |
|------|--------|
| `src/pages/EventManager.tsx` | Remove DESIGN object, convert inline styles to Tailwind, add "End Event Now" button with confirmation |
| `src/components/modals/CheckInModal.tsx` | Remove DESIGN object, convert to Tailwind |
| `src/components/modals/EventWizardModal.tsx` | Remove DESIGN object, convert to Tailwind |
| `src/components/modals/SubscriptionModal.tsx` | Remove DESIGN object, convert to Tailwind |
| `src/components/CommunityComments.tsx` | Remove DESIGN object, convert to Tailwind |
| `src/components/EventCard.tsx` | Remove DESIGN object, convert to Tailwind |
| `src/components/BottomNav.tsx` | Remove DESIGN object, convert to Tailwind |
| `src/components/modals/QRScannerModal.tsx` | Add event time-range validation in processQRCode |
| `src/hooks/useCommunityRealtime.ts` | Add moderation_status filter to photo query |
| `src/hooks/useRealtimeSubscriptions.ts` | Add messages realtime hook |
| `src/contexts/AppContext.tsx` | Avatar preload on login, offline banner state |

No database migrations needed -- `ended_by` column already exists.

