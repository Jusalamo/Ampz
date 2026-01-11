-- Add ticket_link column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ticket_link TEXT DEFAULT '';

-- Update comment for clarity
COMMENT ON COLUMN public.events.ticket_link IS 'External WebTickets link for ticket purchase';