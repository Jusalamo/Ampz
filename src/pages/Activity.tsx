import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  Calendar, 
  UserPlus, 
  Check, 
  X,
  ChevronRight,
  Users,
  Star,
  Zap
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Tab = 'all' | 'requests' | 'events' | 'mentions';

export default function Activity() {
  const navigate = useNavigate();
  const { notifications, markNotificationRead, markAllNotificationsRead, matches } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('all');

  // Mock friend requests
  const friendRequests = [
    { id: '1', name: 'Sarah Chen', photo: 'https://i.pravatar.cc/100?img=5', mutualFriends: 3 },
    { id: '2', name: 'Mike Johnson', photo: 'https://i.pravatar.cc/100?img=12', mutualFriends: 1 },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'match': return <Heart className="w-5 h-5 text-pink-500" />;
      case 'message': return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'event': return <Calendar className="w-5 h-5 text-primary" />;
      case 'like': return <Heart className="w-5 h-5 text-red-500" />;
      default: return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  const filteredNotifications = notifications.filter(n => {
    switch (activeTab) {
      case 'requests': return n.type === 'match';
      case 'events': return n.type === 'event';
      case 'mentions': return n.type === 'like' || n.type === 'message';
      default: return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="app-container min-h-screen bg-background pb-nav">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold">Activity</h1>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllNotificationsRead}
              className="text-primary text-sm"
            >
              Mark all read
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-2 pb-3 overflow-x-auto no-scrollbar">
          {[
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'requests', label: 'Requests', count: friendRequests.length },
            { key: 'events', label: 'Events', count: notifications.filter(n => n.type === 'event').length },
            { key: 'mentions', label: 'Mentions', count: 0 },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as Tab)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2',
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground border border-border'
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  'px-1.5 py-0.5 rounded-full text-xs',
                  activeTab === tab.key ? 'bg-white/20' : 'bg-primary/20 text-primary'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Friend Requests Section */}
        {(activeTab === 'all' || activeTab === 'requests') && friendRequests.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Friend Requests
            </h2>
            <div className="space-y-2">
              {friendRequests.map(request => (
                <div key={request.id} className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-3">
                    <img
                      src={request.photo}
                      alt={request.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{request.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {request.mutualFriends} mutual friends
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full">
                        <X className="w-4 h-4" />
                      </Button>
                      <Button size="sm" className="h-8 w-8 p-0 rounded-full">
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Matches Section */}
        {(activeTab === 'all' || activeTab === 'requests') && matches.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              New Matches
            </h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {matches.slice(0, 5).map(match => (
                <button
                  key={match.id}
                  onClick={() => navigate('/matches')}
                  className="flex-shrink-0 flex flex-col items-center gap-2"
                >
                  <div className="relative">
                    <img
                      src={match.matchProfile.photo}
                      alt={match.matchProfile.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                    />
                    {match.online && (
                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <p className="text-xs font-medium truncate w-16 text-center">
                    {match.matchProfile.name.split(' ')[0]}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            {activeTab === 'all' ? 'Recent Activity' : 
             activeTab === 'events' ? 'Event Updates' : 
             activeTab === 'mentions' ? 'Mentions & Likes' : 'Requests'}
          </h2>
          
          {filteredNotifications.length > 0 ? (
            <div className="space-y-2">
              {filteredNotifications.map(notification => (
                <button
                  key={notification.id}
                  onClick={() => markNotificationRead(notification.id)}
                  className={cn(
                    'w-full bg-card rounded-xl p-4 border border-border text-left transition-all',
                    !notification.read && 'border-l-4 border-l-primary bg-primary/5'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center flex-shrink-0 border border-border">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          'text-sm',
                          !notification.read && 'font-semibold'
                        )}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {getRelativeTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-bold mb-2">No Activity Yet</h3>
              <p className="text-muted-foreground text-sm">
                When you get notifications, they'll appear here
              </p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
