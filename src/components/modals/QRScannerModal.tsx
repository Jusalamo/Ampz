import { useReducer, useRef, useEffect, useCallback } from 'react';
import { X, QrCode, Keyboard, Loader2, MapPin, AlertCircle, Check, ExternalLink, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCheckIn } from '@/hooks/useCheckIn';
import { Event } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onCheckInSuccess?: (eventId: string) => void;
}

type ScannerStep = 'scan' | 'code' | 'verifying' | 'geofence_check' | 'success' | 'error' | 'outside_geofence';

interface ScannerState {
  step: ScannerStep;
  manualCode: string;
  scannedEvent: Event | null;
  errorMessage: string;
  successMessage: string;
  distance: number | null;
}

type ScannerAction =
  | { type: 'RESET' }
  | { type: 'SET_STEP'; step: ScannerStep }
  | { type: 'SET_MANUAL_CODE'; code: string }
  | { type: 'SET_EVENT'; event: Event | null }
  | { type: 'SET_ERROR'; message: string }
  | { type: 'SET_SUCCESS'; message: string; distance?: number | null }
  | { type: 'SET_VERIFYING'; event?: Event | null }
  | { type: 'SET_GEOFENCE_CHECK' }
  | { type: 'SET_OUTSIDE_GEOFENCE'; message: string; distance?: number | null };

const initialState: ScannerState = {
  step: 'scan',
  manualCode: '',
  scannedEvent: null,
  errorMessage: '',
  successMessage: '',
  distance: null,
};

function scannerReducer(state: ScannerState, action: ScannerAction): ScannerState {
  switch (action.type) {
    case 'RESET':
      return initialState;
    case 'SET_STEP':
      return { ...state, step: action.step };
    case 'SET_MANUAL_CODE':
      return { ...state, manualCode: action.code };
    case 'SET_EVENT':
      return { ...state, scannedEvent: action.event };
    case 'SET_ERROR':
      return { ...state, step: 'error', errorMessage: action.message };
    case 'SET_SUCCESS':
      return {
        ...state,
        step: 'success',
        successMessage: action.message,
        distance: action.distance ?? state.distance,
      };
    case 'SET_VERIFYING':
      return {
        ...state,
        step: 'verifying',
        errorMessage: '',
        scannedEvent: action.event ?? state.scannedEvent,
      };
    case 'SET_GEOFENCE_CHECK':
      return { ...state, step: 'geofence_check' };
    case 'SET_OUTSIDE_GEOFENCE':
      return {
        ...state,
        step: 'outside_geofence',
        errorMessage: action.message,
        distance: action.distance ?? state.distance,
      };
    default:
      return state;
  }
}

export function QRScannerModal({ isOpen, onClose, userId, onCheckInSuccess }: QRScannerModalProps) {
  const navigate = useNavigate();
  const { processQRCodeScan, isLoading } = useCheckIn(userId);
  
  const [state, dispatch] = useReducer(scannerReducer, initialState);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<any>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const isStartingRef = useRef(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      dispatch({ type: 'RESET' });
    }
  }, [isOpen]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    codeReaderRef.current = null;
    isStartingRef.current = false;
  }, []);

  // Process QR code - OPTIMIZED for speed
  const processQRCode = useCallback(async (code: string) => {
    dispatch({ type: 'SET_VERIFYING' });
    
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
        dispatch({ type: 'SET_ERROR', message: 'Invalid QR code format. Please scan a valid event QR code.' });
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
        dispatch({ type: 'SET_ERROR', message: 'Event not found. Please check the QR code.' });
        return;
      }
      
      if (!eventData.is_active) {
        dispatch({ type: 'SET_ERROR', message: 'This event is no longer active.' });
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
      
      dispatch({ type: 'SET_EVENT', event });
      
      // Check if user has already checked in
      if (userId) {
        const { data: existingCheckIn } = await supabase
          .from('check_ins')
          .select('id')
          .eq('user_id', userId)
          .eq('event_id', event.id)
          .limit(1);

        if (existingCheckIn && existingCheckIn.length > 0) {
          dispatch({ type: 'SET_SUCCESS', message: `Already checked in to ${event.name}!` });
          onCheckInSuccess?.(event.id);
          return;
        }
      }
      
      // Perform the actual check-in using secure RPC
      dispatch({ type: 'SET_GEOFENCE_CHECK' });
      
      const result = await processQRCodeScan(code, 'public');
      
      if (result.success) {
        dispatch({
          type: 'SET_SUCCESS',
          message: result.message || `Successfully checked in to ${event.name}!`,
          distance: result.distance || null,
        });
        onCheckInSuccess?.(result.eventId || event.id);
      } else {
        // Check if error is about geofence
        if (result.error?.includes('away') || result.error?.includes('within') || result.error?.includes('meters')) {
          dispatch({
            type: 'SET_OUTSIDE_GEOFENCE',
            message: result.error || 'You are outside the event area',
            distance: result.distance || null,
          });
        } else if (result.error?.includes('already')) {
          dispatch({ type: 'SET_SUCCESS', message: `Already checked in to ${event.name}!` });
          onCheckInSuccess?.(event.id);
        } else {
          dispatch({ type: 'SET_ERROR', message: result.error || 'Check-in failed. Please try again.' });
        }
      }
    } catch (err: any) {
      console.error('Error processing QR code:', err);
      dispatch({ type: 'SET_ERROR', message: err?.message || 'Failed to process QR code. Please try again.' });
    }
  }, [processQRCodeScan, userId, onCheckInSuccess]);

  // Start QR code scanning - with lazy loading
  const startScanning = useCallback(async () => {
    if (!videoRef.current) return;
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    
    try {
      // Lazy load the QR code library
      if (!codeReaderRef.current) {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        codeReaderRef.current = new BrowserMultiFormatReader();
      }

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
        async (result: any) => {
          if (result) {
            stopScanning();
            const code = result.getText();
            dispatch({ type: 'SET_MANUAL_CODE', code });
            await processQRCode(code);
          }
        }
      );
    } catch (err) {
      console.error('Camera access error:', err);
      dispatch({
        type: 'SET_ERROR',
        message: 'Camera access required. Please enable camera permissions or use manual code entry.',
      });
      dispatch({ type: 'SET_STEP', step: 'code' });
    } finally {
      isStartingRef.current = false;
    }
  }, [stopScanning, processQRCode]);

  // Start/stop scanning based on step
  useEffect(() => {
    if (isOpen && state.step === 'scan') {
      startScanning();
    } else {
      stopScanning();
    }

    return () => stopScanning();
  }, [isOpen, state.step, startScanning, stopScanning]);

  // Handle manual code submission
  const handleCodeSubmit = useCallback(async () => {
    if (!state.manualCode.trim()) {
      dispatch({ type: 'SET_ERROR', message: 'Please enter a code or URL' });
      return;
    }
    await processQRCode(state.manualCode);
  }, [state.manualCode, processQRCode]);

  const handleClose = useCallback(() => {
    stopScanning();
    onClose();
    
    if (state.step === 'success' && state.scannedEvent) {
      navigate(`/event/${state.scannedEvent.id}`);
    }
  }, [stopScanning, onClose, state.step, state.scannedEvent, navigate]);

  const handleViewEvent = useCallback(() => {
    if (state.scannedEvent) {
      navigate(`/event/${state.scannedEvent.id}`);
    }
    onClose();
  }, [state.scannedEvent, navigate, onClose]);

  const handleRetry = useCallback(async () => {
    if (!state.manualCode.trim() && !state.scannedEvent) {
      dispatch({ type: 'SET_STEP', step: 'scan' });
      return;
    }
    
    if (state.scannedEvent && state.manualCode) {
      await processQRCode(state.manualCode);
    } else {
      dispatch({ type: 'SET_STEP', step: 'scan' });
    }
  }, [state.manualCode, state.scannedEvent, processQRCode]);

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
            {state.step === 'scan' && 'Scan QR Code'}
            {state.step === 'code' && 'Enter Event Code'}
            {state.step === 'verifying' && 'Verifying...'}
            {state.step === 'geofence_check' && 'Checking In...'}
            {state.step === 'success' && 'Check-In Complete!'}
            {state.step === 'error' && 'Check-In Failed'}
            {state.step === 'outside_geofence' && 'Outside Event Area'}
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
          {state.step === 'scan' && (
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
                onClick={() => dispatch({ type: 'SET_STEP', step: 'code' })}
                disabled={isLoading}
              >
                <Keyboard className="w-4 h-4 mr-2" />
                Enter Code Manually
              </Button>
            </>
          )}

          {state.step === 'code' && (
            <>
              <QrCode className="w-16 h-16 text-primary mb-6" />
              <h3 className="text-xl font-bold mb-2">Enter Event Code</h3>
              <p className="text-muted-foreground text-center mb-6">
                Enter the event code or scan the QR code
              </p>
              <Input
                value={state.manualCode}
                onChange={(e) => dispatch({ type: 'SET_MANUAL_CODE', code: e.target.value })}
                placeholder="Enter code or event URL..."
                className="text-center text-lg font-medium h-14 max-w-xs mb-6"
                onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
              />
              <div className="flex gap-3 w-full max-w-xs">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12" 
                  onClick={() => dispatch({ type: 'SET_STEP', step: 'scan' })}
                  disabled={isLoading}
                >
                  Back to Scan
                </Button>
                <Button 
                  className="flex-1 h-12" 
                  onClick={handleCodeSubmit} 
                  disabled={!state.manualCode.trim() || isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check In'}
                </Button>
              </div>
            </>
          )}

          {state.step === 'verifying' && (
            <>
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
              <h3 className="text-xl font-bold mb-2">Verifying Event</h3>
              <p className="text-muted-foreground text-center mb-4">Checking event details...</p>
              {state.scannedEvent && (
                <p className="text-sm font-medium text-center">
                  {state.scannedEvent.name}
                </p>
              )}
            </>
          )}

          {state.step === 'geofence_check' && (
            <>
              <div className="relative">
                <Navigation className="w-16 h-16 text-primary mb-6" />
                <Loader2 className="absolute -bottom-2 -right-2 w-8 h-8 text-primary animate-spin" />
              </div>
              <h3 className="text-xl font-bold mb-2">Completing Check-In</h3>
              <p className="text-muted-foreground text-center mb-4">
                Verifying your location and checking you in...
              </p>
              {state.scannedEvent && (
                <p className="text-sm text-muted-foreground text-center">
                  Event: <span className="font-medium">{state.scannedEvent.name}</span>
                </p>
              )}
            </>
          )}

          {state.step === 'success' && (
            <>
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">{state.successMessage}</h3>
              <p className="text-muted-foreground text-center mb-6">You're now checked in!</p>
              {state.distance !== null && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Checked in from {state.distance}m away
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
                {state.scannedEvent && (
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

          {state.step === 'error' && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Check-In Failed</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-xs">{state.errorMessage}</p>
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
                  onClick={() => dispatch({ type: 'SET_STEP', step: 'code' })}
                  disabled={isLoading}
                >
                  Enter Code
                </Button>
              </div>
            </>
          )}

          {state.step === 'outside_geofence' && (
            <>
              <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mb-6">
                <MapPin className="w-10 h-10 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Outside Event Area</h3>
              <p className="text-muted-foreground text-center mb-4 max-w-xs">{state.errorMessage}</p>
              
              {state.scannedEvent && (
                <div className="w-full max-w-xs mb-6">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                      Event Details
                    </h4>
                    <p className="text-sm text-foreground mb-1">
                      <span className="font-medium">Event:</span> {state.scannedEvent.name}
                    </p>
                    <p className="text-sm text-foreground">
                      <span className="font-medium">Location:</span> {state.scannedEvent.location}
                    </p>
                  </div>
                  
                  {state.distance !== null && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        You are {state.distance}m away from the event
                      </p>
                      <p className="text-xs text-red-500/80 mt-1">
                        You need to be within {state.scannedEvent.geofenceRadius || 50}m to check in
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
                  onClick={() => dispatch({ type: 'SET_STEP', step: 'scan' })}
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
