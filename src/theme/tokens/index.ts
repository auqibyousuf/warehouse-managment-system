import { colors } from './colors';
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

export const theme = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  zIndex,
} as const;

export type Theme = typeof theme;
