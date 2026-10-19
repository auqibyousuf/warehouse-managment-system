import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme, useColors, ColorTokens } from '../../theme';
import { Typography } from '../primitives/Typography';
import { Icon } from '../primitives/Icon';
import { Badge, BadgeVariant } from '../primitives/Badge';
import { Row } from '../primitives/Row';
import { Ionicons } from '@expo/vector-icons';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  badge?: {
    label: string;
    variant: BadgeVariant;
  };
  onBack?: () => void;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    label?: string;
  };
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  badge,
  onBack,
  rightAction,
  style,
}) => {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, theme.spacing.sm),
        },
        style,
      ]}
    >
      <Row justify="space-between" align="center" style={styles.content}>
        <Row gap="sm" align="center" style={styles.leftGroup}>
          {onBack && (
            <Pressable
              onPress={onBack}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="arrow-back" size="md" color="primary" />
            </Pressable>
          )}

          <View style={styles.titleColumn}>
            <Row gap="xs" align="center">
              <Typography variant="h2" weight="bold" color="primary">
                {title}
              </Typography>
              {badge && <Badge label={badge.label} variant={badge.variant} size="sm" />}
            </Row>
            {subtitle && (
              <Typography variant="caption" color="muted">
                {subtitle}
              </Typography>
            )}
          </View>
        </Row>

        {rightAction && (
          <Pressable
            onPress={rightAction.onPress}
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel={rightAction.label ?? rightAction.icon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name={rightAction.icon} size="md" color="brandPrimary" />
            {rightAction.label && (
              <Typography
                variant="bodySmall"
                weight="semibold"
                color="brandPrimary"
                style={{ marginLeft: theme.spacing.xs }}
              >
                {rightAction.label}
              </Typography>
            )}
          </Pressable>
        )}
      </Row>
    </View>
  );
};

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background.warm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
      paddingHorizontal: theme.spacing.layout.screenPaddingHorizontal,
      paddingBottom: theme.spacing.md,
    },
    content: {
      minHeight: theme.spacing.layout.headerHeight,
    },
    leftGroup: {
      flex: 1,
    },
    titleColumn: {
      flex: 1,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: theme.radii.sm,
      backgroundColor: colors.background.surfaceSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.xs,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radii.sm,
      backgroundColor: colors.brand.wash,
    },
  });

export default Header;
