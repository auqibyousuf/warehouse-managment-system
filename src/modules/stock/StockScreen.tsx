import React, { useMemo, useState } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { openSheet } from '../../navigation/sheets';
import { theme, useColors } from '../../theme';
import { useMoney } from '../../hooks/useMoney';
import { useInventoryItems } from '../../hooks/api/useInventory';
import {
  Box,
  Stack,
  Row,
  Typography,
  Card,
  Button,
  Badge,
  ChipPicker,
  LoadingState,
  EmptyState,
  ScreenList,
  SearchField,
  Icon,
} from '../../components';

type CategoryFilter = 'all' | 'raw_material' | 'packaging' | 'finished_feed' | 'low';

/** Stock & Materials: add or use stock in one tap, see what is low. */
export const StockScreen: React.FC = () => {
  const colors = useColors();
  const money = useMoney();
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [query, setQuery] = useState('');

  const { data: stockItems = [], isLoading, refetch, isRefetching } = useInventoryItems();

  const counts = useMemo(
    () => ({
      all: stockItems.length,
      raw_material: stockItems.filter((i) => i.type === 'raw_material').length,
      packaging: stockItems.filter((i) => i.type === 'packaging').length,
      finished_feed: stockItems.filter((i) => i.type === 'finished_feed').length,
      low: stockItems.filter((i) => i.isLowStock).length,
    }),
    [stockItems],
  );

  const stockValue = useMemo(
    () =>
      stockItems
        .filter((i) => i.type !== 'finished_feed')
        .reduce((sum, i) => sum + i.currentStock * i.unitCostOrPrice, 0),
    [stockItems],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return stockItems
      .filter(
        (item) =>
          (category === 'all' || (category === 'low' ? item.isLowStock : item.type === category)) &&
          (!needle || item.name.toLowerCase().includes(needle)),
      )
      .sort((a, b) => Number(b.isLowStock) - Number(a.isLowStock));
  }, [stockItems, category, query]);

  const header = (
    <Stack gap="md" style={{ marginBottom: theme.spacing.md }}>
      <Row gap="sm" align="stretch">
        <Pressable
          onPress={() => openSheet('record_purchase')}
          accessibilityRole="button"
          accessibilityLabel="Add stock: intake and deliveries"
          style={[styles.tile, { backgroundColor: colors.accent.success }]}
        >
          <Row justify="space-between" align="center">
            <View style={[styles.tileIcon, { backgroundColor: colors.overlay.medium }]}>
              <Icon name="download-outline" size="md" color={colors.onAccent.success} />
            </View>
            <Icon name="add-circle-outline" size="md" color={colors.onAccent.success} />
          </Row>
          <Typography variant="h3" style={{ color: colors.onAccent.success, marginTop: 12 }}>
            + Add Stock
          </Typography>
          <Typography variant="label" style={{ color: colors.onAccent.success }}>
            Intake / deliveries
          </Typography>
        </Pressable>

        <Pressable
          onPress={() => openSheet('use_stock')}
          accessibilityRole="button"
          accessibilityLabel="Use stock: batching and waste"
          style={[styles.tile, { backgroundColor: colors.accent.warning }]}
        >
          <Row justify="space-between" align="center">
            <View style={[styles.tileIcon, { backgroundColor: colors.overlay.medium }]}>
              <Icon name="share-outline" size="md" color={colors.onAccent.warning} />
            </View>
            <Icon name="remove-circle-outline" size="md" color={colors.onAccent.warning} />
          </Row>
          <Typography variant="h3" style={{ color: colors.onAccent.warning, marginTop: 12 }}>
            − Use Stock
          </Typography>
          <Typography variant="label" style={{ color: colors.onAccent.warning }}>
            Batching / waste
          </Typography>
        </Pressable>
      </Row>

      <SearchField value={query} onChangeText={setQuery} placeholder="Search materials or items" />

      <ChipPicker
        options={[
          { value: 'all', label: 'All', count: counts.all },
          { value: 'raw_material', label: 'Raw', count: counts.raw_material },
          { value: 'packaging', label: 'Packaging', count: counts.packaging },
          { value: 'finished_feed', label: 'Production items', count: counts.finished_feed },
          ...(counts.low > 0 ? [{ value: 'low', label: 'Low stock', count: counts.low }] : []),
        ]}
        selected={category}
        onSelect={(value) => setCategory(value as CategoryFilter)}
      />

      {category !== 'finished_feed' && (
        <Typography variant="caption" color="muted">
          Raw material and packaging on hand: {money(stockValue)} at cost
        </Typography>
      )}
    </Stack>
  );

  return (
    <>
      <ScreenList
        header={header}
        data={visible}
        keyExtractor={(row) => row.id}
        placeholder={
          isLoading ? (
            <LoadingState message="Loading stock..." />
          ) : visible.length === 0 ? (
            <EmptyState
              title="Nothing found"
              description="No items match this search. Add a new item with + Add Stock."
            />
          ) : null
        }
        renderItem={({ item }) => {
          const isFinished = item.type === 'finished_feed';
          const low = item.isLowStock;
          return (
            <Card variant="elevated" padding="compact">
              <Stack gap="sm">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name} details`}
                  onPress={() => openSheet('stock_detail', { itemId: item.id })}
                >
                  <Row justify="space-between" align="flex-start" gap="sm">
                    <Box flex={1}>
                      <Typography variant="title" color="primary" numberOfLines={2}>
                        {item.name}
                      </Typography>
                      <Typography variant="bodySmall" color="muted">
                        {isFinished
                          ? 'Production item'
                          : item.type === 'packaging'
                            ? 'Packaging'
                            : 'Raw material'}
                      </Typography>
                    </Box>
                    {low ? (
                      <Badge
                        label={`Min: ${item.minThreshold} ${item.unit}`}
                        variant="warning"
                        icon="warning-outline"
                        size="sm"
                        soft
                      />
                    ) : (
                      <Badge
                        label={'In stock'}
                        variant="success"
                        icon="checkmark-circle-outline"
                        size="sm"
                        soft
                      />
                    )}
                  </Row>
                </Pressable>

                <Row justify="space-between" align="flex-end" gap="sm">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${item.name} quantity details`}
                    onPress={() => openSheet('stock_detail', { itemId: item.id })}
                  >
                    <Typography variant="label" color={low ? 'warning' : 'muted'}>
                      {low
                        ? 'Low stock level'
                        : isFinished
                          ? 'Made in your batches'
                          : 'Available quantity'}
                    </Typography>
                    <Row gap="xs" align="flex-end">
                      <Typography variant="h1" color={low ? 'warning' : 'primary'} tabular>
                        {item.currentStock.toLocaleString('en-IN')}
                      </Typography>
                      <Typography
                        variant="dataMedium"
                        color="secondary"
                        style={{ marginBottom: 4 }}
                      >
                        {item.unit}
                      </Typography>
                    </Row>
                  </Pressable>

                  <Row gap="xs">
                    {isFinished ? (
                      <Button
                        label="Create Invoice"
                        variant="primary"
                        size="sm"
                        leftIcon="receipt-outline"
                        onPress={() => openSheet('create_sale')}
                      />
                    ) : (
                      <>
                        {low && (
                          <Button
                            label="Reorder"
                            variant="warning"
                            size="sm"
                            leftIcon="cart-outline"
                            onPress={() => openSheet('record_purchase', { itemId: item.id })}
                          />
                        )}
                        <Button
                          label="Add"
                          variant="subtle"
                          size="sm"
                          leftIcon="add"
                          onPress={() => openSheet('record_purchase', { itemId: item.id })}
                        />
                        {!low && (
                          <Button
                            label="Use"
                            variant="tonalWarning"
                            size="sm"
                            leftIcon="remove"
                            onPress={() => openSheet('use_stock', { itemId: item.id })}
                          />
                        )}
                      </>
                    )}
                  </Row>
                </Row>
              </Stack>
            </Card>
          );
        }}
        refreshing={isRefetching}
        onRefresh={refetch}
      />
    </>
  );
};

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    padding: theme.spacing.base,
    borderRadius: theme.radii.md,
    minHeight: 124,
    justifyContent: 'space-between',
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default StockScreen;
