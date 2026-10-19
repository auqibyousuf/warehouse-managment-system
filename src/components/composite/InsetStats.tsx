import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme, useColors } from '../../theme';
import { Typography, TextColor } from '../primitives/Typography';

export interface InsetStat {
  label: string;
  value: string;
  valueColor?: TextColor;
}

export interface InsetStatsProps {
  stats: InsetStat[];
}

/** Stitch inset readout: caps labels over mono figures inside a tinted box. */
export const InsetStats: React.FC<InsetStatsProps> = ({ stats }) => {
  const colors = useColors();
  return (
    <View
      style={[
        styles.box,
        { backgroundColor: colors.background.surfaceSecondary, borderColor: colors.border.subtle },
      ]}
    >
      {stats.map((stat) => (
        <View key={stat.label} style={styles.cell}>
          <Typography variant="label" color="muted">
            {stat.label}
          </Typography>
          <Typography variant="dataLarge" color={stat.valueColor ?? 'primary'} numberOfLines={1}>
            {stat.value}
          </Typography>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
  },
  cell: { flex: 1, gap: theme.spacing.xxs },
});

export default InsetStats;
