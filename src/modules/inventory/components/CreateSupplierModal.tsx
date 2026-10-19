import React, { useState } from 'react';
import { useCreateSupplier } from '../../../hooks/api/useInventory';
import { useAppStore } from '../../../stores/useAppStore';
import {
  Modal,
  Stack,
  Typography,
  TextInput,
} from '../../../components';

export interface CreateSupplierModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated?: (supplier: any) => void;
}

export const CreateSupplierModal: React.FC<CreateSupplierModalProps> = ({
  visible,
  onClose,
  onCreated,
}) => {
  const createSupplierMutation = useCreateSupplier();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [error, setError] = useState('');

  const handleReset = () => {
    setName('');
    setPhone('');
    setAddress('');
    setGstNumber('');
    setError('');
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Supplier or vendor name is required');
      return;
    }
    if (!phone.trim()) {
      setError('Supplier phone number is required');
      return;
    }

    try {
      const created = await createSupplierMutation.mutateAsync({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
        gstNumber: gstNumber.trim() || undefined,
      });

      setBannerAlert({
        title: 'Supplier Added',
        message: `${created.name} registered successfully. You can now record stock purchase bills against this vendor.`,
        variant: 'success',
      });

      if (onCreated) {
        onCreated(created);
      }
      handleReset();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create supplier');
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title="Add New Supplier / Vendor"
      subtitle="Register vendor for raw material inward bills"
      primaryAction={{
        label: createSupplierMutation.isPending ? 'Saving...' : 'Register Supplier',
        onPress: handleSubmit,
        loading: createSupplierMutation.isPending,
      }}
      secondaryAction={{
        label: 'Cancel',
        onPress: () => {
          handleReset();
          onClose();
        },
      }}
    >
      <Stack gap="md">
        <Typography variant="caption" color="muted">
          Add vendor details to track payable accounts, delivery bills, and inward stock lots.
        </Typography>

        <TextInput
          label="Supplier / Vendor Name"
          placeholder="e.g. Kisan Agro Commodities Ltd, National Bags Corp"
          value={name}
          onChangeText={(val) => {
            setName(val);
            if (error) setError('');
          }}
          error={error}
        />

        <TextInput
          label="Phone Number"
          placeholder="+91 98765 43210"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <TextInput
          label="GST / Tax Identification Number (Optional)"
          placeholder="e.g. 29AAAAA0000A1Z5"
          value={gstNumber}
          onChangeText={setGstNumber}
          autoCapitalize="characters"
        />

        <TextInput
          label="Warehouse / Factory Address (Optional)"
          placeholder="City, State, Pin Code"
          value={address}
          onChangeText={setAddress}
          multiline
        />
      </Stack>
    </Modal>
  );
};
