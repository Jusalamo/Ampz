import React, { useState } from 'react';
import { Search, MoreVertical, Send, ArrowLeft } from 'lucide-react';

// Mock data
const MOCK_MATCHES: any[] = [];
const MOCK_MESSAGES: any[] = [];

export const Chat = () => {
    const [activeChat, setActiveChat] = useState<number | null>(null);

    if (activeChat) {
        return <ChatInterface onBack={() => setActiveChat(null)} />;
    }

    return (
        <div className="animate-fade-in h-[calc(100vh-150px)] flex flex-col">
            <div className="mb-4">
                <h1 className="text-2xl font-bold mb-4">Messages</h1>

                {/* New Matches */}
                <div className="mb-6">
                    <h3 className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">New Matches</h3>
                    <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                        {/* Empty State for Matches */}
                        <div className="flex flex-col items-center gap-1 min-w-[60px]">
                            <div className="w-14 h-14 rounded-full bg-bg-tertiary border-2 border-dashed border-gray-700 flex items-center justify-center">
                                <span className="text-xs text-gray-500">0</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages List */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Conversations</h3>
                    <div className="space-y-2">
                        {MOCK_MATCHES.length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <p className="text-gray-400">No messages yet</p>
                                <p className="text-xs text-gray-600 mt-1">Start matching to connect with people!</p>
                            </div>
                        ) : (
                            // List items would go here
                            <div>List</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ChatInterface = ({ onBack }: { onBack: () => void }) => {
    const [message, setMessage] = useState('');

    return (
        <div className="fixed inset-0 bg-bg-primary z-[60] flex flex-col max-w-[480px] mx-auto">
            {/* Header */}
            <div className="h-[64px] bg-bg-secondary border-b border-white/5 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-gray-400 hover:text-white">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-pink-500"></div>
                    <div>
                        <h3 className="font-bold text-sm">User Name</h3>
                        <span className="text-[10px] text-green-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
                        </span>
                    </div>
                </div>
                <button className="text-gray-400">
                    <MoreVertical size={20} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-primary">
                <div className="text-center text-xs text-gray-600 my-4">Today</div>
                {/* Mock Message Bubbles */}
                <div className="flex justify-end">
                    <div className="bg-primary text-white p-3 rounded-2xl rounded-tr-sm max-w-[80%] text-sm">
                        Hey! Are you going to the tech meetup?
                    </div>
                </div>
            </div>

            {/* Input */}
            <div className="p-4 bg-bg-secondary border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 bg-bg-tertiary border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-glow hover:scale-105 transition-transform">
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
