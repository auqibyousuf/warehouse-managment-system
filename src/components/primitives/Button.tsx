import React from 'react';
import { StyleSheet, ViewStyle, View } from 'react-native';
import { AnimatedPressable } from 'panelui-native';
import { tapLight } from '../../utils/haptics';
import { theme, useColors } from '../../theme';
import { Typography } from './Typography';
import { Icon } from './Icon';
import { Ionicons } from '@expo/vector-icons';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'subtle';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  className?: string;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  className,
  style,
}) => {
  const colors = useColors();
  const handlePress = () => {
    if (disabled || loading) return;
    tapLight();
    onPress();
  };

  const getHeight = () => {
    switch (size) {
      case 'sm':
        return theme.spacing.layout.buttonHeightSm;
      case 'lg':
        return theme.spacing.layout.buttonHeightLg;
      case 'md':
      default:
        return theme.spacing.layout.buttonHeightMd;
    }
  };

  const getPaddingHorizontal = () => {
    switch (size) {
      case 'sm':
        return theme.spacing.md;
      case 'lg':
        return theme.spacing.xl;
      case 'md':
      default:
        return theme.spacing.base;
    }
  };

  const getColors = () => {
    switch (variant) {
      case 'secondary':
        return {
          bg: colors.background.surface,
          text: colors.text.primary,
          border: colors.border.default,
        };
      case 'outline':
        return {
          bg: 'transparent',
          text: colors.brand.primary,
          border: colors.border.brand,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          text: colors.brand.primary,
          border: 'transparent',
        };
      case 'danger':
        return {
          bg: colors.status.error.bg,
          text: colors.status.error.text,
          border: colors.status.error.border,
        };
      case 'success':
        return {
          bg: colors.status.success.text,
          text: colors.text.onBrand,
          border: colors.status.success.text,
        };
      case 'subtle':
        return {
          bg: colors.background.surfaceSecondary,
          text: colors.text.primary,
          border: colors.border.subtle,
        };
      case 'primary':
      default:
        return {
          bg: colors.brand.primary,
          text: colors.text.onBrand,
          border: colors.brand.primary,
        };
    }
  };

  const variantColors = getColors();

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      pressScale={0.97}
      pressOpacity={variant === 'ghost' ? 0.7 : 1}
      className={`flex-row items-center justify-center border ${fullWidth ? 'w-full' : ''} ${className || ''}`}
      style={[
        styles.button,
        {
          height: getHeight(),
          paddingHorizontal: getPaddingHorizontal(),
          backgroundColor: disabled ? colors.background.surfaceTertiary : variantColors.bg,
          borderColor: disabled ? colors.border.default : variantColors.border,
          borderWidth: variant === 'ghost' ? 0 : 1,
          borderRadius: theme.radii.md,
          width: fullWidth ? '100%' : 'auto',
          minHeight: theme.spacing.layout.touchTargetMin,
        },
        style,
      ]}
    >
      <View style={styles.contentRow}>
        {leftIcon && (
          <Icon
            name={leftIcon}
            size={size === 'sm' ? 'xs' : 'sm'}
            color={disabled ? colors.text.subtle : variantColors.text}
            style={{ marginRight: theme.spacing.sm }}
          />
        )}
        <Typography
          variant={size === 'sm' ? 'bodySmall' : size === 'lg' ? 'bodyLarge' : 'bodyMedium'}
          weight="semibold"
          style={{
            color: disabled ? colors.text.subtle : variantColors.text,
          }}
        >
          {label}
        </Typography>
        {rightIcon && (
          <Icon
            name={rightIcon}
            size={size === 'sm' ? 'xs' : 'sm'}
            color={disabled ? colors.text.subtle : variantColors.text}
            style={{ marginLeft: theme.spacing.sm }}
          />
        )}
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Button;
