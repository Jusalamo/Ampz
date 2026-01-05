import { useState } from 'react';
import { Search, Plus, Users, UserPlus, QrCode, Share2, Check, Clock } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';

interface QuickAddPerson {
  id: string;
  name: string;
  photo: string;
  context: string;
  mutualFriends?: number;
}

const demoQuickAdd: QuickAddPerson[] = [
  { id: '1', name: 'Sarah Chen', photo: 'https://i.pravatar.cc/100?img=5', context: 'Met at Tech Mixer', mutualFriends: 3 },
  { id: '2', name: 'Marcus Johnson', photo: 'https://i.pravatar.cc/100?img=12', context: '5 mutual friends', mutualFriends: 5 },
  { id: '3', name: 'Lisa Wong', photo: 'https://i.pravatar.cc/100?img=9', context: 'Met at Jazz Night', mutualFriends: 2 },
];

export default function Social() {
  const { matches } = useApp();
  const { toast } = useToast();
  const [mode, setMode] = useState<'friends' | 'connections'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingRequests, setPendingRequests] = useState<string[]>([]);

  const handleAddFriend = (personId: string, name: string) => {
    if (pendingRequests.includes(personId)) return;
    setPendingRequests(prev => [...prev, personId]);
    toast({ title: `Friend request sent to ${name}!` });
  };

  const connections = matches.map(m => ({
    id: m.id,
    name: m.matchProfile.name,
    photo: m.matchProfile.photo,
    eventContext: m.eventName,
    timestamp: m.timestamp,
    online: m.online,
  }));

  return (
    <div className="app-container min-h-screen bg-background pb-nav">
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Social</h1>
          <Sheet>
            <SheetTrigger asChild>
              <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-xl">Add Friends</SheetTitle>
              </SheetHeader>
              
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Quick Add</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2">
                  {demoQuickAdd.map((person) => (
                    <div key={person.id} className="flex-shrink-0 w-[140px] glass-card p-4 text-center">
                      <img
                        src={person.photo}
                        alt={person.name}
                        className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
                      />
                      <p className="font-semibold text-sm truncate">{person.name}</p>
                      <p className="text-xs text-muted-foreground mb-3 truncate">{person.context}</p>
                      <button
                        onClick={() => handleAddFriend(person.id, person.name)}
                        disabled={pendingRequests.includes(person.id)}
                        className={`w-full py-2 text-sm font-medium rounded-lg transition-all ${
                          pendingRequests.includes(person.id)
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        }`}
                      >
                        {pendingRequests.includes(person.id) ? 'Pending' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Find Friends</h3>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by name or username..."
                    className="h-12 pl-12 bg-card border-border"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full glass-card p-4 flex items-center gap-4 hover:border-primary transition-all">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Scan QR Code</p>
                    <p className="text-sm text-muted-foreground">Scan a friend's QR code to connect</p>
                  </div>
                </button>
                
                <button className="w-full glass-card p-4 flex items-center gap-4 hover:border-primary transition-all">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Share2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Share Invite Link</p>
                    <p className="text-sm text-muted-foreground">Invite friends to join Amps</p>
                  </div>
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-2 p-1 bg-card rounded-xl mb-6">
          <button
            onClick={() => setMode('friends')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              mode === 'friends' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4 inline-block mr-2" />
            Friends
          </button>
          <button
            onClick={() => setMode('connections')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              mode === 'connections' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserPlus className="w-4 h-4 inline-block mr-2" />
            Connections
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={`Search ${mode}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-12 bg-card border-border"
          />
        </div>

        {mode === 'friends' ? (
          <div className="space-y-3">
            {demoQuickAdd.map((friend) => (
              <div key={friend.id} className="glass-card p-4 flex items-center gap-4">
                <div className="relative">
                  <img
                    src={friend.photo}
                    alt={friend.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-brand-green rounded-full border-2 border-background" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{friend.name}</h3>
                    <Check className="w-4 h-4 text-brand-green" />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {friend.mutualFriends} mutual friends
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {connections.length > 0 ? (
              connections.map((connection) => (
                <div key={connection.id} className="glass-card p-4 flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={connection.photo}
                      alt={connection.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    {connection.online && (
                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-brand-green rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{connection.name}</h3>
                    <p className="text-sm text-primary truncate">
                      Met at {connection.eventContext}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {new Date(connection.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="px-4 py-2 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    Add Friend
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">No Connections Yet</h3>
                <p className="text-muted-foreground text-sm">
                  Check in at events to meet new people!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
