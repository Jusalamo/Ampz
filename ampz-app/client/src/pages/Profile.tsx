import React from 'react';
import { Settings, Edit2, Shield, CreditCard, LogOut, ChevronRight } from 'lucide-react';
import { Button } from '../components/Button';

export const Profile = () => {
    return (
        <div className="animate-fade-in pb-20">
            {/* Profile Header */}
            <div className="text-center mb-8 pt-4">
                <div className="relative w-24 h-24 mx-auto mb-4">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-4 border-bg-primary shadow-xl overflow-hidden">
                        {/* Avatar Image Placeholder */}
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-2xl font-bold">
                            JD
                        </div>
                    </div>
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white border-2 border-bg-primary">
                        <Edit2 size={14} />
                    </button>
                </div>
                <h2 className="text-xl font-bold mb-1">John Doe</h2>
                <p className="text-gray-400 text-sm mb-4">Software Developer • New York</p>

                <div className="flex justify-center gap-2 mb-6">
                    <div className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-[10px] font-bold tracking-wider">PRO MEMBER</div>
                </div>

                <div className="flex justify-center gap-8 text-center">
                    <div>
                        <div className="text-lg font-bold">0</div>
                        <div className="text-xs text-gray-500">Events</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold">0</div>
                        <div className="text-xs text-gray-500">Followers</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold">0</div>
                        <div className="text-xs text-gray-500">Following</div>
                    </div>
                </div>
            </div>

            {/* Settings Sections */}
            <div className="space-y-4">
                <Section title="Account">
                    <SettingsItem icon={<Settings size={18} />} label="Preferences" />
                    <SettingsItem icon={<Shield size={18} />} label="Privacy & Security" />
                    <SettingsItem icon={<CreditCard size={18} />} label="Subscription" badge="PRO" />
                </Section>

                <div className="px-4">
                    <Button variant="outline" fullWidth className="text-red-500 border-red-500/20 hover:bg-red-500/10 hover:border-red-500">
                        <LogOut size={18} />
                        Sign Out
                    </Button>
                </div>
            </div>
        </div>
    );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6">
        <h3 className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{title}</h3>
        <div className="bg-bg-card border-y border-white/5 divide-y divide-white/5">
            {children}
        </div>
    </div>
);

const SettingsItem = ({ icon, label, badge }: { icon: React.ReactNode; label: string; badge?: string }) => (
    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-3 text-gray-300">
            {icon}
            <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
            {badge && <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded">{badge}</span>}
            <ChevronRight size={16} className="text-gray-600" />
        </div>
    </div>
);
