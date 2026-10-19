import React from 'react';
import { Tabs, router } from 'expo-router';
import { TabBar } from '../../components';
import { routeToTab, tabPath } from '../../navigation/routes';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
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
      <Tabs.Screen name="sales" />
      <Tabs.Screen name="business" />
    </Tabs>
  );
}
