import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { MapDrawer } from '@/components/MapDrawer';
import { EventWizardModal } from '@/components/modals/EventWizardModal';
import { FiltersModal } from '@/components/modals/FiltersModal';
import { SubscriptionModal } from '@/components/modals/SubscriptionModal';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Create a persistent cache outside of React component lifecycle
const PERSISTENT_CACHE_KEY = 'ampz_events_cache_v1';

export default function Events() {
  const navigate = useNavigate();
  const { user, events, isLoadingEvents } = useApp();
  const { toast } = useToast();
  const [showEventWizard, setShowEventWizard] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [cachedEvents, setCachedEvents] = useState([]);

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

  // Load cached events immediately on component mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(PERSISTENT_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Cache is valid for 24 hours (86400000ms)
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          console.log('Loaded events from persistent cache');
          setCachedEvents(parsed.data);
        }
      }
    } catch (error) {
      console.warn('Failed to load cached events:', error);
    }
  }, []);

  // Cache events persistently when they load
  useEffect(() => {
    if (events.length > 0) {
      try {
        localStorage.setItem(PERSISTENT_CACHE_KEY, JSON.stringify({
          data: events,
          timestamp: Date.now()
        }));
        console.log('Updated persistent cache with', events.length, 'events');
      } catch (error) {
        console.warn('Failed to cache events:', error);
      }
    }
  }, [events]);

  // Filter active events and sort by date
  const activeEvents = useMemo(() => {
    // Use cached events if real events are still loading
    const eventsToUse = events.length > 0 ? events : cachedEvents;
    
    const now = new Date();
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
    
    return eventsToUse
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
  }, [events, cachedEvents]);

  return (
    <div className="app-container h-screen bg-background overflow-hidden flex flex-col">
      {/* Map Drawer - Takes full height but allows events to show */}
      <div className="flex-1 relative">
        <MapDrawer 
          onCreateEvent={handleCreateEvent}
          onOpenFilters={() => setShowFilters(true)}
          activeEvents={activeEvents}
          isLoadingEvents={isLoadingEvents}
          cachedEvents={cachedEvents}
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
