/**
 * Design System Color Tokens
 * Warm coral accent palette with improved contrast
 * Supports light and dark modes with semantic colors
 */

export const COLORS = {
  light: {
    // Background
    background: '#FAFBFC',
    // Surface colors
    accent: '#FF6B35',
    accentSoft: 'rgba(255, 107, 53, 0.08)',
    accentHover: '#FF8557',
    surface: {
      primary: '#FFFFFF',
      secondary: '#F5F3F0',
      tertiary: '#EEE8E3',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#6B5B52',
      muted: '#7A6B60',
    },
    border: {
      subtle: '#E8DED7',
      medium: 'rgba(0, 0, 0, 0.10)',
    },
    semantic: {
      success: '#10B981',
      successSoft: 'rgba(16, 185, 129, 0.1)',
      warning: '#F59E0B',
      warningSoft: 'rgba(245, 158, 11, 0.1)',
      error: '#EF4444',
      errorSoft: 'rgba(239, 68, 68, 0.1)',
      info: '#3B82F6',
      infoSoft: 'rgba(59, 130, 246, 0.1)',
    },
    other: {
      hover: 'rgba(0, 0, 0, 0.035)',
      focusRing: 'rgba(99, 102, 241, 0.5)',
      sidebar: '#FAFBFC',
      active: 'rgba(99, 102, 241, 0.06)',
      overlay: 'rgba(0, 0, 0, 0.4)',
    },
  },
  dark: {
    // Background
    background: '#0F1419',
    // Surface colors
    accent: '#FF8557',
    accentSoft: 'rgba(255, 133, 87, 0.12)',
    accentHover: '#FFA76B',
    surface: {
      primary: '#1A1F2E',
      secondary: '#2A2520',
      tertiary: '#342F2A',
    },
    text: {
      primary: '#F5F3F0',
      secondary: '#B8AFA6',
      muted: '#8B7E77',
    },
    border: {
      subtle: '#4A413A',
      medium: 'rgba(255, 255, 255, 0.10)',
    },
    semantic: {
      success: '#10B981',
      successSoft: 'rgba(16, 185, 129, 0.1)',
      warning: '#F59E0B',
      warningSoft: 'rgba(245, 158, 11, 0.1)',
      error: '#EF4444',
      errorSoft: 'rgba(239, 68, 68, 0.1)',
      info: '#3B82F6',
      infoSoft: 'rgba(59, 130, 246, 0.1)',
    },
    other: {
      hover: 'rgba(255, 255, 255, 0.05)',
      focusRing: 'rgba(129, 140, 248, 0.5)',
      sidebar: '#141620',
      active: 'rgba(129, 140, 248, 0.1)',
      overlay: 'rgba(0, 0, 0, 0.6)',
    },
  },
  shadows: {
    elevation0: 'none',
    elevation1: '0 1px 2px rgba(0, 0, 0, 0.05)',
    elevation2: '0 4px 6px rgba(0, 0, 0, 0.1)',
    elevation3: '0 10px 15px rgba(0, 0, 0, 0.15)',
    elevation4: '0 20px 25px rgba(0, 0, 0, 0.2)',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    pill: '9999px',
  },
} as const;

/**
 * Type definitions for color tokens
 */
export type ColorMode = typeof COLORS.light;
export type SemanticColors = typeof COLORS.light.semantic;
export type SurfaceColors = typeof COLORS.light.surface;
export type TextColors = typeof COLORS.light.text;
export type BorderColors = typeof COLORS.light.border;
export type ShadowTokens = typeof COLORS.shadows;
export type SpacingTokens = typeof COLORS.spacing;
