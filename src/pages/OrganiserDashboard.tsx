import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Camera, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';

export default function OrganiserDashboard() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useApp();
  const eventId = params.get('event');
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(eventId);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load organizer's events
  useEffect(() => {
    if (!user?.id) return;
    supabase.from('events').select('id, name').eq('organizer_id', user.id).then(({ data }) => {
      setEvents(data || []);
      if (!selectedEvent && data && data[0]) setSelectedEvent(data[0].id);
      setLoading(false);
    });
  }, [user?.id]);

  // Load check-ins and subscribe
  useEffect(() => {
    if (!selectedEvent) return;
    (async () => {
      const { data } = await supabase
        .from('check_ins')
        .select('id, user_id, checked_in_at, profiles:user_id(name, profile_photo)')
        .eq('event_id', selectedEvent)
        .order('checked_in_at', { ascending: false })
        .limit(100);
      setCheckins(data || []);
      const { count } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', selectedEvent)
        .neq('ticket_status', 'cancelled');
      setTotalTickets(count || 0);
    })();

    const channel = supabase
      .channel(`org-checkins-${selectedEvent}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'check_ins', filter: `event_id=eq.${selectedEvent}` },
        async (payload) => {
          const { data: prof } = await supabase.from('profiles').select('name, profile_photo').eq('id', payload.new.user_id).maybeSingle();
          setCheckins((prev) => [{ ...payload.new, profiles: prof }, ...prev]);
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `event_id=eq.${selectedEvent}` },
        () => {
          supabase.from('tickets').select('*', { count: 'exact', head: true })
            .eq('event_id', selectedEvent).neq('ticket_status', 'cancelled')
            .then(({ count }) => setTotalTickets(count || 0));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedEvent]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="font-bold tracking-tight flex-1">Organiser Dashboard</h1>
        <Button size="sm" onClick={() => navigate('/organiser/scan')}><Camera className="w-4 h-4 mr-1" /> Scan</Button>
      </header>

      <div className="p-4 space-y-4">
        {events.length > 1 && (
          <select value={selectedEvent || ''} onChange={(e) => setSelectedEvent(e.target.value)} className="w-full h-11 px-3 rounded-xl bg-card border border-border">
            {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Checked In</p>
            <p className="text-3xl font-bold tracking-tight mt-1">{checkins.length}</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Tickets Sold</p>
            <p className="text-3xl font-bold tracking-tight mt-1">{totalTickets}</p>
          </div>
        </div>

        <h2 className="text-sm font-bold tracking-tight uppercase text-muted-foreground pt-2">Live Arrivals</h2>
        {checkins.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No check-ins yet.
          </div>
        ) : (
          <div className="space-y-2">
            {checkins.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border animate-in slide-in-from-top-2">
                <img src={c.profiles?.profile_photo || '/default-avatar.png'} onError={(e) => (e.currentTarget.src = '/default-avatar.png')} alt="" className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{c.profiles?.name || 'Attendee'}</p>
                  <p className="text-xs text-muted-foreground">{new Date(c.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
