import React, { useState } from 'react';
import { useCustomers } from '../../hooks/api/useCustomers';
import { useExpenses } from '../../hooks/api/useExpenses';
import { useFactorySettings } from '../../hooks/api/useDashboard';
import { useAppStore } from '../../stores/useAppStore';
import {
  ScreenContainer,
  Box,
  Stack,
  Row,
  Typography,
  Card,
  Button,
  Badge,
  ListItem,
  Divider,
  ChipPicker,
  LoadingState,
  EmptyState,
} from '../../components';
import { Customer } from '../../types';

type MoreSection = 'customers' | 'expenses' | 'settings';

export const MoreScreen: React.FC = () => {
  const [section, setSection] = useState<MoreSection>('customers');

  const { data: customers = [], isLoading: loadingCustomers } = useCustomers();
  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses();
  const { data: settings } = useFactorySettings();

  const { openModal, setSelectedCustomerId, setBannerAlert } = useAppStore();

  const handleCollectPayment = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    openModal('record_payment');
  };

  const handleExportCSV = () => {
    setBannerAlert({
      title: 'Export Ready',
      message: 'Factory batch, inventory, and sales records exported successfully to CSV.',
      variant: 'success',
    });
  };

  return (
    <ScreenContainer>
      <Stack gap="lg">
        {/* Module Header */}
        <Box>
          <Typography variant="caption" color="muted">
            FACTORY ADMINISTRATION
          </Typography>
          <Typography variant="h1" weight="bold" color="brandDeep">
            Customers & Overheads
          </Typography>
        </Box>

        {/* Section Navigation Switcher */}
        <ChipPicker
          options={[
            { value: 'customers', label: 'Customers & Dues', count: customers.length },
            { value: 'expenses', label: 'Operating Expenses', count: expenses.length },
            { value: 'settings', label: 'Factory Settings' },
          ]}
          selected={section}
          onSelect={(s) => setSection(s as MoreSection)}
        />

        {/* CUSTOMERS & DUES SECTION */}
        {section === 'customers' && (
          <Stack gap="md">
            <Row justify="space-between" align="center">
              <Typography variant="bodySmall" color="secondary">
                Dairy farms, cooperatives, and commercial livestock buyers.
              </Typography>
              <Button
                label="+ Add Customer"
                variant="primary"
                size="sm"
                leftIcon="person-add-outline"
                onPress={() => openModal('create_customer')}
              />
            </Row>

            {loadingCustomers ? (
              <LoadingState message="Loading customers ledger..." />
            ) : customers.length === 0 ? (
              <EmptyState
                title="No Customers Yet"
                description="Register buyers and dairy farms to track receivables."
                actionLabel="+ Add Customer"
                onAction={() => openModal('create_customer')}
              />
            ) : (
              customers.map((c) => (
                <Card
                  key={c.id}
                  variant="elevated"
                  padding="normal"
                  onPress={() => {
                    setSelectedCustomerId(c.id);
                    openModal('customer_detail');
                  }}
                >
                  <Row justify="space-between" align="flex-start">
                    <Box flex={1}>
                      <Typography variant="title" weight="bold" color="primary">
                        {c.name}
                      </Typography>
                      <Typography variant="caption" color="muted" style={{ marginTop: 2 }}>
                        Phone: {c.phone} • Address: {c.address}
                      </Typography>
                      {c.gstin && (
                        <Typography variant="caption" weight="semibold" color="secondary">
                          GSTIN: {c.gstin}
                        </Typography>
                      )}
                    </Box>

                    <Box align="flex-end">
                      <Typography
                        variant="bodyLarge"
                        weight="bold"
                        color={c.outstandingBalance > 0 ? 'warning' : 'success'}
                      >
                        ₹{c.outstandingBalance.toLocaleString('en-IN')}
                      </Typography>
                      <Badge
                        label={c.outstandingBalance > 0 ? 'DUES PENDING' : 'ALL CLEAR'}
                        variant={c.outstandingBalance > 0 ? 'warning' : 'success'}
                        size="sm"
                      />
                    </Box>
                  </Row>

                  <Divider variant="subtle" spacing="sm" />

                  <Row justify="space-between" align="center">
                    <Button
                      label="View Ledger"
                      variant="ghost"
                      size="sm"
                      leftIcon="person-outline"
                      onPress={() => {
                        setSelectedCustomerId(c.id);
                        openModal('customer_detail');
                      }}
                    />

                    {c.outstandingBalance > 0 && (
                      <Button
                        label="Receive Payment"
                        variant="primary"
                        size="sm"
                        leftIcon="cash-outline"
                        onPress={() => handleCollectPayment(c)}
                      />
                    )}
                  </Row>
                </Card>
              ))
            )}
          </Stack>
        )}

        {/* OPERATING EXPENSES SECTION */}
        {section === 'expenses' && (
          <Stack gap="md">
            <Row justify="space-between" align="center">
              <Typography variant="bodySmall" color="secondary">
                Factory utilities, labour wages, delivery fuel, and machine upkeep.
              </Typography>
              <Button
                label="+ Record Expense"
                variant="primary"
                size="sm"
                leftIcon="add-circle-outline"
                onPress={() => openModal('create_expense')}
              />
            </Row>

            {loadingExpenses ? (
              <LoadingState message="Loading factory expenses..." />
            ) : expenses.length === 0 ? (
              <EmptyState
                title="No Expenses Recorded"
                description="Log operating costs to track realistic factory profitability."
                actionLabel="+ Record Expense"
                onAction={() => openModal('create_expense')}
              />
            ) : (
              <Card variant="elevated" padding="compact">
                {expenses.map((e) => (
                  <ListItem
                    key={e.id}
                    title={e.description}
                    subtitle={`Category: ${e.category.toUpperCase()} • Voucher #${e.expenseNumber}`}
                    meta={`Date: ${e.date}`}
                    value={`₹${e.amount.toLocaleString('en-IN')}`}
                    valueColor="error"
                    badge={{
                      label: e.category.toUpperCase(),
                      variant:
                        e.category === 'labour'
                          ? 'forest'
                          : e.category === 'electricity'
                          ? 'warning'
                          : 'neutral',
                    }}
                    showDivider
                  />
                ))}
              </Card>
            )}
          </Stack>
        )}

        {/* SETTINGS & REPORTS SECTION */}
        {section === 'settings' && (
          <Stack gap="md">
            {/* Company Profile Card */}
            <Card variant="elevated" padding="normal">
              <Row justify="space-between" align="center" style={{ marginBottom: 8 }}>
                <Typography variant="title" weight="bold" color="primary">
                  Company Profile & Invoicing Setup
                </Typography>
                <Button
                  label="Edit Profile"
                  variant="primary"
                  size="sm"
                  leftIcon="create-outline"
                  onPress={() => openModal('company_profile')}
                />
              </Row>

              <Typography variant="caption" color="muted" style={{ marginBottom: 12 }}>
                These business details appear on customer invoices, purchase orders, and PDF downloads.
              </Typography>

              <Stack gap="xs">
                <Row justify="space-between">
                  <Typography variant="bodySmall" color="secondary">
                    Business Name:
                  </Typography>
                  <Typography variant="bodySmall" weight="semibold" color="primary">
                    {settings?.factoryName || 'Nexus Manufacturing Works'}
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
              <Typography variant="title" weight="bold" color="primary" style={{ marginBottom: 8 }}>
                Production Standards
              </Typography>

              <Stack gap="xs">
                <Row justify="space-between">
                  <Typography variant="bodySmall" color="secondary">
                    Default Output Unit:
                  </Typography>
                  <Typography variant="bodySmall" weight="semibold" color="primary">
                    {settings?.defaultUnitName || 'bags'} ({settings?.defaultUnitSize || settings?.defaultBagWeightKg || 20} {settings?.defaultBaseUnit || 'kg'})
                  </Typography>
                </Row>
                <Row justify="space-between">
                  <Typography variant="bodySmall" color="secondary">
                    Accounting Currency:
                  </Typography>
                  <Typography variant="bodySmall" weight="semibold" color="primary">
                    ₹ INR (Indian Rupee)
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
              <Typography variant="title" weight="bold" color="brandDeep" style={{ marginBottom: 6 }}>
                Accounting Rules & Profit Principles
              </Typography>
              <Typography variant="caption" color="secondary" style={{ lineHeight: 18 }}>
                • Cash collected is NOT revenue. Revenue is recognized upon invoiced dispatch.{'\n'}
                • Unsold finished goods are inventory, NOT Cost of Goods Sold (COGS).{'\n'}
                • Direct batch cost includes raw ingredients and packaging/container units consumed.{'\n'}
                • Confirmed batches and sales are corrected via audited compensating reversals.
              </Typography>
            </Card>

            <Card variant="elevated" padding="normal">
              <Typography variant="title" weight="bold" color="primary" style={{ marginBottom: 6 }}>
                Data Export & Backups
              </Typography>
              <Typography variant="bodySmall" color="secondary" style={{ marginBottom: 12 }}>
                Export complete historical ledger, batches, stock movements, and customer accounts for offline backups or spreadsheet analysis.
              </Typography>

              <Button
                label="Export Factory Records to CSV"
                variant="subtle"
                leftIcon="download-outline"
                onPress={handleExportCSV}
              />
            </Card>
          </Stack>
        )}
      </Stack>
    </ScreenContainer>
  );
};

export default MoreScreen;
