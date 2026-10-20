import React, { useState } from 'react';
import { useMoney } from '../../../hooks/useMoney';
import {
  useCompleteBatchRun,
  useProductionBatches,
  useProductionSetups,
} from '../../../hooks/api/useProduction';
import { useIngredients } from '../../../hooks/api/useInventory';
import { useFactorySettings } from '../../../hooks/api/useDashboard';
import { useAppStore } from '../../../stores/useAppStore';
import {
  Badge,
  Box,
  Button,
  Card,
  FlowHeaderCard,
  FlowPage,
  FlowSection,
  QuantityStepper,
  Row,
  Stack,
  TextInput,
  Typography,
} from '../../../components';

export interface CompleteBatchPageProps {
  onClose: () => void;
  batchId?: string | null;
}

/** Complete Batch: now the output is known, record it. Finished stock and final cost are booked here. */
export const CompleteBatchPage: React.FC<CompleteBatchPageProps> = ({ onClose, batchId }) => {
  const money = useMoney();
  const { data: batches = [] } = useProductionBatches();
  const { data: setups = [] } = useProductionSetups();
  const { data: ingredients = [] } = useIngredients();
  const { data: settings } = useFactorySettings();
  const complete = useCompleteBatchRun();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const batch = batches.find((b) => b.id === batchId && b.status === 'in_progress');
  const setup = setups.find((s) => s.id === batch?.setupId);

  const [units, setUnits] = useState<number | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [unit, setUnit] = useState<string | null>(null);
  const [wastage, setWastage] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!batch) {
    return (
      <FlowPage title="Complete Batch" onClose={onClose}>
        <Card padding="normal">
          <Typography variant="bodySmall" color="secondary">
            This batch is no longer running.
          </Typography>
          <Button label="Close" variant="ghost" onPress={onClose} />
        </Card>
      </FlowPage>
    );
  }

  const outputUnit = unit ?? (batch.outputUnit || settings?.defaultUnitName || 'units');
  const baseUnit = batch.baseUnit || settings?.defaultBaseUnit || 'kg';
  const made = units ?? 0;
  const packSize =
    size !== null ? Number(size) || 0 : setup?.unitSize || settings?.defaultUnitSize || 0;
  const finished = made * packSize;
  const packaging = ingredients.find((i) => i.category === 'packaging');
  const packagingCost = packaging ? made * packaging.unitCost : 0;
  const total = batch.ingredientCost + packagingCost;
  const short = packaging && made > packaging.currentStock;

  const submit = async () => {
    if (!(made > 0)) return setError('Enter how much the batch made');
    if (short) return setError(`Only ${packaging!.currentStock} ${packaging!.name} in stock`);
    try {
      await complete.mutateAsync({
        id: batch.id,
        input: {
          unitsPacked: made,
          outputUnit: outputUnit.trim() || undefined,
          unitSize: packSize || undefined,
          actualFinishedQuantity: packSize ? finished : undefined,
          measurableWastage: Number(wastage) || 0,
          notes: notes.trim() || undefined,
        },
      });
      setBannerAlert({
        title: 'Batch completed',
        message: `${made} ${outputUnit} of ${batch.productName} added to stock.`,
        variant: 'success',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not complete this batch');
    }
  };

  return (
    <FlowPage title="Complete Batch" onClose={onClose}>
      <FlowHeaderCard
        icon="checkmark-done-outline"
        tone="success"
        title={`${batch.batchNumber} · ${batch.productName}`}
        description={`Started ${batch.date}. Record what it made.`}
        chip="Running"
      />

      <FlowSection label="Loaded into the mixer">
        <Stack gap="xs">
          {batch.itemsConsumed.map((i) => (
            <Row key={i.ingredientId} justify="space-between">
              <Typography variant="bodyMedium">{i.ingredientName}</Typography>
              <Typography variant="dataMedium" tabular>
                {i.actualQuantity} {i.unit}
              </Typography>
            </Row>
          ))}
        </Stack>
      </FlowSection>

      <FlowSection label="What did it make?">
        <QuantityStepper
          value={made}
          onChange={(v) => {
            setUnits(v);
            setError('');
          }}
          unit={outputUnit}
          step={made >= 100 ? 10 : 1}
        />
        <Row gap="sm">
          <Box flex={1}>
            <TextInput
              label="Pack size"
              value={size ?? (packSize ? String(packSize) : '')}
              onChangeText={setSize}
              keyboardType="numeric"
              suffix={baseUnit}
            />
          </Box>
          <Box flex={1}>
            <TextInput label="Packed as" value={outputUnit} onChangeText={setUnit} />
          </Box>
        </Row>
        {made > 0 && packSize > 0 && (
          <Typography variant="bodySmall" color="secondary">
            {finished.toLocaleString('en-IN')} {baseUnit} in total
          </Typography>
        )}
      </FlowSection>

      <FlowSection label="Final cost">
        <Row justify="space-between">
          <Typography variant="bodySmall" color="secondary">
            Materials
          </Typography>
          <Typography variant="dataMedium" tabular>
            {money(batch.ingredientCost)}
          </Typography>
        </Row>
        {packaging && (
          <Row justify="space-between">
            <Typography variant="bodySmall" color="secondary">
              Packaging ({made} × {money(packaging.unitCost)})
            </Typography>
            <Typography variant="dataMedium" tabular>
              {money(packagingCost)}
            </Typography>
          </Row>
        )}
        <Row justify="space-between" align="center">
          <Typography variant="title">Total</Typography>
          <Typography variant="dataLarge" tabular>
            {money(total)}
          </Typography>
        </Row>
        {made > 0 && (
          <Badge label={`${money(total / made)} / ${outputUnit}`} variant="neutral" size="sm" />
        )}
      </FlowSection>

      <FlowSection label="Loss & notes" hint="Optional">
        <TextInput
          label={`Wastage (${baseUnit})`}
          value={wastage}
          onChangeText={setWastage}
          keyboardType="numeric"
          suffix={baseUnit}
        />
        <TextInput label="Notes" value={notes} onChangeText={setNotes} multiline />
      </FlowSection>

      {error ? (
        <Typography variant="bodySmall" color="error">
          {error}
        </Typography>
      ) : null}

      <Stack gap="xs">
        <Button
          label="Complete Batch"
          variant="success"
          size="lg"
          leftIcon="checkmark-circle-outline"
          fullWidth
          loading={complete.isPending}
          onPress={submit}
        />
        <Button label="Cancel" variant="ghost" fullWidth onPress={onClose} />
      </Stack>
    </FlowPage>
  );
};

export default CompleteBatchPage;
