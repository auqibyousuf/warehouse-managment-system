/**
 * Cattle Feed Factory Management - Z-Index Stacking Tokens
 */

export const zIndex = {
  base: 0,
  card: 1,
  header: 10,
  sticky: 20,
  dropdown: 30,
  bottomNav: 40,
  modalBackdrop: 50,
  modal: 60,
  overlay: 70,
  toast: 100,
} as const;

export type ZIndexTokens = typeof zIndex;
