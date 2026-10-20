import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { closeSheet, SheetName, SheetParams } from '../../navigation/sheets';
import { StartBatchPage } from '../../modules/production/components/StartBatchPage';
import { CompleteBatchPage } from '../../modules/production/components/CompleteBatchPage';
import { RecipePage } from '../../modules/production/components/RecipePage';
import { AddStockPage } from '../../modules/inventory/components/AddStockPage';
import { CountStockPage } from '../../modules/inventory/components/CountStockPage';
import { CreateIngredientModal } from '../../modules/inventory/components/CreateIngredientModal';
import { CreateSupplierModal } from '../../modules/inventory/components/CreateSupplierModal';
import { PurchaseDetailModal } from '../../modules/inventory/components/PurchaseDetailModal';
import { CreateInvoicePage } from '../../modules/sales/components/CreateInvoicePage';
import { ReceivePaymentPage } from '../../modules/sales/components/ReceivePaymentPage';
import { InvoiceDetailModal } from '../../modules/sales/components/InvoiceDetailModal';
import { AddCustomerPage } from '../../modules/customers/components/AddCustomerPage';
import { CustomerDetailModal } from '../../modules/customers/components/CustomerDetailModal';
import { AddExpensePage } from '../../modules/expenses/components/AddExpensePage';
import { EditSupplierPage } from '../../modules/inventory/components/EditSupplierPage';
import { EditStockItemPage } from '../../modules/inventory/components/EditStockItemPage';
import { EditProductPage } from '../../modules/inventory/components/EditProductPage';
import { EditCustomerPage } from '../../modules/customers/components/EditCustomerPage';
import { UseStockPage } from '../../modules/inventory/components/UseStockPage';
import { BatchDetailModal } from '../../modules/details/BatchDetailModal';
import { ProfitDetailModal } from '../../modules/details/ProfitDetailModal';
import { StockDetailModal } from '../../modules/details/StockDetailModal';
import { RecipeDetailModal } from '../../modules/details/RecipeDetailModal';
import { SupplierDetailModal } from '../../modules/details/SupplierDetailModal';
import { CompanyProfilePage } from '../../modules/business/components/CompanyProfilePage';

const onClose = closeSheet;

const SHEETS: Record<SheetName, (p: SheetParams) => React.ReactElement> = {
  start_batch: (p) => <StartBatchPage onClose={onClose} preselectedSetupId={p.setupId ?? null} />,
  complete_batch: (p) => <CompleteBatchPage onClose={onClose} batchId={p.batchId ?? null} />,
  create_setup: () => <RecipePage onClose={onClose} />,
  edit_setup: (p) => <RecipePage onClose={onClose} setupId={p.setupId ?? null} />,
  record_purchase: (p) => <AddStockPage onClose={onClose} preselectedItemId={p.itemId ?? null} />,
  use_stock: (p) => (
    <UseStockPage
      onClose={onClose}
      itemId={p.itemId ?? null}
      kind={p.kind === 'waste' ? 'waste' : 'usage'}
    />
  ),
  adjust_stock: (p) => <CountStockPage onClose={onClose} preselectedItemId={p.itemId ?? null} />,
  create_ingredient: () => <CreateIngredientModal visible onClose={onClose} />,
  create_supplier: () => <CreateSupplierModal visible onClose={onClose} />,
  purchase_detail: (p) => (
    <PurchaseDetailModal visible onClose={onClose} purchaseId={p.purchaseId ?? null} />
  ),
  create_sale: () => <CreateInvoicePage onClose={onClose} />,
  record_payment: (p) => (
    <ReceivePaymentPage
      onClose={onClose}
      preselectedCustomerId={p.customerId ?? null}
      preselectedInvoiceId={p.invoiceId ?? null}
    />
  ),
  invoice_detail: (p) => (
    <InvoiceDetailModal visible onClose={onClose} invoiceId={p.invoiceId ?? null} />
  ),
  create_customer: () => <AddCustomerPage onClose={onClose} />,
  customer_detail: (p) => (
    <CustomerDetailModal visible onClose={onClose} customerId={p.customerId ?? null} />
  ),
  create_expense: () => <AddExpensePage onClose={onClose} />,
  company_profile: () => <CompanyProfilePage onClose={onClose} />,
  batch_detail: (p) => <BatchDetailModal visible onClose={onClose} batchId={p.batchId ?? null} />,
  profit_detail: (p) => <ProfitDetailModal visible onClose={onClose} period={p.period ?? null} />,
  stock_detail: (p) => <StockDetailModal visible onClose={onClose} itemId={p.itemId ?? null} />,
  recipe_detail: (p) => <RecipeDetailModal visible onClose={onClose} setupId={p.setupId ?? null} />,
  supplier_detail: (p) => (
    <SupplierDetailModal visible onClose={onClose} supplierId={p.supplierId ?? null} />
  ),
  edit_customer: (p) => <EditCustomerPage onClose={onClose} customerId={p.customerId ?? null} />,
  edit_supplier: (p) => <EditSupplierPage onClose={onClose} supplierId={p.supplierId ?? null} />,
  edit_ingredient: (p) => <EditStockItemPage onClose={onClose} itemId={p.itemId ?? null} />,
  edit_product: (p) => <EditProductPage onClose={onClose} productId={p.productId ?? null} />,
};

export default function SheetRoute() {
  const { sheet, ...params } =
    useLocalSearchParams<Record<keyof SheetParams | 'sheet', string | undefined>>();
  const render = SHEETS[sheet as SheetName];
  return render ? render(params) : null;
}
