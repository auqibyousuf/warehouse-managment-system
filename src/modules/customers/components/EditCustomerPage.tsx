import React, { useState } from 'react';
import { useCustomers, useUpdateCustomer } from '../../../hooks/api/useCustomers';
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

export interface EditCustomerPageProps {
  onClose: () => void;
  customerId: string | null;
}

export const EditCustomerPage: React.FC<EditCustomerPageProps> = ({ onClose, customerId }) => {
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

  if (!customer) return null;

  return (
    <FlowPage title="Edit Customer" onClose={onClose}>
      <FlowHeaderCard
        icon="person-outline"
        title={customer.name}
        description="Past invoices keep the name they were issued with"
        chip="Customer"
      />

      <FlowSection label="Contact">
        <TextInput label="Name" value={name} onChangeText={setName} />
        <TextInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextInput label="Address" value={address} onChangeText={setAddress} multiline />
      </FlowSection>

      <FlowSection label="Credit & tax" hint="Optional">
        <TextInput
          label="Credit limit"
          value={creditLimit}
          onChangeText={setCreditLimit}
          keyboardType="numeric"
        />
        <TextInput
          label="GSTIN"
          value={gstin}
          onChangeText={setGstin}
          autoCapitalize="characters"
        />
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput label="Notes" value={notes} onChangeText={setNotes} multiline />
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

export default EditCustomerPage;
