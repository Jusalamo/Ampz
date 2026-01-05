import { useState, useEffect } from 'react';
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

  // Handle body scroll when modals are open
  useEffect(() => {
    if (showEventWizard || showFilters || showSubscription) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showEventWizard, showFilters, showSubscription]);

  const handleCreateEvent = () => {
    if (user?.subscription.tier === 'free') {
      toast({
        title: 'Pro Feature Required',
        description: 'Upgrade to Pro to create unlimited events',
        variant: 'default',
      });
      setShowSubscription(true);
    } else {
      setShowEventWizard(true);
    }
  };

  return (
    <div className="app-container h-screen bg-background overflow-hidden flex flex-col">
      <Header 
        title="Events"
        showBack={false}
        rightElement={
          <div className="flex items-center gap-2">
            <button 
              onClick={() => toast({
                title: 'Notifications',
                description: 'No new notifications',
              })}
              className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors"
            >
              <div className="relative">
                <div className="w-5 h-5">🔔</div>
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-green rounded-full"></div>
              </div>
            </button>
          </div>
        }
      />

      <div className="flex-1 relative">
        <MapDrawer 
          onCreateEvent={handleCreateEvent}
          onOpenFilters={() => setShowFilters(true)}
        />
      </div>

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
