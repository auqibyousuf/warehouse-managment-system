import React, { useState } from 'react';
import { openSheet } from '../../navigation/sheets';
import { theme } from '../../theme';
import { useMoney } from '../../hooks/useMoney';
import { useCustomerPayments } from '../../hooks/api/useSales';
import { useCustomers } from '../../hooks/api/useCustomers';
import { useExpenses } from '../../hooks/api/useExpenses';
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

type LedgerTab = 'payments' | 'customers' | 'expenses';

export interface LedgerScreenProps {
  /** Which sections to show, in order. The first one opens first. */
  tabs?: LedgerTab[];
}

const LABEL: Record<LedgerTab, string> = {
  customers: 'Customers',
  payments: 'Payments',
  expenses: 'Expenses',
};

/** Customers, payments received and expenses as short rows; tap for full details. */
export const LedgerScreen: React.FC<LedgerScreenProps> = ({
  tabs = ['customers', 'payments', 'expenses'],
}) => {
  const money = useMoney();
  const [activeTab, setActiveTab] = useState<LedgerTab>(tabs[0]);
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers();
  const {
    data: payments = [],
    isLoading: loadingPayments,
    refetch,
    isRefetching,
  } = useCustomerPayments();
  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses();

  const counts: Record<LedgerTab, number> = {
    customers: customers.length,
    payments: payments.length,
    expenses: expenses.length,
  };

  const action =
    activeTab === 'customers' ? (
      <Button
        label="Add Customer"
        variant="primary"
        leftIcon="person-add-outline"
        onPress={() => openSheet('create_customer')}
      />
    ) : activeTab === 'payments' ? (
      <Button
        label="Receive Payment"
        variant="primary"
        leftIcon="cash-outline"
        onPress={() => openSheet('record_payment')}
      />
    ) : (
      <Button
        label="Record Expense"
        variant="primary"
        leftIcon="add-circle-outline"
        onPress={() => openSheet('create_expense')}
      />
    );

  const header = (
    <Stack gap="md" style={{ marginBottom: theme.spacing.md }}>
      <Row>{action}</Row>
      {tabs.length > 1 && (
        <ChipPicker
          variant="segmented"
          options={tabs.map((id) => ({ value: id, label: LABEL[id], count: counts[id] }))}
          selected={activeTab}
          onSelect={(tab) => setActiveTab(tab as LedgerTab)}
        />
      )}
    </Stack>
  );

  if (activeTab === 'customers') {
    return (
      <ScreenList
        header={header}
        data={customers}
        keyExtractor={(row) => row.id}
        placeholder={
          loadingCustomers ? (
            <LoadingState message="Loading customers..." />
          ) : customers.length === 0 ? (
            <EmptyState
              title="No customers yet"
              description="Add the people and shops you sell to."
              actionLabel="+ Add Customer"
              onAction={() => openSheet('create_customer')}
            />
          ) : null
        }
        renderItem={({ item: customer }) => (
          <Card
            variant="elevated"
            padding="compact"
            onPress={() => openSheet('customer_detail', { customerId: customer.id })}
          >
            <Row gap="sm" align="center">
              <IconTile icon="person-outline" tone="primary" size={32} />
              <Box flex={1}>
                <Typography variant="title" color="primary" numberOfLines={1}>
                  {customer.name}
                </Typography>
                <Typography variant="bodySmall" color="secondary" numberOfLines={1}>
                  {customer.phone}
                </Typography>
              </Box>
              {customer.outstandingBalance > 0 ? (
                <Box align="flex-end">
                  <Typography variant="dataMedium" color="warning" tabular>
                    {money(customer.outstandingBalance)}
                  </Typography>
                  <Typography variant="caption" color="muted">
                    owes you
                  </Typography>
                </Box>
              ) : (
                <Typography variant="bodySmall" color="success">
                  Settled
                </Typography>
              )}
              <Icon name="chevron-forward" size={18} color="subtle" />
            </Row>
          </Card>
        )}
        refreshing={isRefetching}
        onRefresh={refetch}
      />
    );
  }

  if (activeTab === 'payments') {
    return (
      <ScreenList
        header={header}
        data={payments}
        keyExtractor={(row) => row.id}
        placeholder={
          loadingPayments ? (
            <LoadingState message="Loading payments..." />
          ) : payments.length === 0 ? (
            <EmptyState
              title="No payments yet"
              description="Payments you receive against invoices appear here."
              actionLabel="+ Receive Payment"
              onAction={() => openSheet('record_payment')}
            />
          ) : null
        }
        renderItem={({ item: payment }) => (
          <Card variant="elevated" padding="compact">
            <Row gap="sm" align="center">
              <IconTile icon="cash-outline" tone="success" size={32} />
              <Box flex={1}>
                <Typography variant="title" color="primary" numberOfLines={1}>
                  {payment.customerName}
                </Typography>
                <Typography variant="bodySmall" color="secondary" numberOfLines={1}>
                  {payment.date} • {payment.paymentMethod.replace('_', ' ')}
                </Typography>
              </Box>
              <Typography variant="dataMedium" color="success" tabular>
                +{money(payment.amount)}
              </Typography>
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
      data={expenses}
      keyExtractor={(row) => row.id}
      placeholder={
        loadingExpenses ? (
          <LoadingState message="Loading expenses..." />
        ) : expenses.length === 0 ? (
          <EmptyState
            title="No expenses yet"
            description="Log wages, power, fuel and other costs to see real profit."
            actionLabel="+ Record Expense"
            onAction={() => openSheet('create_expense')}
          />
        ) : null
      }
      renderItem={({ item: expense }) => (
        <Card variant="elevated" padding="compact">
          <Row gap="sm" align="center">
            <IconTile icon="wallet-outline" tone="warning" size={32} />
            <Box flex={1}>
              <Typography variant="title" color="primary" numberOfLines={1}>
                {expense.description}
              </Typography>
              <Typography variant="bodySmall" color="secondary" numberOfLines={1}>
                {expense.date}
              </Typography>
            </Box>
            <Box align="flex-end">
              <Typography variant="dataMedium" color="error" tabular>
                −{money(expense.amount)}
              </Typography>
              <Badge label={expense.category} variant="neutral" size="sm" />
            </Box>
          </Row>
        </Card>
      )}
    />
  );
};

export default LedgerScreen;
