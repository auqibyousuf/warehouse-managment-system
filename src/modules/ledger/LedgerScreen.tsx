import { openSheet } from '../../navigation/sheets';
import React, { useState } from 'react';
import { theme } from '../../theme';
import { useSalesInvoices, useCustomerPayments, useCancelInvoice } from '../../hooks/api/useSales';
import { useCustomers } from '../../hooks/api/useCustomers';
import { useExpenses } from '../../hooks/api/useExpenses';
import { useAppStore } from '../../stores/useAppStore';
import {
  Box,
  Stack,
  Row,
  Typography,
  Card,
  Button,
  Badge,
  ListItem,
  Divider,
  ConfirmDialog,
  ChipPicker,
  LoadingState,
  EmptyState,
  ScreenList,
  InsetStats,
} from '../../components';
import { SaleInvoice, Customer } from '../../types';

type LedgerTab = 'invoices' | 'payments' | 'customers' | 'expenses';

export const LedgerScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LedgerTab>('invoices');
  const [invoiceToCancel, setInvoiceToCancel] = useState<SaleInvoice | null>(null);

  const {
    data: invoices = [],
    isLoading: loadingInvoices,
    refetch: refetchInvoices,
    isRefetching: refetchingInvoices,
  } = useSalesInvoices();

  const { data: customers = [], isLoading: loadingCustomers } = useCustomers();
  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses();

  const handleCollectPayment = (customer: Customer) => {
    openSheet('record_payment', { customerId: customer.id });
  };

  const {
    data: payments = [],
    isLoading: loadingPayments,
    refetch: refetchPayments,
  } = useCustomerPayments();

  const cancelInvoiceMutation = useCancelInvoice();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const handleRefresh = async () => {
    await Promise.all([refetchInvoices(), refetchPayments()]);
  };

  const handleOpenInvoiceDetail = (invoice: SaleInvoice) => {
    openSheet('invoice_detail', { invoiceId: invoice.id });
  };

  const handleRecordPayment = (invoice: SaleInvoice) => {
    openSheet('record_payment', { invoiceId: invoice.id, customerId: invoice.customerId });
  };

  const handleConfirmCancel = async () => {
    if (!invoiceToCancel) return;
    try {
      await cancelInvoiceMutation.mutateAsync({
        invoiceId: invoiceToCancel.id,
        reason: 'Customer cancelled order or invoice correction',
      });
      setBannerAlert({
        title: 'Invoice Cancelled',
        message: `Cancelled ${invoiceToCancel.invoiceNumber}. Finished goods (${invoiceToCancel.quantity || invoiceToCancel.bagQuantity} ${invoiceToCancel.outputUnit || 'units'}) returned to inventory.`,
        variant: 'warning',
      });
      setInvoiceToCancel(null);
    } catch (err: any) {
      setBannerAlert({
        title: 'Cancellation Error',
        message: err.message,
        variant: 'danger',
      });
    }
  };

  const totalRevenue = invoices
    .filter((i) => i.paymentStatus !== 'cancelled')
    .reduce((acc, i) => acc + i.totalAmount, 0);

  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalDues = invoices
    .filter((i) => i.paymentStatus !== 'cancelled')
    .reduce((acc, i) => acc + i.balanceDue, 0);

  const header = (
    <>
      <Row gap="sm" wrap>
        <Button
          label="New Invoice"
          variant="primary"
          leftIcon="receipt-outline"
          onPress={() => openSheet('create_sale')}
        />
        <Button
          label="Receive Payment"
          variant="secondary"
          leftIcon="cash-outline"
          onPress={() => openSheet('record_payment')}
        />
      </Row>

      <InsetStats
        stats={[
          { label: 'Invoiced', value: `₹${totalRevenue.toLocaleString('en-IN')}` },
          {
            label: 'Collected',
            value: `₹${totalCollected.toLocaleString('en-IN')}`,
            valueColor: 'success',
          },
          {
            label: 'Dues',
            value: `₹${totalDues.toLocaleString('en-IN')}`,
            valueColor: 'warning',
          },
        ]}
      />

      {/* Navigation Switcher: Invoices, Purchases, Data Tables, Collections */}
      <ChipPicker
        options={[
          { value: 'invoices', label: 'Sales Invoices', count: invoices.length },
          { value: 'payments', label: 'Payments', count: payments.length },
          { value: 'customers', label: 'Customers', count: customers.length },
          { value: 'expenses', label: 'Expenses', count: expenses.length },
        ]}
        selected={activeTab}
        onSelect={(tab) => setActiveTab(tab as LedgerTab)}
      />
    </>
  );

  const overlays = (
    <>
      {/* Controlled Invoice Cancellation Dialog */}
      <ConfirmDialog
        visible={!!invoiceToCancel}
        onClose={() => setInvoiceToCancel(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Sales Invoice?"
        message={`Are you sure you want to cancel invoice ${invoiceToCancel?.invoiceNumber}? This will return ${invoiceToCancel?.quantity || invoiceToCancel?.bagQuantity} ${invoiceToCancel?.outputUnit || 'units'} of ${invoiceToCancel?.productName} to inventory and reverse customer dues.`}
        confirmLabel="Confirm Cancellation"
        cancelLabel="Keep Invoice"
        isDestructive
        loading={cancelInvoiceMutation.isPending}
      />
    </>
  );

  if (activeTab === 'invoices') {
    return (
      <>
        <ScreenList
          header={
            <Stack gap="lg" style={{ marginBottom: theme.spacing.md }}>
              {header}
            </Stack>
          }
          data={invoices}
          keyExtractor={(row) => row.id}
          placeholder={
            loadingInvoices ? (
              <LoadingState message="Loading sales invoices..." />
            ) : invoices.length === 0 ? (
              <EmptyState
                title="No Invoices Yet"
                description="Create a sales invoice to record a dispatch to a customer."
                actionLabel="+ Create Sale Invoice"
                onAction={() => openSheet('create_sale')}
              />
            ) : null
          }
          renderItem={({ item: inv }) => (
            <Card
              key={inv.id}
              variant={inv.paymentStatus === 'cancelled' ? 'flat' : 'elevated'}
              padding="normal"
              onPress={() => handleOpenInvoiceDetail(inv)}
              style={{
                opacity: inv.paymentStatus === 'cancelled' ? 0.75 : 1,
              }}
            >
              <Row justify="space-between" align="flex-start" gap="sm">
                <Box flex={1} style={{ marginRight: theme.spacing.sm }}>
                  <Row gap="xs" align="center" wrap>
                    <Typography variant="title" weight="bold" color="primary">
                      {inv.invoiceNumber}
                    </Typography>
                    <Badge
                      label={inv.paymentStatus.toUpperCase()}
                      variant={
                        inv.paymentStatus === 'paid'
                          ? 'success'
                          : inv.paymentStatus === 'partial'
                            ? 'warning'
                            : inv.paymentStatus === 'cancelled'
                              ? 'danger'
                              : 'neutral'
                      }
                      size="sm"
                    />
                  </Row>
                  <Typography
                    variant="bodyMedium"
                    weight="semibold"
                    color="secondary"
                    style={{ marginTop: theme.spacing.xxs }}
                  >
                    {inv.customerName}
                  </Typography>
                  <Typography variant="caption" color="muted">
                    Date: {inv.date} • {inv.quantity || inv.bagQuantity} {inv.outputUnit || 'units'}{' '}
                    ({inv.productName})
                  </Typography>
                </Box>

                {/* Total Invoiced Amount */}
                <Box align="flex-end" style={{ minWidth: 90, flexShrink: 0 }}>
                  <Typography variant="bodyLarge" weight="bold" color="brandDeep">
                    ₹{inv.totalAmount.toLocaleString('en-IN')}
                  </Typography>
                  {inv.balanceDue > 0 && (
                    <Typography variant="caption" weight="semibold" color="warning">
                      Due: ₹{inv.balanceDue.toLocaleString('en-IN')}
                    </Typography>
                  )}
                </Box>
              </Row>

              <Divider variant="subtle" spacing="sm" />

              {/* Payment Progress */}
              <Row justify="space-between" align="center">
                <Typography variant="caption" color="secondary">
                  Paid: ₹{inv.amountPaid.toLocaleString('en-IN')}
                </Typography>
                <Typography
                  variant="caption"
                  weight="bold"
                  color={inv.balanceDue > 0 ? 'warning' : 'success'}
                >
                  {inv.balanceDue > 0
                    ? `Outstanding: ₹${inv.balanceDue.toLocaleString('en-IN')}`
                    : 'Fully Settled'}
                </Typography>
              </Row>

              {/* Quick Action Footer */}
              <Row
                gap="sm"
                justify="space-between"
                align="center"
                style={{ marginTop: theme.spacing.smd }}
              >
                <Button
                  label="View & PDF"
                  variant="ghost"
                  size="sm"
                  leftIcon="document-text-outline"
                  onPress={() => handleOpenInvoiceDetail(inv)}
                />

                {inv.paymentStatus !== 'cancelled' && inv.balanceDue > 0 && (
                  <Button
                    label="Receive Payment"
                    variant="primary"
                    size="sm"
                    leftIcon="cash-outline"
                    onPress={() => handleRecordPayment(inv)}
                  />
                )}
              </Row>
            </Card>
          )}
          refreshing={refetchingInvoices}
          onRefresh={handleRefresh}
        />
        {overlays}
      </>
    );
  }

  if (activeTab === 'customers') {
    return (
      <>
        <ScreenList
          header={
            <Stack gap="lg" style={{ marginBottom: theme.spacing.md }}>
              {header}
              <Stack gap="md">
                {' '}
                <Row justify="space-between" align="center">
                  <Typography variant="bodySmall" color="secondary">
                    Everyone you sell to, with what they owe you.
                  </Typography>
                  <Button
                    label="+ Add Customer"
                    variant="primary"
                    size="sm"
                    leftIcon="person-add-outline"
                    onPress={() => openSheet('create_customer')}
                  />
                </Row>
              </Stack>
            </Stack>
          }
          data={customers}
          keyExtractor={(row) => row.id}
          placeholder={
            loadingCustomers ? (
              <LoadingState message="Loading customers ledger..." />
            ) : customers.length === 0 ? (
              <EmptyState
                title="No Customers Yet"
                description="Register your buyers to track what they owe you."
                actionLabel="+ Add Customer"
                onAction={() => openSheet('create_customer')}
              />
            ) : null
          }
          renderItem={({ item: c }) => (
            <Card
              key={c.id}
              variant="elevated"
              padding="normal"
              onPress={() => {
                openSheet('customer_detail', { customerId: c.id });
              }}
            >
              <Row justify="space-between" align="flex-start">
                <Box flex={1}>
                  <Typography variant="title" weight="bold" color="primary">
                    {c.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="muted"
                    style={{ marginTop: theme.spacing.xxs }}
                  >
                    Phone: {c.phone} • Address: {c.address}
                  </Typography>
                  {c.gstin && (
                    <Typography variant="caption" weight="semibold" color="secondary">
                      GSTIN: {c.gstin}
                    </Typography>
                  )}
                </Box>

                <Box align="flex-end">
                  <Typography
                    variant="bodyLarge"
                    weight="bold"
                    color={c.outstandingBalance > 0 ? 'warning' : 'success'}
                  >
                    ₹{c.outstandingBalance.toLocaleString('en-IN')}
                  </Typography>
                  <Badge
                    label={c.outstandingBalance > 0 ? 'DUES PENDING' : 'ALL CLEAR'}
                    variant={c.outstandingBalance > 0 ? 'warning' : 'success'}
                    size="sm"
                  />
                </Box>
              </Row>

              <Divider variant="subtle" spacing="sm" />

              <Row justify="space-between" align="center">
                <Button
                  label="View Ledger"
                  variant="ghost"
                  size="sm"
                  leftIcon="person-outline"
                  onPress={() => {
                    openSheet('customer_detail', { customerId: c.id });
                  }}
                />

                {c.outstandingBalance > 0 && (
                  <Button
                    label="Receive Payment"
                    variant="primary"
                    size="sm"
                    leftIcon="cash-outline"
                    onPress={() => handleCollectPayment(c)}
                  />
                )}
              </Row>
            </Card>
          )}
        />
        {overlays}
      </>
    );
  }

  if (activeTab === 'expenses') {
    return (
      <>
        <ScreenList
          header={
            <Stack gap="lg" style={{ marginBottom: theme.spacing.md }}>
              {header}
              <Stack gap="md">
                {' '}
                <Row justify="space-between" align="center">
                  <Typography variant="bodySmall" color="secondary">
                    Factory utilities, labour wages, delivery fuel, and machine upkeep.
                  </Typography>
                  <Button
                    label="+ Record Expense"
                    variant="primary"
                    size="sm"
                    leftIcon="add-circle-outline"
                    onPress={() => openSheet('create_expense')}
                  />
                </Row>
              </Stack>
            </Stack>
          }
          data={expenses}
          keyExtractor={(row) => row.id}
          placeholder={
            loadingExpenses ? (
              <LoadingState message="Loading factory expenses..." />
            ) : expenses.length === 0 ? (
              <EmptyState
                title="No Expenses Recorded"
                description="Log operating costs to track realistic factory profitability."
                actionLabel="+ Record Expense"
                onAction={() => openSheet('create_expense')}
              />
            ) : null
          }
          renderItem={({ item: e }) => (
            <Card variant="elevated" padding="compact">
              <ListItem
                key={e.id}
                title={e.description}
                subtitle={`Category: ${e.category.toUpperCase()} • Voucher #${e.expenseNumber}`}
                meta={`Date: ${e.date}`}
                value={`₹${e.amount.toLocaleString('en-IN')}`}
                valueColor="error"
                badge={{
                  label: e.category.toUpperCase(),
                  variant:
                    e.category === 'labour'
                      ? 'forest'
                      : e.category === 'electricity'
                        ? 'warning'
                        : 'neutral',
                }}
              />
            </Card>
          )}
        />
        {overlays}
      </>
    );
  }

  if (activeTab === 'payments') {
    return (
      <>
        <ScreenList
          header={
            <Stack gap="lg" style={{ marginBottom: theme.spacing.md }}>
              {header}
              <Stack gap="md">
                {' '}
                <Typography variant="bodySmall" color="secondary">
                  Customer collections ledger and payment receipts.
                </Typography>
              </Stack>
            </Stack>
          }
          data={payments}
          keyExtractor={(row) => row.id}
          placeholder={
            loadingPayments ? (
              <LoadingState message="Loading payment records..." />
            ) : payments.length === 0 ? (
              <EmptyState
                title="No Payments Recorded"
                description="Payments received against invoices will appear here."
                actionLabel="+ Receive Payment"
                onAction={() => openSheet('record_payment')}
              />
            ) : null
          }
          renderItem={({ item: p }) => (
            <Card variant="elevated" padding="compact">
              <ListItem
                key={p.id}
                title={p.customerName}
                subtitle={`Receipt #${p.paymentNumber} • Mode: ${p.paymentMethod.toUpperCase()}`}
                meta={`${p.date} • ${p.notes || 'Payment credited'}`}
                value={`₹${p.amount.toLocaleString('en-IN')}`}
                valueColor="success"
                badge={{
                  label: p.paymentMethod.toUpperCase(),
                  variant: 'forest',
                }}
              />
            </Card>
          )}
          refreshing={refetchingInvoices}
          onRefresh={handleRefresh}
        />
        {overlays}
      </>
    );
  }

  return null;
};

export default LedgerScreen;
