import React, { useState } from 'react';
import { useAdjustStock, useInventoryItems } from '../../../hooks/api/useInventory';
import { useAppStore } from '../../../stores/useAppStore';
import {
  Badge,
  Button,
  ChipPicker,
  FlowHeaderCard,
  FlowPage,
  FlowSection,
  QuantityStepper,
  Row,
  SelectedCard,
  Stack,
  TextInput,
  Typography,
} from '../../../components';

export interface CountStockPageProps {
  onClose: () => void;
  preselectedItemId?: string | null;
}

/** Count Stock: correct the system to the physical count; leaves a permanent ledger entry. */
export const CountStockPage: React.FC<CountStockPageProps> = ({ onClose, preselectedItemId }) => {
  const { data: items = [] } = useInventoryItems();
  const adjust = useAdjustStock();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const [itemId, setItemId] = useState(preselectedItemId ?? '');
  const [picking, setPicking] = useState(!preselectedItemId);
  const [counted, setCounted] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const item = items.find((i) => i.id === itemId);
  const count = counted ?? item?.currentStock ?? 0;
  const delta = item ? count - item.currentStock : 0;

  const submit = async () => {
    if (!item) return setError('Choose the item you counted');
    if (delta === 0) return setError('The count matches the system, nothing to change');
    if (reason.trim().length < 3) return setError('Add a reason, e.g. month-end count');
    try {
      await adjust.mutateAsync({
        itemId: item.id,
        itemType: item.type,
        newQuantity: count,
        reason: reason.trim(),
      });
      setBannerAlert({
        title: 'Stock corrected',
        message: `${item.name} is now ${count} ${item.unit} (${delta > 0 ? '+' : ''}${delta}).`,
        variant: 'success',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not adjust this stock');
    }
  };

  return (
    <FlowPage title="Count Stock" onClose={onClose}>
      <FlowHeaderCard
        icon="clipboard-outline"
        title="Physical Count"
        description="Match the system to what is actually on the floor"
        chip="Audit"
      />

      <FlowSection
        label="Item"
        action={
          item
            ? {
                label: picking ? 'Done' : 'Change',
                icon: 'swap-horizontal',
                onPress: () => setPicking((v) => !v),
              }
            : undefined
        }
      >
        {item && (
          <SelectedCard
            icon="cube-outline"
            title={item.name}
            subtitle="System stock"
            right={
              <Typography variant="dataLarge" tabular>
                {item.currentStock.toLocaleString('en-IN')} {item.unit}
              </Typography>
            }
          />
        )}
        {(picking || !item) && (
          <ChipPicker
            options={items.map((i) => ({ value: i.id, label: i.name }))}
            selected={itemId}
            onSelect={(v) => {
              setItemId(String(v));
              setCounted(null);
              setPicking(false);
              setError('');
            }}
          />
        )}
      </FlowSection>

      {item && (
        <FlowSection label="Actual count">
          <QuantityStepper
            value={count}
            onChange={(v) => {
              setCounted(v);
              setError('');
            }}
            unit={item.unit}
            step={item.currentStock >= 1000 ? 100 : item.currentStock >= 100 ? 10 : 1}
          />
          <Row justify="space-between" align="center">
            <Typography variant="bodySmall" color="secondary">
              Difference
            </Typography>
            <Badge
              label={`${delta > 0 ? '+' : ''}${delta.toLocaleString('en-IN')} ${item.unit}`}
              variant={delta === 0 ? 'neutral' : delta > 0 ? 'success' : 'warning'}
              size="sm"
            />
          </Row>
        </FlowSection>
      )}

      <FlowSection label="Reason">
        <TextInput
          label="Why is it different?"
          value={reason}
          onChangeText={(t) => {
            setReason(t);
            setError('');
          }}
          placeholder="e.g. month-end count, breakage, spillage"
          multiline
        />
      </FlowSection>

      {error ? (
        <Typography variant="bodySmall" color="error">
          {error}
        </Typography>
      ) : null}

      <Stack gap="xs">
        <Button
          label="Confirm Count"
          size="lg"
          leftIcon="checkmark-circle-outline"
          fullWidth
          loading={adjust.isPending}
          onPress={submit}
        />
        <Button label="Cancel" variant="ghost" fullWidth onPress={onClose} />
      </Stack>
    </FlowPage>
  );
};

export default CountStockPage;
