import React, { useState } from 'react';
import { useMoney, useCurrencySymbol } from '../../../hooks/useMoney';
import { useRecordPayment, useSalesInvoices } from '../../../hooks/api/useSales';
import { useCustomers } from '../../../hooks/api/useCustomers';
import { useAppStore } from '../../../stores/useAppStore';
import {
  Button,
  ChipPicker,
  FlowHeaderCard,
  FlowPage,
  FlowSection,
  OptionGrid,
  Row,
  SelectedCard,
  Stack,
  TextInput,
  Typography,
} from '../../../components';

export interface ReceivePaymentPageProps {
  onClose: () => void;
  preselectedCustomerId?: string | null;
  preselectedInvoiceId?: string | null;
}

type Method = 'upi' | 'cash' | 'bank_transfer' | 'cheque';
const METHODS: {
  value: Method;
  label: string;
  icon: 'phone-portrait-outline' | 'cash-outline' | 'business-outline' | 'document-text-outline';
}[] = [
  { value: 'upi', label: 'UPI', icon: 'phone-portrait-outline' },
  { value: 'cash', label: 'Cash', icon: 'cash-outline' },
  { value: 'bank_transfer', label: 'Bank transfer', icon: 'business-outline' },
  { value: 'cheque', label: 'Cheque', icon: 'document-text-outline' },
];

/** Receive Payment: collect money from a customer, optionally against one invoice. */
export const ReceivePaymentPage: React.FC<ReceivePaymentPageProps> = ({
  onClose,
  preselectedCustomerId,
  preselectedInvoiceId,
}) => {
  const money = useMoney();
  const symbol = useCurrencySymbol();
  const { data: customers = [] } = useCustomers();
  const { data: invoices = [] } = useSalesInvoices();
  const record = useRecordPayment();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const preInvoice = invoices.find((i) => i.id === preselectedInvoiceId);
  const [customerId, setCustomerId] = useState(
    preselectedCustomerId ?? preInvoice?.customerId ?? '',
  );
  const [picking, setPicking] = useState(!customerId);
  const [invoiceId, setInvoiceId] = useState(preselectedInvoiceId ?? '');
  const [amount, setAmount] = useState<string | null>(null);
  const [method, setMethod] = useState<Method>('upi');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const customer = customers.find((c) => c.id === customerId);
  const open = invoices.filter((i) => i.customerId === customerId && i.balanceDue > 0);
  const invoice = open.find((i) => i.id === invoiceId);
  const suggested = invoice ? invoice.balanceDue : (customer?.outstandingBalance ?? 0);
  const value = amount !== null ? Number(amount) || 0 : suggested;
  const cap = customer?.outstandingBalance ?? 0;

  const submit = async () => {
    if (!customer) return setError('Choose a customer');
    if (!(value > 0)) return setError('Enter an amount above 0');
    if (value > cap) return setError(`Customer only owes ${money(cap)}`);
    try {
      await record.mutateAsync({
        customerId: customer.id,
        invoiceId: invoice?.id,
        amount: value,
        paymentMethod: method,
        date: new Date().toISOString().split('T')[0],
        notes: notes.trim(),
      });
      setBannerAlert({
        title: 'Payment received',
        message: `${money(value)} from ${customer.name}. Their dues are updated.`,
        variant: 'success',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not record this payment');
    }
  };

  return (
    <FlowPage title="Receive Payment" onClose={onClose}>
      <FlowHeaderCard
        icon="wallet-outline"
        title="Receive Payment"
        description="Collect money against what a customer owes"
        chip="Collection"
      />

      <FlowSection
        label="Customer"
        action={
          customer
            ? {
                label: picking ? 'Done' : 'Change',
                icon: 'swap-horizontal',
                onPress: () => setPicking((v) => !v),
              }
            : undefined
        }
      >
        {customer && (
          <SelectedCard
            icon="person-outline"
            title={customer.name}
            subtitle="Total outstanding"
            right={
              <Typography variant="dataLarge" tabular>
                {money(customer.outstandingBalance)}
              </Typography>
            }
          />
        )}
        {(picking || !customer) && (
          <ChipPicker
            options={customers
              .filter((c) => c.outstandingBalance > 0)
              .map((c) => ({ value: c.id, label: c.name }))}
            selected={customerId}
            onSelect={(v) => {
              setCustomerId(String(v));
              setInvoiceId('');
              setAmount(null);
              setPicking(false);
              setError('');
            }}
          />
        )}
      </FlowSection>

      {open.length > 0 && (
        <FlowSection label="Against invoice" hint="Optional">
          <ChipPicker
            options={open.map((i) => ({
              value: i.id,
              label: `${i.invoiceNumber} · ${symbol}${i.balanceDue.toLocaleString('en-IN')}`,
            }))}
            selected={invoiceId}
            onSelect={(v) => {
              setInvoiceId(String(v) === invoiceId ? '' : String(v));
              setAmount(null);
            }}
          />
        </FlowSection>
      )}

      <FlowSection label="Amount received">
        <TextInput
          label="Amount"
          value={amount ?? (suggested ? String(suggested) : '')}
          onChangeText={(t) => {
            setAmount(t);
            setError('');
          }}
          keyboardType="numeric"
          prefix={symbol}
        />
        <Row gap="xs">
          <Button label="Full amount" variant="subtle" size="sm" onPress={() => setAmount(null)} />
        </Row>
      </FlowSection>

      <FlowSection label="Payment mode">
        <OptionGrid options={METHODS} selected={method} onSelect={setMethod} />
        <TextInput
          label="Reference"
          hint="Optional"
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. UPI ref, cheque number"
        />
      </FlowSection>

      {error ? (
        <Typography variant="bodySmall" color="error">
          {error}
        </Typography>
      ) : null}

      <Stack gap="xs">
        <Button
          label={value > 0 ? `Confirm ${money(value)} received` : 'Confirm payment'}
          variant="success"
          size="lg"
          leftIcon="checkmark-circle-outline"
          fullWidth
          loading={record.isPending}
          onPress={submit}
        />
        <Button label="Cancel" variant="ghost" fullWidth onPress={onClose} />
      </Stack>
    </FlowPage>
  );
};

export default ReceivePaymentPage;
