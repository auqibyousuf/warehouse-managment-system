import React, { useState } from 'react';
import { useColors } from '../../../theme';
import { useMoney, useCurrencySymbol } from '../../../hooks/useMoney';
import { openSheet } from '../../../navigation/sheets';
import { useCreateSaleInvoice } from '../../../hooks/api/useSales';
import { useCustomers } from '../../../hooks/api/useCustomers';
import { useProducts } from '../../../hooks/api/useInventory';
import { useFactorySettings } from '../../../hooks/api/useDashboard';
import { useAppStore } from '../../../stores/useAppStore';
import { generateInvoicePDF } from '../../../utils/pdfGenerator';
import {
  Badge,
  Box,
  Button,
  Card,
  ChipPicker,
  FlowHeaderCard,
  FlowPage,
  FlowSection,
  OptionGrid,
  ProgressBar,
  QuantityStepper,
  Row,
  SelectedCard,
  Stack,
  TextInput,
  Typography,
} from '../../../components';

export interface CreateInvoicePageProps {
  onClose: () => void;
}

type Method = 'cash' | 'upi' | 'bank_transfer' | 'cheque';
const METHODS: {
  value: Method;
  label: string;
  icon: 'cash-outline' | 'phone-portrait-outline' | 'business-outline' | 'document-text-outline';
}[] = [
  { value: 'cash', label: 'Cash', icon: 'cash-outline' },
  { value: 'upi', label: 'UPI', icon: 'phone-portrait-outline' },
  { value: 'bank_transfer', label: 'Bank transfer', icon: 'business-outline' },
  { value: 'cheque', label: 'Cheque', icon: 'document-text-outline' },
];
const TERMS = [
  { value: '0', label: 'Immediate' },
  { value: '7', label: 'Net 7' },
  { value: '15', label: 'Net 15' },
  { value: '30', label: 'Net 30' },
];

const stockOf = (p: { currentStockUnits?: number; currentStockBags?: number }) =>
  p.currentStockUnits !== undefined ? p.currentStockUnits : (p.currentStockBags ?? 0);

/** Create Invoice: customer, product, quantity, payment terms. Full-page flow from the Stitch Lite design. */
export const CreateInvoicePage: React.FC<CreateInvoicePageProps> = ({ onClose }) => {
  const colors = useColors();
  const money = useMoney();
  const symbol = useCurrencySymbol();
  const { data: settings } = useFactorySettings();
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const createSale = useCreateSaleInvoice();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const activeProducts = products.filter((p) => p.isActive);
  const [customerId, setCustomerId] = useState('');
  const [pickingCustomer, setPickingCustomer] = useState(true);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState<string | null>(null);
  const [discount, setDiscount] = useState('');
  const [terms, setTerms] = useState('0');
  const [paidNow, setPaidNow] = useState('');
  const [method, setMethod] = useState<Method>('cash');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const customer = customers.find((c) => c.id === customerId);
  const product = activeProducts.find((p) => p.id === productId) ?? activeProducts[0];
  const unit = product?.outputUnit || settings?.defaultUnitName || 'units';
  const available = product ? stockOf(product) : 0;
  const unitPrice =
    price !== null
      ? Number(price) || 0
      : (product?.sellingPricePerUnit ?? product?.sellingPricePerBag ?? 0);
  const subtotal = quantity * unitPrice;
  const discountValue = Number(discount) || 0;
  const total = Math.max(0, subtotal - discountValue);
  const paid = Math.min(total, Number(paidNow) || 0);
  const balance = total - paid;
  const projectedDues = (customer?.outstandingBalance ?? 0) + balance;
  const overLimit = !!customer?.creditLimit && projectedDues > customer.creditLimit;
  const overStock = !!product && quantity > available;

  const submit = async (share: boolean) => {
    if (!customer) return setError('Choose a customer');
    if (!product) return setError('Choose a product');
    if (!(quantity > 0)) return setError('Enter a quantity above 0');
    if (overStock) return setError(`Only ${available} ${unit} in stock`);
    try {
      const invoice = await createSale.mutateAsync({
        customerId: customer.id,
        productId: product.id,
        quantity,
        outputUnit: unit,
        bagQuantity: quantity,
        unitPrice,
        discount: discountValue,
        amountPaidNow: paid,
        paymentMethod: method,
        paymentTermDays: Number(terms),
        date: new Date().toISOString().split('T')[0],
        notes: notes.trim(),
      });
      setBannerAlert({
        title: 'Invoice created',
        message: `${invoice.invoiceNumber}: ${quantity} ${unit} of ${product.name} to ${customer.name}. Total ${money(total)}.`,
        variant: 'success',
      });
      if (share && settings) await generateInvoicePDF(invoice, settings);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not create this invoice');
    }
  };

  return (
    <FlowPage title="Create Invoice" onClose={onClose}>
      <FlowHeaderCard
        icon="receipt-outline"
        title="Create Sales Invoice"
        description="Dispatch finished goods and record what was paid"
        chip="Sales"
      />

      <FlowSection
        label="Customer"
        action={
          customer
            ? {
                label: pickingCustomer ? 'Done' : 'Change',
                icon: 'swap-horizontal',
                onPress: () => setPickingCustomer((v) => !v),
              }
            : undefined
        }
      >
        {customer && (
          <SelectedCard
            icon="person-outline"
            title={customer.name}
            subtitle={`Outstanding ${money(customer.outstandingBalance)}${customer.creditLimit ? ` · limit ${money(customer.creditLimit)}` : ''}`}
          />
        )}
        {(pickingCustomer || !customer) && (
          <ChipPicker
            options={customers.map((c) => ({ value: c.id, label: c.name }))}
            selected={customerId}
            onSelect={(v) => {
              setCustomerId(String(v));
              setPickingCustomer(false);
              setError('');
            }}
          />
        )}
        <Button
          label="Add new customer"
          variant="ghost"
          size="sm"
          leftIcon="person-add-outline"
          onPress={() => openSheet('create_customer', {}, { replace: true })}
        />
      </FlowSection>

      <FlowSection label="Product">
        <ChipPicker
          options={activeProducts.map((p) => ({ value: p.id, label: p.name }))}
          selected={product?.id ?? ''}
          onSelect={(v) => {
            setProductId(String(v));
            setPrice(null);
            setQuantity(1);
            setError('');
          }}
        />
        {product && (
          <Typography variant="bodySmall" color={overStock ? 'error' : 'secondary'}>
            {available.toLocaleString('en-IN')} {unit} in stock
          </Typography>
        )}
        <QuantityStepper
          value={quantity}
          onChange={(v) => {
            setQuantity(v);
            setError('');
          }}
          unit={unit}
          min={1}
          max={available || undefined}
        />
        <TextInput
          label={`Price per ${unit}`}
          value={price ?? (unitPrice ? String(unitPrice) : '')}
          onChangeText={setPrice}
          keyboardType="numeric"
          prefix={symbol}
        />
        <TextInput
          label="Discount"
          hint="Optional"
          value={discount}
          onChangeText={setDiscount}
          keyboardType="numeric"
          prefix={symbol}
        />
      </FlowSection>

      <FlowSection label="Payment terms">
        <ChipPicker
          options={TERMS}
          selected={terms}
          onSelect={(v) => setTerms(String(v))}
          variant="segmented"
        />
      </FlowSection>

      <FlowSection label="Paid now" hint="Leave empty for a credit sale">
        <TextInput
          label="Amount received"
          value={paidNow}
          onChangeText={setPaidNow}
          keyboardType="numeric"
          prefix={symbol}
        />
        {paid > 0 && <OptionGrid options={METHODS} selected={method} onSelect={setMethod} />}
      </FlowSection>

      <FlowSection label="Summary">
        <Row justify="space-between">
          <Typography variant="bodySmall" color="secondary">
            {quantity} {unit} × {money(unitPrice)}
          </Typography>
          <Typography variant="dataMedium" tabular>
            {money(subtotal)}
          </Typography>
        </Row>
        {discountValue > 0 && (
          <Row justify="space-between">
            <Typography variant="bodySmall" color="secondary">
              Discount
            </Typography>
            <Typography variant="dataMedium" color="error" tabular>
              -{money(discountValue)}
            </Typography>
          </Row>
        )}
        <Row justify="space-between" align="center">
          <Typography variant="title">Total</Typography>
          <Typography variant="dataLarge" tabular>
            {money(total)}
          </Typography>
        </Row>
        <Row justify="space-between" align="center">
          <Typography variant="bodySmall" color="secondary">
            Balance due
          </Typography>
          <Badge label={money(balance)} variant={balance > 0 ? 'warning' : 'success'} size="sm" />
        </Row>
        {!!customer?.creditLimit && (
          <Box>
            <ProgressBar
              value={projectedDues / customer.creditLimit}
              color={overLimit ? colors.accent.error : colors.accent.warning}
              accessibilityLabel="Credit used including this invoice"
            />
            {overLimit && (
              <Typography variant="caption" color="error">
                This takes {customer.name} over their credit limit.
              </Typography>
            )}
          </Box>
        )}
      </FlowSection>

      <FlowSection label="Delivery notes" hint="Optional">
        <TextInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. vehicle, driver"
        />
      </FlowSection>

      {error ? (
        <Card tone="danger" padding="compact">
          <Typography variant="bodySmall" color="error">
            {error}
          </Typography>
        </Card>
      ) : null}

      <Stack gap="xs">
        <Button
          label="Create Invoice"
          size="lg"
          leftIcon="checkmark-circle-outline"
          fullWidth
          loading={createSale.isPending}
          onPress={() => submit(false)}
        />
        <Button
          label="Create & Share PDF"
          variant="subtle"
          leftIcon="share-outline"
          fullWidth
          onPress={() => submit(true)}
        />
        <Button label="Cancel" variant="ghost" fullWidth onPress={onClose} />
      </Stack>
    </FlowPage>
  );
};

export default CreateInvoicePage;
