import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema, CustomerFormData, CustomerFormInput } from '../../../validation/schemas';
import { useCreateCustomer } from '../../../hooks/api/useCustomers';
import { useAppStore } from '../../../stores/useAppStore';
import {
  Modal,
  Stack,
  TextInput,
} from '../../../components';

export interface CreateCustomerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  visible,
  onClose,
}) => {
  const createCustomerMutation = useCreateCustomer();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormInput, unknown, CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      email: '',
      gstin: '',
      creditLimit: undefined,
      notes: '',
    },
  });

  const onSubmit = async (data: CustomerFormData) => {
    try {
      await createCustomerMutation.mutateAsync({
        name: data.name,
        phone: data.phone,
        address: data.address,
        email: data.email || undefined,
        gstin: data.gstin || undefined,
        creditLimit: data.creditLimit ? Number(data.creditLimit) : undefined,
        notes: data.notes || undefined,
      });

      setBannerAlert({
        title: 'Customer Added',
        message: `Registered customer account for ${data.name}.`,
        variant: 'success',
      });
      reset();
      onClose();
    } catch (err: any) {
      setBannerAlert({
        title: 'Error',
        message: err.message || 'Failed to add customer',
        variant: 'danger',
      });
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Add New Customer"
      subtitle="Register a dairy farm, cooperative, or dealer"
      primaryAction={{
        label: 'Save Customer Record',
        onPress: handleSubmit(onSubmit),
        loading: createCustomerMutation.isPending,
      }}
      secondaryAction={{
        label: 'Cancel',
        onPress: onClose,
      }}
    >
      <Stack gap="md">
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Customer / Dairy Farm Name"
              placeholder="e.g. Kisan Dairy Cooperative"
              value={value}
              onChangeText={onChange}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Contact Phone"
              placeholder="+91 98000 00000"
              value={value}
              onChangeText={onChange}
              keyboardType="phone-pad"
              leftIcon="call-outline"
              error={errors.phone?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Email Address (Optional)"
              placeholder="dealer@example.com"
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
              leftIcon="mail-outline"
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="gstin"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="GSTIN / Tax ID (Optional)"
              placeholder="27AABCU9603R1ZM"
              value={value}
              onChangeText={onChange}
              autoCapitalize="characters"
              leftIcon="document-text-outline"
              error={errors.gstin?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="creditLimit"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Approved Credit Limit (₹)"
              placeholder="e.g. 50000"
              value={value ? String(value) : ''}
              onChangeText={(text) => onChange(text ? Number(text) : undefined)}
              keyboardType="numeric"
              leftIcon="cash-outline"
              error={errors.creditLimit?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Delivery Address / Village Location"
              placeholder="e.g. Village Rampur, Near Milk Chilling Unit"
              value={value}
              onChangeText={onChange}
              leftIcon="location-outline"
              multiline
              error={errors.address?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Account Notes / Payment Terms (Optional)"
              placeholder="e.g. 15 days credit cycle, wholesale rates applicable"
              value={value}
              onChangeText={onChange}
              multiline
              error={errors.notes?.message}
            />
          )}
        />
      </Stack>
    </Modal>
  );
};

export default CreateCustomerModal;
