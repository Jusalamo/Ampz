import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Users, UserPlus, QrCode, Share2, Check, Clock, X, Loader2, UserCheck } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useFriends } from '@/hooks/useFriends';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SearchResult {
  id: string;
  name: string;
  photo: string;
  bio: string;
}

export default function Social() {
  const { matches, user } = useApp();
  const { toast } = useToast();
  const { 
    friends, 
    receivedRequests, 
    sentRequests, 
    isLoading, 
    sendFriendRequest, 
    acceptFriendRequest, 
    declineFriendRequest,
    cancelFriendRequest,
    searchUsers 
  } = useFriends(user?.id);
  
  const [mode, setMode] = useState<'friends' | 'connections' | 'requests'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [sheetSearchQuery, setSheetSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Debounced search in add friends sheet
  useEffect(() => {
    if (sheetSearchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchUsers(sheetSearchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [sheetSearchQuery, searchUsers]);

  const handleSendRequest = async (userId: string, name: string) => {
    if (processingIds.has(userId)) return;
    
    setProcessingIds(prev => new Set(prev).add(userId));
    const success = await sendFriendRequest(userId);
    setProcessingIds(prev => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
    
    if (success) {
      toast({ title: `Friend request sent to ${name}!` });
    } else {
      toast({ title: 'Failed to send request', variant: 'destructive' });
    }
  };

  const handleAcceptRequest = async (requestId: string, name: string) => {
    if (processingIds.has(requestId)) return;
    
    setProcessingIds(prev => new Set(prev).add(requestId));
    const success = await acceptFriendRequest(requestId);
    setProcessingIds(prev => {
      const next = new Set(prev);
      next.delete(requestId);
      return next;
    });
    
    if (success) {
      toast({ title: `You're now friends with ${name}!` });
    } else {
      toast({ title: 'Failed to accept request', variant: 'destructive' });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    if (processingIds.has(requestId)) return;
    
    setProcessingIds(prev => new Set(prev).add(requestId));
    await declineFriendRequest(requestId);
    setProcessingIds(prev => {
      const next = new Set(prev);
      next.delete(requestId);
      return next;
    });
  };

  const handleCancelRequest = async (requestId: string) => {
    if (processingIds.has(requestId)) return;
    
    setProcessingIds(prev => new Set(prev).add(requestId));
    await cancelFriendRequest(requestId);
    setProcessingIds(prev => {
      const next = new Set(prev);
      next.delete(requestId);
      return next;
    });
    toast({ title: 'Friend request cancelled' });
  };

  // Check if user is already a friend or has pending request
  const getRelationshipStatus = useCallback((userId: string): 'friend' | 'pending_sent' | 'pending_received' | 'none' => {
    if (friends.some(f => f.friendId === userId)) return 'friend';
    if (sentRequests.some(r => r.receiverId === userId)) return 'pending_sent';
    if (receivedRequests.some(r => r.senderId === userId)) return 'pending_received';
    return 'none';
  }, [friends, sentRequests, receivedRequests]);

  const connections = matches.map(m => ({
    id: m.id,
    name: m.matchProfile.name,
    photo: m.matchProfile.photo,
    eventContext: m.eventName,
    timestamp: m.timestamp,
    online: m.online,
  }));

  // Filter friends by search
  const filteredFriends = friends.filter(f => 
    f.friendName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter connections by search
  const filteredConnections = connections.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingRequestsCount = receivedRequests.length;

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
              
              {/* Search Input */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by name..."
                    value={sheetSearchQuery}
                    onChange={(e) => setSheetSearchQuery(e.target.value)}
                    className="h-12 pl-12 bg-card border-border"
                  />
                  {sheetSearchQuery && (
                    <button 
                      onClick={() => setSheetSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                {sheetSearchQuery.length > 0 && sheetSearchQuery.length < 2 && (
                  <p className="text-xs text-muted-foreground mt-2">Type at least 2 characters to search</p>
                )}
              </div>

              {/* Search Results */}
              {sheetSearchQuery.length >= 2 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    {isSearching ? 'Searching...' : `Results (${searchResults.length})`}
                  </h3>
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                      {searchResults.map((person) => {
                        const status = getRelationshipStatus(person.id);
                        const isPending = processingIds.has(person.id);
                        
                        return (
                          <div key={person.id} className="flex items-center gap-4 p-3 rounded-xl bg-card">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={person.photo} alt={person.name} />
                              <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{person.name}</p>
                              {person.bio && (
                                <p className="text-xs text-muted-foreground truncate">{person.bio}</p>
                              )}
                            </div>
                            {status === 'friend' ? (
                              <span className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                                Friends
                              </span>
                            ) : status === 'pending_sent' ? (
                              <span className="px-3 py-1.5 text-xs font-medium rounded-lg bg-muted text-muted-foreground">
                                Pending
                              </span>
                            ) : status === 'pending_received' ? (
                              <Button
                                size="sm"
                                onClick={() => {
                                  const request = receivedRequests.find(r => r.senderId === person.id);
                                  if (request) handleAcceptRequest(request.id, person.name);
                                }}
                                disabled={isPending}
                              >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accept'}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleSendRequest(person.id, person.name)}
                                disabled={isPending}
                              >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No users found</p>
                  )}
                </div>
              )}

              {/* Quick Actions */}
              {sheetSearchQuery.length < 2 && (
                <div className="space-y-3">
                  <button className="w-full bg-card rounded-xl p-4 flex items-center gap-4 hover:bg-accent transition-all border border-border">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <QrCode className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Scan QR Code</p>
                      <p className="text-sm text-muted-foreground">Scan a friend's QR code to connect</p>
                    </div>
                  </button>
                  
                  <button className="w-full bg-card rounded-xl p-4 flex items-center gap-4 hover:bg-accent transition-all border border-border">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Share2 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Share Invite Link</p>
                      <p className="text-sm text-muted-foreground">Invite friends to join AMPZ</p>
                    </div>
                  </button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-card rounded-xl mb-6">
          <button
            onClick={() => setMode('friends')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              mode === 'friends' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4 inline-block mr-2" />
            Friends ({friends.length})
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
            Matches
          </button>
          <button
            onClick={() => setMode('requests')}
            className={`relative flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              mode === 'requests' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserCheck className="w-4 h-4 inline-block mr-2" />
            Requests
            {pendingRequestsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
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

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Friends List */}
            {mode === 'friends' && (
              <div className="space-y-3">
                {filteredFriends.length > 0 ? (
                  filteredFriends.map((friend) => (
                    <div key={friend.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="w-14 h-14">
                          <AvatarImage src={friend.friendPhoto} alt={friend.friendName} />
                          <AvatarFallback>{friend.friendName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{friend.friendName}</h3>
                          <Check className="w-4 h-4 text-green-500" />
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          Friends since {new Date(friend.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mx-auto mb-4">
                      <Users className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No Friends Yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Add friends to see them here
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Connections/Matches List */}
            {mode === 'connections' && (
              <div className="space-y-3">
                {filteredConnections.length > 0 ? (
                  filteredConnections.map((connection) => (
                    <div key={connection.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="w-14 h-14">
                          <AvatarImage src={connection.photo} alt={connection.name} />
                          <AvatarFallback>{connection.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {connection.online && (
                          <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
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
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          // Check if already friends
                          const status = getRelationshipStatus(connection.id);
                          if (status === 'none') {
                            handleSendRequest(connection.id, connection.name);
                          }
                        }}
                        disabled={getRelationshipStatus(connection.id) !== 'none' || processingIds.has(connection.id)}
                      >
                        {getRelationshipStatus(connection.id) === 'friend' ? 'Friends' : 
                         getRelationshipStatus(connection.id) === 'pending_sent' ? 'Pending' : 
                         processingIds.has(connection.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Friend'}
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mx-auto mb-4">
                      <UserPlus className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No Matches Yet</h3>
                    <p className="text-muted-foreground text-sm">
                      Check in at events to meet new people!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Requests List */}
            {mode === 'requests' && (
              <div className="space-y-6">
                {/* Received Requests */}
                {receivedRequests.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Received ({receivedRequests.length})
                    </h3>
                    <div className="space-y-3">
                      {receivedRequests.map((request) => (
                        <div key={request.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                          <Avatar className="w-14 h-14">
                            <AvatarImage src={request.senderProfile?.photo} alt={request.senderProfile?.name} />
                            <AvatarFallback>{request.senderProfile?.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold">{request.senderProfile?.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAcceptRequest(request.id, request.senderProfile?.name || '')}
                              disabled={processingIds.has(request.id)}
                            >
                              {processingIds.has(request.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accept'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeclineRequest(request.id)}
                              disabled={processingIds.has(request.id)}
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sent Requests */}
                {sentRequests.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Sent ({sentRequests.length})
                    </h3>
                    <div className="space-y-3">
                      {sentRequests.map((request) => (
                        <div key={request.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                          <Avatar className="w-14 h-14">
                            <AvatarImage src={request.receiverProfile?.photo} alt={request.receiverProfile?.name} />
                            <AvatarFallback>{request.receiverProfile?.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold">{request.receiverProfile?.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              Pending • {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelRequest(request.id)}
                            disabled={processingIds.has(request.id)}
                          >
                            {processingIds.has(request.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {receivedRequests.length === 0 && sentRequests.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mx-auto mb-4">
                      <UserCheck className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No Pending Requests</h3>
                    <p className="text-muted-foreground text-sm">
                      Friend requests will appear here
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
