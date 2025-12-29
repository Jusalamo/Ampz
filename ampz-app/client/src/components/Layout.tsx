import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, Zap, MessageCircle, User, Bell, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';

export const Layout = () => {
    const location = useLocation();
    const isHome = location.pathname === '/';

    return (
        <div className="app max-w-[480px] mx-auto min-h-screen bg-bg-primary relative overflow-hidden pb-[80px]">
            {/* Top Navigation */}
            <nav className="fixed top-0 left-0 right-0 h-[64px] bg-black/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-5 z-50 max-w-[480px] mx-auto">
                <div className="flex items-center gap-2 text-2xl font-extrabold cursor-pointer">
                    <span className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                        Amp
                    </span>
                    <span className="text-white">s</span>
                </div>

                <div className="flex items-center gap-3">
                    {!isHome && (
                        <button className="text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div className="relative p-2 text-white cursor-pointer hover:bg-white/10 rounded-full transition-colors">
                        <Bell size={20} />
                        {/* Notification Badge */}
                        {/* <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">2</span> */}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-300 border-2 border-transparent hover:border-white/20 transition-all cursor-pointer"></div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-[84px] px-5 min-h-screen">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 h-[65px] bg-black/98 backdrop-blur-md border-t border-white/5 flex justify-around items-center max-w-[480px] mx-auto z-50 pb-[env(safe-area-inset-bottom)]">
                <NavItem to="/" icon={<Home size={20} />} label="Home" />
                <NavItem to="/events" icon={<Calendar size={20} />} label="Events" />
                <NavItem to="/connect" icon={<Zap size={20} />} label="Connect" />
                <NavItem to="/chat" icon={<MessageCircle size={20} />} label="Chat" />
                <NavItem to="/profile" icon={<User size={20} />} label="Profile" />
            </nav>
        </div>
    );
};

const NavItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            clsx(
                'flex flex-col items-center justify-center gap-1 p-4 flex-1 h-full transition-colors duration-200',
                isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-200'
            )
        }
    >
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
);
