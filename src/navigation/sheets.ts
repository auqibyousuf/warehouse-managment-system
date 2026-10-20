import { router } from 'expo-router';

/** Every bottom sheet in the app is a route: /sheets/<name>?<params>. */
export type SheetName =
  | 'start_batch'
  | 'complete_batch'
  | 'create_setup'
  | 'edit_setup'
  | 'record_purchase'
  | 'adjust_stock'
  | 'create_sale'
  | 'record_payment'
  | 'create_expense'
  | 'create_customer'
  | 'create_ingredient'
  | 'create_supplier'
  | 'invoice_detail'
  | 'purchase_detail'
  | 'customer_detail'
  | 'company_profile'
  | 'edit_customer'
  | 'edit_supplier'
  | 'edit_product'
  | 'use_stock'
  | 'batch_detail'
  | 'profit_detail'
  | 'stock_detail'
  | 'recipe_detail'
  | 'supplier_detail';

export interface SheetParams {
  setupId?: string;
  invoiceId?: string;
  purchaseId?: string;
  customerId?: string;
  supplierId?: string;
  productId?: string;
  itemId?: string;
  kind?: string;
  batchId?: string;
  period?: string;
}

interface OpenOptions {
  /** Swap the current sheet instead of stacking another one on top. */
  replace?: boolean;
}

export const openSheet = (name: SheetName, params: SheetParams = {}, options: OpenOptions = {}) => {
  const target = { pathname: '/sheets/[sheet]' as const, params: { sheet: name, ...params } };
  if (options.replace) router.replace(target);
  else router.push(target);
};

export const closeSheet = () => {
  if (router.canGoBack()) router.back();
  else router.replace('/');
};
