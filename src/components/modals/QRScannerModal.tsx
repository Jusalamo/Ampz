import { useState, useRef, useEffect, useCallback } from 'react';
import { X, QrCode, Keyboard, Loader2, MapPin, AlertCircle, Check, ExternalLink, Navigation } from 'lucide-react';
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

type ScannerStep = 'scan' | 'code' | 'verifying' | 'geofence_check' | 'success' | 'error' | 'outside_geofence';

export function QRScannerModal({ isOpen, onClose, userId, onCheckInSuccess }: QRScannerModalProps) {
  const navigate = useNavigate();
  const { processQRCodeScan, isLoading, validateQRCode } = useCheckIn(userId);
  
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

  // Process QR code - OPTIMIZED for speed
  const processQRCode = useCallback(async (code: string) => {
    setStep('verifying');
    setErrorMessage('');
    setDebugInfo(`Processing QR code...`);
    
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
      
      // Fast event lookup
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, name, latitude, longitude, geofence_radius, is_active, location')
        .eq('id', eventId)
        .single();
      
      if (eventError || !eventData) {
        setErrorMessage('Event not found. Please check the QR code.');
        setStep('error');
        return;
      }
      
      if (!eventData.is_active) {
        setErrorMessage('This event is no longer active.');
        setStep('error');
        return;
      }
      
      const event: Event = {
        id: eventData.id,
        name: eventData.name,
        location: eventData.location,
        coordinates: { lat: eventData.latitude, lng: eventData.longitude },
        geofenceRadius: eventData.geofence_radius || 50,
        isActive: eventData.is_active,
      } as Event;
      
      setScannedEvent(event);
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
          setSuccessMessage(`Already checked in to ${event.name}!`);
          setStep('success');
          onCheckInSuccess?.(event.id);
          return;
        }
      }
      
      // Perform the actual check-in using secure RPC
      setStep('geofence_check');
      setDebugInfo('Verifying location and checking in...');
      
      const result = await processQRCodeScan(code, 'public');
      
      if (result.success) {
        setSuccessMessage(result.message || `Successfully checked in to ${event.name}!`);
        setDistance(result.distance || null);
        setStep('success');
        onCheckInSuccess?.(result.eventId || event.id);
      } else {
        // Check if error is about geofence
        if (result.error?.includes('away') || result.error?.includes('within') || result.error?.includes('meters')) {
          setDistance(result.distance || null);
          setErrorMessage(result.error || 'You are outside the event area');
          setStep('outside_geofence');
        } else if (result.error?.includes('already')) {
          setSuccessMessage(`Already checked in to ${event.name}!`);
          setStep('success');
          onCheckInSuccess?.(event.id);
        } else {
          setErrorMessage(result.error || 'Check-in failed. Please try again.');
          setStep('error');
        }
      }
    } catch (err: any) {
      console.error('Error processing QR code:', err);
      setErrorMessage(err?.message || 'Failed to process QR code. Please try again.');
      setStep('error');
    }
  }, [processQRCodeScan, userId, onCheckInSuccess]);

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
    
    if (scannedEvent && manualCode) {
      await processQRCode(manualCode);
    } else {
      setStep('scan');
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
            {step === 'geofence_check' && 'Checking In...'}
            {step === 'success' && 'Check-In Complete!'}
            {step === 'error' && 'Check-In Failed'}
            {step === 'outside_geofence' && 'Outside Event Area'}
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
              <h3 className="text-xl font-bold mb-2">Completing Check-In</h3>
              <p className="text-muted-foreground text-center mb-4">
                Verifying your location and checking you in...
              </p>
              {scannedEvent && (
                <p className="text-sm text-muted-foreground text-center">
                  Event: <span className="font-medium">{scannedEvent.name}</span>
                </p>
              )}
            </>
          )}

          {step === 'success' && (
            <>
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                <Check className="w-10 h-10 text-green-500" />
              </div>
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
              <h3 className="text-xl font-bold mb-2">Outside Event Area</h3>
              <p className="text-muted-foreground text-center mb-4 max-w-xs">{errorMessage}</p>
              
              {scannedEvent && (
                <div className="w-full max-w-xs mb-6">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                      Event Details
                    </h4>
                    <p className="text-sm text-foreground mb-1">
                      <span className="font-medium">Event:</span> {scannedEvent.name}
                    </p>
                    <p className="text-sm text-foreground">
                      <span className="font-medium">Location:</span> {scannedEvent.location}
                    </p>
                  </div>
                  
                  {distance !== null && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        You are {distance}m away from the event
                      </p>
                      <p className="text-xs text-red-500/80 mt-1">
                        You need to be within {scannedEvent.geofenceRadius || 50}m to check in
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button 
                  className="h-12 w-full" 
                  onClick={handleRetry}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    'Check Again'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12 w-full" 
                  onClick={() => setStep('scan')}
                  disabled={isLoading}
                >
                  Scan Different QR Code
                </Button>
                <Button 
                  className="h-12 w-full" 
                  onClick={handleClose}
                  disabled={isLoading}
                >
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
