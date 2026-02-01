import { useReducer, useRef, useEffect, useCallback } from 'react';
import { X, QrCode, Keyboard, Loader2, MapPin, AlertCircle, Check, Navigation, Users, UserX, Camera, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useCheckIn } from '@/hooks/useCheckIn';
import { Event } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  user?: any; // User profile data
  onCheckInSuccess?: (eventId: string) => void;
}

type ScannerStep = 
  | 'scan' 
  | 'code' 
  | 'verifying' 
  | 'geofence_check' 
  | 'privacy' 
  | 'photo' 
  | 'preview' 
  | 'success' 
  | 'error' 
  | 'outside_geofence';

interface ScannerState {
  step: ScannerStep;
  manualCode: string;
  scannedEvent: Event | null;
  errorMessage: string;
  successMessage: string;
  distance: number | null;
  isPublic: boolean | null;
  capturedPhoto: string | null;
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
  | { type: 'SET_OUTSIDE_GEOFENCE'; message: string; distance?: number | null }
  | { type: 'SET_PRIVACY'; isPublic: boolean }
  | { type: 'SET_PHOTO'; photo: string | null };

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

const initialState: ScannerState = {
  step: 'scan',
  manualCode: '',
  scannedEvent: null,
  errorMessage: '',
  successMessage: '',
  distance: null,
  isPublic: null,
  capturedPhoto: null,
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
    case 'SET_PRIVACY':
      return { ...state, isPublic: action.isPublic };
    case 'SET_PHOTO':
      return { ...state, capturedPhoto: action.photo };
    default:
      return state;
  }
}

export function QRScannerModal({ isOpen, onClose, userId, user, onCheckInSuccess }: QRScannerModalProps) {
  const { processQRCodeScan, isLoading } = useCheckIn(userId);
  
  const [state, dispatch] = useReducer(scannerReducer, initialState);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const codeReaderRef = useRef<any>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStartingRef = useRef(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      dispatch({ type: 'RESET' });
    }
  }, [isOpen]);

  // Camera management
  const startCamera = useCallback(async (facingMode: 'user' | 'environment' = 'environment') => {
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
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const stopScanning = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    codeReaderRef.current = null;
    isStartingRef.current = false;
  }, []);

  // Process QR code with geofence validation
  const processQRCode = useCallback(async (code: string) => {
    dispatch({ type: 'SET_VERIFYING' });
    
    try {
      console.log('Processing QR code:', code);
      
      // Extract event ID from QR code/URL
      let eventId: string | null = null;
      
      if (code.includes('/event/')) {
        const match = code.match(/\/event\/([a-f0-9-]+)/i);
        if (match) eventId = match[1];
      } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code)) {
        eventId = code;
      }
      
      if (!eventId) {
        dispatch({ type: 'SET_ERROR', message: 'Invalid QR code format. Please scan a valid event QR code.' });
        return;
      }
      
      console.log('Event ID extracted:', eventId);
      
      // Fast event lookup with all necessary data
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
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

      // Check event time frame
      const eventDate = new Date(eventData.date);
      const eventTime = eventData.time;
      const now = new Date();
      
      // Parse event date and time
      const [hours, minutes] = eventTime.split(':').map(Number);
      const eventStart = new Date(eventDate);
      eventStart.setHours(hours, minutes, 0, 0);
      
      // Allow check-in 30 minutes before event starts
      const checkInAllowed = new Date(eventStart.getTime() - 30 * 60 * 1000);
      
      if (now < checkInAllowed) {
        dispatch({ 
          type: 'SET_ERROR', 
          message: `Check-in opens 30 minutes before the event starts at ${eventTime}.` 
        });
        return;
      }
      
      const event: Event = {
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
      
      dispatch({ type: 'SET_EVENT', event });
      
      // Check if user has already checked in
      if (userId) {
        const { data: existingCheckIn } = await supabase
          .from('check_ins')
          .select('id, privacy_mode, event_photo')
          .eq('user_id', userId)
          .eq('event_id', event.id)
          .limit(1);

        if (existingCheckIn && existingCheckIn.length > 0) {
          dispatch({ type: 'SET_SUCCESS', message: `Already checked in to ${event.name}!` });
          onCheckInSuccess?.(event.id);
          return;
        }
      }
      
      // Perform geofence check (this will validate location)
      dispatch({ type: 'SET_GEOFENCE_CHECK' });
      
      const result = await processQRCodeScan(code, 'public');
      
      if (result.success) {
        // Geofence validation passed! Now proceed to privacy choice
        dispatch({ type: 'SET_STEP', step: 'privacy' });
        dispatch({ type: 'SET_EVENT', event });
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
      if (!codeReaderRef.current) {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        codeReaderRef.current = new BrowserMultiFormatReader();
      }

      let preferredDeviceId: string | undefined;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        const env = videoInputs.find((d) => /back|rear|environment/i.test(d.label));
        preferredDeviceId = env?.deviceId || videoInputs[0]?.deviceId;
      } catch {
        // ignore
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

  // Manage camera/scanner based on step
  useEffect(() => {
    if (isOpen) {
      if (state.step === 'scan') {
        startScanning();
      } else if (state.step === 'photo') {
        stopScanning();
        startCamera('user');
      } else {
        stopScanning();
        stopCamera();
      }
    }

    return () => {
      stopScanning();
      stopCamera();
    };
  }, [isOpen, state.step, startScanning, startCamera, stopScanning, stopCamera]);

  // Handle manual code submission
  const handleCodeSubmit = useCallback(async () => {
    if (!state.manualCode.trim()) {
      dispatch({ type: 'SET_ERROR', message: 'Please enter a code or URL' });
      return;
    }
    await processQRCode(state.manualCode);
  }, [state.manualCode, processQRCode]);

  // Handle privacy choice
  const handlePrivacyChoice = useCallback((isPublic: boolean) => {
    dispatch({ type: 'SET_PRIVACY', isPublic });
    if (isPublic) {
      dispatch({ type: 'SET_STEP', step: 'photo' });
    } else {
      // Complete check-in without photo
      completeCheckIn(isPublic, null);
    }
  }, []);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        dispatch({ type: 'SET_PHOTO', photo: dataUrl });
        dispatch({ type: 'SET_STEP', step: 'preview' });
      }
    }
  }, []);

  // Complete check-in with privacy settings and optional photo
  const completeCheckIn = useCallback(async (isPublic?: boolean, photo?: string | null) => {
    if (!state.scannedEvent || !userId) return;
    
    const privacyMode = isPublic ?? state.isPublic ?? false;
    const eventPhoto = photo ?? state.capturedPhoto;
    
    try {
      // Update check-in record with privacy and photo
      const { error } = await supabase
        .from('check_ins')
        .update({
          privacy_mode: privacyMode ? 'public' : 'private',
          event_photo: eventPhoto,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('event_id', state.scannedEvent.id);

      if (error) {
        console.error('Error updating check-in:', error);
      }

      dispatch({
        type: 'SET_SUCCESS',
        message: `Successfully checked in to ${state.scannedEvent.name}!`,
      });
      
      onCheckInSuccess?.(state.scannedEvent.id);
    } catch (err) {
      console.error('Error completing check-in:', err);
      dispatch({ type: 'SET_ERROR', message: 'Failed to complete check-in' });
    }
  }, [state.scannedEvent, state.isPublic, state.capturedPhoto, userId, onCheckInSuccess]);

  const handleClose = useCallback(() => {
    stopScanning();
    stopCamera();
    onClose();
  }, [stopScanning, stopCamera, onClose]);

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
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: DESIGN.colors.background }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b flex-shrink-0"
          style={{ 
            borderColor: DESIGN.colors.card,
            height: '72px'
          }}
        >
          <h2 
            className="text-xl font-bold"
            style={{ color: DESIGN.colors.textPrimary }}
          >
            {state.step === 'scan' && 'Scan QR Code'}
            {state.step === 'code' && 'Enter Event Code'}
            {state.step === 'verifying' && 'Verifying...'}
            {state.step === 'geofence_check' && 'Checking Location...'}
            {state.step === 'privacy' && 'Privacy Choice'}
            {state.step === 'photo' && 'Take Photo'}
            {state.step === 'preview' && 'Preview Card'}
            {state.step === 'success' && 'Check-In Complete!'}
            {state.step === 'error' && 'Check-In Failed'}
            {state.step === 'outside_geofence' && 'Outside Event Area'}
          </h2>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center"
            style={{
              background: DESIGN.colors.card,
              borderRadius: DESIGN.borderRadius.round,
              color: DESIGN.colors.textPrimary
            }}
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {/* QR Scanner Step */}
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
                <div 
                  className="absolute inset-0 border-2"
                  style={{ 
                    borderColor: DESIGN.colors.primary,
                    borderRadius: DESIGN.borderRadius.card
                  }}
                >
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4" style={{ borderColor: DESIGN.colors.primary, borderTopLeftRadius: '16px' }} />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4" style={{ borderColor: DESIGN.colors.primary, borderTopRightRadius: '16px' }} />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4" style={{ borderColor: DESIGN.colors.primary, borderBottomLeftRadius: '16px' }} />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4" style={{ borderColor: DESIGN.colors.primary, borderBottomRightRadius: '16px' }} />
                </div>
                <div 
                  className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold"
                  style={{
                    background: DESIGN.colors.primary,
                    color: DESIGN.colors.background,
                    borderRadius: '12px'
                  }}
                >
                  SCANNING...
                </div>
              </div>
              <p className="text-center mb-6" style={{ color: DESIGN.colors.textSecondary }}>
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

          {/* Manual Code Entry Step */}
          {state.step === 'code' && (
            <>
              <QrCode className="w-16 h-16 mb-6" style={{ color: DESIGN.colors.primary }} />
              <h3 className="text-xl font-bold mb-2" style={{ color: DESIGN.colors.textPrimary }}>
                Enter Event Code
              </h3>
              <p className="text-center mb-6" style={{ color: DESIGN.colors.textSecondary }}>
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
                  style={{ 
                    background: DESIGN.colors.primary,
                    color: DESIGN.colors.background,
                  }}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check In'}
                </Button>
              </div>
            </>
          )}

          {/* Verifying Step */}
          {state.step === 'verifying' && (
            <>
              <Loader2 className="w-16 h-16 animate-spin mb-6" style={{ color: DESIGN.colors.primary }} />
              <h3 className="text-xl font-bold mb-2" style={{ color: DESIGN.colors.textPrimary }}>
                Verifying Event
              </h3>
              <p className="text-center mb-4" style={{ color: DESIGN.colors.textSecondary }}>
                Checking event details...
              </p>
              {state.scannedEvent && (
                <p className="text-sm font-medium text-center">
                  {state.scannedEvent.name}
                </p>
              )}
            </>
          )}

          {/* Geofence Check Step */}
          {state.step === 'geofence_check' && (
            <>
              <div className="relative">
                <Navigation className="w-16 h-16 mb-6" style={{ color: DESIGN.colors.primary }} />
                <Loader2 className="absolute -bottom-2 -right-2 w-8 h-8 animate-spin" style={{ color: DESIGN.colors.primary }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: DESIGN.colors.textPrimary }}>
                Verifying Location
              </h3>
              <p className="text-center mb-4" style={{ color: DESIGN.colors.textSecondary }}>
                Making sure you're at the event...
              </p>
              {state.scannedEvent && (
                <p className="text-sm text-center" style={{ color: DESIGN.colors.textSecondary }}>
                  Event: <span className="font-medium">{state.scannedEvent.name}</span>
                </p>
              )}
            </>
          )}

          {/* Privacy Choice Step */}
          {state.step === 'privacy' && state.scannedEvent && (
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold mb-2" style={{ color: DESIGN.colors.textPrimary }}>
                  Joining {state.scannedEvent.name}
                </h3>
                <p style={{ color: DESIGN.colors.textSecondary }}>
                  How do you want to appear at this event?
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePrivacyChoice(true)}
                  className="w-full p-6 text-left"
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
                      <h4 className="font-bold text-lg" style={{ color: DESIGN.colors.textPrimary }}>
                        Public
                      </h4>
                      <p className="text-sm" style={{ color: DESIGN.colors.brandGreen }}>
                        Best for networking
                      </p>
                    </div>
                  </div>
                  <p className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>
                    Others can see your profile and photo. Connect with people at the event!
                  </p>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePrivacyChoice(false)}
                  className="w-full p-6 text-left"
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
                      <h4 className="font-bold text-lg" style={{ color: DESIGN.colors.textPrimary }}>
                        Private
                      </h4>
                      <p className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>
                        Browse anonymously
                      </p>
                    </div>
                  </div>
                  <p className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>
                    You can see others but they won't see you. Perfect for shy attendees.
                  </p>
                </motion.button>
              </div>

              <Button 
                variant="outline" 
                onClick={handleClose} 
                className="w-full h-12"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Photo Capture Step */}
          {state.step === 'photo' && (
            <>
              <div className="relative w-64 h-80 mb-6">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
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
              
              <p className="text-center mb-6" style={{ color: DESIGN.colors.textSecondary }}>
                This photo will be shown to other attendees
              </p>

              <div className="flex gap-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => dispatch({ type: 'SET_STEP', step: 'privacy' })}
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
            </>
          )}

          {/* Preview Step */}
          {state.step === 'preview' && user && (
            <>
              <h3 
                className="text-sm font-medium mb-4"
                style={{ color: DESIGN.colors.textSecondary }}
              >
                This is how others will see you
              </h3>

              <div 
                className="w-64 aspect-[3/4] mb-6 relative"
                style={{
                  background: DESIGN.colors.card,
                  borderRadius: DESIGN.borderRadius.card,
                  border: `1px solid ${DESIGN.colors.textSecondary}20`,
                  boxShadow: DESIGN.shadows.card
                }}
              >
                {state.capturedPhoto && (
                  <img
                    src={state.capturedPhoto}
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
                    {user.profile?.name || user.name}, {user.profile?.age || user.age}
                  </h4>
                  <p 
                    className="text-sm truncate mb-2"
                    style={{ color: DESIGN.colors.textSecondary }}
                  >
                    {user.profile?.bio || user.bio || 'No bio yet'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(user.profile?.interests || user.interests || []).slice(0, 3).map((interest: string) => (
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
                  onClick={() => dispatch({ type: 'SET_STEP', step: 'photo' })}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake
                </Button>
                <Button
                  className="flex-1 h-12"
                  style={{ 
                    background: DESIGN.colors.primary,
                    color: DESIGN.colors.background,
                    boxShadow: DESIGN.shadows.glowPurple
                  }}
                  onClick={() => completeCheckIn()}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Looks Good!
                </Button>
              </div>
            </>
          )}

          {/* Success Step */}
          {state.step === 'success' && state.scannedEvent && (
            <>
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
              <h3 className="text-3xl font-bold mb-2" style={{ color: DESIGN.colors.textPrimary }}>
                Welcome!
              </h3>
              <p className="mb-2" style={{ color: DESIGN.colors.textSecondary }}>
                You're checked in to
              </p>
              <h4 className="text-2xl font-bold mb-8" style={{ color: DESIGN.colors.primary }}>
                {state.scannedEvent.name}
              </h4>
              {state.distance !== null && (
                <div className="mb-6 p-3 rounded-lg" style={{ background: `${DESIGN.colors.brandGreen}10`, border: `1px solid ${DESIGN.colors.brandGreen}30` }}>
                  <p className="text-sm" style={{ color: DESIGN.colors.brandGreen }}>
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Checked in from {state.distance}m away
                  </p>
                </div>
              )}
              <Button
                className="w-full max-w-xs h-12"
                style={{ 
                  background: DESIGN.colors.primary,
                  color: DESIGN.colors.background,
                  boxShadow: DESIGN.shadows.glowPurple
                }}
                onClick={handleClose}
              >
                Start Connecting
              </Button>
            </>
          )}

          {/* Error Step */}
          {state.step === 'error' && (
            <>
              <div 
                className="w-20 h-20 flex items-center justify-center mb-6"
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  borderRadius: DESIGN.borderRadius.round
                }}
              >
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: DESIGN.colors.textPrimary }}>
                Check-In Failed
              </h3>
              <p className="text-center mb-6 max-w-xs" style={{ color: DESIGN.colors.textSecondary }}>
                {state.errorMessage}
              </p>
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

          {/* Outside Geofence Step */}
          {state.step === 'outside_geofence' && state.scannedEvent && (
            <>
              <div 
                className="w-20 h-20 flex items-center justify-center mb-6"
                style={{
                  background: 'rgba(234, 179, 8, 0.2)',
                  borderRadius: DESIGN.borderRadius.round
                }}
              >
                <MapPin className="w-10 h-10 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: DESIGN.colors.textPrimary }}>
                Outside Event Area
              </h3>
              <p className="text-center mb-4 max-w-xs" style={{ color: DESIGN.colors.textSecondary }}>
                {state.errorMessage}
              </p>
              
              <div className="w-full max-w-xs mb-6">
                <div 
                  className="rounded-lg p-4 mb-4"
                  style={{
                    background: 'rgba(234, 179, 8, 0.1)',
                    border: '1px solid rgba(234, 179, 8, 0.3)'
                  }}
                >
                  <h4 className="font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                    Event Details
                  </h4>
                  <p className="text-sm mb-1" style={{ color: DESIGN.colors.textPrimary }}>
                    <span className="font-medium">Event:</span> {state.scannedEvent.name}
                  </p>
                  <p className="text-sm" style={{ color: DESIGN.colors.textPrimary }}>
                    <span className="font-medium">Location:</span> {state.scannedEvent.location}
                  </p>
                </div>
                
                {state.distance !== null && (
                  <div 
                    className="rounded-lg p-4"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}
                  >
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
              
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button 
                  className="h-12 w-full" 
                  onClick={handleRetry}
                  disabled={isLoading}
                  style={{ 
                    background: DESIGN.colors.primary,
                    color: DESIGN.colors.background,
                  }}
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
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
