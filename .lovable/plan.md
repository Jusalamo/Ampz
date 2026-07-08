## Ampz Full-System Audit — Remaining Fixes

Surgical fixes only. No rebuild. No new mock data. Auth + routing structure untouched (only additions).

---

### 1. Map ↔ Drawer touch conflict (SYSTEM 3)
**Files:** `src/contexts/MapContext.tsx`, `src/components/MapDrawer.tsx`

- Add `setMapInteractive(enabled: boolean)` to `MapContext` that calls `map.dragPan.enable/disable()`, `map.touchZoomRotate.enable/disable()`, `map.scrollZoom.enable/disable()`.
- In `MapDrawer`, when drawer is `expanded` OR mid-drag, call `setMapInteractive(false)`; on collapse re-enable.
- Wrap the map's persistent `<div>` with inline `style={{ touchAction: isDrawerOpen ? 'none' : 'pan-x pan-y' }}` and toggle `pointerEvents` via context flag.
- Drawer handle: add `onTouchStartCapture={e => e.stopPropagation()}` on the pill and drag region so the map never receives those events.
- Confirm map is mounted once (already in `MapProvider`) — just verify no unmount on route change.

### 2. Event Manager radius → live map (user's specific bug)
**File:** `src/pages/EventManager.tsx` + `src/components/MapDrawer.tsx`

- `handleSaveEvent` currently writes `geofence_radius` to DB and calls `updateEvent`, but `MapDrawer`'s geofence circle uses cached `event.geofenceRadius` — after edit, existing marker's circle is stale.
- Fix: in `MapDrawer`, watch `events` list; when `selectedEvent.geofenceRadius` changes, call `addGeofenceCircle(updatedEvent)` again (re-render source data). Also clear + rebuild the 3D card so displayed radius text updates.
- Ensure `updateEvent` in `AppContext` emits new object reference so subscribers re-render.

### 3. QR check-in flow simplification (SYSTEM 1 — still messing up)
**Files:** `src/components/modals/QRScannerModal.tsx`, `src/hooks/useCheckIn.ts`, `src/pages/EventCheckIn.tsx`

- Trim + normalise scanned token everywhere (`code.trim()`), and accept both raw UUIDs and `/event/<id>/checkin` URLs (already there — verify).
- Preflight geofence uses the **event's current `geofence_radius` from DB**, not cached client value. Re-fetch in `preflightGeofenceCheck` via `secure_check_in` RPC / `events.geofence_radius` before comparing distance.
- Remove the mandatory photo-capture step when the user's device denies camera — fall back straight to `checking_in` (photo optional, not blocking).
- Add explicit error surface: if `secure_check_in` RPC returns `outside_geofence`, show real distance + required radius from server response.
- Add try/catch around scanner init so a permission denial shows "Enable camera or paste code" instead of blank state.

### 4. "Buy Ticket" wiring (user's specific bug)
**Files:** `src/pages/Home.tsx`, `src/pages/EventDetail.tsx`, `src/components/modals/TicketsModal.tsx`

- Home quick-action "Tickets" currently opens `TicketsModal` (user's ticket list). Split into behaviour: keep "My Tickets" as list, and make **EventDetail's "Buy Ticket" CTA** navigate to `/event/:id/buy` (already routed). Wire the button `onClick` to `navigate(\`/event/\${event.id}/buy\`)` when `event.price > 0` or when tiers exist.
- In `TicketsModal`, add a "Browse events to buy" CTA that navigates to `/events` when the user has no tickets, so the quick-action and Buy flow feel connected.

### 5. Event cover / carousel image glitching (user's specific bug)
**Files:** `src/components/EventCard.tsx`, `src/pages/EventDetail.tsx`

- Root cause: images fall back to `via.placeholder.com` on `onError`, which sometimes 404s or rate-limits → looks like flickering. Also the carousel remounts `<img>` on every parent re-render because `key` is index-based and `src` string is recomputed inline.
- Fix in `EventCard`:
  - Compute `coverImage` once via `useMemo`.
  - Replace `via.placeholder.com` fallback with a local inline SVG data-URI (already used elsewhere) or `/default-event-cover.png` in `public/`.
  - Guard `onError` so it only fires once (`if (img.dataset.fallback) return; img.dataset.fallback='1';`) to stop infinite error → src reset loops.
- Fix in `EventDetail` carousel:
  - Use stable `key={url}` not index.
  - Keep the array in `useMemo`.
  - Preload next image (`<link rel="preload">` or hidden `<img>`) so swipes don't flash empty.

### 6. Settings redundancy (user's specific bug)
**File:** `src/pages/Settings.tsx`

- Remove non-functional stubs (`Change Email`, `Change Password`, `Emergency Contact`, `Blocked Users`, `Currency`, `Help Center`, `Contact Support`, `Terms`, `Privacy Policy` all have empty `onClick`).
- Consolidate to what actually works: **Edit Profile**, **Privacy Settings**, **Dark Mode toggle**, **Notifications toggle**, **Manage Subscription** (opens `SubscriptionModal`), **Log Out**, **Delete Account**.
- Leave placeholders only if they route somewhere real; otherwise delete.

### 7. Missing routes / 404s (SYSTEM 2)
- Grep confirms `/organiser/scan`, `/organiser/dashboard`, `/ticket/:ticketId`, `/event/:eventId/buy`, `/user/:userId`, `/event/:eventId/attendees`, `/search` are all routed. Add a "Coming soon" stub for any nav target discovered during the pass that lacks a page (surgical, only if found).
- `NotFound` already exists — verify it has a `navigate(-1)` back button (add if missing).

### 8. Realtime subscription cleanup (already partially fixed)
- Audit `useCheckIn`, `OrganiserDashboard`, `useFriends` (already fixed) for the same "add `.on()` after `subscribe()`" pattern. Ensure every `supabase.channel(name)` uses a unique per-mount name and single `subscribe()` call.

---

### Out of scope this pass
- Payment gateway integration (per prompt: "Payment collected at the door").
- New email templates beyond what `send-notification` already sends.
- Any mock data audit line-item already resolved in earlier turns — only re-check if I encounter one.

### Verification
- Run `tsgo` after edits.
- Playwright: open `/home`, expand drawer, verify map is inert; edit an event radius in EventManager and confirm geofence circle updates; scan flow via manual token entry.
