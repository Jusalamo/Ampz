import { Home, Calendar, Zap, Send, User, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

// Design Constants from the design system
const DESIGN = {
  colors: {
    primary: '#C4B5FD',
    lavenderLight: '#E9D5FF',
    accentPink: '#FFB8E6',
    background: '#1A1A1A',
    card: '#2D2D2D',
    textPrimary: '#FFFFFF',
    textSecondary: '#B8B8B8'
  },
  typography: {
    label: {
      size: '11px',
      activeWeight: 'semibold',
      inactiveWeight: 'normal'
    }
  },
  spacing: {
    navHeight: '68px',
    iconSize: '24px',
    badgeSize: '20px',
    activeIndicator: {
      width: '24px',
      height: '4px'
    }
  },
  borderRadius: {
    badge: '50%',
    indicator: '4px 4px 0 0'
  }
};

const navItems = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Calendar, label: 'Events', path: '/events' },
  { icon: Zap, label: 'Connect', path: '/connect' },
  { icon: Send, label: 'Chats', path: '/matches' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function BottomNav() {
  const location = useLocation();
  const { matches, unreadNotificationsCount } = useApp();
  const unreadMessagesCount = matches.filter(m => m.unread).length;

  return (
    <nav 
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app h-[68px] bg-background/98 backdrop-blur-xl border-t border-border flex justify-around items-center pb-safe z-50"
      style={{
        background: `${DESIGN.colors.background}F8`, // 98% opacity
        borderTopColor: `${DESIGN.colors.textSecondary}30`, // 30% opacity
        height: DESIGN.spacing.navHeight
      }}
    >
      {navItems.map(({ icon: Icon, label, path }) => {
        const isActive = location.pathname === path || 
          (path === '/home' && location.pathname.startsWith('/home')) ||
          (path === '/events' && location.pathname.startsWith('/events')) ||
          (path === '/connect' && location.pathname.startsWith('/connect')) ||
          (path === '/matches' && (location.pathname.startsWith('/matches') || location.pathname.startsWith('/chats'))) ||
          (path === '/profile' && location.pathname.startsWith('/profile'));
        
        const isChats = path === '/matches';
        
        return (
          <Link
            key={path}
            to={path}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2 px-3 transition-all flex-1 h-full relative'
            )}
            style={{
              color: isActive ? DESIGN.colors.primary : DESIGN.colors.textSecondary
            }}
          >
            <div className="relative">
              <Icon 
                className={cn(
                  'transition-all duration-200',
                  isActive && 'scale-110'
                )} 
                style={{
                  width: DESIGN.spacing.iconSize,
                  height: DESIGN.spacing.iconSize,
                  strokeWidth: isActive ? 2.5 : 2,
                  color: isActive ? DESIGN.colors.primary : DESIGN.colors.textSecondary
                }}
              />
              
              {isChats && unreadMessagesCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 rounded-full text-[10px] font-bold flex items-center justify-center border border-background"
                  style={{
                    width: DESIGN.spacing.badgeSize,
                    height: DESIGN.spacing.badgeSize,
                    background: DESIGN.colors.primary,
                    color: DESIGN.colors.background,
                    borderRadius: DESIGN.borderRadius.badge,
                    borderColor: DESIGN.colors.background,
                    fontSize: '10px'
                  }}
                >
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </span>
              )}
            </div>
            
            <span 
              className={cn(
                'transition-all duration-200',
                isActive ? 'font-semibold' : 'font-normal'
              )}
              style={{
                fontSize: DESIGN.typography.label.size,
                color: isActive ? DESIGN.colors.primary : DESIGN.colors.textSecondary
              }}
            >
              {label}
            </span>
            
            {/* Active indicator dot */}
            {isActive && (
              <div 
                className="absolute bottom-0 rounded-t-full"
                style={{
                  width: DESIGN.spacing.activeIndicator.width,
                  height: DESIGN.spacing.activeIndicator.height,
                  background: DESIGN.colors.primary,
                  borderRadius: DESIGN.borderRadius.indicator
                }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
