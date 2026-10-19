import React, { useState } from 'react';
import { openSheet } from '../../navigation/sheets';
import { theme } from '../../theme';
import { useMoney } from '../../hooks/useMoney';
import { useProductionSetups, useProductionBatches } from '../../hooks/api/useProduction';
import { useIngredients } from '../../hooks/api/useInventory';
import {
  Badge,
  Box,
  Button,
  Card,
  ChipPicker,
  EmptyState,
  IconTile,
  LoadingState,
  Row,
  ScreenList,
  Stack,
  Typography,
} from '../../components';

type ProductionTab = 'setups' | 'batches';

/** Recipes and batch history. Rows stay short; tap one for its full details. */
export const ProductionScreen: React.FC = () => {
  const money = useMoney();
  const [activeTab, setActiveTab] = useState<ProductionTab>('setups');
  const { data: setups = [], isLoading: loadingSetups } = useProductionSetups();
  const { data: batches = [], isLoading: loadingBatches } = useProductionBatches();
  const { data: ingredients = [] } = useIngredients();

  const header = (
    <Stack gap="md" style={{ marginBottom: theme.spacing.md }}>
      <Row gap="sm" wrap>
        <Button
          label="Start Batch"
          variant="primary"
          leftIcon="play-circle-outline"
          onPress={() => openSheet('start_batch')}
        />
        <Button
          label="New Recipe"
          variant="secondary"
          leftIcon="add-circle-outline"
          onPress={() => openSheet('create_setup')}
        />
      </Row>
      <ChipPicker
        variant="segmented"
        options={[
          { value: 'setups', label: 'Recipes', count: setups.length },
          { value: 'batches', label: 'Batches', count: batches.length },
        ]}
        selected={activeTab}
        onSelect={(tab) => setActiveTab(tab as ProductionTab)}
      />
    </Stack>
  );

  if (activeTab === 'setups') {
    return (
      <ScreenList
        header={header}
        data={setups}
        keyExtractor={(row) => row.id}
        placeholder={
          loadingSetups ? (
            <LoadingState message="Loading recipes..." />
          ) : setups.length === 0 ? (
            <EmptyState
              title="No recipes yet"
              description="Create a recipe to prefill ingredients and quantities for daily batches."
              actionLabel="+ New Recipe"
              onAction={() => openSheet('create_setup')}
            />
          ) : null
        }
        renderItem={({ item: setup }) => {
          const active = setup.status === 'active';
          const units = setup.targetUnits || setup.targetBags || 0;
          const batchCost = setup.recipeItems.reduce(
            (sum, item) =>
              sum +
              item.targetQuantity *
                (ingredients.find((i) => i.id === item.ingredientId)?.unitCost ?? 0),
            0,
          );
          return (
            <Card
              variant="elevated"
              padding="compact"
              onPress={() => openSheet('recipe_detail', { setupId: setup.id })}
            >
              <Row gap="sm" align="center">
                <IconTile icon="flask-outline" tone={active ? 'primary' : 'neutral'} size={40} />
                <Box flex={1}>
                  <Typography variant="title" color="primary" numberOfLines={1}>
                    {setup.name}
                  </Typography>
                  <Typography variant="bodySmall" color="secondary" numberOfLines={1}>
                    {setup.productName}
                    {units > 0 && batchCost > 0 ? ` • ${money(batchCost / units)} per unit` : ''}
                  </Typography>
                </Box>
                <Badge
                  label={active ? 'Active' : 'Paused'}
                  variant={active ? 'success' : 'neutral'}
                  size="sm"
                />
              </Row>
            </Card>
          );
        }}
      />
    );
  }

  return (
    <ScreenList
      header={header}
      data={batches}
      keyExtractor={(row) => row.id}
      placeholder={
        loadingBatches ? (
          <LoadingState message="Loading batches..." />
        ) : batches.length === 0 ? (
          <EmptyState
            title="No batches yet"
            description="Start your first batch using an active recipe."
            actionLabel="+ Start Batch"
            onAction={() => openSheet('start_batch')}
          />
        ) : null
      }
      renderItem={({ item: batch }) => {
        const reversed = batch.status === 'reversed';
        return (
          <Card
            variant="elevated"
            padding="compact"
            onPress={() => openSheet('batch_detail', { batchId: batch.id })}
          >
            <Row gap="sm" align="center">
              <IconTile
                icon={reversed ? 'refresh' : 'checkmark'}
                tone={reversed ? 'danger' : 'success'}
                size={32}
              />
              <Box flex={1}>
                <Row gap="xs" align="center">
                  <Typography variant="dataMedium" color="secondary">
                    {batch.batchNumber.replace(/^BAT-\d+-/, '#')}
                  </Typography>
                  <Typography
                    variant="title"
                    color="primary"
                    numberOfLines={1}
                    style={{ flexShrink: 1 }}
                  >
                    {batch.productName}
                  </Typography>
                </Row>
                <Typography variant="bodySmall" color="secondary">
                  {batch.unitsPacked} {batch.outputUnit} • {batch.date}
                </Typography>
              </Box>
              <Badge
                label={reversed ? 'Reversed' : 'Done'}
                variant={reversed ? 'danger' : 'success'}
                size="sm"
              />
            </Row>
          </Card>
        );
      }}
    />
  );
};

export default ProductionScreen;
