import { openSheet } from '../../navigation/sheets';
import React, { useState } from 'react';
import { theme } from '../../theme';
import { useSalesInvoices, useCustomerPayments, useCancelInvoice } from '../../hooks/api/useSales';
import { usePurchases } from '../../hooks/api/useInventory';
import { useAppStore } from '../../stores/useAppStore';
import {
  ScreenContainer,
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
} from '../../components';
import { SaleInvoice, Purchase } from '../../types';

type SalesTab = 'invoices' | 'purchases' | 'tables' | 'payments';
type TableView = 'sold' | 'received';

export const SalesScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SalesTab>('invoices');
  const [tableView, setTableView] = useState<TableView>('sold');
  const [invoiceToCancel, setInvoiceToCancel] = useState<SaleInvoice | null>(null);

  const {
    data: invoices = [],
    isLoading: loadingInvoices,
    refetch: refetchInvoices,
    isRefetching: refetchingInvoices,
  } = useSalesInvoices();

  const {
    data: purchases = [],
    isLoading: loadingPurchases,
    refetch: refetchPurchases,
  } = usePurchases();

  const {
    data: payments = [],
    isLoading: loadingPayments,
    refetch: refetchPayments,
  } = useCustomerPayments();

  const cancelInvoiceMutation = useCancelInvoice();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const handleRefresh = async () => {
    await Promise.all([refetchInvoices(), refetchPurchases(), refetchPayments()]);
  };

  const handleOpenInvoiceDetail = (invoice: SaleInvoice) => {
    openSheet('invoice_detail', { invoiceId: invoice.id });
  };

  const handleOpenPurchaseDetail = (purchase: Purchase) => {
    openSheet('purchase_detail', { purchaseId: purchase.id });
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
      {/* Module Header - Anti-Clipping Spaced Layout */}
      <Box>
        <Typography variant="caption" color="muted">
          INVOICING, PURCHASES & DISPATCHES
        </Typography>
        <Typography variant="h1" weight="bold" color="brandDeep">
          Sales & Invoicing Hub
        </Typography>

        {/* Dedicated Action Button Bar */}
        <Row gap="sm" wrap style={{ marginTop: theme.spacing.md }}>
          <Button
            label="+ New Invoice"
            variant="primary"
            size="sm"
            leftIcon="receipt-outline"
            onPress={() => openSheet('create_sale')}
          />
          <Button
            label="+ Inward Bill"
            variant="subtle"
            size="sm"
            leftIcon="cart-outline"
            onPress={() => openSheet('record_purchase')}
          />
        </Row>
      </Box>

      {/* Financial Summary Strip */}
      <Card variant="flat" padding="compact">
        <Row justify="space-between">
          <Box>
            <Typography variant="caption" color="muted">
              Total Invoiced
            </Typography>
            <Typography variant="bodyMedium" weight="bold" color="primary">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="muted">
              Cash Collected
            </Typography>
            <Typography variant="bodyMedium" weight="bold" color="success">
              ₹{totalCollected.toLocaleString('en-IN')}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="muted">
              Total Dues Pending
            </Typography>
            <Typography variant="bodyMedium" weight="bold" color="warning">
              ₹{totalDues.toLocaleString('en-IN')}
            </Typography>
          </Box>
        </Row>
      </Card>

      {/* Navigation Switcher: Invoices, Purchases, Data Tables, Collections */}
      <ChipPicker
        options={[
          { value: 'invoices', label: 'Sales Invoices', count: invoices.length },
          { value: 'purchases', label: 'Purchase Bills', count: purchases.length },
          { value: 'tables', label: 'Items Data Table' },
          { value: 'payments', label: 'Payments Received', count: payments.length },
        ]}
        selected={activeTab}
        onSelect={(tab) => setActiveTab(tab as SalesTab)}
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
                description="Create a sales invoice to record finished feed dispatch to dairy farms or dealers."
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

  if (activeTab === 'purchases') {
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
                    Raw material inward bills and supplier payables.
                  </Typography>
                  <Button
                    label="+ Record Purchase"
                    variant="primary"
                    size="sm"
                    leftIcon="cart-outline"
                    onPress={() => openSheet('record_purchase')}
                  />
                </Row>
              </Stack>
            </Stack>
          }
          data={purchases}
          keyExtractor={(row) => row.id}
          placeholder={
            loadingPurchases ? (
              <LoadingState message="Loading inward purchases..." />
            ) : purchases.length === 0 ? (
              <EmptyState
                title="No Purchase Bills"
                description="Log inward raw materials and packaging deliveries to maintain accurate inventory."
                actionLabel="+ Record Purchase Bill"
                onAction={() => openSheet('record_purchase')}
              />
            ) : null
          }
          renderItem={({ item: pur }) => (
            <Card
              key={pur.id}
              variant="elevated"
              padding="normal"
              onPress={() => handleOpenPurchaseDetail(pur)}
            >
              <Row justify="space-between" align="flex-start" gap="sm">
                <Box flex={1}>
                  <Row gap="xs" align="center" wrap>
                    <Typography variant="title" weight="bold" color="primary">
                      {pur.purchaseNumber}
                    </Typography>
                    <Badge
                      label={pur.paymentStatus.toUpperCase()}
                      variant={
                        pur.paymentStatus === 'paid'
                          ? 'success'
                          : pur.paymentStatus === 'partial'
                            ? 'warning'
                            : 'danger'
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
                    {pur.supplierName}
                  </Typography>
                  <Typography variant="caption" color="muted">
                    Inward Date: {pur.date} • {pur.quantity.toLocaleString('en-IN')} {pur.unit} of{' '}
                    {pur.itemName}
                  </Typography>
                  {pur.billNumber && (
                    <Typography variant="caption" weight="semibold" color="primary">
                      Supplier Bill #{pur.billNumber}
                    </Typography>
                  )}
                </Box>

                <Box align="flex-end" style={{ minWidth: 90, flexShrink: 0 }}>
                  <Typography variant="bodyLarge" weight="bold" color="brandDeep">
                    ₹{pur.totalAmount.toLocaleString('en-IN')}
                  </Typography>
                  {pur.balanceDue > 0 && (
                    <Typography variant="caption" weight="semibold" color="warning">
                      Payable: ₹{pur.balanceDue.toLocaleString('en-IN')}
                    </Typography>
                  )}
                </Box>
              </Row>

              <Divider variant="subtle" spacing="sm" />

              <Row justify="space-between" align="center">
                <Typography variant="caption" color="secondary">
                  Paid: ₹{pur.amountPaid.toLocaleString('en-IN')}
                </Typography>
                <Button
                  label="View Voucher & PDF"
                  variant="ghost"
                  size="sm"
                  leftIcon="document-text-outline"
                  onPress={() => handleOpenPurchaseDetail(pur)}
                />
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

  return (
    <ScreenContainer refreshing={refetchingInvoices} onRefresh={handleRefresh}>
      <Stack gap="lg">
        {header}

        {/* 3. ITEMS DATA TABLES (SOLD ITEMS & RECEIVED ITEMS LEDGER) */}
        {activeTab === 'tables' && (
          <Stack gap="md">
            {/* Toggle Table Type */}
            <ChipPicker
              options={[
                { value: 'sold', label: 'Sold Items Table', count: invoices.length },
                { value: 'received', label: 'Received Items Table', count: purchases.length },
              ]}
              selected={tableView}
              onSelect={(v) => setTableView(v as TableView)}
            />

            {/* SOLD ITEMS LEDGER TABLE */}
            {tableView === 'sold' && (
              <Stack gap="sm">
                <Typography variant="bodySmall" color="secondary">
                  Complete line-item ledger of finished goods dispatched to clients.
                </Typography>

                {invoices.length === 0 ? (
                  <Card variant="flat" padding="normal">
                    <Typography variant="bodySmall" color="muted" align="center">
                      No sold items recorded yet.
                    </Typography>
                  </Card>
                ) : (
                  <Card variant="elevated" padding="compact">
                    {/* Table Header */}
                    <Row
                      justify="space-between"
                      style={{
                        paddingVertical: theme.spacing.sm,
                        paddingHorizontal: theme.spacing.sm,
                        backgroundColor: theme.colors.background.surfaceSecondary,
                        marginBottom: theme.spacing.xs,
                      }}
                    >
                      <Typography
                        variant="caption"
                        weight="bold"
                        color="muted"
                        style={{ width: 75 }}
                      >
                        DATE/INV
                      </Typography>
                      <Typography
                        variant="caption"
                        weight="bold"
                        color="muted"
                        style={{ flex: 1, paddingHorizontal: theme.spacing.xs }}
                      >
                        CUSTOMER & PRODUCT
                      </Typography>
                      <Typography
                        variant="caption"
                        weight="bold"
                        color="muted"
                        style={{ width: 65, textAlign: 'right' }}
                      >
                        QTY
                      </Typography>
                      <Typography
                        variant="caption"
                        weight="bold"
                        color="muted"
                        style={{ width: 75, textAlign: 'right' }}
                      >
                        TOTAL (₹)
                      </Typography>
                    </Row>

                    {/* Table Rows */}
                    {invoices.map((inv) => (
                      <Card
                        key={inv.id}
                        variant="flat"
                        padding="compact"
                        onPress={() => handleOpenInvoiceDetail(inv)}
                        style={{
                          marginVertical: theme.spacing.xxs,
                          borderBottomWidth: 1,
                          borderColor: theme.colors.border.default,
                        }}
                      >
                        <Row justify="space-between" align="center">
                          <Box style={{ width: 75 }}>
                            <Typography variant="caption" weight="bold" color="primary">
                              {inv.invoiceNumber}
                            </Typography>
                            <Typography variant="caption" color="muted">
                              {inv.date}
                            </Typography>
                          </Box>

                          <Box style={{ flex: 1, paddingHorizontal: theme.spacing.xs }}>
                            <Typography
                              variant="bodySmall"
                              weight="semibold"
                              color="primary"
                              numberOfLines={1}
                            >
                              {inv.customerName}
                            </Typography>
                            <Typography variant="caption" color="secondary" numberOfLines={1}>
                              {inv.productName}
                            </Typography>
                          </Box>

                          <Box style={{ width: 65, alignItems: 'flex-end' }}>
                            <Typography variant="bodySmall" weight="semibold" color="primary">
                              {inv.quantity || inv.bagQuantity}
                            </Typography>
                            <Typography variant="caption" color="muted">
                              {inv.outputUnit || 'bags'}
                            </Typography>
                          </Box>

                          <Box style={{ width: 75, alignItems: 'flex-end' }}>
                            <Typography variant="bodySmall" weight="bold" color="brandDeep">
                              ₹{inv.totalAmount.toLocaleString('en-IN')}
                            </Typography>
                            <Badge
                              label={inv.paymentStatus.toUpperCase()}
                              variant={
                                inv.paymentStatus === 'paid'
                                  ? 'success'
                                  : inv.paymentStatus === 'partial'
                                    ? 'warning'
                                    : 'danger'
                              }
                              size="sm"
                            />
                          </Box>
                        </Row>
                      </Card>
                    ))}
                  </Card>
                )}
              </Stack>
            )}

            {/* RECEIVED ITEMS LEDGER TABLE */}
            {tableView === 'received' && (
              <Stack gap="sm">
                <Typography variant="bodySmall" color="secondary">
                  Complete line-item ledger of raw ingredients & packaging received inward.
                </Typography>

                {purchases.length === 0 ? (
                  <Card variant="flat" padding="normal">
                    <Typography variant="bodySmall" color="muted" align="center">
                      No inward materials recorded yet.
                    </Typography>
                  </Card>
                ) : (
                  <Card variant="elevated" padding="compact">
                    {/* Table Header */}
                    <Row
                      justify="space-between"
                      style={{
                        paddingVertical: theme.spacing.sm,
                        paddingHorizontal: theme.spacing.sm,
                        backgroundColor: theme.colors.background.surfaceSecondary,
                        marginBottom: theme.spacing.xs,
                      }}
                    >
                      <Typography
                        variant="caption"
                        weight="bold"
                        color="muted"
                        style={{ width: 75 }}
                      >
                        DATE/BILL
                      </Typography>
                      <Typography
                        variant="caption"
                        weight="bold"
                        color="muted"
                        style={{ flex: 1, paddingHorizontal: theme.spacing.xs }}
                      >
                        SUPPLIER & ITEM
                      </Typography>
                      <Typography
                        variant="caption"
                        weight="bold"
                        color="muted"
                        style={{ width: 65, textAlign: 'right' }}
                      >
                        QTY
                      </Typography>
                      <Typography
                        variant="caption"
                        weight="bold"
                        color="muted"
                        style={{ width: 75, textAlign: 'right' }}
                      >
                        AMOUNT (₹)
                      </Typography>
                    </Row>

                    {/* Table Rows */}
                    {purchases.map((pur) => (
                      <Card
                        key={pur.id}
                        variant="flat"
                        padding="compact"
                        onPress={() => handleOpenPurchaseDetail(pur)}
                        style={{
                          marginVertical: theme.spacing.xxs,
                          borderBottomWidth: 1,
                          borderColor: theme.colors.border.default,
                        }}
                      >
                        <Row justify="space-between" align="center">
                          <Box style={{ width: 75 }}>
                            <Typography variant="caption" weight="bold" color="primary">
                              {pur.purchaseNumber}
                            </Typography>
                            <Typography variant="caption" color="muted">
                              {pur.date}
                            </Typography>
                          </Box>

                          <Box style={{ flex: 1, paddingHorizontal: theme.spacing.xs }}>
                            <Typography
                              variant="bodySmall"
                              weight="semibold"
                              color="primary"
                              numberOfLines={1}
                            >
                              {pur.supplierName}
                            </Typography>
                            <Typography variant="caption" color="secondary" numberOfLines={1}>
                              {pur.itemName}
                            </Typography>
                          </Box>

                          <Box style={{ width: 65, alignItems: 'flex-end' }}>
                            <Typography variant="bodySmall" weight="semibold" color="primary">
                              {pur.quantity.toLocaleString('en-IN')}
                            </Typography>
                            <Typography variant="caption" color="muted">
                              {pur.unit}
                            </Typography>
                          </Box>

                          <Box style={{ width: 75, alignItems: 'flex-end' }}>
                            <Typography variant="bodySmall" weight="bold" color="brandDeep">
                              ₹{pur.totalAmount.toLocaleString('en-IN')}
                            </Typography>
                            <Badge
                              label={pur.paymentStatus.toUpperCase()}
                              variant={
                                pur.paymentStatus === 'paid'
                                  ? 'success'
                                  : pur.paymentStatus === 'partial'
                                    ? 'warning'
                                    : 'danger'
                              }
                              size="sm"
                            />
                          </Box>
                        </Row>
                      </Card>
                    ))}
                  </Card>
                )}
              </Stack>
            )}
          </Stack>
        )}
      </Stack>
      {overlays}
    </ScreenContainer>
  );
};

export default SalesScreen;
