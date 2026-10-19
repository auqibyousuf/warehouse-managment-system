/**
 * BatchIQ - Global Client State Store
 * Powered by Zustand for reactive navigation, modal sheets, and quick-action filters.
 */

import { create } from 'zustand';
import { NavTabId } from '../components/composite/TabBar';

export type ActiveModal =
  | null
  | 'start_batch'
  | 'create_setup'
  | 'record_purchase'
  | 'adjust_stock'
  | 'create_sale'
  | 'record_payment'
  | 'create_expense'
  | 'create_customer'
  | 'invoice_detail'
  | 'company_profile'
  | 'customer_detail'
  | 'purchase_detail'
  | 'create_ingredient'
  | 'create_supplier';



export type FilterPeriod = 'today' | 'this_week' | 'this_month' | 'all_time';

export interface BannerAlert {
  title?: string;
  message: string;
  variant: 'success' | 'warning' | 'danger' | 'info';
}

interface AppState {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;

  selectedPeriod: FilterPeriod;
  setSelectedPeriod: (period: FilterPeriod) => void;

  activeModal: ActiveModal;
  openModal: (modal: ActiveModal) => void;
  closeModal: () => void;

  selectedSetupId: string | null;
  setSelectedSetupId: (id: string | null) => void;

  selectedInvoiceId: string | null;
  setSelectedInvoiceId: (id: string | null) => void;

  selectedPurchaseId: string | null;
  setSelectedPurchaseId: (id: string | null) => void;

  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;

  bannerAlert: BannerAlert | null;
  setBannerAlert: (alert: BannerAlert | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  selectedPeriod: 'this_month',
  setSelectedPeriod: (period) => set({ selectedPeriod: period }),

  activeModal: null,
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () =>
    set({
      activeModal: null,
      selectedSetupId: null,
      selectedInvoiceId: null,
      selectedPurchaseId: null,
      selectedCustomerId: null,
    }),

  selectedSetupId: null,
  setSelectedSetupId: (id) => set({ selectedSetupId: id }),

  selectedInvoiceId: null,
  setSelectedInvoiceId: (id) => set({ selectedInvoiceId: id }),

  selectedPurchaseId: null,
  setSelectedPurchaseId: (id) => set({ selectedPurchaseId: id }),

  selectedCustomerId: null,
  setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),

  bannerAlert: null,
  setBannerAlert: (alert) => set({ bannerAlert: alert }),
}));
