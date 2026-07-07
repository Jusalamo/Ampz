
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key ON public.profiles (lower(username)) WHERE username IS NOT NULL;

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS profiles_username_trgm ON public.profiles USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_name_trgm ON public.profiles USING gin (name gin_trgm_ops);

CREATE UNIQUE INDEX IF NOT EXISTS tickets_qr_code_key ON public.tickets (qr_code) WHERE qr_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.ticket_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'NAD',
  available_count integer NOT NULL DEFAULT 0,
  sold_count integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ticket_tiers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ticket_tiers TO authenticated;
GRANT ALL ON public.ticket_tiers TO service_role;

ALTER TABLE public.ticket_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tiers viewable by everyone" ON public.ticket_tiers;
CREATE POLICY "Tiers viewable by everyone" ON public.ticket_tiers FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Organizers manage their tiers" ON public.ticket_tiers;
CREATE POLICY "Organizers manage their tiers" ON public.ticket_tiers
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid()));

DROP TRIGGER IF EXISTS ticket_tiers_updated_at ON public.ticket_tiers;
CREATE TRIGGER ticket_tiers_updated_at BEFORE UPDATE ON public.ticket_tiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.increment_attendee_count(p_event_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.events SET attendees_count = COALESCE(attendees_count, 0) + 1 WHERE id = p_event_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.increment_attendee_count(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.purchase_ticket(p_event_id uuid, p_tier_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_tier public.ticket_tiers%ROWTYPE;
  v_ticket_id uuid;
  v_qr text := gen_random_uuid()::text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_tier FROM public.ticket_tiers WHERE id = p_tier_id AND event_id = p_event_id AND is_active = true FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tier unavailable'; END IF;
  IF v_tier.available_count <= v_tier.sold_count THEN RAISE EXCEPTION 'Sold out'; END IF;
  INSERT INTO public.tickets (event_id, user_id, qr_code, ticket_status, payment_status, amount_paid, currency, quantity, purchase_source, purchased_at)
  VALUES (p_event_id, v_user, v_qr, 'active', 'pending_door', v_tier.price, v_tier.currency, 1, 'in_app', now())
  RETURNING id INTO v_ticket_id;
  UPDATE public.ticket_tiers SET sold_count = sold_count + 1 WHERE id = p_tier_id;
  RETURN v_ticket_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.purchase_ticket(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.verify_ticket_qr(p_qr text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_ticket public.tickets%ROWTYPE;
  v_event public.events%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_ticket FROM public.tickets WHERE qr_code = p_qr FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  SELECT * INTO v_event FROM public.events WHERE id = v_ticket.event_id;
  IF v_event.organizer_id <> v_user THEN RAISE EXCEPTION 'Not the organizer'; END IF;
  IF v_ticket.ticket_status = 'used' THEN RETURN jsonb_build_object('ok', false, 'reason', 'already_used'); END IF;
  UPDATE public.tickets SET ticket_status = 'used', checked_in_at = now() WHERE id = v_ticket.id;
  UPDATE public.events SET attendees_count = COALESCE(attendees_count,0) + 1 WHERE id = v_event.id;
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_ticket.user_id;
  RETURN jsonb_build_object('ok', true, 'ticket_id', v_ticket.id, 'user_id', v_ticket.user_id,
    'name', v_profile.name, 'photo', v_profile.profile_photo, 'event_name', v_event.name);
END; $$;
GRANT EXECUTE ON FUNCTION public.verify_ticket_qr(text) TO authenticated;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='tickets') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='ticket_tiers') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_tiers';
  END IF;
END $$;
