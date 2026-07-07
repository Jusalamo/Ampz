import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function PublicProfileScreen() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useApp();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'none' | 'pending' | 'friends' | 'self'>('none');

  useEffect(() => {
    if (!userId) return;
    if (userId === user?.id) { setStatus('self'); }
    (async () => {
      const { data } = await supabase.from('profiles').select('id,name,username,profile_photo,bio,location').eq('id', userId).maybeSingle();
      setProfile(data);
      if (user?.id && userId !== user.id) {
        const { data: fs } = await supabase.from('friendships').select('*')
          .or(`and(user1_id.eq.${user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${user.id})`).maybeSingle();
        if (fs) setStatus('friends');
        else {
          const { data: fr } = await supabase.from('friend_requests').select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
            .eq('status', 'pending').maybeSingle();
          if (fr) setStatus('pending');
        }
      }
      setLoading(false);
    })();
  }, [userId, user?.id]);

  const connect = async () => {
    if (!user?.id || !userId) return;
    const { error } = await supabase.from('friend_requests').insert({ sender_id: user.id, receiver_id: userId, status: 'pending' });
    if (error) toast({ title: 'Could not send', description: error.message, variant: 'destructive' });
    else { setStatus('pending'); toast({ title: 'Request sent' }); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!profile) return <div className="min-h-screen flex flex-col items-center justify-center p-6"><p className="text-muted-foreground mb-4">User not found</p><Button onClick={() => navigate(-1)}>Back</Button></div>;

  return (
    <div className="min-h-screen bg-background pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="font-bold tracking-tight">Profile</h1>
      </header>

      <div className="p-6 flex flex-col items-center text-center">
        <img src={profile.profile_photo || '/default-avatar.png'} onError={(e) => (e.currentTarget.src = '/default-avatar.png')} alt="" className="w-24 h-24 rounded-full object-cover mb-4" />
        <h2 className="text-2xl font-bold tracking-tight">{profile.name || 'User'}</h2>
        {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
        {profile.location && <p className="text-sm text-muted-foreground mt-1">{profile.location}</p>}
        {profile.bio && <p className="text-sm text-muted-foreground mt-4 max-w-md">{profile.bio}</p>}

        <div className="mt-6">
          {status === 'self' && <Button variant="outline" onClick={() => navigate('/profile')}>View my profile</Button>}
          {status === 'friends' && <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">Connected</span>}
          {status === 'pending' && <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">Request pending</span>}
          {status === 'none' && <Button onClick={connect}><UserPlus className="w-4 h-4 mr-2" /> Connect</Button>}
        </div>
      </div>
    </div>
  );
}
