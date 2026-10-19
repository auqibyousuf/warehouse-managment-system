import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { theme, useColors, ColorTokens } from '../../theme';
import { useFactorySettings } from '../../hooks/api/useDashboard';
import { Typography } from '../primitives/Typography';
import { Icon } from '../primitives/Icon';

export interface AppTopBarProps {
  title: string;
}

/**
 * Stitch top app bar: brand row, page title, business name, and the avatar that opens Settings.
 * The business name comes from the editable profile, never from a baked-in value.
 */
export const AppTopBar: React.FC<AppTopBarProps> = ({ title }) => {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: settings } = useFactorySettings();
  const businessName = settings?.factoryName?.trim();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.brandRow}>
          <Icon name="cube" size="sm" color="brandPrimary" />
          <Typography variant="label" color="secondary">
            BatchIQ
          </Typography>
          <View style={styles.dot} />
        </View>
        <Typography variant="title" color="primary" numberOfLines={1}>
          {title}
        </Typography>
        <Typography variant="label" color="success" numberOfLines={1}>
          {businessName || 'Set up your business'}
        </Typography>
      </View>

      <Pressable
        onPress={() => router.push('/settings')}
        style={styles.avatar}
        accessibilityRole="button"
        accessibilityLabel="Open settings and business profile"
        hitSlop={8}
      >
        <Icon name="person" size="md" color="onBrand" />
      </Pressable>
    </View>
  );
};

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.base,
      paddingVertical: theme.spacing.sm,
      backgroundColor: colors.background.canvas,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    },
    left: { flex: 1, minWidth: 0, gap: theme.spacing.xxs, paddingRight: theme.spacing.sm },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    dot: {
      width: 6,
      height: 6,
      borderRadius: theme.radii.full,
      backgroundColor: colors.accent.success,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: theme.radii.full,
      backgroundColor: colors.brand.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default AppTopBar;
