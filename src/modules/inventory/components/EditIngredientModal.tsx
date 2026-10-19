import { useCurrencySymbol } from '../../../hooks/useMoney';
import { theme, useColors } from '../../../theme';
import React, { useState } from 'react';
import { useUpdateIngredient, useDeleteIngredient } from '../../../hooks/api/useInventory';
import { useAppStore } from '../../../stores/useAppStore';
import {
  Modal,
  Box,
  Stack,
  Row,
  Typography,
  TextInput,
  Button,
  ConfirmDialog,
} from '../../../components';
import { UnifiedStockItem } from '../../../services/api/inventoryService';

export interface EditIngredientModalProps {
  visible: boolean;
  item: UnifiedStockItem | null;
  onClose: () => void;
}

const COMMON_RAW_UNITS = ['kg', 'L', 'g', 'ml', 'tons', 'bags', 'drums', 'pcs'];

export const EditIngredientModal: React.FC<EditIngredientModalProps> = ({
  visible,
  item,
  onClose,
}) => {
  const symbol = useCurrencySymbol();
  const colors = useColors();
  const updateMutation = useUpdateIngredient();
  const deleteMutation = useDeleteIngredient();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<'raw_material' | 'packaging'>('raw_material');
  const [unit, setUnit] = useState('kg');
  const [unitCost, setUnitCost] = useState('0');
  const [currentStock, setCurrentStock] = useState('0');
  const [minThreshold, setMinThreshold] = useState('100');
  const [error, setError] = useState('');
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  // Re-seed the form whenever the sheet opens for an item (state adjusted during render, not in an effect).
  const syncKey = item ? `${item.id}:${visible}` : null;
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  if (syncKey !== syncedKey) {
    setSyncedKey(syncKey);
    if (item) {
      setName(item.name);
      setCategory(item.type === 'packaging' ? 'packaging' : 'raw_material');
      setUnit(item.unit || 'kg');
      setUnitCost(String(item.unitCostOrPrice ?? 0));
      setCurrentStock(String(item.currentStock ?? 0));
      setMinThreshold(String(item.minThreshold ?? 100));
      setError('');
    }
  }

  if (!item) return null;

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Material / item name is required');
      return;
    }
    if (!unit.trim()) {
      setError('Measurement unit is required');
      return;
    }

    try {
      const updated = await updateMutation.mutateAsync({
        id: item.id,
        name: name.trim(),
        category,
        unit: unit.trim(),
        unitCost: parseFloat(unitCost) || 0,
        currentStock: parseFloat(currentStock) || 0,
        minThreshold: parseFloat(minThreshold) || 0,
      });

      setBannerAlert({
        title: 'Stock Item Updated',
        message: `Successfully saved changes to "${updated.name}".`,
        variant: 'success',
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update stock item');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(item.id);
      setBannerAlert({
        title: 'Item Deleted',
        message: `"${item.name}" was removed from inventory.`,
        variant: 'info',
      });
      setConfirmDeleteVisible(false);
      onClose();
    } catch (err: any) {
      setConfirmDeleteVisible(false);
      setError(err.message || 'Failed to delete item');
      setBannerAlert({
        title: 'Delete Prevented',
        message: err.message || 'Cannot delete item currently in use.',
        variant: 'danger',
      });
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        onClose={onClose}
        title={`Edit ${item.name}`}
        primaryAction={{
          label: updateMutation.isPending ? 'Saving...' : 'Save Changes',
          onPress: handleSubmit,
          loading: updateMutation.isPending,
        }}
        secondaryAction={{
          label: 'Cancel',
          onPress: onClose,
        }}
      >
        <Stack gap="md">
          {error ? (
            <Box bg="redWash" padding="compact" borderRadius="sm">
              <Typography variant="bodySmall" color="error">
                {error}
              </Typography>
            </Box>
          ) : null}

          {/* Category Toggle */}
          <Box>
            <Typography
              variant="label"
              color="secondary"
              style={{ marginBottom: theme.spacing.xsm }}
            >
              Item Category
            </Typography>
            <Row gap="xs">
              <Button
                label="Raw Material"
                variant={category === 'raw_material' ? 'primary' : 'subtle'}
                size="sm"
                onPress={() => setCategory('raw_material')}
              />
              <Button
                label="Packaging Material"
                variant={category === 'packaging' ? 'primary' : 'subtle'}
                size="sm"
                onPress={() => setCategory('packaging')}
              />
            </Row>
          </Box>

          <TextInput
            label="Material / Item Name"
            placeholder="e.g. Soya De-oiled Cake, HDPE Bag"
            value={name}
            onChangeText={(val) => {
              setName(val);
              if (error) setError('');
            }}
          />

          {/* Custom Unit Selector */}
          <Box>
            <Typography
              variant="label"
              color="secondary"
              style={{ marginBottom: theme.spacing.xsm }}
            >
              Measurement Unit
            </Typography>
            <Row gap="xs" wrap style={{ marginBottom: theme.spacing.sm }}>
              {COMMON_RAW_UNITS.map((u) => (
                <Button
                  key={u}
                  label={u}
                  variant={unit === u ? 'primary' : 'outline'}
                  size="sm"
                  onPress={() => setUnit(u)}
                />
              ))}
            </Row>
            <TextInput
              label="Custom Unit (if not in presets)"
              placeholder="e.g. liters, cartons, bundles"
              value={unit}
              onChangeText={setUnit}
            />
          </Box>

          <Row gap="md">
            <Box flex={1}>
              <TextInput
                label={`Standard Cost (${symbol} / ${unit})`}
                placeholder="0"
                keyboardType="numeric"
                value={unitCost}
                onChangeText={setUnitCost}
              />
            </Box>
            <Box flex={1}>
              <TextInput
                label={`Safety Alert Stock (${unit})`}
                placeholder="100"
                keyboardType="numeric"
                value={minThreshold}
                onChangeText={setMinThreshold}
              />
            </Box>
          </Row>

          <TextInput
            label={`Current Stock Quantity (${unit})`}
            placeholder="0"
            keyboardType="numeric"
            value={currentStock}
            onChangeText={setCurrentStock}
            hint="Editing this records an audit adjustment in the ledger."
          />

          {/* Danger Zone: Delete item */}
          <Box
            style={{
              marginTop: theme.spacing.md,
              paddingTop: theme.spacing.base,
              borderTopWidth: 1,
              borderTopColor: colors.border.subtle,
            }}
          >
            <Row justify="space-between" align="center">
              <Box flex={1}>
                <Typography variant="bodySmall" weight="bold" color="error">
                  Delete Item
                </Typography>
                <Typography variant="caption" color="muted">
                  Permanently remove this material from warehouse records.
                </Typography>
              </Box>
              <Button
                label="Delete"
                variant="danger"
                size="sm"
                leftIcon="trash-outline"
                onPress={() => setConfirmDeleteVisible(true)}
              />
            </Row>
          </Box>
        </Stack>
      </Modal>

      <ConfirmDialog
        visible={confirmDeleteVisible}
        title="Delete Stock Item?"
        message={`Are you sure you want to delete "${item.name}"? If it is used in active recipes, the deletion will be blocked.`}
        confirmLabel="Yes, Delete Item"
        isDestructive={true}
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onClose={() => setConfirmDeleteVisible(false)}
      />
    </>
  );
};

export default EditIngredientModal;
