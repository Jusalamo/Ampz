import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

interface Tier {
  id: string;
  name: string;
  price: number;
  currency: string;
  available_count: number;
  sold_count: number;
}

export default function BuyTicketScreen() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useApp();
  const [event, setEvent] = useState<any>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    (async () => {
      const [{ data: ev }, { data: t }] = await Promise.all([
        supabase.from('events').select('id,name,date,time,location,cover_image').eq('id', eventId).maybeSingle(),
        (supabase.from('ticket_tiers' as any).select('*').eq('event_id', eventId).eq('is_active', true).order('sort_order') as any),
      ]);
      setEvent(ev);
      setTiers((t as Tier[]) || []);
      setLoading(false);
    })();
  }, [eventId]);

  const handleBuy = async () => {
    if (!selected || !eventId || !user) return;
    setBuying(true);
    try {
      const { data, error } = await (supabase.rpc as any)('purchase_ticket', {
        p_event_id: eventId,
        p_tier_id: selected,
      });
      if (error) throw error;
      toast({ title: 'Ticket reserved', description: 'Pay at the door on arrival.' });
      navigate(`/ticket/${data}`);
    } catch (e: any) {
      toast({ title: 'Could not buy ticket', description: e.message, variant: 'destructive' });
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="font-bold tracking-tight">Buy Tickets</h1>
      </header>

      <div className="p-4 space-y-4">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <h2 className="font-bold tracking-tight">{event?.name}</h2>
          <p className="text-sm text-muted-foreground">{event?.date} · {event?.time?.slice(0,5)}</p>
          <p className="text-sm text-muted-foreground">{event?.location}</p>
        </div>

        {tiers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No ticket tiers available for this event yet.
          </div>
        ) : (
          <div className="space-y-3">
            {tiers.map(tier => {
              const soldOut = tier.available_count <= tier.sold_count;
              const isSelected = selected === tier.id;
              return (
                <button
                  key={tier.id}
                  disabled={soldOut}
                  onClick={() => setSelected(tier.id)}
                  className={cn(
                    'w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between',
                    soldOut && 'opacity-50 cursor-not-allowed',
                    isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                  )}
                >
                  <div>
                    <p className="font-semibold">{tier.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {tier.currency} {Number(tier.price).toFixed(2)}
                    </p>
                    {soldOut && <p className="text-xs text-destructive mt-1">Sold out</p>}
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-primary" />}
                </button>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">Payment collected at the door.</p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-background/95 backdrop-blur border-t border-border">
        <Button className="w-full h-12" disabled={!selected || buying} onClick={handleBuy}>
          {buying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reserve Ticket'}
        </Button>
      </div>
    </div>
  );
}
