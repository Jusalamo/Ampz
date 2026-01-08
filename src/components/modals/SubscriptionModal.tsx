import { X, Check, Zap, Crown, Star } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Import design constants
const DESIGN = {
  colors: {
    primary: '#C4B5FD',
    lavenderLight: '#E9D5FF',
    accentPink: '#FFB8E6',
    background: '#1A1A1A',
    card: '#2D2D2D',
    textPrimary: '#FFFFFF',
    textSecondary: '#B8B8B8',
    brandGreen: '#10B981'
  },
  borderRadius: {
    modal: '20px',
    card: '24px',
    pill: '9999px',
    button: '12px',
    icon: '12px'
  },
  shadows: {
    modal: '0 20px 60px rgba(0, 0, 0, 0.5)',
    button: '0 4px 16px rgba(0, 0, 0, 0.3)',
    glowPurple: '0 0 20px rgba(196, 181, 253, 0.4)',
    glowGold: '0 0 20px rgba(255, 215, 0, 0.3)'
  },
  typography: {
    h1: '28px',
    h2: '24px',
    h3: '20px',
    body: '15px',
    small: '13px',
    caption: '11px'
  },
  spacing: {
    modalPadding: '24px',
    sectionGap: '16px',
    itemGap: '12px',
    featureGap: '8px'
  }
};

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
    gradient: DESIGN.colors.card,
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
    gradient: `linear-gradient(135deg, ${DESIGN.colors.primary} 0%, ${DESIGN.colors.lavenderLight} 100%)`,
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
    gradient: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ 
        background: `${DESIGN.colors.background}E6`,
        backdropFilter: 'blur(10px)'
      }}
    >
      <div 
        className="w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ 
          background: DESIGN.colors.card,
          borderRadius: DESIGN.borderRadius.card,
          border: `1px solid ${DESIGN.colors.textSecondary}20`,
          boxShadow: DESIGN.shadows.modal
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between sticky top-0 z-10"
          style={{ 
            padding: DESIGN.spacing.modalPadding,
            borderBottom: `1px solid ${DESIGN.colors.textSecondary}20`,
            background: DESIGN.colors.card,
            borderTopLeftRadius: DESIGN.borderRadius.card,
            borderTopRightRadius: DESIGN.borderRadius.card
          }}
        >
          <div>
            <h2 
              className="font-bold mb-1"
              style={{ 
                fontSize: DESIGN.typography.h2,
                color: DESIGN.colors.textPrimary 
              }}
            >
              Choose Your Plan
            </h2>
            <p 
              className="text-sm"
              style={{ color: DESIGN.colors.textSecondary }}
            >
              Unlock premium features
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              width: '40px',
              height: '40px',
              borderRadius: DESIGN.borderRadius.pill,
              background: `${DESIGN.colors.textSecondary}20`
            }}
            className="flex items-center justify-center transition-opacity hover:opacity-80"
          >
            <X className="w-5 h-5" style={{ color: DESIGN.colors.textPrimary }} />
          </button>
        </div>

        {/* Plans */}
        <div style={{ padding: DESIGN.spacing.modalPadding }}>
          <div className="space-y-4">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isCurrent = user?.subscription.tier === plan.id;
              
              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative p-5 transition-all',
                    isCurrent && 'border-primary'
                  )}
                  style={{ 
                    borderRadius: DESIGN.borderRadius.modal,
                    border: `2px solid ${isCurrent ? DESIGN.colors.primary : `${DESIGN.colors.textSecondary}20`}`,
                    background: isCurrent ? `${DESIGN.colors.primary}10` : 'transparent'
                  }}
                >
                  {plan.popular && (
                    <span 
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold rounded-full"
                      style={{ 
                        background: `linear-gradient(135deg, ${DESIGN.colors.primary} 0%, ${DESIGN.colors.lavenderLight} 100%)`,
                        color: DESIGN.colors.background,
                        fontSize: DESIGN.typography.caption,
                        boxShadow: DESIGN.shadows.glowPurple
                      }}
                    >
                      MOST POPULAR
                    </span>
                  )}

                  <div className="flex items-start gap-4">
                    <div 
                      className="flex items-center justify-center flex-shrink-0"
                      style={{ 
                        width: '48px',
                        height: '48px',
                        borderRadius: DESIGN.borderRadius.icon,
                        background: plan.gradient
                      }}
                    >
                      <Icon className="w-6 h-6" style={{ color: DESIGN.colors.background }} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 
                          className="font-bold truncate"
                          style={{ 
                            fontSize: DESIGN.typography.h3,
                            color: DESIGN.colors.textPrimary 
                          }}
                        >
                          {plan.name}
                        </h3>
                        {isCurrent && (
                          <span 
                            className="px-2 py-1 text-xs rounded-full flex-shrink-0"
                            style={{ 
                              background: DESIGN.colors.primary,
                              color: DESIGN.colors.background,
                              fontSize: DESIGN.typography.caption
                            }}
                          >
                            Current
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-baseline gap-1 mb-4">
                        <span 
                          className="font-bold"
                          style={{ 
                            fontSize: '24px',
                            color: DESIGN.colors.textPrimary 
                          }}
                        >
                          {getCurrencySymbol()}{convertPrice(plan.price)}
                        </span>
                        {plan.price > 0 && (
                          <span style={{ color: DESIGN.colors.textSecondary }}>
                            /{plan.period}
                          </span>
                        )}
                      </div>

                      <ul className="space-y-2 mb-5">
                        {plan.features.map((feature) => (
                          <li 
                            key={feature} 
                            className="flex items-start gap-2"
                          >
                            <Check 
                              className="w-4 h-4 flex-shrink-0 mt-0.5" 
                              style={{ color: DESIGN.colors.brandGreen }} 
                            />
                            <span 
                              className="text-sm leading-tight"
                              style={{ color: DESIGN.colors.textPrimary }}
                            >
                              {feature}
                            </span>
                          </li>
                        ))}
                        {plan.limitations?.map((limitation) => (
                          <li 
                            key={limitation} 
                            className="flex items-start gap-2"
                          >
                            <X 
                              className="w-4 h-4 flex-shrink-0 mt-0.5" 
                              style={{ color: DESIGN.colors.textSecondary }} 
                            />
                            <span 
                              className="text-sm leading-tight"
                              style={{ color: DESIGN.colors.textSecondary }}
                            >
                              {limitation}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => handleUpgrade(plan.id as 'free' | 'pro' | 'max')}
                        disabled={isCurrent}
                        className={cn(
                          'w-full h-12',
                          plan.id === 'pro' && 'glow-purple',
                          plan.id === 'max' && 'glow-gold'
                        )}
                        style={{ 
                          borderRadius: DESIGN.borderRadius.button,
                          ...(plan.id === 'free' ? {
                            background: 'transparent',
                            border: `2px solid ${DESIGN.colors.textSecondary}40`,
                            color: DESIGN.colors.textPrimary
                          } : {
                            background: plan.gradient,
                            color: DESIGN.colors.background,
                            border: 'none'
                          })
                        }}
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
        <div 
          className="text-center"
          style={{ 
            padding: DESIGN.spacing.modalPadding,
            paddingTop: 0
          }}
        >
          <p 
            className="text-xs"
            style={{ color: DESIGN.colors.textSecondary }}
          >
            Cancel anytime. Prices shown in {currency}.
          </p>
        </div>
      </div>
    </div>
  );
}
