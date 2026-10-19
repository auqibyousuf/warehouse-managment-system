import React from 'react';
import { openSheet } from '../../navigation/sheets';
import { useMoney } from '../../hooks/useMoney';
import { usePurchases, useSuppliers } from '../../hooks/api/useInventory';
import { Badge, Box, Button, InsetStats, Modal, Row, Stack, Typography } from '../../components';
import { Pressable } from 'react-native';

export interface SupplierDetailModalProps {
  visible: boolean;
  onClose: () => void;
  supplierId: string | null;
}

/** One supplier: contact, what is owed, and their bills. */
export const SupplierDetailModal: React.FC<SupplierDetailModalProps> = ({
  visible,
  onClose,
  supplierId,
}) => {
  const money = useMoney();
  const { data: suppliers = [] } = useSuppliers();
  const { data: purchases = [] } = usePurchases();
  const supplier = suppliers.find((s) => s.id === supplierId);
  if (!supplier) return null;

  const bills = purchases.filter((p) => p.supplierId === supplier.id);
  const go = (fn: () => void) => {
    onClose();
    fn();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={supplier.name}
      subtitle={supplier.phone}
      secondaryAction={{ label: 'Close', onPress: onClose }}
      primaryAction={{
        label: 'Record Bill',
        onPress: () => go(() => openSheet('record_purchase')),
      }}
    >
      <Stack gap="md">
        <InsetStats
          stats={[
            {
              label: 'You owe',
              value: money(supplier.balanceDue || 0),
              valueColor: supplier.balanceDue > 0 ? 'warning' : 'primary',
            },
            { label: 'Bills', value: String(bills.length) },
          ]}
        />

        {(supplier.address || supplier.gstNumber) && (
          <Stack gap="xxs">
            {supplier.address ? (
              <Typography variant="bodySmall" color="secondary">
                {supplier.address}
              </Typography>
            ) : null}
            {supplier.gstNumber ? (
              <Typography variant="caption" color="muted">
                GST {supplier.gstNumber}
              </Typography>
            ) : null}
          </Stack>
        )}

        <Button
          label="Edit supplier"
          variant="subtle"
          size="sm"
          leftIcon="create-outline"
          onPress={() => go(() => openSheet('edit_supplier', { supplierId: supplier.id }))}
        />

        <Box>
          <Typography variant="label" color="muted" style={{ marginBottom: 8 }}>
            Bills
          </Typography>
          {bills.length === 0 ? (
            <Typography variant="bodySmall" color="secondary">
              No bills recorded for this supplier.
            </Typography>
          ) : (
            <Stack gap="sm">
              {bills.map((bill) => (
                <Pressable
                  key={bill.id}
                  onPress={() => go(() => openSheet('purchase_detail', { purchaseId: bill.id }))}
                  accessibilityRole="button"
                  accessibilityLabel={`Open bill ${bill.purchaseNumber}`}
                >
                  <Row justify="space-between" align="center">
                    <Box flex={1}>
                      <Typography variant="bodyMedium" color="primary" numberOfLines={1}>
                        {bill.purchaseNumber} • {bill.itemName}
                      </Typography>
                      <Typography variant="caption" color="muted">
                        {bill.date}
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
                </Pressable>
              ))}
            </Stack>
          )}
        </Box>
      </Stack>
    </Modal>
  );
};

export default SupplierDetailModal;
