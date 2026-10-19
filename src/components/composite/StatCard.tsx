import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../theme';
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
  const getThemeStyles = () => {
    switch (variant) {
      case 'forest':
        return {
          cardBg: theme.colors.brand.wash,
          borderColor: theme.colors.brand.subtle,
          iconBg: theme.colors.brand.subtle,
          iconColor: theme.colors.brand.deep,
          valueColor: 'brandDeep' as const,
        };
      case 'warning':
        return {
          cardBg: theme.colors.status.warning.bg,
          borderColor: theme.colors.status.warning.border,
          iconBg: theme.colors.palette.amberLight,
          iconColor: theme.colors.status.warning.icon,
          valueColor: 'warning' as const,
        };
      case 'danger':
        return {
          cardBg: theme.colors.status.error.bg,
          borderColor: theme.colors.status.error.border,
          iconBg: theme.colors.palette.redLight,
          iconColor: theme.colors.status.error.icon,
          valueColor: 'error' as const,
        };
      case 'success':
        return {
          cardBg: theme.colors.status.success.bg,
          borderColor: theme.colors.status.success.border,
          iconBg: theme.colors.palette.greenLight,
          iconColor: theme.colors.status.success.icon,
          valueColor: 'success' as const,
        };
      case 'default':
      default:
        return {
          cardBg: theme.colors.background.surface,
          borderColor: theme.colors.border.subtle,
          iconBg: theme.colors.background.surfaceSecondary,
          iconColor: theme.colors.brand.primary,
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
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.borderColor,
          borderWidth: 1,
        },
        style,
      ]}
    >
      <Row justify="space-between" align="flex-start" style={styles.topRow}>
        <Typography variant="label" color="muted" numberOfLines={1} style={{ flex: 1 }}>
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
        style={styles.metricText}
      >
        {value}
      </Typography>

      {subtitle && (
        <Typography variant="caption" color="muted" numberOfLines={1} style={styles.subtitleText}>
          {subtitle}
        </Typography>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  topRow: {
    marginBottom: theme.spacing.xs,
  },
  iconWrapper: {
    width: 26,
    height: 26,
    borderRadius: theme.radii.xs,
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
