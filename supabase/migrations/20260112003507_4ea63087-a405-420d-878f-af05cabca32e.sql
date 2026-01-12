-- =====================================================
-- Server-Side Token Validation System
-- =====================================================

-- Create table to store secure event tokens
CREATE TABLE public.event_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(event_id, token_hash)
);

-- Enable RLS
ALTER TABLE public.event_tokens ENABLE ROW LEVEL SECURITY;

-- Organizers can manage their event tokens
CREATE POLICY "Organizers can manage their event tokens"
ON public.event_tokens
FOR ALL
USING (
  event_id IN (SELECT id FROM public.events WHERE organizer_id = auth.uid())
)
WITH CHECK (
  event_id IN (SELECT id FROM public.events WHERE organizer_id = auth.uid())
);

-- Create secure server-side token validation function
CREATE OR REPLACE FUNCTION public.validate_event_token(
  p_token_hash TEXT,
  p_event_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.event_tokens
    WHERE token_hash = p_token_hash
      AND event_id = p_event_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$;

-- Create function to generate and store a token hash for an event
CREATE OR REPLACE FUNCTION public.create_event_token(
  p_event_id UUID,
  p_token_hash TEXT,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_id UUID;
  v_organizer_id UUID;
BEGIN
  -- Verify the caller is the event organizer
  SELECT organizer_id INTO v_organizer_id
  FROM public.events
  WHERE id = p_event_id;
  
  IF v_organizer_id IS NULL OR v_organizer_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the event organizer can create tokens';
  END IF;
  
  -- Insert the token
  INSERT INTO public.event_tokens (event_id, token_hash, expires_at)
  VALUES (p_event_id, p_token_hash, p_expires_at)
  ON CONFLICT (event_id, token_hash) DO UPDATE SET
    is_active = true,
    expires_at = p_expires_at
  RETURNING id INTO v_token_id;
  
  RETURN v_token_id;
END;
$$;

-- =====================================================
-- Input Validation Constraints
-- =====================================================

-- Add content length constraint to community_comments
ALTER TABLE public.community_comments
ADD CONSTRAINT comment_content_length CHECK (length(content) <= 2000);

-- Add URL validation constraints to community_photos
ALTER TABLE public.community_photos
ADD CONSTRAINT photo_url_length CHECK (length(image_url) <= 2048);

ALTER TABLE public.community_photos
ADD CONSTRAINT photo_url_protocol CHECK (
  image_url ~* '^https?://'
);

-- Add index for faster token lookups
CREATE INDEX idx_event_tokens_lookup ON public.event_tokens(event_id, token_hash, is_active);