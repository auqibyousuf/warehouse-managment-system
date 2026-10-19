import { useMoney } from '../../../hooks/useMoney';
import { openSheet } from '../../../navigation/sheets';
import { theme, useColors } from '../../../theme';
import React, { useState } from 'react';
import { useSalesInvoices, useCancelInvoice } from '../../../hooks/api/useSales';
import { useFactorySettings } from '../../../hooks/api/useDashboard';
import { useAppStore } from '../../../stores/useAppStore';
import { generateInvoicePDF } from '../../../utils/pdfGenerator';
import {
  Modal,
  Stack,
  Row,
  Box,
  Typography,
  Card,
  Badge,
  Button,
  Divider,
  ConfirmDialog,
} from '../../../components';

export interface InvoiceDetailModalProps {
  visible: boolean;
  onClose: () => void;
  invoiceId?: string | null;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  visible,
  onClose,
  invoiceId,
}) => {
  const money = useMoney();
  const colors = useColors();
  const [downloading, setDownloading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { data: invoices = [] } = useSalesInvoices();
  const { data: settings } = useFactorySettings();
  const cancelInvoiceMutation = useCancelInvoice();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const invoice = invoices.find((inv) => inv.id === invoiceId);

  if (!invoice) {
    return null;
  }

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      await generateInvoicePDF(invoice, settings);
      setBannerAlert({
        title: 'PDF Invoice Generated',
        message: `Invoice ${invoice.invoiceNumber} is ready for sharing or printing.`,
        variant: 'success',
      });
    } catch (err: any) {
      setBannerAlert({
        title: 'PDF Generation Error',
        message: err.message || 'Could not create PDF document',
        variant: 'danger',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleReceivePayment = () => {
    openSheet(
      'record_payment',
      { invoiceId: invoice.id, customerId: invoice.customerId },
      { replace: true },
    );
  };

  const handleConfirmCancel = async () => {
    try {
      await cancelInvoiceMutation.mutateAsync({
        invoiceId: invoice.id,
        reason: 'Customer cancelled or invoice adjustment',
      });
      setBannerAlert({
        title: 'Invoice Cancelled',
        message: `Cancelled ${invoice.invoiceNumber}. Stock restored to warehouse and customer dues reversed.`,
        variant: 'warning',
      });
      setShowCancelConfirm(false);
      onClose();
    } catch (err: any) {
      setBannerAlert({
        title: 'Cancellation Error',
        message: err.message || 'Failed to cancel invoice',
        variant: 'danger',
      });
    }
  };

  const statusVariant =
    invoice.paymentStatus === 'paid'
      ? 'success'
      : invoice.paymentStatus === 'partial'
        ? 'warning'
        : invoice.paymentStatus === 'cancelled'
          ? 'danger'
          : 'neutral';

  return (
    <>
      <Modal
        visible={visible}
        onClose={onClose}
        title={`Tax Invoice ${invoice.invoiceNumber}`}
        subtitle={`Issued on ${invoice.date}`}
        primaryAction={{
          label: downloading ? 'Generating PDF...' : 'Download & Share PDF',
          onPress: handleDownloadPDF,
          loading: downloading,
        }}
        secondaryAction={{
          label: 'Close',
          onPress: onClose,
        }}
      >
        <Stack gap="md">
          {/* Status Header Banner */}
          <Card variant="flat" padding="compact">
            <Row justify="space-between" align="center">
              <Box>
                <Typography variant="caption" color="muted">
                  PAYMENT STATUS
                </Typography>
                <Badge
                  label={invoice.paymentStatus.toUpperCase()}
                  variant={statusVariant}
                  size="md"
                />
              </Box>
              <Box align="flex-end">
                <Typography variant="caption" color="muted">
                  TOTAL VALUE
                </Typography>
                <Typography variant="h2" weight="bold" color="brandDeep">
                  {money(invoice.totalAmount)}
                </Typography>
              </Box>
            </Row>
          </Card>

          {/* Customer Details */}
          <Card variant="elevated" padding="normal">
            <Typography
              variant="title"
              weight="bold"
              color="primary"
              style={{ marginBottom: theme.spacing.xsm }}
            >
              Billed To (Customer)
            </Typography>
            <Typography variant="bodyMedium" weight="semibold" color="secondary">
              {invoice.customerName}
            </Typography>
            {invoice.customerAddress && (
              <Typography variant="caption" color="muted" style={{ marginTop: theme.spacing.xxs }}>
                Address: {invoice.customerAddress}
              </Typography>
            )}
            {invoice.customerPhone && (
              <Typography variant="caption" color="muted">
                Phone: {invoice.customerPhone}
              </Typography>
            )}
            {invoice.customerGstin && (
              <Typography
                variant="caption"
                weight="semibold"
                color="secondary"
                style={{ marginTop: theme.spacing.xxs }}
              >
                GSTIN: {invoice.customerGstin}
              </Typography>
            )}
          </Card>

          {/* Itemized Line Items Table */}
          <Card variant="elevated" padding="normal">
            <Typography
              variant="title"
              weight="bold"
              color="primary"
              style={{ marginBottom: theme.spacing.sm }}
            >
              Itemized Breakdown
            </Typography>

            <Row
              justify="space-between"
              style={{
                paddingBottom: theme.spacing.xsm,
                borderBottomWidth: 1,
                borderColor: colors.border.default,
              }}
            >
              <Typography variant="caption" weight="bold" color="muted" style={{ flex: 2 }}>
                ITEM DESCRIPTION
              </Typography>
              <Typography
                variant="caption"
                weight="bold"
                color="muted"
                style={{ width: 60, textAlign: 'center' }}
              >
                QTY
              </Typography>
              <Typography
                variant="caption"
                weight="bold"
                color="muted"
                style={{ width: 70, textAlign: 'right' }}
              >
                RATE
              </Typography>
              <Typography
                variant="caption"
                weight="bold"
                color="muted"
                style={{ width: 80, textAlign: 'right' }}
              >
                AMOUNT
              </Typography>
            </Row>

            <Row
              justify="space-between"
              align="center"
              style={{ paddingVertical: theme.spacing.smd }}
            >
              <Box style={{ flex: 2 }}>
                <Typography variant="bodySmall" weight="bold" color="primary">
                  {invoice.productName}
                </Typography>
                <Typography variant="caption" color="muted">
                  Unit: {invoice.outputUnit || 'bags'}
                </Typography>
              </Box>
              <Typography
                variant="bodySmall"
                weight="semibold"
                color="primary"
                style={{ width: 60, textAlign: 'center' }}
              >
                {invoice.quantity || invoice.bagQuantity}
              </Typography>
              <Typography
                variant="bodySmall"
                color="secondary"
                style={{ width: 70, textAlign: 'right' }}
              >
                {money(invoice.unitPrice)}
              </Typography>
              <Typography
                variant="bodySmall"
                weight="bold"
                color="primary"
                style={{ width: 80, textAlign: 'right' }}
              >
                {money(invoice.subtotal)}
              </Typography>
            </Row>

            <Divider variant="subtle" spacing="sm" />

            {/* Calculations Breakdown */}
            <Stack gap="xs">
              <Row justify="space-between">
                <Typography variant="caption" color="secondary">
                  Subtotal:
                </Typography>
                <Typography variant="caption" weight="semibold" color="primary">
                  {money(invoice.subtotal)}
                </Typography>
              </Row>

              {invoice.discount > 0 && (
                <Row justify="space-between">
                  <Typography variant="caption" color="success">
                    Discount Applied:
                  </Typography>
                  <Typography variant="caption" weight="bold" color="success">
                    - {money(invoice.discount)}
                  </Typography>
                </Row>
              )}

              <Row justify="space-between" style={{ paddingTop: theme.spacing.xs }}>
                <Typography variant="bodySmall" weight="bold" color="primary">
                  Total Invoiced:
                </Typography>
                <Typography variant="bodySmall" weight="bold" color="brandDeep">
                  {money(invoice.totalAmount)}
                </Typography>
              </Row>

              <Row justify="space-between">
                <Typography variant="caption" color="secondary">
                  Amount Paid:
                </Typography>
                <Typography variant="caption" weight="bold" color="success">
                  {money(invoice.amountPaid)}
                </Typography>
              </Row>

              <Row justify="space-between">
                <Typography variant="caption" color="secondary">
                  Balance Outstanding:
                </Typography>
                <Typography
                  variant="caption"
                  weight="bold"
                  color={invoice.balanceDue > 0 ? 'warning' : 'success'}
                >
                  {invoice.balanceDue > 0
                    ? `${money(invoice.balanceDue)}`
                    : `Fully Paid (${money(0)})`}
                </Typography>
              </Row>
            </Stack>
          </Card>

          {/* Delivery & Dispatch Notes */}
          {invoice.notes && (
            <Card variant="flat" padding="compact">
              <Typography variant="caption" weight="bold" color="muted">
                DISPATCH & PAYMENT NOTES
              </Typography>
              <Typography
                variant="caption"
                color="secondary"
                style={{ marginTop: theme.spacing.xxs }}
              >
                {invoice.notes}
              </Typography>
            </Card>
          )}

          {/* Secondary Action Controls */}
          {invoice.paymentStatus !== 'cancelled' && (
            <Row gap="sm" justify="space-between">
              <Button
                label="Cancel Invoice"
                variant="ghost"
                size="sm"
                onPress={() => setShowCancelConfirm(true)}
              />
              {invoice.balanceDue > 0 && (
                <Button
                  label="Receive Payment"
                  variant="primary"
                  size="sm"
                  leftIcon="cash-outline"
                  onPress={handleReceivePayment}
                />
              )}
            </Row>
          )}
        </Stack>
      </Modal>

      {/* Controlled Cancellation Safety Confirmation */}
      <ConfirmDialog
        visible={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel This Invoice?"
        message={`Cancelling ${invoice.invoiceNumber} will return ${invoice.quantity || invoice.bagQuantity} ${invoice.outputUnit || 'units'} of finished product back to inventory and reverse customer dues.`}
        confirmLabel="Confirm Cancellation"
        cancelLabel="Keep Invoice"
        isDestructive
        loading={cancelInvoiceMutation.isPending}
      />
    </>
  );
};

export default InvoiceDetailModal;
