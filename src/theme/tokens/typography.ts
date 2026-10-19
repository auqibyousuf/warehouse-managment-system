/**
 * Cattle Feed Factory Management - Typography Tokens
 * Categorized tokens for clear operational readability and tabular numbers.
 */

import { TextStyle } from 'react-native';

/**
 * Premium type system: Manrope for display (headings, metrics), Inter for reading text.
 * Custom fonts are selected per weight by family name (fontWeight is ignored for them),
 * so every weight maps to a loaded face. Loaded in src/app/_layout.tsx.
 */
export type FontWeightKey = 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy';

export const fontFamilies = {
  sans: 'System',
  mono: 'Courier',
  body: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    heavy: 'Inter_700Bold',
  } satisfies Record<FontWeightKey, string>,
  display: {
    regular: 'Manrope_500Medium',
    medium: 'Manrope_500Medium',
    semibold: 'Manrope_600SemiBold',
    bold: 'Manrope_700Bold',
    heavy: 'Manrope_800ExtraBold',
  } satisfies Record<FontWeightKey, string>,
} as const;

/** Variants set in the display face; everything else uses the body face. */
export const displayVariants = new Set(['display', 'h1', 'h2', 'h3', 'title', 'metric', 'metricSmall']);

export const fontWeights: Record<string, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
};

export const fontSizes = {
  xxs: 10,
  xs: 12,
  sm: 13,
  md: 14,
  base: 15,
  lg: 16,
  xl: 18,
  xxl: 20,
  headingLg: 24,
  headingXl: 28,
  display: 34,
} as const;

export const lineHeights = {
  tight: 1.15,
  snug: 1.25,
  normal: 1.4,
  relaxed: 1.5,
  loose: 1.6,
} as const;

export const letterSpacings = {
  tighter: -0.8,
  tight: -0.4,
  normal: 0,
  wide: 0.3,
  wider: 0.6,
  caps: 1.0,
} as const;

export const textVariants: Record<string, TextStyle> = {
  display: {
    fontSize: fontSizes.display,
    lineHeight: 40,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.tight,
  },
  h1: {
    fontSize: fontSizes.headingXl,
    lineHeight: 34,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.tight,
  },
  h2: {
    fontSize: fontSizes.headingLg,
    lineHeight: 30,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.tight,
  },
  h3: {
    fontSize: fontSizes.xxl,
    lineHeight: 26,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacings.tight,
  },
  title: {
    fontSize: fontSizes.xl,
    lineHeight: 24,
    fontWeight: fontWeights.semibold,
  },
  bodyLarge: {
    fontSize: fontSizes.lg,
    lineHeight: 22,
    fontWeight: fontWeights.regular,
  },
  body: {
    fontSize: fontSizes.base,
    lineHeight: 21,
    fontWeight: fontWeights.regular,
  },
  bodyMedium: {
    fontSize: fontSizes.md,
    lineHeight: 20,
    fontWeight: fontWeights.regular,
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    lineHeight: 18,
    fontWeight: fontWeights.regular,
  },
  caption: {
    fontSize: fontSizes.xs,
    lineHeight: 16,
    fontWeight: fontWeights.medium,
  },
  label: {
    fontSize: fontSizes.xs,
    lineHeight: 15,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacings.wide,
  },
  metric: {
    fontSize: fontSizes.headingLg,
    lineHeight: 30,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.tight,
  },
  metricSmall: {
    fontSize: fontSizes.xl,
    lineHeight: 24,
    fontWeight: fontWeights.bold,
  },
  badgeText: {
    fontSize: fontSizes.xxs,
    lineHeight: 13,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.caps,
    textTransform: 'uppercase',
  },
};

export const typography = {
  fontFamilies,
  fontWeights,
  fontSizes,
  lineHeights,
  letterSpacings,
  variants: textVariants,
} as const;

export type TypographyTokens = typeof typography;
