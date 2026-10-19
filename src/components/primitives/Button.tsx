import React from 'react';
import {
  StyleSheet,
  ViewStyle,
  View,
} from 'react-native';
import { AnimatedPressable } from 'panelui-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme';
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
  const handlePress = () => {
    if (disabled || loading) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics optional on web / unsupported
    }
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
          bg: theme.colors.brand.deep,
          text: theme.colors.text.onBrand,
          border: theme.colors.brand.deep,
        };
      case 'outline':
        return {
          bg: 'transparent',
          text: theme.colors.brand.primary,
          border: theme.colors.border.brand,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          text: theme.colors.brand.primary,
          border: 'transparent',
        };
      case 'danger':
        return {
          bg: theme.colors.status.error.bg,
          text: theme.colors.status.error.text,
          border: theme.colors.status.error.border,
        };
      case 'success':
        return {
          bg: theme.colors.status.success.text,
          text: theme.colors.text.onBrand,
          border: theme.colors.status.success.text,
        };
      case 'subtle':
        return {
          bg: theme.colors.background.surfaceSecondary,
          text: theme.colors.text.primary,
          border: theme.colors.border.subtle,
        };
      case 'primary':
      default:
        return {
          bg: theme.colors.brand.primary,
          text: theme.colors.text.onBrand,
          border: theme.colors.brand.primary,
        };
    }
  };

  const colors = getColors();

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={disabled || loading}
      pressScale={0.97}
      pressOpacity={variant === 'ghost' ? 0.7 : 1}
      className={`flex-row items-center justify-center rounded-md border ${fullWidth ? 'w-full' : ''} ${className || ''}`}
      style={[
        styles.button,
        {
          height: getHeight(),
          paddingHorizontal: getPaddingHorizontal(),
          backgroundColor: disabled ? theme.colors.background.surfaceTertiary : colors.bg,
          borderColor: disabled ? theme.colors.border.default : colors.border,
          borderWidth: variant === 'ghost' ? 0 : 1,
          borderRadius: theme.radii.sm,
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
            color={disabled ? theme.colors.text.subtle : colors.text}
            style={{ marginRight: theme.spacing.sm }}
          />
        )}
        <Typography
          variant={size === 'sm' ? 'bodySmall' : size === 'lg' ? 'bodyLarge' : 'bodyMedium'}
          weight="semibold"
          style={{
            color: disabled ? theme.colors.text.subtle : colors.text,
          }}
        >
          {label}
        </Typography>
        {rightIcon && (
          <Icon
            name={rightIcon}
            size={size === 'sm' ? 'xs' : 'sm'}
            color={disabled ? theme.colors.text.subtle : colors.text}
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

