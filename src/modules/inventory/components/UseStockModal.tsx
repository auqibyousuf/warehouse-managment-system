import React, { useState } from 'react';
import { useIngredients, useRecordUsage } from '../../../hooks/api/useInventory';
import { useAppStore } from '../../../stores/useAppStore';
import { ChipPicker, Modal, Stack, TextInput, Typography } from '../../../components';

export interface UseStockModalProps {
  visible: boolean;
  onClose: () => void;
  itemId?: string | null;
  kind?: 'usage' | 'waste' | null;
}

/** Take raw material or packaging out of stock: used outside a batch, or lost to waste. */
export const UseStockModal: React.FC<UseStockModalProps> = ({
  visible,
  onClose,
  itemId,
  kind: initialKind,
}) => {
  const { data: ingredients = [] } = useIngredients();
  const recordUsage = useRecordUsage();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const [selectedId, setSelectedId] = useState<string>(itemId ?? '');
  const [kind, setKind] = useState<'usage' | 'waste'>(initialKind ?? 'usage');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const selected = ingredients.find((i) => i.id === selectedId);

  const handleSubmit = async () => {
    if (!selected) return setError('Choose the item you used');
    const amount = Number(quantity);
    if (!(amount > 0)) return setError('Enter a quantity above 0');
    try {
      await recordUsage.mutateAsync({ itemId: selected.id, quantity: amount, kind, note });
      setBannerAlert({
        title: kind === 'waste' ? 'Waste recorded' : 'Stock used',
        message: `${amount} ${selected.unit} of ${selected.name} taken out of stock.`,
        variant: 'warning',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not record this');
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Use Stock"
      subtitle="Batches deduct their own ingredients automatically"
      primaryAction={{
        label: kind === 'waste' ? 'Record Waste' : 'Use Stock',
        onPress: handleSubmit,
        loading: recordUsage.isPending,
      }}
      secondaryAction={{ label: 'Cancel', onPress: onClose }}
    >
      <Stack gap="md">
        <ChipPicker
          options={[
            { value: 'usage', label: 'Used' },
            { value: 'waste', label: 'Waste / loss' },
          ]}
          selected={kind}
          onSelect={(value) => setKind(value as 'usage' | 'waste')}
        />

        <Stack gap="xs">
          <Typography variant="label" color="muted">
            Item
          </Typography>
          <ChipPicker
            options={ingredients.map((i) => ({ value: i.id, label: i.name }))}
            selected={selectedId}
            onSelect={(value) => {
              setSelectedId(String(value));
              setError('');
            }}
          />
        </Stack>

        <TextInput
          label={selected ? `Quantity used (${selected.unit})` : 'Quantity used'}
          value={quantity}
          onChangeText={(text) => {
            setQuantity(text);
            setError('');
          }}
          keyboardType="numeric"
          hint={selected ? `In stock: ${selected.currentStock} ${selected.unit}` : undefined}
          error={error}
        />
        <TextInput
          label="Note (optional)"
          value={note}
          onChangeText={setNote}
          placeholder={kind === 'waste' ? 'e.g. spilled, damaged bag' : 'e.g. hand mix, sample'}
        />
      </Stack>
    </Modal>
  );
};

export default UseStockModal;
