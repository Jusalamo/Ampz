import { useState, useRef } from 'react';
import { Camera, Plus, Heart, X, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { CommunityPhoto } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// Design Constants
const DESIGN = {
  colors: {
    primary: '#C4B5FD',
    lavenderLight: '#E9D5FF',
    accentPink: '#FFB8E6',
    background: '#1A1A1A',
    card: '#2D2D2D',
    textPrimary: '#FFFFFF',
    textSecondary: '#B8B8B8'
  },
  borderRadius: {
    card: '24px',
    small: '12px',
    pill: '9999px',
    image: '16px'
  },
  shadows: {
    card: '0 8px 32px rgba(0, 0, 0, 0.4)',
    button: '0 4px 16px rgba(0, 0, 0, 0.3)'
  },
  spacing: {
    default: '16px',
    section: '24px',
    grid: '8px'
  }
};

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
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Max file size is 10MB',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result as string;
      addCommunityPhoto(eventId, imageData);
      toast({
        title: 'Photo uploaded!',
        description: 'Your photo has been added to the community dump',
      });
    };
    reader.readAsDataURL(file);
  };

  const openViewer = (index: number) => {
    setCurrentPhotoIndex(index);
    setViewerOpen(true);
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    } else {
      setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    }
  };

  const currentPhoto = photos[currentPhotoIndex];
  const displayPhotos = photos.slice(0, 6);
  const remainingCount = photos.length - 6;

  return (
    <div className="mb-6" style={{ marginBottom: DESIGN.spacing.section }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4" style={{ marginBottom: DESIGN.spacing.default }}>
        <h2 
          className="text-lg font-bold"
          style={{ 
            color: DESIGN.colors.textPrimary,
            fontSize: '22px',
            fontWeight: 'bold'
          }}
        >
          Community Photos
        </h2>
        <button
          onClick={handleAddPhoto}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: `${DESIGN.colors.primary}33`,
            color: DESIGN.colors.primary,
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: DESIGN.borderRadius.pill,
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = `${DESIGN.colors.primary}4D`}
          onMouseLeave={(e) => e.currentTarget.style.background = `${DESIGN.colors.primary}33`}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          Add Photos
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Empty State */}
      {photos.length === 0 ? (
        <div 
          style={{
            background: DESIGN.colors.card,
            padding: '32px',
            textAlign: 'center',
            borderRadius: DESIGN.borderRadius.card,
            boxShadow: DESIGN.shadows.card
          }}
        >
          <Camera 
            style={{ 
              width: '48px', 
              height: '48px',
              color: DESIGN.colors.textSecondary,
              margin: '0 auto 12px'
            }} 
          />
          <p style={{ color: DESIGN.colors.textSecondary }}>
            No photos yet. Be the first to share!
          </p>
        </div>
      ) : (
        /* Photo Grid */
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: DESIGN.spacing.grid
          }}
        >
          {displayPhotos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => openViewer(index)}
              style={{
                aspectRatio: '1',
                borderRadius: DESIGN.borderRadius.small,
                overflow: 'hidden',
                position: 'relative',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                background: 'transparent'
              }}
              onMouseEnter={(e) => {
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = 'scale(1)';
              }}
            >
              <img
                src={photo.imageUrl}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease'
                }}
              />
              {/* Watermark Badge */}
              <div 
                style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '4px',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: DESIGN.colors.textPrimary,
                  fontSize: '10px',
                  fontWeight: 'bold',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}
              >
                AMPS
              </div>
            </button>
          ))}
          
          {/* "More" Button */}
          {remainingCount > 0 && (
            <button
              onClick={() => openViewer(6)}
              style={{
                aspectRatio: '1',
                borderRadius: DESIGN.borderRadius.small,
                background: `${DESIGN.colors.card}CC`,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                color: DESIGN.colors.textSecondary,
                cursor: 'pointer',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = DESIGN.colors.textPrimary}
              onMouseLeave={(e) => e.currentTarget.style.color = DESIGN.colors.textSecondary}
            >
              +{remainingCount} more
            </button>
          )}
        </div>
      )}

      {/* Photo Viewer Modal */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent 
          style={{
            background: 'rgba(0, 0, 0, 0.95)',
            border: 'none',
            maxWidth: '95vw',
            maxHeight: '95vh',
            padding: 0,
            margin: 0,
            borderRadius: 0
          }}
        >
          {currentPhoto && (
            <div 
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                padding: DESIGN.spacing.default
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setViewerOpen(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  zIndex: 10
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              >
                <X style={{ width: '20px', height: '20px', color: DESIGN.colors.textPrimary }} />
              </button>

              {/* Navigation Buttons */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => navigatePhoto('prev')}
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                  >
                    <ChevronLeft style={{ width: '24px', height: '24px', color: DESIGN.colors.textPrimary }} />
                  </button>
                  <button
                    onClick={() => navigatePhoto('next')}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                  >
                    <ChevronRight style={{ width: '24px', height: '24px', color: DESIGN.colors.textPrimary }} />
                  </button>
                </>
              )}

              {/* Photo */}
              <img
                src={currentPhoto.imageUrl}
                alt=""
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: DESIGN.borderRadius.small
                }}
              />

              {/* Photo Info */}
              <div 
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  right: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                {/* User Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={currentPhoto.userPhoto || 'https://i.pravatar.cc/100'}
                    alt=""
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                  <div>
                    <p 
                      style={{
                        fontWeight: '500',
                        fontSize: '14px',
                        color: DESIGN.colors.textPrimary
                      }}
                    >
                      {currentPhoto.userName}
                    </p>
                    <p 
                      style={{
                        fontSize: '12px',
                        color: DESIGN.colors.textSecondary
                      }}
                    >
                      {new Date(currentPhoto.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Like Button */}
                <button
                  onClick={() => likePhoto(currentPhoto.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: DESIGN.borderRadius.pill,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                >
                  <Heart
                    style={{
                      width: '20px',
                      height: '20px',
                      color: currentPhoto.isLiked ? DESIGN.colors.accentPink : DESIGN.colors.textPrimary,
                      fill: currentPhoto.isLiked ? DESIGN.colors.accentPink : 'none'
                    }}
                  />
                  <span 
                    style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: DESIGN.colors.textPrimary
                    }}
                  >
                    {currentPhoto.likes}
                  </span>
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upgrade Prompt Modal */}
      <Dialog open={showUpgradePrompt} onOpenChange={setShowUpgradePrompt}>
        <DialogContent 
          style={{
            background: DESIGN.colors.background,
            border: `1px solid ${DESIGN.colors.card}`,
            maxWidth: '350px',
            textAlign: 'center',
            borderRadius: DESIGN.borderRadius.card,
            padding: 0
          }}
        >
          <div style={{ padding: '24px' }}>
            {/* Lock Icon */}
            <div 
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: `${DESIGN.colors.primary}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <Lock style={{ width: '32px', height: '32px', color: DESIGN.colors.primary }} />
            </div>
            
            {/* Title */}
            <h2 
              style={{
                fontSize: '22px',
                fontWeight: 'bold',
                color: DESIGN.colors.textPrimary,
                marginBottom: '8px'
              }}
            >
              Pro Feature
            </h2>
            
            {/* Description */}
            <p 
              style={{
                color: DESIGN.colors.textSecondary,
                marginBottom: '24px'
              }}
            >
              Upgrade to Pro or Max to upload photos to the community dump.
            </p>
            
            {/* Upgrade Button */}
            <button
              onClick={() => setShowUpgradePrompt(false)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: DESIGN.borderRadius.small,
                background: DESIGN.colors.primary,
                color: DESIGN.colors.background,
                fontWeight: '600',
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: `0 0 20px ${DESIGN.colors.primary}80`
              }}
            >
              Upgrade Now
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
