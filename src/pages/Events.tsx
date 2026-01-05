import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { MapDrawer } from '@/components/MapDrawer';
import { EventWizardModal } from '@/components/modals/EventWizardModal';
import { FiltersModal } from '@/components/modals/FiltersModal';
import { SubscriptionModal } from '@/components/modals/SubscriptionModal';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';

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
        description: 'Upgrade to Pro to create unlimited events',
        variant: 'default',
      });
      setShowSubscription(true);
    } else {
      setShowEventWizard(true);
    }
  };

  return (
    <div className="app-container h-screen bg-background overflow-hidden">
      {/* Header */}
      <Header />
      
      {/* Main Content - Fixed positioning to prevent double scroll */}
      <div className="flex-1 overflow-hidden relative" style={{ height: 'calc(100vh - 129px)' }}>
        <MapDrawer 
          onCreateEvent={handleCreateEvent}
          onOpenFilters={() => setShowFilters(true)}
        />
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <BottomNav />
      </div>

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
