import React from 'react';
import { openSheet } from '../../navigation/sheets';
import { theme } from '../../theme';
import { usePurchases, useSuppliers } from '../../hooks/api/useInventory';
import {
  Box,
  Button,
  Card,
  ChipPicker,
  EmptyState,
  LoadingState,
  Row,
  ScreenList,
  InsetStats,
  Stack,
  Typography,
  Badge,
  Divider,
} from '../../components';
import { Purchase } from '../../types';

type ProcureTab = 'bills' | 'suppliers';

export const ProcureScreen: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<ProcureTab>('bills');

  const {
    data: purchases = [],
    isLoading: loadingPurchases,
    refetch: refetchPurchases,
    isRefetching,
  } = usePurchases();
  const { data: suppliers = [], isLoading: loadingSuppliers } = useSuppliers();

  const handleOpenPurchaseDetail = (purchase: Purchase) => {
    openSheet('purchase_detail', { purchaseId: purchase.id });
  };

  const totalPayable = suppliers.reduce((sum, s) => sum + (s.balanceDue || 0), 0);

  const header = (
    <>
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

      <InsetStats
        stats={[
          {
            label: 'Payables',
            value: `₹${totalPayable.toLocaleString('en-IN')}`,
            valueColor: totalPayable > 0 ? 'warning' : 'primary',
          },
          { label: 'Suppliers', value: String(suppliers.length) },
          { label: 'Bills', value: String(purchases.length) },
        ]}
      />

      <ChipPicker
        options={[
          { value: 'bills', label: 'Purchase Bills', count: purchases.length },
          { value: 'suppliers', label: 'Suppliers', count: suppliers.length },
        ]}
        selected={activeTab}
        onSelect={(tab) => setActiveTab(tab as ProcureTab)}
      />
    </>
  );

  if (activeTab === 'bills') {
    return (
      <>
        <ScreenList
          header={
            <Stack gap="lg" style={{ marginBottom: theme.spacing.md }}>
              {header}
              <Stack gap="md">
                {' '}
                <Row justify="space-between" align="center">
                  <Typography variant="bodySmall" color="secondary">
                    Raw material inward bills and supplier payables.
                  </Typography>
                  <Button
                    label="+ Record Purchase"
                    variant="primary"
                    size="sm"
                    leftIcon="cart-outline"
                    onPress={() => openSheet('record_purchase')}
                  />
                </Row>
              </Stack>
            </Stack>
          }
          data={purchases}
          keyExtractor={(row) => row.id}
          placeholder={
            loadingPurchases ? (
              <LoadingState message="Loading inward purchases..." />
            ) : purchases.length === 0 ? (
              <EmptyState
                title="No Purchase Bills"
                description="Log inward raw materials and packaging deliveries to maintain accurate inventory."
                actionLabel="+ Record Purchase Bill"
                onAction={() => openSheet('record_purchase')}
              />
            ) : null
          }
          renderItem={({ item: pur }) => (
            <Card
              key={pur.id}
              variant="elevated"
              padding="normal"
              onPress={() => handleOpenPurchaseDetail(pur)}
            >
              <Row justify="space-between" align="flex-start" gap="sm">
                <Box flex={1}>
                  <Row gap="xs" align="center" wrap>
                    <Typography variant="title" weight="bold" color="primary">
                      {pur.purchaseNumber}
                    </Typography>
                    <Badge
                      label={pur.paymentStatus.toUpperCase()}
                      variant={
                        pur.paymentStatus === 'paid'
                          ? 'success'
                          : pur.paymentStatus === 'partial'
                            ? 'warning'
                            : 'danger'
                      }
                      size="sm"
                    />
                  </Row>
                  <Typography
                    variant="bodyMedium"
                    weight="semibold"
                    color="secondary"
                    style={{ marginTop: theme.spacing.xxs }}
                  >
                    {pur.supplierName}
                  </Typography>
                  <Typography variant="caption" color="muted">
                    Inward Date: {pur.date} • {pur.quantity.toLocaleString('en-IN')} {pur.unit} of{' '}
                    {pur.itemName}
                  </Typography>
                  {pur.billNumber && (
                    <Typography variant="caption" weight="semibold" color="primary">
                      Supplier Bill #{pur.billNumber}
                    </Typography>
                  )}
                </Box>

                <Box align="flex-end" style={{ minWidth: 90, flexShrink: 0 }}>
                  <Typography variant="bodyLarge" weight="bold" color="brandDeep">
                    ₹{pur.totalAmount.toLocaleString('en-IN')}
                  </Typography>
                  {pur.balanceDue > 0 && (
                    <Typography variant="caption" weight="semibold" color="warning">
                      Payable: ₹{pur.balanceDue.toLocaleString('en-IN')}
                    </Typography>
                  )}
                </Box>
              </Row>

              <Divider variant="subtle" spacing="sm" />

              <Row justify="space-between" align="center">
                <Typography variant="caption" color="secondary">
                  Paid: ₹{pur.amountPaid.toLocaleString('en-IN')}
                </Typography>
                <Button
                  label="View Voucher & PDF"
                  variant="ghost"
                  size="sm"
                  leftIcon="document-text-outline"
                  onPress={() => handleOpenPurchaseDetail(pur)}
                />
              </Row>
            </Card>
          )}
          refreshing={isRefetching}
          onRefresh={refetchPurchases}
        />
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
                onAction={() => openSheet('create_supplier')}
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
                    label="Edit"
                    variant="ghost"
                    size="sm"
                    leftIcon="create-outline"
                    onPress={() => openSheet('edit_supplier', { supplierId: sup.id })}
                  />
                  <Button
                    label="+ Record Bill"
                    variant="subtle"
                    size="sm"
                    leftIcon="cart-outline"
                    style={{ marginTop: theme.spacing.xsm }}
                    onPress={() => openSheet('record_purchase')}
                  />
                </Box>
              </Row>
            </Card>
          )}
          refreshing={isRefetching}
          onRefresh={refetchPurchases}
        />
      </>
    );
  }

  return null;
};

export default ProcureScreen;
