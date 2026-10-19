import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, useColors } from '../../theme';
import { Typography } from '../primitives/Typography';
import { Icon } from '../primitives/Icon';

export interface GridOption<T extends string> {
  value: T;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export interface OptionGridProps<T extends string> {
  options: GridOption<T>[];
  selected: T | null;
  onSelect: (value: T) => void;
  tone?: 'primary' | 'warning';
}

/** Two-column choice tiles (Stitch "Reason for deduction"). */
export const OptionGrid = <T extends string>({
  options,
  selected,
  onSelect,
  tone = 'primary',
}: OptionGridProps<T>) => {
  const colors = useColors();
  const activeBg = tone === 'warning' ? colors.status.warning.bg : colors.brand.wash;
  const activeFg = tone === 'warning' ? colors.status.warning.text : colors.brand.primary;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
      {options.map((opt) => {
        const active = opt.value === selected;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
            accessibilityState={{ selected: active }}
            style={{
              width: '49%',
              flexGrow: 1,
              minHeight: 44,
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.sm,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.radii.sm,
              backgroundColor: active ? activeBg : colors.background.surfaceSecondary,
            }}
          >
            <Icon name={opt.icon} size={20} color={active ? activeFg : colors.text.secondary} />
            <Typography
              variant="bodyMedium"
              weight={active ? 'semibold' : 'regular'}
              style={{ color: active ? activeFg : colors.text.primary, flexShrink: 1 }}
            >
              {opt.label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
};

export default OptionGrid;
