-- Add ended_by column to track auto vs manual event ending
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ended_by text;