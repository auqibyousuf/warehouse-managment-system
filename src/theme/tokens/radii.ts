/**
 * Cattle Feed Factory Management - Radii Tokens
 */

export const radii = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 14,
  full: 9999,
} as const;

export type RadiiTokens = typeof radii;
