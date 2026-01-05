import { ReactNode } from 'react';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';

interface HeaderProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'transparent' | 'fixed';
  hideOnScroll?: boolean;
}

export function Header({ 
  children, 
  className,
  variant = 'default',
  hideOnScroll = false 
}: HeaderProps) {
  const { scrollDirection, scrollY } = useScrollDirection();
  
  const isHidden = hideOnScroll && scrollDirection === 'down' && scrollY > 100;
  const isTransparent = variant === 'transparent' && scrollY < 50;

  return (
    <header
      className={cn(
        'fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-app z-40 transition-all duration-300',
        isHidden ? '-translate-y-full' : 'translate-y-0',
        isTransparent 
          ? 'bg-transparent' 
          : 'bg-background/95 backdrop-blur-xl border-b border-border',
        className
      )}
    >
      <div className="h-header flex items-center justify-between px-5 pt-safe">
        {children}
      </div>
    </header>
  );
}
