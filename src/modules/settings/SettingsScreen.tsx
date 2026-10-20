import { useCurrencySymbol } from '../../hooks/useMoney';
import React, { useState } from 'react';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { openSheet } from '../../navigation/sheets';
import { theme } from '../../theme';
import {
  clearDatabase,
  exportDatabase,
  importDatabase,
  resetDB,
} from '../../services/api/mockDatabase';
import { pickBackupFile, saveBackupFile } from '../../utils/backupFile';
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

  const [confirm, setConfirm] = useState<'clear' | null>(null);

  const handleBackup = async () => {
    try {
      await saveBackupFile(exportDatabase());
      setBannerAlert({
        title: 'Backup ready',
        message: 'Keep the file somewhere safe. You can restore it here later.',
        variant: 'success',
      });
    } catch (err: any) {
      setBannerAlert({ title: 'Backup failed', message: err.message, variant: 'danger' });
    }
  };

  const handleRestore = async () => {
    try {
      const text = await pickBackupFile();
      if (text === null) return;
      importDatabase(text);
      queryClient.invalidateQueries();
      setBannerAlert({
        title: 'Backup restored',
        message: 'Your records were replaced with the backup.',
        variant: 'success',
      });
    } catch (err: any) {
      setBannerAlert({ title: 'Could not restore', message: err.message, variant: 'danger' });
    }
  };

  const handleClear = () => {
    clearDatabase();
    queryClient.invalidateQueries();
    setConfirm(null);
    setBannerAlert({
      title: 'Fresh start',
      message: 'All records were cleared. Your business profile was kept.',
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
              Preferences
            </Typography>

            <Stack gap="xs">
              <Row justify="space-between">
                <Typography variant="bodySmall" color="secondary">
                  Default Output Unit:
                </Typography>
                <Typography variant="bodySmall" weight="semibold" color="primary">
                  {settings?.defaultUnitName || 'units'} ({settings?.defaultUnitSize ?? 1}{' '}
                  {settings?.defaultBaseUnit || 'kg'})
                </Typography>
              </Row>
              <Row justify="space-between">
                <Typography variant="bodySmall" color="secondary">
                  Currency:
                </Typography>
                <Typography variant="bodySmall" weight="semibold" color="primary">
                  {symbol}
                </Typography>
              </Row>
              <Row justify="space-between">
                <Typography variant="bodySmall" color="secondary">
                  Finished Goods Low-Stock Alert:
                </Typography>
                <Typography variant="bodySmall" weight="semibold" color="warning">
                  Below {settings?.lowUnitsThreshold ?? 0} {settings?.defaultUnitName || 'units'}
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
              Backup & Restore
            </Typography>
            <Typography
              variant="bodySmall"
              color="secondary"
              style={{ marginBottom: theme.spacing.md }}
            >
              Your records live only on this device. Save a backup file regularly, and restore it
              here if you change phones or lose data.
            </Typography>

            <Row gap="sm" wrap>
              <Button
                label="Save backup"
                variant="subtle"
                leftIcon="download-outline"
                onPress={handleBackup}
              />
              <Button
                label="Restore backup"
                variant="subtle"
                leftIcon="push-outline"
                onPress={handleRestore}
              />
            </Row>
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
              label="Start fresh (clear all records)"
              variant="danger"
              leftIcon="trash-outline"
              onPress={() => setConfirm('clear')}
              style={{ marginBottom: theme.spacing.sm }}
            />
            <Button
              label="Reset to Sample Data"
              variant="subtle"
              leftIcon="refresh-outline"
              onPress={() => setConfirmResetVisible(true)}
            />
          </Card>

          <ConfirmDialog
            visible={confirm === 'clear'}
            onClose={() => setConfirm(null)}
            onConfirm={handleClear}
            title="Clear all records?"
            message="Every recipe, batch, stock level, invoice, customer and expense is removed. Your business profile stays. Save a backup first if you may need them."
            confirmLabel="Clear everything"
            isDestructive
          />

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
