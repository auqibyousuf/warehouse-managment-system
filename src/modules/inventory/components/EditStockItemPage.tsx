import React, { useState } from 'react';
import { useCurrencySymbol } from '../../../hooks/useMoney';
import {
  useDeleteIngredient,
  useInventoryItems,
  useUpdateIngredient,
} from '../../../hooks/api/useInventory';
import { useAppStore } from '../../../stores/useAppStore';
import {
  Box,
  Button,
  ChipPicker,
  FlowHeaderCard,
  FlowPage,
  FlowSection,
  OptionGrid,
  Row,
  Stack,
  TextInput,
  Typography,
} from '../../../components';

export interface EditStockItemPageProps {
  onClose: () => void;
  itemId: string | null;
}

const UNITS = ['kg', 'L', 'g', 'ml', 'tons', 'bags', 'drums', 'pcs'];

/** Edit a raw material or packaging item. Stock changes here are logged as an audit adjustment. */
export const EditStockItemPage: React.FC<EditStockItemPageProps> = ({ onClose, itemId }) => {
  const symbol = useCurrencySymbol();
  const { data: items = [] } = useInventoryItems();
  const update = useUpdateIngredient();
  const remove = useDeleteIngredient();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);
  const item = items.find((i) => i.id === itemId);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<'raw_material' | 'packaging'>('raw_material');
  const [unit, setUnit] = useState('kg');
  const [unitCost, setUnitCost] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [minThreshold, setMinThreshold] = useState('');
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [seededFor, setSeededFor] = useState<string | null>(null);

  // Seed once per item (state adjusted during render, not in an effect).
  if (item && seededFor !== item.id) {
    setSeededFor(item.id);
    setName(item.name);
    setCategory(item.type === 'packaging' ? 'packaging' : 'raw_material');
    setUnit(item.unit || 'kg');
    setUnitCost(String(item.unitCostOrPrice ?? 0));
    setCurrentStock(String(item.currentStock ?? 0));
    setMinThreshold(String(item.minThreshold ?? 0));
  }

  if (!item) return null;

  const save = async () => {
    if (!name.trim()) return setError('Give the item a name');
    if (!unit.trim()) return setError('Choose a unit');
    try {
      const updated = await update.mutateAsync({
        id: item.id,
        name: name.trim(),
        category,
        unit: unit.trim(),
        unitCost: parseFloat(unitCost) || 0,
        currentStock: parseFloat(currentStock) || 0,
        minThreshold: parseFloat(minThreshold) || 0,
      });
      setBannerAlert({
        title: 'Item updated',
        message: `${updated.name} saved.`,
        variant: 'success',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not save this item');
    }
  };

  const doDelete = async () => {
    try {
      await remove.mutateAsync(item.id);
      setBannerAlert({
        title: 'Item deleted',
        message: `${item.name} was removed from stock.`,
        variant: 'info',
      });
      onClose();
    } catch (err: any) {
      setConfirming(false);
      setError(err.message || 'This item is in use, so it cannot be deleted.');
    }
  };

  return (
    <FlowPage title="Edit Item" onClose={onClose}>
      <FlowHeaderCard
        icon="cube-outline"
        title={item.name}
        description="Change details, cost or the alert level"
        chip="Stock item"
      />

      <FlowSection label="Item">
        <TextInput label="Name" value={name} onChangeText={setName} />
        <OptionGrid
          options={[
            { value: 'raw_material', label: 'Raw material', icon: 'leaf-outline' },
            { value: 'packaging', label: 'Packaging', icon: 'archive-outline' },
          ]}
          selected={category}
          onSelect={setCategory}
        />
      </FlowSection>

      <FlowSection label="Unit">
        <ChipPicker
          options={UNITS.map((u) => ({ value: u, label: u }))}
          selected={unit}
          onSelect={(v) => setUnit(String(v))}
        />
        <TextInput label="Or type your own" value={unit} onChangeText={setUnit} />
      </FlowSection>

      <FlowSection label="Cost & alerts">
        <Row gap="sm">
          <Box flex={1}>
            <TextInput
              label={`Cost per ${unit}`}
              value={unitCost}
              onChangeText={setUnitCost}
              keyboardType="numeric"
              prefix={symbol}
            />
          </Box>
          <Box flex={1}>
            <TextInput
              label={`Alert below (${unit})`}
              value={minThreshold}
              onChangeText={setMinThreshold}
              keyboardType="numeric"
            />
          </Box>
        </Row>
      </FlowSection>

      <FlowSection label="Quantity on hand">
        <TextInput
          label={`Stock (${unit})`}
          value={currentStock}
          onChangeText={setCurrentStock}
          keyboardType="numeric"
          hint="Changing this is logged as an audit adjustment."
        />
      </FlowSection>

      <FlowSection label="Delete item">
        <Typography variant="bodySmall" color="secondary">
          Removes this item from stock. It is blocked if a recipe still uses it.
        </Typography>
        {confirming ? (
          <Row gap="sm">
            <Button
              label="Yes, delete"
              variant="danger"
              size="sm"
              loading={remove.isPending}
              onPress={doDelete}
            />
            <Button label="Keep" variant="ghost" size="sm" onPress={() => setConfirming(false)} />
          </Row>
        ) : (
          <Button
            label="Delete item"
            variant="ghost"
            size="sm"
            leftIcon="trash-outline"
            onPress={() => setConfirming(true)}
          />
        )}
      </FlowSection>

      {error ? (
        <Typography variant="bodySmall" color="error">
          {error}
        </Typography>
      ) : null}

      <Stack gap="xs">
        <Button
          label="Save Changes"
          size="lg"
          leftIcon="checkmark-circle-outline"
          fullWidth
          loading={update.isPending}
          onPress={save}
        />
        <Button label="Cancel" variant="ghost" fullWidth onPress={onClose} />
      </Stack>
    </FlowPage>
  );
};

export default EditStockItemPage;
