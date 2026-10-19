import React, { useMemo, useState } from 'react';
import { openSheet } from '../../navigation/sheets';
import { theme } from '../../theme';
import { useMoney } from '../../hooks/useMoney';
import { useSalesInvoices, useCustomerPayments } from '../../hooks/api/useSales';
import { usePurchases, useSuppliers } from '../../hooks/api/useInventory';
import { useCustomers } from '../../hooks/api/useCustomers';
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
  InsetStats,
} from '../../components';

type View = 'all' | 'receivable' | 'payable';

interface QueueEntry {
  id: string;
  date: string;
  side: 'receivable' | 'payable' | 'payment';
  party: string;
  reference: string;
  amount: number;
  open: number;
  note: string;
  openSheetArgs: {
    name: 'invoice_detail' | 'purchase_detail';
    params: Record<string, string>;
  } | null;
  payArgs: { invoiceId: string; customerId: string } | null;
}

/** Customer and supplier ledgers: what is owed to you, what you owe, and the history behind it. */
export const FinancialLedgerScreen: React.FC = () => {
  const money = useMoney();
  const [view, setView] = useState<View>('all');
  const [query, setQuery] = useState('');

  const { data: invoices = [], isLoading: l1, refetch, isRefetching } = useSalesInvoices();
  const { data: payments = [], isLoading: l2 } = useCustomerPayments();
  const { data: purchases = [], isLoading: l3 } = usePurchases();
  const { data: customers = [] } = useCustomers();
  const { data: suppliers = [] } = useSuppliers();
  const loading = l1 || l2 || l3;

  const receivable = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);
  const payable = suppliers.reduce((sum, s) => sum + (s.balanceDue || 0), 0);
  const openInvoices = invoices.filter(
    (i) => i.paymentStatus !== 'cancelled' && i.balanceDue > 0,
  ).length;
  const openBills = purchases.filter((p) => p.balanceDue > 0).length;
  const net = receivable - payable;

  const entries = useMemo<QueueEntry[]>(() => {
    const list: QueueEntry[] = [
      ...invoices
        .filter((i) => i.paymentStatus !== 'cancelled')
        .map<QueueEntry>((i) => ({
          id: `inv-${i.id}`,
          date: i.date,
          side: 'receivable',
          party: i.customerName,
          reference: i.invoiceNumber,
          amount: i.totalAmount,
          open: i.balanceDue,
          note: i.balanceDue > 0 ? 'Customer owes this' : 'Paid in full',
          openSheetArgs: { name: 'invoice_detail', params: { invoiceId: i.id } },
          payArgs: i.balanceDue > 0 ? { invoiceId: i.id, customerId: i.customerId } : null,
        })),
      ...purchases.map<QueueEntry>((p) => ({
        id: `pur-${p.id}`,
        date: p.date,
        side: 'payable',
        party: p.supplierName,
        reference: p.purchaseNumber,
        amount: p.totalAmount,
        open: p.balanceDue,
        note: p.balanceDue > 0 ? 'You owe this' : 'Paid in full',
        openSheetArgs: { name: 'purchase_detail', params: { purchaseId: p.id } },
        payArgs: null,
      })),
      ...payments.map<QueueEntry>((p) => ({
        id: `pay-${p.id}`,
        date: p.date,
        side: 'payment',
        party: p.customerName,
        reference: p.paymentNumber,
        amount: p.amount,
        open: 0,
        note: `Received by ${p.paymentMethod.replace('_', ' ')}`,
        openSheetArgs: null,
        payArgs: null,
      })),
    ];
    return list.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [invoices, purchases, payments]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries.filter(
      (e) =>
        (view === 'all' ||
          (view === 'receivable' && e.side !== 'payable') ||
          (view === 'payable' && e.side === 'payable')) &&
        (!needle ||
          e.party.toLowerCase().includes(needle) ||
          e.reference.toLowerCase().includes(needle)),
    );
  }, [entries, view, query]);

  const header = (
    <Stack gap="lg" style={{ marginBottom: theme.spacing.md }}>
      <ChipPicker
        options={[
          { value: 'all', label: 'All' },
          { value: 'receivable', label: 'Customers' },
          { value: 'payable', label: 'Suppliers' },
        ]}
        selected={view}
        onSelect={(value) => setView(value as View)}
      />

      <Card variant="elevated" padding="normal">
        <Stack gap="md">
          <InsetStats
            stats={[
              {
                label: 'Customers owe you',
                value: money(receivable),
                valueColor: 'info',
              },
              {
                label: 'You owe suppliers',
                value: money(payable),
                valueColor: payable > 0 ? 'warning' : 'primary',
              },
            ]}
          />
          <Row justify="space-between" align="center">
            <Box>
              <Typography variant="label" color="muted">
                Net position
              </Typography>
              <Typography variant="h3" color={net >= 0 ? 'success' : 'error'} tabular>
                {net >= 0 ? '+' : '−'}
                {money(Math.abs(net))}
              </Typography>
            </Box>
            <Typography variant="caption" color="muted">
              {openInvoices} open invoice{openInvoices === 1 ? '' : 's'} • {openBills} open bill
              {openBills === 1 ? '' : 's'}
            </Typography>
          </Row>
        </Stack>
      </Card>

      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder="Search name or document number"
      />

      <Typography variant="label" color="muted">
        Transactions ({visible.length})
      </Typography>
    </Stack>
  );

  return (
    <ScreenList
      header={header}
      data={visible}
      keyExtractor={(row) => row.id}
      placeholder={
        loading ? (
          <LoadingState message="Loading ledger..." />
        ) : visible.length === 0 ? (
          <EmptyState
            title="No transactions"
            description="Invoices, purchase bills and payments appear here."
          />
        ) : null
      }
      renderItem={({ item }) => {
        const isPayment = item.side === 'payment';
        const isPayable = item.side === 'payable';
        const sign = isPayable ? '−' : '+';
        return (
          <Card variant="elevated" padding="normal">
            <Stack gap="md">
              <Row justify="space-between" align="flex-start" gap="sm">
                <Box flex={1}>
                  <Row gap="xs" align="center" wrap>
                    <Badge
                      label={isPayment ? 'Payment in' : isPayable ? 'Supplier bill' : 'Invoice'}
                      variant={isPayment ? 'success' : isPayable ? 'warning' : 'info'}
                      size="sm"
                    />
                    <Typography variant="caption" color="muted">
                      {item.reference} • {item.date}
                    </Typography>
                  </Row>
                  <Typography
                    variant="title"
                    color="primary"
                    numberOfLines={2}
                    style={{ marginTop: 4 }}
                  >
                    {item.party}
                  </Typography>
                </Box>
                <Box align="flex-end">
                  <Typography variant="dataLarge" color={isPayable ? 'warning' : 'success'} tabular>
                    {sign}
                    {money(item.amount)}
                  </Typography>
                  {item.open > 0 && (
                    <Typography variant="caption" color="muted">
                      Open {money(item.open)}
                    </Typography>
                  )}
                </Box>
              </Row>

              <Typography variant="caption" color={item.open > 0 ? 'warning' : 'success'}>
                {item.note}
              </Typography>

              {(item.openSheetArgs || item.payArgs) && (
                <Row gap="sm" wrap>
                  {item.openSheetArgs && (
                    <Button
                      label={isPayable ? 'View Bill' : 'View Invoice'}
                      variant="secondary"
                      size="sm"
                      leftIcon="document-text-outline"
                      onPress={() =>
                        openSheet(item.openSheetArgs!.name, item.openSheetArgs!.params)
                      }
                    />
                  )}
                  {item.payArgs && (
                    <Button
                      label="Record Payment"
                      variant="primary"
                      size="sm"
                      leftIcon="cash-outline"
                      onPress={() => openSheet('record_payment', item.payArgs!)}
                    />
                  )}
                </Row>
              )}
            </Stack>
          </Card>
        );
      }}
      refreshing={isRefetching}
      onRefresh={refetch}
    />
  );
};

export default FinancialLedgerScreen;
