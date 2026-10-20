import React from 'react';
import { Tabs, router } from 'expo-router';
import { AppTopBar, TabBar, defaultTabs } from '../../components';
import { routeToTab, tabPath } from '../../navigation/routes';
import { useProductionBatches } from '../../hooks/api/useProduction';

const TITLES: Record<string, string> = {
  index: 'Overview',
  batches: 'Batches',
  stock: 'Stock & Materials',
  invoices: 'Invoices & Receipts',
};

export default function TabsLayout() {
  const { data: batches = [] } = useProductionBatches();
  const running = batches.filter((b) => b.status === 'in_progress').length;
  const tabs = defaultTabs.map((t) => (t.id === 'batches' ? { ...t, badgeCount: running } : t));
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: true,
        header: () => <AppTopBar title={TITLES[route.name] ?? ''} />,
      })}
      tabBar={({ state }) => (
        <TabBar
          tabs={tabs}
          activeTab={routeToTab(state.routes[state.index].name)}
          onTabChange={(tab) => router.navigate(tabPath(tab))}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="batches" />
      <Tabs.Screen name="stock" />
      <Tabs.Screen name="invoices" />
    </Tabs>
  );
}
