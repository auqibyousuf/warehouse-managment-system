import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../stores/useAppStore';
import { theme } from '../theme';
import { TabBar, FeedbackBanner, Box } from '../components';

// Module Screens
import { DashboardScreen } from '../modules/dashboard/DashboardScreen';
import { ProductionScreen } from '../modules/production/ProductionScreen';
import { InventoryScreen } from '../modules/inventory/InventoryScreen';
import { SalesScreen } from '../modules/sales/SalesScreen';
import { MoreScreen } from '../modules/more/MoreScreen';

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

export const AppNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    activeTab,
    setActiveTab,
    activeModal,
    closeModal,
    selectedSetupId,
    selectedCustomerId,
    selectedInvoiceId,
    selectedPurchaseId,
    bannerAlert,
    setBannerAlert,
  } = useAppStore();

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'production':
        return <ProductionScreen />;
      case 'inventory':
        return <InventoryScreen />;
      case 'sales':
        return <SalesScreen />;
      case 'more':
        return <MoreScreen />;
      case 'dashboard':
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Global Alert Notification Banner */}
      {bannerAlert && (
        <Box paddingHorizontal="base" paddingTop="xs">
          <FeedbackBanner
            title={bannerAlert.title}
            message={bannerAlert.message}
            variant={bannerAlert.variant}
            onClose={() => setBannerAlert(null)}
          />
        </Box>
      )}

      {/* Main Screen View */}
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>

      {/* Bottom Navigation Tab Bar */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Global Modals for Fast Operations */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background.canvas,
  },
  screenContainer: {
    flex: 1,
  },
});

export default AppNavigator;
