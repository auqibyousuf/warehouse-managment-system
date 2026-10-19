import React, { useMemo, useState } from 'react';
import { Linking, Pressable, Share } from 'react-native';
import { openSheet } from '../../navigation/sheets';
import { theme, useColors } from '../../theme';
import { useMoney } from '../../hooks/useMoney';
import { useSalesInvoices } from '../../hooks/api/useSales';
import { useFactorySettings } from '../../hooks/api/useDashboard';
import { useAppStore } from '../../stores/useAppStore';
import { generateInvoicePDF, generateSalesSummaryPDF } from '../../utils/pdfGenerator';
import {
  Box,
  Stack,
  Row,
  Typography,
  Card,
  Button,
  Badge,
  ChipPicker,
  LoadingState,
  EmptyState,
  ScreenList,
  Icon,
} from '../../components';
import { SaleInvoice } from '../../types';

type InvoiceFilter = 'all' | 'unpaid' | 'paid';

const monthKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const daysUntil = (isoDate: string) =>
  Math.ceil((new Date(isoDate).getTime() - Date.now()) / 86_400_000);

/** Invoices & Receipts: bill a customer, share it, remind, record the payment. */
export const InvoicesScreen: React.FC = () => {
  const money = useMoney();
  const colors = useColors();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);
  const { data: settings } = useFactorySettings();
  const { data: invoices = [], isLoading, refetch, isRefetching } = useSalesInvoices();
  const [filter, setFilter] = useState<InvoiceFilter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const month = monthKey();
  const monthLabel = new Date().toLocaleString('en', { month: 'short', year: 'numeric' });

  const active = useMemo(() => invoices.filter((i) => i.paymentStatus !== 'cancelled'), [invoices]);
  const monthInvoices = useMemo(
    () => active.filter((i) => i.date.startsWith(month)),
    [active, month],
  );
  const billed = monthInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const received = monthInvoices.reduce((sum, i) => sum + i.amountPaid, 0);
  const awaiting = monthInvoices.reduce((sum, i) => sum + i.balanceDue, 0);
  const unpaidCount = monthInvoices.filter((i) => i.balanceDue > 0).length;

  const counts = {
    all: invoices.length,
    unpaid: active.filter((i) => i.balanceDue > 0).length,
    paid: active.filter((i) => i.paymentStatus === 'paid').length,
  };

  const visible = useMemo(() => {
    if (filter === 'unpaid') return active.filter((i) => i.balanceDue > 0);
    if (filter === 'paid') return active.filter((i) => i.paymentStatus === 'paid');
    return invoices;
  }, [filter, invoices, active]);

  const fail = (title: string, err: any) =>
    setBannerAlert({ title, message: err?.message || 'Something went wrong', variant: 'danger' });

  const sharePDF = async (invoice: SaleInvoice) => {
    try {
      setBusyId(invoice.id);
      await generateInvoicePDF(invoice, settings);
    } catch (err) {
      fail('Could not create the PDF', err);
    } finally {
      setBusyId(null);
    }
  };

  const sendReminder = async (invoice: SaleInvoice) => {
    const business = settings?.factoryName?.trim() || 'us';
    const message =
      `Hello ${invoice.customerName}, a friendly reminder: invoice #${invoice.invoiceNumber} ` +
      `dated ${invoice.date} has ${money(invoice.balanceDue)} pending. ` +
      `Please arrange the payment. Thank you, ${business}.`;
    const phone = (invoice.customerPhone ?? '').replace(/\D/g, '');
    try {
      if (phone.length >= 8) {
        await Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
      } else {
        await Share.share({ message });
      }
    } catch (err) {
      fail('Could not open the reminder', err);
    }
  };

  const downloadSummary = async () => {
    try {
      await generateSalesSummaryPDF(monthInvoices, settings, monthLabel);
    } catch (err) {
      fail('Could not create the summary', err);
    }
  };

  const statusBadge = (invoice: SaleInvoice) => {
    if (invoice.paymentStatus === 'cancelled')
      return <Badge label="Cancelled" variant="neutral" size="sm" />;
    if (invoice.paymentStatus === 'paid')
      return (
        <Badge label="Paid in full" variant="success" icon="checkmark-circle-outline" size="sm" />
      );
    if (invoice.dueDate) {
      const days = daysUntil(invoice.dueDate);
      return (
        <Badge
          label={days >= 0 ? `Due in ${days} days` : `Overdue ${-days} days`}
          variant={days >= 0 ? 'warning' : 'danger'}
          icon="time-outline"
          size="sm"
        />
      );
    }
    return (
      <Badge
        label={invoice.paymentStatus === 'partial' ? 'Part paid' : 'Unpaid'}
        variant="warning"
        icon="time-outline"
        size="sm"
      />
    );
  };

  const header = (
    <Stack gap="md" style={{ marginBottom: theme.spacing.md }}>
      <Card variant="elevated" padding="none">
        <Row
          justify="space-between"
          align="center"
          style={{
            paddingHorizontal: theme.spacing.base,
            paddingVertical: theme.spacing.sm,
            backgroundColor: colors.background.surfaceSecondary,
          }}
        >
          <Row gap="xs" align="center">
            <Icon name="calendar-outline" size={18} color="brandPrimary" />
            <Typography variant="title" color="primary">
              This month overview
            </Typography>
          </Row>
          <Typography variant="label" color="success">
            {monthLabel}
          </Typography>
        </Row>
        <Stack gap="sm" style={{ padding: theme.spacing.base }}>
          <Row justify="space-between" align="center">
            <Typography variant="bodyMedium" color="secondary">
              Total billed sales
            </Typography>
            <Typography variant="h1" color="primary" tabular>
              {money(billed)}
            </Typography>
          </Row>
          <Row gap="sm" align="stretch">
            <Box
              flex={1}
              style={{
                padding: theme.spacing.sm,
                borderRadius: theme.radii.sm,
                backgroundColor: colors.background.surfaceSecondary,
              }}
            >
              <Row gap="xxs" align="center">
                <Box
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.accent.warning,
                  }}
                />
                <Typography variant="label" color="secondary">
                  Awaiting payment
                </Typography>
              </Row>
              <Typography variant="dataLarge" color="warning" tabular>
                {money(awaiting)}
              </Typography>
              <Typography variant="bodySmall" color="secondary">
                {unpaidCount} invoice{unpaidCount === 1 ? '' : 's'} pending
              </Typography>
            </Box>
            <Box
              flex={1}
              style={{
                padding: theme.spacing.sm,
                borderRadius: theme.radii.sm,
                backgroundColor: colors.background.surfaceSecondary,
              }}
            >
              <Row gap="xxs" align="center">
                <Box
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.accent.success,
                  }}
                />
                <Typography variant="label" color="secondary">
                  Received
                </Typography>
              </Row>
              <Typography variant="dataLarge" color="success" tabular>
                {money(received)}
              </Typography>
              <Typography variant="bodySmall" color="secondary">
                {monthInvoices.length - unpaidCount} cleared
              </Typography>
            </Box>
          </Row>
        </Stack>
      </Card>

      <Button
        label="+ New Invoice / Dispatch Bill"
        variant="primary"
        size="lg"
        leftIcon="document-text-outline"
        fullWidth
        onPress={() => openSheet('create_sale')}
      />

      <ChipPicker
        variant="segmented"
        options={[
          { value: 'all', label: 'All', count: counts.all },
          { value: 'unpaid', label: 'Unpaid', count: counts.unpaid },
          { value: 'paid', label: 'Paid', count: counts.paid },
        ]}
        selected={filter}
        onSelect={(value) => setFilter(value as InvoiceFilter)}
      />
    </Stack>
  );

  return (
    <ScreenList
      header={header}
      data={visible}
      keyExtractor={(row) => row.id}
      placeholder={
        isLoading ? (
          <LoadingState message="Loading invoices..." />
        ) : visible.length === 0 ? (
          <EmptyState
            title="No invoices here"
            description="Create an invoice when you dispatch goods to a customer."
            actionLabel="New Invoice"
            onAction={() => openSheet('create_sale')}
          />
        ) : null
      }
      renderItem={({ item: invoice }) => {
        const unpaid = invoice.paymentStatus !== 'cancelled' && invoice.balanceDue > 0;
        return (
          <Card variant="elevated" padding="none">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Invoice ${invoice.invoiceNumber} details`}
              onPress={() => openSheet('invoice_detail', { invoiceId: invoice.id })}
            >
              <Row
                justify="space-between"
                align="flex-start"
                gap="sm"
                style={{ padding: theme.spacing.base, paddingBottom: theme.spacing.xs }}
              >
                <Box flex={1}>
                  <Typography variant="title" color="primary" numberOfLines={1}>
                    {invoice.customerName}
                  </Typography>
                  <Row gap="xs" align="center" style={{ marginTop: 2 }}>
                    <Typography variant="dataMedium" color="secondary">
                      {invoice.invoiceNumber.replace(/^[A-Z]+-\d{4}-/, '#')}
                    </Typography>
                    <Typography variant="bodySmall" color="secondary">
                      • {invoice.date}
                    </Typography>
                  </Row>
                </Box>
                {statusBadge(invoice)}
              </Row>

              <Stack
                gap="xs"
                style={{ paddingHorizontal: theme.spacing.base, paddingVertical: theme.spacing.xs }}
              >
                <Row gap="xs" align="center">
                  <Icon name="cube-outline" size={18} color="secondary" />
                  <Typography
                    variant="bodyMedium"
                    color="primary"
                    numberOfLines={1}
                    style={{ flex: 1 }}
                  >
                    {invoice.quantity || invoice.bagQuantity} {invoice.outputUnit || 'units'}{' '}
                    {invoice.productName}
                  </Typography>
                </Row>
                <Row justify="space-between" align="center">
                  <Typography variant="bodySmall" color="secondary">
                    Total bill
                  </Typography>
                  <Typography variant="dataLarge" color={unpaid ? 'warning' : 'primary'} tabular>
                    {money(invoice.totalAmount)}
                  </Typography>
                </Row>
              </Stack>
            </Pressable>

            <Row
              gap="sm"
              style={{
                padding: theme.spacing.base,
                paddingTop: theme.spacing.sm,
                backgroundColor: colors.background.surfaceSecondary,
              }}
            >
              {unpaid ? (
                <>
                  <Button
                    label="Send Reminder"
                    variant="secondary"
                    size="sm"
                    leftIcon="notifications-outline"
                    style={{ flex: 1 }}
                    onPress={() => sendReminder(invoice)}
                  />
                  <Button
                    label="Record Pay"
                    variant="primary"
                    size="sm"
                    leftIcon="cash-outline"
                    style={{ flex: 1 }}
                    onPress={() =>
                      openSheet('record_payment', {
                        invoiceId: invoice.id,
                        customerId: invoice.customerId,
                      })
                    }
                  />
                </>
              ) : (
                <Button
                  label="Share PDF"
                  variant="secondary"
                  size="sm"
                  leftIcon="share-outline"
                  style={{ flex: 1 }}
                  loading={busyId === invoice.id}
                  onPress={() => sharePDF(invoice)}
                />
              )}
            </Row>
          </Card>
        );
      }}
      footer={
        invoices.length > 0 ? (
          <Stack gap="sm" style={{ marginTop: theme.spacing.lg }}>
            <Button
              label={`Download ${monthLabel} Summary (PDF)`}
              variant="secondary"
              leftIcon="download-outline"
              fullWidth
              onPress={downloadSummary}
            />
          </Stack>
        ) : undefined
      }
      refreshing={isRefetching}
      onRefresh={refetch}
    />
  );
};

export default InvoicesScreen;
