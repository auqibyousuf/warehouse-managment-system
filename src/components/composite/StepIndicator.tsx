import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { Typography } from '../primitives/Typography';

export interface StepIndicatorProps {
  steps: string[];
  /** Zero-based index of the current step. */
  current: number;
}

/** Compact progress header for multi-step sheets. */
export const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, current }) => (
  <View
    accessible
    accessibilityRole="progressbar"
    accessibilityLabel={`Step ${current + 1} of ${steps.length}: ${steps[current]}`}
    style={styles.container}
  >
    <View style={styles.bars}>
      {steps.map((label, index) => (
        <View
          key={label}
          style={[styles.bar, index <= current ? styles.barActive : styles.barIdle]}
        />
      ))}
    </View>
    <Typography variant="caption" color="muted">
      Step {current + 1} of {steps.length}: {steps[current]}
    </Typography>
  </View>
);

const styles = StyleSheet.create({
  container: { gap: theme.spacing.xs },
  bars: { flexDirection: 'row', gap: theme.spacing.xs },
  bar: { flex: 1, height: 4, borderRadius: theme.radii.full },
  barActive: { backgroundColor: theme.colors.brand.primary },
  barIdle: { backgroundColor: theme.colors.border.default },
});
