/**
 * Design System Typography Scale
 * Modern, bold typography with generous spacing
 * Font family: Inter
 */

export interface TypographyStyle {
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: number;
}

export const TYPOGRAPHY = {
  // Headings
  h1: {
    fontFamily: 'Inter',
    fontSize: '32px',
    fontWeight: 700,
    lineHeight: 1.2,
  } as TypographyStyle,

  h2: {
    fontFamily: 'Inter',
    fontSize: '24px',
    fontWeight: 700,
    lineHeight: 1.25,
  } as TypographyStyle,

  h3: {
    fontFamily: 'Inter',
    fontSize: '18px',
    fontWeight: 600,
    lineHeight: 1.3,
  } as TypographyStyle,

  // Body text
  bodyLarge: {
    fontFamily: 'Inter',
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: 1.5,
  } as TypographyStyle,

  bodyRegular: {
    fontFamily: 'Inter',
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.5,
  } as TypographyStyle,

  bodySmall: {
    fontFamily: 'Inter',
    fontSize: '13px',
    fontWeight: 400,
    lineHeight: 1.4,
  } as TypographyStyle,

  // Labels and captions
  label: {
    fontFamily: 'Inter',
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: 1.3,
  } as TypographyStyle,

  caption: {
    fontFamily: 'Inter',
    fontSize: '11px',
    fontWeight: 400,
    lineHeight: 1.3,
  } as TypographyStyle,
} as const;

/**
 * Type definitions for typography tokens
 */
export type TypographyToken = keyof typeof TYPOGRAPHY;
export type TypographyTokens = typeof TYPOGRAPHY;
