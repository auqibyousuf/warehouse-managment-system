import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { tapLight } from '../../utils/haptics';
import { theme, useColors } from '../../theme';
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
  const colors = useColors();
  const renderChips = () => (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background.surfaceSecondary, borderColor: colors.border.subtle },
        style,
      ]}
    >
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
                backgroundColor: isSelected ? colors.brand.primary : 'transparent',
                borderColor: isSelected ? colors.brand.primary : 'transparent',
              },
            ]}
          >
            <Typography
              variant="bodySmall"
              weight={isSelected ? 'bold' : 'medium'}
              style={{
                color: isSelected ? colors.text.onBrand : colors.text.secondary,
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
                      ? colors.brand.deep
                      : colors.background.surfaceSecondary,
                  },
                ]}
              >
                <Typography
                  variant="caption"
                  weight="bold"
                  style={{
                    fontSize: theme.typography.fontSizes.xxs,
                    color: isSelected ? colors.text.onBrand : colors.text.muted,
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
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    padding: theme.spacing.xs,
    borderRadius: theme.radii.md,
    borderWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.layout.screenPaddingHorizontal,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    minHeight: 36,
  },
  countBadge: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.hairline,
    borderRadius: theme.radii.sm,
    marginLeft: theme.spacing.xs,
  },
});

export default ChipPicker;
