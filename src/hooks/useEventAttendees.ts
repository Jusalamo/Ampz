import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Attendee {
  id: string;
  name: string | null;
  profilePhoto: string | null;
  userId: string;
  checkedInAt: string;
  visibilityMode: string;
}

export function useEventAttendees(eventId: string | undefined) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendees = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all check-ins for this event (not just public)
      const { data: checkIns, error: checkInsError } = await supabase
        .from('check_ins')
        .select(`
          id,
          user_id,
          checked_in_at,
          visibility_mode
        `)
        .eq('event_id', eventId)
        .order('checked_in_at', { ascending: false });

      if (checkInsError) throw checkInsError;

      if (!checkIns || checkIns.length === 0) {
        setAttendees([]);
        setLoading(false);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(checkIns.map(c => c.user_id).filter(Boolean))] as string[];

      // Fetch profiles for these users using public view
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles_public')
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
          checkedInAt: checkIn.checked_in_at || '',
          visibilityMode: checkIn.visibility_mode || 'private',
        };
      });

      setAttendees(attendeesList);
    } catch (err: any) {
      console.error('Error fetching attendees:', err);
      setError(err.message || 'Failed to load attendees');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchAttendees();
  }, [fetchAttendees]);

  // Real-time subscription for new check-ins
  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`attendees-${eventId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'check_ins',
        filter: `event_id=eq.${eventId}`,
      }, async (payload) => {
        const newCheckIn = payload.new as any;
        
        // Fetch profile for the new attendee
        const { data: profile } = await supabase
          .from('profiles_public')
          .select('id, name, profile_photo')
          .eq('id', newCheckIn.user_id)
          .single();

        const newAttendee: Attendee = {
          id: newCheckIn.id,
          userId: newCheckIn.user_id || '',
          name: profile?.name || 'Anonymous',
          profilePhoto: profile?.profile_photo || null,
          checkedInAt: newCheckIn.checked_in_at || new Date().toISOString(),
          visibilityMode: newCheckIn.visibility_mode || 'private',
        };

        setAttendees(prev => [newAttendee, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  return { attendees, loading, error, refetch: fetchAttendees };
}
