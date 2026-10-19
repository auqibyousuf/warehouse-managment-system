import React, { useMemo } from 'react';
import { openSheet } from '../../navigation/sheets';
import { goToTab } from '../../navigation/routes';
import { theme, useColors } from '../../theme';
import { useDashboardMetrics } from '../../hooks/api/useDashboard';
import { useProductionBatches } from '../../hooks/api/useProduction';
import { useSalesInvoices, useCustomerPayments } from '../../hooks/api/useSales';
import { useInventoryItems, usePurchases } from '../../hooks/api/useInventory';
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
  ListItem,
  Divider,
  LoadingState,
  ChipPicker,
  ProgressBar,
  InsetStats,
} from '../../components';

const PERIOD_OPTIONS: { value: FilterPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'all_time', label: 'All Time' },
];

const money = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;

interface LedgerEntry {
  id: string;
  date: string;
  kind: 'SALE' | 'PAYMENT' | 'PURCHASE';
  party: string;
  reference: string;
  amount: number;
}

export const DashboardScreen: React.FC = () => {
  const colors = useColors();
  const { selectedPeriod, setSelectedPeriod } = useAppStore();
  const { data: metrics, isLoading, refetch, isRefetching } = useDashboardMetrics(selectedPeriod);
  const { data: batches = [] } = useProductionBatches();
  const { data: invoices = [] } = useSalesInvoices();
  const { data: payments = [] } = useCustomerPayments();
  const { data: purchases = [] } = usePurchases();
  const { data: stock = [] } = useInventoryItems();

  const lowStock = useMemo(() => stock.filter((item) => item.isLowStock), [stock]);
  const healthyShare = stock.length > 0 ? (stock.length - lowStock.length) / stock.length : 1;

  const ledgerFeed = useMemo<LedgerEntry[]>(() => {
    const entries: LedgerEntry[] = [
      ...invoices
        .filter((i) => i.paymentStatus !== 'cancelled')
        .map((i) => ({
          id: i.id,
          date: i.date,
          kind: 'SALE' as const,
          party: i.customerName,
          reference: i.invoiceNumber,
          amount: i.totalAmount,
        })),
      ...payments.map((p) => ({
        id: p.id,
        date: p.date,
        kind: 'PAYMENT' as const,
        party: p.customerName,
        reference: p.paymentNumber,
        amount: p.amount,
      })),
      ...purchases.map((p) => ({
        id: p.id,
        date: p.date,
        kind: 'PURCHASE' as const,
        party: p.supplierName,
        reference: p.purchaseNumber,
        amount: p.totalAmount,
      })),
    ];
    return entries.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5);
  }, [invoices, payments, purchases]);

  if (isLoading && !metrics) {
    return (
      <ScreenContainer>
        <LoadingState message="Loading dashboard..." />
      </ScreenContainer>
    );
  }

  const revenue = metrics?.sales.salesRevenue ?? 0;
  const collected = metrics?.sales.cashCollected ?? 0;
  const settledShare = revenue > 0 ? Math.min(1, collected / revenue) : 0;
  const unitName = metrics?.production.defaultUnitName || 'units';
  const finance = metrics?.financial;
  const recentBatches = batches.slice(0, 3);

  return (
    <ScreenContainer refreshing={isRefetching} onRefresh={refetch}>
      <Stack gap="lg">
        <ChipPicker
          options={PERIOD_OPTIONS}
          selected={selectedPeriod}
          onSelect={(value) => setSelectedPeriod(value as FilterPeriod)}
        />

        {/* KPI grid */}
        <Stack gap="sm">
          <Row gap="sm" align="stretch">
            <Card variant="elevated" padding="compact" style={{ flex: 1 }}>
              <Typography variant="label" color="muted">
                Batches
              </Typography>
              <Typography variant="metric" color="primary" tabular style={styles.kpiValue}>
                {metrics?.production.totalBatches ?? 0}
              </Typography>
              <Typography variant="caption" color="secondary">
                {(metrics?.production.totalUnitsProduced ?? 0).toLocaleString('en-IN')} {unitName}{' '}
                produced
              </Typography>
            </Card>
            <Card variant="elevated" padding="compact" style={{ flex: 1 }}>
              <Typography variant="label" color="muted">
                Turnover
              </Typography>
              <Typography variant="metric" color="primary" tabular style={styles.kpiValue}>
                {money(revenue)}
              </Typography>
              <Typography variant="caption" color="secondary">
                {(metrics?.sales.totalUnitsSold ?? 0).toLocaleString('en-IN')} {unitName} sold
              </Typography>
            </Card>
          </Row>
          <Row gap="sm" align="stretch">
            <Card variant="elevated" padding="compact" style={{ flex: 1 }}>
              <Typography variant="label" color="muted">
                Collections
              </Typography>
              <Typography variant="metric" color="primary" tabular style={styles.kpiValue}>
                {money(collected)}
              </Typography>
              <ProgressBar value={settledShare} color={colors.accent.success} />
              <Typography
                variant="caption"
                color="secondary"
                style={{ marginTop: theme.spacing.xs }}
              >
                Settled {Math.round(settledShare * 100)}% • Due{' '}
                {money(metrics?.sales.outstandingDues ?? 0)}
              </Typography>
            </Card>
            <Card variant="elevated" padding="compact" style={{ flex: 1 }}>
              <Row justify="space-between" align="center">
                <Typography variant="label" color="muted">
                  Stock safety
                </Typography>
                {lowStock.length > 0 && (
                  <Badge label={`${lowStock.length} low`} variant="danger" size="sm" />
                )}
              </Row>
              <Typography variant="metric" color="primary" tabular style={styles.kpiValue}>
                {Math.round(healthyShare * 100)}%
              </Typography>
              <ProgressBar
                value={healthyShare}
                color={lowStock.length > 0 ? colors.accent.warning : colors.accent.success}
              />
              <Typography
                variant="caption"
                color="secondary"
                style={{ marginTop: theme.spacing.xs }}
              >
                {lowStock.length === 0 ? 'All items above safety' : 'Items need reordering'}
              </Typography>
            </Card>
          </Row>
        </Stack>

        {/* Command dispatches */}
        <Stack gap="sm">
          <Typography variant="label" color="muted">
            Quick actions
          </Typography>
          <Row gap="sm" wrap>
            <Button
              label="Start Batch"
              variant="primary"
              leftIcon="add-circle-outline"
              onPress={() => openSheet('start_batch')}
            />
            <Button
              label="Sales Invoice"
              variant="secondary"
              leftIcon="receipt-outline"
              onPress={() => openSheet('create_sale')}
            />
            <Button
              label="Purchase Bill"
              variant="secondary"
              leftIcon="cart-outline"
              onPress={() => openSheet('record_purchase')}
            />
            <Button
              label="Payment"
              variant="secondary"
              leftIcon="cash-outline"
              onPress={() => openSheet('record_payment')}
            />
          </Row>
        </Stack>

        {/* Low-stock alerts */}
        {lowStock.length > 0 && (
          <Stack gap="sm">
            <Row justify="space-between" align="center">
              <Typography variant="h3" color="primary">
                Stock alerts
              </Typography>
              <Badge label={`${lowStock.length} live`} variant="danger" size="sm" />
            </Row>
            {lowStock.slice(0, 3).map((item) => (
              <Card key={item.id} variant="elevated" padding="normal">
                <Stack gap="md">
                  <Row justify="space-between" align="center" gap="sm">
                    <Box flex={1}>
                      <Typography variant="label" color="error">
                        Below safety level
                      </Typography>
                      <Typography variant="title" color="primary" numberOfLines={2}>
                        {item.name}
                      </Typography>
                    </Box>
                    <Button
                      label="Reorder"
                      variant="primary"
                      size="sm"
                      onPress={() => openSheet('record_purchase')}
                    />
                  </Row>
                  <InsetStats
                    stats={[
                      {
                        label: 'Remaining',
                        value: `${item.currentStock.toLocaleString('en-IN')} ${item.unit}`,
                        valueColor: 'error',
                      },
                      {
                        label: 'Safety min',
                        value: `${item.minThreshold.toLocaleString('en-IN')} ${item.unit}`,
                      },
                    ]}
                  />
                </Stack>
              </Card>
            ))}
          </Stack>
        )}

        {/* Operating profit */}
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
                '(−) Operating overheads',
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

        {/* Production */}
        <Stack gap="sm">
          <Row justify="space-between" align="center">
            <Typography variant="h3" color="primary">
              Production
            </Typography>
            <Button
              label="Full feed"
              variant="ghost"
              size="sm"
              rightIcon="arrow-forward"
              onPress={() => goToTab('production')}
            />
          </Row>
          {recentBatches.length === 0 ? (
            <Card variant="flat" padding="normal">
              <Typography variant="bodySmall" color="secondary">
                No batches yet. Start your first batch from the quick actions above.
              </Typography>
            </Card>
          ) : (
            recentBatches.map((batch) => (
              <Card key={batch.id} variant="elevated" padding="compact">
                <ListItem
                  title={batch.productName}
                  subtitle={`${batch.batchNumber} • ${batch.date}`}
                  value={`${batch.unitsPacked} ${batch.outputUnit}`}
                  valueSubtitle={money(batch.directBatchCost)}
                  badge={{
                    label: batch.status === 'reversed' ? 'REVERSED' : 'DONE',
                    variant: batch.status === 'reversed' ? 'danger' : 'success',
                  }}
                />
              </Card>
            ))
          )}
        </Stack>

        {/* Ledger movement */}
        <Stack gap="sm">
          <Row justify="space-between" align="center">
            <Typography variant="h3" color="primary">
              Ledger movement
            </Typography>
            <Button
              label="Open ledger"
              variant="ghost"
              size="sm"
              rightIcon="arrow-forward"
              onPress={() => goToTab('ledger')}
            />
          </Row>
          {ledgerFeed.length === 0 ? (
            <Card variant="flat" padding="normal">
              <Typography variant="bodySmall" color="secondary">
                Sales, payments and purchases will appear here.
              </Typography>
            </Card>
          ) : (
            <Card variant="elevated" padding="compact">
              {ledgerFeed.map((entry, index) => (
                <ListItem
                  key={`${entry.kind}-${entry.id}`}
                  title={entry.party}
                  subtitle={`${entry.reference} • ${entry.date}`}
                  value={`${entry.kind === 'PURCHASE' ? '−' : '+'}${money(entry.amount)}`}
                  valueColor={entry.kind === 'PURCHASE' ? 'error' : 'success'}
                  badge={{
                    label: entry.kind,
                    variant:
                      entry.kind === 'PURCHASE'
                        ? 'danger'
                        : entry.kind === 'SALE'
                          ? 'info'
                          : 'success',
                  }}
                  showDivider={index < ledgerFeed.length - 1}
                />
              ))}
            </Card>
          )}
        </Stack>
      </Stack>
    </ScreenContainer>
  );
};

const styles = {
  kpiValue: { marginVertical: theme.spacing.xs },
};

export default DashboardScreen;
