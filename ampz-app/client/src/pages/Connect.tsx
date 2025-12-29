import React, { useState } from 'react';
import { X, Heart, Undo2, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock profiles (Empty for now as requested)
const PROFILES: any[] = [];

export const Connect = () => {
    const [profiles, setProfiles] = useState(PROFILES);

    const handleSwipe = (direction: 'left' | 'right') => {
        // Remove top card
        setProfiles(prev => prev.slice(0, -1));
    };

    return (
        <div className="h-[calc(100vh-150px)] flex flex-col relative">
            <div className="text-center mb-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                    Connect
                </h1>
                <p className="text-xs text-gray-400">Swipe to meet people attending events</p>
            </div>

            <div className="flex-1 relative flex items-center justify-center">
                <AnimatePresence>
                    {profiles.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center p-8"
                        >
                            <div className="w-24 h-24 bg-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping"></div>
                                <Heart size={40} className="text-pink-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">That's everyone!</h3>
                            <p className="text-gray-400 mb-6">You've seen all potential matches nearby.</p>
                            <button className="text-primary text-sm font-semibold hover:underline">
                                Adjust Filters
                            </button>
                        </motion.div>
                    ) : (
                        profiles.map((profile, index) => (
                            // Card Implementation would go here
                            <div key={index}>Card</div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className="h-24 flex items-center justify-center gap-6 pb-4">
                <ActionButton icon={<Undo2 size={24} />} color="bg-gray-800 text-yellow-500" size="sm" />
                <ActionButton icon={<X size={32} />} color="bg-gray-800 text-red-500" onClick={() => handleSwipe('left')} />
                <ActionButton icon={<Heart size={32} />} color="bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30" scale onClick={() => handleSwipe('right')} />
                <ActionButton icon={<Star size={24} />} color="bg-gray-800 text-blue-500" size="sm" />
            </div>
        </div>
    );
};

const ActionButton = ({ icon, color, size = 'md', scale, onClick }: any) => (
    <button
        onClick={onClick}
        className={`
      rounded-full flex items-center justify-center transition-all duration-200 active:scale-90
      ${size === 'sm' ? 'w-12 h-12' : 'w-16 h-16'}
      ${color}
      ${scale ? 'hover:scale-110' : 'hover:-translate-y-1'}
    `}
    >
        {icon}
    </button>
);
