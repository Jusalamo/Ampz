import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, X, Plus } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useApp();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: user?.profile.name || '',
    bio: user?.profile.bio || '',
    occupation: user?.profile.occupation || '',
    company: user?.profile.company || '',
    location: user?.profile.location || '',
    phone: user?.profile.phone || '',
    interests: user?.profile.interests || [],
  });
  
  const [newInterest, setNewInterest] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleAddInterest = () => {
    if (!newInterest.trim() || formData.interests.length >= 10) return;
    if (formData.interests.includes(newInterest.trim())) {
      toast({ title: 'Interest already added', variant: 'destructive' });
      return;
    }
    setFormData(prev => ({ 
      ...prev, 
      interests: [...prev.interests, newInterest.trim()] 
    }));
    setNewInterest('');
    setHasChanges(true);
  };

  const handleRemoveInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    
    updateUser({
      profile: {
        ...user!.profile,
        ...formData,
      }
    });
    
    toast({ title: 'Profile updated successfully!' });
    navigate('/profile');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUser({
          profile: {
            ...user!.profile,
            profilePhoto: reader.result as string,
          }
        });
        toast({ title: 'Photo updated!' });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="app-container min-h-screen bg-background pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-5 h-header pt-safe">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center border border-border hover:border-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Edit Profile</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-5 py-6">
        {/* Profile Photo */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <img
              src={user?.profile.profilePhoto}
              alt={user?.profile.name}
              className="w-28 h-28 rounded-full object-cover border-4 border-primary"
            />
            <label className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
              <Camera className="w-5 h-5 text-primary-foreground" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Full Name</label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Your name"
              className="h-12 bg-card border-border"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Bio <span className="text-xs">({formData.bio.length}/200)</span>
            </label>
            <Textarea
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value.slice(0, 200))}
              placeholder="Tell us about yourself..."
              className="min-h-[100px] bg-card border-border resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Occupation</label>
              <Input
                value={formData.occupation}
                onChange={(e) => handleChange('occupation', e.target.value)}
                placeholder="Your job"
                className="h-12 bg-card border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Company</label>
              <Input
                value={formData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                placeholder="Where you work"
                className="h-12 bg-card border-border"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Location</label>
            <Input
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="City, Country"
              className="h-12 bg-card border-border"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Phone</label>
            <Input
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+264 ..."
              className="h-12 bg-card border-border"
            />
          </div>

          {/* Interests */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Interests <span className="text-xs">({formData.interests.length}/10)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.interests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/20 text-primary text-sm font-medium rounded-full"
                >
                  {interest}
                  <button
                    onClick={() => handleRemoveInterest(interest)}
                    className="w-4 h-4 rounded-full bg-primary/30 flex items-center justify-center hover:bg-primary/50 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Add interest"
                className="h-10 bg-card border-border flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddInterest()}
              />
              <Button
                onClick={handleAddInterest}
                disabled={!newInterest.trim() || formData.interests.length >= 10}
                size="sm"
                className="h-10 px-4"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app bg-background/95 backdrop-blur-xl border-t border-border p-4 pb-safe">
        <Button
          onClick={handleSave}
          className="w-full h-14 text-lg font-semibold gradient-pro glow-purple"
          disabled={!hasChanges}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
