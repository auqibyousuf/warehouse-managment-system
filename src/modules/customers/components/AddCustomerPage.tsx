import React, { useState } from 'react';
import { useCurrencySymbol } from '../../../hooks/useMoney';
import { customerSchema } from '../../../validation/schemas';
import { useCreateCustomer } from '../../../hooks/api/useCustomers';
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

export interface AddCustomerPageProps {
  onClose: () => void;
}

/** Add Customer: the essentials first; credit, tax and notes are optional. */
export const AddCustomerPage: React.FC<AddCustomerPageProps> = ({ onClose }) => {
  const symbol = useCurrencySymbol();
  const create = useCreateCustomer();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const [f, setF] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    gstin: '',
    creditLimit: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const set = (key: keyof typeof f) => (text: string) => {
    setF((prev) => ({ ...prev, [key]: text }));
    setError('');
  };

  const submit = async () => {
    const parsed = customerSchema.safeParse({
      ...f,
      creditLimit: f.creditLimit ? Number(f.creditLimit) : undefined,
    });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    const d = parsed.data;
    try {
      await create.mutateAsync({
        name: d.name,
        phone: d.phone,
        address: d.address,
        email: d.email || undefined,
        gstin: d.gstin || undefined,
        creditLimit: d.creditLimit,
        notes: d.notes || undefined,
      });
      setBannerAlert({
        title: 'Customer added',
        message: `${d.name} is ready to invoice.`,
        variant: 'success',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not add this customer');
    }
  };

  return (
    <FlowPage title="Add Customer" onClose={onClose}>
      <FlowHeaderCard
        icon="person-add-outline"
        title="New Customer"
        description="Register a buyer, dealer or distributor"
        chip="Customers"
      />

      <FlowSection label="Contact">
        <TextInput
          label="Name"
          value={f.name}
          onChangeText={set('name')}
          placeholder="e.g. Sharma Traders"
        />
        <TextInput
          label="Phone"
          value={f.phone}
          onChangeText={set('phone')}
          keyboardType="phone-pad"
          leftIcon="call-outline"
        />
        <TextInput
          label="Delivery address"
          value={f.address}
          onChangeText={set('address')}
          leftIcon="location-outline"
          multiline
        />
      </FlowSection>

      <FlowSection label="Credit & tax" hint="Optional">
        <TextInput
          label="Credit limit"
          value={f.creditLimit}
          onChangeText={set('creditLimit')}
          keyboardType="numeric"
          prefix={symbol}
        />
        <TextInput
          label="GSTIN / Tax ID"
          value={f.gstin}
          onChangeText={set('gstin')}
          autoCapitalize="characters"
        />
        <TextInput
          label="Email"
          value={f.email}
          onChangeText={set('email')}
          keyboardType="email-address"
          leftIcon="mail-outline"
        />
        <TextInput label="Notes" value={f.notes} onChangeText={set('notes')} multiline />
      </FlowSection>

      {error ? (
        <Typography variant="bodySmall" color="error">
          {error}
        </Typography>
      ) : null}

      <Stack gap="xs">
        <Button
          label="Save Customer"
          size="lg"
          leftIcon="checkmark-circle-outline"
          fullWidth
          loading={create.isPending}
          onPress={submit}
        />
        <Button label="Cancel" variant="ghost" fullWidth onPress={onClose} />
      </Stack>
    </FlowPage>
  );
};

export default AddCustomerPage;
