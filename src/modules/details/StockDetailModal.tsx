import React, { useMemo } from 'react';
import { openSheet } from '../../navigation/sheets';
import { useMoney } from '../../hooks/useMoney';
import { useInventoryItems, useInventoryMovements } from '../../hooks/api/useInventory';
import {
  Badge,
  Box,
  Card,
  Button,
  InsetStats,
  Modal,
  ProgressBar,
  Row,
  Stack,
  Typography,
} from '../../components';
import { useColors } from '../../theme';

export interface StockDetailModalProps {
  visible: boolean;
  onClose: () => void;
  itemId: string | null;
}

const KIND: Record<string, string> = {
  raw_material: 'Raw material',
  packaging: 'Packaging',
  finished_feed: 'Production item',
};

/** Full picture of one stock item: level, value, recent movements, and every action. */
export const StockDetailModal: React.FC<StockDetailModalProps> = ({ visible, onClose, itemId }) => {
  const money = useMoney();
  const colors = useColors();
  const { data: items = [] } = useInventoryItems();
  const { data: movements = [] } = useInventoryMovements();

  const item = items.find((i) => i.id === itemId);
  const recent = useMemo(
    () => movements.filter((m) => m.itemId === itemId).slice(0, 6),
    [movements, itemId],
  );
  if (!item) return null;

  const isFinished = item.type === 'finished_feed';
  const fill = item.minThreshold > 0 ? item.currentStock / (item.minThreshold * 2) : 1;
  const go = (fn: () => void) => {
    onClose();
    fn();
  };

  return (
    <>
      <Modal
        visible={visible}
        onClose={onClose}
        title={item.name}
        subtitle={KIND[item.type]}
        secondaryAction={{ label: 'Close', onPress: onClose }}
        primaryAction={
          isFinished
            ? { label: 'Create Invoice', onPress: () => go(() => openSheet('create_sale')) }
            : {
                label: item.isLowStock ? 'Reorder' : 'Add Stock',
                onPress: () => go(() => openSheet('record_purchase', { itemId: item.id })),
              }
        }
      >
        <Stack gap="md">
          <Row justify="space-between" align="center">
            <Badge
              label={item.isLowStock ? 'Low stock' : 'In stock'}
              variant={item.isLowStock ? 'danger' : 'success'}
              size="sm"
              soft
            />
          </Row>

          <InsetStats
            stats={[
              {
                label: 'Available',
                value: `${item.currentStock.toLocaleString('en-IN')} ${item.unit}`,
                valueColor: item.isLowStock ? 'warning' : 'primary',
              },
              {
                label: isFinished ? 'Retail value' : 'Stock value',
                value: money(item.currentStock * item.unitCostOrPrice),
              },
            ]}
          />

          <Box>
            <ProgressBar
              value={fill}
              color={item.isLowStock ? colors.accent.error : colors.brand.medium}
              height={10}
              accessibilityLabel="Stock level against safety minimum"
            />
            <Row justify="space-between" style={{ marginTop: 6 }}>
              <Typography variant="caption" color="muted">
                Safety minimum {item.minThreshold.toLocaleString('en-IN')} {item.unit}
              </Typography>
              <Typography variant="caption" color="muted">
                {isFinished ? 'Retail' : 'Cost'} {money(item.unitCostOrPrice)} / {item.unit}
              </Typography>
            </Row>
          </Box>

          {isFinished && (
            <Card variant="flat" padding="compact">
              <Row justify="space-between" align="center" gap="sm">
                <Box flex={1}>
                  <Typography variant="label" color="muted">
                    Selling price
                  </Typography>
                  <Typography
                    variant="title"
                    color={item.unitCostOrPrice > 0 ? 'primary' : 'muted'}
                  >
                    {item.unitCostOrPrice > 0
                      ? `${money(item.unitCostOrPrice)} per ${item.unit}`
                      : 'Not set'}
                  </Typography>
                </Box>
                <Button
                  label={item.unitCostOrPrice > 0 ? 'Change price' : 'Add selling price'}
                  variant={item.unitCostOrPrice > 0 ? 'subtle' : 'primary'}
                  size="sm"
                  leftIcon="pricetag-outline"
                  onPress={() => go(() => openSheet('set_price', { productId: item.id }))}
                />
              </Row>
            </Card>
          )}

          <Row gap="sm" wrap>
            {!isFinished && (
              <Button
                label="Use"
                variant="tonalWarning"
                size="sm"
                leftIcon="remove"
                onPress={() => go(() => openSheet('use_stock', { itemId: item.id }))}
              />
            )}
            <Button
              label="Count / Adjust"
              variant="subtle"
              size="sm"
              leftIcon="swap-vertical-outline"
              onPress={() => go(() => openSheet('adjust_stock'))}
            />
            <Button
              label="Edit"
              variant="subtle"
              size="sm"
              leftIcon="create-outline"
              onPress={() =>
                isFinished
                  ? go(() => openSheet('edit_product', { productId: item.id }))
                  : go(() => openSheet('edit_ingredient', { itemId: item.id }))
              }
            />
          </Row>

          <Box>
            <Typography variant="label" color="muted" style={{ marginBottom: 8 }}>
              Recent movements
            </Typography>
            {recent.length === 0 ? (
              <Typography variant="bodySmall" color="secondary">
                Nothing recorded yet.
              </Typography>
            ) : (
              <Stack gap="xs">
                {recent.map((m) => (
                  <Row key={m.id} justify="space-between" align="center">
                    <Box flex={1}>
                      <Typography variant="bodyMedium" color="primary" numberOfLines={1}>
                        {m.notes || m.movementType.replace(/_/g, ' ')}
                      </Typography>
                      <Typography variant="caption" color="muted">
                        {m.date}
                      </Typography>
                    </Box>
                    <Typography
                      variant="dataMedium"
                      color={m.direction === 'in' ? 'success' : 'primary'}
                      tabular
                    >
                      {m.direction === 'in' ? '+' : '−'}
                      {m.quantity} {m.unit}
                    </Typography>
                  </Row>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </Modal>
    </>
  );
};

export default StockDetailModal;
