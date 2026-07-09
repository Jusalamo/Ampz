## Scope — Finish the outstanding fixes

Surgical fixes only. No rebuilds, no schema changes beyond one small migration for the events-bucket policy if missing.

### 1. Map interaction (can't touch/scroll map)
- `MapContext.tsx`: default `isInteractive` stays true, but the persistent map `div` currently sits at `zIndex: 0` behind everything. On `/events` the page content above has its own background covering it. Add a dedicated wrapper with `zIndex` that lifts to `1` only when visible, and ensure `Events.tsx` root does not paint an opaque `bg-background` over the map area (use transparent for the map region).
- `MapDrawer.tsx`: confirm the drawer sheet uses `touchAction: pan-y` only on the handle, and `pointer-events-none` on the transparent spacer above the sheet so map taps pass through.
- Call `setMapInteractive(true)` on mount of Events page; only disable while drawer is fully expanded.

### 2. Buy Tickets → 404
- Root cause: `Home.tsx` "Tickets" quick action and Event Detail "Buy Tickets" button both navigate to a route that doesn't exist or opens `TicketsModal` (which is empty for users with no ticket).
- Fix: wire both to `/event/:id/buy` (`BuyTicketScreen`). When invoked from Home with no event context, open a lightweight "Select an event" sheet listing upcoming events → then navigate to `/event/:id/buy`.
- Ensure `BuyTicketScreen` shows a friendly empty state (already does) — no 404.

### 3. Event Detail + Events page theming & hardcoded data
- `EventDetail.tsx` and `Events.tsx`: replace hardcoded hex/`text-white`/`bg-black` with semantic tokens (`bg-background`, `text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`).
- Remove mock organiser photo/name/attendee avatars in `EventDetail.tsx`; fetch real `organizer_id` → `profiles` (name, profile_photo) and real attendee thumbnails via `check_ins` join `profiles` (limit 6).
- Fix profile photo `<img>` with `onError` → `/default-avatar.png` and skeleton while loading.
- "See All" button on attendees → navigate to `/event/:id/attendees` (route exists).

### 4. Event photos not displaying (bucket)
- Photos are stored as base64 or blob URLs in some paths → they don't persist.
- Fix upload in `EventWizardModal.tsx` and `EditEventModal.tsx`: upload files to existing `community-photos` bucket under `events/{eventId}/{uuid}.jpg`, save the public URL string in `events.cover_image` / `events.gallery_images`.
- Add graceful fallback to `/placeholder.svg` on `onError`.
- If bucket policy blocks anon read (it's public per config), no migration needed. If insert policy missing for authenticated, add one.

### 5. Event-Manager radius live-sync
- `EventManager.tsx`: on radius change (slider) update local state, patch `events.geofence_radius`, and emit an event on `MapContext` so the visible mapbox circle source (`geofence-{eventId}`) re-renders with the new radius. Add a `updateGeofenceCircle(eventId, radius)` helper in `MapContext`.

### 6. Chat quick-add: search + suggestions
- `Chats.tsx` quick-add: currently calls `useFriends.searchUsers`. Verify it hits `search_users_simple` RPC with `current_user_id`. If empty query, call `get_suggested_users` RPC to show "People you may know".
- Debounce input (250ms), skeleton while loading, empty state after 400ms of no results.

### 7. QR check-in → Event Manager sync (guest just added)
- Confirm flow: user scans event QR → `QRScannerModal` calls `secure_check_in` RPC → inserts `check_ins` row → trigger `notify_organizer_on_check_in` creates notification → organiser realtime channel picks it up.
- Fix: `EventManager.tsx` currently polls; add realtime subscription to `check_ins` filtered by `event_id in (my events)` → prepend new attendee card with profile photo + toast. Also increment attendee count locally.
- Fix scanner: `QRScannerModal` should hand off to `OrganiserScanScreen` behavior when the current user is the organiser; otherwise run guest check-in flow with live photo → `match_profiles` upsert (already in `useCheckIn`).
- Ensure `verify_ticket_qr` path also triggers `check_ins` insert for the ticket holder so they appear in Event Manager (currently it only flips ticket status). Add insert in the RPC via migration.

### 8. Organiser scan flow polish
- `OrganiserScanScreen.tsx`: after successful scan, show attendee card for 2s then auto-restart camera. Add sound + haptic. Show running count of scanned tickets for this session.

### 9. Settings redundancy pass
- `Settings.tsx`: remove duplicate/empty items (verify against `PrivacySettings.tsx` and `EditProfile.tsx` — deduplicate any "Account" links that go nowhere). Keep: Edit Profile, Privacy, Notifications toggle, Theme, Sign Out.

### Files to edit
- `src/contexts/MapContext.tsx` (+ helper for geofence circle)
- `src/components/MapDrawer.tsx` (touch pass-through)
- `src/pages/Events.tsx` (theme tokens, transparent map region)
- `src/pages/EventDetail.tsx` (tokens, real organiser, real attendees, See All, buy button)
- `src/pages/Home.tsx` (Tickets quick action)
- `src/pages/BuyTicketScreen.tsx` (verify empty state)
- `src/pages/EventManager.tsx` (radius live-sync, realtime check_ins)
- `src/pages/Chats.tsx` (search + suggestions)
- `src/pages/Settings.tsx` (redundancy)
- `src/pages/OrganiserScanScreen.tsx` (polish loop)
- `src/components/modals/EventWizardModal.tsx` + `EditEventModal.tsx` (bucket upload)
- `src/components/modals/QRScannerModal.tsx` (organiser vs guest branch)

### One migration
- Update `verify_ticket_qr` RPC to also `INSERT INTO check_ins` on successful scan so ticketed attendees appear in Event Manager live list.
- Add storage policy on `community-photos` for authenticated INSERT under `events/*` if missing.

### Out of scope
- No new tables, no auth changes, no schema renames, no design-system overhaul.
