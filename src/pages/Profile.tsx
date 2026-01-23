import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Edit3,
  Calendar,
  Users,
  Star,
  ChevronRight,
  LogOut,
  CreditCard,
  Shield,
  Moon,
  Sun,
  BarChart3,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { Switch } from '@/components/ui/switch';
import { SubscriptionModal } from '@/components/modals/SubscriptionModal';

export default function Profile() {
  const navigate = useNavigate();
  const { user, theme, toggleTheme, logout } = useApp();

  const stats = [
    { icon: Calendar, value: user?.bookmarkedEvents.length ?? 0, label: 'Events' },
    { icon: Users, value: 12, label: 'Matches' },
    { icon: Star, value: '95%', label: 'Response' },
  ];

  const menuItems = [
    {
      icon: Edit3,
      label: 'Edit Profile',
      onClick: () => navigate('/settings/edit-profile'),
    },
    {
      icon: CreditCard,
      label: 'Subscription',
      value: user?.subscription.tier?.toUpperCase(),
      isPro: user?.subscription.tier === 'pro',
      isMax: user?.subscription.tier === 'max',
      onClick: () => setShowSubscriptionModal(true),
    },
    { 
      icon: Shield, 
      label: 'Privacy Settings', 
      onClick: () => navigate('/settings/privacy') 
    },
    ...(user?.subscription.tier !== 'free' ? [{
      icon: BarChart3,
      label: 'Analytics',
      onClick: () => {},
    }] : []),
  ];

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="fixed inset-0 overflow-auto bg-background pb-20">
      <div className="px-4 pt-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Profile
          </h1>
          <button 
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-card border border-border/20 ampz-transition hover:scale-105 active:scale-95"
          >
            <Settings className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="ampz-card p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 bg-primary" />
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <img
                  src={user?.profile.profilePhoto}
                  alt={user?.profile.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                />
                <button 
                  onClick={() => navigate('/settings/edit-profile')}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary ampz-transition hover:bg-accent active:scale-95"
                >
                  <Edit3 className="w-4 h-4 text-primary-foreground" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-foreground truncate">
                  {user?.profile.name}
                </h2>
                <p className="text-sm text-muted-foreground truncate">
                  {user?.profile.location}
                </p>
                {user?.subscription.tier !== 'free' && (
                  <span className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full text-primary-foreground ${
                    user?.subscription.tier === 'pro' ? 'gradient-pro' : 'gradient-max'
                  }`}>
                    {user?.subscription.tier?.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            {user?.profile.bio && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {user?.profile.bio}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {user?.profile.interests.slice(0, 5).map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1 text-xs font-medium rounded-ampz-sm bg-primary/20 text-primary"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {stats.map(({ icon: Icon, value, label }) => (
            <div 
              key={label} 
              className="ampz-card p-4 text-center"
            >
              <Icon className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-foreground mb-1">
                {value}
              </p>
              <p className="text-xs text-muted-foreground">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Theme Toggle */}
        <div className="ampz-card p-4 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-primary" />
            ) : (
              <Sun className="w-5 h-5 text-brand-yellow" />
            )}
            <span className="font-medium text-foreground">
              Dark Mode
            </span>
          </div>
          <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
        </div>

        {/* Menu Items */}
        <div className="space-y-3 mb-6">
          {menuItems.map(({ icon: Icon, label, value, isPro, isMax, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="w-full ampz-card p-4 flex items-center justify-between ampz-interactive"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">
                  {label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {value && (
                  <span className={`px-3 py-1 text-xs font-semibold rounded-ampz-sm ${
                    isPro ? 'gradient-pro text-primary-foreground' : 
                    isMax ? 'gradient-max text-foreground' : 
                    'bg-card text-foreground'
                  }`}>
                    {value}
                  </span>
                )}
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full ampz-card p-4 flex items-center justify-center gap-3 text-destructive ampz-interactive"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Log Out</span>
        </button>
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <SubscriptionModal 
          isOpen={showSubscriptionModal} 
          onClose={() => setShowSubscriptionModal(false)} 
        />
      )}

      <BottomNav />
    </div>
  );
}