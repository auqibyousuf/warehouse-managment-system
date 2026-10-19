import React from 'react';
import { Tabs, router } from 'expo-router';
import { AppTopBar, TabBar } from '../../components';
import { routeToTab, tabPath } from '../../navigation/routes';

const TITLES: Record<string, string> = {
  index: 'Dashboard',
  production: 'Production',
  inventory: 'Inventory',
  procure: 'Procure',
  ledger: 'Ledger',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: true,
        header: () => <AppTopBar title={TITLES[route.name] ?? ''} />,
      })}
      tabBar={({ state }) => (
        <TabBar
          activeTab={routeToTab(state.routes[state.index].name)}
          onTabChange={(tab) => router.navigate(tabPath(tab))}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="production" />
      <Tabs.Screen name="inventory" />
      <Tabs.Screen name="procure" />
      <Tabs.Screen name="ledger" />
    </Tabs>
  );
}
