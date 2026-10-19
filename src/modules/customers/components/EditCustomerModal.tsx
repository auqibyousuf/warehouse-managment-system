import React, { useState } from 'react';
import { useCustomers, useUpdateCustomer } from '../../../hooks/api/useCustomers';
import { useAppStore } from '../../../stores/useAppStore';
import { Modal, Stack, TextInput } from '../../../components';

export interface EditCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  customerId: string | null;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  visible,
  onClose,
  customerId,
}) => {
  const { data: customers = [] } = useCustomers();
  const updateMutation = useUpdateCustomer();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);
  const customer = customers.find((c) => c.id === customerId);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [seededFor, setSeededFor] = useState<string | null>(null);

  if (customer && seededFor !== customer.id) {
    setSeededFor(customer.id);
    setName(customer.name);
    setPhone(customer.phone);
    setAddress(customer.address);
    setEmail(customer.email ?? '');
    setGstin(customer.gstin ?? '');
    setCreditLimit(String(customer.creditLimit ?? 0));
    setNotes(customer.notes ?? '');
  }

  const handleSubmit = async () => {
    if (!customer) return;
    if (!name.trim()) return setError('Customer name is required');
    if (!phone.trim()) return setError('Phone number is required');
    const limit = Number(creditLimit);
    if (Number.isNaN(limit) || limit < 0) return setError('Credit limit must be 0 or more');
    try {
      await updateMutation.mutateAsync({
        id: customer.id,
        input: {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          email: email.trim() || undefined,
          gstin: gstin.trim() || undefined,
          creditLimit: limit,
          notes: notes.trim() || undefined,
        },
      });
      setBannerAlert({
        title: 'Customer updated',
        message: `${name.trim()} saved.`,
        variant: 'success',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not save customer');
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Edit Customer"
      subtitle="Past invoices keep the name they were issued with"
      primaryAction={{
        label: 'Save Changes',
        onPress: handleSubmit,
        loading: updateMutation.isPending,
      }}
      secondaryAction={{ label: 'Cancel', onPress: onClose }}
    >
      <Stack gap="md">
        <TextInput label="Customer Name" value={name} onChangeText={setName} error={error} />
        <TextInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextInput label="Address" value={address} onChangeText={setAddress} multiline />
        <TextInput
          label="Email (Optional)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          label="GSTIN (Optional)"
          value={gstin}
          onChangeText={setGstin}
          autoCapitalize="characters"
        />
        <TextInput
          label="Credit Limit"
          value={creditLimit}
          onChangeText={setCreditLimit}
          keyboardType="numeric"
        />
        <TextInput label="Notes (Optional)" value={notes} onChangeText={setNotes} multiline />
      </Stack>
    </Modal>
  );
};

export default EditCustomerModal;
