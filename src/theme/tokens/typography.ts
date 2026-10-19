import { TextStyle } from 'react-native';

/**
 * BatchIQ - Typography Tokens
 * Source of truth: Stitch design "BatchIQ Warehouse Operations Manager".
 * Hanken Grotesk for headlines and reading text, JetBrains Mono for labels and figures.
 * One type system for light and dark so switching appearance never reflows text.
 * Custom fonts are chosen by family name per weight (fontWeight is ignored for them).
 */
export type FontWeightKey = 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy';

export const fontFamilies = {
  sans: 'System',
  mono: 'Courier',
  body: {
    regular: 'HankenGrotesk_400Regular',
    medium: 'HankenGrotesk_500Medium',
    semibold: 'HankenGrotesk_600SemiBold',
    bold: 'HankenGrotesk_700Bold',
    heavy: 'HankenGrotesk_700Bold',
  } satisfies Record<FontWeightKey, string>,
  display: {
    regular: 'HankenGrotesk_500Medium',
    medium: 'HankenGrotesk_500Medium',
    semibold: 'HankenGrotesk_600SemiBold',
    bold: 'HankenGrotesk_700Bold',
    heavy: 'HankenGrotesk_700Bold',
  } satisfies Record<FontWeightKey, string>,
  data: {
    regular: 'JetBrainsMono_500Medium',
    medium: 'JetBrainsMono_500Medium',
    semibold: 'JetBrainsMono_600SemiBold',
    bold: 'JetBrainsMono_600SemiBold',
    heavy: 'JetBrainsMono_600SemiBold',
  } satisfies Record<FontWeightKey, string>,
} as const;

/** Variants set in the headline face. */
export const displayVariants = new Set([
  'display',
  'h1',
  'h2',
  'h3',
  'title',
  'metric',
  'metricSmall',
]);

/** Variants set in the monospace data face (labels, figures, codes). */
export const dataVariants = new Set(['label', 'badgeText', 'dataLarge', 'dataMedium', 'caption']);

export const fontWeights: Record<string, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
};

/** Raw sizes from the Stitch scale (px). */
export const fontSizes = {
  xxs: 10,
  xs: 11, // label-caps
  sm: 12, // body-sm
  md: 14, // body-md, label-data-md
  base: 14,
  lg: 16, // body-lg, title-sm
  xl: 18, // label-data-lg
  xxl: 20, // headline-md
  headingLg: 22, // headline-lg-mobile
  headingXl: 28, // headline-xl-mobile
  display: 36, // headline-xl (desktop/tablet)
} as const;

export const lineHeights = {
  tight: 1.15,
  snug: 1.25,
  normal: 1.4,
  relaxed: 1.5,
  loose: 1.6,
} as const;

export const letterSpacings = {
  tighter: -0.4, // headline-xl-mobile -0.015em at 28px
  tight: -0.2, // headline-lg/md -0.01em
  normal: 0,
  wide: 0.3,
  wider: 0.6,
  caps: 0.66, // label-caps 0.06em at 11px
} as const;

/** Variants mirror Stitch tokens. Names in comments are the Stitch token names. */
export const textVariants: Record<string, TextStyle> = {
  display: {
    // headline-xl
    fontSize: 36,
    lineHeight: 44,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.72,
  },
  h1: {
    // headline-xl-mobile
    fontSize: 28,
    lineHeight: 36,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.42,
  },
  h2: {
    // headline-lg-mobile
    fontSize: 22,
    lineHeight: 30,
    fontWeight: fontWeights.semibold,
    letterSpacing: -0.22,
  },
  h3: {
    // headline-md
    fontSize: 20,
    lineHeight: 28,
    fontWeight: fontWeights.semibold,
    letterSpacing: -0.2,
  },
  title: {
    // title-sm
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.semibold,
    letterSpacing: -0.08,
  },
  bodyLarge: {
    // body-lg
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.regular,
  },
  body: {
    // body-md
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.regular,
  },
  bodyMedium: {
    // body-md
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.regular,
  },
  bodySmall: {
    // body-sm
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeights.regular,
  },
  caption: {
    // body-sm, medium weight, data face
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeights.medium,
  },
  label: {
    // label-caps
    fontSize: 11,
    lineHeight: 16,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.66,
    textTransform: 'uppercase',
  },
  dataLarge: {
    // label-data-lg
    fontSize: 18,
    lineHeight: 24,
    fontWeight: fontWeights.semibold,
  },
  dataMedium: {
    // label-data-md
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.medium,
  },
  metric: {
    // key figures: headline-lg-mobile size in the headline face
    fontSize: 22,
    lineHeight: 30,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.22,
  },
  metricSmall: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: fontWeights.bold,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.6,
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
