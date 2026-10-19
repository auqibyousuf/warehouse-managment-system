import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { purchaseSchema, PurchaseFormData } from '../../../validation/schemas';
import { useRecordPurchase, useIngredients, useSuppliers } from '../../../hooks/api/useInventory';
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
  Divider,
} from '../../../components';
import { CreateSupplierModal } from './CreateSupplierModal';
import { CreateIngredientModal } from './CreateIngredientModal';

export interface RecordPurchaseModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RecordPurchaseModal: React.FC<RecordPurchaseModalProps> = ({
  visible,
  onClose,
}) => {
  const { data: ingredients = [] } = useIngredients();
  const { data: suppliers = [] } = useSuppliers();
  const recordPurchaseMutation = useRecordPurchase();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema) as any,
    defaultValues: {
      supplierId: suppliers[0]?.id || 'sup-1',
      itemId: ingredients[0]?.id || 'ing-1',
      quantity: 1000,
      unitPrice: 12,
      amountPaid: 6000,
      date: new Date().toISOString().split('T')[0],
      billNumber: '',
      notes: '',
    },
  });


  const selectedSupplierId = watch('supplierId');
  const selectedItemId = watch('itemId');
  const watchedQty = watch('quantity') || 0;
  const watchedUnitPrice = watch('unitPrice') || 0;
  const watchedAmountPaid = watch('amountPaid') || 0;

  const totalBill = watchedQty * watchedUnitPrice;
  const balanceDue = Math.max(0, totalBill - watchedAmountPaid);

  const selectedItem = ingredients.find((i) => i.id === selectedItemId);

  const onSubmit = async (data: PurchaseFormData) => {
    try {
      await recordPurchaseMutation.mutateAsync({
        supplierId: data.supplierId,
        itemId: data.itemId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        amountPaid: data.amountPaid,
        date: data.date,
        billNumber: data.billNumber || undefined,
        notes: data.notes,
      });

      setBannerAlert({
        title: 'Purchase Recorded',
        message: `Added ${data.quantity} ${selectedItem?.unit || 'units'} to stock. Balance due: ₹${balanceDue.toLocaleString('en-IN')}`,
        variant: 'success',
      });
      reset();
      onClose();
    } catch (err: any) {
      setBannerAlert({
        title: 'Purchase Failed',
        message: err.message || 'Error recording purchase',
        variant: 'danger',
      });
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Record Stock Purchase"
      subtitle="Raw materials & packaging received"
      primaryAction={{
        label: 'Confirm Delivery & Increase Stock',
        onPress: handleSubmit(onSubmit),
        loading: recordPurchaseMutation.isPending,
      }}
      secondaryAction={{
        label: 'Cancel',
        onPress: onClose,
      }}
    >
      <Stack gap="md">
        {/* Supplier Picker */}
        <Box>
          <Row justify="space-between" align="center" style={{ marginBottom: 6 }}>
            <Typography variant="label" color="secondary">
              Select Supplier / Vendor
            </Typography>
            <Button
              label="+ Add Supplier"
              variant="subtle"
              size="sm"
              leftIcon="business-outline"
              onPress={() => setShowAddSupplier(true)}
            />
          </Row>
          {suppliers.length === 0 ? (
            <Typography variant="caption" color="muted">
              No suppliers registered yet. Click "+ Add Supplier" above to create one.
            </Typography>
          ) : (
            <Row gap="xs" wrap>
              {suppliers.map((s) => {
                const isSelected = s.id === selectedSupplierId;
                return (
                  <Button
                    key={s.id}
                    label={s.name}
                    variant={isSelected ? 'primary' : 'subtle'}
                    size="sm"
                    onPress={() => setValue('supplierId', s.id)}
                  />
                );
              })}
            </Row>
          )}
        </Box>

        {/* Material Picker */}
        <Box>
          <Row justify="space-between" align="center" style={{ marginBottom: 6 }}>
            <Typography variant="label" color="secondary">
              Select Material / Packaging to Inward
            </Typography>
            <Button
              label="+ Add Material"
              variant="subtle"
              size="sm"
              leftIcon="cube-outline"
              onPress={() => setShowAddMaterial(true)}
            />
          </Row>
          {ingredients.length === 0 ? (
            <Typography variant="caption" color="muted">
              No items in inventory. Click "+ Add Material" above to define one first.
            </Typography>
          ) : (
            <Row gap="xs" wrap>
              {ingredients.map((item) => {
                const isSelected = item.id === selectedItemId;
                return (
                  <Button
                    key={item.id}
                    label={`${item.name} (${item.unit})`}
                    variant={isSelected ? 'secondary' : 'subtle'}
                    size="sm"
                    onPress={() => {
                      setValue('itemId', item.id);
                      setValue('unitPrice', item.unitCost);
                    }}
                  />
                );
              })}
            </Row>
          )}
        </Box>

        {/* Date Field */}
        <Controller
          control={control}
          name="date"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Delivery Date"
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
                  label="Quantity Received"
                  value={value ? String(value) : ''}
                  onChangeText={(val) => onChange(parseFloat(val) || 0)}
                  keyboardType="numeric"
                  suffix={selectedItem?.unit || 'kg'}
                  error={errors.quantity?.message}
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
                  label="Purchase Unit Price"
                  value={value ? String(value) : ''}
                  onChangeText={(val) => onChange(parseFloat(val) || 0)}
                  keyboardType="numeric"
                  prefix="₹"
                  suffix={`/${selectedItem?.unit || 'kg'}`}
                  error={errors.unitPrice?.message}
                />
              )}
            />
          </Box>
        </Row>

        {/* Payment Received/Paid */}
        <Controller
          control={control}
          name="amountPaid"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Amount Paid Upfront"
              value={value !== undefined ? String(value) : ''}
              onChangeText={(val) => onChange(parseFloat(val) || 0)}
              keyboardType="numeric"
              prefix="₹"
              hint="Remaining balance will be added to supplier balance"
              error={errors.amountPaid?.message}
            />
          )}
        />

        {/* Summary Card */}
        <Card variant="accent" padding="compact">
          <Row justify="space-between" style={{ marginVertical: 2 }}>
            <Typography variant="bodySmall" color="secondary">
              Total Purchase Bill:
            </Typography>
            <Typography variant="bodySmall" weight="bold" color="primary">
              ₹{totalBill.toLocaleString('en-IN')}
            </Typography>
          </Row>
          <Row justify="space-between" style={{ marginVertical: 2 }}>
            <Typography variant="bodySmall" color="secondary">
              Amount Paid Now:
            </Typography>
            <Typography variant="bodySmall" weight="bold" color="success">
              ₹{watchedAmountPaid.toLocaleString('en-IN')}
            </Typography>
          </Row>
          <Divider variant="brand" spacing="xxs" />
          <Row justify="space-between" style={{ marginVertical: 2 }}>
            <Typography variant="bodyMedium" weight="bold" color="brandDeep">
              Outstanding Supplier Balance:
            </Typography>
            <Typography
              variant="bodyMedium"
              weight="bold"
              color={balanceDue > 0 ? 'warning' : 'primary'}
            >
              ₹{balanceDue.toLocaleString('en-IN')}
            </Typography>
          </Row>
        </Card>

        {/* Supplier Bill / Challan */}
        <Controller
          control={control}
          name="billNumber"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Supplier Invoice / Bill No. (Optional)"
              value={value || ''}
              onChangeText={onChange}
              placeholder="e.g. BILL-9942, INV-2026-44"
              leftIcon="document-text-outline"
            />
          )}
        />

        {/* Notes */}
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Delivery & Quality Notes (Optional)"
              value={value || ''}
              onChangeText={onChange}
              placeholder="e.g. Moisture checked, vehicle RJ-14..."
            />
          )}
        />
      </Stack>

      <CreateSupplierModal
        visible={showAddSupplier}
        onClose={() => setShowAddSupplier(false)}
        onCreated={(newSup) => {
          setValue('supplierId', newSup.id);
        }}
      />

      <CreateIngredientModal
        visible={showAddMaterial}
        onClose={() => setShowAddMaterial(false)}
        onCreated={(newMat) => {
          setValue('itemId', newMat.id);
          setValue('unitPrice', newMat.unitCost);
        }}
      />
    </Modal>
  );
};

export default RecordPurchaseModal;

