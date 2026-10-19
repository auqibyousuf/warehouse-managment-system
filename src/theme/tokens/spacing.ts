/**
 * Cattle Feed Factory Management - Spacing & Layout Tokens
 * Categorized tokens ensuring strict spatial rhythm and consistent touch targets.
 */

export const spacingScale = {
  none: 0,
  hairline: 1,
  xxs: 2,
  xs: 4,
  xsm: 6,
  sm: 8,
  smd: 10,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  massive: 64,
} as const;

export const layout = {
  screenPaddingHorizontal: spacingScale.base,
  screenPaddingVertical: spacingScale.base,
  cardPadding: spacingScale.base,
  cardPaddingCompact: spacingScale.md,
  cardGap: spacingScale.md,
  sectionGap: spacingScale.xl,
  formFieldGap: spacingScale.md,
  itemSpacing: spacingScale.sm,
  inputHeight: 48,
  inputHeightCompact: 40,
  buttonHeightSm: 36,
  buttonHeightMd: 44,
  buttonHeightLg: 52,
  touchTargetMin: 44,
  bottomNavHeight: 64,
  headerHeight: 56,
  iconSizeSm: 16,
  iconSizeMd: 20,
  iconSizeLg: 24,
  iconSizeXl: 28,
  badgeHeightSm: 20,
  badgeHeightMd: 24,
} as const;

export const spacing = {
  ...spacingScale,
  layout,
} as const;

export type SpacingTokens = typeof spacing;
