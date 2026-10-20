import React, { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  companyProfileSchema,
  CompanyProfileFormData,
  CompanyProfileFormInput,
} from '../../../validation/schemas';
import { useFactorySettings, useUpdateFactorySettings } from '../../../hooks/api/useDashboard';
import { useAppStore } from '../../../stores/useAppStore';
import {
  Button,
  FlowHeaderCard,
  FlowPage,
  FlowSection,
  Stack,
  TextInput,
} from '../../../components';

export interface CompanyProfilePageProps {
  onClose: () => void;
}

export const CompanyProfilePage: React.FC<CompanyProfilePageProps> = ({ onClose }) => {
  const { data: settings } = useFactorySettings();
  const updateSettingsMutation = useUpdateFactorySettings();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyProfileFormInput, unknown, CompanyProfileFormData>({
    resolver: zodResolver(companyProfileSchema),
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
      currencySymbol: '₹',
      defaultUnitName: 'units',
      defaultBaseUnit: 'kg',
      defaultUnitSize: '1',
      lowUnitsThreshold: '0',
    },
  });

  // Fill the form once when the settings arrive; later refetches must not wipe what is being typed.
  const seeded = useRef(false);
  useEffect(() => {
    if (settings && !seeded.current) {
      seeded.current = true;
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
        currencySymbol: settings.currencySymbol || '₹',
        defaultUnitName: settings.defaultUnitName || 'units',
        defaultBaseUnit: settings.defaultBaseUnit || 'kg',
        defaultUnitSize: String(settings.defaultUnitSize ?? 1),
        lowUnitsThreshold: String(settings.lowUnitsThreshold ?? 0),
      });
    }
  }, [settings, reset]);

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
        currencySymbol: data.currencySymbol,
        defaultUnitName: data.defaultUnitName,
        defaultBaseUnit: data.defaultBaseUnit,
        defaultUnitSize: Number(data.defaultUnitSize),
        lowUnitsThreshold: Number(data.lowUnitsThreshold),
      });

      setBannerAlert({
        title: 'Company Profile Updated',
        message:
          'Business information and billing terms saved. All generated invoices & bills will reflect these details.',
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
    <FlowPage title="Business Profile" onClose={onClose}>
      <FlowHeaderCard
        icon="business-outline"
        title="Business Profile"
        description="Shown on invoices, purchase bills and PDFs"
        chip="Settings"
      />

      <FlowSection label="Business identity">
        <Controller
          control={control}
          name="factoryName"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Business / Factory Name"
              placeholder="Your business name"
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
              placeholder="e.g. Quality products, delivered on time"
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
              placeholder="accounts@yourbusiness.com"
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
              leftIcon="mail-outline"
              error={errors.email?.message}
            />
          )}
        />
      </FlowSection>

      <FlowSection label="Bank details" hint="Optional, printed on invoices">
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
      </FlowSection>

      <FlowSection label="Preferences" hint="Currency, units and alerts used across the app">
        {(
          [
            ['currencySymbol', 'Currency Symbol', 'e.g. ₹, $, AED', 'default'],
            ['defaultUnitName', 'Default Product Unit', 'e.g. bags, bottles, drums', 'default'],
            ['defaultBaseUnit', 'Default Measure', 'e.g. kg, L', 'default'],
            ['defaultUnitSize', 'Default Pack Size', 'e.g. 20', 'numeric'],
            ['lowUnitsThreshold', 'Low Stock Alert (finished goods)', 'e.g. 50', 'numeric'],
          ] as const
        ).map(([name, label, placeholder, keyboard]) => (
          <Controller
            key={name}
            control={control}
            name={name}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label={label}
                placeholder={placeholder}
                value={value}
                onChangeText={onChange}
                keyboardType={keyboard}
                error={errors[name]?.message}
              />
            )}
          />
        ))}
      </FlowSection>

      <FlowSection label="Invoice terms" hint="Optional">
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
      </FlowSection>

      <Stack gap="xs">
        <Button
          label="Save Profile"
          size="lg"
          leftIcon="checkmark-circle-outline"
          fullWidth
          loading={updateSettingsMutation.isPending}
          onPress={handleSubmit(onSubmit)}
        />
        <Button label="Cancel" variant="ghost" fullWidth onPress={onClose} />
      </Stack>
    </FlowPage>
  );
};

export default CompanyProfilePage;
