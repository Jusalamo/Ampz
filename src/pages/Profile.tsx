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
import { cn } from '@/lib/utils';

// Design Constants from JSON
const DESIGN = {
  colors: {
    primary: '#C4B5FD',
    lavenderLight: '#E9D5FF',
    accentPink: '#FFB8E6',
    background: '#1A1A1A',
    card: '#2D2D2D',
    textPrimary: '#FFFFFF',
    textSecondary: '#B8B8B8',
    brandRed: '#FF6B6B',
    brandYellow: '#FFD93D',
  },
  typography: {
    h1: { size: '28px', weight: 'bold', color: '#FFFFFF' },
    h2: { size: '24px', weight: 'semibold', color: '#1A1A1A' },
    body: { size: '14px', weight: 'normal', color: '#B8B8B8' },
    small: { size: '13px', weight: 'medium', color: '#B8B8B8' },
    caption: { size: '13px', weight: 'semibold', color: '#B8B8B8', transform: 'uppercase' },
  },
  borderRadius: {
    card: '24px',
    button: '12px',
    roundButton: '50%',
    smallPill: '8px',
  },
  shadows: {
    card: '0 8px 32px rgba(0, 0, 0, 0.4)',
    button: '0 4px 16px rgba(0, 0, 0, 0.3)',
  },
  spacing: {
    default: '16px',
    cardPadding: '16px',
    buttonGap: '12px',
    modalPadding: '20px',
  }
};

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
      gradient: user?.subscription.tier === 'pro' 
        ? 'from-primary to-lavenderLight' 
        : user?.subscription.tier === 'max' 
        ? 'from-primary to-accentPink' 
        : '',
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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div 
      className="fixed inset-0 overflow-auto"
      style={{ 
        background: DESIGN.colors.background,
        paddingBottom: '80px' // Space for bottom nav
      }}
    >
      <div className="px-4 pt-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[28px] font-bold" style={{ color: DESIGN.colors.textPrimary }}>
            Profile
          </h1>
          <button 
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-full flex items-center justify-center border"
            style={{
              background: DESIGN.colors.card,
              borderColor: DESIGN.colors.card,
              borderRadius: DESIGN.borderRadius.roundButton,
            }}
          >
            <Settings className="w-5 h-5" style={{ color: DESIGN.colors.textPrimary }} />
          </button>
        </div>

        {/* Profile Card */}
        <div 
          className="p-6 mb-6 relative overflow-hidden"
          style={{
            background: DESIGN.colors.card,
            borderRadius: DESIGN.borderRadius.card,
            boxShadow: DESIGN.shadows.card,
          }}
        >
          <div 
            className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20"
            style={{ background: DESIGN.colors.primary }}
          />
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <img
                  src={user?.profile.profilePhoto}
                  alt={user?.profile.name}
                  className="w-20 h-20 rounded-full object-cover border-2"
                  style={{ borderColor: DESIGN.colors.primary }}
                />
                <button 
                  onClick={() => navigate('/settings/edit-profile')}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: DESIGN.colors.primary,
                    borderRadius: DESIGN.borderRadius.roundButton,
                  }}
                >
                  <Edit3 className="w-4 h-4" style={{ color: DESIGN.colors.background }} />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <h2 
                  className="text-[24px] font-bold truncate"
                  style={{ color: DESIGN.colors.textPrimary }}
                >
                  {user?.profile.name}
                </h2>
                <p 
                  className="text-[14px] truncate"
                  style={{ color: DESIGN.colors.textSecondary }}
                >
                  {user?.profile.location}
                </p>
                {user?.subscription.tier !== 'free' && (
                  <span 
                    className={`inline-block mt-2 px-3 py-1 text-[11px] font-semibold rounded-full ${
                      user?.subscription.tier === 'pro' 
                        ? 'bg-gradient-to-r from-primary to-lavenderLight' 
                        : 'bg-gradient-to-r from-primary to-accentPink'
                    }`}
                    style={{ color: DESIGN.colors.background }}
                  >
                    {user?.subscription.tier?.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            {user?.profile.bio && (
              <p 
                className="text-[14px] mb-4 line-clamp-2"
                style={{ color: DESIGN.colors.textSecondary }}
              >
                {user?.profile.bio}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {user?.profile.interests.slice(0, 5).map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1 text-[12px] font-medium rounded-full"
                  style={{
                    background: `${DESIGN.colors.primary}20`,
                    color: DESIGN.colors.primary,
                    borderRadius: DESIGN.borderRadius.smallPill,
                  }}
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
              className="p-4 text-center"
              style={{
                background: DESIGN.colors.card,
                borderRadius: DESIGN.borderRadius.card,
                boxShadow: DESIGN.shadows.card,
              }}
            >
              <Icon 
                className="w-5 h-5 mx-auto mb-2" 
                style={{ color: DESIGN.colors.primary }} 
              />
              <p 
                className="text-[24px] font-bold mb-1"
                style={{ color: DESIGN.colors.textPrimary }}
              >
                {value}
              </p>
              <p 
                className="text-[12px]"
                style={{ color: DESIGN.colors.textSecondary }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Theme Toggle */}
        <div 
          className="p-4 flex items-center justify-between mb-4"
          style={{
            background: DESIGN.colors.card,
            borderRadius: DESIGN.borderRadius.card,
            boxShadow: DESIGN.shadows.card,
          }}
        >
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon className="w-5 h-5" style={{ color: DESIGN.colors.primary }} />
            ) : (
              <Sun className="w-5 h-5" style={{ color: DESIGN.colors.brandYellow }} />
            )}
            <span 
              className="font-medium"
              style={{ color: DESIGN.colors.textPrimary }}
            >
              Dark Mode
            </span>
          </div>
          <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
        </div>

        {/* Menu Items */}
        <div className="space-y-3 mb-6">
          {menuItems.map(({ icon: Icon, label, value, gradient, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="w-full p-4 flex items-center justify-between border border-transparent transition-all hover:scale-[1.02]"
              style={{
                background: DESIGN.colors.card,
                borderRadius: DESIGN.borderRadius.card,
                boxShadow: DESIGN.shadows.card,
              }}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" style={{ color: DESIGN.colors.primary }} />
                <span 
                  className="font-medium"
                  style={{ color: DESIGN.colors.textPrimary }}
                >
                  {label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {value && (
                  <span 
                    className={`px-3 py-1 text-[11px] font-semibold rounded-full ${gradient || ''}`}
                    style={{
                      background: gradient ? undefined : DESIGN.colors.card,
                      color: gradient ? DESIGN.colors.background : DESIGN.colors.textPrimary,
                      borderRadius: DESIGN.borderRadius.smallPill,
                    }}
                  >
                    {value}
                  </span>
                )}
                <ChevronRight 
                  className="w-5 h-5" 
                  style={{ color: DESIGN.colors.textSecondary }} 
                />
              </div>
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full p-4 flex items-center justify-center gap-3 border border-transparent transition-all hover:scale-[1.02]"
          style={{
            background: DESIGN.colors.card,
            borderRadius: DESIGN.borderRadius.card,
            boxShadow: DESIGN.shadows.card,
            color: DESIGN.colors.brandRed,
          }}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Log Out</span>
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
