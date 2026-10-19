import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { openSheet } from '../../navigation/sheets';
import { goToTab, openManage } from '../../navigation/routes';
import { theme, useColors } from '../../theme';
import { useMoney } from '../../hooks/useMoney';
import { useDashboardMetrics } from '../../hooks/api/useDashboard';
import { useProductionBatches } from '../../hooks/api/useProduction';
import { useInventoryItems } from '../../hooks/api/useInventory';
import { useAppStore, FilterPeriod } from '../../stores/useAppStore';
import {
  ScreenContainer,
  Box,
  Stack,
  Row,
  Typography,
  Card,
  Button,
  Badge,
  LoadingState,
  ChipPicker,
  ProgressBar,
  Icon,
  IconTile,
} from '../../components';

const PERIOD_OPTIONS: { value: FilterPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'all_time', label: 'All Time' },
];

const greeting = (hour: number) =>
  hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

/** Home: what needs attention today, one tap to start a batch, how the business is doing. */
export const DashboardScreen: React.FC = () => {
  const colors = useColors();
  const money = useMoney();
  const { selectedPeriod, setSelectedPeriod } = useAppStore();
  const { data: metrics, isLoading, refetch, isRefetching } = useDashboardMetrics(selectedPeriod);
  const { data: batches = [] } = useProductionBatches();
  const { data: stock = [] } = useInventoryItems();
  const [dismissed, setDismissed] = useState<string | null>(null);

  const now = new Date();
  const dateLine = now.toLocaleDateString('en', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const lowStock = useMemo(() => stock.filter((item) => item.isLowStock), [stock]);
  const alertItem = lowStock.find((item) => item.id !== dismissed) ?? null;
  const recentBatches = batches.slice(0, 4);

  if (isLoading && !metrics) {
    return (
      <ScreenContainer>
        <LoadingState message="Loading..." />
      </ScreenContainer>
    );
  }

  const unitName = metrics?.production.defaultUnitName || 'units';
  const revenue = metrics?.sales.salesRevenue ?? 0;
  const collected = metrics?.sales.cashCollected ?? 0;
  const settledShare = revenue > 0 ? Math.min(1, collected / revenue) : 0;
  const finance = metrics?.financial;

  return (
    <ScreenContainer refreshing={isRefetching} onRefresh={refetch}>
      <Stack gap="xl">
        <Box>
          <Typography variant="h2" color="primary">
            {greeting(now.getHours())}
          </Typography>
          <Typography variant="bodyMedium" color="secondary">
            Today, {dateLine}
          </Typography>
        </Box>

        <ChipPicker
          options={PERIOD_OPTIONS}
          selected={selectedPeriod}
          onSelect={(value) => setSelectedPeriod(value as FilterPeriod)}
        />

        {/* Overview */}
        <Stack gap="sm">
          <Typography variant="title" color="primary">
            Overview
          </Typography>
          <Card variant="elevated" padding="compact">
            <Row gap="xs" align="center">
              <Icon name="cube-outline" size={18} color="brandPrimary" />
              <Typography variant="bodySmall" color="secondary">
                {unitName.charAt(0).toUpperCase() + unitName.slice(1)} produced
              </Typography>
            </Row>
            <Row gap="xs" align="flex-end" style={{ marginTop: theme.spacing.xxs }}>
              <Typography variant="dataLarge" color="primary" tabular>
                {(metrics?.production.totalUnitsProduced ?? 0).toLocaleString('en-IN')}
              </Typography>
              <Typography variant="bodySmall" color="secondary">
                {unitName} • {(metrics?.production.totalBaseQuantity ?? 0).toLocaleString('en-IN')}{' '}
                {metrics?.production.baseUnit || 'kg'}
              </Typography>
            </Row>
          </Card>

          <Row gap="sm" align="stretch">
            <Card variant="elevated" padding="compact" style={styles.smallCard}>
              <Row justify="space-between" align="center">
                <Typography variant="bodySmall" color="secondary">
                  Batches done
                </Typography>
                <IconTile icon="checkmark-circle" tone="success" size={28} />
              </Row>
              <Box>
                <Typography variant="dataLarge" color="primary" tabular>
                  {metrics?.production.totalBatches ?? 0}
                </Typography>
                <Typography variant="bodySmall" color="success">
                  Confirmed
                </Typography>
              </Box>
            </Card>
            <Card
              variant="elevated"
              padding="compact"
              style={styles.smallCard}
              onPress={() => goToTab('stock')}
            >
              <Row justify="space-between" align="center">
                <Typography variant="bodySmall" color="secondary">
                  Stock alerts
                </Typography>
                <IconTile
                  icon={lowStock.length > 0 ? 'warning' : 'shield-checkmark'}
                  tone={lowStock.length > 0 ? 'warning' : 'success'}
                  size={28}
                />
              </Row>
              <Box>
                <Typography
                  variant="dataLarge"
                  color={lowStock.length > 0 ? 'warning' : 'primary'}
                  tabular
                >
                  {lowStock.length}
                </Typography>
                <Typography variant="bodySmall" color="secondary" numberOfLines={1}>
                  {lowStock.length > 0 ? lowStock[0].name : 'All healthy'}
                </Typography>
              </Box>
            </Card>
          </Row>
        </Stack>

        {/* Primary actions */}
        <Stack gap="xs">
          <Button
            label="+ Start New Batch"
            variant="primary"
            size="lg"
            leftIcon="play-circle-outline"
            fullWidth
            onPress={() => openSheet('start_batch')}
          />
          <Row gap="sm">
            <Button
              label="Add / Use Stock"
              variant="secondary"
              leftIcon="archive-outline"
              style={{ flex: 1 }}
              onPress={() => goToTab('stock')}
            />
            <Button
              label="New Invoice"
              variant="secondary"
              leftIcon="receipt-outline"
              style={{ flex: 1 }}
              onPress={() => openSheet('create_sale')}
            />
          </Row>
        </Stack>

        {/* Low-stock alert */}
        {alertItem && (
          <Card tone="warning" padding="compact">
            <Row gap="sm" align="flex-start">
              <IconTile icon="cube" tone="warning" size={32} />
              <Box flex={1}>
                <Row justify="space-between" align="center">
                  <Typography variant="title" color="warning">
                    Low {alertItem.type === 'raw_material' ? 'raw material' : 'stock'}
                  </Typography>
                  <Typography variant="label" color="warning">
                    Action suggested
                  </Typography>
                </Row>
                <Typography variant="bodySmall" color="secondary" style={{ marginTop: 2 }}>
                  {alertItem.name} is running low (
                  <Typography variant="dataMedium" color="primary">
                    {alertItem.currentStock.toLocaleString('en-IN')} {alertItem.unit} remaining
                  </Typography>
                  ).{lowStock.length > 1 ? ` ${lowStock.length - 1} more below minimum.` : ''}
                </Typography>
                <Row gap="md" align="center" style={{ marginTop: theme.spacing.xs }}>
                  <Pressable
                    onPress={() => openSheet('record_purchase', { itemId: alertItem.id })}
                    accessibilityRole="button"
                    accessibilityLabel={`Reorder ${alertItem.name}`}
                  >
                    <Typography variant="bodySmall" weight="semibold" color="warning">
                      Reorder Now →
                    </Typography>
                  </Pressable>
                  <Pressable
                    onPress={() => setDismissed(alertItem.id)}
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss alert"
                  >
                    <Typography variant="bodySmall" color="secondary">
                      Dismiss
                    </Typography>
                  </Pressable>
                </Row>
              </Box>
            </Row>
          </Card>
        )}

        {/* Batch runs */}
        <Stack gap="sm">
          <Row justify="space-between" align="center">
            <Row gap="xs" align="center">
              <Typography variant="title" color="primary">
                Recent batch runs
              </Typography>
              <Badge label={String(batches.length)} variant="neutral" size="sm" />
            </Row>
            <Pressable
              onPress={() => openManage('/recipes')}
              accessibilityRole="button"
              accessibilityLabel="View all batches"
            >
              <Typography variant="bodySmall" weight="medium" color="brandPrimary">
                View all
              </Typography>
            </Pressable>
          </Row>
          {recentBatches.length === 0 ? (
            <Card variant="flat" padding="compact">
              <Typography variant="bodySmall" color="secondary">
                No batches yet. Tap &quot;Start New Batch&quot; to run your first one.
              </Typography>
            </Card>
          ) : (
            recentBatches.map((batch) => {
              const reversed = batch.status === 'reversed';
              return (
                <Card
                  key={batch.id}
                  variant="elevated"
                  padding="compact"
                  onPress={() => openSheet('batch_detail', { batchId: batch.id })}
                >
                  <Row gap="sm" align="flex-start">
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
            })
          )}
        </Stack>

        {/* Money: two compact cards, details one tap away */}
        <Stack gap="sm">
          <Typography variant="title" color="primary">
            Money
          </Typography>
          <Card variant="elevated" padding="compact" onPress={() => goToTab('invoices')}>
            <Row justify="space-between" align="center">
              <Typography variant="bodySmall" color="secondary">
                Sales billed
              </Typography>
              <Typography variant="dataLarge" color="primary" tabular>
                {money(revenue)}
              </Typography>
            </Row>
            <Box marginTop="xs">
              <ProgressBar value={settledShare} color={colors.brand.medium} height={10} />
            </Box>
            <Row justify="space-between" style={{ marginTop: theme.spacing.xs }}>
              <Typography variant="bodySmall" color="success">
                Collected {money(collected)}
              </Typography>
              <Typography variant="bodySmall" color="warning">
                Due {money(metrics?.sales.outstandingDues ?? 0)}
              </Typography>
            </Row>
          </Card>

          <Card
            variant="elevated"
            padding="compact"
            onPress={() => openSheet('profit_detail', { period: selectedPeriod })}
          >
            <Row justify="space-between" align="center">
              <Box>
                <Typography variant="bodySmall" color="secondary">
                  Estimated operating profit
                </Typography>
                <Typography
                  variant="dataLarge"
                  color={(finance?.estimatedOperatingProfit ?? 0) >= 0 ? 'success' : 'error'}
                  tabular
                >
                  {money(finance?.estimatedOperatingProfit ?? 0)}
                </Typography>
              </Box>
              <Icon name="chevron-forward" size={20} color="subtle" />
            </Row>
          </Card>
        </Stack>
      </Stack>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  smallCard: { flex: 1, height: 112, justifyContent: 'space-between' },
});

export default DashboardScreen;
