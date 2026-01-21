-- =====================================================
-- Security Fix: Address 3 critical security vulnerabilities
-- =====================================================

-- Fix 1: Ensure RLS is properly enabled and forced on all sensitive tables
-- This ensures even table owners are subject to RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins FORCE ROW LEVEL SECURITY;

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches FORCE ROW LEVEL SECURITY;

-- Fix 2: matches_insert_policy_missing
-- The matches table should ONLY allow inserts via the create_match_on_mutual_swipe trigger
-- which is a SECURITY DEFINER function that bypasses RLS
-- Direct user inserts should be blocked to prevent fake matches
CREATE POLICY "Matches created via mutual swipe trigger only"
ON public.matches
FOR INSERT
WITH CHECK (false);

-- Fix 3: Strengthen check_ins access - ensure only authenticated users with proper relationships can view
-- Drop and recreate policies to ensure they are PERMISSIVE (default) not RESTRICTIVE

-- First check if policies exist and drop them to recreate properly
DROP POLICY IF EXISTS "Users can view public check-ins at their events" ON public.check_ins;
DROP POLICY IF EXISTS "Users can view their own check-ins" ON public.check_ins;

-- Recreate as explicit PERMISSIVE policies
-- Users can view their own check-ins (required for app functionality)
CREATE POLICY "Users can view own check-ins"
ON public.check_ins
FOR SELECT
USING (auth.uid() = user_id);

-- Users can view other check-ins only at events they're also checked into AND only if public visibility
CREATE POLICY "Users can view public check-ins at mutual events"
ON public.check_ins
FOR SELECT
USING (
  visibility_mode = 'public'
  AND auth.uid() IS NOT NULL
  AND event_id IN (
    SELECT event_id FROM public.check_ins 
    WHERE user_id = auth.uid()
  )
);

-- Fix 4: Strengthen profiles access - ensure proper PERMISSIVE policies
-- Drop and recreate to ensure correct policy type

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view matched profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles at same event" ON public.profiles;

-- Users can always view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Users can view profiles of users they're matched with (active matches only)
CREATE POLICY "Users can view matched user profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND id IN (
    SELECT user1_id FROM public.matches 
    WHERE user2_id = auth.uid() AND status = 'active'
    UNION
    SELECT user2_id FROM public.matches 
    WHERE user1_id = auth.uid() AND status = 'active'
  )
);

-- Users can view profiles of users at events they're also attending (via match_profiles which are public)
CREATE POLICY "Users can view profiles at shared events"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND id IN (
    SELECT mp.user_id FROM public.match_profiles mp
    WHERE mp.is_public = true 
    AND mp.is_active = true
    AND mp.event_id IN (
      SELECT event_id FROM public.check_ins WHERE user_id = auth.uid()
    )
  )
);