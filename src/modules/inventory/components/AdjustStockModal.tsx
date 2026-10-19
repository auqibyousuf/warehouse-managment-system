import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stockAdjustmentSchema, StockAdjustmentFormData, StockAdjustmentFormInput } from '../../../validation/schemas';
import { useAdjustStock, useInventoryItems } from '../../../hooks/api/useInventory';
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
  Badge,
} from '../../../components';

export interface AdjustStockModalProps {
  visible: boolean;
  onClose: () => void;
  preselectedItemId?: string;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  visible,
  onClose,
  preselectedItemId,
}) => {
  const { data: items = [] } = useInventoryItems();
  const adjustStockMutation = useAdjustStock();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const defaultItem = items.find((i) => i.id === preselectedItemId) || items[0];

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<StockAdjustmentFormInput, unknown, StockAdjustmentFormData>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      itemId: defaultItem?.id || '',
      itemType: defaultItem?.type || 'raw_material',
      newQuantity: defaultItem?.currentStock || 0,
      reason: 'Physical monthly count audit',
    },
  });

  const selectedItemId = watch('itemId');
  const watchedNewQty = watch('newQuantity') || 0;
  const currentSelectedItem = items.find((i) => i.id === selectedItemId);

  const delta = currentSelectedItem ? watchedNewQty - currentSelectedItem.currentStock : 0;

  const onSubmit = async (data: StockAdjustmentFormData) => {
    try {
      await adjustStockMutation.mutateAsync({
        itemId: data.itemId,
        itemType: data.itemType,
        newQuantity: data.newQuantity,
        reason: data.reason,
      });

      setBannerAlert({
        title: 'Stock Reconciled',
        message: `Updated stock of ${currentSelectedItem?.name} to ${data.newQuantity} ${currentSelectedItem?.unit}. Logged adjustment delta of ${delta > 0 ? '+' : ''}${delta}.`,
        variant: 'success',
      });
      reset();
      onClose();
    } catch (err: any) {
      setBannerAlert({
        title: 'Adjustment Error',
        message: err.message || 'Failed to adjust stock',
        variant: 'danger',
      });
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Physical Stock Reconciliation"
      subtitle="Audited count adjustment with permanent ledger entry"
      primaryAction={{
        label: 'Confirm Adjustment',
        onPress: handleSubmit(onSubmit),
        loading: adjustStockMutation.isPending,
        variant: 'primary',
      }}
      secondaryAction={{
        label: 'Cancel',
        onPress: onClose,
      }}
    >
      <Stack gap="md">
        {/* Item Selector */}
        <Box>
          <Typography variant="label" color="secondary" style={{ marginBottom: 6 }}>
            Select Stock Item to Reconcile
          </Typography>
          <Row gap="xs" wrap>
            {items.map((item) => {
              const isSelected = item.id === selectedItemId;
              return (
                <Button
                  key={item.id}
                  label={`${item.name} (${item.currentStock} ${item.unit})`}
                  variant={isSelected ? 'primary' : 'subtle'}
                  size="sm"
                  onPress={() => {
                    setValue('itemId', item.id);
                    setValue('itemType', item.type);
                    setValue('newQuantity', item.currentStock);
                  }}
                />
              );
            })}
          </Row>
        </Box>

        {currentSelectedItem && (
          <Card variant="flat" padding="compact">
            <Row justify="space-between">
              <Typography variant="bodySmall" color="secondary">
                Current Recorded System Stock:
              </Typography>
              <Typography variant="bodySmall" weight="bold" color="primary">
                {currentSelectedItem.currentStock} {currentSelectedItem.unit}
              </Typography>
            </Row>
          </Card>
        )}

        {/* New Actual Count Input */}
        <Controller
          control={control}
          name="newQuantity"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Actual Count on Floor"
              value={value !== undefined ? String(value) : ''}
              onChangeText={(val) => onChange(parseFloat(val) || 0)}
              keyboardType="numeric"
              suffix={currentSelectedItem?.unit || 'units'}
              error={errors.newQuantity?.message}
            />
          )}
        />

        {/* Delta Display */}
        <Card variant="accent" padding="compact">
          <Row justify="space-between" align="center">
            <Typography variant="bodySmall" weight="semibold" color="brandDeep">
              Adjustment Difference:
            </Typography>
            <Badge
              label={`${delta >= 0 ? '+' : ''}${delta} ${currentSelectedItem?.unit || 'units'}`}
              variant={delta === 0 ? 'neutral' : delta > 0 ? 'success' : 'warning'}
              size="md"
            />
          </Row>
        </Card>

        {/* Reason */}
        <Controller
          control={control}
          name="reason"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Audit Reason"
              value={value}
              onChangeText={onChange}
              placeholder="e.g. Physical month-end count, bag breakage, spillage..."
              error={errors.reason?.message}
              multiline
            />
          )}
        />
      </Stack>
    </Modal>
  );
};

export default AdjustStockModal;
