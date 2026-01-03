import { useRef, useEffect } from 'react';
import { Bell, Heart, MessageCircle, Calendar, Star, CheckCheck } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconMap = {
  match: Heart,
  message: MessageCircle,
  event: Calendar,
  like: Star,
  system: Bell,
};

const colorMap = {
  match: 'text-brand-pink bg-brand-pink/20',
  message: 'text-brand-blue bg-brand-blue/20',
  event: 'text-primary bg-primary/20',
  like: 'text-brand-red bg-brand-red/20',
  system: 'text-muted-foreground bg-muted',
};

export function NotificationsDropdown({ isOpen, onClose }: NotificationsDropdownProps) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const formatTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-12 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-in"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-bold">Notifications</h3>
        {notifications.some(n => !n.read) && (
          <button
            onClick={markAllNotificationsRead}
            className="text-xs text-primary flex items-center gap-1 hover:underline"
          >
            <CheckCheck className="w-3 h-3" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.slice(0, 10).map((notification) => {
            const Icon = iconMap[notification.type];
            return (
              <button
                key={notification.id}
                onClick={() => markNotificationRead(notification.id)}
                className={cn(
                  'w-full p-4 flex items-start gap-3 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-0',
                  !notification.read && 'bg-primary/5'
                )}
              >
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', colorMap[notification.type])}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{notification.title}</p>
                    {!notification.read && (
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTime(notification.timestamp)}
                  </p>
                </div>
              </button>
            );
          })
        ) : (
          <div className="p-8 text-center">
            <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
