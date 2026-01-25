import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { MapDrawer } from '@/components/MapDrawer';
import { EventWizardModal } from '@/components/modals/EventWizardModal';
import { FiltersModal } from '@/components/modals/FiltersModal';
import { SubscriptionModal } from '@/components/modals/SubscriptionModal';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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

  // Cache events in localStorage for faster load times
  useEffect(() => {
    if (events.length > 0) {
      try {
        localStorage.setItem('cached_events', JSON.stringify({
          data: events,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.warn('Failed to cache events:', error);
      }
    }
  }, [events]);

  // Get cached events on initial load
  useEffect(() => {
    try {
      const cached = localStorage.getItem('cached_events');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Cache is valid for 5 minutes
        if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          console.log('Loaded events from cache');
        }
      }
    } catch (error) {
      console.warn('Failed to load cached events:', error);
    }
  }, []);

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

  return (
    <div className="app-container h-screen bg-background overflow-hidden flex flex-col">
      {/* Map Drawer - Takes full height but allows events to show */}
      <div className="flex-1 relative">
        <MapDrawer 
          onCreateEvent={handleCreateEvent}
          onOpenFilters={() => setShowFilters(true)}
        />
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
