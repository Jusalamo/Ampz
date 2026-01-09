-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- ==========================================
-- USER ROLES TABLE (Security best practice)
-- ==========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ==========================================
-- PROFILES TABLE
-- ==========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  age INTEGER,
  bio TEXT,
  occupation TEXT,
  company TEXT,
  location TEXT,
  gender TEXT,
  interests TEXT[],
  profile_photo TEXT,
  phone TEXT,
  
  -- Account status
  is_demo_account BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- Subscription
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'max')),
  subscription_expires_at TIMESTAMPTZ,
  
  -- Settings stored as JSONB
  settings JSONB DEFAULT '{"theme": "dark", "currency": "NAD", "notifications": {"matches": true, "messages": true, "events": true, "profileViews": true}, "privacy": {"searchable": true, "showDistance": true, "showOnline": true, "messageFrom": "everyone"}}'::jsonb,
  
  -- Security
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  
  -- Lists
  blocked_users UUID[] DEFAULT '{}',
  bookmarked_events UUID[] DEFAULT '{}',
  created_events UUID[] DEFAULT '{}',
  
  -- Likes
  likes_remaining INTEGER DEFAULT 25,
  last_like_reset TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- EVENTS TABLE
-- ==========================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  custom_theme TEXT DEFAULT '#8B5CF6',
  
  -- Date & Time
  date DATE NOT NULL,
  time TIME NOT NULL,
  timezone TEXT DEFAULT 'Africa/Windhoek',
  
  -- Location (manual input)
  location TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  geofence_radius INTEGER DEFAULT 50 CHECK (geofence_radius BETWEEN 10 AND 300),
  
  -- Media
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  media_type TEXT DEFAULT 'carousel' CHECK (media_type IN ('carousel', 'video')),
  has_video BOOLEAN DEFAULT FALSE,
  
  -- Ticketing
  price DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'NAD',
  max_attendees INTEGER DEFAULT 500,
  attendees_count INTEGER DEFAULT 0,
  
  -- QR Code & Access
  qr_code TEXT UNIQUE NOT NULL,
  access_code TEXT UNIQUE,
  
  -- Tags
  tags TEXT[] DEFAULT '{}',
  
  -- Status
  is_demo BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create indexes for events
CREATE INDEX idx_events_organizer ON public.events(organizer_id);
CREATE INDEX idx_events_date ON public.events(date) WHERE is_active = TRUE;
CREATE INDEX idx_events_category ON public.events(category);
CREATE INDEX idx_events_location ON public.events(latitude, longitude);

-- ==========================================
-- TICKETS TABLE
-- ==========================================
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Purchase info
  purchase_source TEXT NOT NULL CHECK (purchase_source IN ('webtickets', 'native', 'free')),
  external_ticket_id TEXT,
  purchase_reference TEXT UNIQUE NOT NULL,
  
  -- Payment
  amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NAD',
  payment_provider TEXT,
  payment_status TEXT DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Ticket status
  ticket_status TEXT DEFAULT 'active' CHECK (ticket_status IN ('active', 'used', 'cancelled', 'refunded')),
  quantity INTEGER DEFAULT 1,
  checked_in_at TIMESTAMPTZ,
  
  -- QR Code for ticket
  qr_code TEXT UNIQUE NOT NULL,
  
  -- Metadata
  is_demo BOOLEAN DEFAULT FALSE,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, event_id)
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- CHECK-INS TABLE
-- ==========================================
CREATE TABLE public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
  
  -- Check-in details
  visibility_mode TEXT NOT NULL CHECK (visibility_mode IN ('public', 'private')),
  
  -- Location verification
  check_in_latitude DECIMAL(10, 8) NOT NULL,
  check_in_longitude DECIMAL(11, 8) NOT NULL,
  distance_from_venue DECIMAL(10, 2),
  within_geofence BOOLEAN NOT NULL,
  
  -- Verification
  verification_photo TEXT,
  verification_method TEXT CHECK (verification_method IN ('qr_scan', 'access_code')),
  
  -- Metadata
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, event_id)
);

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- MATCH PROFILES TABLE (Connect Page)
-- ==========================================
CREATE TABLE public.match_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  check_in_id UUID REFERENCES public.check_ins(id) ON DELETE CASCADE,
  
  -- Profile info (specific to this event)
  display_name TEXT NOT NULL,
  bio TEXT,
  profile_photos TEXT[] DEFAULT '{}',
  age INTEGER,
  interests TEXT[] DEFAULT '{}',
  location TEXT,
  occupation TEXT,
  gender TEXT,
  
  -- Visibility
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, event_id)
);

ALTER TABLE public.match_profiles ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- SWIPES TABLE
-- ==========================================
CREATE TABLE public.swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  swiped_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  
  -- Swipe details
  direction TEXT NOT NULL CHECK (direction IN ('right', 'left')),
  
  -- Metadata
  swiped_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(swiper_id, swiped_id, event_id)
);

ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- MATCHES TABLE
-- ==========================================
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  
  -- Match status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unmatched', 'blocked')),
  unmatched_by UUID REFERENCES public.profiles(id),
  unmatched_at TIMESTAMPTZ,
  
  -- Last message info
  last_message TEXT,
  last_message_time TIMESTAMPTZ,
  last_message_unread BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  is_demo BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_muted BOOLEAN DEFAULT FALSE,
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- MESSAGES TABLE
-- ==========================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Message content
  content TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'event', 'location')),
  media_url TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- NOTIFICATIONS TABLE
-- ==========================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Notification content
  type TEXT NOT NULL CHECK (type IN ('match', 'message', 'event', 'like', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related data
  related_match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  related_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  related_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  is_demo BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- COMMUNITY PHOTOS TABLE
-- ==========================================
CREATE TABLE public.community_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Photo content
  image_url TEXT NOT NULL,
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  liked_by UUID[] DEFAULT '{}',
  
  -- Metadata
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_photos ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- COMMUNITY COMMENTS TABLE
-- ==========================================
CREATE TABLE public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Comment content
  content TEXT NOT NULL,
  reply_to UUID REFERENCES public.community_comments(id) ON DELETE SET NULL,
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  liked_by UUID[] DEFAULT '{}',
  
  -- Metadata
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

-- Profiles policies
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- Events policies
CREATE POLICY "Anyone can view active events"
ON public.events FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "Authenticated users can create events"
ON public.events FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND organizer_id = auth.uid());

CREATE POLICY "Event organizers can update their events"
ON public.events FOR UPDATE
USING (organizer_id = auth.uid())
WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Event organizers can delete their events"
ON public.events FOR DELETE
USING (organizer_id = auth.uid());

-- Tickets policies
CREATE POLICY "Users can view their own tickets"
ON public.tickets FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own tickets"
ON public.tickets FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tickets"
ON public.tickets FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Check-ins policies
CREATE POLICY "Users can view their own check-ins"
ON public.check_ins FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view public check-ins at their events"
ON public.check_ins FOR SELECT
USING (
  visibility_mode = 'public' AND 
  event_id IN (SELECT event_id FROM public.check_ins WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create check-ins"
ON public.check_ins FOR INSERT
WITH CHECK (user_id = auth.uid() AND within_geofence = TRUE);

-- Match profiles policies
CREATE POLICY "Users can view their own match profiles"
ON public.match_profiles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view public match profiles at their events"
ON public.match_profiles FOR SELECT
USING (
  is_active = TRUE AND 
  is_public = TRUE AND
  event_id IN (SELECT event_id FROM public.check_ins WHERE user_id = auth.uid() AND visibility_mode = 'public')
);

CREATE POLICY "Users can create their own match profiles"
ON public.match_profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own match profiles"
ON public.match_profiles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Swipes policies
CREATE POLICY "Users can view their own swipes"
ON public.swipes FOR SELECT
USING (swiper_id = auth.uid());

CREATE POLICY "Users can create swipes"
ON public.swipes FOR INSERT
WITH CHECK (swiper_id = auth.uid());

-- Matches policies
CREATE POLICY "Users can view their own matches"
ON public.matches FOR SELECT
USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can update their own matches"
ON public.matches FOR UPDATE
USING (user1_id = auth.uid() OR user2_id = auth.uid())
WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view messages in their matches"
ON public.messages FOR SELECT
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update messages"
ON public.messages FOR UPDATE
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Community photos policies
CREATE POLICY "Anyone can view community photos"
ON public.community_photos FOR SELECT
USING (true);

CREATE POLICY "Users can upload community photos"
ON public.community_photos FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own photos"
ON public.community_photos FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own photos"
ON public.community_photos FOR DELETE
USING (user_id = auth.uid());

-- Community comments policies
CREATE POLICY "Anyone can view community comments"
ON public.community_comments FOR SELECT
USING (true);

CREATE POLICY "Users can create comments"
ON public.community_comments FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own comments"
ON public.community_comments FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
ON public.community_comments FOR DELETE
USING (user_id = auth.uid());

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_match_profiles_updated_at
  BEFORE UPDATE ON public.match_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate distance (Haversine formula)
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL,
  lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  earth_radius DECIMAL := 6371000;
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlon/2) * sin(dlon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Function to check if within geofence
CREATE OR REPLACE FUNCTION public.is_within_geofence(
  event_uuid UUID,
  user_lat DECIMAL,
  user_lon DECIMAL
) RETURNS BOOLEAN AS $$
DECLARE
  event_lat DECIMAL;
  event_lon DECIMAL;
  radius INTEGER;
  distance DECIMAL;
BEGIN
  SELECT latitude, longitude, geofence_radius 
  INTO event_lat, event_lon, radius
  FROM public.events 
  WHERE id = event_uuid;
  
  distance := public.calculate_distance(user_lat, user_lon, event_lat, event_lon);
  
  RETURN distance <= radius;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to create match when mutual swipe
CREATE OR REPLACE FUNCTION public.create_match_on_mutual_swipe()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.direction = 'right' THEN
    IF EXISTS(
      SELECT 1 FROM public.swipes
      WHERE swiper_id = NEW.swiped_id
        AND swiped_id = NEW.swiper_id
        AND event_id = NEW.event_id
        AND direction = 'right'
    ) THEN
      INSERT INTO public.matches (user1_id, user2_id, event_id)
      VALUES (
        LEAST(NEW.swiper_id, NEW.swiped_id),
        GREATEST(NEW.swiper_id, NEW.swiped_id),
        NEW.event_id
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_create_match_on_mutual_swipe
  AFTER INSERT ON public.swipes
  FOR EACH ROW EXECUTE FUNCTION public.create_match_on_mutual_swipe();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, created_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NOW()
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to increment attendees count
CREATE OR REPLACE FUNCTION public.increment_attendees()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.events 
  SET attendees_count = attendees_count + 1
  WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_increment_attendees
  AFTER INSERT ON public.check_ins
  FOR EACH ROW EXECUTE FUNCTION public.increment_attendees();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.check_ins;