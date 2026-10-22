import { openSheet } from '../../../navigation/sheets';
import React, { useState } from 'react';
import {
  useCompleteBatchRun,
  useProductionBatches,
  useProductionSetups,
} from '../../../hooks/api/useProduction';
import { useIngredients, useProducts } from '../../../hooks/api/useInventory';
import { batchBreakdown, formatDuration, ratesFor } from '../../../utils/batchEstimates';
import { BatchBreakdownView } from './BatchBreakdownView';
import { useFactorySettings } from '../../../hooks/api/useDashboard';
import { useAppStore } from '../../../stores/useAppStore';
import {
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
  const { data: batches = [] } = useProductionBatches();
  const { data: setups = [] } = useProductionSetups();
  const { data: ingredients = [] } = useIngredients();
  const { data: products = [] } = useProducts();
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
  const [hoursText, setHoursText] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);
  // Time since the run started, taken once when the page opens.
  const [openedAt] = useState(() => Date.now());
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
  const made = units ?? batch.expectedUnits ?? 0;
  const packSize =
    size !== null ? Number(size) || 0 : setup?.unitSize || settings?.defaultUnitSize || 0;
  const finished = made * packSize;
  const packaging = ingredients.find((i) => i.category === 'packaging');
  const packagingCost = packaging ? made * packaging.unitCost : 0;
  const short = packaging && made > packaging.currentStock;
  const elapsedMinutes = batch.startedAt
    ? Math.max(1, Math.round((openedAt - Date.parse(batch.startedAt)) / 60000))
    : 0;
  const minutes = hoursText !== null ? Math.round((Number(hoursText) || 0) * 60) : elapsedMinutes;
  const rates = ratesFor(made, minutes);
  const product = products.find((p) => p.id === batch.productId);
  const price = product?.sellingPricePerUnit ?? product?.sellingPricePerBag ?? 0;
  const breakdown = batchBreakdown({
    lines: batch.itemsConsumed.map((i) => ({
      name: i.ingredientName,
      quantity: i.actualQuantity,
      unit: i.unit,
      rate: i.unitCostSnapshot,
    })),
    packagingCost,
    units: made,
    packSize,
    price,
  });

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
          durationMinutes: minutes || undefined,
          rememberRate: remember,
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

      <FlowSection
        label="Run time"
        hint={batch.plannedHours ? `Planned ${batch.plannedHours} h` : undefined}
      >
        <TextInput
          label="Hours it ran"
          value={hoursText ?? (minutes ? String(Math.round((minutes / 60) * 100) / 100) : '')}
          onChangeText={setHoursText}
          keyboardType="numeric"
          suffix="h"
          hint={
            elapsedMinutes
              ? `Time since you started: ${formatDuration(elapsedMinutes)}. Edit it if the mixer ran for less.`
              : undefined
          }
        />
        {rates ? (
          <Stack gap="xs">
            <Row justify="space-between">
              <Typography variant="bodySmall" color="secondary">
                Output per hour
              </Typography>
              <Typography variant="dataMedium" tabular>
                {rates.perHour} {outputUnit}
              </Typography>
            </Row>
            <Row justify="space-between">
              <Typography variant="bodySmall" color="secondary">
                Output per minute
              </Typography>
              <Typography variant="dataMedium" tabular>
                {rates.perMinute} {outputUnit}
              </Typography>
            </Row>
            <Row justify="space-between">
              <Typography variant="bodySmall" color="secondary">
                Time per {outputUnit}
              </Typography>
              <Typography variant="dataMedium" tabular>
                {rates.minutesPerUnit} min
              </Typography>
            </Row>
          </Stack>
        ) : (
          <Typography variant="bodySmall" color="secondary">
            Enter the output and run time to see the production rate.
          </Typography>
        )}
        <Button
          label={remember ? 'Saving this speed to the recipe' : 'Save this speed to the recipe'}
          variant={remember ? 'subtle' : 'ghost'}
          size="sm"
          leftIcon={remember ? 'checkmark-circle' : 'ellipse-outline'}
          onPress={() => setRemember((v) => !v)}
        />
      </FlowSection>

      <FlowSection label="Batch summary">
        <BatchBreakdownView
          breakdown={breakdown}
          outputUnit={outputUnit}
          baseUnit={baseUnit}
          price={price}
          onAddPrice={() => openSheet('set_price', { productId: batch.productId })}
        />
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
