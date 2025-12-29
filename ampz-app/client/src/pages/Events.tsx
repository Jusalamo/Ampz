import React, { useState } from 'react';
import { Search, MapPin, Filter, List, Map as MapIcon } from 'lucide-react';
import { Button } from '../components/Button';

// Mock data for initial view (empty state handling included)
const MOCK_EVENTS: any[] = [];

export const Events = () => {
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="animate-fade-in h-[calc(100vh-150px)] flex flex-col">
            {/* Header */}
            <div className="mb-4">
                <h1 className="text-2xl font-bold mb-4">Explore Events</h1>

                {/* Search Bar */}
                <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search events, artists, venues..."
                        className="w-full bg-bg-tertiary border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Filters & View Toggle */}
                <div className="flex justify-between items-center">
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        <FilterChip label="All" active />
                        <FilterChip label="Music" />
                        <FilterChip label="Tech" />
                        <FilterChip label="Art" />
                    </div>

                    <div className="flex bg-bg-tertiary rounded-xl p-1 border border-white/5">
                        <button
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-bg-card text-primary shadow-sm' : 'text-gray-400'}`}
                            onClick={() => setViewMode('list')}
                        >
                            <List size={18} />
                        </button>
                        <button
                            className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-bg-card text-primary shadow-sm' : 'text-gray-400'}`}
                            onClick={() => setViewMode('map')}
                        >
                            <MapIcon size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto pb-20">
                {MOCK_EVENTS.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
                        <div className="w-20 h-20 bg-bg-tertiary rounded-full flex items-center justify-center mb-4">
                            <MapPin size={32} className="text-gray-500" />
                        </div>
                        <h3 className="text-lg font-bold mb-2">No Events Found</h3>
                        <p className="text-sm text-gray-400 mb-6">There are no events in your area right now. Check back later!</p>
                        <Button variant="outline">Refresh</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Event List Items would go here */}
                    </div>
                )}
            </div>
        </div>
    );
};

const FilterChip = ({ label, active }: { label: string; active?: boolean }) => (
    <button className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${active ? 'bg-primary text-white border-primary' : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30'}`}>
        {label}
    </button>
);
