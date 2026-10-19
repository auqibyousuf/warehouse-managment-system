import React from 'react';
import { openSheet } from '../../navigation/sheets';
import { useMoney } from '../../hooks/useMoney';
import { useProductionSetups, useSetSetupStatus } from '../../hooks/api/useProduction';
import { useIngredients } from '../../hooks/api/useInventory';
import { useAppStore } from '../../stores/useAppStore';
import { useColors } from '../../theme';
import {
  Badge,
  Box,
  Button,
  InsetStats,
  Modal,
  ProgressBar,
  Row,
  Stack,
  Typography,
} from '../../components';

export interface RecipeDetailModalProps {
  visible: boolean;
  onClose: () => void;
  setupId: string | null;
}

/** A recipe in full: formulation, standard cost, instructions, pause or start. */
export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  visible,
  onClose,
  setupId,
}) => {
  const money = useMoney();
  const colors = useColors();
  const { data: setups = [] } = useProductionSetups();
  const { data: ingredients = [] } = useIngredients();
  const setStatus = useSetSetupStatus();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const setup = setups.find((s) => s.id === setupId);
  if (!setup) return null;

  const series = [
    colors.brand.primary,
    colors.accent.warning,
    colors.accent.success,
    colors.accent.info,
    colors.accent.error,
  ];
  const lines = setup.recipeItems.map((item, index) => ({
    item,
    color: series[index % series.length],
    cost:
      item.targetQuantity * (ingredients.find((i) => i.id === item.ingredientId)?.unitCost ?? 0),
  }));
  const batchCost = lines.reduce((sum, l) => sum + l.cost, 0);
  const units = setup.targetUnits || setup.targetBags || 0;
  const active = setup.status === 'active';

  const toggle = async () => {
    try {
      await setStatus.mutateAsync({ id: setup.id, status: active ? 'paused' : 'active' });
      setBannerAlert({
        title: 'Recipe updated',
        message: `${setup.name} is now ${active ? 'paused' : 'active'}.`,
        variant: 'info',
      });
    } catch (err: any) {
      setBannerAlert({ title: 'Could not update', message: err.message, variant: 'danger' });
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={setup.name}
      subtitle={`Produces ${setup.productName}`}
      secondaryAction={{ label: 'Close', onPress: onClose }}
      primaryAction={
        active
          ? {
              label: 'Start Batch',
              onPress: () => {
                onClose();
                openSheet('start_batch', { setupId: setup.id });
              },
            }
          : { label: 'Activate', onPress: toggle, loading: setStatus.isPending }
      }
    >
      <Stack gap="md">
        <Row gap="xs">
          <Badge label={`v${setup.version}`} variant="forest" size="sm" />
          <Badge
            label={setup.status.toUpperCase()}
            variant={active ? 'success' : 'neutral'}
            size="sm"
          />
        </Row>

        <InsetStats
          stats={[
            { label: 'Standard batch cost', value: money(batchCost) },
            { label: 'Cost per unit', value: units > 0 ? money(batchCost / units) : '—' },
          ]}
        />
        <Typography variant="bodySmall" color="secondary">
          One batch makes {units} {setup.outputUnit || 'units'} of{' '}
          {setup.unitSize || setup.bagWeightKg} {setup.baseUnit || 'kg'} each.
        </Typography>

        <Box>
          <Typography variant="label" color="muted" style={{ marginBottom: 8 }}>
            Formulation
          </Typography>
          <ProgressBar
            height={10}
            accessibilityLabel="Formulation by quantity"
            segments={lines.map((l) => ({ value: l.item.targetQuantity, color: l.color }))}
          />
          <Stack gap="xs" style={{ marginTop: 12 }}>
            {lines.map((l) => (
              <Row key={l.item.ingredientId} justify="space-between" align="center">
                <Row gap="xs" align="center" style={{ flex: 1 }}>
                  <Box style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: l.color }} />
                  <Typography
                    variant="bodyMedium"
                    color="primary"
                    numberOfLines={1}
                    style={{ flexShrink: 1 }}
                  >
                    {l.item.ingredientName}
                  </Typography>
                </Row>
                <Box align="flex-end">
                  <Typography variant="dataMedium" color="primary" tabular>
                    {l.item.targetQuantity} {l.item.unit}
                  </Typography>
                  <Typography variant="caption" color="muted">
                    {money(l.cost)}
                  </Typography>
                </Box>
              </Row>
            ))}
          </Stack>
        </Box>

        {setup.notes ? (
          <Typography variant="bodySmall" color="secondary">
            Instructions: {setup.notes}
          </Typography>
        ) : null}

        {active && (
          <Button
            label="Pause Recipe"
            variant="subtle"
            size="sm"
            onPress={toggle}
            loading={setStatus.isPending}
          />
        )}
      </Stack>
    </Modal>
  );
};

export default RecipeDetailModal;
