import { useState, useEffect } from 'react';
import { X, Shield, Image, MessageCircle, Check, Ban, Eye, EyeOff, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { AmpzButton } from '@/components/ui/ampz-button';
import { AmpzCard } from '@/components/ui/ampz-card';
import { AmpzBadge } from '@/components/ui/ampz-badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ModerationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string;
}

type ContentType = 'photos' | 'comments';
type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'hidden';

interface ModerationItem {
  id: string;
  type: ContentType;
  content: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  status: ModerationStatus;
  createdAt: string;
  eventId: string;
}

export function ModerationPanel({ isOpen, onClose, eventId }: ModerationPanelProps) {
  const { user } = useApp();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ContentType>('photos');
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [hasModeratorRole, setHasModeratorRole] = useState(false);

  // Check if user has moderator/admin role
  useEffect(() => {
    const checkRole = async () => {
      if (!user?.id) {
        setHasModeratorRole(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'moderator']);

      if (error) {
        console.error('Error checking role:', error);
        setHasModeratorRole(false);
        return;
      }

      setHasModeratorRole(data && data.length > 0);
    };

    if (isOpen) {
      checkRole();
    }
  }, [isOpen, user?.id]);

  // Fetch content for moderation
  useEffect(() => {
    const fetchContent = async () => {
      if (!isOpen || !hasModeratorRole) return;
      
      setLoading(true);
      try {
        if (activeTab === 'photos') {
          const query = supabase
            .from('community_photos')
            .select('id, image_url, user_id, moderation_status, created_at, event_id')
            .order('created_at', { ascending: false });

          if (eventId) {
            query.eq('event_id', eventId);
          }

          const { data, error } = await query.limit(50);
          
          if (error) throw error;

          const mappedItems: ModerationItem[] = (data || []).map(item => ({
            id: item.id,
            type: 'photos' as ContentType,
            content: item.image_url,
            userId: item.user_id || '',
            userName: 'User',
            userPhoto: null,
            status: (item.moderation_status || 'pending') as ModerationStatus,
            createdAt: item.created_at || '',
            eventId: item.event_id || ''
          }));

          setItems(mappedItems);
        } else {
          const query = supabase
            .from('community_comments')
            .select('id, content, user_id, moderation_status, created_at, event_id')
            .order('created_at', { ascending: false });

          if (eventId) {
            query.eq('event_id', eventId);
          }

          const { data, error } = await query.limit(50);
          
          if (error) throw error;

          const mappedItems: ModerationItem[] = (data || []).map(item => ({
            id: item.id,
            type: 'comments' as ContentType,
            content: item.content,
            userId: item.user_id || '',
            userName: 'User',
            userPhoto: null,
            status: (item.moderation_status || 'pending') as ModerationStatus,
            createdAt: item.created_at || '',
            eventId: item.event_id || ''
          }));

          setItems(mappedItems);
        }
      } catch (err) {
        console.error('Error fetching moderation content:', err);
        toast({
          title: 'Error',
          description: 'Failed to load content for moderation',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [isOpen, activeTab, eventId, hasModeratorRole, toast]);

  const handleModerate = async (itemId: string, action: ModerationStatus) => {
    if (!user?.id) return;
    
    setActionLoading(itemId);
    try {
      const table = activeTab === 'photos' ? 'community_photos' : 'community_comments';
      
      const { error } = await supabase
        .from(table)
        .update({
          moderation_status: action,
          moderated_at: new Date().toISOString(),
          moderated_by: user.id
        })
        .eq('id', itemId);

      if (error) throw error;

      // Log moderation action
      await supabase.from('content_moderation_actions').insert({
        moderator_id: user.id,
        content_type: activeTab === 'photos' ? 'photo' : 'comment',
        content_id: itemId,
        action: action
      });

      // Update local state
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, status: action } : item
      ));

      toast({
        title: 'Action completed',
        description: `Content ${action}`
      });
    } catch (err) {
      console.error('Moderation error:', err);
      toast({
        title: 'Error',
        description: 'Failed to moderate content',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!user?.id) return;
    
    setActionLoading(itemId);
    try {
      const table = activeTab === 'photos' ? 'community_photos' : 'community_comments';
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Log moderation action
      await supabase.from('content_moderation_actions').insert({
        moderator_id: user.id,
        content_type: activeTab === 'photos' ? 'photo' : 'comment',
        content_id: itemId,
        action: 'delete',
        reason: 'Deleted by moderator'
      });

      // Remove from local state
      setItems(prev => prev.filter(item => item.id !== itemId));

      toast({
        title: 'Deleted',
        description: 'Content has been removed'
      });
    } catch (err) {
      console.error('Delete error:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete content',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: ModerationStatus) => {
    switch (status) {
      case 'approved':
        return <AmpzBadge variant="success" size="sm">Approved</AmpzBadge>;
      case 'rejected':
        return <AmpzBadge variant="destructive" size="sm">Rejected</AmpzBadge>;
      case 'hidden':
        return <AmpzBadge variant="warning" size="sm">Hidden</AmpzBadge>;
      default:
        return <AmpzBadge variant="muted" size="sm">Pending</AmpzBadge>;
    }
  };

  if (!isOpen) return null;

  if (!hasModeratorRole) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <AmpzCard className="w-full max-w-md p-6 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access the moderation panel.
          </p>
          <AmpzButton onClick={onClose}>Close</AmpzButton>
        </AmpzCard>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card rounded-ampz-lg w-full max-w-2xl max-h-[90vh] flex flex-col border border-border/20">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Content Moderation</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 ampz-transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 border-b border-border">
          <button
            onClick={() => setActiveTab('photos')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-ampz-md font-medium ampz-transition',
              activeTab === 'photos'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            <Image className="w-4 h-4" />
            Photos
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-ampz-md font-medium ampz-transition',
              activeTab === 'comments'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            <MessageCircle className="w-4 h-4" />
            Comments
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                {activeTab === 'photos' ? (
                  <Image className="w-8 h-8 text-muted-foreground" />
                ) : (
                  <MessageCircle className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <p className="text-muted-foreground">No {activeTab} to moderate</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <div
                  key={item.id}
                  className="bg-background rounded-ampz-md p-4 border border-border"
                >
                  <div className="flex items-start gap-4">
                    {/* Content Preview */}
                    <div className="flex-shrink-0">
                      {item.type === 'photos' ? (
                        <img
                          src={item.content}
                          alt="Photo"
                          className="w-20 h-20 rounded-ampz-sm object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-ampz-sm bg-muted flex items-center justify-center">
                          <MessageCircle className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(item.status)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {item.type === 'comments' && (
                        <p className="text-sm text-foreground line-clamp-2 mb-2">
                          {item.content}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap">
                        <AmpzButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleModerate(item.id, 'approved')}
                          disabled={actionLoading === item.id}
                          className="text-green-500 hover:text-green-600"
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </AmpzButton>
                        <AmpzButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleModerate(item.id, 'hidden')}
                          disabled={actionLoading === item.id}
                          className="text-yellow-500 hover:text-yellow-600"
                        >
                          <EyeOff className="w-4 h-4" />
                          Hide
                        </AmpzButton>
                        <AmpzButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleModerate(item.id, 'rejected')}
                          disabled={actionLoading === item.id}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Ban className="w-4 h-4" />
                          Reject
                        </AmpzButton>
                        <AmpzButton
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          disabled={actionLoading === item.id}
                        >
                          {actionLoading === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <AlertTriangle className="w-4 h-4" />
                          )}
                          Delete
                        </AmpzButton>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
