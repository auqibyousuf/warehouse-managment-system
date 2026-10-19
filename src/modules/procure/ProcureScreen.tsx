import React, { useState } from 'react';
import { openSheet } from '../../navigation/sheets';
import { theme } from '../../theme';
import { useMoney } from '../../hooks/useMoney';
import { usePurchases, useSuppliers } from '../../hooks/api/useInventory';
import {
  Badge,
  Box,
  Button,
  Card,
  ChipPicker,
  EmptyState,
  Icon,
  IconTile,
  LoadingState,
  Row,
  ScreenList,
  Stack,
  Typography,
} from '../../components';

type ProcureTab = 'bills' | 'suppliers';

/** Purchase bills and suppliers. Rows stay short; tap one for everything about it. */
export const ProcureScreen: React.FC = () => {
  const money = useMoney();
  const [activeTab, setActiveTab] = useState<ProcureTab>('bills');
  const { data: purchases = [], isLoading: loadingBills, refetch, isRefetching } = usePurchases();
  const { data: suppliers = [], isLoading: loadingSuppliers } = useSuppliers();
  const payable = suppliers.reduce((sum, s) => sum + (s.balanceDue || 0), 0);

  const header = (
    <Stack gap="md" style={{ marginBottom: theme.spacing.md }}>
      <Row gap="sm" wrap>
        <Button
          label="Purchase Bill"
          variant="primary"
          leftIcon="cart-outline"
          onPress={() => openSheet('record_purchase')}
        />
        <Button
          label="Add Supplier"
          variant="secondary"
          leftIcon="business-outline"
          onPress={() => openSheet('create_supplier')}
        />
      </Row>
      <Card variant="elevated" padding="compact">
        <Row justify="space-between" align="center">
          <Typography variant="bodySmall" color="secondary">
            You owe suppliers
          </Typography>
          <Typography variant="dataLarge" color={payable > 0 ? 'warning' : 'primary'} tabular>
            {money(payable)}
          </Typography>
        </Row>
      </Card>
      <ChipPicker
        variant="segmented"
        options={[
          { value: 'bills', label: 'Bills', count: purchases.length },
          { value: 'suppliers', label: 'Suppliers', count: suppliers.length },
        ]}
        selected={activeTab}
        onSelect={(tab) => setActiveTab(tab as ProcureTab)}
      />
    </Stack>
  );

  if (activeTab === 'bills') {
    return (
      <ScreenList
        header={header}
        data={purchases}
        keyExtractor={(row) => row.id}
        placeholder={
          loadingBills ? (
            <LoadingState message="Loading bills..." />
          ) : purchases.length === 0 ? (
            <EmptyState
              title="No purchase bills"
              description="Record a delivery to keep stock and payables accurate."
              actionLabel="+ Purchase Bill"
              onAction={() => openSheet('record_purchase')}
            />
          ) : null
        }
        renderItem={({ item: bill }) => (
          <Card
            variant="elevated"
            padding="compact"
            onPress={() => openSheet('purchase_detail', { purchaseId: bill.id })}
          >
            <Row gap="sm" align="center">
              <IconTile
                icon="cart-outline"
                tone={bill.balanceDue > 0 ? 'warning' : 'success'}
                size={32}
              />
              <Box flex={1}>
                <Typography variant="title" color="primary" numberOfLines={1}>
                  {bill.supplierName}
                </Typography>
                <Typography variant="bodySmall" color="secondary" numberOfLines={1}>
                  {bill.itemName} • {bill.date}
                </Typography>
              </Box>
              <Box align="flex-end">
                <Typography variant="dataMedium" color="primary" tabular>
                  {money(bill.totalAmount)}
                </Typography>
                <Badge
                  label={bill.balanceDue > 0 ? `Due ${money(bill.balanceDue)}` : 'Paid'}
                  variant={bill.balanceDue > 0 ? 'warning' : 'success'}
                  size="sm"
                />
              </Box>
            </Row>
          </Card>
        )}
        refreshing={isRefetching}
        onRefresh={refetch}
      />
    );
  }

  return (
    <ScreenList
      header={header}
      data={suppliers}
      keyExtractor={(row) => row.id}
      placeholder={
        loadingSuppliers ? (
          <LoadingState message="Loading suppliers..." />
        ) : suppliers.length === 0 ? (
          <EmptyState
            title="No suppliers yet"
            description="Add the vendors you buy raw materials and packaging from."
            actionLabel="+ Add Supplier"
            onAction={() => openSheet('create_supplier')}
          />
        ) : null
      }
      renderItem={({ item: supplier }) => (
        <Card
          variant="elevated"
          padding="compact"
          onPress={() => openSheet('supplier_detail', { supplierId: supplier.id })}
        >
          <Row gap="sm" align="center">
            <IconTile icon="business-outline" tone="primary" size={32} />
            <Box flex={1}>
              <Typography variant="title" color="primary" numberOfLines={1}>
                {supplier.name}
              </Typography>
              <Typography variant="bodySmall" color="secondary" numberOfLines={1}>
                {supplier.phone}
              </Typography>
            </Box>
            {supplier.balanceDue > 0 ? (
              <Typography variant="dataMedium" color="warning" tabular>
                {money(supplier.balanceDue)}
              </Typography>
            ) : (
              <Typography variant="bodySmall" color="success">
                Settled
              </Typography>
            )}
            <Icon name="chevron-forward" size={18} color="subtle" />
          </Row>
        </Card>
      )}
    />
  );
};

export default ProcureScreen;
