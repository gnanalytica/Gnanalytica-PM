/**
 * Design System Color Tokens
 * Warm coral accent palette with improved contrast
 * Supports light and dark modes with semantic colors
 */

export const COLORS = {
  light: {
    accent: '#FF6B35',
    accentSoft: 'rgba(255, 107, 53, 0.08)',
    accentHover: '#FF5520',
    surface: {
      primary: '#ffffff',
      secondary: '#fafbfc',
      tertiary: '#f3f4f6',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      muted: '#7A6B60',
    },
    border: {
      subtle: 'rgba(0, 0, 0, 0.06)',
      medium: 'rgba(0, 0, 0, 0.10)',
    },
    semantic: {
      success: '#10b981',
      successSoft: 'rgba(16, 185, 129, 0.1)',
      warning: '#f59e0b',
      warningSoft: 'rgba(245, 158, 11, 0.1)',
      error: '#ef4444',
      errorSoft: 'rgba(239, 68, 68, 0.1)',
      info: '#3b82f6',
      infoSoft: 'rgba(59, 130, 246, 0.1)',
    },
    other: {
      hover: 'rgba(0, 0, 0, 0.035)',
      focusRing: 'rgba(99, 102, 241, 0.5)',
      sidebar: '#fafbfc',
      active: 'rgba(99, 102, 241, 0.06)',
      overlay: 'rgba(0, 0, 0, 0.4)',
    },
  },
  dark: {
    accent: '#FF8557',
    accentSoft: 'rgba(255, 133, 87, 0.12)',
    accentHover: '#FFAA99',
    surface: {
      primary: '#0f1117',
      secondary: '#171923',
      tertiary: '#1e2030',
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.92)',
      secondary: 'rgba(226, 232, 240, 0.6)',
      muted: 'rgba(226, 232, 240, 0.35)',
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.06)',
      medium: 'rgba(255, 255, 255, 0.10)',
    },
    semantic: {
      success: '#34d399',
      successSoft: 'rgba(52, 211, 153, 0.12)',
      warning: '#fbbf24',
      warningSoft: 'rgba(251, 191, 36, 0.12)',
      error: '#f87171',
      errorSoft: 'rgba(248, 113, 113, 0.12)',
      info: '#60a5fa',
      infoSoft: 'rgba(96, 165, 250, 0.12)',
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
    xs: '0 1px 2px rgba(0, 0, 0, 0.03)',
    sm: '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.03)',
    md: '0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
    lg: '0 8px 24px -4px rgba(0, 0, 0, 0.1), 0 2px 8px -2px rgba(0, 0, 0, 0.06)',
    overlay: '0 24px 48px -12px rgba(0, 0, 0, 0.18), 0 8px 16px -4px rgba(0, 0, 0, 0.08)',
    darkXs: '0 1px 2px rgba(0, 0, 0, 0.3)',
    darkSm: '0 1px 3px rgba(0, 0, 0, 0.35), 0 1px 2px rgba(0, 0, 0, 0.25)',
    darkMd: '0 2px 8px -2px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)',
    darkLg: '0 8px 24px -4px rgba(0, 0, 0, 0.5), 0 2px 8px -2px rgba(0, 0, 0, 0.4)',
    darkOverlay: '0 24px 48px -12px rgba(0, 0, 0, 0.6), 0 8px 16px -4px rgba(0, 0, 0, 0.4)',
  },
  spacing: {
    radiusSm: '6px',
    radiusMd: '8px',
    radiusLg: '12px',
    radiusXl: '16px',
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
