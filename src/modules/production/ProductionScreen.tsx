import { theme } from '../../theme';
import React, { useState } from 'react';
import {
  useProductionSetups,
  useProductionBatches,
  useSetSetupStatus,
  useReverseProductionBatch,
} from '../../hooks/api/useProduction';
import { useAppStore } from '../../stores/useAppStore';
import {
  ScreenContainer,
  Box,
  Stack,
  Row,
  Typography,
  Card,
  Button,
  Badge,
  Divider,
  ConfirmDialog,
  ChipPicker,
  EmptyState,
  LoadingState,
  ScreenList,
} from '../../components';
import { ProductionSetup, ProductionBatch } from '../../types';

type ProductionTab = 'setups' | 'batches';

export const ProductionScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProductionTab>('setups');
  const [batchToReverse, setBatchToReverse] = useState<ProductionBatch | null>(null);

  const { data: setups = [], isLoading: loadingSetups } = useProductionSetups();
  const { data: batches = [], isLoading: loadingBatches } = useProductionBatches();

  const setStatusMutation = useSetSetupStatus();
  const reverseBatchMutation = useReverseProductionBatch();
  const { openModal, setSelectedSetupId, setBannerAlert } = useAppStore();

  const handleStartRun = (setupId: string) => {
    setSelectedSetupId(setupId);
    openModal('start_batch');
  };

  const handleToggleSetupStatus = async (setup: ProductionSetup) => {
    const newStatus = setup.status === 'active' ? 'paused' : 'active';
    try {
      await setStatusMutation.mutateAsync({ id: setup.id, status: newStatus });
      setBannerAlert({
        title: 'Recipe Updated',
        message: `Recipe "${setup.name}" is now ${newStatus}.`,
        variant: 'info',
      });
    } catch (err: any) {
      setBannerAlert({
        title: 'Status Error',
        message: err.message,
        variant: 'danger',
      });
    }
  };

  const handleConfirmReversal = async () => {
    if (!batchToReverse) return;
    try {
      await reverseBatchMutation.mutateAsync({
        batchId: batchToReverse.id,
        reason: 'Operator reversal from production screen',
      });
      setBannerAlert({
        title: 'Batch Reversal Confirmed',
        message: `Batch ${batchToReverse.batchNumber} has been reversed. Raw materials & packaging containers have been returned to inventory, and finished stock was decremented.`,
        variant: 'warning',
      });
      setBatchToReverse(null);
    } catch (err: any) {
      setBannerAlert({
        title: 'Reversal Failed',
        message: err.message,
        variant: 'danger',
      });
    }
  };

  const header = (
    <>
      {/* Module Header */}
      <Box>
        <Row justify="space-between" align="center">
          <Box>
            <Typography variant="caption" color="muted">
              MANUFACTURING & RUNS
            </Typography>
            <Typography variant="h1" weight="bold" color="brandDeep">
              Production Control
            </Typography>
          </Box>
          <Button
            label="+ Start Batch"
            variant="primary"
            size="sm"
            leftIcon="construct-outline"
            onPress={() => openModal('start_batch')}
          />
        </Row>
      </Box>

      {/* Sub Navigation Switcher */}
      <ChipPicker
        options={[
          { value: 'setups', label: 'Recipes', count: setups.length },
          { value: 'batches', label: 'Batches & History', count: batches.length },
        ]}
        selected={activeTab}
        onSelect={(tab) => setActiveTab(tab as ProductionTab)}
      />
    </>
  );

  const overlays = (
    <>
      {/* Controlled Reversal Confirmation Dialog */}
      <ConfirmDialog
        visible={!!batchToReverse}
        onClose={() => setBatchToReverse(null)}
        onConfirm={handleConfirmReversal}
        title="Reverse Production Batch?"
        message={`Are you sure you want to reverse batch ${batchToReverse?.batchNumber}? This will create compensating stock movements, returning consumed ingredients and packaging to inventory, and reducing finished goods by ${batchToReverse?.unitsPacked || batchToReverse?.bagsPacked} ${batchToReverse?.outputUnit || 'units'}.`}
        confirmLabel="Confirm Controlled Reversal"
        cancelLabel="Keep Batch"
        isDestructive
        loading={reverseBatchMutation.isPending}
      />
    </>
  );

  if (activeTab === 'setups') {
    return (
      <>
        <ScreenList
          header={
            <Stack gap="lg" style={{ marginBottom: theme.spacing.md }}>
              {header}
              <Stack gap="md">
                {' '}
                <Row justify="space-between" align="center">
                  <Typography variant="bodySmall" color="secondary">
                    Persistent setups preserve stable recipe targets across daily runs.
                  </Typography>
                  <Button
                    label="+ New Recipe"
                    variant="subtle"
                    size="sm"
                    onPress={() => openModal('create_setup')}
                  />
                </Row>
              </Stack>
            </Stack>
          }
          data={setups}
          keyExtractor={(row) => row.id}
          placeholder={
            loadingSetups ? (
              <LoadingState message="Loading recipes..." />
            ) : setups.length === 0 ? (
              <EmptyState
                title="No Recipes Yet"
                description="Create a recipe to prefill ingredients and quantities for daily batches."
                actionLabel="+ Create First Setup"
                onAction={() => openModal('create_setup')}
              />
            ) : null
          }
          renderItem={({ item: setup }) => (
            <Card key={setup.id} variant="elevated" padding="normal">
              <Row justify="space-between" align="flex-start" gap="sm">
                <Box flex={1} style={{ marginRight: theme.spacing.sm }}>
                  <Row gap="xs" align="center" wrap>
                    <Typography variant="title" weight="bold" color="primary">
                      {setup.name}
                    </Typography>
                    <Badge label={`v${setup.version}`} variant="forest" size="sm" />
                    <Badge
                      label={setup.status.toUpperCase()}
                      variant={setup.status === 'active' ? 'success' : 'neutral'}
                      size="sm"
                    />
                  </Row>
                  <Typography
                    variant="bodySmall"
                    color="secondary"
                    style={{ marginTop: theme.spacing.xxs }}
                  >
                    Produces: {setup.productName} ({setup.unitSize || setup.bagWeightKg}{' '}
                    {setup.baseUnit || 'kg'} per {setup.outputUnit || 'unit'})
                  </Typography>
                  <Typography variant="caption" color="muted">
                    Target Batch Output: {setup.targetUnits || setup.targetBags}{' '}
                    {setup.outputUnit || 'units'} (
                    {(
                      (setup.targetUnits || setup.targetBags || 0) *
                      (setup.unitSize || setup.bagWeightKg || 0)
                    ).toLocaleString('en-IN')}{' '}
                    {setup.baseUnit || 'kg'})
                  </Typography>
                </Box>
              </Row>

              <Divider variant="subtle" spacing="sm" />

              {/* Standard Recipe Targets */}
              <Typography
                variant="label"
                color="secondary"
                style={{ marginBottom: theme.spacing.xs }}
              >
                STANDARD RECIPE FORMULATION
              </Typography>
              <Stack gap="xxs">
                {setup.recipeItems.map((item) => (
                  <Row key={item.ingredientId} justify="space-between">
                    <Typography variant="bodySmall" color="secondary">
                      • {item.ingredientName}:
                    </Typography>
                    <Typography variant="bodySmall" weight="semibold" color="primary">
                      {item.targetQuantity} {item.unit}
                    </Typography>
                  </Row>
                ))}
              </Stack>

              {setup.notes && (
                <Typography
                  variant="caption"
                  color="muted"
                  style={{ marginTop: theme.spacing.xsm, fontStyle: 'italic' }}
                >
                  Instructions: {setup.notes}
                </Typography>
              )}

              <Divider variant="subtle" spacing="sm" />

              {/* Setup Actions */}
              <Row gap="sm" justify="flex-end">
                <Button
                  label={setup.status === 'active' ? 'Pause Recipe' : 'Activate'}
                  variant="ghost"
                  size="sm"
                  onPress={() => handleToggleSetupStatus(setup)}
                />
                {setup.status === 'active' && (
                  <Button
                    label="Start Batch From This"
                    variant="primary"
                    size="sm"
                    leftIcon="play-outline"
                    onPress={() => handleStartRun(setup.id)}
                  />
                )}
              </Row>
            </Card>
          )}
        />
        {overlays}
      </>
    );
  }

  if (activeTab === 'batches') {
    return (
      <>
        <ScreenList
          header={
            <Stack gap="lg" style={{ marginBottom: theme.spacing.md }}>
              {header}
              <Stack gap="md">
                {' '}
                <Typography variant="bodySmall" color="secondary">
                  Authoritative batch costing and atomic inventory movements.
                </Typography>
              </Stack>
            </Stack>
          }
          data={batches}
          keyExtractor={(row) => row.id}
          placeholder={
            loadingBatches ? (
              <LoadingState message="Loading completed batches..." />
            ) : batches.length === 0 ? (
              <EmptyState
                title="No Production Batches Yet"
                description="Start your first batch using an active recipe."
                actionLabel="+ Start Batch"
                onAction={() => openModal('start_batch')}
              />
            ) : null
          }
          renderItem={({ item: batch }) => (
            <Card
              key={batch.id}
              variant={batch.status === 'reversed' ? 'flat' : 'elevated'}
              padding="normal"
              style={{
                opacity: batch.status === 'reversed' ? 0.75 : 1,
              }}
            >
              <Row justify="space-between" align="flex-start" gap="sm">
                <Box flex={1} style={{ marginRight: theme.spacing.sm }}>
                  <Row gap="xs" align="center" wrap>
                    <Typography variant="title" weight="bold" color="primary">
                      {batch.batchNumber}
                    </Typography>
                    <Badge
                      label={batch.status.toUpperCase()}
                      variant={batch.status === 'confirmed' ? 'success' : 'danger'}
                      size="sm"
                    />
                  </Row>
                  <Typography
                    variant="bodySmall"
                    color="secondary"
                    style={{ marginTop: theme.spacing.xxs }}
                  >
                    {batch.productName} • v{batch.setupVersion}
                  </Typography>
                  <Typography variant="caption" color="muted">
                    Production Date: {batch.date}
                  </Typography>
                </Box>

                {/* Unit Cost Highlights */}
                <Box align="flex-end" style={{ minWidth: 85, flexShrink: 0 }}>
                  <Typography variant="bodyLarge" weight="bold" color="brandDeep">
                    ₹{(batch.directCostPerUnit || batch.directCostPerBag || 0).toFixed(1)}
                  </Typography>
                  <Typography variant="caption" color="muted">
                    cost / {batch.outputUnit || 'unit'}
                  </Typography>
                </Box>
              </Row>

              <Divider variant="subtle" spacing="sm" />

              {/* Batch Cost & Yield Summary */}
              <Row justify="space-between" style={{ marginVertical: theme.spacing.xxs }}>
                <Typography variant="bodySmall" color="secondary">
                  Output Produced:
                </Typography>
                <Typography variant="bodySmall" weight="bold" color="primary">
                  {batch.unitsPacked || batch.bagsPacked} {batch.outputUnit || 'units'} (
                  {batch.actualFinishedQuantity || batch.actualFinishedWeightKg}{' '}
                  {batch.baseUnit || 'kg'})
                </Typography>
              </Row>

              <Row justify="space-between" style={{ marginVertical: theme.spacing.xxs }}>
                <Typography variant="bodySmall" color="secondary">
                  Direct Batch Cost:
                </Typography>
                <Typography variant="bodySmall" weight="bold" color="primary">
                  ₹{batch.directBatchCost.toLocaleString('en-IN')} (₹
                  {(batch.directCostPerBaseUnit || batch.directCostPerKg || 0).toFixed(2)}/
                  {batch.baseUnit || 'kg'})
                </Typography>
              </Row>

              {/* Consumed Ingredients Breakdown */}
              <Box bg="surfaceSecondary" padding="compact" borderRadius="md" marginTop="xs">
                <Typography
                  variant="label"
                  color="muted"
                  style={{ marginBottom: theme.spacing.xs }}
                >
                  ACTUAL INGREDIENTS CONSUMED
                </Typography>
                {batch.itemsConsumed.map((item) => (
                  <Row key={item.ingredientId} justify="space-between">
                    <Typography variant="caption" color="secondary">
                      • {item.ingredientName}:
                    </Typography>
                    <Typography variant="caption" weight="semibold" color="primary">
                      {item.actualQuantity} {item.unit} (₹{item.lineCost.toLocaleString('en-IN')})
                    </Typography>
                  </Row>
                ))}
                <Row justify="space-between" style={{ marginTop: theme.spacing.xxs }}>
                  <Typography variant="caption" color="secondary">
                    • Packaging / Container Units:
                  </Typography>
                  <Typography variant="caption" weight="semibold" color="primary">
                    {batch.packagingUsedUnits || batch.packagingUsedBags}{' '}
                    {batch.outputUnit || 'pcs'} (₹{batch.packagingCost.toLocaleString('en-IN')})
                  </Typography>
                </Row>
              </Box>

              {batch.notes && (
                <Typography
                  variant="caption"
                  color="muted"
                  style={{ marginTop: theme.spacing.xsm }}
                >
                  Notes: {batch.notes}
                </Typography>
              )}

              {/* Controlled Reversal Action (PRD Section 3.6 & 5.6) */}
              {batch.status === 'confirmed' && (
                <Box marginTop="md" align="flex-end">
                  <Button
                    label="Reverse Batch"
                    variant="danger"
                    size="sm"
                    leftIcon="arrow-undo-outline"
                    onPress={() => setBatchToReverse(batch)}
                  />
                </Box>
              )}
            </Card>
          )}
        />
        {overlays}
      </>
    );
  }

  return (
    <ScreenContainer>
      <Stack gap="lg">{header}</Stack>
      {overlays}
    </ScreenContainer>
  );
};

export default ProductionScreen;
