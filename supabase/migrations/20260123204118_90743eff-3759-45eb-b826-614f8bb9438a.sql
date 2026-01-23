-- Create friend_requests table for Snapchat-style friend system
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_friend_request UNIQUE (sender_id, receiver_id)
);

-- Create friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_friendship UNIQUE (user1_id, user2_id),
  CONSTRAINT ordered_users CHECK (user1_id < user2_id)
);

-- Enable RLS
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- RLS policies for friend_requests
CREATE POLICY "Users can view their own friend requests"
  ON public.friend_requests FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send friend requests"
  ON public.friend_requests FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Receiver can update request status"
  ON public.friend_requests FOR UPDATE
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

CREATE POLICY "Users can delete their own requests"
  ON public.friend_requests FOR DELETE
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- RLS policies for friendships
CREATE POLICY "Users can view their friendships"
  ON public.friendships FOR SELECT
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "System can create friendships"
  ON public.friendships FOR INSERT
  WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can delete their friendships"
  ON public.friendships FOR DELETE
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- Function to accept friend request and create friendship
CREATE OR REPLACE FUNCTION public.accept_friend_request(request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request friend_requests%ROWTYPE;
  v_user1 UUID;
  v_user2 UUID;
BEGIN
  -- Get the request
  SELECT * INTO v_request FROM friend_requests WHERE id = request_id AND receiver_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friend request not found or you are not the receiver';
  END IF;
  
  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Request already processed';
  END IF;
  
  -- Order user IDs for unique constraint
  IF v_request.sender_id < v_request.receiver_id THEN
    v_user1 := v_request.sender_id;
    v_user2 := v_request.receiver_id;
  ELSE
    v_user1 := v_request.receiver_id;
    v_user2 := v_request.sender_id;
  END IF;
  
  -- Create friendship
  INSERT INTO friendships (user1_id, user2_id)
  VALUES (v_user1, v_user2)
  ON CONFLICT DO NOTHING;
  
  -- Update request status
  UPDATE friend_requests SET status = 'accepted', updated_at = now() WHERE id = request_id;
  
  RETURN TRUE;
END;
$$;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;