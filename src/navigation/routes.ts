import { router } from 'expo-router';
import type { NavTabId } from '../components/composite/TabBar';

/** Bottom-tab id to route path. Home is the index route. */
export const tabPath = (tab: NavTabId) => (tab === 'home' ? '/' : (`/${tab}` as const));

export const goToTab = (tab: NavTabId) => router.navigate(tabPath(tab));

/** Route name (file name inside src/app/(tabs)) to bottom-tab id. */
export const routeToTab = (routeName: string): NavTabId =>
  routeName === 'index' ? 'home' : (routeName as NavTabId);

/** Screens reached from the Manage list (stack routes, no tab bar). */
export type ManageRoute =
  | '/recipes'
  | '/suppliers'
  | '/customers'
  | '/expenses'
  | '/movements'
  | '/ledger'
  | '/settings';

export const openManage = (route: ManageRoute) => router.push(route);
