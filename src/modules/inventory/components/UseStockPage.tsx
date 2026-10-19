import React, { useState } from 'react';
import { useColors } from '../../../theme';
import { useIngredients, useRecordUsage } from '../../../hooks/api/useInventory';
import { useAppStore } from '../../../stores/useAppStore';
import { openSheet } from '../../../navigation/sheets';
import {
  Badge,
  Box,
  Button,
  Card,
  ChipPicker,
  FlowHeaderCard,
  FlowPage,
  FlowSection,
  IconTile,
  OptionGrid,
  ProgressBar,
  QuantityStepper,
  Row,
  SelectedCard,
  Stack,
  TextInput,
  Typography,
} from '../../../components';

export interface UseStockPageProps {
  onClose: () => void;
  itemId?: string | null;
  kind?: 'usage' | 'waste' | null;
}

type Reason = 'mix' | 'packaging' | 'damaged' | 'other';

const REASONS: {
  value: Reason;
  label: string;
  icon: 'flask-outline' | 'archive-outline' | 'trash-outline' | 'create-outline';
  kind: 'usage' | 'waste';
}[] = [
  { value: 'mix', label: 'Production / Mix', icon: 'flask-outline', kind: 'usage' },
  { value: 'packaging', label: 'Packaging line', icon: 'archive-outline', kind: 'usage' },
  { value: 'damaged', label: 'Damaged / Spoilage', icon: 'trash-outline', kind: 'waste' },
  { value: 'other', label: 'Other use', icon: 'create-outline', kind: 'usage' },
];

const stepFor = (stock: number) => (stock >= 1000 ? 100 : stock >= 100 ? 10 : 1);

/** Use Stock: take raw material or packaging out, with a reason. Full-page flow from the Stitch Lite design. */
export const UseStockPage: React.FC<UseStockPageProps> = ({
  onClose,
  itemId: initialItem,
  kind,
}) => {
  const colors = useColors();
  const { data: ingredients = [] } = useIngredients();
  const recordUsage = useRecordUsage();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const [itemId, setItemId] = useState<string>(initialItem ?? '');
  const [picking, setPicking] = useState(!initialItem);
  const [reason, setReason] = useState<Reason | null>(kind === 'waste' ? 'damaged' : null);
  const [quantity, setQuantity] = useState(0);
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');

  const item = ingredients.find((i) => i.id === itemId);
  const onHand = item?.currentStock ?? 0;
  const remaining = onHand - quantity;
  const low = item ? remaining <= item.minThreshold : false;
  const over = quantity > onHand;

  const submit = async () => {
    if (!item) return setError('Choose the item you are using');
    if (!reason) return setError('Choose a reason');
    if (!(quantity > 0)) return setError('Enter a quantity above 0');
    if (over) return setError(`Only ${onHand} ${item.unit} on hand`);
    const picked = REASONS.find((r) => r.value === reason)!;
    try {
      await recordUsage.mutateAsync({
        itemId: item.id,
        quantity,
        kind: picked.kind,
        note: memo.trim() ? `${picked.label}: ${memo.trim()}` : picked.label,
      });
      setBannerAlert({
        title: picked.kind === 'waste' ? 'Waste recorded' : 'Stock used',
        message: `${quantity} ${item.unit} of ${item.name} taken out. ${remaining.toLocaleString('en-IN')} ${item.unit} left.`,
        variant: 'warning',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not record this');
    }
  };

  return (
    <FlowPage title="Use Stock" onClose={onClose}>
      <FlowHeaderCard
        icon="log-out-outline"
        tone="warning"
        title="Use / Deduct Stock"
        description="Record consumed material, machine feed, or spoilage write-offs"
        chip="Discharge"
      />

      <FlowSection
        label="Target material"
        action={{
          label: picking ? 'Done' : 'Change item',
          icon: 'swap-horizontal',
          onPress: () => setPicking((v) => !v),
        }}
      >
        {item ? (
          <SelectedCard
            icon="cube-outline"
            tone="warning"
            title={item.name}
            subtitle="Current on-hand"
            right={
              <Typography variant="dataLarge" color="primary" tabular>
                {onHand.toLocaleString('en-IN')} {item.unit}
              </Typography>
            }
          />
        ) : (
          <Typography variant="bodySmall" color="secondary">
            Pick the material or packaging you used.
          </Typography>
        )}
        {picking && (
          <ChipPicker
            options={ingredients.map((i) => ({ value: i.id, label: i.name }))}
            selected={itemId}
            onSelect={(value) => {
              setItemId(String(value));
              setQuantity(0);
              setPicking(false);
              setError('');
            }}
          />
        )}
      </FlowSection>

      <FlowSection label="Reason for deduction" hint="Required">
        <OptionGrid
          tone="warning"
          options={REASONS}
          selected={reason}
          onSelect={(value) => {
            setReason(value);
            setError('');
          }}
        />
      </FlowSection>

      <FlowSection label="Quantity discharged" hint={item ? `Unit: ${item.unit}` : undefined}>
        <QuantityStepper
          tone="warning"
          value={quantity}
          onChange={(v) => {
            setQuantity(v);
            setError('');
          }}
          unit={item?.unit}
          step={stepFor(onHand)}
          max={onHand || undefined}
        />
        <Row gap="xs" wrap>
          {[10, 25, 50].map((add) => (
            <Button
              key={add}
              label={`+${add}`}
              variant="subtle"
              size="sm"
              onPress={() => setQuantity(Math.min(onHand, quantity + add))}
            />
          ))}
          <Button
            label="Use all"
            variant="tonalWarning"
            size="sm"
            onPress={() => setQuantity(onHand)}
          />
        </Row>
        {item && (
          <Box
            style={{
              padding: 12,
              borderRadius: 8,
              backgroundColor: colors.background.surfaceSecondary,
              gap: 8,
            }}
          >
            <Row justify="space-between" align="center">
              <Box>
                <Typography variant="bodySmall" color="secondary">
                  Remaining balance
                </Typography>
                <Typography variant="dataLarge" color={over ? 'error' : 'primary'} tabular>
                  {remaining.toLocaleString('en-IN')} {item.unit}
                </Typography>
              </Box>
              {quantity > 0 && low && !over && (
                <Badge label="Low level" variant="danger" size="sm" />
              )}
              {over && <Badge label="Not enough" variant="danger" size="sm" />}
            </Row>
            <ProgressBar
              value={onHand > 0 ? Math.max(0, remaining) / onHand : 0}
              color={low || over ? colors.accent.error : colors.brand.medium}
              height={8}
            />
          </Box>
        )}
      </FlowSection>

      <FlowSection label="Note" hint="Optional">
        <TextInput
          label="Shift memo / mixer station"
          value={memo}
          onChangeText={setMemo}
          placeholder="e.g. used for afternoon mixer cycle"
        />
      </FlowSection>

      {item && quantity > 0 && low && !over && (
        <Card tone="warning" padding="compact">
          <Row gap="sm" align="flex-start">
            <IconTile icon="notifications-outline" tone="warning" size={32} />
            <Box flex={1}>
              <Typography variant="title" color="warning">
                Reorder threshold reached
              </Typography>
              <Typography variant="bodySmall" color="secondary">
                {remaining.toLocaleString('en-IN')} {item.unit} left after this, below the safety
                minimum of {item.minThreshold.toLocaleString('en-IN')} {item.unit}. It will show as
                a low-stock alert on Home.
              </Typography>
              <Button
                label="Reorder after saving"
                variant="ghost"
                size="sm"
                onPress={async () => {
                  await submit();
                  openSheet('record_purchase', { itemId: item.id }, { replace: true });
                }}
              />
            </Box>
          </Row>
        </Card>
      )}

      {error ? (
        <Typography variant="bodySmall" color="error">
          {error}
        </Typography>
      ) : null}

      <Stack gap="xs">
        <Button
          label={
            item && quantity > 0
              ? `Confirm Deduction (${quantity} ${item.unit})`
              : 'Confirm Deduction'
          }
          variant="warning"
          size="lg"
          leftIcon="checkmark-circle-outline"
          fullWidth
          loading={recordUsage.isPending}
          onPress={submit}
        />
        <Button label="Cancel" variant="ghost" fullWidth onPress={onClose} />
      </Stack>
    </FlowPage>
  );
};

export default UseStockPage;
