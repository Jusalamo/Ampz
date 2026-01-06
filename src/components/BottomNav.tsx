import { Home, Calendar, Zap, Send, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

const navItems = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Calendar, label: 'Events', path: '/events' },
  { icon: Zap, label: 'Connect', path: '/connect' },
  { icon: Send, label: 'Chats', path: '/matches' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function BottomNav() {
  const location = useLocation();
  const { matches } = useApp();
  const unreadMessagesCount = matches.filter(m => m.unread).length;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app h-[68px] bg-background/98 backdrop-blur-xl border-t border-border flex justify-around items-center pb-safe z-50">
      {navItems.map(({ icon: Icon, label, path }) => {
        const isActive = location.pathname === path || 
          (path === '/home' && location.pathname.startsWith('/home')) ||
          (path === '/events' && location.pathname.startsWith('/events')) ||
          (path === '/connect' && location.pathname.startsWith('/connect')) ||
          (path === '/matches' && location.pathname.startsWith('/matches')) ||
          (path === '/profile' && location.pathname.startsWith('/profile'));
        
        const isMatches = path === '/matches';
        
        return (
          <Link
            key={path}
            to={path}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2 px-3 text-xs font-medium transition-all flex-1 h-full relative',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="relative">
              <Icon 
                className={cn(
                  'w-6 h-6 transition-all duration-200',
                  isActive && 'scale-110'
                )} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              
              {isMatches && unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-purple rounded-full text-[10px] font-bold flex items-center justify-center text-white border border-background">
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </span>
              )}
            </div>
            <span className={cn(
              'text-[11px] transition-all duration-200',
              isActive ? 'font-semibold text-primary' : 'text-muted-foreground'
            )}>
              {label}
            </span>
            
            {/* Active indicator dot */}
            {isActive && (
              <div className="absolute bottom-0 w-6 h-1 bg-primary rounded-t-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
