import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tapSelection } from '../../utils/haptics';
import { theme } from '../../theme';
import { Typography } from '../primitives/Typography';
import { Icon } from '../primitives/Icon';
import { Ionicons } from '@expo/vector-icons';

export type NavTabId = 'dashboard' | 'production' | 'inventory' | 'sales' | 'more';

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
  { id: 'inventory', label: 'Stock', icon: 'cube-outline' },
  { id: 'sales', label: 'Sales', icon: 'receipt-outline' },
  { id: 'more', label: 'More', icon: 'ellipsis-horizontal-circle-outline' },
];

export const TabBar: React.FC<TabBarProps> = ({
  activeTab,
  onTabChange,
  tabs = defaultTabs,
}) => {
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
                  name={tab.icon}
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
                  color: isActive ? theme.colors.brand.primary : theme.colors.text.muted,
                  marginTop: 2,
                }}
              >
                {tab.label}
              </Typography>

              {isActive && <View style={styles.activeIndicator} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
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
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: theme.colors.status.error.bg,
    borderColor: theme.colors.status.error.text,
    borderWidth: 1,
    borderRadius: theme.radii.full,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 9,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 3,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: theme.colors.brand.primary,
  },
});

export default TabBar;
