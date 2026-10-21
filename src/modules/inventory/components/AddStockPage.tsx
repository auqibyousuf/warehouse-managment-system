import React, { useMemo, useState } from 'react';
import { theme, useColors } from '../../../theme';
import { useMoney, useCurrencySymbol } from '../../../hooks/useMoney';
import { useIngredients, useSuppliers, useRecordPurchase } from '../../../hooks/api/useInventory';
import { useAppStore } from '../../../stores/useAppStore';
import {
  Badge,
  Box,
  Button,
  ChipPicker,
  FlowHeaderCard,
  FlowPage,
  FlowSection,
  PriceBasisInput,
  QuantityStepper,
  Row,
  SelectedCard,
  Stack,
  TextInput,
  Typography,
} from '../../../components';
import { CreateSupplierModal } from './CreateSupplierModal';
import { CreateIngredientModal } from './CreateIngredientModal';

export interface AddStockPageProps {
  onClose: () => void;
  preselectedItemId?: string | null;
}

const today = () => new Date().toISOString().split('T')[0];

/** Step size that feels right for the current stock scale (1, 10 or 100). */
const stepFor = (stock: number) => (stock >= 1000 ? 100 : stock >= 100 ? 10 : 1);

/** Add Stock: record a delivery against a supplier. Full-page flow from the Stitch Lite design. */
export const AddStockPage: React.FC<AddStockPageProps> = ({ onClose, preselectedItemId }) => {
  const money = useMoney();
  const symbol = useCurrencySymbol();
  const colors = useColors();
  const { data: ingredients = [] } = useIngredients();
  const { data: suppliers = [] } = useSuppliers();
  const recordPurchase = useRecordPurchase();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const [itemId, setItemId] = useState<string>(preselectedItemId ?? '');
  const [supplierId, setSupplierId] = useState<string>('');
  const [quantity, setQuantity] = useState(0);
  const [unitPrice, setUnitPrice] = useState<string | null>(null);
  const [amountPaid, setAmountPaid] = useState('0');
  const [billNumber, setBillNumber] = useState('');
  const [date, setDate] = useState(today());
  const [picking, setPicking] = useState(!preselectedItemId);
  const [newSupplier, setNewSupplier] = useState(false);
  const [newMaterial, setNewMaterial] = useState(false);
  const [error, setError] = useState('');

  const item = ingredients.find((i) => i.id === itemId);
  const supplier =
    suppliers.find((s) => s.id === supplierId) ??
    (suppliers.length === 1 ? suppliers[0] : undefined);
  const price = unitPrice !== null ? Number(unitPrice) : (item?.unitCost ?? 0);
  const paid = Number(amountPaid) || 0;
  const total = quantity * price;
  const balanceDue = Math.max(0, total - paid);
  const projected = (item?.currentStock ?? 0) + quantity;
  const healthy = item ? projected > item.minThreshold : true;

  const step = useMemo(() => stepFor(item?.currentStock ?? 0), [item]);

  const submit = async () => {
    if (!item) return setError('Choose the material you received');
    if (!supplier) return setError('Choose the supplier');
    if (!(quantity > 0)) return setError('Enter the quantity received');
    if (!(price > 0)) return setError('Enter the unit cost');
    if (paid < 0 || paid > total)
      return setError('Amount paid must be between 0 and the bill total');
    try {
      await recordPurchase.mutateAsync({
        supplierId: supplier.id,
        itemId: item.id,
        quantity,
        unitPrice: price,
        amountPaid: paid,
        date,
        billNumber: billNumber.trim() || undefined,
      });
      setBannerAlert({
        title: 'Stock added',
        message: `${quantity} ${item.unit} of ${item.name} received. ${balanceDue > 0 ? `Due to supplier: ${money(balanceDue)}.` : 'Paid in full.'}`,
        variant: 'success',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not record this delivery');
    }
  };

  return (
    <FlowPage title="Add Stock" onClose={onClose}>
      <FlowHeaderCard
        icon="download-outline"
        tone="success"
        title="Add inward stock"
        description="Record a delivery or raw material receipt"
      />

      <FlowSection
        label="Material selection"
        action={{
          label: picking ? 'Done' : 'Change item',
          icon: 'swap-horizontal',
          onPress: () => setPicking((v) => !v),
        }}
      >
        {item ? (
          <SelectedCard
            icon="cube-outline"
            title={item.name}
            subtitle={`Current: ${item.currentStock.toLocaleString('en-IN')} ${item.unit} • ${money(item.unitCost)} / ${item.unit}`}
          />
        ) : (
          <Typography variant="bodySmall" color="secondary">
            Pick the material or packaging that arrived.
          </Typography>
        )}
        {picking && (
          <Stack gap="xs">
            <ChipPicker
              options={ingredients.map((i) => ({ value: i.id, label: i.name }))}
              selected={itemId}
              onSelect={(value) => {
                setItemId(String(value));
                setUnitPrice(null);
                setPicking(false);
                setError('');
              }}
            />
            <Row>
              <Button
                label="New material"
                variant="subtle"
                size="sm"
                leftIcon="add"
                onPress={() => setNewMaterial(true)}
              />
            </Row>
          </Stack>
        )}
      </FlowSection>

      <FlowSection label="Quantity received" hint={item ? `in ${item.unit}` : undefined}>
        <QuantityStepper
          value={quantity}
          onChange={(v) => {
            setQuantity(v);
            setError('');
          }}
          unit={item?.unit}
          step={step}
        />
      </FlowSection>

      <FlowSection label="Cost & payment">
        <PriceBasisInput
          key={item?.id ?? 'none'}
          label="Price on the bill"
          unit={item?.unit ?? 'unit'}
          initialPerUnit={String(item?.unitCost ?? '')}
          onChangePerUnit={setUnitPrice}
        />
        <Row gap="md" align="flex-start">
          <Box flex={1}>
            <TextInput
              label="Paid now"
              value={amountPaid}
              onChangeText={setAmountPaid}
              keyboardType="decimal-pad"
              prefix={symbol}
            />
          </Box>
        </Row>
        <Row justify="space-between">
          <Typography variant="bodySmall" color="secondary">
            Bill total {money(total)}
          </Typography>
          <Typography variant="bodySmall" color={balanceDue > 0 ? 'warning' : 'success'}>
            {balanceDue > 0 ? `You owe ${money(balanceDue)}` : 'Paid in full'}
          </Typography>
        </Row>
      </FlowSection>

      <FlowSection
        label="Delivery details"
        action={{
          label: 'New supplier',
          icon: 'add-circle-outline',
          onPress: () => setNewSupplier(true),
        }}
      >
        <Typography variant="bodySmall" color="secondary">
          Supplier
        </Typography>
        {suppliers.length === 0 ? (
          <Typography variant="bodySmall" color="warning">
            Add a supplier first, then record the delivery.
          </Typography>
        ) : (
          <ChipPicker
            options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
            selected={supplier?.id ?? ''}
            onSelect={(value) => {
              setSupplierId(String(value));
              setError('');
            }}
          />
        )}
        <Row gap="md" align="flex-start">
          <Box flex={1}>
            <TextInput
              label="PO / bill ref"
              value={billNumber}
              onChangeText={setBillNumber}
              placeholder="Optional"
            />
          </Box>
          <Box flex={1}>
            <TextInput label="Date" value={date} onChangeText={setDate} />
          </Box>
        </Row>
      </FlowSection>

      {item && quantity > 0 && (
        <Box
          style={{
            padding: theme.spacing.base,
            borderRadius: theme.radii.md,
            backgroundColor: colors.accent.success,
            gap: theme.spacing.xs,
          }}
        >
          <Typography variant="label" style={{ color: colors.onAccent.success }}>
            Projected stock level
          </Typography>
          <Row gap="sm" align="center">
            <Typography variant="h1" style={{ color: colors.onAccent.success }} tabular>
              {projected.toLocaleString('en-IN')} {item.unit}
            </Typography>
            <Badge
              label={healthy ? 'Healthy level' : 'Still below minimum'}
              variant={healthy ? 'success' : 'warning'}
              size="sm"
            />
          </Row>
          <Typography variant="bodySmall" style={{ color: colors.onAccent.success }}>
            {item.currentStock.toLocaleString('en-IN')} {item.unit} current +{' '}
            {quantity.toLocaleString('en-IN')} {item.unit} intake
          </Typography>
        </Box>
      )}

      {error ? (
        <Typography variant="bodySmall" color="error">
          {error}
        </Typography>
      ) : null}

      <Stack gap="xs">
        <Button
          label="Confirm & Add Stock"
          variant="success"
          size="lg"
          leftIcon="checkmark-circle-outline"
          fullWidth
          loading={recordPurchase.isPending}
          onPress={submit}
        />
        <Button label="Cancel" variant="ghost" fullWidth onPress={onClose} />
      </Stack>

      <CreateSupplierModal
        visible={newSupplier}
        onClose={() => setNewSupplier(false)}
        onCreated={(created) => setSupplierId(created.id)}
      />
      <CreateIngredientModal
        visible={newMaterial}
        onClose={() => setNewMaterial(false)}
        onCreated={(created) => {
          setItemId(created.id);
          setUnitPrice(null);
          setPicking(false);
        }}
      />
    </FlowPage>
  );
};

export default AddStockPage;
