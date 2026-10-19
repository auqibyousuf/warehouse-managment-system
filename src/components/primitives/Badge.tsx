import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Badge as PanelBadge } from 'panelui-native';
import { theme } from '../../theme';
import { Typography } from './Typography';
import { Icon } from './Icon';
import { Ionicons } from '@expo/vector-icons';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'forest';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  className?: string;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  dot = false,
  icon,
  className,
  style,
}) => {
  const isSm = size === 'sm';

  const panelVariantMap: Record<BadgeVariant, 'success' | 'warning' | 'destructive' | 'info' | 'secondary' | 'default'> = {
    success: 'success',
    warning: 'warning',
    danger: 'destructive',
    info: 'info',
    neutral: 'secondary',
    forest: 'default',
  };

  const variantStyles = {
    success: {
      bg: theme.colors.status.success.bg,
      border: theme.colors.status.success.border,
      text: theme.colors.status.success.text,
      dot: theme.colors.status.success.text,
    },
    warning: {
      bg: theme.colors.status.warning.bg,
      border: theme.colors.status.warning.border,
      text: theme.colors.status.warning.text,
      dot: theme.colors.status.warning.text,
    },
    danger: {
      bg: theme.colors.status.error.bg,
      border: theme.colors.status.error.border,
      text: theme.colors.status.error.text,
      dot: theme.colors.status.error.text,
    },
    info: {
      bg: theme.colors.status.info.bg,
      border: theme.colors.status.info.border,
      text: theme.colors.status.info.text,
      dot: theme.colors.status.info.text,
    },
    neutral: {
      bg: theme.colors.status.neutral.bg,
      border: theme.colors.status.neutral.border,
      text: theme.colors.status.neutral.text,
      dot: theme.colors.status.neutral.text,
    },
    forest: {
      bg: theme.colors.brand.wash,
      border: theme.colors.brand.subtle,
      text: theme.colors.brand.deep,
      dot: theme.colors.brand.primary,
    },
  }[variant];

  return (
    <PanelBadge
      variant={panelVariantMap[variant]}
      size={isSm ? 'sm' : 'md'}
      className={className}
      style={[
        styles.badge,
        {
          backgroundColor: variantStyles.bg,
          borderColor: variantStyles.border,
          height: isSm ? theme.spacing.layout.badgeHeightSm : theme.spacing.layout.badgeHeightMd,
          paddingHorizontal: isSm ? theme.spacing.xs : theme.spacing.sm,
          borderRadius: theme.radii.full,
        },
        style,
      ]}
    >
      <View style={styles.innerRow}>
        {dot && (
          <View
            style={[
              styles.dot,
              {
                backgroundColor: variantStyles.dot,
                marginRight: theme.spacing.xs,
              },
            ]}
          />
        )}
        {icon && (
          <Icon
            name={icon}
            size="xs"
            color={variantStyles.text}
            style={{ marginRight: theme.spacing.xxs }}
          />
        )}
        <Typography
          variant="badgeText"
          style={{ color: variantStyles.text, fontSize: isSm ? 9 : 10 }}
        >
          {label}
        </Typography>
      </View>
    </PanelBadge>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default Badge;

