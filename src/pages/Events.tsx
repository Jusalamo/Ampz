import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { MapDrawer } from '@/components/MapDrawer';
import { EventWizardModal } from '@/components/modals/EventWizardModal';
import { FiltersModal } from '@/components/modals/FiltersModal';
import { SubscriptionModal } from '@/components/modals/SubscriptionModal';
import { useToast } from '@/hooks/use-toast';

export default function Events() {
  const { user } = useApp();
  const { toast } = useToast();
  const [showEventWizard, setShowEventWizard] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);

  const handleCreateEvent = () => {
    if (user?.subscription.tier === 'free') {
      toast({
        title: 'Pro Feature',
        description: 'Upgrade to Pro to create events',
      });
      setShowSubscription(true);
    } else {
      setShowEventWizard(true);
    }
  };

  return (
    <div className="app-container h-screen bg-background overflow-hidden">
      {/* No top bar - just the map drawer */}
      <MapDrawer 
        onCreateEvent={handleCreateEvent}
        onOpenFilters={() => setShowFilters(true)}
      />
      
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
