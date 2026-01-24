import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { MapDrawer } from '@/components/MapDrawer';
import { EventWizardModal } from '@/components/modals/EventWizardModal';
import { FiltersModal } from '@/components/modals/FiltersModal';
import { SubscriptionModal } from '@/components/modals/SubscriptionModal';
import { EventCard } from '@/components/EventCard';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock } from 'lucide-react';

export default function Events() {
  const navigate = useNavigate();
  const { user, events } = useApp();
  const { toast } = useToast();
  const [showEventWizard, setShowEventWizard] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  const handleCreateEvent = () => {
    if (user?.subscription?.tier === 'free') {
      toast({
        title: 'Pro Feature',
        description: 'Upgrade to Pro to create events',
      });
      setShowSubscription(true);
    } else {
      setShowEventWizard(true);
    }
  };

  // Filter active events and sort by date
  const activeEvents = useMemo(() => {
    const now = new Date();
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
    
    return events
      .filter(e => {
        // Show active events OR events that ended within 4 days (with badge)
        if (e.isActive !== false) return true;
        if (e.endedAt) {
          const endedDate = new Date(e.endedAt);
          return endedDate >= fourDaysAgo;
        }
        return false;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  // Featured events
  const featuredEvents = useMemo(() => 
    activeEvents.filter(e => e.isFeatured).slice(0, 4), 
    [activeEvents]
  );

  // Upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return activeEvents
      .filter(e => {
        const eventDate = new Date(e.date);
        return eventDate >= now && eventDate <= weekFromNow;
      })
      .slice(0, 6);
  }, [activeEvents]);

  return (
    <div className="app-container h-screen bg-background overflow-hidden flex flex-col">
      {/* Map Drawer - Takes full height but allows events to show */}
      <div className="flex-1 relative">
        <MapDrawer 
          onCreateEvent={handleCreateEvent}
          onOpenFilters={() => setShowFilters(true)}
        />
        
        {/* Always visible mini event cards at bottom when map is full */}
        {activeEvents.length > 0 && (
          <div className="absolute bottom-20 left-0 right-0 px-4 z-40 pointer-events-none">
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pointer-events-auto">
              {activeEvents.slice(0, 5).map((event) => {
                const isEnded = event.endedAt || event.isActive === false;
                
                return (
                  <div 
                    key={event.id}
                    onClick={() => navigate(`/event/${event.id}`)}
                    className="flex-shrink-0 w-40 bg-card rounded-ampz-md overflow-hidden cursor-pointer ampz-interactive shadow-lg border border-border/20"
                  >
                    <div className="relative">
                      <img 
                        src={event.coverImage || '/placeholder.svg'} 
                        alt={event.name}
                        className="w-full h-20 object-cover"
                        loading="eager"
                      />
                      {isEnded && (
                        <div className="absolute top-1 left-1 px-2 py-0.5 bg-muted-foreground text-white text-xs rounded-full font-medium">
                          Ended
                        </div>
                      )}
                      {event.isFeatured && !isEnded && (
                        <div className="absolute top-1 left-1 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full font-medium">
                          Featured
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold truncate text-foreground">
                        {event.name}
                      </p>
                      <div className="flex items-center gap-1 text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3" />
                        <span className="text-[10px]">{event.date}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom Navigation */}
      <BottomNav />

      {/* Modals */}
      <EventWizardModal
        isOpen={showEventWizard}
        onClose={() => setShowEventWizard(false)}
      />

      <FiltersModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={(filters) => console.log('Filters applied:', filters)}
      />

      <SubscriptionModal
        isOpen={showSubscription}
        onClose={() => setShowSubscription(false)}
      />
    </div>
  );
}
