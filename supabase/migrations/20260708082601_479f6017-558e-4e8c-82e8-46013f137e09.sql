CREATE OR REPLACE FUNCTION public.get_mutual_connections_count(user1_id uuid, user2_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  mutual_count integer;
BEGIN
  WITH user1_friends AS (
    SELECT CASE 
      WHEN user1_id = f.user1_id THEN f.user2_id
      WHEN user1_id = f.user2_id THEN f.user1_id
    END as friend_id
    FROM friendships f
    WHERE f.user1_id = user1_id OR f.user2_id = user1_id
  ),
  user2_friends AS (
    SELECT CASE 
      WHEN user2_id = f.user1_id THEN f.user2_id
      WHEN user2_id = f.user2_id THEN f.user1_id
    END as friend_id
    FROM friendships f
    WHERE f.user1_id = user2_id OR f.user2_id = user2_id
  )
  SELECT COUNT(*) INTO mutual_count
  FROM user1_friends u1
  INNER JOIN user2_friends u2 ON u1.friend_id = u2.friend_id;
  
  RETURN COALESCE(mutual_count, 0);
END;
$function$;