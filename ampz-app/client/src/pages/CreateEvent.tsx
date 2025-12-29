import React, { useState } from 'react';
import { ArrowLeft, MapPin, Calendar, Image as ImageIcon, Circle } from 'lucide-react';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { CameraView } from '../components/CameraView';

export const CreateEvent = () => {
    const navigate = useNavigate();
    const [radius, setRadius] = useState(500); // meters
    const [showCamera, setShowCamera] = useState(false);
    const [eventImage, setEventImage] = useState<string | null>(null);

    const handleCapture = (blob: Blob) => {
        const imageUrl = URL.createObjectURL(blob);
        setEventImage(imageUrl);
        setShowCamera(false);
    };

    const handleSubmit = async () => {
        // Mock submission logic
        console.log('Creating event with radius:', radius);
        navigate('/events');
    };

    if (showCamera) {
        return <CameraView onCapture={handleCapture} onClose={() => setShowCamera(false)} />;
    }

    return (
        <div className="animate-fade-in pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 border-b border-white/5">
                <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold">Create Event</h1>
            </div>

            <div className="p-5 space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Event Name</label>
                        <input type="text" className="w-full bg-bg-tertiary border border-white/10 rounded-xl p-3 focus:border-primary outline-none" placeholder="e.g. Tech Meetup 2024" />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Description</label>
                        <textarea className="w-full bg-bg-tertiary border border-white/10 rounded-xl p-3 focus:border-primary outline-none h-24" placeholder="What's this event about?" />
                    </div>
                </div>

                {/* Location & Geofencing */}
                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Location & Geofence</h3>

                    {/* Mock Map Preview */}
                    <div className="h-48 bg-bg-tertiary rounded-xl border border-white/10 relative overflow-hidden flex items-center justify-center mb-4 group cursor-pointer">
                        <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/-74.006,40.7128,12,0/600x300?access_token=YOUR_TOKEN')] bg-cover opacity-50 group-hover:opacity-70 transition-opacity"></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <MapPin className="text-primary mb-2" size={32} />
                            <span className="text-xs font-bold bg-black/50 px-2 py-1 rounded">Tap to set location</span>
                        </div>

                        {/* Geofence Circle Visualization */}
                        <div
                            className="absolute border-2 border-primary/50 bg-primary/10 rounded-full transition-all duration-300 pointer-events-none"
                            style={{ width: `${radius / 5}px`, height: `${radius / 5}px` }}
                        ></div>
                    </div>

                    {/* Radius Slider */}
                    <div className="bg-bg-card p-4 rounded-xl border border-white/5">
                        <div className="flex justify-between mb-2">
                            <span className="text-sm text-gray-300 flex items-center gap-2">
                                <Circle size={14} className="text-primary" /> Geofence Radius
                            </span>
                            <span className="text-sm font-bold text-primary">{radius}m</span>
                        </div>
                        <input
                            type="range"
                            min="100"
                            max="2000"
                            step="50"
                            value={radius}
                            onChange={(e) => setRadius(parseInt(e.target.value))}
                            className="w-full accent-primary h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Attendees must be within this radius to check in.
                        </p>
                    </div>
                </div>

                {/* Verification Method */}
                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Verification</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div
                            onClick={() => setShowCamera(true)}
                            className={`bg-bg-card border ${eventImage ? 'border-green-500' : 'border-primary'} p-4 rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-colors`}
                        >
                            <ImageIcon className={eventImage ? 'text-green-500' : 'text-primary'} size={24} />
                            <span className="text-sm font-bold">{eventImage ? 'Photo Added' : 'Photo Verify'}</span>
                        </div>
                        <div className="bg-bg-tertiary border border-white/5 p-4 rounded-xl flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
                            <Calendar className="text-gray-400" size={24} />
                            <span className="text-sm">Ticket Code</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        "Photo Verify" requires attendees to take a live photo at the location.
                    </p>
                </div>

                <Button fullWidth size="lg" variant="pro" onClick={handleSubmit}>
                    Create Event
                </Button>
            </div>
        </div>
    );
};
