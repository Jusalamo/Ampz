import React from 'react';
import { Button } from '../components/Button';
import { Ticket, MapPin, Search, Star } from 'lucide-react';

export const Home = () => {
    return (
        <div className="animate-fade-in">
            {/* Hero Section */}
            <div className="text-center py-8 relative z-10">
                <h1 className="text-3xl font-bold mb-4 bg-gradient-to-br from-primary via-primary-light to-pink-500 bg-clip-text text-transparent">
                    Discover Live Events
                </h1>
            </div>

            {/* Bookmarked Events (Empty State) */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Saved Events</h3>
                    <button className="text-primary text-sm">View All</button>
                </div>

                <div className="bg-bg-card border border-white/5 rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Ticket className="text-gray-500" size={32} />
                    </div>
                    <p className="text-gray-400 mb-4">No saved events yet</p>
                    <Button variant="outline" size="sm">Explore Events</Button>
                </div>
                );
