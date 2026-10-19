import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Badge as PanelBadge } from 'panelui-native';
import { theme, useColors } from '../../theme';
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
  const colors = useColors();
  const isSm = size === 'sm';

  const panelVariantMap: Record<
    BadgeVariant,
    'success' | 'warning' | 'destructive' | 'info' | 'secondary' | 'default'
  > = {
    success: 'success',
    warning: 'warning',
    danger: 'destructive',
    info: 'info',
    neutral: 'secondary',
    forest: 'default',
  };

  const variantStyles = {
    success: {
      bg: colors.status.success.bg,
      border: colors.status.success.border,
      text: colors.status.success.text,
      dot: colors.status.success.text,
    },
    warning: {
      bg: colors.status.warning.bg,
      border: colors.status.warning.border,
      text: colors.status.warning.text,
      dot: colors.status.warning.text,
    },
    danger: {
      bg: colors.status.error.bg,
      border: colors.status.error.border,
      text: colors.status.error.text,
      dot: colors.status.error.text,
    },
    info: {
      bg: colors.status.info.bg,
      border: colors.status.info.border,
      text: colors.status.info.text,
      dot: colors.status.info.text,
    },
    neutral: {
      bg: colors.status.neutral.bg,
      border: colors.status.neutral.border,
      text: colors.status.neutral.text,
      dot: colors.status.neutral.text,
    },
    forest: {
      bg: colors.brand.wash,
      border: colors.brand.subtle,
      text: colors.brand.deep,
      dot: colors.brand.primary,
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
          borderRadius: theme.radii.sm,
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
