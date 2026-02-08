

# Update `secure_check_in` Database Function Default Parameter

## What Changed

The `secure_check_in` database function currently has a default value of `'geolocation'` for the `p_verification_method` parameter. This is inconsistent with the client-side fix we just applied (changed to `'qr_scan'`) and with the CHECK constraint on the `check_ins` table that only allows `'qr_scan'` or `'access_code'`.

## Fix

Run a database migration to replace the function with an updated default:

```sql
CREATE OR REPLACE FUNCTION public.secure_check_in(
  p_event_id uuid,
  p_user_lat numeric,
  p_user_lng numeric,
  p_visibility_mode text DEFAULT 'public',
  p_verification_method text DEFAULT 'qr_scan'  -- Changed from 'geolocation'
)
```

The function body remains identical -- only the default parameter value changes.

## Summary

| Item | Change |
|------|--------|
| Function | `public.secure_check_in` |
| Parameter | `p_verification_method` default |
| Before | `'geolocation'` |
| After | `'qr_scan'` |
| Why | Matches CHECK constraint and client-side code |

