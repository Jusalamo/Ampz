import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Shield, 
  UserX, 
  Moon, 
  Sun, 
  Globe, 
  Bell, 
  CreditCard, 
  HelpCircle, 
  MessageCircle, 
  FileText,
  LogOut,
  Trash2,
  ChevronRight 
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Switch } from '@/components/ui/switch';
import { BottomNav } from '@/components/BottomNav';

export default function Settings() {
  const navigate = useNavigate();
  const { user, theme, toggleTheme, logout } = useApp();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const settingSections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Edit Profile', onClick: () => navigate('/settings/edit-profile') },
        { icon: Mail, label: 'Change Email', value: user?.email, onClick: () => {} },
        { icon: Lock, label: 'Change Password', onClick: () => {} },
        { icon: Phone, label: 'Emergency Contact', onClick: () => {} },
      ]
    },
    {
      title: 'Privacy & Security',
      items: [
        { icon: Shield, label: 'Privacy Settings', onClick: () => navigate('/settings/privacy') },
        { icon: UserX, label: 'Blocked Users', value: `${user?.blockedUsers.length || 0}`, onClick: () => {} },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { 
          icon: theme === 'dark' ? Moon : Sun, 
          label: 'Dark Mode', 
          toggle: true, 
          checked: theme === 'dark',
          onToggle: toggleTheme 
        },
        { icon: Globe, label: 'Currency', value: 'NAD', onClick: () => {} },
        { icon: Bell, label: 'Notifications', toggle: true, checked: true, onToggle: () => {} },
      ]
    },
    {
      title: 'Subscription',
      items: [
        { 
          icon: CreditCard, 
          label: 'Manage Subscription', 
          value: user?.subscription.tier?.toUpperCase(),
          badge: user?.subscription.tier !== 'free',
          onClick: () => {} 
        },
      ]
    },
    {
      title: 'Help & Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', onClick: () => {} },
        { icon: MessageCircle, label: 'Contact Support', onClick: () => {} },
        { icon: FileText, label: 'Terms of Service', onClick: () => {} },
        { icon: Shield, label: 'Privacy Policy', onClick: () => {} },
      ]
    },
  ];

  return (
    <div className="app-container min-h-screen bg-background pb-nav">
      <div className="px-5 pt-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center border border-border hover:border-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                {section.title}
              </h2>
              <div className="glass-card divide-y divide-border overflow-hidden">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.toggle ? undefined : item.onClick}
                    className="w-full p-4 flex items-center justify-between hover:bg-card/80 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-primary" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.value && !item.badge && (
                        <span className="text-sm text-muted-foreground">{item.value}</span>
                      )}
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full gradient-pro">
                          {item.value}
                        </span>
                      )}
                      {item.toggle ? (
                        <Switch checked={item.checked} onCheckedChange={item.onToggle} />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Danger Zone */}
        <div className="mt-8 space-y-3">
          <button
            onClick={handleLogout}
            className="w-full glass-card p-4 flex items-center justify-center gap-2 text-brand-red hover:border-brand-red transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log Out</span>
          </button>
          
          <button
            className="w-full glass-card p-4 flex items-center justify-center gap-2 text-brand-red/60 hover:text-brand-red hover:border-brand-red/50 transition-all"
          >
            <Trash2 className="w-5 h-5" />
            <span className="font-medium">Delete Account</span>
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 mb-4">
          Version 1.0.0 • Made with ❤️ in Namibia
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
