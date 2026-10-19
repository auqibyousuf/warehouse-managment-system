import { router } from 'expo-router';
import type { NavTabId } from '../components/composite/TabBar';

/** Bottom-tab id to route path. Dashboard is the index route. */
export const tabPath = (tab: NavTabId) => (tab === 'dashboard' ? '/' : (`/${tab}` as const));

export const goToTab = (tab: NavTabId) => router.navigate(tabPath(tab));

/** Route name (file name inside src/app/(tabs)) to bottom-tab id. */
export const routeToTab = (routeName: string): NavTabId =>
  routeName === 'index' ? 'dashboard' : (routeName as NavTabId);
