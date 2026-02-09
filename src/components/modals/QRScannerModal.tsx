import { useState, useRef, useEffect, useCallback } from 'react';
import { X, QrCode, Keyboard, Loader2, MapPin, AlertCircle, Check, ExternalLink, Navigation, Users, UserX, RefreshCw, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCheckIn, GeolocationResult } from '@/hooks/useCheckIn';
import { Event } from '@/lib/types';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { supabase } from '@/integrations/supabase/client';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onCheckInSuccess?: (eventId: string) => void;
}

type ScannerStep = 'scan' | 'code' | 'verifying' | 'privacy_choice' | 'photo_capture' | 'checking_in' | 'success' | 'error' | 'outside_geofence';

export function QRScannerModal({ isOpen, onClose, userId, onCheckInSuccess }: QRScannerModalProps) {
  const navigate = useNavigate();
  const { processCheckIn, isLoading, validateQRCode, preflightGeofenceCheck } = useCheckIn(userId);

  // ── UI state ────────────────────────────────────────────────────────────
  const [step, setStep]                       = useState<ScannerStep>('scan');
  const [manualCode, setManualCode]           = useState('');
  const [scannedEvent, setScannedEvent]       = useState<Event | null>(null);
  const [errorMessage, setErrorMessage]       = useState('');
  const [successMessage, setSuccessMessage]   = useState('');
  const [distance, setDistance]               = useState<number | null>(null);
  const [geofenceRadius, setGeofenceRadius]   = useState<number>(50);
  const [selectedVisibility, setSelectedVisibility] = useState<'public' | 'private'>('public');

  // ── refs ────────────────────────────────────────────────────────────────
  // Holds the GPS result from preflight so processCheckIn never calls GPS again
  const cachedLocationRef = useRef<GeolocationResult | null>(null);
  const videoRef          = useRef<HTMLVideoElement>(null);
  const photoVideoRef     = useRef<HTMLVideoElement>(null);
  const codeReaderRef     = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef       = useRef<{ stop: () => void } | null>(null);
  const isStartingRef     = useRef(false);
  const photoStreamRef    = useRef<MediaStream | null>(null);

  // Photo capture state
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // ── reset everything when modal opens ───────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setStep('scan');
      setManualCode('');
      setScannedEvent(null);
      setErrorMessage('');
      setSuccessMessage('');
      setDistance(null);
      setGeofenceRadius(50);
      setSelectedVisibility('public');
      setCapturedPhoto(null);
      setIsUploadingPhoto(false);
      cachedLocationRef.current = null;
    } else {
      // Clean up photo stream when modal closes
      stopPhotoCamera();
    }
  }, [isOpen]);

  // ── photo camera helpers ────────────────────────────────────────────────
  const startPhotoCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }
      });
      photoStreamRef.current = stream;
      if (photoVideoRef.current) {
        photoVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Photo camera error:', err);
      setErrorMessage('Camera access required for verification photo.');
    }
  }, []);

  const stopPhotoCamera = useCallback(() => {
    if (photoStreamRef.current) {
      photoStreamRef.current.getTracks().forEach(t => t.stop());
      photoStreamRef.current = null;
    }
  }, []);

  const capturePhotoFromVideo = useCallback(() => {
    if (!photoVideoRef.current) return;
    const video = photoVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(dataUrl);
    stopPhotoCamera();
  }, [stopPhotoCamera]);

  const uploadPhotoAndCheckIn = useCallback(async () => {
    if (!scannedEvent || !cachedLocationRef.current) return;

    setIsUploadingPhoto(true);
    let photoUrl: string | undefined;

    try {
      if (capturedPhoto) {
        // Convert base64 to blob
        const res = await fetch(capturedPhoto);
        const blob = await res.blob();
        const fileName = `connection-${userId}-${scannedEvent.id}-${Date.now()}.jpg`;

        const { data, error } = await supabase.storage
          .from('community-photos')
          .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

        if (!error && data) {
          const { data: urlData } = supabase.storage.from('community-photos').getPublicUrl(data.path);
          photoUrl = urlData?.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Photo upload failed, proceeding without:', err);
    }

    setIsUploadingPhoto(false);
    setStep('checking_in');

    try {
      const result = await processCheckIn(scannedEvent, cachedLocationRef.current, 'public', photoUrl);

      if (result.success) {
        setSuccessMessage(result.message || `Welcome to ${scannedEvent.name}!`);
        setDistance(result.distance ?? distance);
        setStep('success');
        onCheckInSuccess?.(result.eventId || scannedEvent.id);
        setTimeout(() => { onClose(); navigate('/connect'); }, 1500);
      } else if (result.errorType === 'already_checked_in') {
        setSuccessMessage(`You're already checked in to ${scannedEvent.name}!`);
        setStep('success');
        onCheckInSuccess?.(scannedEvent.id);
      } else {
        setErrorMessage(result.error || 'Check-in failed.');
        setStep('error');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Check-in failed.');
      setStep('error');
    }
  }, [scannedEvent, capturedPhoto, userId, processCheckIn, distance, onCheckInSuccess, navigate, onClose]);

  // Start photo camera when entering photo_capture step
  useEffect(() => {
    if (step === 'photo_capture' && !capturedPhoto) {
      startPhotoCamera();
    }
    return () => {
      if (step !== 'photo_capture') stopPhotoCamera();
    };
  }, [step, capturedPhoto, startPhotoCamera, stopPhotoCamera]);

  // ── process a scanned or manually-entered QR code ──────────────────────
  const processQRCode = useCallback(async (code: string) => {
    setStep('verifying');
    setErrorMessage('');

    try {
      // Extract event ID from the code / URL
      let eventId: string | null = null;
      if (code.includes('/event/')) {
        const match = code.match(/\/event\/([a-f0-9-]+)/i);
        if (match) eventId = match[1];
      } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code)) {
        eventId = code;
      }

      if (!eventId) {
        setErrorMessage('Invalid QR code format. Please scan a valid event QR code.');
        setStep('error');
        return;
      }

      // 1) Validate event exists and is active
      const validation = await validateQRCode(code);
      if (!validation.valid || !validation.event) {
        setErrorMessage(validation.error || 'Event not found. Please check the QR code.');
        setStep('error');
        return;
      }

      const event = validation.event;
      setScannedEvent(event);
      setGeofenceRadius(event.geofenceRadius || 50);

      // 2) Already checked in?
      if (userId) {
        const { data: existing } = await supabase
          .from('check_ins')
          .select('id')
          .eq('user_id', userId)
          .eq('event_id', event.id)
          .limit(1);

        if (existing && existing.length > 0) {
          setSuccessMessage(`You're already checked in to ${event.name}!`);
          setStep('success');
          onCheckInSuccess?.(event.id);
          return;
        }
      }

      // 3) Preflight geofence — fetches GPS exactly once, returns location
      const geofenceResult = await preflightGeofenceCheck(eventId);

      if (geofenceResult.error) {
        setErrorMessage(
          geofenceResult.error.includes('Location permission') || geofenceResult.error.includes('location access')
            ? 'Location access is required. Please enable it in your browser settings.'
            : geofenceResult.error
        );
        setStep('error');
        return;
      }

      // Cache the location — this is what processCheckIn will use later
      cachedLocationRef.current = geofenceResult.location || null;
      setDistance(geofenceResult.distance ?? null);
      setGeofenceRadius(geofenceResult.geofenceRadius || 50);

      // Outside geofence?
      if (!geofenceResult.success) {
        setErrorMessage(`You're ${Math.round(geofenceResult.distance || 0)}m from the venue. Move within ${geofenceResult.geofenceRadius}m to check in.`);
        setStep('outside_geofence');
        return;
      }

      // Geofence passed → show privacy choice
      setStep('privacy_choice');

    } catch (err: any) {
      console.error('Error processing QR code:', err);
      setErrorMessage(err?.message || 'Failed to process QR code. Please try again.');
      setStep('error');
    }
  }, [validateQRCode, preflightGeofenceCheck, userId, onCheckInSuccess]);

  // ── user picked public / private → insert check-in ─────────────────────
  const completeCheckIn = useCallback(async (visibility: 'public' | 'private') => {
    if (!scannedEvent || !cachedLocationRef.current) return;

    setSelectedVisibility(visibility);
    setStep('checking_in');

    try {
      // Pass the cached location — no second GPS call happens inside here
      const result = await processCheckIn(scannedEvent, cachedLocationRef.current, visibility);

      if (result.success) {
        setSuccessMessage(result.message || `Welcome to ${scannedEvent.name}!`);
        setDistance(result.distance ?? distance);
        setStep('success');
        onCheckInSuccess?.(result.eventId || scannedEvent.id);

        if (visibility === 'public') {
          setTimeout(() => {
            onClose();
            navigate('/connect');
          }, 1500);
        }
      } else if (result.errorType === 'already_checked_in') {
        setSuccessMessage(`You're already checked in to ${scannedEvent.name}!`);
        setStep('success');
        onCheckInSuccess?.(scannedEvent.id);
      } else {
        setErrorMessage(result.error || 'Check-in failed. Please try again.');
        setStep('error');
      }
    } catch (err: any) {
      console.error('Error completing check-in:', err);
      setErrorMessage(err?.message || 'Check-in failed. Please try again.');
      setStep('error');
    }
  }, [scannedEvent, processCheckIn, distance, onCheckInSuccess, navigate, onClose]);

  // ── camera: stop ────────────────────────────────────────────────────────
  const stopScanning = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    codeReaderRef.current = null;
    isStartingRef.current = false;
  }, []);

  // ── camera: start ───────────────────────────────────────────────────────
  const startScanning = useCallback(async () => {
    if (!videoRef.current || isStartingRef.current) return;
    isStartingRef.current = true;

    try {
      codeReaderRef.current = new BrowserMultiFormatReader();

      // Try to pick the rear camera
      let preferredDeviceId: string | undefined;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        const env = videoInputs.find(d => /back|rear|environment/i.test(d.label));
        preferredDeviceId = env?.deviceId || videoInputs[0]?.deviceId;
      } catch { /* ignore, decoder will pick a default */ }

      controlsRef.current = await codeReaderRef.current.decodeFromVideoDevice(
        preferredDeviceId,
        videoRef.current,
        async (result) => {
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
      setErrorMessage('Camera access required. Please enable camera permissions or use manual code entry.');
      setStep('code');
    } finally {
      isStartingRef.current = false;
    }
  }, [stopScanning, processQRCode]);

  // ── start / stop camera based on current step ───────────────────────────
  useEffect(() => {
    if (isOpen && step === 'scan') startScanning();
    else stopScanning();
    return () => stopScanning();
  }, [isOpen, step, startScanning, stopScanning]);

  // ── manual code submit ──────────────────────────────────────────────────
  const handleCodeSubmit = async () => {
    if (!manualCode.trim()) {
      setErrorMessage('Please enter a code or URL');
      return;
    }
    await processQRCode(manualCode);
  };

  // ── retry: clears cached location so preflight runs a fresh GPS read ───
  const handleRetry = async () => {
    cachedLocationRef.current = null;
    if (manualCode.trim()) {
      await processQRCode(manualCode);
    } else {
      setStep('scan');
    }
  };

  // ── close / navigation helpers ──────────────────────────────────────────
  const handleClose = () => {
    stopScanning();
    onClose();
    if (step === 'success' && scannedEvent) navigate(`/event/${scannedEvent.id}`);
  };

  const handleViewEvent = () => {
    if (scannedEvent) navigate(`/event/${scannedEvent.id}`);
    onClose();
  };

  const handleGetDirections = () => {
    if (scannedEvent?.coordinates) {
      const { lat, lng } = scannedEvent.coordinates;
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    }
  };

  // ── don't render anything when closed ───────────────────────────────────
  if (!isOpen) return null;

  // ── render ──────────────────────────────────────────────────────────────
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
            {step === 'scan'             && 'Scan QR Code'}
            {step === 'code'             && 'Enter Event Code'}
            {step === 'verifying'        && 'Verifying...'}
            {step === 'privacy_choice'   && 'Choose Visibility'}
            {step === 'photo_capture'    && 'Verification Photo'}
            {step === 'checking_in'      && 'Checking In...'}
            {step === 'success'          && 'Check-In Complete!'}
            {step === 'error'            && 'Check-In Failed'}
            {step === 'outside_geofence' && 'Too Far Away'}
          </h2>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-accent transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">

          {/* ─── SCAN ─── */}
          {step === 'scan' && (
            <>
              <div className="relative w-64 h-64 mb-6 rounded-3xl overflow-hidden">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
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
              <Button variant="outline" className="h-12" onClick={() => setStep('code')} disabled={isLoading}>
                <Keyboard className="w-4 h-4 mr-2" />
                Enter Code Manually
              </Button>
            </>
          )}

          {/* ─── MANUAL CODE ENTRY ─── */}
          {step === 'code' && (
            <>
              <QrCode className="w-16 h-16 text-primary mb-6" />
              <h3 className="text-xl font-bold mb-2">Enter Event Code</h3>
              <p className="text-muted-foreground text-center mb-6">
                Enter the event code or URL
              </p>
              <Input
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                placeholder="Enter code or event URL..."
                className="text-center text-lg font-medium h-14 max-w-xs mb-6"
                onKeyDown={e => e.key === 'Enter' && handleCodeSubmit()}
              />
              <div className="flex gap-3 w-full max-w-xs">
                <Button variant="outline" className="flex-1 h-12" onClick={() => setStep('scan')} disabled={isLoading}>
                  Back to Scan
                </Button>
                <Button className="flex-1 h-12" onClick={handleCodeSubmit} disabled={!manualCode.trim() || isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check In'}
                </Button>
              </div>
            </>
          )}

          {/* ─── VERIFYING ─── */}
          {step === 'verifying' && (
            <>
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
              <h3 className="text-xl font-bold mb-2">Verifying Event</h3>
              <p className="text-muted-foreground text-center mb-4">Checking event details...</p>
              {scannedEvent && <p className="text-sm font-medium text-center">{scannedEvent.name}</p>}
            </>
          )}

          {/* ─── PRIVACY CHOICE ─── */}
          {step === 'privacy_choice' && scannedEvent && (
            <>
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                <Check className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">You're at {scannedEvent.name}!</h3>
              {distance !== null && (
                <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  {distance}m from venue • Within range
                </p>
              )}
              <p className="text-muted-foreground text-center mb-6">
                How would you like to appear at this event?
              </p>

              <div className="space-y-3 w-full max-w-xs mb-6">
                {/* Public */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelectedVisibility('public'); setCapturedPhoto(null); setStep('photo_capture'); }}
                  disabled={isLoading}
                  className="w-full p-4 rounded-xl bg-card border-2 border-primary/50 hover:border-primary transition-colors text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Public</p>
                      <p className="text-xs text-green-600 dark:text-green-400">Best for networking</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Others can see your profile and connect with you
                  </p>
                </motion.button>

                {/* Private */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => completeCheckIn('private')}
                  disabled={isLoading}
                  className="w-full p-4 rounded-xl bg-card border border-border hover:border-muted-foreground transition-colors text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <UserX className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">Private</p>
                      <p className="text-xs text-muted-foreground">Browse anonymously</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You can see others but they won't see you
                  </p>
                </motion.button>
              </div>

              <Button variant="outline" className="h-10" onClick={() => setStep('scan')} disabled={isLoading}>
                Cancel
              </Button>
            </>
          )}

          {/* ─── PHOTO CAPTURE ─── */}
          {step === 'photo_capture' && scannedEvent && (
            <>
              {!capturedPhoto ? (
                <>
                  <div className="relative w-64 h-64 mb-6 rounded-full overflow-hidden border-4 border-primary">
                    <video
                      ref={photoVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Take a Verification Photo</h3>
                  <p className="text-muted-foreground text-center mb-6 max-w-xs">
                    This photo will be your connection profile picture for this event
                  </p>
                  <div className="flex gap-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={capturePhotoFromVideo}
                      className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg"
                    >
                      <Camera className="w-8 h-8 text-primary-foreground" />
                    </motion.button>
                  </div>
                  <Button
                    variant="ghost"
                    className="mt-4 text-muted-foreground"
                    onClick={() => uploadPhotoAndCheckIn()}
                  >
                    Skip — use profile photo
                  </Button>
                </>
              ) : (
                <>
                  <div className="relative w-64 h-64 mb-6 rounded-full overflow-hidden border-4 border-primary">
                    <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Looking good!</h3>
                  <p className="text-muted-foreground text-center mb-6">
                    This is how others will see you at {scannedEvent.name}
                  </p>
                  <div className="flex gap-3 w-full max-w-xs">
                    <Button
                      variant="outline"
                      className="flex-1 h-12"
                      onClick={() => { setCapturedPhoto(null); startPhotoCamera(); }}
                    >
                      Retake
                    </Button>
                    <Button
                      className="flex-1 h-12"
                      onClick={uploadPhotoAndCheckIn}
                      disabled={isUploadingPhoto}
                    >
                      {isUploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Use This Photo
                    </Button>
                  </div>
                </>
              )}
            </>
          )}

          {step === 'checking_in' && (
            <>
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
              <h3 className="text-xl font-bold mb-2">Completing Check-In</h3>
              <p className="text-muted-foreground text-center mb-4">
                Registering your attendance...
              </p>
              <p className="text-sm text-muted-foreground text-center">
                Checking in as <span className="font-medium capitalize">{selectedVisibility}</span>
              </p>
            </>
          )}

          {/* ─── SUCCESS ─── */}
          {step === 'success' && (
            <>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6"
              >
                <Check className="w-10 h-10 text-green-500" />
              </motion.div>
              <h3 className="text-xl font-bold mb-2">{successMessage}</h3>
              <p className="text-muted-foreground text-center mb-6">You're now checked in!</p>
              {distance !== null && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Checked in from {distance}m away
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <Button className="h-12 px-6" onClick={handleClose}>Close</Button>
                {scannedEvent && (
                  <Button variant="outline" className="h-12 px-6" onClick={handleViewEvent}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Event
                  </Button>
                )}
              </div>
            </>
          )}

          {/* ─── ERROR ─── */}
          {step === 'error' && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Check-In Failed</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-xs">{errorMessage}</p>
              <div className="flex gap-3">
                <Button variant="outline" className="h-12" onClick={handleRetry} disabled={isLoading}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button className="h-12" onClick={() => setStep('code')} disabled={isLoading}>
                  Enter Code
                </Button>
              </div>
            </>
          )}

          {/* ─── OUTSIDE GEOFENCE ─── */}
          {step === 'outside_geofence' && (
            <>
              <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mb-6">
                <MapPin className="w-10 h-10 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Too Far Away</h3>
              <p className="text-muted-foreground text-center mb-4 max-w-xs">{errorMessage}</p>

              {scannedEvent && (
                <div className="w-full max-w-xs mb-6">
                  <div className="bg-card border border-border rounded-xl p-4 mb-3">
                    <h4 className="font-medium mb-2">{scannedEvent.name}</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {scannedEvent.location}
                    </p>
                  </div>
                  {distance !== null && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Your Distance</span>
                        <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{distance}m</span>
                      </div>
                      <div className="w-full bg-yellow-200 dark:bg-yellow-900 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${Math.min((geofenceRadius / distance) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-yellow-600/70 dark:text-yellow-400/70 mt-2">
                        Move within {geofenceRadius}m to check in
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button className="h-12 w-full" onClick={handleGetDirections}>
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>
                <Button variant="outline" className="h-12 w-full" onClick={handleRetry} disabled={isLoading}>
                  {isLoading
                    ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    : <RefreshCw className="w-4 h-4 mr-2" />
                  }
                  Check Again
                </Button>
                <Button variant="ghost" className="h-12 w-full" onClick={handleClose} disabled={isLoading}>
                  Cancel
                </Button>
              </div>
            </>
          )}

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
