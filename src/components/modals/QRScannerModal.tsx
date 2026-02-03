import { useState, useRef, useEffect, useCallback } from 'react';
import { X, QrCode, Keyboard, Loader2, MapPin, AlertCircle, Check, ExternalLink, Navigation, Users, UserX, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCheckIn } from '@/hooks/useCheckIn';
import { Event } from '@/lib/types';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { supabase } from '@/integrations/supabase/client';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onCheckInSuccess?: (eventId: string) => void;
}

type ScannerStep = 'scan' | 'code' | 'verifying' | 'geofence_check' | 'privacy_choice' | 'checking_in' | 'success' | 'error' | 'outside_geofence';

export function QRScannerModal({ isOpen, onClose, userId, onCheckInSuccess }: QRScannerModalProps) {
  const navigate = useNavigate();
  const { processQRCodeScan, isLoading, validateQRCode, preflightGeofenceCheck } = useCheckIn(userId);
  
  const [step, setStep] = useState<ScannerStep>('scan');
  const [manualCode, setManualCode] = useState('');
  const [scannedEvent, setScannedEvent] = useState<Event | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  const [geofenceRadius, setGeofenceRadius] = useState<number>(50);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [selectedVisibility, setSelectedVisibility] = useState<'public' | 'private'>('public');
  const [qrDataCache, setQrDataCache] = useState<string>('');
  
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
      setGeofenceRadius(50);
      setDebugInfo('');
      setSelectedVisibility('public');
      setQrDataCache('');
    }
  }, [isOpen]);

  // Fetch event details by ID
  const fetchEventDetails = useCallback(async (eventId: string): Promise<Event | null> => {
    try {
      const { data: eventData, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error || !eventData) {
        return null;
      }

      return {
        id: eventData.id,
        name: eventData.name,
        description: eventData.description || '',
        category: eventData.category,
        location: eventData.location,
        address: eventData.address,
        coordinates: { lat: eventData.latitude, lng: eventData.longitude },
        date: eventData.date,
        time: eventData.time,
        price: eventData.price || 0,
        currency: eventData.currency || 'NAD',
        maxAttendees: eventData.max_attendees || 500,
        attendees: eventData.attendees_count || 0,
        organizerId: eventData.organizer_id,
        qrCode: eventData.qr_code,
        geofenceRadius: eventData.geofence_radius || 50,
        customTheme: eventData.custom_theme || '#8B5CF6',
        coverImage: eventData.cover_image || '',
        images: eventData.images || [],
        videos: eventData.videos || [],
        tags: eventData.tags || [],
        isFeatured: eventData.is_featured || false,
        isDemo: eventData.is_demo || false,
        isActive: eventData.is_active ?? true,
      };
    } catch (error) {
      console.error('Error fetching event details:', error);
      return null;
    }
  }, []);

  // Process QR code - validates and shows privacy choice
  const processQRCode = useCallback(async (code: string) => {
    setStep('verifying');
    setErrorMessage('');
    setDebugInfo(`Processing QR code...`);
    setQrDataCache(code);
    
    try {
      console.log('Processing QR code:', code);
      
      // Extract event ID from QR code/URL
      let eventId: string | null = null;
      
      // Handle different QR code formats
      if (code.includes('/event/')) {
        // URL format: .../event/{id}/checkin or .../event/{id}
        const match = code.match(/\/event\/([a-f0-9-]+)/i);
        if (match) eventId = match[1];
      } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code)) {
        // Direct UUID format
        eventId = code;
      }
      
      if (!eventId) {
        setErrorMessage('Invalid QR code format. Please scan a valid event QR code.');
        setStep('error');
        return;
      }
      
      console.log('Event ID extracted:', eventId);
      
      // Validate QR code and event
      const validation = await validateQRCode(code);
      
      if (!validation.valid || !validation.event) {
        setErrorMessage(validation.error || 'Event not found. Please check the QR code.');
        setStep('error');
        return;
      }
      
      const event = validation.event;
      setScannedEvent(event);
      setGeofenceRadius(event.geofenceRadius || 50);
      setDebugInfo(`Event found: ${event.name}`);
      
      // Check if user has already checked in
      if (userId) {
        const { data: existingCheckIn } = await supabase
          .from('check_ins')
          .select('id')
          .eq('user_id', userId)
          .eq('event_id', event.id)
          .limit(1);

        if (existingCheckIn && existingCheckIn.length > 0) {
          setSuccessMessage(`You're already checked in to ${event.name}!`);
          setStep('success');
          onCheckInSuccess?.(event.id);
          return;
        }
      }
      
      // Pre-flight geofence check
      setStep('geofence_check');
      setDebugInfo('Checking your location...');
      
      const geofenceResult = await preflightGeofenceCheck(eventId);
      
      if (geofenceResult.error) {
        if (geofenceResult.error.includes('Location permission') || geofenceResult.error.includes('location access')) {
          setErrorMessage('Location access is required. Please enable it in your browser settings.');
        } else {
          setErrorMessage(geofenceResult.error);
        }
        setStep('error');
        return;
      }
      
      setDistance(geofenceResult.distance || null);
      setGeofenceRadius(geofenceResult.geofenceRadius || 50);
      
      if (!geofenceResult.success) {
        setErrorMessage(`You're ${geofenceResult.distance}m from ${event.name}. Move within ${geofenceResult.geofenceRadius}m to check in.`);
        setStep('outside_geofence');
        return;
      }
      
      // Show privacy choice step
      setStep('privacy_choice');
      
    } catch (err: any) {
      console.error('Error processing QR code:', err);
      setErrorMessage(err?.message || 'Failed to process QR code. Please try again.');
      setStep('error');
    }
  }, [validateQRCode, preflightGeofenceCheck, userId, onCheckInSuccess]);

  // Complete check-in with selected visibility
  const completeCheckIn = useCallback(async (visibility: 'public' | 'private') => {
    if (!qrDataCache || !scannedEvent) return;
    
    setSelectedVisibility(visibility);
    setStep('checking_in');
    
    try {
      const result = await processQRCodeScan(qrDataCache, visibility);
      
      if (result.success) {
        setSuccessMessage(result.message || `Successfully checked in to ${scannedEvent.name}!`);
        setDistance(result.distance || distance);
        setStep('success');
        onCheckInSuccess?.(result.eventId || scannedEvent.id);
      } else {
        // Check if error is about geofence
        if (result.errorType === 'outside_geofence') {
          setDistance(result.distance || null);
          setGeofenceRadius(result.geofenceRadius || 50);
          setErrorMessage(result.error || 'You are outside the event area');
          setStep('outside_geofence');
        } else if (result.errorType === 'already_checked_in') {
          setSuccessMessage(`You're already checked in to ${scannedEvent.name}!`);
          setStep('success');
          onCheckInSuccess?.(scannedEvent.id);
        } else {
          setErrorMessage(result.error || 'Check-in failed. Please try again.');
          setStep('error');
        }
      }
    } catch (err: any) {
      console.error('Error completing check-in:', err);
      setErrorMessage(err?.message || 'Check-in failed. Please try again.');
      setStep('error');
    }
  }, [qrDataCache, scannedEvent, processQRCodeScan, distance, onCheckInSuccess]);

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

      // Try to get the environment/rear camera
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
      setErrorMessage('Camera access required. Please enable camera permissions or use manual code entry.');
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
    if (!manualCode.trim()) {
      setErrorMessage('Please enter a code or URL');
      return;
    }
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

  const handleRetry = async () => {
    if (!manualCode.trim() && !scannedEvent) {
      setStep('scan');
      return;
    }
    
    if (qrDataCache) {
      await processQRCode(qrDataCache);
    } else if (scannedEvent && manualCode) {
      await processQRCode(manualCode);
    } else {
      setStep('scan');
    }
  };

  const handleGetDirections = () => {
    if (scannedEvent && scannedEvent.coordinates) {
      const { lat, lng } = scannedEvent.coordinates;
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
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
            {step === 'geofence_check' && 'Checking Location...'}
            {step === 'privacy_choice' && 'Choose Visibility'}
            {step === 'checking_in' && 'Checking In...'}
            {step === 'success' && 'Check-In Complete!'}
            {step === 'error' && 'Check-In Failed'}
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
                Enter the event code or scan the QR code
              </p>
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter code or event URL..."
                className="text-center text-lg font-medium h-14 max-w-xs mb-6"
                onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
              />
              <div className="flex gap-3 w-full max-w-xs">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12" 
                  onClick={() => setStep('scan')}
                  disabled={isLoading}
                >
                  Back to Scan
                </Button>
                <Button 
                  className="flex-1 h-12" 
                  onClick={handleCodeSubmit} 
                  disabled={!manualCode.trim() || isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check In'}
                </Button>
              </div>
            </>
          )}

          {step === 'verifying' && (
            <>
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
              <h3 className="text-xl font-bold mb-2">Verifying Event</h3>
              <p className="text-muted-foreground text-center mb-4">Checking event details...</p>
              {scannedEvent && (
                <p className="text-sm font-medium text-center">
                  {scannedEvent.name}
                </p>
              )}
            </>
          )}

          {step === 'geofence_check' && (
            <>
              <div className="relative">
                <Navigation className="w-16 h-16 text-primary mb-6" />
                <Loader2 className="absolute -bottom-2 -right-2 w-8 h-8 text-primary animate-spin" />
              </div>
              <h3 className="text-xl font-bold mb-2">Checking Your Location</h3>
              <p className="text-muted-foreground text-center mb-4">
                Verifying you're at the event venue...
              </p>
              {scannedEvent && (
                <div className="bg-card border border-border rounded-xl p-4 max-w-xs">
                  <p className="text-sm text-muted-foreground mb-1">Event</p>
                  <p className="font-medium">{scannedEvent.name}</p>
                  <p className="text-sm text-muted-foreground mt-2 mb-1">Location</p>
                  <p className="text-sm">{scannedEvent.location}</p>
                </div>
              )}
            </>
          )}

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
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => completeCheckIn('public')}
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

              <Button 
                variant="outline" 
                className="h-10" 
                onClick={() => setStep('scan')}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </>
          )}

          {step === 'checking_in' && (
            <>
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
              <h3 className="text-xl font-bold mb-2">Completing Check-In</h3>
              <p className="text-muted-foreground text-center mb-4">
                Registering your attendance...
              </p>
              {scannedEvent && (
                <p className="text-sm text-muted-foreground text-center">
                  Checking in as <span className="font-medium capitalize">{selectedVisibility}</span>
                </p>
              )}
            </>
          )}

          {step === 'success' && (
            <>
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
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
                <Button 
                  className="h-12 px-6" 
                  onClick={handleClose}
                >
                  Close
                </Button>
                {scannedEvent && (
                  <Button 
                    variant="outline" 
                    className="h-12 px-6"
                    onClick={handleViewEvent}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Event
                  </Button>
                )}
              </div>
            </>
          )}

          {step === 'error' && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Check-In Failed</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-xs">{errorMessage}</p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="h-12" 
                  onClick={handleRetry}
                  disabled={isLoading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  className="h-12" 
                  onClick={() => setStep('code')}
                  disabled={isLoading}
                >
                  Enter Code
                </Button>
              </div>
            </>
          )}

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
                <Button 
                  className="h-12 w-full" 
                  onClick={handleGetDirections}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>
                <Button 
                  variant="outline"
                  className="h-12 w-full" 
                  onClick={handleRetry}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Check Again
                </Button>
                <Button 
                  variant="ghost"
                  className="h-12 w-full" 
                  onClick={handleClose}
                  disabled={isLoading}
                >
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
