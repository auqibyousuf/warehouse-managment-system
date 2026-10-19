import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme';
import { Typography } from '../primitives/Typography';
import { Icon } from '../primitives/Icon';
import { Badge, BadgeVariant } from '../primitives/Badge';
import { Row } from '../primitives/Row';
import { Divider } from '../primitives/Divider';
import { Ionicons } from '@expo/vector-icons';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  meta?: string;
  value?: string | number;
  valueColor?: 'primary' | 'success' | 'warning' | 'error' | 'brandPrimary';
  valueSubtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconBg?: string;
  badge?: {
    label: string;
    variant: BadgeVariant;
  };
  showChevron?: boolean;
  onPress?: () => void;
  showDivider?: boolean;
  style?: ViewStyle;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  meta,
  value,
  valueColor = 'primary',
  valueSubtitle,
  icon,
  iconBg,
  badge,
  showChevron = false,
  onPress,
  showDivider = false,
  style,
}) => {
  const handlePress = () => {
    if (!onPress) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onPress();
  };

  const content = (
    <View style={[styles.container, style]}>
      <Row justify="space-between" align="center" style={styles.mainRow}>
        <Row gap="md" align="center" style={styles.leftGroup}>
          {icon && (
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: iconBg || theme.colors.brand.wash,
                },
              ]}
            >
              <Icon name={icon} size="sm" color="brandDeep" />
            </View>
          )}

          <View style={styles.textGroup}>
            <Row gap="xs" align="center">
              <Typography variant="bodyMedium" weight="semibold" color="primary">
                {title}
              </Typography>
              {badge && <Badge label={badge.label} variant={badge.variant} size="sm" />}
            </Row>

            {subtitle && (
              <Typography variant="caption" color="muted" numberOfLines={1}>
                {subtitle}
              </Typography>
            )}

            {meta && (
              <Typography variant="caption" color="subtle" numberOfLines={1}>
                {meta}
              </Typography>
            )}
          </View>
        </Row>

        <Row gap="xs" align="center">
          {value !== undefined && (
            <View style={styles.valueGroup}>
              <Typography
                variant="bodyMedium"
                weight="bold"
                color={valueColor}
                align="right"
                tabular
              >
                {value}
              </Typography>
              {valueSubtitle && (
                <Typography variant="caption" color="muted" align="right">
                  {valueSubtitle}
                </Typography>
              )}
            </View>
          )}

          {showChevron && <Icon name="chevron-forward" size="sm" color="subtle" />}
        </Row>
      </Row>

      {showDivider && <Divider variant="subtle" spacing="xs" />}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={handlePress} style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}>
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.sm,
  },
  mainRow: {
    minHeight: 44,
  },
  leftGroup: {
    flex: 1,
  },
  textGroup: {
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueGroup: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

export default ListItem;
