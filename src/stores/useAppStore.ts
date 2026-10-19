/**
 * BatchIQ - Global Client State Store
 * Powered by Zustand for reactive navigation, modal sheets, and quick-action filters.
 */

import { create } from 'zustand';


export type FilterPeriod = 'today' | 'this_week' | 'this_month' | 'all_time';

export interface BannerAlert {
  title?: string;
  message: string;
  variant: 'success' | 'warning' | 'danger' | 'info';
}

interface AppState {
  selectedPeriod: FilterPeriod;
  setSelectedPeriod: (period: FilterPeriod) => void;

  bannerAlert: BannerAlert | null;
  setBannerAlert: (alert: BannerAlert | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedPeriod: 'this_month',
  setSelectedPeriod: (period) => set({ selectedPeriod: period }),

  bannerAlert: null,
  setBannerAlert: (alert) => set({ bannerAlert: alert }),
}));
