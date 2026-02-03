
# Comprehensive AMPZ UX & Code Quality Improvement Plan

## Overview
This plan addresses 17 interconnected improvement areas across the AMPZ app, focusing on map persistence, performance optimization, check-in flow fixes, real database queries, Tailwind theming consistency, and UX refinements following Instagram/Snapchat best practices.

---

## Phase 1: MapContext for Persistent Map Instance

### Problem
The map reloads every time the user navigates, causing flickering and delays.

### Solution
Create a `MapContext` that maintains a singleton Mapbox instance across all navigations.

### Implementation
**New File: `src/contexts/MapContext.tsx`**
- Create context with `map` instance, `isReady` state, and container ref
- Initialize map once on app mount
- Move map container to root level (above routes)
- MapDrawer and other components reference the shared instance

**Changes to `src/App.tsx`**
- Wrap routes with `MapProvider`
- Render hidden map container at app root

**Changes to `src/components/MapDrawer.tsx`**
- Remove local map initialization
- Use `useMapContext()` to access shared map
- Add/remove layers and markers without recreating map

---

## Phase 2: Performance & Caching Optimization

### Problem
User data and events take noticeable time to load, causing UX lag.

### Solution
Implement local caching with instant display and background refresh.

### Implementation
**Changes to `src/contexts/AppContext.tsx`**
1. Add localStorage caching for:
   - User profile data
   - Events list
   - Subscription status (persist and never reset on restart)
2. On app launch:
   - Immediately display cached data (< 100ms)
   - Fetch fresh data in background
   - Update UI only if data changed
3. Add subscription persistence:
   - Store tier/status in database
   - Never reset on app restart
   - Only change when user explicitly upgrades/downgrades

**Cache Implementation**
```text
Load Flow:
1. App mounts → Load cached user + events from localStorage
2. Display cached data instantly
3. Background fetch from Supabase
4. If different, update state and cache
```

---

## Phase 3: Remove Avatar Placeholders

### Problem
Using DiceBear avatar placeholders instead of real profile photos.

### Solution
Replace all avatar fallbacks with a consistent user profile photo image that they choose.

### Implementation
**Changes to `src/contexts/AppContext.tsx`**
- Line 67: Change `profilePhoto: profile.profile_photo || '/default-avatar.png'`
- Remove DiceBear URL generation

**Changes to all components using avatars:**
- `src/pages/Home.tsx`
- `src/pages/Profile.tsx`
- `src/pages/Social.tsx`
- `src/components/MapDrawer.tsx`
- Use `/default-avatar.png` as fallback everywhere
- Add `onError` handler to show default if image fails to load

**Create default avatar asset:**
- Add `/public/default-avatar.png` (simple silhouette icon)

---

## Phase 4: Fix Check-In Flow Loop

### Problem
The flow gets stuck switching between "Checking Location" and "Choose Visibility" steps.

### Solution
Simplify the flow: once geofence check passes, proceed directly to privacy choice without re-checking.

### Implementation
**Changes to `src/components/modals/QRScannerModal.tsx`**

**Simplified Flow:**
```text
1. Scan QR → Extract event ID
2. Validate event (active, not ended)
3. Check already checked in → Show success
4. Geofence check (one-time):
   - Pass → Go to privacy_choice
   - Fail → Show outside_geofence with retry
5. Privacy choice (public/private)
6. Execute check-in
7. If public → Navigate to /connect
8. If private → Show "Welcome to event"
```

**Key Fixes:**
- Remove redundant geofence re-check after privacy choice
- Cache geofence result to prevent re-verification
- After successful check-in with "public" mode → Navigate to Connect page
- After successful check-in with "private" mode → Show welcome message and close

---

## Phase 5: Real Database Metrics (Home & Profile)

### Problem
Profile shows mock data (12 matches, 95% response rate) instead of real metrics.

### Solution
Query database for actual events attended, matches count, and likes remaining.

### Implementation
**Changes to `src/pages/Home.tsx`**

Remove the hardcoded stats array (lines 134-153) and replace with:
```typescript
// Fetch real metrics
const [metrics, setMetrics] = useState({ events: 0, matches: 0, likesLeft: 0 });

useEffect(() => {
  if (!user?.id) return;
  
  // Fetch events attended (check-ins)
  const fetchMetrics = async () => {
    const { count: eventsCount } = await supabase
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    const { count: matchesCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
    
    setMetrics({
      events: eventsCount || 0,
      matches: matchesCount || 0,
      likesLeft: user.subscription.tier === 'free' 
        ? (user.likesRemaining ?? 10) 
        : 'Unlimited'
    });
  };
  
  fetchMetrics();
}, [user?.id]);
```

**Changes to `src/pages/Profile.tsx`**
- Remove mock stats (lines 26-30)
- Replace "95% Response" with "Likes Left"
- Use same real database queries as Home

---

## Phase 6: Remove Redundant Items (Profile vs Settings)

### Problem
Duplicate items exist in both Profile and Settings pages.

### Solution
Follow Instagram pattern - Profile for viewing, Settings for configuration.

### Implementation
**Profile Page keeps:**
- Profile card (photo, name, bio, interests)
- Real metrics (Events, Matches, Likes Left)
- Quick actions: Edit Profile, Subscription
- Theme toggle (convenience)
- Log Out

**Profile Page removes:**
- Privacy Settings (move to Settings only)
- Analytics (keep in Settings only)
- Duplicate menu items

**Settings Page keeps:**
- Account management (email, password, phone)
- Privacy & Security
- Preferences (theme, currency, notifications)
- Subscription management
- Help & Support
- Delete Account

---

## Phase 7: Remove Analytics from Home Page

### Problem
Analytics tabs on home page are redundant (exist in Profile).

### Solution
Remove analytics section from Home, keep quick actions and event sections.

### Implementation
**Changes to `src/pages/Home.tsx`**
- Remove any analytics tabs/sections
- Keep: Welcome, Stats Grid (with real data), Quick Actions, Explore Map button, My Events, Featured Events

---

## Phase 8: Event Map Pins with Images

### Problem
Map pins use generic circles/stars instead of event images.

### Solution
Use event cover images as map markers like Instagram but the pins should still have the circle border.

### Implementation
**Changes to `src/components/MapDrawer.tsx`**

Replace the marker creation (lines 296-307) with image-based markers:
```typescript
const markerEl = document.createElement('div');
markerEl.className = 'event-marker cursor-pointer';
markerEl.innerHTML = `
  <div class="w-12 h-12 rounded-full overflow-hidden border-3 border-white shadow-lg transform transition-transform duration-200 hover:scale-110">
    <img 
      src="${sanitizeImageUrl(event.coverImage)}" 
      alt="${escapeHtml(event.name)}"
      class="w-full h-full object-cover"
      onerror="this.src='/default-event.png'"
    />
    ${event.isFeatured ? `
      <div class="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
        <svg class="w-3 h-3 text-yellow-900" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292..."></path>
        </svg>
      </div>
    ` : ''}
  </div>
`;
```

---

## Phase 9: Friend Locations on Map (Foundation)

### Problem
No ability to see friends on map like Snapchat.

### Solution
Add foundation for friend location tracking (opt-in).

### Implementation
**Database Migration:**
```sql
CREATE TABLE user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL UNIQUE,
  latitude DECIMAL NOT NULL,
  longitude DECIMAL NOT NULL,
  accuracy DECIMAL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_visible BOOLEAN DEFAULT false
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;
```

**New File: `src/hooks/useFriendLocations.ts`**
- Subscribe to friends' locations via realtime
- Only show friends with `is_visible = true`
- Return array of friend markers

**Changes to MapDrawer:**
- Add friend markers with profile photos
- Different styling from event markers (smaller, blue border)

---

## Phase 10: Convert EventDetail.tsx to Semantic Tailwind

### Problem
EventDetails uses hardcoded DESIGN object for colors.

### Solution
Replace with semantic Tailwind classes while keeping layout unchanged.

### Implementation
**Changes to `src/pages/EventDetail.tsx`**

Remove DESIGN object (lines 17-56) and replace all inline styles:

| DESIGN Property | Tailwind Class |
|----------------|----------------|
| `DESIGN.colors.primary` | `text-primary`, `bg-primary` |
| `DESIGN.colors.background` | `bg-background` |
| `DESIGN.colors.card` | `bg-card` |
| `DESIGN.colors.textPrimary` | `text-foreground` |
| `DESIGN.colors.textSecondary` | `text-muted-foreground` |
| `DESIGN.borderRadius.card` | `rounded-ampz-lg` or `rounded-[24px]` |

Example conversion:
```typescript
// Before
style={{ background: DESIGN.colors.card, borderRadius: DESIGN.borderRadius.card }}

// After
className="bg-card rounded-[24px]"
```

---

## Phase 11: Convert EventManager.tsx to Semantic Tailwind

### Problem
EventManager uses hardcoded DESIGN object.

### Solution
Same approach as EventDetail - replace inline styles with Tailwind classes.

### Implementation
**Changes to `src/pages/EventManager.tsx`**
- Remove DESIGN object (lines 54-90)
- Replace all `style={}` with `className=""`
- Ensure event updates persist and reflect in real-time

---

## Phase 12: Convert MapDrawer.tsx to Semantic Tailwind

### Problem
MapDrawer uses hardcoded DESIGN object.

### Solution
Replace with semantic Tailwind classes.

### Implementation
**Changes to `src/components/MapDrawer.tsx`**
- Remove DESIGN object (lines 14-43)
- Update all components to use `bg-card`, `text-foreground`, `rounded-ampz-lg`, etc.

---

## Phase 13: Fix Modal Clipping Issues

### Problem
Modal headers/footers clip against screen edges.

### Solution
Add safe area padding and proper max-height constraints.

### Implementation
**Changes to all modals:**

Add to modal containers:
```typescript
className="fixed inset-0 z-50 flex items-center justify-center p-4 safe-area-inset"
```

Modal content:
```typescript
className="max-h-[calc(100vh-4rem)] flex flex-col overflow-hidden"
```

Modal footer:
```typescript
className="sticky bottom-0 p-4 bg-background border-t border-border pb-safe"
```

**Global CSS addition to `src/index.css`:**
```css
.modal-safe-top {
  padding-top: max(1rem, env(safe-area-inset-top));
}

.modal-safe-bottom {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
```

---

## Phase 14: User Search Enhancement

### Problem
Need autocomplete with fuzzy matching for friend search.

### Solution
Enhance search with Levenshtein-like fuzzy matching and instant results.

### Implementation
**Changes to `src/hooks/useFriends.ts`**

Enhance `searchUsers` function:
```typescript
const searchUsers = async (query: string) => {
  if (query.length < 2) return [];
  
  // Use ilike for fuzzy matching
  const { data } = await supabase
    .from('profiles')
    .select('id, name, profile_photo, bio')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .neq('id', userId)
    .limit(10);
  
  return data?.map(p => ({
    id: p.id,
    name: p.name,
    photo: p.profile_photo || '/default-avatar.png',
    bio: p.bio || ''
  })) || [];
};
```

**Changes to `src/pages/Social.tsx`**
- Show results starting from 2 characters
- Results refine as more letters are typed
- Show "Quick Add" suggestions section

---

## Phase 15: Global CSS Consistency Audit

### Problem
Inconsistent styling across pages.

### Solution
Ensure all pages use global CSS classes from index.css.

### Implementation
**Audit all pages for:**
1. Replace any `style={}` with Tailwind classes
2. Use `ampz-card`, `ampz-btn-primary`, `ampz-interactive` consistently
3. Use `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`
4. Use `rounded-ampz-lg`, `rounded-ampz-md`, `rounded-ampz-sm` (add to tailwind.config if needed)

**Add to `tailwind.config.ts`:**
```typescript
borderRadius: {
  'ampz-sm': 'var(--radius-sm)',
  'ampz-md': 'var(--radius-md)',
  'ampz-lg': 'var(--radius-lg)',
}
```

---

## Phase 16: Subscription Persistence

### Problem
Subscription resets on app restart.

### Solution
Persist subscription in database and load on app start.

### Implementation
**Changes to `src/contexts/AppContext.tsx`**
- On login/session restore, fetch subscription from database
- Store in localStorage for instant load
- Never reset subscription state on app restart
- Only update when user explicitly changes

---

## Phase 17: Event Manager Real-Time Sync

### Problem
Edits in Event Manager don't persist properly and even when an event is still on it shows past badge.

### Solution
Ensure all edits trigger database updates and reflect in real-time and the bages should live or ended.

### Implementation
**Verify in `src/pages/EventManager.tsx`:**
- All edit actions call `updateEvent` from AppContext
- Real-time subscription updates local state
- Toast confirmations on successful saves

---

## Implementation Order

| Priority | Phase | Estimated Files |
|----------|-------|-----------------|
| Critical | Phase 4: Fix Check-In Flow | 1 file |
| Critical | Phase 1: MapContext | 3 files |
| Critical | Phase 2: Caching | 1 file |
| High | Phase 5: Real Metrics | 2 files |
| High | Phase 3: Remove Avatars | 5 files |
| High | Phase 10-12: Tailwind Conversion | 3 files |
| Medium | Phase 6: Profile/Settings Cleanup | 2 files |
| Medium | Phase 7: Remove Home Analytics | 1 file |
| Medium | Phase 8: Event Image Pins | 1 file |
| Medium | Phase 13: Modal Clipping | 5+ files |
| Medium | Phase 14: Search Enhancement | 2 files |
| Low | Phase 9: Friend Locations | 3 files |
| Low | Phase 15-17: Polish | Various |

---

## Files to Create
1. `src/contexts/MapContext.tsx`
2. `src/hooks/useFriendLocations.ts`
3. `public/default-avatar.png` (asset)

## Files to Modify
- `src/App.tsx`
- `src/contexts/AppContext.tsx`
- `src/components/MapDrawer.tsx`
- `src/components/modals/QRScannerModal.tsx`
- `src/pages/Home.tsx`
- `src/pages/Profile.tsx`
- `src/pages/Settings.tsx`
- `src/pages/EventDetail.tsx`
- `src/pages/EventManager.tsx`
- `src/pages/Social.tsx`
- `src/index.css`
- `tailwind.config.ts`
- Various modal components

## Database Migration Required
- `user_locations` table for friend tracking feature

---

## Testing Checklist
- [ ] Map persists across navigation (no reload)
- [ ] User data loads instantly from cache
- [ ] Check-in flow completes without loops
- [ ] Public check-in navigates to Connect page
- [ ] Private check-in shows welcome message
- [ ] Profile shows real events/matches/likes
- [ ] No placeholder avatars (only real photos or default)
- [ ] Event pins show cover images
- [ ] All modals have proper safe area padding
- [ ] Friend search works with 2+ characters
- [ ] Subscription persists across restarts
- [ ] All pages use consistent Tailwind classes
