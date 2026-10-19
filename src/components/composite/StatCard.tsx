import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme, useColors } from '../../theme';
import { Typography } from '../primitives/Typography';
import { Icon } from '../primitives/Icon';
import { Card } from '../primitives/Card';
import { Row } from '../primitives/Row';
import { Ionicons } from '@expo/vector-icons';

export type StatVariant = 'default' | 'forest' | 'warning' | 'danger' | 'success';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: StatVariant;
  onPress?: () => void;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  variant = 'default',
  onPress,
  style,
}) => {
  const colors = useColors();
  const getThemeStyles = () => {
    switch (variant) {
      case 'forest':
        return {
          cardBg: colors.brand.wash,
          borderColor: colors.brand.subtle,
          iconBg: colors.brand.subtle,
          iconColor: colors.brand.deep,
          valueColor: 'brandDeep' as const,
        };
      case 'warning':
        return {
          cardBg: colors.status.warning.bg,
          borderColor: colors.status.warning.border,
          iconBg: colors.status.warning.border,
          iconColor: colors.status.warning.icon,
          valueColor: 'warning' as const,
        };
      case 'danger':
        return {
          cardBg: colors.status.error.bg,
          borderColor: colors.status.error.border,
          iconBg: colors.status.error.border,
          iconColor: colors.status.error.icon,
          valueColor: 'error' as const,
        };
      case 'success':
        return {
          cardBg: colors.status.success.bg,
          borderColor: colors.status.success.border,
          iconBg: colors.status.success.border,
          iconColor: colors.status.success.icon,
          valueColor: 'success' as const,
        };
      case 'default':
      default:
        return {
          cardBg: colors.background.surface,
          borderColor: colors.border.subtle,
          iconBg: colors.background.surfaceSecondary,
          iconColor: colors.brand.primary,
          valueColor: 'primary' as const,
        };
    }
  };

  const currentTheme = getThemeStyles();

  return (
    <Card
      variant={variant === 'default' ? 'elevated' : 'flat'}
      padding="compact"
      onPress={onPress}
      style={[
        {
          flex: 1,
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.borderColor,
          borderWidth: 1,
        },
        style,
      ]}
    >
      <Row justify="space-between" align="flex-start" style={styles.topRow}>
        <Typography variant="label" color="muted" style={styles.label}>
          {label}
        </Typography>
        {icon && (
          <View style={[styles.iconWrapper, { backgroundColor: currentTheme.iconBg }]}>
            <Icon name={icon} size="xs" color={currentTheme.iconColor} />
          </View>
        )}
      </Row>

      <Typography
        variant="metric"
        color={currentTheme.valueColor}
        tabular
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        style={styles.metricText}
      >
        {value}
      </Typography>

      {subtitle && (
        <Typography variant="caption" color="muted" style={styles.subtitleText}>
          {subtitle}
        </Typography>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  label: {
    flex: 1,
    flexShrink: 1,
  },
  topRow: {
    marginBottom: theme.spacing.xs,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.xs,
  },
  metricText: {
    marginVertical: theme.spacing.xxs,
  },
  subtitleText: {
    marginTop: theme.spacing.xxs,
  },
});

export default StatCard;
