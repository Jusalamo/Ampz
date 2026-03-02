

# AMPZ Comprehensive Update Plan

This plan addresses the 10 prompts in the user's request, organized into logical implementation phases. Many of these features already partially exist, so the work focuses on fixing gaps, removing hardcoded styles, and ensuring database-driven data throughout.

---

## Phase 1: Remove Hardcoded DESIGN Objects (Prompts 3, 10)

**Files:** `src/pages/EventDetail.tsx`, `src/components/MapDrawer.tsx`

### EventDetail.tsx (~1500 lines)
- Delete the `DESIGN` constant object (lines 17-56)
- Replace all `style={{ color: DESIGN.colors.textPrimary }}` with `className="text-foreground"`
- Replace `DESIGN.colors.background` with `bg-background`
- Replace `DESIGN.colors.card` with `bg-card`
- Replace `DESIGN.colors.textSecondary` with `text-muted-foreground`
- Replace `DESIGN.colors.primary` with `bg-primary` / `text-primary`
- Replace `DESIGN.borderRadius.*` with `rounded-lg`, `rounded-xl`, `rounded-full`
- Replace `DESIGN.spacing.*` with Tailwind spacing classes (`p-4`, `gap-3`, etc.)
- Replace `DESIGN.typography.*` with Tailwind text sizing (`text-xl`, `text-sm`, etc.)
- Approximately 80+ inline style references to convert

### MapDrawer.tsx
- Delete the `DESIGN` constant object (lines 14-43)
- Same conversion pattern: inline styles to semantic Tailwind classes
- Ensure dark mode compatibility through semantic class usage

---

## Phase 2: Homepage Restructure (Prompts 1, 5)

**File:** `src/pages/Home.tsx`

The homepage already has most of the requested structure. Changes needed:

1. **Dynamic greeting rotation** - Replace static "Welcome back" with random rotation:
   - "Welcome back, [First Name]!"
   - "Getting ready to party, [First Name]?"
   - "What's the agenda today, [First Name]?"
   - Use `useMemo` with random selection on mount

2. **Remove stats grid** - Delete the stats section (lines 276-292) showing Events/Matches/Likes Left (this analytics belongs on Profile page only)

3. **Quick Actions update** - Replace current 4 actions with:
   - Create Event, Scan QR, View Profile (3 buttons)
   - Keep existing handlers

4. **Keep existing sections** - My Events and Featured Events carousels already fetch from database and work correctly

---

## Phase 3: Profile Analytics Fix (Prompts 2, 4)

**File:** `src/pages/Profile.tsx`

The profile page already queries real metrics from Supabase (lines 28-58). Changes:

1. Stats are already correct: Events (check_ins count), Matches (matches count), Likes Left (from subscription)
2. No "response rate" metric exists -- already removed
3. Add loading skeleton while metrics fetch (wrap stats grid with skeleton state)
4. These are already real database queries -- no mock data present

---

## Phase 4: EventDetail CTA Buttons (Prompt 11 - RSVP & Buy)

**File:** `src/pages/EventDetail.tsx`

Update the sticky bottom CTA section (lines 1371-1428):

1. Replace single button with two side-by-side buttons:
   - **RSVP button** (primary): Inserts into `tickets` table with status `rsvp_pending`
   - **Buy Now - $[price]** button (secondary): Shows real price from `event.price`, opens external ticket link or checkout
2. If event is free, show "Free" instead of price
3. If already RSVPed, show "RSVPed" badge
4. All styling uses semantic Tailwind (part of Phase 1 conversion)

---

## Phase 5: Event Detail - Fix Mock Data (Prompt 8)

**File:** `src/pages/EventDetail.tsx`

1. **Remove mock attendee avatars** (lines 1318-1349): Replace `pravatar.cc` placeholder images with real attendee data from `check_ins` table joined with `profiles`
2. **Replace hardcoded "43 members"** with real `attendees_count` from the event record
3. **Real comments count**: Already using `eventComments.length`
4. **Real photos count**: Already using `eventPhotos.length`
5. **Real-time attendee count**: Subscribe to `check_ins` changes for the event

---

## Phase 6: Event Manager Editability (Prompt 5)

**File:** `src/pages/EventManager.tsx`

The Event Manager already supports editing via `EditEventModal`. Enhancements:

1. Verify all fields are editable: title, description, category, start/end time, location with map, cover image, media, ticket price, tags
2. Ensure each save calls `updateEvent()` which persists to Supabase immediately
3. WebSocket broadcast already works via Supabase Realtime subscription (lines 205-220 of EventManager)
4. Add "Changes saved" toast on successful update (if not already present)

---

## Phase 7: Event Lifecycle (Prompt 6)

**Files:** `src/pages/EventManager.tsx`, `src/contexts/AppContext.tsx`

1. **Event statuses** already implemented: `useEventStatus` hook computes `live`/`upcoming`/`past` from database times
2. **Auto-end**: Events with `end_time` already auto-transition to `past` status based on time comparison
3. **"End Event Now" button**: Add a red button in Event Manager that sets `ended_at = now()` and `is_active = false`
4. **Ended events filtering**: Events page already filters by `is_active`; verify ended events only show in history

**Database migration needed:**
- Add `ended_by` column (text, nullable) to `events` table to track 'auto' vs 'manual' ending

---

## Phase 8: QR Code System (Prompts 3, 4)

**Files:** `src/pages/EventManager.tsx`, `src/components/modals/QRScannerModal.tsx`

### QR Generation (EventManager)
- QR codes already encode check-in URLs: `${origin}/event/${event.id}/checkin`
- Add 300x300px minimum display size
- QR is stored in database and synced -- both EventManager and EventWizard use the same event record

### QR Scanning (QRScannerModal)
- Scanner already validates QR URL format, checks geofence, checks existing check-in
- Add event time-range validation: verify current time is between `start_time` and `end_time`
- Error messages already implemented for expired/distance/duplicate
- Add specific message: "This event hasn't started yet" and "This event has ended"

---

## Phase 9: Image Caching & Loading (Prompts 7, 6)

**Files:** `src/pages/Home.tsx`, `src/pages/Connect.tsx`, `src/pages/EventDetail.tsx`, `src/contexts/AppContext.tsx`

1. **Profile pictures**: Show user initials as placeholder while loading (instead of broken icon)
2. **Event cards**: Already cache in localStorage with TTL; show cached data instantly
3. **Avatar preload on login**: In AppContext, after successful auth, preload user's profile photo into browser cache
4. **Pattern**: Already implemented in Events.tsx -- extend to all pages

---

## Phase 10: WebSocket Real-Time (Prompt 8)

**Files:** `src/contexts/AppContext.tsx`, `src/hooks/useRealtimeSubscriptions.ts`

Supabase Realtime is already connected. Verify and extend:

1. **Already subscribed**: events table changes (INSERT/UPDATE/DELETE)
2. **Add subscriptions for**: messages (new message), community_comments (new comment), check_ins (new check-in)
3. **Optimistic UI**: Already implemented for most operations
4. **Connection status**: Add a small offline banner component when WebSocket disconnects
5. **Auto-reconnect**: Supabase client handles reconnection automatically

---

## Phase 11: Subscription Persistence (Prompts 7, 9)

**File:** `src/contexts/AppContext.tsx`

Subscription is already stored in `profiles` table (`subscription_tier`, `subscription_expires_at`). Verify:

1. On app launch: subscription fetched from database and cached in `ampz_cached_user`
2. Never reset on refresh -- already implemented via database fetch
3. Upgrade modal logic: only show for `tier === 'free'`
4. Verify no code resets subscription on page load

---

## Phase 12: Community Photos Moderation (Prompt 2)

**Files:** `src/pages/EventManager.tsx`, `src/components/modals/ModerationPanel.tsx`

The ModerationPanel already exists with approve/reject/hide/delete functionality. Verify:

1. `community_photos` table already has `moderation_status` column (pending/approved/rejected)
2. ModerationPanel already fetches photos and comments with moderation controls
3. Ensure EventDetail only shows `approved` photos in public view
4. Add filter in `CommunityPhotos` query: `.eq('moderation_status', 'approved')`

---

## Database Migration

```sql
-- Add ended_by column to track auto vs manual event ending
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ended_by text;
```

---

## Files Summary

| File | Changes |
|------|---------|
| `src/pages/EventDetail.tsx` | Remove DESIGN object, convert to Tailwind, add RSVP/Buy buttons, replace mock attendee avatars, real attendee count |
| `src/components/MapDrawer.tsx` | Remove DESIGN object, convert to Tailwind |
| `src/pages/Home.tsx` | Dynamic greeting rotation, remove stats grid, update quick actions to 3 buttons |
| `src/pages/Profile.tsx` | Add loading skeleton for metrics |
| `src/pages/EventManager.tsx` | Add "End Event Now" button, verify full editability |
| `src/components/modals/QRScannerModal.tsx` | Add event time-range validation check |
| `src/contexts/AppContext.tsx` | Avatar preload, verify subscription persistence |
| `src/hooks/useRealtimeSubscriptions.ts` | Add message/comment/check-in subscriptions |
| `src/components/CommunityPhotos.tsx` | Filter by moderation_status = 'approved' |
| Database migration | Add `ended_by` column |

## Implementation Order

1. Database migration (ended_by column)
2. EventDetail.tsx -- DESIGN removal + RSVP buttons + mock data fix (largest file)
3. MapDrawer.tsx -- DESIGN removal
4. Home.tsx -- Greeting rotation + stats removal
5. QRScannerModal.tsx -- Time-range validation
6. EventManager.tsx -- End Event button
7. Remaining files (Profile, AppContext, CommunityPhotos, Realtime)

