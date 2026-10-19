import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerPaymentSchema, CustomerPaymentFormData, CustomerPaymentFormInput } from '../../../validation/schemas';
import { useRecordPayment, useSalesInvoices } from '../../../hooks/api/useSales';
import { useCustomers } from '../../../hooks/api/useCustomers';
import { useAppStore } from '../../../stores/useAppStore';
import {
  Modal,
  Box,
  Stack,
  Row,
  Typography,
  TextInput,
  Button,
  Card,
} from '../../../components';

export interface RecordPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  preselectedCustomerId?: string | null;
  preselectedInvoiceId?: string | null;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  visible,
  onClose,
  preselectedCustomerId,
  preselectedInvoiceId,
}) => {
  const { data: customers = [] } = useCustomers();
  const { data: invoices = [] } = useSalesInvoices();
  const recordPaymentMutation = useRecordPayment();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const defaultCustomer = preselectedCustomerId
    ? customers.find((c) => c.id === preselectedCustomerId) || customers[0]
    : customers[0];

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CustomerPaymentFormInput, unknown, CustomerPaymentFormData>({
    resolver: zodResolver(customerPaymentSchema),
    defaultValues: {
      customerId: defaultCustomer?.id || 'cust-1',
      invoiceId: preselectedInvoiceId || undefined,
      amount: defaultCustomer?.outstandingBalance || 5000,
      paymentMethod: 'upi',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const selectedCustomerId = watch('customerId');
  const selectedInvoiceId = watch('invoiceId');
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const watchedPaymentMethod = watch('paymentMethod');

  const customerInvoices = invoices.filter(
    (inv) => inv.customerId === selectedCustomerId && inv.balanceDue > 0
  );

  const onSubmit = async (data: CustomerPaymentFormData) => {
    try {
      await recordPaymentMutation.mutateAsync({
        customerId: data.customerId,
        invoiceId: data.invoiceId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        date: data.date,
        notes: data.notes,
      });

      setBannerAlert({
        title: 'Payment Received',
        message: `Successfully collected ₹${data.amount.toLocaleString('en-IN')} from ${selectedCustomer?.name}. Customer dues updated.`,
        variant: 'success',
      });
      reset();
      onClose();
    } catch (err: any) {
      setBannerAlert({
        title: 'Payment Error',
        message: err.message || 'Failed to record customer payment',
        variant: 'danger',
      });
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Receive Customer Payment"
      subtitle="Allocates cash / online payment towards outstanding balances"
      primaryAction={{
        label: 'Confirm Payment Receipt',
        onPress: handleSubmit(onSubmit),
        loading: recordPaymentMutation.isPending,
        variant: 'success',
      }}
      secondaryAction={{
        label: 'Cancel',
        onPress: onClose,
      }}
    >
      <Stack gap="md">
        {/* Customer Selector */}
        <Box>
          <Typography variant="label" color="secondary" style={{ marginBottom: 6 }}>
            Select Customer
          </Typography>
          <Row gap="xs" wrap>
            {customers.map((c) => {
              const isSelected = c.id === selectedCustomerId;
              return (
                <Button
                  key={c.id}
                  label={`${c.name} (Dues: ₹${c.outstandingBalance})`}
                  variant={isSelected ? 'primary' : 'subtle'}
                  size="sm"
                  onPress={() => {
                    setValue('customerId', c.id);
                    setValue('amount', c.outstandingBalance);
                    setValue('invoiceId', undefined);
                  }}
                />
              );
            })}
          </Row>
        </Box>

        {selectedCustomer && (
          <Card variant="flat" padding="compact">
            <Row justify="space-between" align="center">
              <Typography variant="bodySmall" color="secondary">
                Total Customer Outstanding Dues:
              </Typography>
              <Typography variant="bodyMedium" weight="bold" color="warning">
                ₹{selectedCustomer.outstandingBalance.toLocaleString('en-IN')}
              </Typography>
            </Row>
          </Card>
        )}

        {/* Invoice Allocation if any unpaid invoices exist */}
        {customerInvoices.length > 0 && (
          <Box>
            <Typography variant="label" color="secondary" style={{ marginBottom: 6 }}>
              Allocate to Specific Unpaid Invoice (Optional)
            </Typography>
            <Row gap="xs" wrap>
              {customerInvoices.map((inv) => {
                const isSelected = inv.id === selectedInvoiceId;
                return (
                  <Button
                    key={inv.id}
                    label={`${inv.invoiceNumber} (Due: ₹${inv.balanceDue})`}
                    variant={isSelected ? 'secondary' : 'subtle'}
                    size="sm"
                    onPress={() => {
                      if (isSelected) {
                        setValue('invoiceId', undefined);
                      } else {
                        setValue('invoiceId', inv.id);
                        setValue('amount', inv.balanceDue);
                      }
                    }}
                  />
                );
              })}
            </Row>
          </Box>
        )}

        {/* Payment Date */}
        <Controller
          control={control}
          name="date"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Payment Received Date"
              value={value}
              onChangeText={onChange}
              leftIcon="calendar-outline"
              error={errors.date?.message}
            />
          )}
        />

        {/* Amount */}
        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Amount Collected"
              value={value !== undefined ? String(value) : ''}
              onChangeText={(val) => onChange(parseFloat(val) || 0)}
              keyboardType="numeric"
              prefix="₹"
              error={errors.amount?.message}
            />
          )}
        />

        {/* Payment Method Selector */}
        <Box>
          <Typography variant="label" color="secondary" style={{ marginBottom: 6 }}>
            Payment Channel / Mode
          </Typography>
          <Row gap="xs" wrap>
            {(['upi', 'cash', 'bank_transfer', 'cheque'] as const).map((method) => {
              const isSelected = watchedPaymentMethod === method;
              return (
                <Button
                  key={method}
                  label={method.toUpperCase()}
                  variant={isSelected ? 'primary' : 'subtle'}
                  size="sm"
                  onPress={() => setValue('paymentMethod', method)}
                />
              );
            })}
          </Row>
        </Box>

        {/* Reference Notes */}
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Transaction Reference / Note (Optional)"
              value={value || ''}
              onChangeText={onChange}
              placeholder="e.g. UPI Ref #904812, Cheque #00412..."
            />
          )}
        />
      </Stack>
    </Modal>
  );
};

export default RecordPaymentModal;
