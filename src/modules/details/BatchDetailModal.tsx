import { openSheet } from '../../navigation/sheets';
import { batchStatusView } from '../../utils/batchStatus';
import React, { useState } from 'react';
import { useMoney } from '../../hooks/useMoney';
import { useProductionBatches, useReverseProductionBatch } from '../../hooks/api/useProduction';
import { useAppStore } from '../../stores/useAppStore';
import {
  Badge,
  Box,
  Button,
  Card,
  ConfirmDialog,
  Divider,
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

  const batch = batches.find((b) => b.id === batchId);
  if (!batch) return null;

  const reversed = batch.status === 'reversed';
  const running = batch.status === 'in_progress';
  const view = batchStatusView(batch.status);
  const perUnit = batch.directCostPerUnit ?? batch.directCostPerBag ?? 0;
  const perBase = batch.directCostPerBaseUnit ?? batch.directCostPerKg ?? 0;

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
            ? undefined
            : running
              ? {
                  label: 'Complete Batch',
                  onPress: () => {
                    onClose();
                    openSheet('complete_batch', { batchId: batch.id });
                  },
                  variant: 'success',
                }
              : { label: 'Reverse Batch', onPress: () => setConfirming(true), variant: 'danger' }
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
            <Stack gap="xs">
              <Row justify="space-between">
                <Typography variant="bodySmall" color="secondary">
                  Ingredients
                </Typography>
                <Typography variant="dataMedium" color="primary" tabular>
                  {money(batch.ingredientCost)}
                </Typography>
              </Row>
              <Row justify="space-between">
                <Typography variant="bodySmall" color="secondary">
                  Packaging
                </Typography>
                <Typography variant="dataMedium" color="primary" tabular>
                  {money(batch.packagingCost)}
                </Typography>
              </Row>
              <Divider variant="subtle" spacing="xs" />
              <Row justify="space-between">
                <Typography variant="bodySmall" weight="semibold" color="primary">
                  Total batch cost
                </Typography>
                <Typography variant="dataMedium" color="primary" tabular>
                  {money(batch.directBatchCost)}
                </Typography>
              </Row>
              <Row justify="space-between">
                <Typography variant="caption" color="muted">
                  Per {batch.baseUnit || 'unit of measure'}
                </Typography>
                <Typography variant="caption" color="muted">
                  {money(perBase)}
                </Typography>
              </Row>
            </Stack>
          </Card>

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

          {running && (
            <Button
              label="Cancel run"
              variant="subtle"
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
