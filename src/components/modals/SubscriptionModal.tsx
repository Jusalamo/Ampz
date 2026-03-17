import { X, Check, Zap, Crown, Star } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    icon: Star,
    color: 'bg-card',
    gradient: 'bg-card',
    features: [
      'Join unlimited events',
      '10 likes per day',
      'Basic profile',
      'Chat with matches',
    ],
    limitations: [
      'Cannot create events',
      'Cannot see who liked you',
      '3 rewinds per day',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 14.98,
    yearlyPrice: 143.76,
    period: 'month',
    icon: Zap,
    color: 'gradient-pro',
    gradient: 'bg-gradient-to-br from-primary to-accent',
    popular: true,
    features: [
      'Everything in Free',
      'Unlimited likes',
      'Create up to 5 events/month',
      'See who liked you',
      'Unlimited rewinds',
      'Priority support',
    ],
  },
  {
    id: 'max',
    name: 'Max',
    price: 52.98,
    yearlyPrice: 508.60,
    period: 'month',
    icon: Crown,
    color: 'gradient-max',
    gradient: 'bg-gradient-to-br from-yellow-500 to-yellow-300',
    features: [
      'Everything in Pro',
      'Unlimited event creation',
      'Featured event placement',
      'Advanced analytics',
      'Custom event branding',
      'VIP badge on profile',
    ],
  },
];

export function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const { user, updateSubscription, currency } = useApp();
  const { toast } = useToast();

  const handleUpgrade = (tier: 'free' | 'pro' | 'max') => {
    updateSubscription(tier);
    toast({
      title: tier === 'free' ? 'Downgraded' : '🎉 Upgrade Successful!',
      description: tier === 'free' 
        ? 'Your subscription has been cancelled'
        : `Welcome to Amps ${tier.charAt(0).toUpperCase() + tier.slice(1)}!`,
    });
    onClose();
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

  const convertPrice = (price: number) => {
    const rates: Record<string, number> = { NAD: 1, USD: 0.055, EUR: 0.051, GBP: 0.044, ZAR: 1 };
    return (price * (rates[currency] || 1)).toFixed(2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-background/90 backdrop-blur-lg">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-card rounded-[24px] border border-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 z-10 p-6 border-b border-border bg-card rounded-t-[24px]">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Choose Your Plan</h2>
            <p className="text-sm text-muted-foreground">Unlock premium features</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center transition-opacity hover:opacity-80"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Plans */}
        <div className="p-6">
          <div className="space-y-4">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isCurrent = user?.subscription.tier === plan.id;
              
              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative p-5 transition-all rounded-2xl border-2',
                    isCurrent ? 'border-primary bg-primary/10' : 'border-border/30'
                  )}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[11px] font-bold rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md">
                      MOST POPULAR
                    </span>
                  )}

                  <div className="flex items-start gap-4">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', plan.gradient)}>
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-foreground truncate">{plan.name}</h3>
                        {isCurrent && (
                          <span className="px-2 py-1 text-[11px] rounded-full bg-primary text-primary-foreground">Current</span>
                        )}
                      </div>
                      
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-2xl font-bold text-foreground">{getCurrencySymbol()}{convertPrice(plan.price)}</span>
                        {plan.price > 0 && <span className="text-muted-foreground">/{plan.period}</span>}
                      </div>

                      <ul className="space-y-2 mb-5">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                            <span className="text-sm leading-tight text-foreground">{feature}</span>
                          </li>
                        ))}
                        {plan.limitations?.map((limitation) => (
                          <li key={limitation} className="flex items-start gap-2">
                            <X className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                            <span className="text-sm leading-tight text-muted-foreground">{limitation}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => handleUpgrade(plan.id as 'free' | 'pro' | 'max')}
                        disabled={isCurrent}
                        className={cn(
                          'w-full h-12 rounded-xl',
                          plan.id === 'free' ? 'bg-transparent border-2 border-border text-foreground hover:bg-muted/20' : '',
                          plan.id === 'pro' ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground' : '',
                          plan.id === 'max' ? 'bg-gradient-to-r from-yellow-500 to-yellow-300 text-background' : ''
                        )}
                      >
                        {isCurrent ? 'Current Plan' : plan.price === 0 ? 'Downgrade' : 'Upgrade Now'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center p-6 pt-0">
          <p className="text-xs text-muted-foreground">Cancel anytime. Prices shown in {currency}.</p>
        </div>
      </div>
    </div>
  );
}
