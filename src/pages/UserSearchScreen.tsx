import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Loader2, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function UserSearchScreen() {
  const navigate = useNavigate();
  const { user } = useApp();
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, 'none' | 'pending' | 'friends'>>({});

  useEffect(() => {
    if (!q.trim() || !user?.id) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      const query = q.trim();
      const { data } = await supabase
        .from('profiles')
        .select('id, name, username, profile_photo, bio')
        .neq('id', user.id)
        .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(20);
      setResults(data || []);

      if (data && data.length) {
        const ids = data.map((p: any) => p.id);
        const [{ data: fr }, { data: fs }] = await Promise.all([
          supabase.from('friend_requests').select('sender_id,receiver_id,status').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).eq('status', 'pending'),
          supabase.from('friendships').select('user1_id,user2_id').or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`),
        ]);
        const map: Record<string, 'none' | 'pending' | 'friends'> = {};
        ids.forEach((id: string) => (map[id] = 'none'));
        (fs || []).forEach((f: any) => {
          const other = f.user1_id === user.id ? f.user2_id : f.user1_id;
          if (map[other] !== undefined) map[other] = 'friends';
        });
        (fr || []).forEach((r: any) => {
          const other = r.sender_id === user.id ? r.receiver_id : r.sender_id;
          if (map[other] === 'none') map[other] = 'pending';
        });
        setStatuses(map);
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [q, user?.id]);

  const sendRequest = async (receiverId: string) => {
    if (!user?.id) return;
    const { error } = await supabase.from('friend_requests').insert({
      sender_id: user.id, receiver_id: receiverId, status: 'pending',
    });
    if (error) {
      toast({ title: 'Could not send request', description: error.message, variant: 'destructive' });
    } else {
      setStatuses((prev) => ({ ...prev, [receiverId]: 'pending' }));
      toast({ title: 'Request sent' });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="font-bold tracking-tight">Find People</h1>
      </header>

      <div className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or @username" className="pl-9" autoFocus />
        </div>
      </div>

      <div className="px-4 space-y-2">
        {loading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />}
        {!loading && q.trim() && results.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No users found</p>
        )}
        {results.map((p) => {
          const st = statuses[p.id] || 'none';
          return (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <button onClick={() => navigate(`/user/${p.id}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <img src={p.profile_photo || '/default-avatar.png'} onError={(e) => (e.currentTarget.src = '/default-avatar.png')} alt="" className="w-11 h-11 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{p.name || 'User'}</p>
                  {p.username && <p className="text-xs text-muted-foreground truncate">@{p.username}</p>}
                </div>
              </button>
              {st === 'friends' ? (
                <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Connected</span>
              ) : st === 'pending' ? (
                <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Pending</span>
              ) : (
                <Button size="sm" variant="outline" onClick={() => sendRequest(p.id)}>
                  <UserPlus className="w-3 h-3 mr-1" /> Connect
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
