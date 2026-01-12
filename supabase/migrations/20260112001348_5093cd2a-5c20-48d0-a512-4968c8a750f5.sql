-- Fix profiles RLS: Restrict access to own profile and matched profiles only
-- This prevents exposure of sensitive PII (email, phone, subscription data) to all users

-- First drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());

-- Allow users to view profiles they have matched with
CREATE POLICY "Users can view matched profiles"
ON public.profiles FOR SELECT
USING (
  id IN (
    SELECT user1_id FROM public.matches 
    WHERE user2_id = auth.uid() AND status = 'active'
    UNION
    SELECT user2_id FROM public.matches 
    WHERE user1_id = auth.uid() AND status = 'active'
  )
);

-- Allow users to view profiles of people checked into the same event (for matching feature)
CREATE POLICY "Users can view profiles at same event"
ON public.profiles FOR SELECT
USING (
  id IN (
    SELECT mp.user_id 
    FROM public.match_profiles mp
    WHERE mp.is_public = true 
    AND mp.is_active = true
    AND mp.event_id IN (
      SELECT event_id FROM public.check_ins WHERE user_id = auth.uid()
    )
  )
);