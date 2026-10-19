import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { theme, useColors } from '../../theme';
import { tapLight } from '../../utils/haptics';
import { Typography } from '../primitives/Typography';

export interface ChipOption<T = string> {
  value: T;
  label: string;
  count?: number;
}

export interface ChipPickerProps<T = string> {
  options: ChipOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  /**
   * `pills` (default): separate rounded filter chips that scroll sideways (Stitch Stock filters).
   * `segmented`: equal-width tabs inside a tinted track (Stitch Invoices All / Unpaid / Paid).
   */
  variant?: 'pills' | 'segmented';
  style?: ViewStyle;
}

const labelOf = <T,>(opt: ChipOption<T>) =>
  opt.count !== undefined ? `${opt.label} (${opt.count})` : opt.label;

export const ChipPicker = <T extends string | number>({
  options,
  selected,
  onSelect,
  variant = 'pills',
  style,
}: ChipPickerProps<T>) => {
  const colors = useColors();

  const press = (value: T, isSelected: boolean) => {
    if (isSelected) return;
    tapLight();
    onSelect(value);
  };

  if (variant === 'segmented') {
    return (
      <View style={[styles.track, { backgroundColor: colors.background.surfaceTertiary }, style]}>
        {options.map((opt) => {
          const isSelected = opt.value === selected;
          return (
            <Pressable
              key={String(opt.value)}
              onPress={() => press(opt.value, isSelected)}
              accessibilityRole="tab"
              accessibilityLabel={opt.label}
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.segment,
                isSelected && [{ backgroundColor: colors.background.surface }, theme.shadows.card],
              ]}
            >
              <Typography
                variant="bodySmall"
                weight="semibold"
                style={{ color: isSelected ? colors.brand.primary : colors.text.secondary }}
              >
                {labelOf(opt)}
              </Typography>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.scroll, style]}
      contentContainerStyle={styles.pills}
    >
      {options.map((opt) => {
        const isSelected = opt.value === selected;
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => press(opt.value, isSelected)}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.pill,
              {
                backgroundColor: isSelected
                  ? colors.brand.primary
                  : colors.background.surfaceTertiary,
              },
              isSelected && theme.shadows.card,
            ]}
          >
            <Typography
              variant="label"
              transform="none"
              style={{ color: isSelected ? colors.text.onBrand : colors.text.secondary }}
            >
              {labelOf(opt)}
            </Typography>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  pills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xxs,
  },
  pill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    minHeight: 32,
    borderRadius: theme.radii.xl,
    justifyContent: 'center',
  },
  track: {
    flexDirection: 'row',
    padding: theme.spacing.xs,
    gap: theme.spacing.xs,
    borderRadius: theme.radii.md,
  },
  segment: {
    flex: 1,
    height: 36,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChipPicker;
