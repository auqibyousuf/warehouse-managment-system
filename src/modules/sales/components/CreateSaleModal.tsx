import { useMoney, useCurrencySymbol } from '../../../hooks/useMoney';
import { theme, useColors } from '../../../theme';
import { useFactorySettings } from '../../../hooks/api/useDashboard';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  saleInvoiceSchema,
  SaleInvoiceFormData,
  SaleInvoiceFormInput,
} from '../../../validation/schemas';
import { useCreateSaleInvoice } from '../../../hooks/api/useSales';
import { useCustomers } from '../../../hooks/api/useCustomers';
import { useProducts } from '../../../hooks/api/useInventory';
import { useAppStore } from '../../../stores/useAppStore';
import {
  Modal,
  Box,
  Stack,
  InsetStats,
  ProgressBar,
  Row,
  Typography,
  TextInput,
  Button,
  Card,
  Divider,
} from '../../../components';

export interface CreateSaleModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreateSaleModal: React.FC<CreateSaleModalProps> = ({ visible, onClose }) => {
  const money = useMoney();
  const colors = useColors();
  const { data: settings } = useFactorySettings();
  const symbol = useCurrencySymbol();
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const createSaleMutation = useCreateSaleInvoice();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const activeProducts = products.filter((p) => p.isActive);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SaleInvoiceFormInput, unknown, SaleInvoiceFormData>({
    resolver: zodResolver(saleInvoiceSchema),
    defaultValues: {
      customerId: customers[0]?.id ?? '',
      productId: activeProducts[0]?.id ?? '',
      quantity: 1,
      outputUnit: activeProducts[0]?.outputUnit || settings?.defaultUnitName || 'units',
      unitPrice:
        activeProducts[0]?.sellingPricePerUnit || activeProducts[0]?.sellingPricePerBag || 0,
      discount: 0,
      amountPaidNow: 0,
      paymentMethod: 'cash',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const selectedCustomerId = watch('customerId');
  const selectedProductId = watch('productId');
  const watchedQuantity = watch('quantity') || 0;
  const watchedUnitPrice = watch('unitPrice') || 0;
  const watchedDiscount = watch('discount') || 0;
  const watchedAmountPaidNow = watch('amountPaidNow') || 0;
  const watchedPaymentMethod = watch('paymentMethod');

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const currentOutputUnit = selectedProduct?.outputUnit || 'units';

  const subtotal = watchedQuantity * watchedUnitPrice;
  const totalAmount = Math.max(0, subtotal - watchedDiscount);
  const balanceDue = Math.max(0, totalAmount - watchedAmountPaidNow);

  const onSubmit = async (data: SaleInvoiceFormData) => {
    try {
      const qty = data.quantity;
      await createSaleMutation.mutateAsync({
        customerId: data.customerId,
        productId: data.productId,
        quantity: qty,
        outputUnit: currentOutputUnit,
        bagQuantity: qty,
        unitPrice: data.unitPrice,
        discount: data.discount,
        amountPaidNow: data.amountPaidNow,
        paymentMethod: data.paymentMethod,
        date: data.date,
        notes: data.notes,
      });

      setBannerAlert({
        title: 'Sale Confirmed & Dispatched',
        message: `Dispatched ${qty} ${currentOutputUnit} of ${selectedProduct?.name} to ${selectedCustomer?.name}. Invoice Total: ${money(totalAmount)}`,
        variant: 'success',
      });
      reset();
      onClose();
    } catch (err: any) {
      setBannerAlert({
        title: 'Sale Error',
        message: err.message || 'Failed to create sale invoice',
        variant: 'danger',
      });
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Create Sales Invoice"
      subtitle="Dispatches manufactured goods and records cash/credit balance"
      primaryAction={{
        label: 'Confirm Sale & Dispatch',
        onPress: handleSubmit(onSubmit),
        loading: createSaleMutation.isPending,
      }}
      secondaryAction={{
        label: 'Cancel',
        onPress: onClose,
      }}
    >
      <Stack gap="md">
        {/* Customer Selector */}
        <Box>
          <Typography variant="label" color="secondary" style={{ marginBottom: theme.spacing.xsm }}>
            Select Customer / Buyer
          </Typography>
          <Row gap="xs" wrap>
            {customers.map((c) => {
              const isSelected = c.id === selectedCustomerId;
              return (
                <Button
                  key={c.id}
                  label={`${c.name} (Dues: ${symbol}${c.outstandingBalance})`}
                  variant={isSelected ? 'primary' : 'subtle'}
                  size="sm"
                  onPress={() => setValue('customerId', c.id)}
                />
              );
            })}
          </Row>
        </Box>

        {selectedCustomer && (
          <Stack gap="xs">
            <InsetStats
              stats={[
                {
                  label: 'Outstanding',
                  value: money(selectedCustomer.outstandingBalance),
                  valueColor: selectedCustomer.outstandingBalance > 0 ? 'warning' : 'primary',
                },
                {
                  label: 'Credit limit',
                  value: selectedCustomer.creditLimit
                    ? money(selectedCustomer.creditLimit)
                    : 'None set',
                },
              ]}
            />
            {!!selectedCustomer.creditLimit && selectedCustomer.creditLimit > 0 && (
              <ProgressBar
                value={
                  (selectedCustomer.outstandingBalance + balanceDue) / selectedCustomer.creditLimit
                }
                color={
                  selectedCustomer.outstandingBalance + balanceDue > selectedCustomer.creditLimit
                    ? colors.accent.error
                    : colors.accent.warning
                }
                accessibilityLabel="Credit used including this invoice"
              />
            )}
            {!!selectedCustomer.creditLimit &&
              selectedCustomer.outstandingBalance + balanceDue > selectedCustomer.creditLimit && (
                <Typography variant="caption" color="error">
                  This invoice takes {selectedCustomer.name} over their credit limit.
                </Typography>
              )}
          </Stack>
        )}

        {/* Product Selector */}
        <Box>
          <Typography variant="label" color="secondary" style={{ marginBottom: theme.spacing.xsm }}>
            Select Product
          </Typography>
          <Row gap="xs" wrap>
            {activeProducts.map((p) => {
              const isSelected = p.id === selectedProductId;
              const u = p.outputUnit || 'units';
              const stock =
                p.currentStockUnits !== undefined ? p.currentStockUnits : p.currentStockBags || 0;
              const price = p.sellingPricePerUnit || p.sellingPricePerBag || 0;
              return (
                <Button
                  key={p.id}
                  label={`${p.name} (Stock: ${stock} ${u})`}
                  variant={isSelected ? 'secondary' : 'subtle'}
                  size="sm"
                  onPress={() => {
                    setValue('productId', p.id);
                    setValue('outputUnit', u);
                    setValue('unitPrice', price);
                  }}
                />
              );
            })}
          </Row>
        </Box>

        {/* Date Field */}
        <Controller
          control={control}
          name="date"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Invoice Date"
              value={value}
              onChangeText={onChange}
              leftIcon="calendar-outline"
              error={errors.date?.message}
            />
          )}
        />

        {/* Quantity & Unit Price */}
        <Row gap="md">
          <Box flex={1}>
            <Controller
              control={control}
              name="quantity"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label={`Quantity (${currentOutputUnit})`}
                  value={value ? String(value) : ''}
                  onChangeText={(val) => onChange(parseInt(val, 10) || 0)}
                  keyboardType="numeric"
                  suffix={currentOutputUnit}
                  error={errors.quantity?.message}
                  hint={
                    selectedProduct
                      ? `Floor Stock: ${selectedProduct.currentStockUnits || selectedProduct.currentStockBags || 0} ${currentOutputUnit}`
                      : undefined
                  }
                />
              )}
            />
          </Box>

          <Box flex={1}>
            <Controller
              control={control}
              name="unitPrice"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label={`Selling Price / ${currentOutputUnit}`}
                  value={value ? String(value) : ''}
                  onChangeText={(val) => onChange(parseFloat(val) || 0)}
                  keyboardType="numeric"
                  prefix={symbol}
                  suffix={`/${currentOutputUnit}`}
                  error={errors.unitPrice?.message}
                />
              )}
            />
          </Box>
        </Row>

        {/* Discount */}
        <Controller
          control={control}
          name="discount"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Special Discount (Optional)"
              value={value !== undefined ? String(value) : '0'}
              onChangeText={(val) => onChange(parseFloat(val) || 0)}
              keyboardType="numeric"
              prefix={symbol}
            />
          )}
        />

        {/* Immediate Payment Paid */}
        <Controller
          control={control}
          name="amountPaidNow"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Immediate Payment Received Now"
              value={value !== undefined ? String(value) : '0'}
              onChangeText={(val) => onChange(parseFloat(val) || 0)}
              keyboardType="numeric"
              prefix={symbol}
              hint="Enter full amount for cash sale, partial for advance, or 0 for credit sale"
            />
          )}
        />

        {/* Payment Method Selector if payment > 0 */}
        {watchedAmountPaidNow > 0 && (
          <Box>
            <Typography
              variant="label"
              color="secondary"
              style={{ marginBottom: theme.spacing.xsm }}
            >
              Payment Mode Received
            </Typography>
            <Row gap="xs" wrap>
              {(['cash', 'upi', 'bank_transfer', 'cheque'] as const).map((method) => {
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
        )}

        {/* Financial Calculation Summary */}
        <Card variant="accent" padding="compact">
          <Row justify="space-between" style={{ marginVertical: theme.spacing.xxs }}>
            <Typography variant="bodySmall" color="secondary">
              Subtotal ({watchedQuantity} {currentOutputUnit} × {money(watchedUnitPrice)}):
            </Typography>
            <Typography variant="bodySmall" weight="bold" color="primary">
              {money(subtotal)}
            </Typography>
          </Row>
          {watchedDiscount > 0 && (
            <Row justify="space-between" style={{ marginVertical: theme.spacing.xxs }}>
              <Typography variant="bodySmall" color="secondary">
                Discount Deducted:
              </Typography>
              <Typography variant="bodySmall" weight="bold" color="error">
                -{money(watchedDiscount)}
              </Typography>
            </Row>
          )}
          <Row justify="space-between" style={{ marginVertical: theme.spacing.xxs }}>
            <Typography variant="bodySmall" weight="bold" color="brandDeep">
              Total Invoice Amount:
            </Typography>
            <Typography variant="bodySmall" weight="bold" color="brandDeep">
              {money(totalAmount)}
            </Typography>
          </Row>
          <Divider variant="brand" spacing="xxs" />
          <Row justify="space-between" style={{ marginVertical: theme.spacing.xxs }}>
            <Typography variant="bodySmall" color="secondary">
              Cash Collected Now:
            </Typography>
            <Typography variant="bodySmall" weight="bold" color="success">
              {money(watchedAmountPaidNow)}
            </Typography>
          </Row>
          <Row justify="space-between" style={{ marginVertical: theme.spacing.xxs }}>
            <Typography variant="bodyMedium" weight="bold" color="brandDeep">
              Balance Due (Credit):
            </Typography>
            <Typography
              variant="bodyMedium"
              weight="bold"
              color={balanceDue > 0 ? 'warning' : 'primary'}
            >
              {money(balanceDue)}
            </Typography>
          </Row>
        </Card>

        {/* Notes */}
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Order / Delivery Notes (Optional)"
              value={value || ''}
              onChangeText={onChange}
              placeholder="e.g. Delivery vehicle, gate pass, driver name..."
            />
          )}
        />
      </Stack>
    </Modal>
  );
};

export default CreateSaleModal;
