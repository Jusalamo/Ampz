import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, MapPin, Circle, MessageCircle, Share2, Database } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Switch } from '@/components/ui/switch';
import { BottomNav } from '@/components/BottomNav';
import { useToast } from '@/hooks/use-toast';

export default function PrivacySettings() {
  const navigate = useNavigate();
  const { user, updateUser } = useApp();
  const { toast } = useToast();

  const handleToggle = (key: keyof typeof user.settings.privacy, value: boolean | string) => {
    if (!user) return;
    
    const updatedSettings = {
      ...user.settings,
      privacy: {
        ...user.settings.privacy,
        [key]: value,
      }
    };
    
    updateUser({ settings: updatedSettings });
    toast({ title: 'Settings saved', duration: 1500 });
  };

  const privacySections = [
    {
      title: 'Profile Visibility',
      items: [
        {
          icon: Eye,
          label: 'Show Profile in Search',
          description: 'Allow others to find you by name or username',
          key: 'searchable',
          type: 'toggle',
          value: user?.settings.privacy.searchable,
        },
        {
          icon: MapPin,
          label: 'Show Distance',
          description: 'Display how far you are from other users',
          key: 'showDistance',
          type: 'toggle',
          value: user?.settings.privacy.showDistance,
        },
        {
          icon: Circle,
          label: 'Show Online Status',
          description: 'Let others see when you\'re online',
          key: 'showOnline',
          type: 'toggle',
          value: user?.settings.privacy.showOnline,
        },
      ]
    },
    {
      title: 'Messaging',
      items: [
        {
          icon: MessageCircle,
          label: 'Who Can Message You',
          description: 'Control who can start conversations',
          key: 'messageFrom',
          type: 'select',
          value: user?.settings.privacy.messageFrom,
          options: [
            { value: 'everyone', label: 'Everyone' },
            { value: 'matches', label: 'Matches Only' },
            { value: 'none', label: 'No One' },
          ]
        },
      ]
    },
    {
      title: 'Data & Sharing',
      items: [
        {
          icon: Share2,
          label: 'Share Usage Data',
          description: 'Help improve Amps by sharing anonymous usage data',
          key: 'shareData',
          type: 'toggle',
          value: true,
        },
        {
          icon: Database,
          label: 'Download My Data',
          description: 'Get a copy of all your data',
          key: 'downloadData',
          type: 'button',
        },
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
          <h1 className="text-2xl font-bold">Privacy Settings</h1>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {privacySections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                {section.title}
              </h2>
              <div className="glass-card divide-y divide-border overflow-hidden">
                {section.items.map((item) => (
                  <div
                    key={item.key}
                    className="p-4 flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                      
                      {item.type === 'select' && item.options && (
                        <div className="flex gap-2 mt-3">
                          {item.options.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleToggle(item.key as keyof typeof user.settings.privacy, option.value)}
                              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                                item.value === option.value
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-card border border-border hover:border-primary'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {item.type === 'button' && (
                        <button className="mt-3 px-4 py-2 text-sm font-medium rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                          Download
                        </button>
                      )}
                    </div>
                    
                    {item.type === 'toggle' && (
                      <Switch
                        checked={item.value as boolean}
                        onCheckedChange={(checked) => handleToggle(item.key as keyof typeof user.settings.privacy, checked)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
