import React, { useState } from 'react';
import { useCurrencySymbol, useMoney } from '../../../hooks/useMoney';
import { useProducts, useUpdateProduct } from '../../../hooks/api/useInventory';
import { useProductionBatches } from '../../../hooks/api/useProduction';
import { useAppStore } from '../../../stores/useAppStore';
import {
  Badge,
  Button,
  FlowHeaderCard,
  FlowPage,
  FlowSection,
  Row,
  Stack,
  TextInput,
  Typography,
} from '../../../components';

export interface SetSellingPricePageProps {
  onClose: () => void;
  productId?: string | null;
}

/** Selling price of a production item. The only place a price is set, so batches can show profit. */
export const SetSellingPricePage: React.FC<SetSellingPricePageProps> = ({ onClose, productId }) => {
  const money = useMoney();
  const symbol = useCurrencySymbol();
  const { data: products = [] } = useProducts();
  const { data: batches = [] } = useProductionBatches();
  const update = useUpdateProduct();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);
  const product = products.find((p) => p.id === productId);

  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [seededFor, setSeededFor] = useState<string | null>(null);

  if (product && seededFor !== product.id) {
    setSeededFor(product.id);
    const current = product.sellingPricePerUnit ?? product.sellingPricePerBag ?? 0;
    setPrice(current > 0 ? String(current) : '');
  }

  if (!product) return null;

  const unit = product.outputUnit || 'unit';
  const value = Number(price) || 0;
  // What the latest finished batch of this item cost per pack, for a quick margin check.
  const last = batches.find(
    (b) => b.productId === product.id && b.status === 'confirmed' && b.unitsPacked > 0,
  );
  const cost = last ? last.directBatchCost / last.unitsPacked : 0;
  const gain = value - cost;

  const save = async () => {
    if (!(value > 0)) return setError('Enter a price above 0');
    try {
      await update.mutateAsync({
        id: product.id,
        input: { name: product.name, sellingPricePerUnit: value, description: product.description },
      });
      setBannerAlert({
        title: 'Selling price saved',
        message: `${product.name} sells at ${money(value)} per ${unit}. Batches now show profit.`,
        variant: 'success',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not save the price');
    }
  };

  return (
    <FlowPage title="Selling Price" onClose={onClose}>
      <FlowHeaderCard
        icon="pricetag-outline"
        title={product.name}
        description="Used for sales value, value added and gain on every batch of this item"
        chip="Production item"
      />

      <FlowSection label={`Price per ${unit}`}>
        <TextInput
          label="Selling price"
          value={price}
          onChangeText={(t) => {
            setPrice(t);
            setError('');
          }}
          keyboardType="numeric"
          prefix={symbol}
        />
        {cost > 0 && (
          <Stack gap="xs">
            <Row justify="space-between">
              <Typography variant="bodySmall" color="secondary">
                Cost per {unit} in your last batch
              </Typography>
              <Typography variant="dataMedium" tabular>
                {money(cost)}
              </Typography>
            </Row>
            {value > 0 && (
              <Row justify="space-between" align="center">
                <Typography variant="bodySmall" color="secondary">
                  Gain per {unit} at this price
                </Typography>
                <Badge
                  label={`${money(gain)} · ${Math.round((gain / value) * 1000) / 10}%`}
                  variant={gain >= 0 ? 'success' : 'danger'}
                  size="sm"
                />
              </Row>
            )}
          </Stack>
        )}
      </FlowSection>

      {error ? (
        <Typography variant="bodySmall" color="error">
          {error}
        </Typography>
      ) : null}

      <Stack gap="xs">
        <Button
          label="Save Price"
          size="lg"
          leftIcon="checkmark-circle-outline"
          fullWidth
          loading={update.isPending}
          onPress={save}
        />
        <Button label="Cancel" variant="ghost" fullWidth onPress={onClose} />
      </Stack>
    </FlowPage>
  );
};

export default SetSellingPricePage;
