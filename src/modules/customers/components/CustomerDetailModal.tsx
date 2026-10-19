import { openSheet } from '../../../navigation/sheets';
import { theme } from '../../../theme';
import React from 'react';
import { useCustomers } from '../../../hooks/api/useCustomers';
import { useSalesInvoices, useCustomerPayments } from '../../../hooks/api/useSales';
import {
  Modal,
  Stack,
  Row,
  Box,
  Typography,
  Card,
  Badge,
  Button,
} from '../../../components';

export interface CustomerDetailModalProps {
  visible: boolean;
  onClose: () => void;
  customerId?: string | null;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  visible,
  onClose,
  customerId,
}) => {
  const { data: customers = [] } = useCustomers();
  const { data: invoices = [] } = useSalesInvoices();
  const { data: payments = [] } = useCustomerPayments();

  const customer = customers.find((c) => c.id === customerId);

  if (!customer) {
    return null;
  }

  const customerInvoices = invoices.filter((i) => i.customerId === customer.id);
  const customerPayments = payments.filter((p) => p.customerId === customer.id);

  const handleRecordPayment = () => {
    openSheet('record_payment', { customerId: customer.id }, { replace: true });
  };

  const handleOpenInvoice = (invId: string) => {
    openSheet('invoice_detail', { invoiceId: invId }, { replace: true });
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={customer.name}
      subtitle="Customer Account Ledger & Profile"
      secondaryAction={{
        label: 'Close',
        onPress: onClose,
      }}
    >
      <Stack gap="md">
        {/* Outstanding Dues Banner */}
        <Card variant={customer.outstandingBalance > 0 ? 'accent' : 'flat'} padding="compact">
          <Row justify="space-between" align="center">
            <Box>
              <Typography variant="caption" color="muted">
                OUTSTANDING DUES
              </Typography>
              <Typography
                variant="h2"
                weight="bold"
                color={customer.outstandingBalance > 0 ? 'warning' : 'success'}
              >
                ₹{customer.outstandingBalance.toLocaleString('en-IN')}
              </Typography>
            </Box>
            {customer.outstandingBalance > 0 && (
              <Button
                label="Receive Payment"
                variant="primary"
                size="sm"
                leftIcon="cash-outline"
                onPress={handleRecordPayment}
              />
            )}
          </Row>
        </Card>

        {/* Customer Profile Details */}
        <Card variant="elevated" padding="normal">
          <Typography variant="title" weight="bold" color="primary" style={{ marginBottom: theme.spacing.xsm }}>
            Account Profile & Contact
          </Typography>
          <Stack gap="xs">
            <Row justify="space-between">
              <Typography variant="caption" color="secondary">
                Phone Number:
              </Typography>
              <Typography variant="caption" weight="semibold" color="primary">
                {customer.phone}
              </Typography>
            </Row>

            {customer.email && (
              <Row justify="space-between">
                <Typography variant="caption" color="secondary">
                  Email Address:
                </Typography>
                <Typography variant="caption" weight="semibold" color="primary">
                  {customer.email}
                </Typography>
              </Row>
            )}

            {customer.gstin && (
              <Row justify="space-between">
                <Typography variant="caption" color="secondary">
                  GSTIN / Tax ID:
                </Typography>
                <Typography variant="caption" weight="semibold" color="primary">
                  {customer.gstin}
                </Typography>
              </Row>
            )}

            {customer.creditLimit ? (
              <Row justify="space-between">
                <Typography variant="caption" color="secondary">
                  Credit Limit:
                </Typography>
                <Typography variant="caption" weight="semibold" color="primary">
                  ₹{customer.creditLimit.toLocaleString('en-IN')}
                </Typography>
              </Row>
            ) : null}

            <Row justify="space-between" align="flex-start">
              <Typography variant="caption" color="secondary" style={{ width: 100 }}>
                Delivery Address:
              </Typography>
              <Typography variant="caption" color="primary" style={{ flex: 1, textAlign: 'right' }}>
                {customer.address}
              </Typography>
            </Row>

            {customer.notes && (
              <Row justify="space-between" align="flex-start">
                <Typography variant="caption" color="secondary" style={{ width: 100 }}>
                  Account Notes:
                </Typography>
                <Typography variant="caption" color="muted" style={{ flex: 1, textAlign: 'right' }}>
                  {customer.notes}
                </Typography>
              </Row>
            )}
          </Stack>
        </Card>

        {/* Financial Summary */}
        <Card variant="elevated" padding="normal">
          <Typography variant="title" weight="bold" color="primary" style={{ marginBottom: theme.spacing.xsm }}>
            Lifetime Statistics
          </Typography>
          <Row justify="space-between">
            <Box>
              <Typography variant="caption" color="muted">
                Total Invoiced
              </Typography>
              <Typography variant="bodyMedium" weight="bold" color="primary">
                ₹{customer.totalPurchases.toLocaleString('en-IN')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="muted">
                Total Collected
              </Typography>
              <Typography variant="bodyMedium" weight="bold" color="success">
                ₹{customer.totalPaid.toLocaleString('en-IN')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="muted">
                Current Dues
              </Typography>
              <Typography variant="bodyMedium" weight="bold" color={customer.outstandingBalance > 0 ? 'warning' : 'success'}>
                ₹{customer.outstandingBalance.toLocaleString('en-IN')}
              </Typography>
            </Box>
          </Row>
        </Card>

        {/* Linked Invoices */}
        <Typography variant="title" weight="bold" color="primary" style={{ marginTop: theme.spacing.xs }}>
          Linked Invoices ({customerInvoices.length})
        </Typography>
        {customerInvoices.length === 0 ? (
          <Typography variant="caption" color="muted">
            No invoices issued to this customer yet.
          </Typography>
        ) : (
          customerInvoices.map((inv) => (
            <Card
              key={inv.id}
              variant="flat"
              padding="compact"
              onPress={() => handleOpenInvoice(inv.id)}
            >
              <Row justify="space-between" align="center">
                <Box>
                  <Row gap="xs" align="center">
                    <Typography variant="bodySmall" weight="bold" color="primary">
                      {inv.invoiceNumber}
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
                  </Row>
                  <Typography variant="caption" color="muted">
                    {inv.date} • {inv.quantity || inv.bagQuantity} {inv.outputUnit || 'units'}
                  </Typography>
                </Box>
                <Box align="flex-end">
                  <Typography variant="bodySmall" weight="bold" color="brandDeep">
                    ₹{inv.totalAmount.toLocaleString('en-IN')}
                  </Typography>
                  {inv.balanceDue > 0 && (
                    <Typography variant="caption" color="warning" weight="semibold">
                      Due: ₹{inv.balanceDue.toLocaleString('en-IN')}
                    </Typography>
                  )}
                </Box>
              </Row>
            </Card>
          ))
        )}

        {/* Linked Receipts */}
        <Typography variant="title" weight="bold" color="primary" style={{ marginTop: theme.spacing.xs }}>
          Payment Receipts ({customerPayments.length})
        </Typography>
        {customerPayments.length === 0 ? (
          <Typography variant="caption" color="muted">
            No payment receipts recorded for this customer yet.
          </Typography>
        ) : (
          customerPayments.map((p) => (
            <Card key={p.id} variant="flat" padding="compact">
              <Row justify="space-between" align="center">
                <Box>
                  <Typography variant="bodySmall" weight="semibold" color="primary">
                    Receipt #{p.paymentNumber}
                  </Typography>
                  <Typography variant="caption" color="muted">
                    {p.date} • Mode: {p.paymentMethod.toUpperCase()}
                  </Typography>
                </Box>
                <Typography variant="bodySmall" weight="bold" color="success">
                  ₹{p.amount.toLocaleString('en-IN')}
                </Typography>
              </Row>
            </Card>
          ))
        )}
      </Stack>
    </Modal>
  );
};

export default CustomerDetailModal;
