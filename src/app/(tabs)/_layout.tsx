import React from 'react';
import { Tabs, router } from 'expo-router';
import { AppTopBar, TabBar } from '../../components';
import { routeToTab, tabPath } from '../../navigation/routes';

const TITLES: Record<string, string> = {
  index: 'Overview',
  stock: 'Stock & Materials',
  invoices: 'Invoices & Receipts',
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
      <Tabs.Screen name="stock" />
      <Tabs.Screen name="invoices" />
    </Tabs>
  );
}
