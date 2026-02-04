import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Users, UserPlus, QrCode, Share2, Check, Clock, X, Loader2, UserCheck, Sparkles, UserCog } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useFriends } from '@/hooks/useFriends';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Connection {
  id: string;
  name: string;
  photo: string;
  eventContext: string;
  timestamp: string;
  online: boolean;
}

export default function Social() {
  const { matches, user } = useApp();
  const { toast } = useToast();
  const { 
    friends, 
    receivedRequests, 
    sentRequests, 
    suggestedUsers,
    isLoading, 
    sendFriendRequest, 
    acceptFriendRequest, 
    declineFriendRequest,
    cancelFriendRequest,
    searchUsers,
    getRelationshipStatus
  } = useFriends(user?.id);
  
  const [mode, setMode] = useState<'friends' | 'connections' | 'requests'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [sheetSearchQuery, setSheetSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Debounced search in add friends sheet
  useEffect(() => {
    if (sheetSearchQuery.length === 0) {
      setSearchResults(suggestedUsers);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsers(sheetSearchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching users:', error);
        toast({
          title: 'Search failed',
          description: 'Unable to search for users. Please try again.',
          variant: 'destructive'
        });
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500); // Increased debounce time for better UX

    return () => clearTimeout(timer);
  }, [sheetSearchQuery, searchUsers, suggestedUsers, toast]);

  // Initialize search results with suggested users
  useEffect(() => {
    if (suggestedUsers.length > 0 && searchResults.length === 0 && sheetSearchQuery === '') {
      setSearchResults(suggestedUsers);
    }
  }, [suggestedUsers, searchResults.length, sheetSearchQuery]);

  const handleSendRequest = async (userId: string, name: string) => {
    if (processingIds.has(userId)) return;
    
    setProcessingIds(prev => new Set(prev).add(userId));
    const success = await sendFriendRequest(userId);
    setProcessingIds(prev => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
    
    if (!success) {
      // Error toast is already shown in sendFriendRequest
      return;
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
    
    if (!success) {
      // Error toast is already shown in acceptFriendRequest
      return;
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
  };

  const connections = useMemo(() => 
    matches.map(m => ({
      id: m.id,
      name: m.matchProfile.name,
      photo: m.matchProfile.photo,
      eventContext: m.eventName,
      timestamp: m.timestamp,
      online: m.online,
    })), 
  [matches]);

  // Filter friends by search
  const filteredFriends = friends.filter(f => 
    f.friendName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter connections by search
  const filteredConnections = connections.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingRequestsCount = receivedRequests.length;

  // Quick Add suggestions with mutual connections
  const QuickAddUser = ({ person }: { person: any }) => {
    const status = getRelationshipStatus(person.id);
    const isPending = processingIds.has(person.id);
    
    return (
      <div key={person.id} className="flex items-center gap-4 p-4 rounded-xl bg-card hover:bg-accent transition-all border border-border">
        <Avatar className="w-14 h-14">
          <AvatarImage src={person.photo} alt={person.name} />
          <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold truncate">{person.name}</p>
            {person.mutualConnections > 0 && (
              <Badge variant="outline" className="text-xs">
                {person.mutualConnections} mutual
              </Badge>
            )}
          </div>
          {person.bio && (
            <p className="text-sm text-muted-foreground truncate">{person.bio}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {person.mutualConnections > 0 && (
              <span className="text-xs text-primary flex items-center gap-1">
                <Users className="w-3 h-3" />
                {person.mutualConnections} mutual friend{person.mutualConnections !== 1 ? 's' : ''}
              </span>
            )}
            {person.sharedEvents > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Check className="w-3 h-3" />
                {person.sharedEvents} shared event{person.sharedEvents !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          {status === 'friend' ? (
            <span className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
              Friends
            </span>
          ) : status === 'pending_sent' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const request = sentRequests.find(r => r.receiverId === person.id);
                if (request) handleCancelRequest(request.id);
              }}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Pending'}
            </Button>
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
      </div>
    );
  };

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
                <SheetTitle className="text-xl flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Quick Add
                </SheetTitle>
              </SheetHeader>
              
              {/* Search Input */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by name, bio, or email..."
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

              <Tabs defaultValue="suggested" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="suggested">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Suggested
                  </TabsTrigger>
                  <TabsTrigger value="mutual">
                    <UserCog className="w-4 h-4 mr-2" />
                    Mutual
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="suggested" className="space-y-4">
                  {/* Quick Add Section */}
                  {sheetSearchQuery.length >= 2 ? (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                        {isSearching ? 'Searching...' : `Search Results (${searchResults.length})`}
                      </h3>
                      {isSearching ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                          {searchResults.map((person) => (
                            <QuickAddUser key={person.id} person={person} />
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No users found</p>
                      )}
                    </div>
                  ) : (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                        Suggested For You
                      </h3>
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                          {searchResults.slice(0, 10).map((person) => (
                            <QuickAddUser key={person.id} person={person} />
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No suggestions available. Try searching for users.
                        </p>
                      )}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="mutual" className="space-y-4">
                  {/* Mutual Friends Section */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                      People with Mutual Connections
                    </h3>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : searchResults.filter(p => p.mutualConnections > 0).length > 0 ? (
                      <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                        {searchResults
                          .filter(person => person.mutualConnections > 0)
                          .sort((a, b) => b.mutualConnections - a.mutualConnections)
                          .slice(0, 10)
                          .map((person) => (
                            <QuickAddUser key={person.id} person={person} />
                          ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No mutual connections found
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Quick Actions */}
              {sheetSearchQuery.length < 2 && (
                <div className="space-y-3 mt-6">
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
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Friends
                        </Button>
                      </SheetTrigger>
                    </Sheet>
                  </div>
                )}
              </div>
            )}

            {/* Connections/Matches List */}
            {mode === 'connections' && (
              <div className="space-y-3">
                {filteredConnections.length > 0 ? (
                  filteredConnections.map((connection) => {
                    const status = getRelationshipStatus(connection.id);
                    const isPending = processingIds.has(connection.id);
                    
                    return (
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
                            if (status === 'none') {
                              handleSendRequest(connection.id, connection.name);
                            }
                          }}
                          disabled={status !== 'none' || isPending}
                        >
                          {status === 'friend' ? 'Friends' : 
                           status === 'pending_sent' ? 'Pending' : 
                           isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Friend'}
                        </Button>
                      </div>
                    );
                  })
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
