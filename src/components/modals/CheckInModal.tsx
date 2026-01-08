import { useState, useRef, useEffect } from 'react';
import { X, Camera, QrCode, Keyboard, Users, UserX, Check, RotateCcw } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Design Constants
const DESIGN = {
  colors: {
    primary: '#C4B5FD',
    lavenderLight: '#E9D5FF',
    accentPink: '#FFB8E6',
    background: '#1A1A1A',
    card: '#2D2D2D',
    textPrimary: '#FFFFFF',
    textSecondary: '#B8B8B8',
    brandGreen: '#10B981'
  },
  borderRadius: {
    card: '24px',
    inner: '20px',
    button: '12px',
    round: '50%',
    small: '8px'
  },
  shadows: {
    card: '0 8px 32px rgba(0, 0, 0, 0.4)',
    button: '0 4px 16px rgba(0, 0, 0, 0.3)',
    glowPurple: '0 4px 32px rgba(196, 181, 253, 0.4)'
  }
};

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'scan' | 'code' | 'privacy' | 'photo' | 'preview' | 'success';

export function CheckInModal({ isOpen, onClose }: CheckInModalProps) {
  const navigate = useNavigate();
  const { events, user, checkInToEvent, addNotification } = useApp();
  const [step, setStep] = useState<Step>('scan');
  const [eventCode, setEventCode] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState<boolean | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('scan');
      setEventCode('');
      setSelectedEvent(null);
      setIsPublic(null);
      setCapturedPhoto(null);
    }
  }, [isOpen]);

  const startCamera = async (facingMode: 'user' | 'environment' = 'environment') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (step === 'scan') {
      startCamera('environment');
    } else if (step === 'photo') {
      startCamera('user');
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [step]);

  const handleSimulateScan = () => {
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    setSelectedEvent(randomEvent.id);
    setStep('privacy');
  };

  const handleCodeSubmit = () => {
    const event = events.find(e => e.qrCode.toLowerCase() === eventCode.toLowerCase());
    if (event) {
      setSelectedEvent(event.id);
      setStep('privacy');
    }
  };

  const handlePrivacyChoice = (choice: boolean) => {
    setIsPublic(choice);
    if (choice) {
      setStep('photo');
    } else {
      completeCheckIn();
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(dataUrl);
        setStep('preview');
      }
    }
  };

  const completeCheckIn = () => {
    if (!selectedEvent || !user) return;
    
    checkInToEvent(selectedEvent, isPublic ?? false, capturedPhoto ?? undefined);
    
    const event = events.find(e => e.id === selectedEvent);
    addNotification({
      type: 'event',
      title: 'Checked In!',
      message: `Welcome to ${event?.name}`,
      data: { eventId: selectedEvent },
    });
    
    setStep('success');
  };

  const handleClose = () => {
    stopCamera();
    onClose();
    if (step === 'success') {
      navigate('/connect');
    }
  };

  if (!isOpen) return null;

  const event = selectedEvent ? events.find(e => e.id === selectedEvent) : null;

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: DESIGN.colors.background }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 flex-shrink-0"
        style={{ 
          borderBottom: `1px solid ${DESIGN.colors.card}`,
          height: '72px'
        }}
      >
        <h2 
          className="text-[20px] font-bold"
          style={{ color: DESIGN.colors.textPrimary }}
        >
          {step === 'scan' && 'Scan QR Code'}
          {step === 'code' && 'Enter Code'}
          {step === 'privacy' && 'Privacy Choice'}
          {step === 'photo' && 'Take Photo'}
          {step === 'preview' && 'Preview Card'}
          {step === 'success' && 'Checked In!'}
        </h2>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center"
          style={{
            background: DESIGN.colors.card,
            borderRadius: DESIGN.borderRadius.round,
            color: DESIGN.colors.textPrimary
          }}
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* QR Scanner */}
        {step === 'scan' && (
          <div className="flex-1 flex flex-col items-center justify-center p-5">
            <div className="relative w-64 h-64 mb-6">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                style={{ borderRadius: DESIGN.borderRadius.card }}
              />
              {/* QR Frame Overlay */}
              <div 
                className="absolute inset-0 border-2"
                style={{ 
                  borderColor: DESIGN.colors.primary,
                  borderRadius: DESIGN.borderRadius.card
                }}
              >
                <div 
                  className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4"
                  style={{ 
                    borderColor: DESIGN.colors.primary,
                    borderTopLeftRadius: '16px'
                  }}
                />
                <div 
                  className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4"
                  style={{ 
                    borderColor: DESIGN.colors.primary,
                    borderTopRightRadius: '16px'
                  }}
                />
                <div 
                  className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4"
                  style={{ 
                    borderColor: DESIGN.colors.primary,
                    borderBottomLeftRadius: '16px'
                  }}
                />
                <div 
                  className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4"
                  style={{ 
                    borderColor: DESIGN.colors.primary,
                    borderBottomRightRadius: '16px'
                  }}
                />
              </div>
              <div 
                className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold"
                style={{
                  background: DESIGN.colors.primary,
                  color: DESIGN.colors.background,
                  borderRadius: '12px'
                }}
              >
                SCAN QR
              </div>
            </div>
            
            <p 
              className="text-center mb-6"
              style={{ color: DESIGN.colors.textSecondary }}
            >
              Point your camera at the event's QR code
            </p>

            <div className="flex gap-3 w-full max-w-xs">
              <Button
                variant="outline"
                className="flex-1 h-12"
                style={{ borderRadius: DESIGN.borderRadius.button }}
                onClick={() => setStep('code')}
              >
                <Keyboard className="w-4 h-4 mr-2" />
                Enter Code
              </Button>
              <Button
                className="flex-1 h-12"
                style={{ 
                  background: DESIGN.colors.primary,
                  color: DESIGN.colors.background,
                  borderRadius: DESIGN.borderRadius.button
                }}
                onClick={handleSimulateScan}
              >
                <QrCode className="w-4 h-4 mr-2" />
                Simulate
              </Button>
            </div>
          </div>
        )}

        {/* Manual Code Entry */}
        {step === 'code' && (
          <div className="flex-1 flex flex-col items-center justify-center p-5">
            <QrCode 
              className="w-16 h-16 mb-6" 
              style={{ color: DESIGN.colors.primary }}
            />
            <h3 
              className="text-[22px] font-bold mb-2"
              style={{ color: DESIGN.colors.textPrimary }}
            >
              Enter Event Code
            </h3>
            <p 
              className="text-center mb-6"
              style={{ color: DESIGN.colors.textSecondary }}
            >
              Ask the event organizer for the check-in code
            </p>
            
            <Input
              value={eventCode}
              onChange={(e) => setEventCode(e.target.value.toUpperCase())}
              placeholder="Enter code..."
              className="text-center text-2xl font-bold tracking-widest h-14 max-w-xs mb-6"
              style={{ borderRadius: DESIGN.borderRadius.button }}
            />

            <div className="flex gap-3 w-full max-w-xs">
              <Button
                variant="outline"
                className="flex-1 h-12"
                style={{ borderRadius: DESIGN.borderRadius.button }}
                onClick={() => setStep('scan')}
              >
                Back
              </Button>
              <Button
                className="flex-1 h-12"
                style={{ 
                  background: DESIGN.colors.primary,
                  color: DESIGN.colors.background,
                  borderRadius: DESIGN.borderRadius.button
                }}
                onClick={handleCodeSubmit}
                disabled={!eventCode}
              >
                Submit
              </Button>
            </div>
          </div>
        )}

        {/* Privacy Choice */}
        {step === 'privacy' && event && (
          <div className="flex-1 flex flex-col p-5">
            <div className="text-center mb-8">
              <h3 
                className="text-[22px] font-bold mb-2"
                style={{ color: DESIGN.colors.textPrimary }}
              >
                Joining {event.name}
              </h3>
              <p style={{ color: DESIGN.colors.textSecondary }}>
                How do you want to appear at this event?
              </p>
            </div>

            <div className="space-y-4 flex-1">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePrivacyChoice(true)}
                className="w-full p-6 text-left group"
                style={{
                  background: DESIGN.colors.card,
                  borderRadius: DESIGN.borderRadius.card,
                  border: `2px solid ${DESIGN.colors.card}`
                }}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div 
                    className="w-12 h-12 flex items-center justify-center"
                    style={{
                      background: `${DESIGN.colors.primary}20`,
                      borderRadius: DESIGN.borderRadius.small
                    }}
                  >
                    <Users className="w-6 h-6" style={{ color: DESIGN.colors.primary }} />
                  </div>
                  <div>
                    <h4 
                      className="font-bold text-lg"
                      style={{ color: DESIGN.colors.textPrimary }}
                    >
                      Public
                    </h4>
                    <p 
                      className="text-sm"
                      style={{ color: DESIGN.colors.brandGreen }}
                    >
                      Best for networking
                    </p>
                  </div>
                </div>
                <p 
                  className="text-sm"
                  style={{ color: DESIGN.colors.textSecondary }}
                >
                  Others can see your profile and photo. Connect with people at the event!
                </p>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePrivacyChoice(false)}
                className="w-full p-6 text-left group"
                style={{
                  background: DESIGN.colors.card,
                  borderRadius: DESIGN.borderRadius.card,
                  border: `2px solid ${DESIGN.colors.card}`
                }}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div 
                    className="w-12 h-12 flex items-center justify-center"
                    style={{
                      background: `${DESIGN.colors.textSecondary}20`,
                      borderRadius: DESIGN.borderRadius.small
                    }}
                  >
                    <UserX className="w-6 h-6" style={{ color: DESIGN.colors.textSecondary }} />
                  </div>
                  <div>
                    <h4 
                      className="font-bold text-lg"
                      style={{ color: DESIGN.colors.textPrimary }}
                    >
                      Private
                    </h4>
                    <p 
                      className="text-sm"
                      style={{ color: DESIGN.colors.textSecondary }}
                    >
                      Browse anonymously
                    </p>
                  </div>
                </div>
                <p 
                  className="text-sm"
                  style={{ color: DESIGN.colors.textSecondary }}
                >
                  You can see others but they won't see you. Perfect for shy attendees.
                </p>
              </motion.button>
            </div>

            <Button 
              variant="outline" 
              onClick={onClose} 
              className="mt-4 h-12"
              style={{ borderRadius: DESIGN.borderRadius.button }}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Photo Capture */}
        {step === 'photo' && (
          <div className="flex-1 flex flex-col items-center justify-center p-5">
            <div className="relative w-64 h-80 mb-6">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                style={{ 
                  borderRadius: DESIGN.borderRadius.card,
                  transform: 'scaleX(-1)' 
                }}
              />
              <div 
                className="absolute inset-0 border-4"
                style={{ 
                  borderColor: `${DESIGN.colors.primary}80`,
                  borderRadius: DESIGN.borderRadius.card
                }}
              />
              <div 
                className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold"
                style={{
                  background: DESIGN.colors.brandGreen,
                  color: DESIGN.colors.background,
                  borderRadius: '12px'
                }}
              >
                LIVE PHOTO
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
            
            <p 
              className="text-center mb-6"
              style={{ color: DESIGN.colors.textSecondary }}
            >
              This photo will be shown to other attendees
            </p>

            <div className="flex gap-4">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep('privacy')}
                className="w-14 h-14 flex items-center justify-center"
                style={{
                  background: DESIGN.colors.card,
                  color: DESIGN.colors.textPrimary,
                  borderRadius: DESIGN.borderRadius.round
                }}
              >
                <X className="w-6 h-6" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={capturePhoto}
                className="w-20 h-20 flex items-center justify-center"
                style={{
                  background: DESIGN.colors.primary,
                  color: DESIGN.colors.background,
                  borderRadius: DESIGN.borderRadius.round,
                  boxShadow: DESIGN.shadows.glowPurple
                }}
              >
                <Camera className="w-8 h-8" />
              </motion.button>
            </div>
          </div>
        )}

        {/* Preview Card */}
        {step === 'preview' && user && (
          <div className="flex-1 flex flex-col items-center justify-center p-5">
            <h3 
              className="text-[15px] font-medium mb-4"
              style={{ color: DESIGN.colors.textSecondary }}
            >
              This is how others will see you
            </h3>

            {/* Preview Card */}
            <div 
              className="w-64 aspect-[3/4] mb-6 relative"
              style={{
                background: DESIGN.colors.card,
                borderRadius: DESIGN.borderRadius.card,
                border: `1px solid ${DESIGN.colors.textSecondary}20`,
                boxShadow: DESIGN.shadows.card
              }}
            >
              {capturedPhoto && (
                <img
                  src={capturedPhoto}
                  alt="Your photo"
                  className="w-full h-3/4 object-cover"
                  style={{ 
                    borderTopLeftRadius: DESIGN.borderRadius.card,
                    borderTopRightRadius: DESIGN.borderRadius.card,
                    transform: 'scaleX(-1)' 
                  }}
                />
              )}
              <div 
                className="absolute bottom-0 left-0 right-0 p-4"
                style={{
                  background: 'linear-gradient(to top, #1A1A1A, #1A1A1A80, transparent)',
                  borderBottomLeftRadius: DESIGN.borderRadius.card,
                  borderBottomRightRadius: DESIGN.borderRadius.card
                }}
              >
                <h4 
                  className="font-bold text-lg mb-1"
                  style={{ color: DESIGN.colors.textPrimary }}
                >
                  {user.profile.name}, {user.profile.age}
                </h4>
                <p 
                  className="text-sm truncate mb-2"
                  style={{ color: DESIGN.colors.textSecondary }}
                >
                  {user.profile.bio || 'No bio yet'}
                </p>
                <div className="flex flex-wrap gap-1">
                  {user.profile.interests.slice(0, 3).map((interest) => (
                    <span 
                      key={interest} 
                      className="px-2 py-0.5 text-xs"
                      style={{
                        background: `${DESIGN.colors.primary}20`,
                        color: DESIGN.colors.primary,
                        borderRadius: '8px'
                      }}
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 w-full max-w-xs">
              <Button
                variant="outline"
                className="flex-1 h-12"
                style={{ borderRadius: DESIGN.borderRadius.button }}
                onClick={() => setStep('photo')}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake
              </Button>
              <Button
                className="flex-1 h-12"
                style={{ 
                  background: DESIGN.colors.primary,
                  color: DESIGN.colors.background,
                  borderRadius: DESIGN.borderRadius.button,
                  boxShadow: DESIGN.shadows.glowPurple
                }}
                onClick={completeCheckIn}
              >
                <Check className="w-4 h-4 mr-2" />
                Looks Good!
              </Button>
            </div>
          </div>
        )}

        {/* Success */}
        {step === 'success' && event && (
          <div className="flex-1 flex flex-col items-center justify-center p-5 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-24 h-24 flex items-center justify-center mb-6"
              style={{
                background: `${DESIGN.colors.brandGreen}20`,
                borderRadius: DESIGN.borderRadius.round
              }}
            >
              <Check className="w-12 h-12" style={{ color: DESIGN.colors.brandGreen }} />
            </motion.div>
            <h3 
              className="text-[28px] font-bold mb-2"
              style={{ color: DESIGN.colors.textPrimary }}
            >
              Welcome!
            </h3>
            <p 
              className="mb-2"
              style={{ color: DESIGN.colors.textSecondary }}
            >
              You're checked in to
            </p>
            <h4 
              className="text-[22px] font-bold mb-8"
              style={{ color: DESIGN.colors.primary }}
            >
              {event.name}
            </h4>
            
            <Button
              className="w-full max-w-xs h-12"
              style={{ 
                background: DESIGN.colors.primary,
                color: DESIGN.colors.background,
                borderRadius: DESIGN.borderRadius.button,
                boxShadow: DESIGN.shadows.glowPurple
              }}
              onClick={handleClose}
            >
              Start Connecting
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
