/**
 * AMPZ Design System
 * Pure, centralized design system. No one-off styles, inline overrides, or arbitrary values.
 * Version 1.0.0
 */

export const AMPZ = {
  // Radius tokens - ONLY these values allowed
  radius: {
    small: '8px',
    medium: '12px',
    large: '20px',
  },

  // Accent colors - identical across modes
  accent: {
    primary: '#4405E3',
    active: '#6A4DFF',
  },

  // Light mode colors
  colors: {
    light: {
      background: '#FFFFFF',
      surface: '#DFDAE8',
      text: {
        primary: '#111114',
        secondary: '#6B6B73',
        muted: '#8E8E93',
        disabled: '#8E8E93',
      },
    },
    // Dark mode colors
    dark: {
      background: '#0F0F12',
      surface: '#1E1E21',
      text: {
        primary: '#FFFFFF',
        secondary: '#B0B0B5',
        muted: '#8E8E93',
        disabled: '#8E8E93',
      },
    },
  },

  // Motion timing - consistent across components
  motion: {
    timing: {
      hover: '130ms',
      press: '100ms',
    },
    easing: 'ease-out',
  },

  // Shadow tokens
  shadows: {
    card: '0 8px 32px rgba(0, 0, 0, 0.4)',
    button: '0 4px 16px rgba(0, 0, 0, 0.3)',
    modal: '0 20px 60px rgba(0, 0, 0, 0.4)',
    glow: '0 0 30px rgba(68, 5, 227, 0.4)',
  },
} as const;

// Helper to get the current theme colors
export function getThemeColors(theme: 'dark' | 'light' = 'dark') {
  return AMPZ.colors[theme];
}

// CSS variable helpers for Tailwind
export const cssVars = {
  '--ampz-radius-small': AMPZ.radius.small,
  '--ampz-radius-medium': AMPZ.radius.medium,
  '--ampz-radius-large': AMPZ.radius.large,
  '--ampz-accent-primary': AMPZ.accent.primary,
  '--ampz-accent-active': AMPZ.accent.active,
  '--ampz-motion-hover': AMPZ.motion.timing.hover,
  '--ampz-motion-press': AMPZ.motion.timing.press,
};

// Tailwind-compatible class name helpers
export const ampzClasses = {
  // Radius classes
  radiusSmall: 'rounded-[8px]',
  radiusMedium: 'rounded-[12px]',
  radiusLarge: 'rounded-[20px]',
  
  // Transition classes
  transitionHover: 'transition-all duration-[130ms] ease-out',
  transitionPress: 'transition-all duration-[100ms] ease-out',
  
  // Button states
  buttonHover: 'hover:bg-[#6A4DFF]',
  buttonPress: 'active:scale-[0.98] active:bg-[#6A4DFF]',
  
  // Card styles
  card: 'bg-card border border-border/20 rounded-[20px]',
  cardInner: 'rounded-[12px]',
} as const;

export type AmpzDesignSystem = typeof AMPZ;
