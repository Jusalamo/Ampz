import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, QrCode, Keyboard, Loader2, MapPin, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCheckIn } from '@/hooks/useCheckIn';
import { Event } from '@/lib/types';
import { cn } from '@/lib/utils';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onCheckInSuccess?: (eventId: string) => void;
}

type ScannerStep = 'scan' | 'code' | 'verifying' | 'geofence' | 'success' | 'error';

export function QRScannerModal({ isOpen, onClose, userId, onCheckInSuccess }: QRScannerModalProps) {
  const navigate = useNavigate();
  const { validateQRCode, checkIn, isLoading, getUserLocation } = useCheckIn(userId);
  
  const [step, setStep] = useState<ScannerStep>('scan');
  const [manualCode, setManualCode] = useState('');
  const [scannedEvent, setScannedEvent] = useState<Event | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('scan');
      setManualCode('');
      setScannedEvent(null);
      setErrorMessage('');
      setSuccessMessage('');
      setDistance(null);
    }
  }, [isOpen]);

  // Start camera for QR scanning
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setErrorMessage('Unable to access camera. Please use manual code entry.');
      setStep('code');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);

  // Start/stop camera based on step
  useEffect(() => {
    if (isOpen && step === 'scan') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isOpen, step, startCamera, stopCamera]);

  // Handle manual code submission
  const handleCodeSubmit = async () => {
    if (!manualCode.trim()) return;

    setStep('verifying');
    
    const result = await validateQRCode(manualCode.trim().toUpperCase());
    
    if (!result.valid || !result.event) {
      setErrorMessage(result.error || 'Invalid code');
      setStep('error');
      return;
    }

    setScannedEvent(result.event);
    await performGeofenceCheck(result.event);
  };

  // Perform geofence check
  const performGeofenceCheck = async (event: Event) => {
    setStep('geofence');
    
    try {
      const location = await getUserLocation();
      
      // Calculate distance
      const R = 6371e3;
      const φ1 = (location.latitude * Math.PI) / 180;
      const φ2 = (event.coordinates.lat * Math.PI) / 180;
      const Δφ = ((event.coordinates.lat - location.latitude) * Math.PI) / 180;
      const Δλ = ((event.coordinates.lng - location.longitude) * Math.PI) / 180;
      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceMeters = R * c;
      
      setDistance(Math.round(distanceMeters));

      if (distanceMeters <= event.geofenceRadius) {
        // Within geofence - proceed with check-in
        const checkInResult = await checkIn(event, 'public');
        
        if (checkInResult.success) {
          setSuccessMessage(`Welcome to ${event.name}!`);
          setStep('success');
          onCheckInSuccess?.(event.id);
        } else {
          setErrorMessage(checkInResult.error || 'Check-in failed');
          setStep('error');
        }
      } else {
        setErrorMessage(
          `You are ${Math.round(distanceMeters)}m away from the event. ` +
          `Please move within ${event.geofenceRadius}m of the venue to check in.`
        );
        setStep('error');
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to verify location');
      setStep('error');
    }
  };

  // Simulate QR scan (for demo purposes - real implementation would use a QR library)
  const handleSimulateScan = async () => {
    // In production, this would be replaced with actual QR code scanning
    setStep('code');
  };

  const handleClose = () => {
    stopCamera();
    onClose();
    
    if (step === 'success' && scannedEvent) {
      navigate(`/event/${scannedEvent.id}`);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">
            {step === 'scan' && 'Scan QR Code'}
            {step === 'code' && 'Enter Event Code'}
            {step === 'verifying' && 'Verifying...'}
            {step === 'geofence' && 'Checking Location'}
            {step === 'success' && 'Check-In Complete!'}
            {step === 'error' && 'Check-In Failed'}
          </h2>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {/* Scanner View */}
          {step === 'scan' && (
            <>
              <div className="relative w-64 h-64 mb-6 rounded-3xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Scanner overlay */}
                <div className="absolute inset-0 border-2 border-primary rounded-3xl">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl" />
                </div>
                <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                  SCAN QR
                </div>
              </div>

              <p className="text-muted-foreground text-center mb-6">
                Point your camera at the event's QR code
              </p>

              <div className="flex gap-3 w-full max-w-xs">
                <Button
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => setStep('code')}
                >
                  <Keyboard className="w-4 h-4 mr-2" />
                  Enter Code
                </Button>
                <Button
                  className="flex-1 h-12"
                  onClick={() => setStep('code')}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Scan
                </Button>
              </div>
            </>
          )}

          {/* Manual Code Entry */}
          {step === 'code' && (
            <>
              <QrCode className="w-16 h-16 text-primary mb-6" />
              <h3 className="text-xl font-bold mb-2">Enter Event Code</h3>
              <p className="text-muted-foreground text-center mb-6">
                Ask the event organizer for the check-in code
              </p>
              
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="Enter code..."
                className="text-center text-2xl font-bold tracking-widest h-14 max-w-xs mb-6"
                maxLength={8}
              />

              <div className="flex gap-3 w-full max-w-xs">
                <Button
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => setStep('scan')}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 h-12"
                  onClick={handleCodeSubmit}
                  disabled={!manualCode.trim() || isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
                </Button>
              </div>
            </>
          )}

          {/* Verifying */}
          {step === 'verifying' && (
            <>
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
              <h3 className="text-xl font-bold mb-2">Verifying Code</h3>
              <p className="text-muted-foreground text-center">
                Please wait while we verify your check-in code...
              </p>
            </>
          )}

          {/* Geofence Check */}
          {step === 'geofence' && (
            <>
              <div className="relative">
                <MapPin className="w-16 h-16 text-primary mb-6" />
                <Loader2 className="absolute -bottom-2 -right-2 w-8 h-8 text-primary animate-spin" />
              </div>
              <h3 className="text-xl font-bold mb-2">Checking Your Location</h3>
              <p className="text-muted-foreground text-center">
                Verifying you're at {scannedEvent?.name}...
              </p>
            </>
          )}

          {/* Success */}
          {step === 'success' && (
            <>
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">{successMessage}</h3>
              <p className="text-muted-foreground text-center mb-6">
                You're now checked in. Enjoy the event!
              </p>
              <Button className="h-12 px-8" onClick={handleClose}>
                Continue to Event
              </Button>
            </>
          )}

          {/* Error */}
          {step === 'error' && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Check-In Failed</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-xs">
                {errorMessage}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="h-12" onClick={() => setStep('code')}>
                  Try Again
                </Button>
                <Button className="h-12" onClick={handleClose}>
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
