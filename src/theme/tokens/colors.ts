/**
 * BatchIQ - Color Tokens (light + dark)
 *
 * Source of truth: the Stitch design "BatchIQ Warehouse Operations Manager".
 * Light is blue-led, dark is amber-led. Components never import a color directly:
 * they read `useColors()` so the app follows the device appearance automatically.
 */

export type ColorScheme = 'light' | 'dark';

export interface StatusColors {
  text: string;
  bg: string;
  border: string;
  icon: string;
}

export interface ColorTokens {
  scheme: ColorScheme;
  /** Primary brand: fills, active states, links. */
  brand: {
    primary: string;
    deep: string;
    darkest: string;
    medium: string;
    light: string;
    subtle: string;
    wash: string;
    ultraLight: string;
  };
  background: {
    canvas: string;
    warm: string;
    surface: string;
    surfaceSecondary: string;
    surfaceTertiary: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    subtle: string;
    onBrand: string;
    onDark: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  border: {
    subtle: string;
    default: string;
    medium: string;
    brand: string;
    focus: string;
    warning: string;
    error: string;
    success: string;
  };
  status: {
    success: StatusColors;
    warning: StatusColors;
    error: StatusColors;
    info: StatusColors;
    neutral: StatusColors;
  };
  overlay: { backdrop: string; subtle: string; medium: string };
  /** Solid fills for tinted icon chips and charts. */
  accent: { success: string; warning: string; error: string; info: string };
}

export const lightColors: ColorTokens = {
  scheme: 'light',
  brand: {
    primary: '#004ac6',
    deep: '#003ea8',
    darkest: '#00174b',
    medium: '#2563eb',
    light: '#b4c5ff',
    subtle: '#dbe1ff',
    wash: '#eaedff',
    ultraLight: '#f2f3ff',
  },
  background: {
    canvas: '#faf8ff',
    warm: '#faf8ff',
    surface: '#ffffff',
    surfaceSecondary: '#f2f3ff',
    surfaceTertiary: '#eaedff',
  },
  text: {
    primary: '#131b2e',
    secondary: '#434655',
    muted: '#5f6373',
    subtle: '#737686',
    onBrand: '#ffffff',
    onDark: '#ffffff',
    success: '#006243',
    warning: '#904d00',
    error: '#ba1a1a',
    info: '#004ac6',
  },
  border: {
    subtle: '#e2e7ff',
    default: '#c3c6d7',
    medium: '#a3a7b8',
    brand: '#004ac6',
    focus: '#2563eb',
    warning: '#ffb77d',
    error: '#ffdad6',
    success: '#85f8c4',
  },
  status: {
    success: { text: '#006243', bg: '#e6faf1', border: '#85f8c4', icon: '#007d57' },
    warning: { text: '#904d00', bg: '#fff2e6', border: '#ffb77d', icon: '#b86100' },
    error: { text: '#ba1a1a', bg: '#fff0ee', border: '#ffdad6', icon: '#ba1a1a' },
    info: { text: '#004ac6', bg: '#eaedff', border: '#b4c5ff', icon: '#2563eb' },
    neutral: { text: '#434655', bg: '#f2f3ff', border: '#c3c6d7', icon: '#737686' },
  },
  overlay: {
    backdrop: 'rgba(19, 27, 46, 0.5)',
    subtle: 'rgba(19, 27, 46, 0.04)',
    medium: 'rgba(19, 27, 46, 0.12)',
  },
  accent: { success: '#007d57', warning: '#fe932c', error: '#ba1a1a', info: '#2563eb' },
};

export const darkColors: ColorTokens = {
  scheme: 'dark',
  brand: {
    primary: '#f59e0b',
    deep: '#ffc174',
    darkest: '#2a1700',
    medium: '#ffb95f',
    light: '#ffddb8',
    subtle: '#653e00',
    wash: 'rgba(245, 158, 11, 0.14)',
    ultraLight: 'rgba(245, 158, 11, 0.08)',
  },
  background: {
    canvas: '#0f141b',
    warm: '#0f141b',
    surface: '#171c23',
    surfaceSecondary: '#1b2027',
    surfaceTertiary: '#252a32',
  },
  text: {
    primary: '#dee2ec',
    secondary: '#d8c3ad',
    muted: '#b3a08a',
    subtle: '#a08e7a',
    onBrand: '#472a00',
    onDark: '#dee2ec',
    success: '#4edea3',
    warning: '#ffc174',
    error: '#ffb4ab',
    info: '#54ddfc',
  },
  border: {
    subtle: '#252a32',
    default: '#3a3f47',
    medium: '#534434',
    brand: '#f59e0b',
    focus: '#ffc174',
    warning: 'rgba(245, 158, 11, 0.4)',
    error: 'rgba(255, 180, 171, 0.4)',
    success: 'rgba(78, 222, 163, 0.4)',
  },
  status: {
    success: {
      text: '#4edea3',
      bg: 'rgba(78, 222, 163, 0.12)',
      border: 'rgba(78, 222, 163, 0.35)',
      icon: '#4edea3',
    },
    warning: {
      text: '#ffc174',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.4)',
      icon: '#f59e0b',
    },
    error: {
      text: '#ffb4ab',
      bg: 'rgba(147, 0, 10, 0.35)',
      border: 'rgba(255, 180, 171, 0.35)',
      icon: '#ffb4ab',
    },
    info: {
      text: '#54ddfc',
      bg: 'rgba(41, 193, 223, 0.12)',
      border: 'rgba(84, 221, 252, 0.35)',
      icon: '#54ddfc',
    },
    neutral: { text: '#d8c3ad', bg: '#1b2027', border: '#3a3f47', icon: '#a08e7a' },
  },
  overlay: {
    backdrop: 'rgba(0, 0, 0, 0.65)',
    subtle: 'rgba(255, 255, 255, 0.04)',
    medium: 'rgba(255, 255, 255, 0.1)',
  },
  accent: { success: '#4edea3', warning: '#f59e0b', error: '#ffb4ab', info: '#54ddfc' },
};

export const getColors = (scheme: ColorScheme | null | undefined): ColorTokens =>
  scheme === 'dark' ? darkColors : lightColors;
