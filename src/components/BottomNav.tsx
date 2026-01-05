import { Home, Calendar, MessageSquare, Users, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

const navItems = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Calendar, label: 'Events', path: '/events' },
  { icon: Users, label: 'Connect', path: '/connect' },
  { icon: MessageSquare, label: 'Matches', path: '/matches' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function BottomNav() {
  const location = useLocation();
  const { unreadMessagesCount } = useApp(); // Changed from unreadNotificationsCount to unreadMessagesCount

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app h-[72px] bg-background/98 backdrop-blur-xl border-t border-border flex justify-around items-center pb-safe z-50">
      {navItems.map(({ icon: Icon, label, path }) => {
        const isActive = location.pathname === path || 
          (path === '/home' && location.pathname === '/') ||
          (path === '/matches' && (location.pathname === '/chat' || location.pathname === '/messages')) ||
          (path === '/connect' && location.pathname === '/connections');
        
        const isConnect = path === '/connect';
        const isMatches = path === '/matches';
        
        return (
          <Link
            key={path}
            to={path}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2 px-4 text-xs font-medium transition-all flex-1 h-full relative',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="relative">
              {isConnect ? (
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center -mt-1 transition-all',
                  isActive ? 'gradient-pro glow-purple' : 'bg-card border border-border'
                )}>
                  <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                </div>
              ) : (
                <Icon 
                  className={cn(
                    'w-7 h-7 transition-all',
                    isActive && 'drop-shadow-[0_0_8px_hsl(var(--brand-purple))]'
                  )} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
              )}
              {isMatches && unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-red rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </span>
              )}
            </div>
            <span className={cn('text-[11px]', isActive && 'font-semibold')}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
