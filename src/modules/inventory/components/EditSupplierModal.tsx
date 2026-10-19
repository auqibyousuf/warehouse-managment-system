import React, { useState } from 'react';
import { useSuppliers, useUpdateSupplier } from '../../../hooks/api/useInventory';
import { useAppStore } from '../../../stores/useAppStore';
import { Modal, Stack, TextInput } from '../../../components';

export interface EditSupplierModalProps {
  visible: boolean;
  onClose: () => void;
  supplierId: string | null;
}

export const EditSupplierModal: React.FC<EditSupplierModalProps> = ({
  visible,
  onClose,
  supplierId,
}) => {
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

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Edit Supplier"
      subtitle="Past bills keep the name they were issued with"
      primaryAction={{
        label: 'Save Changes',
        onPress: handleSubmit,
        loading: updateMutation.isPending,
      }}
      secondaryAction={{ label: 'Cancel', onPress: onClose }}
    >
      <Stack gap="md">
        <TextInput label="Supplier Name" value={name} onChangeText={setName} error={error} />
        <TextInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextInput label="Address (Optional)" value={address} onChangeText={setAddress} multiline />
        <TextInput
          label="GST Number (Optional)"
          value={gstNumber}
          onChangeText={setGstNumber}
          autoCapitalize="characters"
        />
      </Stack>
    </Modal>
  );
};

export default EditSupplierModal;
