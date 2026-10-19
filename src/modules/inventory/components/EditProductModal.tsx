import React, { useState } from 'react';
import { useProducts, useUpdateProduct } from '../../../hooks/api/useInventory';
import { useAppStore } from '../../../stores/useAppStore';
import { Modal, Stack, TextInput } from '../../../components';

export interface EditProductModalProps {
  visible: boolean;
  onClose: () => void;
  productId: string | null;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  visible,
  onClose,
  productId,
}) => {
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

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Edit Product"
      subtitle={
        product ? `Priced per ${product.outputUnit}. Change stock with Reconcile Count.` : undefined
      }
      primaryAction={{
        label: 'Save Changes',
        onPress: handleSubmit,
        loading: updateMutation.isPending,
      }}
      secondaryAction={{ label: 'Cancel', onPress: onClose }}
    >
      <Stack gap="md">
        <TextInput label="Product Name" value={name} onChangeText={setName} error={error} />
        <TextInput
          label={`Selling Price per ${product?.outputUnit ?? 'unit'}`}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />
        <TextInput
          label="Description (Optional)"
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </Stack>
    </Modal>
  );
};

export default EditProductModal;
