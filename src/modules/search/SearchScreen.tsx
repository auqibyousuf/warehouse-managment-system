import React, { useState } from 'react';
import { useMoney } from '../../hooks/useMoney';
import { openSheet } from '../../navigation/sheets';
import { useCustomers } from '../../hooks/api/useCustomers';
import { useInventoryItems, useSuppliers } from '../../hooks/api/useInventory';
import { useSalesInvoices } from '../../hooks/api/useSales';
import { useProductionBatches, useProductionSetups } from '../../hooks/api/useProduction';
import {
  Badge,
  Box,
  Card,
  EmptyState,
  Row,
  ScreenContainer,
  SearchField,
  Stack,
  Typography,
} from '../../components';

const MIN_CHARS = 2;
const matches = (query: string, ...fields: (string | undefined)[]) =>
  fields.some((f) => f?.toLowerCase().includes(query));

interface Hit {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  onPress: () => void;
}

/** One search across customers, invoices, stock items, recipes, batches and suppliers. */
export const SearchScreen: React.FC = () => {
  const money = useMoney();
  const [text, setText] = useState('');
  const query = text.trim().toLowerCase();
  const { data: customers = [] } = useCustomers();
  const { data: items = [] } = useInventoryItems();
  const { data: invoices = [] } = useSalesInvoices();
  const { data: suppliers = [] } = useSuppliers();
  const { data: setups = [] } = useProductionSetups();
  const { data: batches = [] } = useProductionBatches();

  const ready = query.length >= MIN_CHARS;

  const groups: { title: string; hits: Hit[] }[] = ready
    ? [
        {
          title: 'Customers',
          hits: customers
            .filter((c) => matches(query, c.name, c.phone, c.gstin, c.address))
            .map((c) => ({
              id: c.id,
              title: c.name,
              subtitle: c.phone,
              badge: c.outstandingBalance > 0 ? `Owes ${money(c.outstandingBalance)}` : undefined,
              onPress: () => openSheet('customer_detail', { customerId: c.id }),
            })),
        },
        {
          title: 'Invoices',
          hits: invoices
            .filter((i) => matches(query, i.invoiceNumber, i.customerName, i.productName, i.date))
            .map((i) => ({
              id: i.id,
              title: `${i.invoiceNumber} · ${i.customerName}`,
              subtitle: `${i.productName} · ${i.date}`,
              badge: money(i.totalAmount),
              onPress: () => openSheet('invoice_detail', { invoiceId: i.id }),
            })),
        },
        {
          title: 'Stock items',
          hits: items
            .filter((i) => matches(query, i.name))
            .map((i) => ({
              id: i.id,
              title: i.name,
              subtitle: `${i.currentStock.toLocaleString('en-IN')} ${i.unit}`,
              badge: i.isLowStock ? 'Low' : undefined,
              onPress: () => openSheet('stock_detail', { itemId: i.id }),
            })),
        },
        {
          title: 'Recipes',
          hits: setups
            .filter((s) => matches(query, s.name, s.productName))
            .map((s) => ({
              id: s.id,
              title: s.name,
              subtitle: `Makes ${s.productName}`,
              onPress: () => openSheet('recipe_detail', { setupId: s.id }),
            })),
        },
        {
          title: 'Batches',
          hits: batches
            .filter((b) => matches(query, b.batchNumber, b.productName, b.date))
            .map((b) => ({
              id: b.id,
              title: `${b.batchNumber} · ${b.productName}`,
              subtitle: b.date,
              badge: b.status === 'in_progress' ? 'Running' : undefined,
              onPress: () => openSheet('batch_detail', { batchId: b.id }),
            })),
        },
        {
          title: 'Suppliers',
          hits: suppliers
            .filter((s) => matches(query, s.name, s.phone, s.gstNumber))
            .map((s) => ({
              id: s.id,
              title: s.name,
              subtitle: s.phone,
              onPress: () => openSheet('supplier_detail', { supplierId: s.id }),
            })),
        },
      ].filter((g) => g.hits.length > 0)
    : [];

  return (
    <ScreenContainer>
      <Stack gap="md">
        <SearchField
          value={text}
          onChangeText={setText}
          placeholder="Search customers, invoices, stock, recipes"
        />

        {!ready ? (
          <Typography variant="bodySmall" color="secondary">
            Type at least {MIN_CHARS} letters. Try a customer name, an invoice number or an item.
          </Typography>
        ) : groups.length === 0 ? (
          <EmptyState
            title="Nothing found"
            description={`No customer, invoice, item, recipe, batch or supplier matches "${text.trim()}".`}
          />
        ) : (
          groups.map((g) => (
            <Stack key={g.title} gap="xs">
              <Typography variant="label" color="muted">
                {g.title} ({g.hits.length})
              </Typography>
              {g.hits.slice(0, 8).map((h) => (
                <Card key={h.id} variant="elevated" padding="compact" onPress={h.onPress}>
                  <Row justify="space-between" align="center" gap="sm">
                    <Box flex={1}>
                      <Typography variant="title" color="primary" numberOfLines={1}>
                        {h.title}
                      </Typography>
                      <Typography variant="bodySmall" color="secondary" numberOfLines={1}>
                        {h.subtitle}
                      </Typography>
                    </Box>
                    {h.badge ? <Badge label={h.badge} variant="neutral" size="sm" /> : null}
                  </Row>
                </Card>
              ))}
            </Stack>
          ))
        )}
      </Stack>
    </ScreenContainer>
  );
};

export default SearchScreen;
