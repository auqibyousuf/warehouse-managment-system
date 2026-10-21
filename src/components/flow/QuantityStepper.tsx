import React, { useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';
import { theme, useColors } from '../../theme';
import { Typography } from '../primitives/Typography';
import { Icon } from '../primitives/Icon';

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
  /** Fill of the +/- buttons; amber for stock going out. */
  tone?: 'primary' | 'warning';
  accessibilityLabel?: string;
}

// The surrounding box already shows focus, so hide the browser's own outline on web.
const webNoOutline = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as object;

const clamp = (value: number, min: number, max?: number) =>
  Math.max(min, max !== undefined ? Math.min(max, value) : value);

/** Stitch quantity box: minus, a big editable mono figure with its unit, plus. */
export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  onChange,
  unit,
  step = 1,
  min = 0,
  max,
  tone = 'primary',
  accessibilityLabel = 'Quantity',
}) => {
  const colors = useColors();
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  const [syncedValue, setSyncedValue] = useState(value);
  if (syncedValue !== value) {
    setSyncedValue(value);
    if (Number(text) !== value) setText(String(value));
  }

  const commit = (next: number) => {
    const safe = clamp(Number.isFinite(next) ? next : 0, min, max);
    onChange(Math.round(safe * 1000) / 1000);
  };

  const button = (label: string, icon: 'remove' | 'add', delta: number) => (
    <Pressable
      onPress={() => commit(value + delta)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: 48,
        height: 48,
        borderRadius: theme.radii.sm,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor:
          tone === 'warning' ? colors.background.surfaceTertiary : colors.background.surface,
        ...theme.shadows.card,
      }}
    >
      <Icon name={icon} size={22} color={tone === 'warning' ? 'warning' : 'primary'} />
    </Pressable>
  );

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        padding: theme.spacing.sm,
        borderRadius: theme.radii.md,
        backgroundColor: colors.background.surfaceSecondary,
      }}
    >
      {button('Decrease', 'remove', -step)}
      {/* The figure is a real text field: tap it and type any number. */}
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          height: 48,
          paddingHorizontal: theme.spacing.md,
          gap: theme.spacing.sm,
          borderRadius: theme.radii.sm,
          borderWidth: 1,
          borderColor: focused ? colors.brand.primary : colors.border.subtle,
          backgroundColor: colors.background.surface,
        }}
      >
        <TextInput
          value={text}
          onChangeText={(next) => {
            setText(next);
            const parsed = parseFloat(next);
            if (!Number.isNaN(parsed)) onChange(clamp(parsed, min, max));
            else if (next === '') onChange(min);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setText(String(value));
          }}
          keyboardType="decimal-pad"
          accessibilityLabel={accessibilityLabel}
          selectTextOnFocus
          style={[
            {
              flexShrink: 1,
              minWidth: 24,
              textAlign: unit ? 'right' : 'center',
              fontSize: 24,
              fontFamily: theme.typography.fontFamilies.data.semibold,
              color: colors.text.primary,
              padding: 0,
            },
            webNoOutline,
          ]}
        />
        {unit ? (
          <Typography
            variant="dataMedium"
            color="secondary"
            numberOfLines={1}
            style={{ flexShrink: 0 }}
          >
            {unit}
          </Typography>
        ) : null}
      </View>
      {button('Increase', 'add', step)}
    </View>
  );
};

export default QuantityStepper;
