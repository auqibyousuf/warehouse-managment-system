import { useMoney } from '../../hooks/useMoney';
import React, { useMemo, useState } from 'react';
import { openSheet } from '../../navigation/sheets';
import { theme, useColors } from '../../theme';
import { useInventoryItems, useInventoryMovements } from '../../hooks/api/useInventory';
import {
  Box,
  Stack,
  Row,
  Typography,
  Card,
  Button,
  Badge,
  ListItem,
  ChipPicker,
  LoadingState,
  EmptyState,
  ScreenList,
  ProgressBar,
  InsetStats,
  SearchField,
} from '../../components';
import { UnifiedStockItem } from '../../services/api/inventoryService';
import { EditIngredientModal } from './components/EditIngredientModal';

type InventoryTab = 'stock' | 'movements';
type CategoryFilter = 'all' | 'raw_material' | 'packaging' | 'finished_feed';

const CATEGORY_LABEL: Record<UnifiedStockItem['type'], string> = {
  raw_material: 'RAW MATERIAL',
  packaging: 'PACKAGING',
  finished_feed: 'FINISHED GOODS',
};

export const InventoryScreen: React.FC = () => {
  const money = useMoney();
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<InventoryTab>('stock');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [query, setQuery] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<UnifiedStockItem | null>(null);

  const {
    data: stockItems = [],
    isLoading: loadingStock,
    refetch,
    isRefetching,
  } = useInventoryItems();
  const { data: movements = [], isLoading: loadingMovements } = useInventoryMovements();

  const summary = useMemo(() => {
    const valueOf = (type: UnifiedStockItem['type']) =>
      stockItems
        .filter((i) => i.type === type)
        .reduce((sum, i) => sum + i.currentStock * i.unitCostOrPrice, 0);
    const raw = valueOf('raw_material');
    const packaging = valueOf('packaging');
    const finished = valueOf('finished_feed');
    return {
      raw,
      packaging,
      finished,
      atCost: raw + packaging,
      lowCount: stockItems.filter((i) => i.isLowStock).length,
    };
  }, [stockItems]);

  const counts = useMemo(
    () => ({
      all: stockItems.length,
      raw_material: stockItems.filter((i) => i.type === 'raw_material').length,
      packaging: stockItems.filter((i) => i.type === 'packaging').length,
      finished_feed: stockItems.filter((i) => i.type === 'finished_feed').length,
    }),
    [stockItems],
  );

  const visibleItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return stockItems.filter(
      (item) =>
        (category === 'all' || item.type === category) &&
        (!lowOnly || item.isLowStock) &&
        (!needle || item.name.toLowerCase().includes(needle)),
    );
  }, [stockItems, category, lowOnly, query]);

  const header = (
    <>
      <Card variant="elevated" padding="normal">
        <Row justify="space-between" align="flex-start">
          <Box flex={1}>
            <Typography variant="label" color="muted">
              Stock value at cost
            </Typography>
            <Typography variant="h1" color="primary" tabular>
              {money(summary.atCost)}
            </Typography>
          </Box>
          {summary.lowCount > 0 && (
            <Badge label={`${summary.lowCount} below safety`} variant="danger" icon="warning" />
          )}
        </Row>

        <Box marginTop="md">
          <ProgressBar
            height={8}
            accessibilityLabel="Stock value by category"
            segments={[
              { value: summary.raw, color: colors.brand.primary },
              { value: summary.packaging, color: colors.accent.warning },
              { value: summary.finished, color: colors.accent.success },
            ]}
          />
          <Row gap="md" wrap style={{ marginTop: theme.spacing.sm }}>
            {[
              ['Raw', summary.raw, colors.brand.primary],
              ['Packaging', summary.packaging, colors.accent.warning],
              ['Finished', summary.finished, colors.accent.success],
            ].map(([label, value, color]) => (
              <Row key={label as string} gap="xs" align="center">
                <Box
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: theme.radii.full,
                    backgroundColor: color as string,
                  }}
                />
                <Typography variant="caption" color="secondary">
                  {label as string} {money(value as number)}
                </Typography>
              </Row>
            ))}
          </Row>
          <Typography variant="caption" color="muted" style={{ marginTop: theme.spacing.xs }}>
            Finished goods are valued at selling price.
          </Typography>
        </Box>
      </Card>

      <Row gap="sm" wrap>
        <Button
          label="Stock In"
          variant="primary"
          leftIcon="add-circle-outline"
          onPress={() => openSheet('record_purchase')}
        />
        <Button
          label="New Item"
          variant="secondary"
          leftIcon="cube-outline"
          onPress={() => openSheet('create_ingredient')}
        />
        <Button
          label="Adjust"
          variant="secondary"
          leftIcon="swap-vertical-outline"
          onPress={() => openSheet('adjust_stock')}
        />
      </Row>

      <ChipPicker
        options={[
          { value: 'stock', label: 'Balances', count: stockItems.length },
          { value: 'movements', label: 'Movement Ledger', count: movements.length },
        ]}
        selected={activeTab}
        onSelect={(tab) => setActiveTab(tab as InventoryTab)}
      />
    </>
  );

  const overlays = (
    <EditIngredientModal
      visible={itemToEdit !== null}
      item={itemToEdit}
      onClose={() => setItemToEdit(null)}
    />
  );

  if (activeTab === 'stock') {
    return (
      <>
        <ScreenList
          header={
            <Stack gap="lg" style={{ marginBottom: theme.spacing.md }}>
              {header}
              <ChipPicker
                options={[
                  { value: 'all', label: 'All', count: counts.all },
                  { value: 'raw_material', label: 'Raw', count: counts.raw_material },
                  { value: 'packaging', label: 'Packaging', count: counts.packaging },
                  { value: 'finished_feed', label: 'Finished', count: counts.finished_feed },
                ]}
                selected={category}
                onSelect={(value) => setCategory(value as CategoryFilter)}
              />
              <SearchField value={query} onChangeText={setQuery} placeholder="Search items" />
              {summary.lowCount > 0 && (
                <Row>
                  <Button
                    label={`Low stock (${summary.lowCount})`}
                    variant={lowOnly ? 'danger' : 'subtle'}
                    size="sm"
                    leftIcon="alert-circle-outline"
                    onPress={() => setLowOnly((value) => !value)}
                  />
                </Row>
              )}
            </Stack>
          }
          data={visibleItems}
          keyExtractor={(row) => row.id}
          placeholder={
            loadingStock ? (
              <LoadingState message="Loading stock..." />
            ) : visibleItems.length === 0 ? (
              <EmptyState
                title="No Items Found"
                description="No stock items match this search or filter."
              />
            ) : null
          }
          renderItem={({ item }) => {
            const isFinished = item.type === 'finished_feed';
            const fill = item.minThreshold > 0 ? item.currentStock / (item.minThreshold * 2) : 1;
            return (
              <Card variant={item.isLowStock ? 'accent' : 'elevated'} padding="normal">
                <Stack gap="md">
                  <Row justify="space-between" align="center">
                    <Badge
                      label={CATEGORY_LABEL[item.type]}
                      variant={isFinished ? 'forest' : 'neutral'}
                      size="sm"
                    />
                    <Badge
                      label={item.isLowStock ? 'Low stock' : 'In stock'}
                      variant={item.isLowStock ? 'danger' : 'success'}
                      size="sm"
                      dot
                    />
                  </Row>

                  <Typography variant="title" color="primary" numberOfLines={2}>
                    {item.name}
                  </Typography>

                  <InsetStats
                    stats={[
                      {
                        label: 'Current quantity',
                        value: `${item.currentStock.toLocaleString('en-IN')} ${item.unit}`,
                        valueColor: item.isLowStock ? 'error' : 'primary',
                      },
                      {
                        label: isFinished ? 'Retail value' : 'Stock value',
                        value: money(item.currentStock * item.unitCostOrPrice),
                      },
                    ]}
                  />

                  <Box>
                    <ProgressBar
                      value={fill}
                      color={item.isLowStock ? colors.accent.error : colors.brand.primary}
                      accessibilityLabel={`${item.name} stock level`}
                    />
                    <Row justify="space-between" style={{ marginTop: theme.spacing.xs }}>
                      <Typography variant="caption" color="muted">
                        Safety min: {item.minThreshold.toLocaleString('en-IN')} {item.unit}
                      </Typography>
                      <Typography variant="caption" color="muted">
                        {isFinished ? 'Price' : 'Cost'}: {money(item.unitCostOrPrice)} / {item.unit}
                      </Typography>
                    </Row>
                  </Box>

                  <Row gap="sm" wrap>
                    {!isFinished && (
                      <Button
                        label="Stock In"
                        variant="primary"
                        size="sm"
                        leftIcon="add"
                        onPress={() => openSheet('record_purchase')}
                      />
                    )}
                    <Button
                      label="Adjust"
                      variant="secondary"
                      size="sm"
                      onPress={() => openSheet('adjust_stock')}
                    />
                    <Button
                      label="Edit"
                      variant="secondary"
                      size="sm"
                      leftIcon="create-outline"
                      onPress={() =>
                        isFinished
                          ? openSheet('edit_product', { productId: item.id })
                          : setItemToEdit(item)
                      }
                    />
                  </Row>
                </Stack>
              </Card>
            );
          }}
          refreshing={isRefetching}
          onRefresh={refetch}
        />
        {overlays}
      </>
    );
  }

  return (
    <>
      <ScreenList
        header={
          <Stack gap="lg" style={{ marginBottom: theme.spacing.md }}>
            {header}
            <Typography variant="bodySmall" color="secondary">
              Every movement references the transaction that caused it.
            </Typography>
          </Stack>
        }
        data={movements}
        keyExtractor={(row) => row.id}
        placeholder={
          loadingMovements ? (
            <LoadingState message="Loading movements..." />
          ) : movements.length === 0 ? (
            <EmptyState
              title="No Movements Yet"
              description="Movements appear here once purchases, batches or dispatches happen."
            />
          ) : null
        }
        renderItem={({ item: mov }) => {
          const isIn = mov.direction === 'in';
          return (
            <Card variant="elevated" padding="compact">
              <ListItem
                title={mov.itemName}
                subtitle={`Ref: ${mov.referenceType.toUpperCase()} #${mov.referenceId}`}
                meta={`${mov.date} • ${mov.notes || ''}`}
                value={`${isIn ? '+' : '-'}${mov.quantity} ${mov.unit}`}
                valueColor={isIn ? 'success' : 'primary'}
                badge={{
                  label: mov.movementType.replace('_', ' ').toUpperCase(),
                  variant:
                    mov.movementType === 'purchase' || mov.movementType === 'finished_production'
                      ? 'success'
                      : mov.movementType === 'reversal'
                        ? 'danger'
                        : 'neutral',
                }}
              />
            </Card>
          );
        }}
        refreshing={isRefetching}
        onRefresh={refetch}
      />
      {overlays}
    </>
  );
};

export default InventoryScreen;
