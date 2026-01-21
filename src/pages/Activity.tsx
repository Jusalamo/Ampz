import { useState, useCallback } from 'react';
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
  Zap,
  Ticket,
  Image,
  AtSign,
  Settings,
  Trash2
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Tab = 'all' | 'requests' | 'events' | 'mentions';

export default function Activity() {
  const navigate = useNavigate();
  const { notifications, markNotificationRead, markAllNotificationsRead, matches } = useApp();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('all');

  // Friend requests - will be populated from real data when available
  const [friendRequests, setFriendRequests] = useState<{
    id: string;
    name: string;
    photo: string;
    mutualFriends: number;
    timestamp: string;
  }[]>([]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'match': return <Heart className="w-5 h-5 text-pink-500" />;
      case 'message': return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'event': return <Calendar className="w-5 h-5 text-primary" />;
      case 'like': return <Heart className="w-5 h-5 text-red-500" />;
      case 'ticket': return <Ticket className="w-5 h-5 text-green-500" />;
      case 'photo': return <Image className="w-5 h-5 text-purple-500" />;
      case 'mention': return <AtSign className="w-5 h-5 text-orange-500" />;
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

  const handleNotificationClick = useCallback((notification: typeof notifications[0]) => {
    // Mark as read
    markNotificationRead(notification.id);
    
    // Navigate based on notification type and data
    if (notification.data?.matchId) {
      navigate('/matches');
    } else if (notification.data?.eventId) {
      navigate(`/event/${notification.data.eventId}`);
    } else if (notification.type === 'message') {
      navigate('/matches');
    } else if (notification.type === 'match') {
      navigate('/matches');
    }
  }, [markNotificationRead, navigate]);

  const handleAcceptFriendRequest = (requestId: string) => {
    const request = friendRequests.find(r => r.id === requestId);
    setFriendRequests(prev => prev.filter(r => r.id !== requestId));
    toast({
      title: 'Friend request accepted!',
      description: `You and ${request?.name} are now friends.`,
    });
  };

  const handleDeclineFriendRequest = (requestId: string) => {
    setFriendRequests(prev => prev.filter(r => r.id !== requestId));
    toast({
      title: 'Request declined',
    });
  };

  return (
    <div className="app-container min-h-screen bg-background pb-nav">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full text-xs font-bold flex items-center justify-center text-primary-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold">Activity</h1>
          </div>
          <div className="flex items-center gap-2">
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
            <button 
              onClick={() => navigate('/settings')}
              className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card/80 transition-colors"
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-2 pb-3 overflow-x-auto no-scrollbar">
          {[
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'requests', label: 'Requests', count: friendRequests.length + matches.length },
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
                  : 'bg-card text-muted-foreground border border-border hover:border-primary/50'
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  'px-1.5 py-0.5 rounded-full text-xs font-bold',
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
                      className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{request.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {request.mutualFriends} mutual friends • {getRelativeTime(request.timestamp)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-10 w-10 p-0 rounded-full border-red-300 hover:bg-red-50 hover:border-red-400"
                        onClick={() => handleDeclineFriendRequest(request.id)}
                      >
                        <X className="w-5 h-5 text-red-500" />
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-10 w-10 p-0 rounded-full"
                        onClick={() => handleAcceptFriendRequest(request.id)}
                      >
                        <Check className="w-5 h-5" />
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
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {matches.slice(0, 6).map(match => (
                <button
                  key={match.id}
                  onClick={() => navigate('/matches')}
                  className="flex-shrink-0 flex flex-col items-center gap-2 group"
                >
                  <div className="relative">
                    <div className="w-18 h-18 p-0.5 rounded-full bg-gradient-to-br from-pink-500 to-purple-600">
                      <img
                        src={match.matchProfile.photo}
                        alt={match.matchProfile.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-background"
                      />
                    </div>
                    {match.online && (
                      <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <p className="text-xs font-medium truncate w-18 text-center group-hover:text-primary transition-colors">
                    {match.matchProfile.name.split(' ')[0]}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {activeTab === 'all' ? 'Recent Activity' : 
               activeTab === 'events' ? 'Event Updates' : 
               activeTab === 'mentions' ? 'Mentions & Likes' : 'Requests'}
            </h2>
          </div>
          
          {filteredNotifications.length > 0 ? (
            <div className="space-y-2">
              {filteredNotifications.map(notification => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'w-full bg-card rounded-xl p-4 border border-border text-left transition-all hover:bg-card/80 group',
                    !notification.read && 'border-l-4 border-l-primary bg-primary/5'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                      notification.type === 'match' && 'bg-pink-500/10',
                      notification.type === 'message' && 'bg-blue-500/10',
                      notification.type === 'event' && 'bg-primary/10',
                      notification.type === 'like' && 'bg-red-500/10',
                      notification.type === 'system' && 'bg-muted'
                    )}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          'text-sm leading-snug',
                          !notification.read && 'font-semibold'
                        )}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {getRelativeTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Bell className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-bold mb-2">No Activity Yet</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                When you get notifications, they'll appear here. Start by exploring events or connecting with people!
              </p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
