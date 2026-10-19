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
          <Typography variant="h3" color="primary" weight="semibold">
            BatchIQ
          </Typography>
          {businessName ? (
            <View style={styles.chip}>
              <Typography variant="label" color="secondary" numberOfLines={1}>
                {businessName}
              </Typography>
            </View>
          ) : null}
        </View>
        <Typography variant="bodySmall" color="secondary" numberOfLines={1}>
          {title}
        </Typography>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push('/manage')}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Manage: recipes, suppliers, customers, expenses and more"
          hitSlop={8}
        >
          <Icon name="settings-outline" size={22} color="secondary" />
        </Pressable>
        <Pressable
          onPress={() => router.push('/settings')}
          style={styles.avatar}
          accessibilityRole="button"
          accessibilityLabel="Open business profile and settings"
          hitSlop={8}
        >
          <Icon name="person" size={18} color="onBrand" />
        </Pressable>
      </View>
    </View>
  );
};

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 64,
      paddingHorizontal: theme.spacing.base,
      backgroundColor: colors.background.canvas,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: colors.scheme === 'dark' ? 0.4 : 0.04,
      shadowRadius: 8,
      elevation: 2,
      zIndex: 2,
    },
    left: { flex: 1, minWidth: 0, paddingRight: theme.spacing.sm },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    chip: {
      flexShrink: 1,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xxs,
      borderRadius: theme.radii.xs,
      backgroundColor: colors.background.surfaceTertiary,
    },
    actions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: theme.radii.full,
      backgroundColor: colors.brand.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default AppTopBar;
