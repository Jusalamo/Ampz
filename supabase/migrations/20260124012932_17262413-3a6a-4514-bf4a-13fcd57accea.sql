-- Add end_time column and ended_at for event lifecycle (if not exists already)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'end_time') THEN
    ALTER TABLE public.events ADD COLUMN end_time time without time zone;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'ended_at') THEN
    ALTER TABLE public.events ADD COLUMN ended_at timestamp with time zone;
  END IF;
END $$;

-- Enable real-time for tables not already enabled (check each before adding)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['events', 'community_photos', 'community_comments', 'notifications', 'profiles'])
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;

-- Create function to send check-in notification to event organizer
CREATE OR REPLACE FUNCTION public.notify_organizer_on_check_in()
RETURNS TRIGGER AS $$
DECLARE
  v_event_name TEXT;
  v_organizer_id UUID;
  v_user_name TEXT;
BEGIN
  -- Get event details
  SELECT name, organizer_id INTO v_event_name, v_organizer_id
  FROM public.events
  WHERE id = NEW.event_id;
  
  -- Get user name
  SELECT name INTO v_user_name
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  -- Create notification for organizer
  IF v_organizer_id IS NOT NULL AND v_organizer_id != NEW.user_id THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      related_event_id,
      related_user_id,
      is_read
    ) VALUES (
      v_organizer_id,
      'check_in',
      'New Check-in!',
      COALESCE(v_user_name, 'Someone') || ' just checked in to ' || COALESCE(v_event_name, 'your event'),
      NEW.event_id,
      NEW.user_id,
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for check-in notifications
DROP TRIGGER IF EXISTS on_check_in_notify_organizer ON public.check_ins;
CREATE TRIGGER on_check_in_notify_organizer
  AFTER INSERT ON public.check_ins
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_organizer_on_check_in();