/**
 * BatchIQ - Radii Tokens
 * Source of truth: Stitch design (DEFAULT 2px, lg 4px, xl 8px, full 12px) with 12px for cards and sheets.
 */

export const radii = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 8,
  xl: 12,
  xxl: 16,
  full: 9999,
} as const;

export type RadiiTokens = typeof radii;
