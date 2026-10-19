/**
 * Cattle Feed Factory Management - Color Tokens
 * Categorized tokens ensuring strict theme consistency and zero hardcoded colors.
 */

export const palette = {
  // Brand Greens
  forestDarkest: '#0F261D',
  forestDeep: '#173F30',
  forestPrimary: '#245B43',
  forestMedium: '#317355',
  forestLight: '#4B8E6F',
  forestSubtle: '#D1E3D9',
  forestWash: '#E6F0E9',
  forestUltraLight: '#F2F7F4',

  // Warm Neutrals
  warmCanvas: '#F8F8F4',
  warmWhite: '#FAFAF6',
  surfaceWhite: '#FFFFFF',
  surfaceSecondary: '#F4F5F1',
  surfaceTertiary: '#EAEBE6',

  // Gray / Text Neutrals
  neutral950: '#111714',
  neutral900: '#202824',
  neutral800: '#333D37',
  neutral700: '#47534D',
  neutral600: '#5E6B64',
  neutral500: '#68736C',
  neutral400: '#8A9690',
  neutral300: '#B0BCB6',
  neutral200: '#DCE2DD',
  neutral100: '#EDF0EE',
  neutral50: '#F7F9F8',

  // Semantic Warnings (Amber/Gold for low-stock and alerts)
  amberDark: '#8C520A',
  amberPrimary: '#A96713',
  amberMedium: '#D97706',
  amberLight: '#FDE68A',
  amberWash: '#FFF2D9',

  // Semantic Errors / Destructive (Deep Crimson)
  redDark: '#8E1710',
  redPrimary: '#B42318',
  redMedium: '#DC2626',
  redLight: '#FECDCA',
  redWash: '#FEF3F2',

  // Semantic Success (Vibrant Green)
  greenDark: '#195634',
  greenPrimary: '#247547',
  greenMedium: '#16A34A',
  greenLight: '#BBF7D0',
  greenWash: '#EDFDF2',

  // Semantic Information / Logistics (Blue-Slate)
  blueDark: '#1E3A8A',
  bluePrimary: '#2563EB',
  blueLight: '#BFDBFE',
  blueWash: '#EFF6FF',
} as const;

export const colors = {
  palette,
  brand: {
    primary: palette.forestPrimary,
    deep: palette.forestDeep,
    darkest: palette.forestDarkest,
    medium: palette.forestMedium,
    light: palette.forestLight,
    subtle: palette.forestSubtle,
    wash: palette.forestWash,
    ultraLight: palette.forestUltraLight,
  },
  background: {
    canvas: palette.warmCanvas,
    warm: palette.warmWhite,
    surface: palette.surfaceWhite,
    surfaceSecondary: palette.surfaceSecondary,
    surfaceTertiary: palette.surfaceTertiary,
  },
  text: {
    primary: palette.neutral900,
    secondary: palette.neutral700,
    muted: palette.neutral500,
    subtle: palette.neutral400,
    onBrand: palette.surfaceWhite,
    onDark: palette.surfaceWhite,
    success: palette.greenPrimary,
    warning: palette.amberDark,
    error: palette.redPrimary,
    info: palette.blueDark,
  },
  border: {
    subtle: palette.neutral100,
    default: palette.neutral200,
    medium: palette.neutral300,
    brand: palette.forestPrimary,
    focus: palette.forestMedium,
    warning: palette.amberLight,
    error: palette.redLight,
    success: palette.greenLight,
  },
  status: {
    success: {
      text: palette.greenPrimary,
      bg: palette.greenWash,
      border: palette.greenLight,
      icon: palette.greenPrimary,
    },
    warning: {
      text: palette.amberDark,
      bg: palette.amberWash,
      border: palette.amberLight,
      icon: palette.amberPrimary,
    },
    error: {
      text: palette.redPrimary,
      bg: palette.redWash,
      border: palette.redLight,
      icon: palette.redPrimary,
    },
    info: {
      text: palette.blueDark,
      bg: palette.blueWash,
      border: palette.blueLight,
      icon: palette.bluePrimary,
    },
    neutral: {
      text: palette.neutral700,
      bg: palette.neutral100,
      border: palette.neutral200,
      icon: palette.neutral500,
    },
  },
  overlay: {
    backdrop: 'rgba(15, 38, 29, 0.55)',
    subtle: 'rgba(0, 0, 0, 0.04)',
    medium: 'rgba(0, 0, 0, 0.12)',
  },
} as const;

export type ColorTokens = typeof colors;
