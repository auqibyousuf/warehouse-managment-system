import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { companyProfileSchema, CompanyProfileFormData } from '../../../validation/schemas';
import { useFactorySettings, useUpdateFactorySettings } from '../../../hooks/api/useDashboard';
import { useAppStore } from '../../../stores/useAppStore';
import {
  Modal,
  Stack,
  TextInput,
  Typography,
  Card,
} from '../../../components';

export interface CompanyProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({
  visible,
  onClose,
}) => {
  const { data: settings } = useFactorySettings();
  const updateSettingsMutation = useUpdateFactorySettings();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyProfileFormData>({
    resolver: zodResolver(companyProfileSchema) as any,
    defaultValues: {
      factoryName: '',
      tagline: '',
      address: '',
      gstin: '',
      phone: '',
      email: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      termsAndConditions: '',
    },
  });

  useEffect(() => {
    if (settings && visible) {
      reset({
        factoryName: settings.factoryName || '',
        tagline: settings.tagline || '',
        address: settings.address || '',
        gstin: settings.gstin || '',
        phone: settings.phone || '',
        email: settings.email || '',
        bankName: settings.bankName || '',
        accountNumber: settings.accountNumber || '',
        ifscCode: settings.ifscCode || '',
        termsAndConditions: settings.termsAndConditions || '',
      });
    }
  }, [settings, visible, reset]);

  const onSubmit = async (data: CompanyProfileFormData) => {
    try {
      await updateSettingsMutation.mutateAsync({
        factoryName: data.factoryName,
        tagline: data.tagline,
        address: data.address,
        gstin: data.gstin,
        phone: data.phone,
        email: data.email,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        termsAndConditions: data.termsAndConditions,
      });

      setBannerAlert({
        title: 'Company Profile Updated',
        message: 'Business information and billing terms saved. All generated invoices & bills will reflect these details.',
        variant: 'success',
      });
      onClose();
    } catch (err: any) {
      setBannerAlert({
        title: 'Update Error',
        message: err.message || 'Failed to update company profile',
        variant: 'danger',
      });
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Company Profile & Billing Setup"
      subtitle="Details stamped on invoices, purchase bills, and PDF vouchers"
      primaryAction={{
        label: 'Save Profile Changes',
        onPress: handleSubmit(onSubmit),
        loading: updateSettingsMutation.isPending,
      }}
      secondaryAction={{
        label: 'Cancel',
        onPress: onClose,
      }}
    >
      <Stack gap="md">
        <Card variant="accent" padding="compact">
          <Typography variant="caption" color="secondary">
            Note: These details appear directly in headers and footers when generating or printing official PDF invoices for customers and suppliers.
          </Typography>
        </Card>

        {/* Business Identity */}
        <Typography variant="bodyMedium" weight="bold" color="primary">
          Business Identity
        </Typography>

        <Controller
          control={control}
          name="factoryName"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Business / Factory Name"
              placeholder="e.g. Nexus Agro Manufacturing"
              value={value}
              onChangeText={onChange}
              error={errors.factoryName?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="tagline"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Tagline / Business Subtitle"
              placeholder="e.g. High-Yield Feeds & Nutritional Formulations"
              value={value}
              onChangeText={onChange}
              error={errors.tagline?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Factory / Registered Office Address"
              placeholder="Full address with pin code"
              value={value}
              onChangeText={onChange}
              multiline
              leftIcon="location-outline"
              error={errors.address?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="gstin"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="GSTIN / Business Tax Identification"
              placeholder="e.g. 27AABCB1234F1Z5"
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
          name="phone"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Official Contact Phone"
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
              label="Billing / Accounts Email"
              placeholder="accounts@nexusmfg.in"
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
              leftIcon="mail-outline"
              error={errors.email?.message}
            />
          )}
        />

        {/* Bank & Remittance Information */}
        <Typography variant="bodyMedium" weight="bold" color="primary" style={{ marginTop: 8 }}>
          Bank & Remittance Details (For Invoice Remittance)
        </Typography>

        <Controller
          control={control}
          name="bankName"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Bank Name"
              placeholder="e.g. HDFC Bank Ltd"
              value={value}
              onChangeText={onChange}
              leftIcon="business-outline"
              error={errors.bankName?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="accountNumber"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Account Number"
              placeholder="e.g. 50200012345678"
              value={value}
              onChangeText={onChange}
              keyboardType="number-pad"
              leftIcon="card-outline"
              error={errors.accountNumber?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="ifscCode"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="IFSC Code"
              placeholder="e.g. HDFC0001234"
              value={value}
              onChangeText={onChange}
              autoCapitalize="characters"
              error={errors.ifscCode?.message}
            />
          )}
        />

        {/* Invoice Terms */}
        <Typography variant="bodyMedium" weight="bold" color="primary" style={{ marginTop: 8 }}>
          Standard Terms & Conditions
        </Typography>

        <Controller
          control={control}
          name="termsAndConditions"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Terms Printed on Bills"
              placeholder="e.g. 1. Goods once sold will not be taken back..."
              value={value}
              onChangeText={onChange}
              multiline
              error={errors.termsAndConditions?.message}
            />
          )}
        />
      </Stack>
    </Modal>
  );
};

export default CompanyProfileModal;
