import React from 'react';
import { theme } from '../../theme';
import { useInventoryMovements } from '../../hooks/api/useInventory';
import {
  Card,
  EmptyState,
  ListItem,
  LoadingState,
  ScreenList,
  Stack,
  Typography,
} from '../../components';

const BADGE: Record<
  string,
  { label: string; variant: 'success' | 'danger' | 'neutral' | 'warning' }
> = {
  purchase: { label: 'DELIVERY', variant: 'success' },
  finished_production: { label: 'PRODUCED', variant: 'success' },
  production_consumption: { label: 'BATCH USE', variant: 'neutral' },
  sale_dispatch: { label: 'SOLD', variant: 'neutral' },
  stock_usage: { label: 'USED', variant: 'warning' },
  stock_waste: { label: 'WASTE', variant: 'danger' },
  adjustment: { label: 'COUNT', variant: 'neutral' },
  reversal: { label: 'REVERSAL', variant: 'danger' },
};

/** Every change to stock, newest first, with the transaction behind it. */
export const MovementsScreen: React.FC = () => {
  const { data: movements = [], isLoading, refetch, isRefetching } = useInventoryMovements();

  return (
    <ScreenList
      header={
        <Stack gap="sm" style={{ marginBottom: theme.spacing.md }}>
          <Typography variant="bodySmall" color="secondary">
            Every movement references the transaction that caused it.
          </Typography>
        </Stack>
      }
      data={movements}
      keyExtractor={(row) => row.id}
      placeholder={
        isLoading ? (
          <LoadingState message="Loading movements..." />
        ) : movements.length === 0 ? (
          <EmptyState
            title="No movements yet"
            description="Deliveries, batches, sales and usage appear here."
          />
        ) : null
      }
      renderItem={({ item: mov }) => {
        const isIn = mov.direction === 'in';
        const badge = BADGE[mov.movementType] ?? {
          label: mov.movementType.replace(/_/g, ' ').toUpperCase(),
          variant: 'neutral' as const,
        };
        return (
          <Card variant="elevated" padding="compact">
            <ListItem
              title={mov.itemName}
              subtitle={`Ref: ${mov.referenceType.toUpperCase()} #${mov.referenceId}`}
              meta={`${mov.date} • ${mov.notes || ''}`}
              value={`${isIn ? '+' : '-'}${mov.quantity} ${mov.unit}`}
              valueColor={isIn ? 'success' : 'primary'}
              badge={badge}
            />
          </Card>
        );
      }}
      refreshing={isRefetching}
      onRefresh={refetch}
    />
  );
};

export default MovementsScreen;
