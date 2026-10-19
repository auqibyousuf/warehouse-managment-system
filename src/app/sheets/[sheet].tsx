import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { closeSheet, SheetName, SheetParams } from '../../navigation/sheets';
import { StartBatchPage } from '../../modules/production/components/StartBatchPage';
import { CreateSetupModal } from '../../modules/production/components/CreateSetupModal';
import { AddStockPage } from '../../modules/inventory/components/AddStockPage';
import { AdjustStockModal } from '../../modules/inventory/components/AdjustStockModal';
import { CreateIngredientModal } from '../../modules/inventory/components/CreateIngredientModal';
import { CreateSupplierModal } from '../../modules/inventory/components/CreateSupplierModal';
import { PurchaseDetailModal } from '../../modules/inventory/components/PurchaseDetailModal';
import { CreateInvoicePage } from '../../modules/sales/components/CreateInvoicePage';
import { RecordPaymentModal } from '../../modules/sales/components/RecordPaymentModal';
import { InvoiceDetailModal } from '../../modules/sales/components/InvoiceDetailModal';
import { CreateCustomerModal } from '../../modules/customers/components/CreateCustomerModal';
import { CustomerDetailModal } from '../../modules/customers/components/CustomerDetailModal';
import { RecordExpenseModal } from '../../modules/expenses/components/RecordExpenseModal';
import { EditSupplierModal } from '../../modules/inventory/components/EditSupplierModal';
import { EditProductModal } from '../../modules/inventory/components/EditProductModal';
import { EditCustomerModal } from '../../modules/customers/components/EditCustomerModal';
import { UseStockPage } from '../../modules/inventory/components/UseStockPage';
import { BatchDetailModal } from '../../modules/details/BatchDetailModal';
import { ProfitDetailModal } from '../../modules/details/ProfitDetailModal';
import { StockDetailModal } from '../../modules/details/StockDetailModal';
import { RecipeDetailModal } from '../../modules/details/RecipeDetailModal';
import { SupplierDetailModal } from '../../modules/details/SupplierDetailModal';
import { CompanyProfileModal } from '../../modules/business/components/CompanyProfileModal';

const onClose = closeSheet;

const SHEETS: Record<SheetName, (p: SheetParams) => React.ReactElement> = {
  start_batch: (p) => <StartBatchPage onClose={onClose} preselectedSetupId={p.setupId ?? null} />,
  create_setup: () => <CreateSetupModal visible onClose={onClose} />,
  record_purchase: (p) => <AddStockPage onClose={onClose} preselectedItemId={p.itemId ?? null} />,
  use_stock: (p) => (
    <UseStockPage
      onClose={onClose}
      itemId={p.itemId ?? null}
      kind={p.kind === 'waste' ? 'waste' : 'usage'}
    />
  ),
  adjust_stock: () => <AdjustStockModal visible onClose={onClose} />,
  create_ingredient: () => <CreateIngredientModal visible onClose={onClose} />,
  create_supplier: () => <CreateSupplierModal visible onClose={onClose} />,
  purchase_detail: (p) => (
    <PurchaseDetailModal visible onClose={onClose} purchaseId={p.purchaseId ?? null} />
  ),
  create_sale: () => <CreateInvoicePage onClose={onClose} />,
  record_payment: (p) => (
    <RecordPaymentModal
      visible
      onClose={onClose}
      preselectedCustomerId={p.customerId ?? null}
      preselectedInvoiceId={p.invoiceId ?? null}
    />
  ),
  invoice_detail: (p) => (
    <InvoiceDetailModal visible onClose={onClose} invoiceId={p.invoiceId ?? null} />
  ),
  create_customer: () => <CreateCustomerModal visible onClose={onClose} />,
  customer_detail: (p) => (
    <CustomerDetailModal visible onClose={onClose} customerId={p.customerId ?? null} />
  ),
  create_expense: () => <RecordExpenseModal visible onClose={onClose} />,
  company_profile: () => <CompanyProfileModal visible onClose={onClose} />,
  batch_detail: (p) => <BatchDetailModal visible onClose={onClose} batchId={p.batchId ?? null} />,
  profit_detail: (p) => <ProfitDetailModal visible onClose={onClose} period={p.period ?? null} />,
  stock_detail: (p) => <StockDetailModal visible onClose={onClose} itemId={p.itemId ?? null} />,
  recipe_detail: (p) => <RecipeDetailModal visible onClose={onClose} setupId={p.setupId ?? null} />,
  supplier_detail: (p) => (
    <SupplierDetailModal visible onClose={onClose} supplierId={p.supplierId ?? null} />
  ),
  edit_customer: (p) => (
    <EditCustomerModal visible onClose={onClose} customerId={p.customerId ?? null} />
  ),
  edit_supplier: (p) => (
    <EditSupplierModal visible onClose={onClose} supplierId={p.supplierId ?? null} />
  ),
  edit_product: (p) => (
    <EditProductModal visible onClose={onClose} productId={p.productId ?? null} />
  ),
};

export default function SheetRoute() {
  const { sheet, ...params } =
    useLocalSearchParams<Record<keyof SheetParams | 'sheet', string | undefined>>();
  const render = SHEETS[sheet as SheetName];
  return render ? render(params) : null;
}
