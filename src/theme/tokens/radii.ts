/**
 * BatchIQ - Radii Tokens
 * Softer, larger curves for a modern feel: inputs/buttons 12-14, cards 20, sheets 28.
 */

export const radii = {
  none: 0,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

export type RadiiTokens = typeof radii;
