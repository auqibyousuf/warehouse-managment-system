import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tapSelection } from '../../utils/haptics';
import { theme, useColors, ColorTokens } from '../../theme';
import { Typography } from '../primitives/Typography';
import { Icon } from '../primitives/Icon';
import { Ionicons } from '@expo/vector-icons';

export type NavTabId = 'dashboard' | 'production' | 'inventory' | 'procure' | 'ledger';

export interface TabItem {
  id: NavTabId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  badgeCount?: number;
}

export interface TabBarProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  tabs?: TabItem[];
}

export const defaultTabs: TabItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
  { id: 'production', label: 'Production', icon: 'construct-outline' },
  { id: 'inventory', label: 'Inventory', icon: 'cube-outline' },
  { id: 'procure', label: 'Procure', icon: 'cart-outline' },
  { id: 'ledger', label: 'Ledger', icon: 'receipt-outline' },
];

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange, tabs = defaultTabs }) => {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, theme.spacing.xs),
          height: theme.spacing.layout.bottomNavHeight + Math.max(insets.bottom, 0),
        },
      ]}
    >
      <View style={styles.tabsRow} accessibilityRole="tablist">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <Pressable
              key={tab.id}
              onPress={() => {
                tapSelection();
                onTabChange(tab.id);
              }}
              style={styles.tabButton}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isActive }}
            >
              <View style={styles.iconContainer}>
                <Icon
                  name={isActive ? (tab.icon.replace('-outline', '') as typeof tab.icon) : tab.icon}
                  size="md"
                  color={isActive ? 'brandPrimary' : 'muted'}
                />
                {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                  <View style={styles.badge}>
                    <Typography variant="badgeText" color="onBrand" style={styles.badgeText}>
                      {tab.badgeCount > 99 ? '99+' : tab.badgeCount}
                    </Typography>
                  </View>
                )}
              </View>

              <Typography
                variant="caption"
                weight={isActive ? 'bold' : 'medium'}
                style={{
                  color: isActive ? colors.brand.primary : colors.text.muted,
                  marginTop: theme.spacing.xxs,
                }}
              >
                {tab.label}
              </Typography>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
      ...theme.shadows.card,
    },
    tabsRow: {
      flexDirection: 'row',
      height: theme.spacing.layout.bottomNavHeight,
      alignItems: 'center',
      justifyContent: 'space-around',
    },
    tabButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      position: 'relative',
    },
    iconContainer: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      width: 40,
      height: 28,
    },
    badge: {
      position: 'absolute',
      top: -4,
      right: -10,
      backgroundColor: colors.status.error.bg,
      borderColor: colors.status.error.text,
      borderWidth: 1,
      borderRadius: theme.radii.full,
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: theme.spacing.hairline,
    },
    badgeText: {
      fontSize: theme.typography.fontSizes.xxs,
    },
    activeIndicator: {
      position: 'absolute',
      top: 0,
      width: 28,
      height: 3,
      borderBottomLeftRadius: 2,
      borderBottomRightRadius: 2,
      backgroundColor: colors.brand.primary,
    },
  });

export default TabBar;
