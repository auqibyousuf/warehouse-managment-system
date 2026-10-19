import { typography } from './typography';
import { spacing } from './spacing';
import { radii } from './radii';
import { shadows } from './shadows';
import { zIndex } from './zIndex';

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './radii';
export * from './shadows';
export * from './zIndex';

/**
 * Static design tokens (the same in light and dark).
 * Colors are deliberately NOT here: read them with `useColors()` so they follow the device appearance.
 */
export const theme = {
  typography,
  spacing,
  radii,
  shadows,
  zIndex,
} as const;

export type Theme = typeof theme;
