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
    color: 'bg-muted',
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
    const rates: Record<string, number> = {
      NAD: 1,
      USD: 0.055,
      EUR: 0.051,
      GBP: 0.044,
      ZAR: 1,
    };
    return (price * (rates[currency] || 1)).toFixed(2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card rounded-3xl border border-border max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card rounded-t-3xl">
          <div>
            <h2 className="text-xl font-bold">Choose Your Plan</h2>
            <p className="text-sm text-muted-foreground">Unlock premium features</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plans */}
        <div className="p-6 space-y-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = user?.subscription.tier === plan.id;
            
            return (
              <div
                key={plan.id}
                className={cn(
                  'relative rounded-2xl border-2 p-5 transition-all',
                  isCurrent ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 gradient-pro text-foreground text-xs font-bold rounded-full">
                    MOST POPULAR
                  </span>
                )}

                <div className="flex items-start gap-4">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', plan.color)}>
                    <Icon className="w-6 h-6 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-lg">{plan.name}</h3>
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-2xl font-bold">
                        {getCurrencySymbol()}{convertPrice(plan.price)}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground">/{plan.period}</span>
                      )}
                    </div>

                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-brand-green flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {plan.limitations?.map((limitation) => (
                        <li key={limitation} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <X className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span>{limitation}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handleUpgrade(plan.id as 'free' | 'pro' | 'max')}
                      disabled={isCurrent}
                      className={cn(
                        'w-full',
                        plan.id === 'pro' && 'gradient-pro glow-purple',
                        plan.id === 'max' && 'gradient-max glow-gold'
                      )}
                      variant={plan.id === 'free' ? 'outline' : 'default'}
                    >
                      {isCurrent ? 'Current Plan' : plan.price === 0 ? 'Downgrade' : 'Upgrade Now'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 text-center">
          <p className="text-xs text-muted-foreground">
            Cancel anytime. Prices shown in {currency}.
          </p>
        </div>
      </div>
    </div>
  );
}
