import { Home, Calendar, PlusSquare, Bell, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

const navItems = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Calendar, label: 'Events', path: '/events' },
  { icon: PlusSquare, label: 'Create', path: '/create' },
  { icon: Bell, label: 'Activity', path: '/activity' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function BottomNav() {
  const location = useLocation();
  const { unreadNotificationsCount } = useApp();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app h-[72px] bg-background/98 backdrop-blur-xl border-t border-border flex justify-around items-center pb-safe z-50">
      {navItems.map(({ icon: Icon, label, path }) => {
        const isActive = location.pathname === path || 
          (path === '/activity' && location.pathname === '/matches') ||
          (path === '/home' && location.pathname === '/social');
        const isActivity = path === '/activity';
        const isCreate = path === '/create';
        
        return (
          <Link
            key={path}
            to={path === '/create' ? '/events' : path === '/activity' ? '/matches' : path}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2 px-4 text-xs font-medium transition-all flex-1 h-full relative',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="relative">
              {isCreate ? (
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
              {isActivity && unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-red rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </div>
            {!isCreate && (
              <span className={cn('text-[11px]', isActive && 'font-semibold')}>{label}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
