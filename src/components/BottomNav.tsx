import { Home, Calendar, Users, MessageCircle, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Calendar, label: 'Events', path: '/events' },
  { icon: Users, label: 'Connect', path: '/connect' },
  { icon: MessageCircle, label: 'Matches', path: '/matches' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app h-nav bg-background/98 backdrop-blur-xl border-t border-border flex justify-around items-center pb-safe z-50">
      {navItems.map(({ icon: Icon, label, path }) => {
        const isActive = location.pathname === path;
        return (
          <Link
            key={path}
            to={path}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-3 px-4 text-xs font-medium transition-colors flex-1 h-full',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className={cn('w-6 h-6', isActive && 'drop-shadow-[0_0_8px_hsl(var(--brand-purple))]')} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
