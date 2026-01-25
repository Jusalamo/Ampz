-- Fix profiles RLS policies to prevent PII exposure to matched users
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view matched user profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view limited profiles at shared events" ON public.profiles;

-- Create a more restrictive policy that only allows viewing specific fields
-- Users can only see full profile data for themselves
-- For matched users, they should use the profiles_public view instead

-- Keep policy for own profile access (already secure)
-- The "Users can view own profile" policy stays as is

-- Add policy to allow system to query profiles for internal use
CREATE POLICY "System can read profiles for internal operations"
ON public.profiles FOR SELECT
USING (
  -- User can see their own profile
  auth.uid() = id
);

-- Note: Matched users should query profiles_public view which excludes sensitive fields
-- The profiles_public view already exists and excludes: email, phone, subscription_tier, 
-- subscription_expires_at, blocked_users, bookmarked_events, created_events, 
-- likes_remaining, last_like_reset, settings, failed_login_attempts, locked_until, last_login_at