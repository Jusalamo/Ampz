import { useState, useRef, useEffect, useCallback } from 'react';
import { X, QrCode, Keyboard, Loader2, MapPin, Check, AlertCircle } from 'lucide-react';
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

type ScannerStep = 'scan' | 'code' | 'processing' | 'success' | 'error';

export function QRScannerModal({ isOpen, onClose, userId, onCheckInSuccess }: QRScannerModalProps) {
  const navigate = useNavigate();
  const { processQRCodeScan, isLoading } = useCheckIn(userId);
  
  const [step, setStep] = useState<ScannerStep>('scan');
  const [manualCode, setManualCode] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventId, setEventId] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const isScanningRef = useRef(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('scan');
      setManualCode('');
      setResultMessage('');
      setIsSuccess(false);
      setEventName('');
      setEventId('');
      isScanningRef.current = false;
    }
  }, [isOpen]);

  // Process QR code - INSTANT version
  const processQRCode = useCallback(async (code: string) => {
    if (!code.trim()) return;
    
    setStep('processing');
    
    try {
      // Show immediate feedback
      setResultMessage('Checking in...');
      
      const result = await processQRCodeScan(code, 'public');
      
      if (result.success) {
        setResultMessage(result.message || 'Checked in successfully!');
        setEventName(result.message?.replace('Checked in to ', '').replace('!', '') || 'Event');
        setEventId(result.eventId || '');
        setIsSuccess(true);
        setStep('success');
        
        // Call success callback
        if (result.eventId) {
          onCheckInSuccess?.(result.eventId);
        }
        
        // Auto-close after success (like WhatsApp)
        setTimeout(() => {
          if (isSuccess) {
            onClose();
            if (result.eventId) {
              navigate(`/event/${result.eventId}`);
            }
          }
        }, 2000);
      } else {
        setResultMessage(result.error || 'Check-in failed');
        setIsSuccess(false);
        setStep('error');
      }
    } catch (err: any) {
      console.error('QR processing error:', err);
      setResultMessage('Scan failed. Please try again.');
      setIsSuccess(false);
      setStep('error');
    }
  }, [processQRCodeScan, onCheckInSuccess, onClose, navigate, isSuccess]);

  // Start scanning
  const startScanning = useCallback(async () => {
    if (!videoRef.current || isScanningRef.current) return;
    
    isScanningRef.current = true;
    
    try {
      codeReaderRef.current = new BrowserMultiFormatReader();
      
      // Get camera (fast, no device enumeration for speed)
      const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      const rearCamera = videoInputs.find(d => /back|rear|environment/i.test(d.label));
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: rearCamera?.deviceId ? { exact: rearCamera.deviceId } : undefined,
          facingMode: rearCamera ? undefined : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Start decoding
      codeReaderRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, error) => {
          if (result && isScanningRef.current) {
            isScanningRef.current = false;
            stopScanning();
            processQRCode(result.getText());
          }
        }
      );
    } catch (err) {
      console.error('Camera error:', err);
      setStep('code'); // Fallback to manual entry
      isScanningRef.current = false;
    }
  }, [processQRCode]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    isScanningRef.current = false;
  }, []);

  // Handle manual code entry
  const handleCodeSubmit = useCallback(() => {
    if (!manualCode.trim()) return;
    processQRCode(manualCode);
  }, [manualCode, processQRCode]);

  // Handle modal close
  const handleClose = useCallback(() => {
    stopScanning();
    onClose();
    
    // Navigate to event if we checked in
    if (isSuccess && eventId) {
      navigate(`/event/${eventId}`);
    }
  }, [stopScanning, onClose, isSuccess, eventId, navigate]);

  // Start/stop camera
  useEffect(() => {
    if (isOpen && step === 'scan') {
      startScanning();
    } else {
      stopScanning();
    }
    
    return () => stopScanning();
  }, [isOpen, step, startScanning, stopScanning]);

  // Handle Enter key in manual code input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && step === 'code' && manualCode.trim()) {
        handleCodeSubmit();
      }
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, manualCode, handleCodeSubmit, handleClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex flex-col"
      >
        {/* Minimal Header */}
        {step !== 'success' && (
          <div className="flex items-center justify-between p-4">
            <h2 className="text-lg font-semibold text-white">
              {step === 'scan' && 'Scan QR Code'}
              {step === 'code' && 'Enter Code'}
              {step === 'processing' && 'Checking In'}
              {step === 'error' && 'Error'}
            </h2>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          {/* SCAN MODE */}
          {step === 'scan' && (
            <>
              <div className="relative w-72 h-72 mb-8 rounded-2xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Scanner frame overlay */}
                <div className="absolute inset-0">
                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-green-400 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-green-400 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-green-400 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-green-400 rounded-br-xl" />
                  
                  {/* Scanning line */}
                  <div className="absolute top-1/2 left-2 right-2 h-1">
                    <div className="h-full w-full bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse" />
                  </div>
                </div>
                
                {/* Hint text */}
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-white/80 text-sm font-medium">
                    Point camera at event QR code
                  </p>
                </div>
              </div>
              
              {/* Manual entry button */}
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={() => setStep('code')}
                disabled={isLoading}
              >
                <Keyboard className="w-4 h-4 mr-2" />
                Enter code manually
              </Button>
            </>
          )}

          {/* MANUAL CODE ENTRY */}
          {step === 'code' && (
            <div className="w-full max-w-sm">
              <div className="text-center mb-8">
                <QrCode className="w-16 h-16 text-white mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Enter Event Code</h3>
                <p className="text-white/70">Enter the code from the event organizer</p>
              </div>
              
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Paste code here..."
                className="text-center text-lg font-medium h-14 mb-6 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                autoFocus
              />
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12 border-white/20 text-white hover:bg-white/10"
                  onClick={() => setStep('scan')}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 h-12 bg-green-500 hover:bg-green-600 text-white"
                  onClick={handleCodeSubmit}
                  disabled={!manualCode.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Check In'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* PROCESSING */}
          {step === 'processing' && (
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <Loader2 className="w-16 h-16 text-green-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-black/50" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Checking In</h3>
              <p className="text-white/70">{resultMessage}</p>
            </div>
          )}

          {/* SUCCESS */}
          {step === 'success' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-12 h-12 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Checked In!</h3>
              <p className="text-white/70 text-lg mb-2">{eventName}</p>
              <p className="text-green-400 font-medium mb-8">✓ Successfully checked in</p>
              
              <div className="flex gap-3">
                <Button
                  className="flex-1 h-12 bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => navigate(`/event/${eventId}`)}
                >
                  View Event
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-12 border-white/20 text-white hover:bg-white/10"
                  onClick={handleClose}
                >
                  Done
                </Button>
              </div>
            </motion.div>
          )}

          {/* ERROR */}
          {step === 'error' && (
            <div className="text-center max-w-sm">
              <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-12 h-12 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Check-in Failed</h3>
              <p className="text-white/70 mb-6">{resultMessage}</p>
              
              {/* Location-specific error */}
              {resultMessage.includes('move closer') || resultMessage.includes('location') ? (
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-400 font-medium">Location Issue</span>
                  </div>
                  <p className="text-yellow-300/80 text-sm">
                    Make sure you're at the event location and location services are enabled.
                  </p>
                </div>
              ) : null}
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12 border-white/20 text-white hover:bg-white/10"
                  onClick={() => setStep('scan')}
                >
                  Try Again
                </Button>
                <Button
                  className="flex-1 h-12 bg-gray-700 hover:bg-gray-600 text-white"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Quick tips */}
        {step === 'scan' && (
          <div className="p-4 text-center border-t border-white/10">
            <p className="text-white/60 text-sm">
              Ensure good lighting and hold steady
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
