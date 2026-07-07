import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';

export default function TicketScreen() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { user } = useApp();
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticketId) return;
    (async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, events(id, name, date, time, location, cover_image)')
        .eq('id', ticketId)
        .maybeSingle();
      if (error || !data) {
        setError('Ticket not found');
        setLoading(false);
        return;
      }
      if (data.user_id !== user?.id) {
        setError('This ticket belongs to another user');
        setLoading(false);
        return;
      }
      setTicket(data);
      setEvent((data as any).events);
      if (data.qr_code) {
        const url = await QRCode.toDataURL(data.qr_code, { width: 512, margin: 1 });
        setQrDataUrl(url);
      }
      setLoading(false);
    })();
  }, [ticketId, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => navigate(-1)}>Back</Button>
      </div>
    );
  }

  const used = ticket?.ticket_status === 'used';

  return (
    <div className="min-h-screen bg-background pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="font-bold tracking-tight">Your Ticket</h1>
      </header>

      <div className="p-6 flex flex-col items-center gap-6">
        <div className="w-full max-w-sm bg-card rounded-3xl p-6 border border-border">
          <div className="text-center mb-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Event</p>
            <h2 className="text-xl font-bold tracking-tight mt-1">{event?.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {event?.date} · {event?.time?.slice(0, 5)}
            </p>
            <p className="text-sm text-muted-foreground">{event?.location}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 flex items-center justify-center">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Ticket QR" className={used ? 'opacity-30 grayscale' : ''} />
            ) : (
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="mt-4 text-center">
            {used ? (
              <span className="inline-block px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold">USED</span>
            ) : (
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">ACTIVE</span>
            )}
            <p className="text-xs text-muted-foreground mt-3">Show this at the door to check in.</p>
            <p className="text-xs text-muted-foreground">Payment collected at the door.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
