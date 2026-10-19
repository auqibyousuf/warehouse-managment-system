import React from 'react';
import { useAppStore } from '../stores/useAppStore';

// Global Modals
import { StartRunModal } from '../modules/production/components/StartRunModal';
import { CreateSetupModal } from '../modules/production/components/CreateSetupModal';
import { RecordPurchaseModal } from '../modules/inventory/components/RecordPurchaseModal';
import { AdjustStockModal } from '../modules/inventory/components/AdjustStockModal';
import { CreateSaleModal } from '../modules/sales/components/CreateSaleModal';
import { RecordPaymentModal } from '../modules/sales/components/RecordPaymentModal';
import { CreateCustomerModal } from '../modules/customers/components/CreateCustomerModal';
import { RecordExpenseModal } from '../modules/expenses/components/RecordExpenseModal';
import { InvoiceDetailModal } from '../modules/sales/components/InvoiceDetailModal';
import { CompanyProfileModal } from '../modules/more/components/CompanyProfileModal';
import { CustomerDetailModal } from '../modules/customers/components/CustomerDetailModal';
import { PurchaseDetailModal } from '../modules/inventory/components/PurchaseDetailModal';

/**
 * Store-driven sheets that can be opened from any route.
 * Phase 2 of the router migration turns these into route-based sheets.
 */
export const GlobalModals: React.FC = () => {
  const {
    activeModal,
    closeModal,
    selectedSetupId,
    selectedCustomerId,
    selectedInvoiceId,
    selectedPurchaseId,
  } = useAppStore();

  return (
    <>
      <StartRunModal
        visible={activeModal === 'start_batch'}
        onClose={closeModal}
        preselectedSetupId={selectedSetupId}
      />

      <CreateSetupModal
        visible={activeModal === 'create_setup'}
        onClose={closeModal}
      />

      <RecordPurchaseModal
        visible={activeModal === 'record_purchase'}
        onClose={closeModal}
      />

      <AdjustStockModal
        visible={activeModal === 'adjust_stock'}
        onClose={closeModal}
      />

      <CreateSaleModal
        visible={activeModal === 'create_sale'}
        onClose={closeModal}
      />

      <RecordPaymentModal
        visible={activeModal === 'record_payment'}
        onClose={closeModal}
        preselectedCustomerId={selectedCustomerId}
        preselectedInvoiceId={selectedInvoiceId}
      />

      <CreateCustomerModal
        visible={activeModal === 'create_customer'}
        onClose={closeModal}
      />

      <RecordExpenseModal
        visible={activeModal === 'create_expense'}
        onClose={closeModal}
      />

      <InvoiceDetailModal
        visible={activeModal === 'invoice_detail'}
        onClose={closeModal}
        invoiceId={selectedInvoiceId}
      />

      <CompanyProfileModal
        visible={activeModal === 'company_profile'}
        onClose={closeModal}
      />

      <CustomerDetailModal
        visible={activeModal === 'customer_detail'}
        onClose={closeModal}
        customerId={selectedCustomerId}
      />

      <PurchaseDetailModal
        visible={activeModal === 'purchase_detail'}
        onClose={closeModal}
        purchaseId={selectedPurchaseId}
      />
    </>
  );
};
