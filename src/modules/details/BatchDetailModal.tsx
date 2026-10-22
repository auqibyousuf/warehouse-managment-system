import { openSheet } from '../../navigation/sheets';
import { batchBreakdown, formatDuration, ratesFor } from '../../utils/batchEstimates';
import { useProducts } from '../../hooks/api/useInventory';
import { BatchBreakdownView } from '../production/components/BatchBreakdownView';
import { batchStatusView } from '../../utils/batchStatus';
import React, { useState } from 'react';
import { useMoney } from '../../hooks/useMoney';
import {
  useDeleteBatch,
  useProductionBatches,
  useReverseProductionBatch,
} from '../../hooks/api/useProduction';
import { useAppStore } from '../../stores/useAppStore';
import {
  Badge,
  Box,
  Button,
  Card,
  ConfirmDialog,
  InsetStats,
  Modal,
  Row,
  Stack,
  Typography,
} from '../../components';

export interface BatchDetailModalProps {
  visible: boolean;
  onClose: () => void;
  batchId: string | null;
}

/** Everything about one batch: output, cost breakdown, what was consumed, and the reversal. */
export const BatchDetailModal: React.FC<BatchDetailModalProps> = ({
  visible,
  onClose,
  batchId,
}) => {
  const money = useMoney();
  const { data: batches = [] } = useProductionBatches();
  const reverse = useReverseProductionBatch();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const remove = useDeleteBatch();

  const { data: products = [] } = useProducts();
  const batch = batches.find((b) => b.id === batchId);
  if (!batch) return null;
  const rates = batch.durationMinutes ? ratesFor(batch.unitsPacked, batch.durationMinutes) : null;
  const price = products.find((p) => p.id === batch.productId)?.sellingPricePerUnit ?? 0;
  const breakdown = batchBreakdown({
    lines: batch.itemsConsumed.map((i) => ({
      name: i.ingredientName,
      quantity: i.actualQuantity,
      unit: i.unit,
      rate: i.unitCostSnapshot,
    })),
    packagingCost: batch.packagingCost,
    units: batch.status === 'confirmed' ? batch.unitsPacked : 0,
    packSize: batch.unitsPacked > 0 ? batch.actualFinishedQuantity / batch.unitsPacked : 0,
    price,
  });

  const reversed = batch.status === 'reversed';
  const running = batch.status === 'in_progress';
  const view = batchStatusView(batch.status);
  const perUnit = batch.directCostPerUnit ?? batch.directCostPerBag ?? 0;

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(batch.id);
      setBannerAlert({
        title: 'Batch deleted',
        message: `${batch.batchNumber} was removed and its stock put back.`,
        variant: 'info',
      });
      setDeleting(false);
      onClose();
    } catch (err: any) {
      setDeleting(false);
      setBannerAlert({ title: 'Could not delete', message: err.message, variant: 'danger' });
    }
  };

  const rerun = () => {
    onClose();
    openSheet('start_batch', { rerunBatchId: batch.id });
  };

  const handleReverse = async () => {
    try {
      await reverse.mutateAsync({
        batchId: batch.id,
        reason: 'Operator reversal from batch details',
      });
      setBannerAlert({
        title: 'Batch reversed',
        message: `${batch.batchNumber} reversed. Ingredients and packaging are back in stock.`,
        variant: 'warning',
      });
      setConfirming(false);
      onClose();
    } catch (err: any) {
      setConfirming(false);
      setBannerAlert({ title: 'Could not reverse', message: err.message, variant: 'danger' });
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        onClose={onClose}
        title={batch.productName}
        subtitle={`${batch.batchNumber} • ${batch.date}`}
        secondaryAction={{ label: 'Close', onPress: onClose }}
        primaryAction={
          reversed
            ? { label: 'Run again', onPress: rerun }
            : running
              ? {
                  label: 'Complete Batch',
                  onPress: () => {
                    onClose();
                    openSheet('complete_batch', { batchId: batch.id });
                  },
                  variant: 'success',
                }
              : { label: 'Run again', onPress: rerun }
        }
      >
        <Stack gap="md">
          <Row justify="space-between" align="center">
            <Badge label={view.label} variant={view.badge} size="sm" />
            {batch.setupVersion ? (
              <Typography variant="caption" color="muted">
                Recipe v{batch.setupVersion}
              </Typography>
            ) : null}
          </Row>

          <Row gap="sm" wrap>
            {!reversed && (
              <Button
                label="Edit"
                variant="subtle"
                size="sm"
                leftIcon="create-outline"
                onPress={() => {
                  onClose();
                  openSheet('edit_batch', { batchId: batch.id });
                }}
              />
            )}
            <Button
              label="Run again"
              variant="subtle"
              size="sm"
              leftIcon="repeat-outline"
              onPress={rerun}
            />
            <Button
              label="Delete"
              variant="ghost"
              size="sm"
              leftIcon="trash-outline"
              onPress={() => setDeleting(true)}
            />
          </Row>

          <InsetStats
            stats={[
              {
                label: 'Output',
                value: running ? 'Not recorded' : `${batch.unitsPacked} ${batch.outputUnit}`,
              },
              { label: 'Cost per unit', value: money(perUnit) },
            ]}
          />

          <Card variant="flat" padding="compact">
            <BatchBreakdownView
              breakdown={breakdown}
              outputUnit={batch.outputUnit}
              baseUnit={batch.baseUnit || 'kg'}
              price={price}
              onAddPrice={() => {
                onClose();
                openSheet('set_price', { productId: batch.productId });
              }}
            />
          </Card>

          {(rates || batch.durationMinutes) && (
            <Card variant="flat" padding="compact">
              <Stack gap="xs">
                {batch.durationMinutes ? (
                  <Row justify="space-between">
                    <Typography variant="bodySmall" color="secondary">
                      Run time
                    </Typography>
                    <Typography variant="dataMedium" tabular>
                      {formatDuration(batch.durationMinutes)}
                    </Typography>
                  </Row>
                ) : null}
                {rates && (
                  <Row justify="space-between">
                    <Typography variant="bodySmall" color="secondary">
                      Output rate
                    </Typography>
                    <Typography variant="dataMedium" tabular>
                      {rates.perHour} {batch.outputUnit}/h · {rates.perMinute}/min
                    </Typography>
                  </Row>
                )}
              </Stack>
            </Card>
          )}

          <Box>
            <Typography variant="label" color="muted" style={{ marginBottom: 8 }}>
              Ingredients used
            </Typography>
            <Stack gap="xs">
              {batch.itemsConsumed.map((item) => (
                <Row key={item.ingredientId} justify="space-between" align="center">
                  <Box flex={1}>
                    <Typography variant="bodyMedium" color="primary" numberOfLines={1}>
                      {item.ingredientName}
                    </Typography>
                    <Typography variant="caption" color="muted">
                      Planned {item.plannedQuantity} {item.unit}
                    </Typography>
                  </Box>
                  <Box align="flex-end">
                    <Typography variant="dataMedium" color="primary" tabular>
                      {item.actualQuantity} {item.unit}
                    </Typography>
                    <Typography variant="caption" color="muted">
                      {money(item.lineCost)}
                    </Typography>
                  </Box>
                </Row>
              ))}
            </Stack>
          </Box>

          {!reversed && (
            <Button
              label={running ? 'Cancel run (keep record)' : 'Reverse batch (keep record)'}
              variant="ghost"
              size="sm"
              onPress={() => setConfirming(true)}
            />
          )}

          {(batch.measurableWastage ?? 0) > 0 && (
            <Typography variant="bodySmall" color="warning">
              Wastage recorded: {batch.measurableWastage} {batch.baseUnit}
            </Typography>
          )}
          {batch.notes ? (
            <Typography variant="bodySmall" color="secondary">
              Notes: {batch.notes}
            </Typography>
          ) : null}
        </Stack>
      </Modal>

      <ConfirmDialog
        visible={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={handleDelete}
        title="Delete this batch?"
        message={
          reversed
            ? 'The record and its ledger entries are removed. Stock is already back.'
            : `The record is removed and stock goes back as if it never ran${running ? '' : `: materials return and ${batch.unitsPacked} ${batch.outputUnit} of finished goods are taken out`}. This cannot be done if they were already sold.`
        }
        confirmLabel="Delete batch"
        cancelLabel="Keep"
        isDestructive
        loading={remove.isPending}
      />

      <ConfirmDialog
        visible={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleReverse}
        title={running ? 'Cancel this run?' : 'Reverse this batch?'}
        message={
          running
            ? 'The loaded materials return to stock. Nothing was produced yet.'
            : `Ingredients and packaging return to stock and ${batch.unitsPacked} ${batch.outputUnit} of finished goods are removed. This cannot be done if they were already sold.`
        }
        confirmLabel={running ? 'Cancel run' : 'Reverse Batch'}
        cancelLabel="Keep Batch"
        isDestructive
        loading={reverse.isPending}
      />
    </>
  );
};

export default BatchDetailModal;
