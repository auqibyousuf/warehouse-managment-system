import { useCurrencySymbol } from '../../hooks/useMoney';
import React, { useState } from 'react';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { openSheet } from '../../navigation/sheets';
import { theme } from '../../theme';
import { resetDB } from '../../services/api/mockDatabase';
import { useFactorySettings } from '../../hooks/api/useDashboard';
import { useAppStore } from '../../stores/useAppStore';
import {
  Button,
  Card,
  ConfirmDialog,
  Header,
  ScreenContainer,
  Stack,
  Row,
  Typography,
} from '../../components';

/** Business profile, backup and sample data. Opened from the avatar in the top bar. */
export const SettingsScreen: React.FC = () => {
  const symbol = useCurrencySymbol();
  const { data: settings } = useFactorySettings();

  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const queryClient = useQueryClient();
  const [confirmResetVisible, setConfirmResetVisible] = useState(false);

  const handleResetData = () => {
    resetDB();
    queryClient.invalidateQueries();
    setConfirmResetVisible(false);
    setBannerAlert({
      title: 'Demo data restored',
      message: 'All records were reset to the sample data.',
      variant: 'info',
    });
  };

  const handleExportCSV = () => {
    setBannerAlert({
      title: 'Export coming soon',
      message: 'CSV export is not available yet. Your records are saved on this device.',
      variant: 'info',
    });
  };

  return (
    <>
      <Header title="Settings" subtitle="Business profile and data" onBack={() => router.back()} />
      <ScreenContainer>
        <Stack gap="md">
          {/* Company Profile Card */}
          <Card variant="elevated" padding="normal">
            <Row justify="space-between" align="center" style={{ marginBottom: theme.spacing.sm }}>
              <Typography variant="title" weight="bold" color="primary">
                Company Profile & Invoicing Setup
              </Typography>
              <Button
                label="Edit Profile"
                variant="primary"
                size="sm"
                leftIcon="create-outline"
                onPress={() => openSheet('company_profile')}
              />
            </Row>

            <Typography variant="caption" color="muted" style={{ marginBottom: theme.spacing.md }}>
              These business details appear on customer invoices, purchase orders, and PDF
              downloads.
            </Typography>

            <Stack gap="xs">
              <Row justify="space-between">
                <Typography variant="bodySmall" color="secondary">
                  Business Name:
                </Typography>
                <Typography variant="bodySmall" weight="semibold" color="primary">
                  {settings?.factoryName?.trim() || 'Not set'}
                </Typography>
              </Row>
              {settings?.tagline && (
                <Row justify="space-between">
                  <Typography variant="bodySmall" color="secondary">
                    Tagline:
                  </Typography>
                  <Typography variant="bodySmall" color="muted">
                    {settings.tagline}
                  </Typography>
                </Row>
              )}
              {settings?.gstin && (
                <Row justify="space-between">
                  <Typography variant="bodySmall" color="secondary">
                    GSTIN / Tax ID:
                  </Typography>
                  <Typography variant="bodySmall" weight="semibold" color="primary">
                    {settings.gstin}
                  </Typography>
                </Row>
              )}
              {settings?.phone && (
                <Row justify="space-between">
                  <Typography variant="bodySmall" color="secondary">
                    Contact Phone:
                  </Typography>
                  <Typography variant="bodySmall" color="primary">
                    {settings.phone}
                  </Typography>
                </Row>
              )}
              {settings?.bankName && (
                <Row justify="space-between">
                  <Typography variant="bodySmall" color="secondary">
                    Bank Remittance:
                  </Typography>
                  <Typography variant="bodySmall" color="primary">
                    {settings.bankName} (A/C: {settings.accountNumber || 'N/A'})
                  </Typography>
                </Row>
              )}
            </Stack>
          </Card>

          <Card variant="flat" padding="normal">
            <Typography
              variant="title"
              weight="bold"
              color="primary"
              style={{ marginBottom: theme.spacing.sm }}
            >
              Production Standards
            </Typography>

            <Stack gap="xs">
              <Row justify="space-between">
                <Typography variant="bodySmall" color="secondary">
                  Default Output Unit:
                </Typography>
                <Typography variant="bodySmall" weight="semibold" color="primary">
                  {settings?.defaultUnitName || 'bags'} (
                  {settings?.defaultUnitSize || settings?.defaultBagWeightKg || 20}{' '}
                  {settings?.defaultBaseUnit || 'kg'})
                </Typography>
              </Row>
              <Row justify="space-between">
                <Typography variant="bodySmall" color="secondary">
                  Accounting Currency:
                </Typography>
                <Typography variant="bodySmall" weight="semibold" color="primary">
                  {symbol} (editable in the business profile)
                </Typography>
              </Row>
              <Row justify="space-between">
                <Typography variant="bodySmall" color="secondary">
                  Raw Material Safety Alert:
                </Typography>
                <Typography variant="bodySmall" weight="semibold" color="warning">
                  Below {settings?.lowStockThresholdKg || 400} kg
                </Typography>
              </Row>
            </Stack>
          </Card>

          <Card variant="accent" padding="normal">
            <Typography
              variant="title"
              weight="bold"
              color="brandDeep"
              style={{ marginBottom: theme.spacing.xsm }}
            >
              Accounting Rules & Profit Principles
            </Typography>
            <Typography variant="caption" color="secondary" style={{ lineHeight: 18 }}>
              • Cash collected is NOT revenue. Revenue is recognized upon invoiced dispatch.{'\n'}•
              Unsold finished goods are inventory, NOT Cost of Goods Sold (COGS).{'\n'}• Direct
              batch cost includes raw ingredients and packaging/container units consumed.{'\n'}•
              Confirmed batches and sales are corrected via audited compensating reversals.
            </Typography>
          </Card>

          <Card variant="elevated" padding="normal">
            <Typography
              variant="title"
              weight="bold"
              color="primary"
              style={{ marginBottom: theme.spacing.xsm }}
            >
              Data Export & Backups
            </Typography>
            <Typography
              variant="bodySmall"
              color="secondary"
              style={{ marginBottom: theme.spacing.md }}
            >
              Export complete historical ledger, batches, stock movements, and customer accounts for
              offline backups or spreadsheet analysis.
            </Typography>

            <Button
              label="Export Factory Records to CSV"
              variant="subtle"
              leftIcon="download-outline"
              onPress={handleExportCSV}
            />
          </Card>

          <Card variant="elevated" padding="normal">
            <Typography
              variant="title"
              weight="bold"
              color="primary"
              style={{ marginBottom: theme.spacing.xsm }}
            >
              Sample Data
            </Typography>
            <Typography
              variant="bodySmall"
              color="secondary"
              style={{ marginBottom: theme.spacing.md }}
            >
              Your records are saved on this device. Reset to replace everything with the sample
              data. This cannot be undone.
            </Typography>
            <Button
              label="Reset to Sample Data"
              variant="danger"
              leftIcon="refresh-outline"
              onPress={() => setConfirmResetVisible(true)}
            />
          </Card>

          <ConfirmDialog
            visible={confirmResetVisible}
            onClose={() => setConfirmResetVisible(false)}
            onConfirm={handleResetData}
            title="Reset all data?"
            message="Every recipe, batch, stock level, invoice, customer and expense on this device will be replaced with the sample data."
            confirmLabel="Reset Data"
            isDestructive
          />
        </Stack>
      </ScreenContainer>
    </>
  );
};

export default SettingsScreen;
