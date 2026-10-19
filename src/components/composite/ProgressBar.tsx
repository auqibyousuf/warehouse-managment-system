import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme, useColors } from '../../theme';

export interface ProgressSegment {
  /** Share of the bar, any positive number; segments are normalised to 100%. */
  value: number;
  color: string;
}

export interface ProgressBarProps {
  /** Single fill, 0 to 1. Ignored when `segments` is set. */
  value?: number;
  color?: string;
  segments?: ProgressSegment[];
  height?: number;
  accessibilityLabel?: string;
}

/** Stitch progress bar: a track with one fill or several colored segments. */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value = 0,
  color,
  segments,
  height = 8,
  accessibilityLabel,
}) => {
  const colors = useColors();
  const total = segments?.reduce((sum, s) => sum + Math.max(0, s.value), 0) ?? 0;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      style={[styles.track, { height, backgroundColor: colors.background.surfaceTertiary }]}
    >
      {segments ? (
        segments
          .filter((s) => s.value > 0)
          .map((s, index) => (
            <View
              key={index}
              style={{ flex: total > 0 ? s.value / total : 0, backgroundColor: s.color }}
            />
          ))
      ) : (
        <View
          style={{
            width: `${Math.min(1, Math.max(0, value)) * 100}%`,
            backgroundColor: color ?? colors.brand.primary,
            borderRadius: theme.radii.full,
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: theme.radii.full,
    overflow: 'hidden',
    gap: 2,
  },
});

export default ProgressBar;
