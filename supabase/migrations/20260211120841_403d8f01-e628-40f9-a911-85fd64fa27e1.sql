-- Allow authenticated users to read profiles (safe because profiles_public view excludes PII)
CREATE POLICY "Authenticated users can read profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- Drop now-redundant own-profile policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "System can read profiles for internal operations" ON public.profiles;

-- Make get_suggested_users SECURITY DEFINER so it works with RLS
CREATE OR REPLACE FUNCTION public.get_suggested_users(current_user_id uuid, limit_count integer DEFAULT 20)
 RETURNS TABLE(id uuid, name text, profile_photo text, bio text, mutual_count bigint, shared_events bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH 
  user_friends AS (
    SELECT 
      CASE 
        WHEN f.user1_id = current_user_id THEN f.user2_id
        ELSE f.user1_id
      END as friend_id
    FROM friendships f
    WHERE f.user1_id = current_user_id OR f.user2_id = current_user_id
  ),
  potential_suggestions AS (
    SELECT p.id, p.name, p.profile_photo, p.bio
    FROM profiles p
    WHERE p.id != current_user_id
      AND p.id NOT IN (SELECT friend_id FROM user_friends)
      AND p.id NOT IN (
        SELECT receiver_id FROM friend_requests WHERE sender_id = current_user_id AND status = 'pending'
      )
      AND p.id NOT IN (
        SELECT sender_id FROM friend_requests WHERE receiver_id = current_user_id AND status = 'pending'
      )
  ),
  mutual_counts AS (
    SELECT 
      ps.id,
      COUNT(DISTINCT uf.friend_id) as mutual_count
    FROM potential_suggestions ps
    LEFT JOIN friendships f1 ON (
      (f1.user1_id = ps.id OR f1.user2_id = ps.id) 
      AND (f1.user1_id IN (SELECT friend_id FROM user_friends) OR f1.user2_id IN (SELECT friend_id FROM user_friends))
    )
    LEFT JOIN user_friends uf ON (
      (f1.user1_id = uf.friend_id AND f1.user2_id = ps.id) OR 
      (f1.user2_id = uf.friend_id AND f1.user1_id = ps.id)
    )
    GROUP BY ps.id
  )
  SELECT 
    ps.id,
    ps.name,
    ps.profile_photo,
    ps.bio,
    COALESCE(mc.mutual_count, 0) as mutual_count,
    0::bigint as shared_events
  FROM potential_suggestions ps
  LEFT JOIN mutual_counts mc ON ps.id = mc.id
  ORDER BY 
    COALESCE(mc.mutual_count, 0) DESC,
    ps.name
  LIMIT limit_count;
END;
$function$;

-- Also fix search_users_simple and search_users_by_email_or_name with search_path
CREATE OR REPLACE FUNCTION public.search_users_simple(search_query text, current_user_id uuid)
 RETURNS TABLE(id uuid, name text, profile_photo text, bio text, username text, email text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(p.name, 'User') as name,
    p.profile_photo,
    COALESCE(p.bio, '') as bio,
    ''::text as username,
    COALESCE(a.email, '') as email
  FROM profiles p
  LEFT JOIN auth.users a ON p.id = a.id
  WHERE p.id != current_user_id
    AND (
      p.name ILIKE '%' || search_query || '%'
      OR p.bio ILIKE '%' || search_query || '%'
      OR a.email ILIKE '%' || search_query || '%'
    )
  ORDER BY 
    CASE 
      WHEN p.name ILIKE search_query || '%' THEN 1
      ELSE 3
    END,
    p.name
  LIMIT 20;
END;
$function$;

CREATE OR REPLACE FUNCTION public.search_users_by_email_or_name(search_query text)
 RETURNS TABLE(id uuid, email text, name text, profile_photo text, bio text, username text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    au.email::TEXT,
    COALESCE(p.name, au.raw_user_meta_data->>'name', au.email) as name,
    p.profile_photo,
    p.bio,
    ''::text as username
  FROM profiles p
  JOIN auth.users au ON p.id = au.id
  WHERE (
    p.name ILIKE '%' || search_query || '%' OR
    p.bio ILIKE '%' || search_query || '%' OR
    au.email ILIKE '%' || search_query || '%' OR
    (au.raw_user_meta_data->>'name') ILIKE '%' || search_query || '%'
  )
  ORDER BY 
    CASE 
      WHEN p.name ILIKE '%' || search_query || '%' THEN 1
      WHEN au.email ILIKE '%' || search_query || '%' THEN 2
      ELSE 4
    END
  LIMIT 20;
END;
$function$;