import React, { useState } from 'react';
import { useProductionBatches, useUpdateBatch } from '../../../hooks/api/useProduction';
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

export interface EditBatchPageProps {
  onClose: () => void;
  batchId?: string | null;
}

/** Edit a batch: fix the output, run time, wastage, date or notes. Output changes move stock. */
export const EditBatchPage: React.FC<EditBatchPageProps> = ({ onClose, batchId }) => {
  const { data: batches = [] } = useProductionBatches();
  const update = useUpdateBatch();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);
  const batch = batches.find((b) => b.id === batchId);

  const [units, setUnits] = useState(0);
  const [size, setSize] = useState('');
  const [hours, setHours] = useState('');
  const [wastage, setWastage] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [planned, setPlanned] = useState('');
  const [expected, setExpected] = useState('');
  const [error, setError] = useState('');
  const [seededFor, setSeededFor] = useState<string | null>(null);

  // Seed once per batch (state adjusted during render, not in an effect).
  if (batch && seededFor !== batch.id) {
    setSeededFor(batch.id);
    setUnits(batch.unitsPacked);
    setSize(
      batch.unitsPacked > 0 ? String(batch.actualFinishedQuantity / batch.unitsPacked || '') : '',
    );
    setHours(
      batch.durationMinutes ? String(Math.round((batch.durationMinutes / 60) * 100) / 100) : '',
    );
    setWastage(batch.measurableWastage ? String(batch.measurableWastage) : '');
    setNotes(batch.notes ?? '');
    setDate(batch.date);
    setPlanned(batch.plannedHours ? String(batch.plannedHours) : '');
    setExpected(batch.expectedUnits ? String(batch.expectedUnits) : '');
  }

  if (!batch) return null;
  const running = batch.status === 'in_progress';
  const finished = batch.status === 'confirmed';

  if (batch.status === 'reversed') {
    return (
      <FlowPage title="Edit Batch" onClose={onClose}>
        <Card padding="normal">
          <Typography variant="bodySmall" color="secondary">
            {batch.batchNumber} was cancelled, so it cannot be edited. Use Run again to start a new
            one from it.
          </Typography>
          <Button label="Close" variant="ghost" onPress={onClose} />
        </Card>
      </FlowPage>
    );
  }

  const save = async () => {
    if (finished && !(units > 0)) return setError('Output must be above 0');
    try {
      await update.mutateAsync({
        id: batch.id,
        input: {
          ...(finished
            ? {
                unitsPacked: units,
                unitSize: Number(size) || undefined,
                durationMinutes: hours ? Math.round(Number(hours) * 60) : undefined,
                measurableWastage: Number(wastage) || 0,
              }
            : {
                plannedHours: Number(planned) || undefined,
                expectedUnits: Number(expected) || undefined,
              }),
          notes: notes.trim(),
          date: date.trim() || undefined,
        },
      });
      setBannerAlert({
        title: 'Batch updated',
        message: `${batch.batchNumber} saved${finished ? '. Stock and cost were recalculated.' : '.'}`,
        variant: 'success',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not save this batch');
    }
  };

  return (
    <FlowPage title="Edit Batch" onClose={onClose}>
      <FlowHeaderCard
        icon="create-outline"
        title={`${batch.batchNumber} · ${batch.productName}`}
        description={running ? 'Running. Adjust the plan and notes.' : 'Fix what was recorded.'}
        chip={running ? 'Running' : 'Done'}
      />

      {finished && (
        <>
          <FlowSection label="Output" hint={`Was ${batch.unitsPacked} ${batch.outputUnit}`}>
            <QuantityStepper
              value={units}
              onChange={(v) => {
                setUnits(v);
                setError('');
              }}
              unit={batch.outputUnit}
              step={units >= 100 ? 10 : 1}
              min={1}
            />
            <Row gap="sm">
              <Box flex={1}>
                <TextInput
                  label="Pack size"
                  value={size}
                  onChangeText={setSize}
                  keyboardType="numeric"
                  suffix={batch.baseUnit}
                />
              </Box>
              <Box flex={1}>
                <TextInput
                  label="Hours it ran"
                  value={hours}
                  onChangeText={setHours}
                  keyboardType="numeric"
                  suffix="h"
                />
              </Box>
            </Row>
            <Typography variant="bodySmall" color="secondary">
              Changing the output adds or removes finished stock and packaging, and recalculates the
              cost per pack. Ingredient amounts cannot be edited here: delete the batch and run it
              again with the right amounts.
            </Typography>
          </FlowSection>

          <FlowSection label="Loss" hint="Optional">
            <TextInput
              label={`Wastage (${batch.baseUnit})`}
              value={wastage}
              onChangeText={setWastage}
              keyboardType="numeric"
              suffix={batch.baseUnit}
            />
          </FlowSection>
        </>
      )}

      {running && (
        <FlowSection label="Plan" hint="Optional">
          <Row gap="sm">
            <Box flex={1}>
              <TextInput
                label="Planned hours"
                value={planned}
                onChangeText={setPlanned}
                keyboardType="numeric"
                suffix="h"
              />
            </Box>
            <Box flex={1}>
              <TextInput
                label={`Expected ${batch.outputUnit}`}
                value={expected}
                onChangeText={setExpected}
                keyboardType="numeric"
              />
            </Box>
          </Row>
        </FlowSection>
      )}

      <FlowSection label="Details">
        <TextInput label="Date" value={date} onChangeText={setDate} leftIcon="calendar-outline" />
        <TextInput label="Notes" value={notes} onChangeText={setNotes} multiline />
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

export default EditBatchPage;
