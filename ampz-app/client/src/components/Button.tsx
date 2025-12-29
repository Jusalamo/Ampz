import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'ghost' | 'pro' | 'pro-plus' | 'demo';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', fullWidth, children, ...props }, ref) => {
        const variants = {
            primary: 'bg-primary text-white shadow-glow hover:bg-primary-light hover:-translate-y-0.5',
            outline: 'bg-transparent text-white border-2 border-white/30 hover:bg-white/5 hover:border-primary hover:-translate-y-0.5',
            ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5',
            pro: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white shadow-[0_0_30px_rgba(236,72,153,0.3)] hover:-translate-y-0.5',
            'pro-plus': 'bg-gradient-to-br from-orange-400 via-purple-500 to-pink-500 text-white shadow-[0_0_30px_rgba(245,158,11,0.3)]',
            demo: 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white animate-gradient',
        };

        const sizes = {
            sm: 'px-4 py-2 text-xs',
            md: 'px-6 py-3 text-sm',
            lg: 'px-8 py-4 text-base',
            icon: 'w-12 h-12 p-0 flex items-center justify-center text-xl rounded-full',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 active:scale-95',
                    variants[variant],
                    sizes[size],
                    fullWidth && 'w-full',
                    className
                )}
                {...props}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
