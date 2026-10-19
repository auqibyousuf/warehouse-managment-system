import { useMoney } from '../../hooks/useMoney';
import { openSheet } from '../../navigation/sheets';
import React, { useState } from 'react';
import { theme } from '../../theme';
import { useCustomerPayments } from '../../hooks/api/useSales';
import { useCustomers } from '../../hooks/api/useCustomers';
import { useExpenses } from '../../hooks/api/useExpenses';
import {
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
import { Customer } from '../../types';

type LedgerTab = 'payments' | 'customers' | 'expenses';

export interface LedgerScreenProps {
  /** Which sections to show, in order. The first one opens first. */
  tabs?: LedgerTab[];
}

export const LedgerScreen: React.FC<LedgerScreenProps> = ({
  tabs = ['customers', 'payments', 'expenses'],
}) => {
  const money = useMoney();
  const [activeTab, setActiveTab] = useState<LedgerTab>(tabs[0]);

  const { data: customers = [], isLoading: loadingCustomers } = useCustomers();
  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses();

  const handleCollectPayment = (customer: Customer) => {
    openSheet('record_payment', { customerId: customer.id });
  };

  const {
    data: payments = [],
    isLoading: loadingPayments,
    refetch: refetchPayments,
  } = useCustomerPayments();

  const handleRefresh = async () => {
    await refetchPayments();
  };

  const header = (
    <>
      {tabs.length > 1 && (
        <ChipPicker
          options={tabs.map((id) => ({
            value: id,
            label: id === 'payments' ? 'Payments' : id === 'customers' ? 'Customers' : 'Expenses',
            count:
              id === 'payments'
                ? payments.length
                : id === 'customers'
                  ? customers.length
                  : expenses.length,
          }))}
          selected={activeTab}
          onSelect={(tab) => setActiveTab(tab as LedgerTab)}
        />
      )}
    </>
  );

  const overlays = null;

  if (activeTab === 'customers') {
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
                    Everyone you sell to, with what they owe you.
                  </Typography>
                  <Button
                    label="+ Add Customer"
                    variant="primary"
                    size="sm"
                    leftIcon="person-add-outline"
                    onPress={() => openSheet('create_customer')}
                  />
                </Row>
              </Stack>
            </Stack>
          }
          data={customers}
          keyExtractor={(row) => row.id}
          placeholder={
            loadingCustomers ? (
              <LoadingState message="Loading customers ledger..." />
            ) : customers.length === 0 ? (
              <EmptyState
                title="No Customers Yet"
                description="Register your buyers to track what they owe you."
                actionLabel="+ Add Customer"
                onAction={() => openSheet('create_customer')}
              />
            ) : null
          }
          renderItem={({ item: c }) => (
            <Card
              key={c.id}
              variant="elevated"
              padding="normal"
              onPress={() => {
                openSheet('customer_detail', { customerId: c.id });
              }}
            >
              <Row justify="space-between" align="flex-start">
                <Box flex={1}>
                  <Typography variant="title" weight="bold" color="primary">
                    {c.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="muted"
                    style={{ marginTop: theme.spacing.xxs }}
                  >
                    Phone: {c.phone} • Address: {c.address}
                  </Typography>
                  {c.gstin && (
                    <Typography variant="caption" weight="semibold" color="secondary">
                      GSTIN: {c.gstin}
                    </Typography>
                  )}
                </Box>

                <Box align="flex-end">
                  <Typography
                    variant="bodyLarge"
                    weight="bold"
                    color={c.outstandingBalance > 0 ? 'warning' : 'success'}
                  >
                    {money(c.outstandingBalance)}
                  </Typography>
                  <Badge
                    label={c.outstandingBalance > 0 ? 'DUES PENDING' : 'ALL CLEAR'}
                    variant={c.outstandingBalance > 0 ? 'warning' : 'success'}
                    size="sm"
                  />
                </Box>
              </Row>

              <Divider variant="subtle" spacing="sm" />

              <Row justify="space-between" align="center">
                <Button
                  label="View Ledger"
                  variant="ghost"
                  size="sm"
                  leftIcon="person-outline"
                  onPress={() => {
                    openSheet('customer_detail', { customerId: c.id });
                  }}
                />

                {c.outstandingBalance > 0 && (
                  <Button
                    label="Receive Payment"
                    variant="primary"
                    size="sm"
                    leftIcon="cash-outline"
                    onPress={() => handleCollectPayment(c)}
                  />
                )}
              </Row>
            </Card>
          )}
        />
        {overlays}
      </>
    );
  }

  if (activeTab === 'expenses') {
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
                    Factory utilities, labour wages, delivery fuel, and machine upkeep.
                  </Typography>
                  <Button
                    label="+ Record Expense"
                    variant="primary"
                    size="sm"
                    leftIcon="add-circle-outline"
                    onPress={() => openSheet('create_expense')}
                  />
                </Row>
              </Stack>
            </Stack>
          }
          data={expenses}
          keyExtractor={(row) => row.id}
          placeholder={
            loadingExpenses ? (
              <LoadingState message="Loading factory expenses..." />
            ) : expenses.length === 0 ? (
              <EmptyState
                title="No Expenses Recorded"
                description="Log operating costs to track realistic factory profitability."
                actionLabel="+ Record Expense"
                onAction={() => openSheet('create_expense')}
              />
            ) : null
          }
          renderItem={({ item: e }) => (
            <Card variant="elevated" padding="compact">
              <ListItem
                key={e.id}
                title={e.description}
                subtitle={`Category: ${e.category.toUpperCase()} • Voucher #${e.expenseNumber}`}
                meta={`Date: ${e.date}`}
                value={`${money(e.amount)}`}
                valueColor="error"
                badge={{
                  label: e.category.toUpperCase(),
                  variant:
                    e.category === 'labour'
                      ? 'forest'
                      : e.category === 'electricity'
                        ? 'warning'
                        : 'neutral',
                }}
              />
            </Card>
          )}
        />
        {overlays}
      </>
    );
  }

  if (activeTab === 'payments') {
    return (
      <>
        <ScreenList
          header={
            <Stack gap="lg" style={{ marginBottom: theme.spacing.md }}>
              {header}
              <Stack gap="md">
                {' '}
                <Typography variant="bodySmall" color="secondary">
                  Customer collections ledger and payment receipts.
                </Typography>
              </Stack>
            </Stack>
          }
          data={payments}
          keyExtractor={(row) => row.id}
          placeholder={
            loadingPayments ? (
              <LoadingState message="Loading payment records..." />
            ) : payments.length === 0 ? (
              <EmptyState
                title="No Payments Recorded"
                description="Payments received against invoices will appear here."
                actionLabel="+ Receive Payment"
                onAction={() => openSheet('record_payment')}
              />
            ) : null
          }
          renderItem={({ item: p }) => (
            <Card variant="elevated" padding="compact">
              <ListItem
                key={p.id}
                title={p.customerName}
                subtitle={`Receipt #${p.paymentNumber} • Mode: ${p.paymentMethod.toUpperCase()}`}
                meta={`${p.date} • ${p.notes || 'Payment credited'}`}
                value={`${money(p.amount)}`}
                valueColor="success"
                badge={{
                  label: p.paymentMethod.toUpperCase(),
                  variant: 'forest',
                }}
              />
            </Card>
          )}
          refreshing={false}
          onRefresh={handleRefresh}
        />
        {overlays}
      </>
    );
  }

  return null;
};

export default LedgerScreen;
