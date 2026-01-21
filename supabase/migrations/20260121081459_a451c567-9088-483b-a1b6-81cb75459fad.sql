-- =====================================================
-- Moderation System for Community Content
-- Add role-based moderation capabilities
-- =====================================================

-- Create content_moderation_actions table for tracking moderation decisions
CREATE TABLE public.content_moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('photo', 'comment')),
  content_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'hide', 'warn', 'delete')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on moderation actions
ALTER TABLE public.content_moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_moderation_actions FORCE ROW LEVEL SECURITY;

-- Only admins and moderators can view/create moderation actions
CREATE POLICY "Moderators can view moderation actions"
ON public.content_moderation_actions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Moderators can create moderation actions"
ON public.content_moderation_actions
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Add moderation status columns to community_photos
ALTER TABLE public.community_photos 
  ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending' 
    CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'hidden')),
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.profiles(id);

-- Add moderation status columns to community_comments  
ALTER TABLE public.community_comments
  ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'hidden')),
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.profiles(id);

-- Create policy for moderators to update community photos moderation status
CREATE POLICY "Moderators can update photo moderation"
ON public.community_photos
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Create policy for moderators to update community comments moderation status
CREATE POLICY "Moderators can update comment moderation"
ON public.community_comments
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Create policy for moderators to delete any photos
CREATE POLICY "Moderators can delete any photos"
ON public.community_photos
FOR DELETE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Create policy for moderators to delete any comments
CREATE POLICY "Moderators can delete any comments"
ON public.community_comments
FOR DELETE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Allow moderators to view all events (including inactive)
CREATE POLICY "Moderators can view all events"
ON public.events
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Add index for efficient moderation queries
CREATE INDEX IF NOT EXISTS idx_community_photos_moderation ON public.community_photos(moderation_status);
CREATE INDEX IF NOT EXISTS idx_community_comments_moderation ON public.community_comments(moderation_status);