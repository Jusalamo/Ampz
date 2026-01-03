import { useState } from 'react';
import { X, QrCode, Calendar, MapPin, Ticket, Plus, Minus, Clock } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Ticket as TicketType, Event } from '@/lib/types';

interface TicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'active' | 'purchase' | 'history';

export function TicketsModal({ isOpen, onClose }: TicketsModalProps) {
  const { tickets, events, addTicket, currency } = useApp();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [viewingQR, setViewingQR] = useState<TicketType | null>(null);

  const activeTickets = tickets.filter(t => t.status === 'active');
  const historyTickets = tickets;

  const getCurrencySymbol = () => {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'ZAR': return 'R';
      default: return 'N$';
    }
  };

  const handlePurchase = () => {
    if (!selectedEvent) return;

    const newTicket: TicketType = {
      id: crypto.randomUUID(),
      eventId: selectedEvent.id,
      eventName: selectedEvent.name,
      eventDate: selectedEvent.date,
      eventTime: selectedEvent.time,
      eventLocation: selectedEvent.location,
      purchaseDate: new Date().toISOString(),
      price: selectedEvent.price * quantity,
      currency: 'NAD',
      quantity,
      qrCode: `TKT-${Date.now().toString(36).toUpperCase()}`,
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
          <div className="w-64 h-64 bg-card rounded-2xl flex items-center justify-center mb-6 border border-border">
            <QrCode className="w-48 h-48 text-primary" />
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
        <div className="flex-1 p-5 space-y-6">
          {/* Event Info */}
          <div className="glass-card p-4">
            <h3 className="font-bold text-lg mb-2">{selectedEvent.name}</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{selectedEvent.date} at {selectedEvent.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{selectedEvent.location}</span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="glass-card p-4 text-center">
            <p className="text-muted-foreground text-sm mb-1">Price per ticket</p>
            <p className="text-3xl font-bold text-primary">
              {selectedEvent.price === 0 ? 'FREE' : `${getCurrencySymbol()}${selectedEvent.price}`}
            </p>
          </div>

          {/* Quantity */}
          <div className="glass-card p-4">
            <p className="text-sm font-medium mb-3">Quantity</p>
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center hover:border-primary transition-colors"
                disabled={quantity <= 1}
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-3xl font-bold w-12 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center hover:border-primary transition-colors"
                disabled={quantity >= 10}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Total */}
          <div className="glass-card p-4 flex items-center justify-between">
            <span className="font-medium">Total</span>
            <span className="text-2xl font-bold text-primary">
              {selectedEvent.price === 0 ? 'FREE' : `${getCurrencySymbol()}${selectedEvent.price * quantity}`}
            </span>
          </div>
        </div>

        <div className="p-4 border-t border-border flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setSelectedEvent(null)}>
            Cancel
          </Button>
          <Button className="flex-1 gradient-pro glow-purple" onClick={handlePurchase}>
            <Ticket className="w-4 h-4 mr-2" />
            Purchase
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-bold">Ticket Box</h2>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
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
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Active Tickets */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {activeTickets.length > 0 ? (
              activeTickets.map((ticket) => (
                <div key={ticket.id} className="glass-card p-4">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => setViewingQR(ticket)}
                      className="w-16 h-16 bg-card rounded-xl flex items-center justify-center border border-border hover:border-primary transition-colors flex-shrink-0"
                    >
                      <QrCode className="w-10 h-10 text-primary" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold truncate">{ticket.eventName}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>{ticket.eventDate}</span>
                        <Clock className="w-3 h-3 ml-2" />
                        <span>{ticket.eventTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{ticket.eventLocation}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {ticket.quantity} ticket(s)
                        </span>
                        <span className="px-2 py-0.5 bg-brand-green/20 text-brand-green text-xs rounded-full">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-bold mb-2">No Active Tickets</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Get tickets to upcoming events
                </p>
                <Button onClick={() => setActiveTab('purchase')}>
                  Browse Events
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Purchase Tab */}
        {activeTab === 'purchase' && (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="glass-card p-4">
                <div className="flex items-start gap-4">
                  <img
                    src={event.coverImage}
                    alt={event.name}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold truncate">{event.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.date} • {event.location}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-primary">
                        {event.price === 0 ? 'FREE' : `${getCurrencySymbol()}${event.price}`}
                      </span>
                      <Button size="sm" onClick={() => setSelectedEvent(event)}>
                        Get Ticket
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {historyTickets.length > 0 ? (
              historyTickets.map((ticket) => (
                <div key={ticket.id} className="glass-card p-4 opacity-75">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold">{ticket.eventName}</h4>
                    <span className={cn(
                      'px-2 py-0.5 text-xs rounded-full',
                      ticket.status === 'active' && 'bg-brand-green/20 text-brand-green',
                      ticket.status === 'used' && 'bg-muted text-muted-foreground',
                      ticket.status === 'cancelled' && 'bg-brand-red/20 text-brand-red'
                    )}>
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {ticket.eventDate} • {ticket.quantity} ticket(s)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Purchased: {new Date(ticket.purchaseDate).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No ticket history</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
