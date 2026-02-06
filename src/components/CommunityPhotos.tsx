import { useState, useRef } from 'react';
import { Camera, Plus, Heart, X, ChevronLeft, ChevronRight, Lock, Loader2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { CommunityPhoto } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface CommunityPhotosProps {
  eventId: string;
  photos: CommunityPhoto[];
}

export function CommunityPhotos({ eventId, photos }: CommunityPhotosProps) {
  const { user, addCommunityPhoto, likePhoto } = useApp();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const isPaidUser = user?.subscription.tier === 'pro' || user?.subscription.tier === 'max';

  const handleAddPhoto = () => {
    if (!isPaidUser) {
      setShowUpgradePrompt(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max file size is 10MB', variant: 'destructive' });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${eventId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('community-photos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('community-photos').getPublicUrl(fileName);
      addCommunityPhoto(eventId, publicUrl);
      toast({ title: 'Photo uploaded!', description: 'Your photo has been added to the community dump' });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', description: error.message || 'Failed to upload photo', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openViewer = (index: number) => { setCurrentPhotoIndex(index); setViewerOpen(true); };
  const navigatePhoto = (direction: 'prev' | 'next') => {
    setCurrentPhotoIndex(prev => direction === 'prev' ? (prev === 0 ? photos.length - 1 : prev - 1) : (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const currentPhoto = photos[currentPhotoIndex];
  const displayPhotos = photos.slice(0, 6);
  const remainingCount = photos.length - 6;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Community Photos</h2>
        <button onClick={handleAddPhoto} disabled={isUploading} className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary text-sm font-medium rounded-full hover:bg-primary/30 transition-colors disabled:opacity-50">
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {isUploading ? 'Uploading...' : 'Add Photos'}
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {photos.length === 0 ? (
        <div className="bg-card p-8 text-center rounded-3xl shadow-lg">
          <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No photos yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {displayPhotos.map((photo, index) => (
            <button key={photo.id} onClick={() => openViewer(index)} className="aspect-square rounded-xl overflow-hidden relative group">
              <img src={photo.imageUrl} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">AMPZ</div>
            </button>
          ))}
          {remainingCount > 0 && (
            <button onClick={() => openViewer(6)} className="aspect-square rounded-xl bg-card/80 flex items-center justify-center text-lg font-bold text-muted-foreground hover:text-foreground transition-colors">
              +{remainingCount} more
            </button>
          )}
        </div>
      )}

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="bg-black/95 border-none max-w-[95vw] max-h-[95vh] p-0 rounded-none">
          {currentPhoto && (
            <div className="relative flex flex-col items-center justify-center min-h-[60vh] p-4">
              <button onClick={() => setViewerOpen(false)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10">
                <X className="w-5 h-5 text-white" />
              </button>
              {photos.length > 1 && (
                <>
                  <button onClick={() => navigatePhoto('prev')} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                  <button onClick={() => navigatePhoto('next')} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                </>
              )}
              <img src={currentPhoto.imageUrl} alt="" className="max-w-full max-h-[70vh] object-contain rounded-xl" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={currentPhoto.userPhoto || '/default-avatar.png'} alt="" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-medium text-sm text-white">{currentPhoto.userName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(currentPhoto.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
                <button onClick={() => likePhoto(currentPhoto.id)} className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                  <Heart className={`w-5 h-5 ${currentPhoto.isLiked ? 'fill-pink-400 text-pink-400' : 'text-white'}`} />
                  <span className="text-sm font-medium text-white">{currentPhoto.likes}</span>
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showUpgradePrompt} onOpenChange={setShowUpgradePrompt}>
        <DialogContent className="bg-background border border-border max-w-[350px] text-center rounded-3xl p-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Pro Feature</h2>
          <p className="text-muted-foreground text-sm mb-6">Upgrade to Pro to share photos with the community and see who's at events!</p>
          <button onClick={() => setShowUpgradePrompt(false)} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors">
            Upgrade to Pro
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
