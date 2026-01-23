import { useState, useRef, useEffect, useCallback } from 'react';
import { X, QrCode, Keyboard, Loader2, MapPin, AlertCircle, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCheckIn } from '@/hooks/useCheckIn';
import { Event } from '@/lib/types';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onCheckInSuccess?: (eventId: string) => void;
}

type ScannerStep = 'scan' | 'code' | 'verifying' | 'geofence' | 'success' | 'error';

export function QRScannerModal({ isOpen, onClose, userId, onCheckInSuccess }: QRScannerModalProps) {
  const navigate = useNavigate();
  const { processQRCodeScan, isLoading } = useCheckIn(userId);
  
  const [step, setStep] = useState<ScannerStep>('scan');
  const [manualCode, setManualCode] = useState('');
  const [scannedEvent, setScannedEvent] = useState<Event | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const isStartingRef = useRef(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('scan');
      setManualCode('');
      setScannedEvent(null);
      setErrorMessage('');
      setSuccessMessage('');
      setDistance(null);
      setDebugInfo('');
    }
  }, [isOpen]);

  // Unified QR code processing function
  const processQRCode = useCallback(async (code: string) => {
    setStep('verifying');
    setDebugInfo(`Processing code: ${code.substring(0, 50)}...`);
    
    try {
      // Use the unified processQRCodeScan method that handles validation, geofence check, and check-in
      const result = await processQRCodeScan(code, 'public');
      
      if (result.success) {
        setSuccessMessage(result.message || 'Check-in successful!');
        setStep('success');
        onCheckInSuccess?.(result.eventId || '');
      } else {
        // Check if the error is specifically about geofence
        if (result.error?.includes('inside the event\'s geofence')) {
          setErrorMessage(result.error);
          setDistance(result.distance || null);
        } else {
          setErrorMessage(result.error || 'Check-in failed');
        }
        setDebugInfo(`Error: ${result.error}`);
        setStep('error');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to process QR code');
      setDebugInfo(`Exception: ${err.message}`);
      setStep('error');
    }
  }, [processQRCodeScan, onCheckInSuccess]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    codeReaderRef.current = null;
    isStartingRef.current = false;
  }, []);

  // Start QR code scanning
  const startScanning = useCallback(async () => {
    if (!videoRef.current) return;
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    
    try {
      codeReaderRef.current = new BrowserMultiFormatReader();

      // Prefer the rear/environment camera when available.
      let preferredDeviceId: string | undefined;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        const env = videoInputs.find((d) => /back|rear|environment/i.test(d.label));
        preferredDeviceId = env?.deviceId || videoInputs[0]?.deviceId;
      } catch {
        // ignore; decoder will pick a default device
      }
      
      controlsRef.current = await codeReaderRef.current.decodeFromVideoDevice(
        preferredDeviceId,
        videoRef.current,
        async (result, error) => {
          if (result) {
            stopScanning();
            const code = result.getText();
            setManualCode(code);
            await processQRCode(code);
          }
        }
      );
    } catch (err) {
      console.error('Camera access error:', err);
      setErrorMessage('Unable to access camera. Please use manual code entry.');
      setStep('code');
    } finally {
      isStartingRef.current = false;
    }
  }, [stopScanning, processQRCode]);

  // Start/stop scanning based on step
  useEffect(() => {
    if (isOpen && step === 'scan') {
      startScanning();
    } else {
      stopScanning();
    }

    return () => stopScanning();
  }, [isOpen, step, startScanning, stopScanning]);

  // Handle manual code submission
  const handleCodeSubmit = async () => {
    if (!manualCode.trim()) return;
    await processQRCode(manualCode);
  };

  const handleClose = () => {
    stopScanning();
    onClose();
    
    if (step === 'success' && scannedEvent) {
      navigate(`/event/${scannedEvent.id}`);
    }
  };

  const handleViewEvent = () => {
    if (scannedEvent) {
      navigate(`/event/${scannedEvent.id}`);
    }
    onClose();
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
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-accent transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
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
                <div className="absolute inset-0 border-2 border-primary rounded-3xl">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl" />
                </div>
                <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                  SCANNING...
                </div>
              </div>
              <p className="text-muted-foreground text-center mb-6">
                Point your camera at the event's QR code
              </p>
              <Button 
                variant="outline" 
                className="h-12"
                onClick={() => setStep('code')}
                disabled={isLoading}
              >
                <Keyboard className="w-4 h-4 mr-2" />
                Enter Code Manually
              </Button>
            </>
          )}

          {step === 'code' && (
            <>
              <QrCode className="w-16 h-16 text-primary mb-6" />
              <h3 className="text-xl font-bold mb-2">Enter Event Code</h3>
              <p className="text-muted-foreground text-center mb-6">
                Ask the event organizer for the check-in code or enter the full event URL
              </p>
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter code or event URL..."
                className="text-center text-lg font-medium h-14 max-w-xs mb-6"
              />
              <div className="flex gap-3 w-full max-w-xs">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12" 
                  onClick={() => setStep('scan')}
                  disabled={isLoading}
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

          {step === 'verifying' && (
            <>
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
              <h3 className="text-xl font-bold mb-2">Verifying Code</h3>
              <p className="text-muted-foreground text-center mb-4">Please wait...</p>
              {debugInfo && (
                <p className="text-xs text-muted-foreground text-center max-w-xs break-all">
                  {debugInfo}
                </p>
              )}
            </>
          )}

          {step === 'geofence' && (
            <>
              <div className="relative">
                <MapPin className="w-16 h-16 text-primary mb-6" />
                <Loader2 className="absolute -bottom-2 -right-2 w-8 h-8 text-primary animate-spin" />
              </div>
              <h3 className="text-xl font-bold mb-2">Checking Your Location</h3>
              <p className="text-muted-foreground text-center">Verifying you're at the event location...</p>
            </>
          )}

          {step === 'success' && (
            <>
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">{successMessage}</h3>
              <p className="text-muted-foreground text-center mb-6">You're now checked in!</p>
              <div className="flex gap-3">
                <Button 
                  className="h-12 px-6" 
                  onClick={handleClose}
                >
                  Close
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12 px-6"
                  onClick={handleViewEvent}
                >
                  <ExternalLink className="w-
