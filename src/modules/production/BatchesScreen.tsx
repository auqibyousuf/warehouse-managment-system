import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { openSheet } from '../../navigation/sheets';
import { goToTab } from '../../navigation/routes';
import { theme } from '../../theme';
import { useMoney } from '../../hooks/useMoney';
import { useProductionBatches, useReverseProductionBatch } from '../../hooks/api/useProduction';
import { useAppStore } from '../../stores/useAppStore';
import {
  Badge,
  Box,
  Button,
  Card,
  EmptyState,
  IconTile,
  LoadingState,
  Row,
  ScreenContainer,
  Stack,
  Typography,
} from '../../components';

/** Batches: what is running in the mixer right now, then what finished recently. */
export const BatchesScreen: React.FC = () => {
  const money = useMoney();
  const { data: batches = [], isLoading, refetch, isRefetching } = useProductionBatches();
  const cancelRun = useReverseProductionBatch();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);
  const [confirming, setConfirming] = useState<string | null>(null);

  const running = batches.filter((b) => b.status === 'in_progress');
  const finished = batches.filter((b) => b.status !== 'in_progress').slice(0, 8);

  const cancel = async (id: string, label: string) => {
    try {
      await cancelRun.mutateAsync({ batchId: id, reason: 'Run cancelled' });
      setBannerAlert({
        title: 'Run cancelled',
        message: `${label} cancelled. The materials went back to stock.`,
        variant: 'info',
      });
      setConfirming(null);
    } catch (err: any) {
      setBannerAlert({ title: 'Could not cancel', message: err.message, variant: 'danger' });
    }
  };

  if (isLoading && batches.length === 0) {
    return (
      <ScreenContainer>
        <LoadingState message="Loading batches..." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer refreshing={isRefetching} onRefresh={refetch}>
      <Stack gap="lg">
        <Button
          label="+ Start New Batch"
          size="lg"
          leftIcon="play-circle-outline"
          fullWidth
          onPress={() => openSheet('start_batch')}
        />

        <Stack gap="sm">
          <Row gap="xs" align="center">
            <Typography variant="title" color="primary">
              Running now
            </Typography>
            <Badge label={String(running.length)} variant="neutral" size="sm" />
          </Row>
          {running.length === 0 ? (
            <EmptyState
              title="Nothing running"
              description="Start a batch to load the mixer. It will appear here until you complete it."
            />
          ) : (
            running.map((b) => (
              <Card key={b.id} variant="elevated" padding="compact">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${b.batchNumber} details`}
                  onPress={() => openSheet('batch_detail', { batchId: b.id })}
                >
                  <Row gap="sm" align="flex-start">
                    <IconTile icon="sync" tone="info" size={32} />
                    <Box flex={1}>
                      <Row gap="xs" align="center">
                        <Typography variant="dataMedium" color="secondary">
                          {b.batchNumber.replace(/^BAT-\d+-/, '#')}
                        </Typography>
                        <Typography
                          variant="title"
                          color="primary"
                          numberOfLines={1}
                          style={{ flexShrink: 1 }}
                        >
                          {b.productName}
                        </Typography>
                      </Row>
                      <Typography variant="bodySmall" color="secondary">
                        Started {b.date} · {b.itemsConsumed.length} items loaded
                      </Typography>
                      <Typography variant="bodySmall" color="secondary">
                        Materials {money(b.ingredientCost)}
                      </Typography>
                    </Box>
                    <Badge label="Running" variant="info" size="sm" />
                  </Row>
                </Pressable>
                <Row gap="sm" style={{ marginTop: theme.spacing.sm }}>
                  {confirming === b.id ? (
                    <>
                      <Button
                        label="Yes, cancel run"
                        variant="danger"
                        size="sm"
                        style={{ flex: 1 }}
                        loading={cancelRun.isPending}
                        onPress={() => cancel(b.id, b.batchNumber)}
                      />
                      <Button
                        label="Keep"
                        variant="subtle"
                        size="sm"
                        style={{ flex: 1 }}
                        onPress={() => setConfirming(null)}
                      />
                    </>
                  ) : (
                    <>
                      <Button
                        label="Edit"
                        variant="subtle"
                        size="sm"
                        style={{ flex: 1 }}
                        onPress={() => openSheet('edit_batch', { batchId: b.id })}
                      />
                      <Button
                        label="Cancel"
                        variant="subtle"
                        size="sm"
                        style={{ flex: 1 }}
                        onPress={() => setConfirming(b.id)}
                      />
                      <Button
                        label="Complete"
                        variant="success"
                        size="sm"
                        leftIcon="checkmark-circle-outline"
                        style={{ flex: 1 }}
                        onPress={() => openSheet('complete_batch', { batchId: b.id })}
                      />
                    </>
                  )}
                </Row>
              </Card>
            ))
          )}
        </Stack>

        <Stack gap="sm">
          <Row justify="space-between" align="center">
            <Typography variant="title" color="primary">
              Finished
            </Typography>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open recipes"
              onPress={() => goToTab('recipes')}
            >
              <Typography variant="bodySmall" weight="medium" color="brandPrimary">
                Recipes
              </Typography>
            </Pressable>
          </Row>
          {finished.length === 0 ? (
            <Card variant="flat" padding="compact">
              <Typography variant="bodySmall" color="secondary">
                Completed batches will show here.
              </Typography>
            </Card>
          ) : (
            finished.map((b) => {
              const reversed = b.status === 'reversed';
              return (
                <Card key={b.id} variant="elevated" padding="compact">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${b.batchNumber} details`}
                    onPress={() => openSheet('batch_detail', { batchId: b.id })}
                  >
                    <Row justify="space-between" align="center" gap="sm">
                      <Box flex={1}>
                        <Typography variant="title" color="primary" numberOfLines={1}>
                          {b.productName}
                        </Typography>
                        <Typography variant="bodySmall" color="secondary">
                          {reversed ? 'Cancelled' : `${b.unitsPacked} ${b.outputUnit}`} · {b.date}
                        </Typography>
                      </Box>
                      <Badge
                        label={reversed ? 'Cancelled' : 'Done'}
                        variant={reversed ? 'danger' : 'success'}
                        size="sm"
                      />
                    </Row>
                  </Pressable>
                  <Row gap="sm" style={{ marginTop: theme.spacing.sm }}>
                    {!reversed && (
                      <Button
                        label="Edit"
                        variant="subtle"
                        size="sm"
                        leftIcon="create-outline"
                        style={{ flex: 1 }}
                        onPress={() => openSheet('edit_batch', { batchId: b.id })}
                      />
                    )}
                    <Button
                      label="Run again"
                      variant="subtle"
                      size="sm"
                      leftIcon="repeat-outline"
                      style={{ flex: 1 }}
                      onPress={() => openSheet('start_batch', { rerunBatchId: b.id })}
                    />
                  </Row>
                </Card>
              );
            })
          )}
        </Stack>
      </Stack>
    </ScreenContainer>
  );
};

export default BatchesScreen;
