import { useMoney } from '../../../hooks/useMoney';
import { theme } from '../../../theme';
import React, { useState } from 'react';
import { usePurchases } from '../../../hooks/api/useInventory';
import { useFactorySettings } from '../../../hooks/api/useDashboard';
import { useAppStore } from '../../../stores/useAppStore';
import { generatePurchaseBillPDF } from '../../../utils/pdfGenerator';
import { Modal, Stack, Row, Box, Typography, Card, Badge, Divider } from '../../../components';

export interface PurchaseDetailModalProps {
  visible: boolean;
  onClose: () => void;
  purchaseId?: string | null;
}

export const PurchaseDetailModal: React.FC<PurchaseDetailModalProps> = ({
  visible,
  onClose,
  purchaseId,
}) => {
  const money = useMoney();
  const [downloading, setDownloading] = useState(false);
  const { data: purchases = [] } = usePurchases();
  const { data: settings } = useFactorySettings();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const purchase = purchases.find((p) => p.id === purchaseId);

  if (!purchase) {
    return null;
  }

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      await generatePurchaseBillPDF(purchase, settings);
      setBannerAlert({
        title: 'Purchase Voucher PDF Generated',
        message: `Inward voucher ${purchase.purchaseNumber} is ready for sharing.`,
        variant: 'success',
      });
    } catch (err: any) {
      setBannerAlert({
        title: 'PDF Generation Error',
        message: err.message || 'Could not create PDF voucher',
        variant: 'danger',
      });
    } finally {
      setDownloading(false);
    }
  };

  const statusVariant =
    purchase.paymentStatus === 'paid'
      ? 'success'
      : purchase.paymentStatus === 'partial'
        ? 'warning'
        : 'danger';

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={`Inward Bill ${purchase.purchaseNumber}`}
      subtitle={`Received on ${purchase.date}`}
      primaryAction={{
        label: downloading ? 'Generating PDF...' : 'Download & Share Voucher',
        onPress: handleDownloadPDF,
        loading: downloading,
      }}
      secondaryAction={{
        label: 'Close',
        onPress: onClose,
      }}
    >
      <Stack gap="md">
        {/* Status Strip */}
        <Card variant="flat" padding="compact">
          <Row justify="space-between" align="center">
            <Box>
              <Typography variant="caption" color="muted">
                PAYMENT STATUS
              </Typography>
              <Badge
                label={purchase.paymentStatus.toUpperCase()}
                variant={statusVariant}
                size="md"
              />
            </Box>
            <Box align="flex-end">
              <Typography variant="caption" color="muted">
                TOTAL BILL
              </Typography>
              <Typography variant="h2" weight="bold" color="brandDeep">
                {money(purchase.totalAmount)}
              </Typography>
            </Box>
          </Row>
        </Card>

        {/* Supplier Details */}
        <Card variant="elevated" padding="normal">
          <Typography
            variant="title"
            weight="bold"
            color="primary"
            style={{ marginBottom: theme.spacing.xs }}
          >
            Supplier Information
          </Typography>
          <Typography variant="bodyMedium" weight="semibold" color="secondary">
            {purchase.supplierName}
          </Typography>
          {purchase.supplierPhone && (
            <Typography variant="caption" color="muted" style={{ marginTop: theme.spacing.xxs }}>
              Phone: {purchase.supplierPhone}
            </Typography>
          )}
          {purchase.billNumber && (
            <Typography
              variant="caption"
              weight="semibold"
              color="primary"
              style={{ marginTop: theme.spacing.xxs }}
            >
              Supplier Invoice / Challan: #{purchase.billNumber}
            </Typography>
          )}
        </Card>

        {/* Item Inward Details */}
        <Card variant="elevated" padding="normal">
          <Typography
            variant="title"
            weight="bold"
            color="primary"
            style={{ marginBottom: theme.spacing.sm }}
          >
            Material Inward Summary
          </Typography>

          <Row justify="space-between" align="center" style={{ paddingVertical: theme.spacing.sm }}>
            <Box style={{ flex: 1 }}>
              <Typography variant="bodySmall" weight="bold" color="primary">
                {purchase.itemName}
              </Typography>
              <Typography variant="caption" color="muted">
                Unit Rate: {money(purchase.unitPrice)} per {purchase.unit}
              </Typography>
            </Box>
            <Box align="flex-end">
              <Typography variant="bodySmall" weight="bold" color="primary">
                {purchase.quantity.toLocaleString('en-IN')} {purchase.unit}
              </Typography>
              <Typography variant="bodySmall" weight="bold" color="brandDeep">
                {money(purchase.totalAmount)}
              </Typography>
            </Box>
          </Row>

          <Divider variant="subtle" spacing="sm" />

          {/* Payment Breakdown */}
          <Stack gap="xs">
            <Row justify="space-between">
              <Typography variant="caption" color="secondary">
                Amount Paid to Supplier:
              </Typography>
              <Typography variant="caption" weight="bold" color="success">
                {money(purchase.amountPaid)}
              </Typography>
            </Row>

            <Row justify="space-between">
              <Typography variant="caption" color="secondary">
                Payable Balance (Due):
              </Typography>
              <Typography
                variant="caption"
                weight="bold"
                color={purchase.balanceDue > 0 ? 'warning' : 'success'}
              >
                {purchase.balanceDue > 0
                  ? `${money(purchase.balanceDue)}`
                  : `Fully Paid (${money(0)})`}
              </Typography>
            </Row>
          </Stack>
        </Card>

        {/* Notes */}
        {purchase.notes && (
          <Card variant="flat" padding="compact">
            <Typography variant="caption" weight="bold" color="muted">
              DELIVERY & QUALITY NOTES
            </Typography>
            <Typography
              variant="caption"
              color="secondary"
              style={{ marginTop: theme.spacing.xxs }}
            >
              {purchase.notes}
            </Typography>
          </Card>
        )}
      </Stack>
    </Modal>
  );
};

export default PurchaseDetailModal;
