import React, { useState } from 'react';
import { useMoney } from '../../hooks/useMoney';
import { useCustomers } from '../../hooks/api/useCustomers';
import { generateBusinessReportPDF } from '../../utils/pdfGenerator';
import { useDashboardMetrics, useFactorySettings } from '../../hooks/api/useDashboard';
import { FilterPeriod, useAppStore } from '../../stores/useAppStore';
import { openManage } from '../../navigation/routes';
import { Button, Card, Divider, Modal, Row, Stack, Typography } from '../../components';

const PERIOD_LABEL: Record<FilterPeriod, string> = {
  today: 'today',
  this_week: 'this week',
  this_month: 'this month',
  all_time: 'all time',
};

export interface ProfitDetailModalProps {
  visible: boolean;
  onClose: () => void;
  period?: string | null;
}

/** How the estimated operating profit is made up. */
export const ProfitDetailModal: React.FC<ProfitDetailModalProps> = ({
  visible,
  onClose,
  period,
}) => {
  const money = useMoney();
  const selected =
    (period as FilterPeriod) in PERIOD_LABEL ? (period as FilterPeriod) : 'this_month';
  const { data: metrics } = useDashboardMetrics(selected);
  const { data: settings } = useFactorySettings();
  const { data: customers = [] } = useCustomers();
  const setBannerAlert = useAppStore((st) => st.setBannerAlert);
  const [sharing, setSharing] = useState(false);
  const f = metrics?.financial;

  const shareReport = async () => {
    if (!metrics) return;
    setSharing(true);
    try {
      await generateBusinessReportPDF({
        metrics,
        settings,
        periodLabel: PERIOD_LABEL[selected],
        owing: customers
          .filter((c) => c.outstandingBalance > 0)
          .sort((a, b) => b.outstandingBalance - a.outstandingBalance)
          .map((c) => ({ name: c.name, amount: c.outstandingBalance })),
      });
    } catch (err: any) {
      setBannerAlert({ title: 'Could not create report', message: err.message, variant: 'danger' });
    } finally {
      setSharing(false);
    }
  };
  const profit = f?.estimatedOperatingProfit ?? 0;

  const line = (label: string, value: number, sign: '+' | '−', color: 'primary' | 'error') => (
    <Row justify="space-between">
      <Typography variant="bodyMedium" color="secondary">
        {label}
      </Typography>
      <Typography variant="dataMedium" color={color} tabular>
        {sign}
        {money(value)}
      </Typography>
    </Row>
  );

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Operating profit"
      subtitle={`Estimate for ${PERIOD_LABEL[selected]}`}
      secondaryAction={{ label: 'Close', onPress: onClose }}
      primaryAction={{
        label: 'Share report (PDF)',
        onPress: shareReport,
        loading: sharing,
      }}
    >
      <Stack gap="md">
        <Typography variant="h1" color={profit >= 0 ? 'success' : 'error'} tabular>
          {money(profit)}
        </Typography>

        <Card variant="flat" padding="compact">
          <Stack gap="xs">
            {line('Sales revenue', f?.salesRevenue ?? 0, '+', 'primary')}
            {line('Cost of goods sold', f?.costOfGoodsSold ?? 0, '−', 'error')}
            {line('Operating expenses', f?.operatingExpenses ?? 0, '−', 'error')}
            <Divider variant="subtle" spacing="xs" />
            <Row justify="space-between">
              <Typography variant="bodyMedium" weight="semibold" color="primary">
                Estimated profit
              </Typography>
              <Typography variant="dataMedium" color={profit >= 0 ? 'success' : 'error'} tabular>
                {money(profit)}
              </Typography>
            </Row>
          </Stack>
        </Card>

        <Stack gap="xs">
          <Typography variant="bodySmall" color="secondary">
            Cash collected: {money(f?.cashCollected ?? 0)}. Money received is not the same as
            revenue, which counts when goods are invoiced.
          </Typography>
          <Typography variant="bodySmall" color="secondary">
            Production cost this period: {money(f?.productionCost ?? 0)}. Unsold finished stock
            stays in inventory and is not counted as cost of goods sold.
          </Typography>
        </Stack>

        <Row gap="sm" wrap>
          <Button
            label="Expenses"
            variant="subtle"
            size="sm"
            leftIcon="wallet-outline"
            onPress={() => {
              onClose();
              openManage('/expenses');
            }}
          />
          <Button
            label="Financial ledger"
            variant="subtle"
            size="sm"
            leftIcon="book-outline"
            onPress={() => {
              onClose();
              openManage('/ledger');
            }}
          />
        </Row>
      </Stack>
    </Modal>
  );
};

export default ProfitDetailModal;
