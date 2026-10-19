import * as Haptics from 'expo-haptics';

/** Fire-and-forget haptics; unsupported platforms (web) reject, which is safely ignored. */
export const tapLight = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

export const tapSelection = () => {
  Haptics.selectionAsync().catch(() => {});
};
