import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { tapLight } from '../../utils/haptics';
import { theme } from '../../theme';
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
  scrollable?: boolean;
  style?: ViewStyle;
}

export const ChipPicker = <T extends string | number>({
  options,
  selected,
  onSelect,
  scrollable = false,
  style,
}: ChipPickerProps<T>) => {
  const renderChips = () => (
    <View style={[styles.container, style]}>
      {options.map((opt) => {
        const isSelected = opt.value === selected;

        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => {
              if (!isSelected) {
                tapLight();
                onSelect(opt.value);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected
                  ? theme.colors.brand.primary
                  : theme.colors.background.surface,
                borderColor: isSelected
                  ? theme.colors.brand.primary
                  : theme.colors.border.default,
              },
            ]}
          >
            <Typography
              variant="bodySmall"
              weight={isSelected ? 'bold' : 'medium'}
              style={{
                color: isSelected ? theme.colors.text.onBrand : theme.colors.text.secondary,
              }}
            >
              {opt.label}
            </Typography>

            {opt.count !== undefined && (
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.brand.deep
                      : theme.colors.background.surfaceSecondary,
                  },
                ]}
              >
                <Typography
                  variant="caption"
                  weight="bold"
                  style={{
                    fontSize: 10,
                    color: isSelected ? theme.colors.text.onBrand : theme.colors.text.muted,
                  }}
                >
                  {opt.count}
                </Typography>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderChips()}
      </ScrollView>
    );
  }

  return renderChips();
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.layout.screenPaddingHorizontal,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    minHeight: 32,
  },
  countBadge: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 1,
    borderRadius: theme.radii.xs,
    marginLeft: theme.spacing.xs,
  },
});

export default ChipPicker;
