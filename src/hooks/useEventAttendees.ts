import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Attendee {
  id: string;
  name: string | null;
  profilePhoto: string | null;
  userId: string;
  checkedInAt: string;
}

export function useEventAttendees(eventId: string | undefined) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    const fetchAttendees = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch check-ins with public visibility for this event
        const { data: checkIns, error: checkInsError } = await supabase
          .from('check_ins')
          .select(`
            id,
            user_id,
            checked_in_at,
            visibility_mode
          `)
          .eq('event_id', eventId)
          .eq('visibility_mode', 'public')
          .order('checked_in_at', { ascending: false });

        if (checkInsError) throw checkInsError;

        if (!checkIns || checkIns.length === 0) {
          setAttendees([]);
          setLoading(false);
          return;
        }

        // Get unique user IDs
        const userIds = [...new Set(checkIns.map(c => c.user_id).filter(Boolean))] as string[];

        // Fetch profiles for these users
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, profile_photo')
          .in('id', userIds);

        if (profilesError) {
          console.warn('Could not fetch profiles:', profilesError);
        }

        // Map check-ins to attendees
        const attendeesList: Attendee[] = checkIns.map(checkIn => {
          const profile = profiles?.find(p => p.id === checkIn.user_id);
          return {
            id: checkIn.id,
            userId: checkIn.user_id || '',
            name: profile?.name || 'Anonymous',
            profilePhoto: profile?.profile_photo || null,
            checkedInAt: checkIn.checked_in_at || ''
          };
        });

        setAttendees(attendeesList);
      } catch (err: any) {
        console.error('Error fetching attendees:', err);
        setError(err.message || 'Failed to load attendees');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendees();
  }, [eventId]);

  return { attendees, loading, error };
}
