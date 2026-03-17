import { useState, useRef, useEffect } from 'react';
import { X, Camera, QrCode, Keyboard, Users, UserX, Check, RotateCcw } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
    if (step === 'scan') startCamera('environment');
    else if (step === 'photo') startCamera('user');
    else stopCamera();
    return () => stopCamera();
  }, [step]);

  const handleSimulateScan = () => {
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    setSelectedEvent(randomEvent.id);
    setStep('privacy');
  };

  const handleCodeSubmit = () => {
    const event = events.find(e => e.qrCode.toLowerCase() === eventCode.toLowerCase());
    if (event) { setSelectedEvent(event.id); setStep('privacy'); }
  };

  const handlePrivacyChoice = (choice: boolean) => {
    setIsPublic(choice);
    if (choice) setStep('photo');
    else completeCheckIn();
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
        setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.8));
        setStep('preview');
      }
    }
  };

  const completeCheckIn = () => {
    if (!selectedEvent || !user) return;
    checkInToEvent(selectedEvent, isPublic ?? false, capturedPhoto ?? undefined);
    const event = events.find(e => e.id === selectedEvent);
    addNotification({ type: 'event', title: 'Checked In!', message: `Welcome to ${event?.name}`, data: { eventId: selectedEvent } });
    setStep('success');
  };

  const handleClose = () => {
    stopCamera();
    onClose();
    if (step === 'success') navigate('/connect');
  };

  if (!isOpen) return null;

  const event = selectedEvent ? events.find(e => e.id === selectedEvent) : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 flex-shrink-0 border-b border-border h-[72px]">
        <h2 className="text-xl font-bold text-foreground">
          {step === 'scan' && 'Scan QR Code'}
          {step === 'code' && 'Enter Code'}
          {step === 'privacy' && 'Privacy Choice'}
          {step === 'photo' && 'Take Photo'}
          {step === 'preview' && 'Preview Card'}
          {step === 'success' && 'Checked In!'}
        </h2>
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-card text-foreground">
          <X className="w-5 h-5" />
        </motion.button>
      </div>

      <div className="flex-1 flex flex-col">
        {/* QR Scanner */}
        {step === 'scan' && (
          <div className="flex-1 flex flex-col items-center justify-center p-5">
            <div className="relative w-64 h-64 mb-6">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover rounded-[24px]" />
              <div className="absolute inset-0 border-2 border-primary rounded-[24px]">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl" />
              </div>
              <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold bg-primary text-primary-foreground rounded-xl">SCAN QR</div>
            </div>
            <p className="text-center mb-6 text-muted-foreground">Point your camera at the event's QR code</p>
            <div className="flex gap-3 w-full max-w-xs">
              <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setStep('code')}><Keyboard className="w-4 h-4 mr-2" />Enter Code</Button>
              <Button className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground" onClick={handleSimulateScan}><QrCode className="w-4 h-4 mr-2" />Simulate</Button>
            </div>
          </div>
        )}

        {/* Code Entry */}
        {step === 'code' && (
          <div className="flex-1 flex flex-col items-center justify-center p-5">
            <QrCode className="w-16 h-16 mb-6 text-primary" />
            <h3 className="text-[22px] font-bold mb-2 text-foreground">Enter Event Code</h3>
            <p className="text-center mb-6 text-muted-foreground">Ask the event organizer for the check-in code</p>
            <Input value={eventCode} onChange={(e) => setEventCode(e.target.value.toUpperCase())} placeholder="Enter code..." className="text-center text-2xl font-bold tracking-widest h-14 max-w-xs mb-6 rounded-xl" />
            <div className="flex gap-3 w-full max-w-xs">
              <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setStep('scan')}>Back</Button>
              <Button className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground" onClick={handleCodeSubmit} disabled={!eventCode}>Submit</Button>
            </div>
          </div>
        )}

        {/* Privacy Choice */}
        {step === 'privacy' && event && (
          <div className="flex-1 flex flex-col p-5">
            <div className="text-center mb-8">
              <h3 className="text-[22px] font-bold mb-2 text-foreground">Joining {event.name}</h3>
              <p className="text-muted-foreground">How do you want to appear at this event?</p>
            </div>
            <div className="space-y-4 flex-1">
              <motion.button whileTap={{ scale: 0.98 }} onClick={() => handlePrivacyChoice(true)} className="w-full p-6 text-left bg-card rounded-[24px] border-2 border-card hover:border-primary transition-colors">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/20"><Users className="w-6 h-6 text-primary" /></div>
                  <div>
                    <h4 className="font-bold text-lg text-foreground">Public</h4>
                    <p className="text-sm text-emerald-500">Best for networking</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Others can see your profile and photo. Connect with people at the event!</p>
              </motion.button>
              <motion.button whileTap={{ scale: 0.98 }} onClick={() => handlePrivacyChoice(false)} className="w-full p-6 text-left bg-card rounded-[24px] border-2 border-card hover:border-muted-foreground transition-colors">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-muted/30"><UserX className="w-6 h-6 text-muted-foreground" /></div>
                  <div>
                    <h4 className="font-bold text-lg text-foreground">Private</h4>
                    <p className="text-sm text-muted-foreground">Browse anonymously</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">You can see others but they won't see you. Perfect for shy attendees.</p>
              </motion.button>
            </div>
            <Button variant="outline" onClick={onClose} className="mt-4 h-12 rounded-xl">Cancel</Button>
          </div>
        )}

        {/* Photo Capture */}
        {step === 'photo' && (
          <div className="flex-1 flex flex-col items-center justify-center p-5">
            <div className="relative w-64 h-80 mb-6">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover rounded-[24px]" style={{ transform: 'scaleX(-1)' }} />
              <div className="absolute inset-0 border-4 border-primary/50 rounded-[24px]" />
              <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold bg-emerald-500 text-white rounded-xl">LIVE PHOTO</div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <p className="text-center mb-6 text-muted-foreground">This photo will be shown to other attendees</p>
            <div className="flex gap-4">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setStep('privacy')} className="w-14 h-14 flex items-center justify-center rounded-full bg-card text-foreground"><X className="w-6 h-6" /></motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={capturePhoto} className="w-20 h-20 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"><Camera className="w-8 h-8" /></motion.button>
            </div>
          </div>
        )}

        {/* Preview */}
        {step === 'preview' && user && (
          <div className="flex-1 flex flex-col items-center justify-center p-5">
            <h3 className="text-[15px] font-medium mb-4 text-muted-foreground">This is how others will see you</h3>
            <div className="w-64 aspect-[3/4] mb-6 relative bg-card rounded-[24px] border border-border shadow-md overflow-hidden">
              {capturedPhoto && (
                <img src={capturedPhoto} alt="Your photo" className="w-full h-3/4 object-cover" style={{ transform: 'scaleX(-1)' }} />
              )}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/80 to-transparent rounded-b-[24px]">
                <h4 className="font-bold text-lg mb-1 text-foreground">{user.profile.name}, {user.profile.age}</h4>
                <p className="text-sm truncate mb-2 text-muted-foreground">{user.profile.bio || 'No bio yet'}</p>
                <div className="flex flex-wrap gap-1">
                  {user.profile.interests.slice(0, 3).map((interest) => (
                    <span key={interest} className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-lg">{interest}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 w-full max-w-xs">
              <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setStep('photo')}><RotateCcw className="w-4 h-4 mr-2" />Retake</Button>
              <Button className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground shadow-md" onClick={completeCheckIn}><Check className="w-4 h-4 mr-2" />Looks Good!</Button>
            </div>
          </div>
        )}

        {/* Success */}
        {step === 'success' && event && (
          <div className="flex-1 flex flex-col items-center justify-center p-5 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="w-24 h-24 flex items-center justify-center mb-6 rounded-full bg-emerald-500/20">
              <Check className="w-12 h-12 text-emerald-500" />
            </motion.div>
            <h3 className="text-[28px] font-bold mb-2 text-foreground">Welcome!</h3>
            <p className="mb-2 text-muted-foreground">You're checked in to</p>
            <h4 className="text-[22px] font-bold mb-8 text-primary">{event.name}</h4>
            <Button className="w-full max-w-xs h-12 rounded-xl bg-primary text-primary-foreground shadow-md" onClick={handleClose}>Start Connecting</Button>
          </div>
        )}
      </div>
    </div>
  );
}
