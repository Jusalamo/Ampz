import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check } from 'lucide-react';
import { Button } from './Button';

interface CameraViewProps {
    onCapture: (blob: Blob) => void;
    onClose: () => void;
}

export const CameraView = ({ onCapture, onClose }: CameraViewProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            setError('Unable to access camera. Please ensure permissions are granted.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const capture = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        setCapturedImage(URL.createObjectURL(blob));
                        // In a real app, you'd pass the blob back
                        // onCapture(blob); 
                    }
                }, 'image/jpeg');
            }
        }
    };

    const retake = () => {
        setCapturedImage(null);
    };

    const confirm = () => {
        // Convert capturedImage URL back to blob or just signal success
        onClose();
    };

    if (error) {
        return (
            <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-6 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={onClose} variant="outline">Close</Button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
                <button onClick={onClose} className="text-white bg-black/50 p-2 rounded-full">
                    <X size={24} />
                </button>
                <span className="text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full">
                    Photo Verification
                </span>
                <div className="w-10"></div>
            </div>

            {/* Viewfinder */}
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                {capturedImage ? (
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                )}
            </div>

            {/* Controls */}
            <div className="bg-black p-8 pb-[env(safe-area-inset-bottom)] flex justify-around items-center">
                {capturedImage ? (
                    <>
                        <button onClick={retake} className="text-white flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                                <RefreshCw size={20} />
                            </div>
                            <span className="text-xs">Retake</span>
                        </button>
                        <button onClick={confirm} className="text-white flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-glow">
                                <Check size={32} />
                            </div>
                            <span className="text-xs font-bold">Use Photo</span>
                        </button>
                    </>
                ) : (
                    <button onClick={capture} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1">
                        <div className="w-full h-full bg-white rounded-full transition-transform active:scale-90"></div>
                    </button>
                )}
            </div>
        </div>
    );
};
