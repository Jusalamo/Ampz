

# Fix: Check-In Always Fails After Geofence Success

## Root Cause (Confirmed)

The `check_ins` table has a **database CHECK constraint**:

```
CHECK (verification_method = ANY (ARRAY['qr_scan', 'access_code']))
```

The code currently inserts `verification_method: 'geolocation'`, which **violates this constraint**. The database rejects the insert every time, causing the "Check-in failed" error -- even when geofence verification succeeds.

## Fix

### 1. Update `src/hooks/useCheckIn.ts` - Line 260

Change `verification_method` from `'geolocation'` to `'qr_scan'` (which is the correct value since the user scanned a QR code):

```typescript
// BEFORE (line 260)
verification_method: 'geolocation',

// AFTER
verification_method: 'qr_scan',
```

This is the **only** change needed to fix the check-in failure. The value `'qr_scan'` is semantically correct -- users ARE scanning a QR code; geolocation is just the validation mechanism, not the check-in method.

### 2. Fix `match_profiles` upsert conflict target (line 297-313)

The `match_profiles` table has a UNIQUE constraint on `(user_id, event_id)`. The current `.upsert()` call needs an explicit `onConflict` option to work properly:

```typescript
// BEFORE
await supabase
  .from('match_profiles')
  .upsert({
    user_id: userId,
    event_id: event.id,
    check_in_id: checkIn?.id,
    // ...
  });

// AFTER
await supabase
  .from('match_profiles')
  .upsert({
    user_id: userId,
    event_id: event.id,
    check_in_id: checkIn?.id,
    // ...
  }, { onConflict: 'user_id,event_id' });
```

### 3. Make match_profile creation failure non-blocking

Currently, if the match_profile creation fails (e.g., profile data is missing), the entire check-in appears to fail. Wrap it in a try-catch so check-in succeeds regardless:

```typescript
// After successful check-in insert, wrap match profile in try-catch
if (visibilityMode === 'public') {
  try {
    // ... existing match_profile logic ...
  } catch (matchErr) {
    console.warn('Match profile creation failed (non-blocking):', matchErr);
  }
}
```

## Summary of Changes

| File | Change | Why |
|------|--------|-----|
| `src/hooks/useCheckIn.ts` line 260 | `'geolocation'` to `'qr_scan'` | Violates CHECK constraint, root cause of failure |
| `src/hooks/useCheckIn.ts` line 297 | Add `onConflict: 'user_id,event_id'` | Upsert needs explicit conflict target |
| `src/hooks/useCheckIn.ts` lines 281-314 | Wrap in try-catch | Match profile failure shouldn't block check-in |

These 3 small changes in **1 file** will permanently fix the check-in flow.
