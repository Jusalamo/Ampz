import { useState, useEffect } from 'react';
import { X, QrCode, Calendar, MapPin, Ticket, Plus, Minus, Clock, Star, Filter } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Ticket as TicketType, Event } from '@/lib/types';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface TicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'active' | 'purchase' | 'history';
type PurchaseFilter = 'all' | 'week' | 'month' | 'free';

export function TicketsModal({ isOpen, onClose }: TicketsModalProps) {
  const navigate = useNavigate();
  const { tickets, events, addTicket, currency, user } = useApp();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [viewingQR, setViewingQR] = useState<TicketType | null>(null);
  const [purchaseFilter, setPurchaseFilter] = useState<PurchaseFilter>('all');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const activeTickets = tickets.filter(t => t.status === 'active');
  const historyTickets = tickets.filter(t => t.status !== 'active');
  const bookmarkedEvents = events.filter(e => user?.bookmarkedEvents.includes(e.id));
  const featuredEvents = events.filter(e => e.isFeatured);

  const getFilteredPurchaseEvents = () => {
    const now = new Date();
    const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    let filtered = events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate >= now;
    });

    switch (purchaseFilter) {
      case 'week':
        filtered = filtered.filter(e => new Date(e.date) <= oneWeek);
        break;
      case 'month':
        filtered = filtered.filter(e => new Date(e.date) <= oneMonth);
        break;
      case 'free':
        filtered = filtered.filter(e => e.price === 0);
        break;
    }

    return filtered;
  };

  const getCurrencySymbol = () => {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'ZAR': return 'R';
      default: return 'N$';
    }
  };

  const handlePurchase = async () => {
    if (!selectedEvent || !user?.id) return;

    setIsPurchasing(true);
    try {
      const purchaseRef = `TKT-${Date.now().toString(36).toUpperCase()}`;
      const qrCode = purchaseRef;

      // Write ticket to Supabase so it persists across sessions
      const { data: dbTicket, error } = await supabase
        .from('tickets')
        .insert({
          event_id: selectedEvent.id,
          user_id: user.id,
          purchase_source: selectedEvent.price === 0 ? 'free' : 'native',
          purchase_reference: purchaseRef,
          amount_paid: selectedEvent.price * quantity,
          currency: 'NAD',
          payment_provider: selectedEvent.price === 0 ? null : 'native',
          payment_status: 'completed',
          ticket_status: 'active',
          quantity,
          qr_code: qrCode,
          is_demo: user.isDemo ?? false,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Already have a ticket', description: `You already have a ticket for ${selectedEvent.name}`, variant: 'destructive' });
        } else {
          throw error;
        }
        return;
      }

      const newTicket: TicketType = {
        id: dbTicket.id,
        eventId: selectedEvent.id,
        eventName: selectedEvent.name,
        eventDate: selectedEvent.date,
        eventTime: selectedEvent.time,
        eventLocation: selectedEvent.location,
        purchaseDate: dbTicket.purchased_at || new Date().toISOString(),
        price: selectedEvent.price * quantity,
        currency: 'NAD',
        quantity,
        qrCode,
        status: 'active',
      };

      addTicket(newTicket);
      toast({
        title: '🎉 Ticket Purchased!',
        description: `You got ${quantity} ticket(s) to ${selectedEvent.name}`,
      });
      setSelectedEvent(null);
      setQuantity(1);
      setActiveTab('active');
    } catch (err: any) {
      console.error('Ticket purchase error:', err);
      toast({ title: 'Purchase failed', description: err.message || 'Please try again', variant: 'destructive' });
    } finally {
      setIsPurchasing(false);
    }
  };

  const getEventForTicket = (ticket: TicketType) => {
    return events.find(e => e.id === ticket.eventId);
  };

  if (!isOpen) return null;

  // QR Code View
  if (viewingQR) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold">Ticket QR Code</h2>
          <button onClick={() => setViewingQR(null)} className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-5">
          <div className="w-64 h-64 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <QrCode className="w-48 h-48 text-black" />
          </div>
          <h3 className="text-xl font-bold mb-2">{viewingQR.eventName}</h3>
          <p className="text-muted-foreground mb-4">{viewingQR.quantity} ticket(s)</p>
          <p className="text-2xl font-mono font-bold tracking-widest mb-6">
            {viewingQR.qrCode}
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Show this QR code at the event entrance
          </p>
        </div>
      </div>
    );
  }

  // Purchase Flow
  if (selectedEvent) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold">Purchase Ticket</h2>
          <button onClick={() => setSelectedEvent(null)} className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 p-5 space-y-4 overflow-y-auto">
          <div className="relative h-40 rounded-2xl overflow-hidden">
            <img
              src={selectedEvent.coverImage}
              alt={selectedEvent.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <h3 className="font-bold text-lg">{selectedEvent.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedEvent.category}</p>
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{selectedEvent.date} at {selectedEvent.time}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{selectedEvent.location}</span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 text-center border border-border">
            <p className="text-muted-foreground text-sm mb-1">Price per ticket</p>
            <p className="text-3xl font-bold text-primary">
              {selectedEvent.price === 0 ? 'FREE' : `${getCurrencySymbol()}${selectedEvent.price}`}
            </p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-sm font-medium mb-3 text-center">Quantity</p>
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center disabled:opacity-50"
                disabled={quantity <= 1}
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-3xl font-bold w-12 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center disabled:opacity-50"
                disabled={quantity >= 10}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-primary/10 rounded-xl p-4 flex items-center justify-between border border-primary/20">
            <span className="font-medium">Total</span>
            <span className="text-2xl font-bold text-primary">
              {selectedEvent.price === 0 ? 'FREE' : `${getCurrencySymbol()}${selectedEvent.price * quantity}`}
            </span>
          </div>
        </div>

        <div className="p-4 border-t border-border flex gap-3">
          <Button variant="outline" className="flex-1 h-12" onClick={() => setSelectedEvent(null)}>
            Cancel
          </Button>
          <Button
            className="flex-1 h-12 gradient-pro glow-purple"
            onClick={handlePurchase}
            disabled={isPurchasing}
          >
            <Ticket className="w-4 h-4 mr-2" />
            {isPurchasing ? 'Processing...' : selectedEvent.price === 0 ? 'Get Free Ticket' : 'Purchase'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-bold">My Tickets</h2>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex border-b border-border">
        {(['active', 'purchase', 'history'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors relative',
              activeTab === tab ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {tab === 'active' ? 'My Tickets' : tab === 'purchase' ? 'Get Tickets' : 'History'}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
            {tab === 'active' && activeTickets.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                {activeTickets.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'active' && (
          <div className="space-y-3">
            {activeTickets.length > 0 ? (
              activeTickets.map((ticket) => {
                const event = getEventForTicket(ticket);
                return (
                  <div key={ticket.id} className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="flex">
                      <div className="w-28 h-28 flex-shrink-0">
                        <img
                          src={event?.coverImage || '/placeholder.svg'}
                          alt={ticket.eventName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                        <div>
                          <h4 className="font-bold text-sm truncate">{ticket.eventName}</h4>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Calendar className="w-3 h-3" />
                            <span>{ticket.eventDate}</span>
                            <span className="mx-1">•</span>
                            <Clock className="w-3 h-3" />
                            <span>{ticket.eventTime}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{ticket.eventLocation}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {ticket.quantity} ticket(s)
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setViewingQR(ticket)}
                          >
                            <QrCode className="w-3 h-3 mr-1" />
                            Show QR
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16">
                <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-bold mb-2">No Active Tickets</h3>
                <p className="text-muted-foreground text-sm mb-4">Get tickets to upcoming events</p>
                <Button onClick={() => setActiveTab('purchase')}>Browse Events</Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'purchase' && (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { key: 'all', label: 'All Events' },
                { key: 'week', label: 'This Week' },
                { key: 'month', label: 'This Month' },
                { key: 'free', label: 'Free' },
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setPurchaseFilter(filter.key as PurchaseFilter)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                    purchaseFilter === filter.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground border border-border'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {bookmarkedEvents.length > 0 && purchaseFilter === 'all' && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" />
                  Bookmarked Events
                </h3>
                <div className="space-y-2">
                  {bookmarkedEvents.slice(0, 3).map((event) => (
                    <EventPurchaseCard
                      key={event.id}
                      event={event}
                      onSelect={setSelectedEvent}
                      currencySymbol={getCurrencySymbol()}
                      isFeatured={false}
                      isBookmarked={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {featuredEvents.length > 0 && purchaseFilter === 'all' && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Featured Events
                </h3>
                <div className="space-y-2">
                  {featuredEvents.slice(0, 3).map((event) => (
                    <EventPurchaseCard
                      key={event.id}
                      event={event}
                      onSelect={setSelectedEvent}
                      currencySymbol={getCurrencySymbol()}
                      isFeatured={true}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                {purchaseFilter === 'all' ? 'All Upcoming Events' :
                 purchaseFilter === 'week' ? 'Events This Week' :
                 purchaseFilter === 'month' ? 'Events This Month' : 'Free Events'}
              </h3>
              <div className="space-y-2">
                {getFilteredPurchaseEvents().map((event) => (
                  <EventPurchaseCard
                    key={event.id}
                    event={event}
                    onSelect={setSelectedEvent}
                    currencySymbol={getCurrencySymbol()}
                    isFeatured={event.isFeatured}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {historyTickets.length > 0 ? (
              historyTickets.map((ticket) => {
                const event = getEventForTicket(ticket);
                return (
                  <div key={ticket.id} className="bg-card rounded-xl border border-border overflow-hidden opacity-75">
                    <div className="flex">
                      <div className="w-20 h-20 flex-shrink-0">
                        <img
                          src={event?.coverImage || '/placeholder.svg'}
                          alt={ticket.eventName}
                          className="w-full h-full object-cover grayscale"
                        />
                      </div>
                      <div className="flex-1 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-sm truncate">{ticket.eventName}</h4>
                          <span className={cn(
                            'px-2 py-0.5 text-xs rounded-full',
                            ticket.status === 'used' && 'bg-muted text-muted-foreground',
                            ticket.status === 'cancelled' && 'bg-red-500/20 text-red-500'
                          )}>
                            {ticket.status === 'used' ? 'Attended' : 'Cancelled'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {ticket.eventDate} • {ticket.quantity} ticket(s)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Purchased: {new Date(ticket.purchaseDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-bold mb-2">No Ticket History</h3>
                <p className="text-muted-foreground text-sm">Your past events will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EventPurchaseCard({
  event,
  onSelect,
  currencySymbol,
  isFeatured,
  isBookmarked
}: {
  event: Event;
  onSelect: (e: Event) => void;
  currencySymbol: string;
  isFeatured?: boolean;
  isBookmarked?: boolean;
}) {
  return (
    <div className={cn(
      "bg-card rounded-xl border overflow-hidden",
      isFeatured ? "border-yellow-500/30" : isBookmarked ? "border-primary/30" : "border-border"
    )}>
      <div className="flex">
        <div className="w-20 h-20 flex-shrink-0 relative">
          <img
            src={event.coverImage}
            alt={event.name}
            className="w-full h-full object-cover"
          />
          {isFeatured && (
            <div className="absolute top-1 left-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            </div>
          )}
        </div>
        <div className="flex-1 p-3 min-w-0">
          <h4 className="font-bold text-sm truncate">{event.name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {event.date} • {event.location}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="font-bold text-primary text-sm">
              {event.price === 0 ? 'FREE' : `${currencySymbol}${event.price}`}
            </span>
            <Button size="sm" className="h-7 text-xs" onClick={() => onSelect(event)}>
              Get Ticket
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
