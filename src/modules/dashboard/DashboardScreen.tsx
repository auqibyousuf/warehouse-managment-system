import { theme } from '../../theme';
import React from 'react';
import { useDashboardMetrics, useFactorySettings } from '../../hooks/api/useDashboard';
import { useProductionBatches } from '../../hooks/api/useProduction';
import { useSalesInvoices } from '../../hooks/api/useSales';
import { goToTab } from '../../navigation/routes';
import { useAppStore, FilterPeriod } from '../../stores/useAppStore';
import {
  ScreenContainer,
  Box,
  Stack,
  Row,
  Typography,
  StatCard,
  Card,
  Button,
  Badge,
  ListItem,
  Divider,
  FeedbackBanner,
  LoadingState,
  ChipPicker,
} from '../../components';

const PERIOD_OPTIONS: { value: FilterPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'all_time', label: 'All Time' },
];

export const DashboardScreen: React.FC = () => {
  const { selectedPeriod, setSelectedPeriod, openModal } = useAppStore();
  const { data: metrics, isLoading, refetch, isRefetching } = useDashboardMetrics(selectedPeriod);
  const { data: settings } = useFactorySettings();
  const { data: batches = [] } = useProductionBatches();
  const { data: invoices = [] } = useSalesInvoices();

  if (isLoading && !metrics) {
    return (
      <ScreenContainer>
        <LoadingState message="Loading factory operations dashboard..." />
      </ScreenContainer>
    );
  }

  const recentBatches = batches.slice(0, 3);
  const recentInvoices = invoices.slice(0, 3);

  return (
    <ScreenContainer refreshing={isRefetching} onRefresh={refetch}>
      <Stack gap="lg">
        {/* Factory Header Banner */}
        <Box>
          <Row justify="space-between" align="center">
            <Box>
              <Typography variant="caption" color="muted">
                OPERATIONAL DASHBOARD
              </Typography>
              <Typography variant="h1" weight="bold" color="brandDeep">
                {settings?.factoryName || 'BatchIQ Factory'}
              </Typography>
            </Box>
            <Badge label="Active" variant="success" dot />
          </Row>
        </Box>

        {/* Date Filter Chips */}
        <ChipPicker
          options={PERIOD_OPTIONS}
          selected={selectedPeriod}
          onSelect={(period) => setSelectedPeriod(period)}
        />

        {/* Low Stock Warning Alert if any item below threshold */}
        {metrics && metrics.inventory.lowStockCount > 0 && (
          <FeedbackBanner
            variant="warning"
            title="Low Inventory Warning"
            message={`${metrics.inventory.lowStockCount} raw material or feed items are currently below minimum safety stock levels.`}
            onPress={() => goToTab('inventory')}
          />
        )}

        {/* Quick Operational Actions Bar */}
        <Box>
          <Typography variant="label" color="secondary" style={{ marginBottom: theme.spacing.sm }}>
            QUICK ACTIONS
          </Typography>
          <Row gap="xs" wrap>
            <Button
              label="+ Start Batch"
              variant="primary"
              size="sm"
              leftIcon="construct-outline"
              onPress={() => openModal('start_batch')}
            />
            <Button
              label="+ Record Sale"
              variant="secondary"
              size="sm"
              leftIcon="receipt-outline"
              onPress={() => openModal('create_sale')}
            />
            <Button
              label="+ Purchase"
              variant="subtle"
              size="sm"
              leftIcon="cart-outline"
              onPress={() => openModal('record_purchase')}
            />
            <Button
              label="+ Payment"
              variant="subtle"
              size="sm"
              leftIcon="cash-outline"
              onPress={() => openModal('record_payment')}
            />
          </Row>
        </Box>

        {/* Primary Operational KPIs Grid */}
        <Stack gap="sm">
          <Typography variant="label" color="secondary">
            PRODUCTION & SALES ({selectedPeriod.replace('_', ' ').toUpperCase()})
          </Typography>
          <Row gap="sm" align="stretch">
            <Box flex={1}>
              <StatCard
                label="Units Produced"
                value={`${metrics?.production.totalUnitsProduced || metrics?.production.totalBagsProduced || 0} ${metrics?.production.defaultUnitName || 'Units'}`}
                subtitle={`${metrics?.production.totalBaseQuantity || metrics?.production.totalWeightKg || 0} ${metrics?.production.baseUnit || 'kg'} output`}
                icon="cube-outline"
                variant="forest"
                onPress={() => goToTab('production')}
              />
            </Box>
            <Box flex={1}>
              <StatCard
                label="Units Sold"
                value={`${metrics?.sales.totalUnitsSold || metrics?.sales.totalBagsSold || 0} ${metrics?.sales.defaultUnitName || 'Units'}`}
                subtitle="Dispatched to buyers"
                icon="cart-outline"
                variant="default"
                onPress={() => goToTab('sales')}
              />
            </Box>
          </Row>

          <Row gap="sm" align="stretch">
            <Box flex={1}>
              <StatCard
                label="Sales Revenue"
                value={`₹${(metrics?.sales.salesRevenue || 0).toLocaleString('en-IN')}`}
                subtitle="Invoiced value"
                icon="trending-up-outline"
                variant="default"
              />
            </Box>
            <Box flex={1}>
              <StatCard
                label="Cash Collected"
                value={`₹${(metrics?.sales.cashCollected || 0).toLocaleString('en-IN')}`}
                subtitle="Payments received"
                icon="wallet-outline"
                variant="success"
              />
            </Box>
          </Row>
        </Stack>

        {/* Customer Dues & Finished Stock */}
        <Row gap="sm" align="stretch">
          <Box flex={1}>
            <StatCard
              label="Customer Dues"
              value={`₹${(metrics?.sales.outstandingDues || 0).toLocaleString('en-IN')}`}
              subtitle="Receivables pending"
              icon="alert-circle-outline"
              variant={metrics && metrics.sales.outstandingDues > 0 ? 'warning' : 'default'}
              onPress={() => goToTab('business')}
            />
          </Box>
          <Box flex={1}>
            <StatCard
              label="Finished Floor Stock"
              value={`${metrics?.inventory.finishedUnitsCount || metrics?.inventory.finishedFeedBags || 0} ${metrics?.production.defaultUnitName || 'Units'}`}
              subtitle="Available in warehouse"
              icon="layers-outline"
              variant="default"
              onPress={() => goToTab('inventory')}
            />
          </Box>
        </Row>

        {/* Authoritative Financial & Estimated Profit Card (PRD Section 3.4 & 5.4) */}
        <Card variant="accent" padding="normal">
          <Row justify="space-between" align="center" style={{ marginBottom: theme.spacing.sm }}>
            <Typography variant="label" color="brandDeep">
              ESTIMATED OPERATING PROFIT
            </Typography>
            <Badge label="Authoritative Estimate" variant="forest" size="sm" />
          </Row>

          <Typography
            variant="display"
            weight="bold"
            color={(metrics?.financial.estimatedOperatingProfit || 0) >= 0 ? 'brandDeep' : 'error'}
            style={{ marginBottom: theme.spacing.md }}
          >
            ₹{(metrics?.financial.estimatedOperatingProfit || 0).toLocaleString('en-IN')}
          </Typography>

          <Stack gap="xs">
            <Row justify="space-between">
              <Typography variant="bodySmall" color="secondary">
                (+) Sales Revenue:
              </Typography>
              <Typography variant="bodySmall" weight="semibold" color="primary">
                ₹{(metrics?.financial.salesRevenue || 0).toLocaleString('en-IN')}
              </Typography>
            </Row>

            <Row justify="space-between">
              <Typography variant="bodySmall" color="secondary">
                (-) Cost of Goods Sold (COGS):
              </Typography>
              <Typography variant="bodySmall" weight="semibold" color="error">
                -₹{(metrics?.financial.costOfGoodsSold || 0).toLocaleString('en-IN')}
              </Typography>
            </Row>

            <Row justify="space-between">
              <Typography variant="bodySmall" color="secondary">
                (-) Operating Overheads (Wages, Power, Fuel):
              </Typography>
              <Typography variant="bodySmall" weight="semibold" color="error">
                -₹{(metrics?.financial.operatingExpenses || 0).toLocaleString('en-IN')}
              </Typography>
            </Row>

            <Divider variant="brand" spacing="xs" />

            <Typography variant="caption" color="muted">
              Note: Unsold finished stock is held as inventory and not counted as COGS. Production cost for this period was ₹{(metrics?.financial.productionCost || 0).toLocaleString('en-IN')}.
            </Typography>
          </Stack>
        </Card>

        {/* Recent Production Batches */}
        <Card variant="elevated" padding="normal">
          <Row justify="space-between" align="center" style={{ marginBottom: theme.spacing.sm }}>
            <Typography variant="title" weight="bold" color="primary">
              Recent Production Batches
            </Typography>
            <Button
              label="View All"
              variant="ghost"
              size="sm"
              onPress={() => goToTab('production')}
            />
          </Row>

          <Stack gap="xs">
            {recentBatches.map((batch) => (
              <ListItem
                key={batch.id}
                title={`${batch.batchNumber} • ${batch.productName}`}
                subtitle={`Output: ${batch.unitsPacked || batch.bagsPacked} ${batch.outputUnit || 'units'} (${batch.actualFinishedQuantity || batch.actualFinishedWeightKg} ${batch.baseUnit || 'kg'})`}
                meta={`Date: ${batch.date} • Batch Cost: ₹${batch.directBatchCost.toLocaleString('en-IN')}`}
                value={`₹${(batch.directCostPerUnit || batch.directCostPerBag || 0).toFixed(1)}/${batch.outputUnit || 'unit'}`}
                valueColor="brandPrimary"
                badge={{
                  label: batch.status.toUpperCase(),
                  variant: batch.status === 'confirmed' ? 'success' : 'danger',
                }}
                showDivider
              />
            ))}
          </Stack>
        </Card>

        {/* Recent Sales Dispatches */}
        <Card variant="elevated" padding="normal">
          <Row justify="space-between" align="center" style={{ marginBottom: theme.spacing.sm }}>
            <Typography variant="title" weight="bold" color="primary">
              Recent Invoices & Dispatches
            </Typography>
            <Button
              label="View All"
              variant="ghost"
              size="sm"
              onPress={() => goToTab('sales')}
            />
          </Row>

          <Stack gap="xs">
            {recentInvoices.map((inv) => (
              <ListItem
                key={inv.id}
                title={`${inv.invoiceNumber} • ${inv.customerName}`}
                subtitle={`${inv.quantity || inv.bagQuantity} ${inv.outputUnit || 'units'} ${inv.productName}`}
                meta={`Total: ₹${inv.totalAmount.toLocaleString('en-IN')} • Paid: ₹${inv.amountPaid.toLocaleString('en-IN')}`}
                value={inv.balanceDue > 0 ? `Due: ₹${inv.balanceDue.toLocaleString('en-IN')}` : 'PAID'}
                valueColor={inv.balanceDue > 0 ? 'warning' : 'success'}
                badge={{
                  label: inv.paymentStatus.toUpperCase(),
                  variant:
                    inv.paymentStatus === 'paid'
                      ? 'success'
                      : inv.paymentStatus === 'partial'
                      ? 'warning'
                      : inv.paymentStatus === 'cancelled'
                      ? 'danger'
                      : 'neutral',
                }}
                showDivider
              />
            ))}
          </Stack>
        </Card>
      </Stack>
    </ScreenContainer>
  );
};

export default DashboardScreen;
