import React, { useMemo, useState } from 'react';
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
  Divider,
  LoadingState,
  ChipPicker,
  ProgressBar,
  Icon,
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
      <Stack gap="lg">
        <Box>
          <Typography variant="h1" color="primary">
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

        {/* Daily overview */}
        <Stack gap="sm">
          <Typography variant="h3" color="primary">
            Overview
          </Typography>
          <Card variant="elevated" padding="normal">
            <Row gap="xs" align="center">
              <Icon name="clipboard-outline" size="sm" color="brandPrimary" />
              <Typography variant="bodyMedium" color="secondary">
                {unitName.charAt(0).toUpperCase() + unitName.slice(1)} produced
              </Typography>
            </Row>
            <Typography variant="display" color="primary" tabular style={{ marginTop: 4 }}>
              {(metrics?.production.totalUnitsProduced ?? 0).toLocaleString('en-IN')}
            </Typography>
            <Typography variant="caption" color="muted">
              {(metrics?.production.totalBaseQuantity ?? 0).toLocaleString('en-IN')}{' '}
              {metrics?.production.baseUnit || 'kg'} total output
            </Typography>
          </Card>

          <Row gap="sm" align="stretch">
            <Card variant="elevated" padding="compact" style={{ flex: 1 }}>
              <Row justify="space-between" align="center">
                <Typography variant="bodyMedium" color="secondary">
                  Batches done
                </Typography>
                <Icon name="checkmark-circle" size="md" color="success" />
              </Row>
              <Typography variant="h1" color="primary" tabular>
                {metrics?.production.totalBatches ?? 0}
              </Typography>
              <Typography variant="caption" color="success">
                Confirmed batches
              </Typography>
            </Card>
            <Card
              variant={lowStock.length > 0 ? 'accent' : 'elevated'}
              padding="compact"
              style={{ flex: 1 }}
              onPress={() => goToTab('stock')}
            >
              <Row justify="space-between" align="center">
                <Typography variant="bodyMedium" color="secondary">
                  Stock alerts
                </Typography>
                <Icon
                  name={lowStock.length > 0 ? 'warning' : 'shield-checkmark'}
                  size="md"
                  color={lowStock.length > 0 ? 'warning' : 'success'}
                />
              </Row>
              <Typography variant="h1" color={lowStock.length > 0 ? 'warning' : 'primary'} tabular>
                {lowStock.length}
              </Typography>
              <Typography variant="caption" color="secondary" numberOfLines={1}>
                {lowStock.length > 0 ? `${lowStock[0].name}` : 'All items healthy'}
              </Typography>
            </Card>
          </Row>
        </Stack>

        {/* Primary actions */}
        <Stack gap="sm">
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
          <Card variant="accent" padding="normal">
            <Row gap="sm" align="flex-start">
              <Icon name="alert-circle" size="lg" color="warning" />
              <Box flex={1}>
                <Row justify="space-between" align="center">
                  <Typography variant="title" color="primary">
                    Low {alertItem.type === 'raw_material' ? 'raw material' : 'stock'}
                  </Typography>
                  <Typography variant="label" color="warning">
                    Action suggested
                  </Typography>
                </Row>
                <Typography variant="bodyMedium" color="secondary" style={{ marginTop: 4 }}>
                  {alertItem.name} is running low ({alertItem.currentStock.toLocaleString('en-IN')}{' '}
                  {alertItem.unit} left, minimum {alertItem.minThreshold.toLocaleString('en-IN')}).
                  {lowStock.length > 1 ? ` ${lowStock.length - 1} more below minimum.` : ''}
                </Typography>
                <Row gap="sm" style={{ marginTop: theme.spacing.sm }}>
                  <Button
                    label="Reorder Now"
                    variant="primary"
                    size="sm"
                    rightIcon="arrow-forward"
                    onPress={() => openSheet('record_purchase', { itemId: alertItem.id })}
                  />
                  <Button
                    label="Dismiss"
                    variant="ghost"
                    size="sm"
                    onPress={() => setDismissed(alertItem.id)}
                  />
                </Row>
              </Box>
            </Row>
          </Card>
        )}

        {/* Batch runs */}
        <Stack gap="sm">
          <Row justify="space-between" align="center">
            <Row gap="xs" align="center">
              <Typography variant="h3" color="primary">
                Recent batch runs
              </Typography>
              <Badge label={String(batches.length)} variant="neutral" size="sm" />
            </Row>
            <Button
              label="View all"
              variant="ghost"
              size="sm"
              onPress={() => openManage('/recipes')}
            />
          </Row>
          {recentBatches.length === 0 ? (
            <Card variant="flat" padding="normal">
              <Typography variant="bodySmall" color="secondary">
                No batches yet. Tap &quot;Start New Batch&quot; to run your first one.
              </Typography>
            </Card>
          ) : (
            recentBatches.map((batch) => {
              const reversed = batch.status === 'reversed';
              return (
                <Card key={batch.id} variant="elevated" padding="compact">
                  <Row gap="sm" align="center">
                    <Box
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: theme.radii.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: reversed
                          ? colors.status.error.bg
                          : colors.status.success.bg,
                      }}
                    >
                      <Icon
                        name={reversed ? 'refresh' : 'checkmark'}
                        size="md"
                        color={reversed ? 'error' : 'success'}
                      />
                    </Box>
                    <Box flex={1}>
                      <Typography variant="title" color="primary" numberOfLines={1}>
                        {batch.batchNumber} {batch.productName}
                      </Typography>
                      <Typography variant="caption" color="muted">
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

        {/* Money */}
        <Stack gap="sm">
          <Row justify="space-between" align="center">
            <Typography variant="h3" color="primary">
              Money
            </Typography>
            <Button
              label="Invoices"
              variant="ghost"
              size="sm"
              rightIcon="arrow-forward"
              onPress={() => goToTab('invoices')}
            />
          </Row>
          <Card variant="elevated" padding="normal">
            <Row justify="space-between" align="center">
              <Typography variant="bodyMedium" color="secondary">
                Sales billed
              </Typography>
              <Typography variant="h3" color="primary" tabular>
                {money(revenue)}
              </Typography>
            </Row>
            <Box marginTop="sm">
              <ProgressBar value={settledShare} color={colors.accent.success} />
            </Box>
            <Row justify="space-between" style={{ marginTop: theme.spacing.xs }}>
              <Typography variant="caption" color="success">
                Collected {money(collected)}
              </Typography>
              <Typography variant="caption" color="warning">
                Due {money(metrics?.sales.outstandingDues ?? 0)}
              </Typography>
            </Row>
          </Card>

          <Card variant="accent" padding="normal">
            <Row justify="space-between" align="flex-start">
              <Typography variant="label" color="brandDeep">
                Estimated operating profit
              </Typography>
              <Badge label="Estimate" variant="forest" size="sm" />
            </Row>
            <Typography
              variant="h1"
              color={(finance?.estimatedOperatingProfit ?? 0) >= 0 ? 'brandDeep' : 'error'}
              tabular
              style={{ marginVertical: theme.spacing.sm }}
            >
              {money(finance?.estimatedOperatingProfit ?? 0)}
            </Typography>
            <Stack gap="xs">
              {[
                ['(+) Sales revenue', money(finance?.salesRevenue ?? 0), 'primary' as const],
                [
                  '(−) Cost of goods sold',
                  `−${money(finance?.costOfGoodsSold ?? 0)}`,
                  'error' as const,
                ],
                [
                  '(−) Operating expenses',
                  `−${money(finance?.operatingExpenses ?? 0)}`,
                  'error' as const,
                ],
              ].map(([label, value, color]) => (
                <Row key={label as string} justify="space-between">
                  <Typography variant="bodySmall" color="secondary">
                    {label}
                  </Typography>
                  <Typography variant="dataMedium" color={color as 'primary' | 'error'} tabular>
                    {value}
                  </Typography>
                </Row>
              ))}
            </Stack>
            <Divider variant="subtle" spacing="sm" />
            <Typography variant="caption" color="muted">
              Unsold finished stock is inventory, not cost of goods sold.
            </Typography>
          </Card>
        </Stack>
      </Stack>
    </ScreenContainer>
  );
};

export default DashboardScreen;
