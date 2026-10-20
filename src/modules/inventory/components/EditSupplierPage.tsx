import React, { useState } from 'react';
import { useSuppliers, useUpdateSupplier } from '../../../hooks/api/useInventory';
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

export interface EditSupplierPageProps {
  onClose: () => void;
  supplierId: string | null;
}

export const EditSupplierPage: React.FC<EditSupplierPageProps> = ({ onClose, supplierId }) => {
  const { data: suppliers = [] } = useSuppliers();
  const updateMutation = useUpdateSupplier();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);
  const supplier = suppliers.find((s) => s.id === supplierId);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [error, setError] = useState('');
  const [seededFor, setSeededFor] = useState<string | null>(null);

  // Seed the form once per supplier (state adjusted during render, not in an effect).
  if (supplier && seededFor !== supplier.id) {
    setSeededFor(supplier.id);
    setName(supplier.name);
    setPhone(supplier.phone);
    setAddress(supplier.address ?? '');
    setGstNumber(supplier.gstNumber ?? '');
  }

  const handleSubmit = async () => {
    if (!supplier) return;
    if (!name.trim()) return setError('Supplier name is required');
    if (!phone.trim()) return setError('Phone number is required');
    try {
      await updateMutation.mutateAsync({
        id: supplier.id,
        input: {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim() || undefined,
          gstNumber: gstNumber.trim() || undefined,
        },
      });
      setBannerAlert({
        title: 'Supplier updated',
        message: `${name.trim()} saved.`,
        variant: 'success',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not save supplier');
    }
  };

  if (!supplier) return null;

  return (
    <FlowPage title="Edit Supplier" onClose={onClose}>
      <FlowHeaderCard
        icon="business-outline"
        title={supplier.name}
        description="Past bills keep the name they were issued with"
        chip="Supplier"
      />

      <FlowSection label="Contact">
        <TextInput label="Name" value={name} onChangeText={setName} />
        <TextInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      </FlowSection>

      <FlowSection label="Details" hint="Optional">
        <TextInput label="Address" value={address} onChangeText={setAddress} multiline />
        <TextInput
          label="GST number"
          value={gstNumber}
          onChangeText={setGstNumber}
          autoCapitalize="characters"
        />
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

export default EditSupplierPage;
