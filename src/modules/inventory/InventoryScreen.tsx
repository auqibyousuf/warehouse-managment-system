import React, { useState } from 'react';
import { theme } from '../../theme';
import {
  useInventoryItems,
  useInventoryMovements,
  useSuppliers,
} from '../../hooks/api/useInventory';
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
  ListItem,
  Divider,
  ChipPicker,
  LoadingState,
  EmptyState,
  ScreenList,
} from '../../components';
import { UnifiedStockItem } from '../../services/api/inventoryService';
import { CreateIngredientModal } from './components/CreateIngredientModal';
import { CreateSupplierModal } from './components/CreateSupplierModal';
import { EditIngredientModal } from './components/EditIngredientModal';

type InventoryTab = 'stock' | 'movements' | 'suppliers';
type StockCategoryFilter = 'all' | 'raw_material' | 'packaging' | 'finished_feed';

export const InventoryScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InventoryTab>('stock');
  const [categoryFilter, setCategoryFilter] = useState<StockCategoryFilter>('all');

  const {
    data: stockItems = [],
    isLoading: loadingStock,
    refetch,
    isRefetching,
  } = useInventoryItems();
  const { data: movements = [], isLoading: loadingMovements } = useInventoryMovements();
  const { data: suppliers = [], isLoading: loadingSuppliers } = useSuppliers();
  const { activeModal, openModal, closeModal } = useAppStore();

  const [itemToEdit, setItemToEdit] = useState<UnifiedStockItem | null>(null);

  const filteredItems = stockItems.filter((item) => {
    if (categoryFilter === 'all') return true;
    return item.type === categoryFilter;
  });

  const lowStockCount = stockItems.filter((i) => i.isLowStock).length;

  const header = (
    <>
      {/* Module Header */}
      <Box>
        <Row justify="space-between" align="center">
          <Box>
            <Typography variant="caption" color="muted">
              WAREHOUSE & STOCK LEDGER
            </Typography>
            <Typography variant="h1" weight="bold" color="brandDeep">
              Inventory & Stock
            </Typography>
          </Box>
          <Row gap="xs" wrap>
            <Button
              label="+ Raw Material"
              variant="primary"
              size="sm"
              leftIcon="add-outline"
              onPress={() => openModal('create_ingredient')}
            />
            <Button
              label="+ Supplier"
              variant="subtle"
              size="sm"
              leftIcon="business-outline"
              onPress={() => openModal('create_supplier')}
            />
            <Button
              label="+ Inward Stock"
              variant="subtle"
              size="sm"
              leftIcon="cart-outline"
              onPress={() => openModal('record_purchase')}
            />
            <Button
              label="Adjust"
              variant="subtle"
              size="sm"
              onPress={() => openModal('adjust_stock')}
            />
          </Row>
        </Row>
      </Box>

      {/* View Switcher: Stock Levels vs Movements Audit */}
      <ChipPicker
        options={[
          { value: 'stock', label: 'Current Balances', count: stockItems.length },
          { value: 'movements', label: 'Movement Ledger', count: movements.length },
          { value: 'suppliers', label: 'Suppliers & Vendors', count: suppliers.length },
        ]}
        selected={activeTab}
        onSelect={(tab) => setActiveTab(tab as InventoryTab)}
      />
    </>
  );

  const overlays = (
    <>
      <CreateIngredientModal visible={activeModal === 'create_ingredient'} onClose={closeModal} />

      <CreateSupplierModal visible={activeModal === 'create_supplier'} onClose={closeModal} />

      <EditIngredientModal
        visible={itemToEdit !== null}
        item={itemToEdit}
        onClose={() => setItemToEdit(null)}
      />
    </>
  );

  if (activeTab === 'stock') {
    return (
      <>
        <ScreenList
          header={
            <Stack gap="lg" style={{ marginBottom: theme.spacing.md }}>
              {header}
              <Stack gap="md">
                {' '}
                {/* Category Filter Pills */}
                <ChipPicker
                  options={[
                    { value: 'all', label: 'All Items' },
                    { value: 'raw_material', label: 'Raw Materials' },
                    { value: 'packaging', label: 'Packaging' },
                    { value: 'finished_feed', label: 'Finished Feed' },
                  ]}
                  selected={categoryFilter}
                  onSelect={(cat) => setCategoryFilter(cat as StockCategoryFilter)}
                />
                {lowStockCount > 0 && (
                  <Box bg="amberWash" padding="compact" borderRadius="md">
                    <Row gap="xs" align="center">
                      <Badge label="Warning" variant="warning" dot size="sm" />
                      <Typography variant="bodySmall" weight="semibold" color="warning">
                        {lowStockCount} items below safe operating thresholds
                      </Typography>
                    </Row>
                  </Box>
                )}
              </Stack>
            </Stack>
          }
          data={filteredItems}
          keyExtractor={(row) => row.id}
          placeholder={
            loadingStock ? (
              <LoadingState message="Fetching warehouse stock levels..." />
            ) : filteredItems.length === 0 ? (
              <EmptyState
                title="No Items Found"
                description="No stock items match this category filter."
              />
            ) : null
          }
          renderItem={({ item: item }) => (
            <Card
              key={item.id}
              variant={item.isLowStock ? 'accent' : 'elevated'}
              padding="normal"
              style={
                item.isLowStock
                  ? {
                      backgroundColor: theme.colors.status.warning.bg,
                      borderColor: theme.colors.status.warning.border,
                    }
                  : undefined
              }
            >
              <Row justify="space-between" align="flex-start" gap="sm">
                <Box flex={1} style={{ marginRight: theme.spacing.sm }}>
                  <Badge
                    label={
                      item.type === 'raw_material'
                        ? 'RAW MATERIAL'
                        : item.type === 'packaging'
                          ? 'PACKAGING'
                          : 'FINISHED GOODS'
                    }
                    variant={item.type === 'finished_feed' ? 'forest' : 'neutral'}
                    size="sm"
                    style={{ marginBottom: theme.spacing.xsm, alignSelf: 'flex-start' }}
                  />
                  <Typography variant="title" weight="bold" color="primary" numberOfLines={2}>
                    {item.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="muted"
                    style={{ marginTop: theme.spacing.xxs }}
                  >
                    {item.type === 'finished_feed'
                      ? `Selling Baseline: ₹${item.unitCostOrPrice} / ${item.unit}`
                      : `Current Cost: ₹${item.unitCostOrPrice} / ${item.unit}`}
                  </Typography>
                </Box>

                {/* Stock Value Badge */}
                <Box align="flex-end" style={{ minWidth: 95, flexShrink: 0 }}>
                  <Typography
                    variant="h3"
                    weight="bold"
                    color={item.isLowStock ? 'warning' : 'brandDeep'}
                    tabular
                  >
                    {item.currentStock.toLocaleString('en-IN')} {item.unit}
                  </Typography>
                  <Badge
                    label={item.isLowStock ? 'LOW STOCK' : 'IN STOCK'}
                    variant={item.isLowStock ? 'warning' : 'success'}
                    size="sm"
                    style={{ marginTop: theme.spacing.xs }}
                  />
                </Box>
              </Row>

              <Divider variant="subtle" spacing="sm" />

              <Row justify="space-between" align="center">
                <Typography variant="caption" color="muted">
                  Safety Threshold: {item.minThreshold} {item.unit}
                </Typography>

                <Row gap="xs" align="center">
                  {item.type !== 'finished_feed' && (
                    <Button
                      label="Edit / Delete"
                      variant="ghost"
                      size="sm"
                      leftIcon="create-outline"
                      onPress={() => setItemToEdit(item)}
                    />
                  )}
                  <Button
                    label="Reconcile Count"
                    variant="ghost"
                    size="sm"
                    onPress={() => openModal('adjust_stock')}
                  />
                </Row>
              </Row>
            </Card>
          )}
          refreshing={isRefetching}
          onRefresh={refetch}
        />
        {overlays}
      </>
    );
  }

  if (activeTab === 'movements') {
    return (
      <>
        <ScreenList
          header={
            <Stack gap="lg" style={{ marginBottom: theme.spacing.md }}>
              {header}
              <Stack gap="md">
                {' '}
                <Typography variant="bodySmall" color="secondary">
                  Authoritative stock ledger: every movement references its source transaction.
                </Typography>
              </Stack>
            </Stack>
          }
          data={movements}
          keyExtractor={(row) => row.id}
          placeholder={
            loadingMovements ? (
              <LoadingState message="Loading inventory ledger movements..." />
            ) : movements.length === 0 ? (
              <EmptyState
                title="No Ledger Movements"
                description="Transaction movements will appear here once purchases, production runs, or dispatches occur."
              />
            ) : null
          }
          renderItem={({ item: mov }) => {
            const isIn = mov.direction === 'in';

            return (
              <Card variant="elevated" padding="compact">
                <ListItem
                  key={mov.id}
                  title={`${mov.itemName}`}
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
  }

  if (activeTab === 'suppliers') {
    return (
      <>
        <ScreenList
          header={
            <Stack gap="lg" style={{ marginBottom: theme.spacing.md }}>
              {header}
            </Stack>
          }
          data={suppliers}
          keyExtractor={(row) => row.id}
          placeholder={
            loadingSuppliers ? (
              <LoadingState message="Loading suppliers..." />
            ) : suppliers.length === 0 ? (
              <EmptyState
                title="No Suppliers Registered"
                description="Register raw material and packaging vendors to record incoming stock shipments."
                actionLabel="+ Add First Supplier"
                onAction={() => openModal('create_supplier')}
              />
            ) : null
          }
          renderItem={({ item: sup }) => (
            <Card key={sup.id} variant="elevated" padding="normal">
              <Row justify="space-between" align="center">
                <Box flex={1}>
                  <Typography variant="bodyLarge" weight="bold" color="primary">
                    {sup.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="secondary"
                    style={{ marginTop: theme.spacing.xxs }}
                  >
                    Phone: {sup.phone}
                  </Typography>
                  {sup.gstNumber && (
                    <Typography variant="caption" color="muted">
                      GST: {sup.gstNumber}
                    </Typography>
                  )}
                  {sup.address && (
                    <Typography variant="caption" color="muted">
                      {sup.address}
                    </Typography>
                  )}
                </Box>

                <Box align="flex-end">
                  <Typography variant="caption" color="muted">
                    Payables Outstanding
                  </Typography>
                  <Typography
                    variant="bodyLarge"
                    weight="bold"
                    color={sup.balanceDue > 0 ? 'warning' : 'success'}
                  >
                    ₹{(sup.balanceDue || 0).toLocaleString('en-IN')}
                  </Typography>
                  <Button
                    label="+ Record Bill"
                    variant="subtle"
                    size="sm"
                    leftIcon="cart-outline"
                    style={{ marginTop: theme.spacing.xsm }}
                    onPress={() => openModal('record_purchase')}
                  />
                </Box>
              </Row>
            </Card>
          )}
          refreshing={isRefetching}
          onRefresh={refetch}
        />
        {overlays}
      </>
    );
  }

  return (
    <ScreenContainer refreshing={isRefetching} onRefresh={refetch}>
      <Stack gap="lg">{header}</Stack>
      {overlays}
    </ScreenContainer>
  );
};

export default InventoryScreen;
