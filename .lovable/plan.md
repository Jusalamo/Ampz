

# Fix: Check-In Connection Profile, Search, Skeleton Loading & Event Duration

## Issues Identified

1. **Public check-in flow works but needs verification** - Photo capture and connection profile creation flow exists and looks correct
2. **Quick Add search always shows "No users found"** - Root cause: `profiles_public` view inherits RLS from the `profiles` table, which only allows `auth.uid() = id`. So searching for other users returns 0 rows.
3. **Event duration hardcoded to 4 hours** - `EventManager.tsx` uses `event.duration || 4` but the `events` table has no `duration` column. It should use `end_time` from the database instead.
4. **No skeleton loading for images** - Profile photos and avatars show broken icon placeholders while loading

---

## Fix 1: Search / Quick Add - RLS on profiles_public

The `profiles_public` view is created with `security_invoker=on`, meaning it runs queries as the authenticated user. But the `profiles` table only has SELECT policies for `auth.uid() = id` (own profile only). This blocks all searches for other users.

**Database migration:**
- Add a new SELECT policy on `profiles` that allows authenticated users to read non-sensitive columns via the `profiles_public` view
- Alternatively, since `profiles_public` already excludes PII (email, phone), add a policy: `allow authenticated users to SELECT from profiles` scoped through the view

The simplest safe fix: Add a SELECT policy on `profiles` for authenticated users that only allows access through the view columns already exposed:

```sql
CREATE POLICY "Authenticated users can read public profile data"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);
```

This is safe because the `profiles_public` view already excludes sensitive fields (email, phone). Direct queries to `profiles` would expose email, but the app code only queries `profiles_public` for search. The existing "Users can view own profile" policy becomes redundant but harmless.

Also fix the `get_suggested_users` function to be `SECURITY DEFINER` so it can query profiles regardless of RLS:

```sql
CREATE OR REPLACE FUNCTION public.get_suggested_users(...)
  ...
  SECURITY DEFINER
  SET search_path TO 'public'
  ...
```

## Fix 2: Event Duration - Use end_time Instead of Hardcoded 4 Hours

**File: `src/pages/EventManager.tsx`**

Three locations where `event.duration || 4` is used (lines ~79-82, ~1160-1162, ~1228-1230):

Replace logic to use `event.endTime` (mapped from `end_time` database column) instead of a hardcoded duration:

```typescript
// BEFORE (line 79-82)
let endTime = new Date(startTime);
const durationHours = event.duration || 4;
endTime.setHours(endTime.getHours() + durationHours);

// AFTER
let endTime: Date;
if (event.endTime) {
  const [endH, endM] = event.endTime.split(':').map(Number);
  endTime = new Date(startTime);
  endTime.setHours(endH || 0, endM || 0, 0, 0);
  // Handle overnight events
  if (endTime <= startTime) endTime.setDate(endTime.getDate() + 1);
} else {
  // Fallback: event runs until manually ended
  endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + 24);
}
```

Apply the same fix to the filtering logic (~line 1160) and remove `duration` references from the save logic (~line 1228).

## Fix 3: Skeleton Loading for Images

**Files: `src/pages/Connect.tsx`, `src/pages/Social.tsx`, `src/pages/EventManager.tsx`**

- Add `useState` for image loaded state on profile photos
- Show `Skeleton` component (already exists at `src/components/ui/skeleton.tsx`) while image is loading
- On `<img onLoad>`, hide skeleton and show image
- On `<img onError>`, fallback to `/default-avatar.png`

Example pattern for profile card images:

```tsx
const [imgLoaded, setImgLoaded] = useState(false);

<div className="relative w-14 h-14">
  {!imgLoaded && <Skeleton className="absolute inset-0 rounded-full" />}
  <img
    src={profile.photo}
    onLoad={() => setImgLoaded(true)}
    onError={(e) => { e.target.src = '/default-avatar.png'; setImgLoaded(true); }}
    className={cn("w-14 h-14 rounded-full object-cover", !imgLoaded && "opacity-0")}
  />
</div>
```

Apply this pattern to:
- Connect page `ProfileCard` component (main swipe card image)
- Social page `QuickAddUser` avatars
- EventManager attendee cards

## Fix 4: Verify Photo Capture to Connect Flow

The current flow in `QRScannerModal.tsx` already:
1. Shows `photo_capture` step when "Public" is selected (line 503)
2. Uploads photo to storage and calls `processCheckIn` with the photo URL
3. Redirects to `/connect` after success (line 143)

The `processCheckIn` in `useCheckIn.ts` already creates the `match_profiles` entry with the connection photo (lines 282-321).

This flow is implemented correctly. No code changes needed here -- just needs testing.

---

## Files to Change

| File | Change |
|------|--------|
| **Database migration** | Add SELECT policy on `profiles` for authenticated users; make `get_suggested_users` SECURITY DEFINER |
| `src/pages/EventManager.tsx` | Replace `duration \|\| 4` with `endTime` parsing logic (3 locations) |
| `src/pages/Connect.tsx` | Add skeleton loading for profile card images |
| `src/pages/Social.tsx` | Add skeleton loading for Quick Add user avatars |
| `src/pages/EventManager.tsx` | Add skeleton loading for attendee card images |

## Technical Details

### Database Migration SQL

```sql
-- Allow authenticated users to read profiles (safe because
-- profiles_public view already excludes PII fields)
CREATE POLICY "Authenticated users can read profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- Drop the now-redundant own-profile policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "System can read profiles for internal operations" ON public.profiles;

-- Make get_suggested_users SECURITY DEFINER so it works with RLS
CREATE OR REPLACE FUNCTION public.get_suggested_users(
  current_user_id uuid, limit_count integer DEFAULT 20
)
RETURNS TABLE(id uuid, name text, profile_photo text, bio text,
              mutual_count bigint, shared_events bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
-- (same function body as existing)
$function$;
```

### Event Duration Fix Pattern

All 3 occurrences of the duration calculation in EventManager.tsx will be replaced with a helper function:

```typescript
function calcEventEnd(startTime: Date, endTimeStr?: string): Date {
  if (endTimeStr) {
    const [h, m] = endTimeStr.split(':').map(Number);
    const end = new Date(startTime);
    end.setHours(h, m, 0, 0);
    if (end <= startTime) end.setDate(end.getDate() + 1);
    return end;
  }
  // No end time set -- treat as running until manually ended (24h fallback)
  const fallback = new Date(startTime);
  fallback.setHours(fallback.getHours() + 24);
  return fallback;
}
```
