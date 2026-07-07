import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function AttendeesScreen() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    (async () => {
      const { data } = await supabase
        .from('check_ins')
        .select('id, checked_in_at, visibility_mode, user_id, profiles:user_id(name, profile_photo, username)')
        .eq('event_id', eventId)
        .eq('visibility_mode', 'public')
        .order('checked_in_at', { ascending: false });
      setAttendees(data || []);
      setLoading(false);
    })();
  }, [eventId]);

  return (
    <div className="min-h-screen bg-background pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="font-bold tracking-tight">Attendees</h1>
      </header>

      <div className="p-4">
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mt-8" />
        ) : attendees.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No one has checked in yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attendees.map((a) => (
              <button key={a.id} onClick={() => navigate(`/user/${a.user_id}`)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border text-left">
                <img src={a.profiles?.profile_photo || '/default-avatar.png'} onError={(e) => (e.currentTarget.src = '/default-avatar.png')} alt="" className="w-11 h-11 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{a.profiles?.name || 'Attendee'}</p>
                  {a.profiles?.username && <p className="text-xs text-muted-foreground">@{a.profiles.username}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
