import React, { useState } from 'react';
import { useProducts, useUpdateProduct } from '../../../hooks/api/useInventory';
import { useAppStore } from '../../../stores/useAppStore';
import {
  Button,
  FlowHeaderCard,
  FlowPage,
  FlowSection,
  Stack,
  TextInput,
  Typography,
} from '../../../components';

export interface EditProductPageProps {
  onClose: () => void;
  productId: string | null;
}

export const EditProductPage: React.FC<EditProductPageProps> = ({ onClose, productId }) => {
  const { data: products = [] } = useProducts();
  const updateMutation = useUpdateProduct();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);
  const product = products.find((p) => p.id === productId);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [seededFor, setSeededFor] = useState<string | null>(null);

  if (product && seededFor !== product.id) {
    setSeededFor(product.id);
    setName(product.name);
    setPrice(String(product.sellingPricePerUnit ?? product.sellingPricePerBag ?? 0));
    setDescription(product.description ?? '');
  }

  const handleSubmit = async () => {
    if (!product) return;
    if (!name.trim()) return setError('Product name is required');
    const value = Number(price);
    if (Number.isNaN(value) || value <= 0) return setError('Selling price must be greater than 0');
    try {
      await updateMutation.mutateAsync({
        id: product.id,
        input: { name: name.trim(), sellingPricePerUnit: value, description: description.trim() },
      });
      setBannerAlert({
        title: 'Product updated',
        message: `${name.trim()} saved.`,
        variant: 'success',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not save product');
    }
  };

  if (!product) return null;

  return (
    <FlowPage title="Edit Product" onClose={onClose}>
      <FlowHeaderCard
        icon="cube-outline"
        title={product.name}
        description="Change stock with Count Stock, not here"
        chip="Product"
      />

      <FlowSection label="Product">
        <TextInput label="Name" value={name} onChangeText={setName} />
        <TextInput
          label={`Selling price per ${product.outputUnit ?? 'unit'}`}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />
      </FlowSection>

      <FlowSection label="Description" hint="Optional">
        <TextInput label="Notes" value={description} onChangeText={setDescription} multiline />
      </FlowSection>

      {error ? (
        <Typography variant="bodySmall" color="error">
          {error}
        </Typography>
      ) : null}

      <Stack gap="xs">
        <Button
          label="Save Changes"
          size="lg"
          leftIcon="checkmark-circle-outline"
          fullWidth
          loading={updateMutation.isPending}
          onPress={handleSubmit}
        />
        <Button label="Cancel" variant="ghost" fullWidth onPress={onClose} />
      </Stack>
    </FlowPage>
  );
};

export default EditProductPage;
