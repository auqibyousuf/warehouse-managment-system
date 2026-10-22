import React from 'react';
import { useMoney } from '../../../hooks/useMoney';
import { BatchBreakdown } from '../../../utils/batchEstimates';
import { Badge, Button, Divider, Row, Stack, Typography } from '../../../components';

export interface BatchBreakdownViewProps {
  breakdown: BatchBreakdown;
  outputUnit: string;
  baseUnit: string;
  /** Selling price of one pack, shown next to the sales value. */
  price: number;
  /** Hint when the breakdown is only an estimate. */
  estimate?: boolean;
  /** Opens the selling price page for this item; shown only while no price is set. */
  onAddPrice?: () => void;
}

/** Total production, where the cost goes, what the batch added and what is gained. */
export const BatchBreakdownView: React.FC<BatchBreakdownViewProps> = ({
  breakdown: b,
  outputUnit,
  baseUnit,
  price,
  estimate,
  onAddPrice,
}) => {
  const money = useMoney();
  const row = (
    label: string,
    value: string,
    opts?: { strong?: boolean; color?: 'success' | 'error' },
  ) => (
    <Row justify="space-between" align="center" gap="sm">
      <Typography
        variant={opts?.strong ? 'title' : 'bodySmall'}
        color={opts?.strong ? 'primary' : 'secondary'}
        style={{ flexShrink: 1 }}
      >
        {label}
      </Typography>
      <Typography
        variant={opts?.strong ? 'dataLarge' : 'dataMedium'}
        color={opts?.color ?? 'primary'}
        tabular
      >
        {value}
      </Typography>
    </Row>
  );

  return (
    <Stack gap="sm">
      <Typography variant="label" color="muted">
        {estimate ? 'Expected production' : 'Total production'}
      </Typography>
      {b.units > 0 ? (
        row(
          `${b.units.toLocaleString('en-IN')} ${outputUnit}`,
          b.totalQuantity > 0 ? `${b.totalQuantity.toLocaleString('en-IN')} ${baseUnit}` : '',
          { strong: true },
        )
      ) : (
        <Typography variant="bodySmall" color="secondary">
          Enter the output to see totals per pack.
        </Typography>
      )}

      <Divider variant="subtle" spacing="xs" />
      <Typography variant="label" color="muted">
        Where the cost goes
      </Typography>
      {b.lines.map((l) => (
        <Row key={l.name} justify="space-between" align="flex-start" gap="sm">
          <Stack gap="none" style={{ flex: 1 }}>
            <Typography variant="bodyMedium" color="primary" numberOfLines={1}>
              {l.name}
            </Typography>
            <Typography variant="caption" color="muted">
              {l.quantity} {l.unit} × {money(l.rate)} · {l.sharePct}%
            </Typography>
          </Stack>
          <Typography variant="dataMedium" tabular>
            {money(l.cost)}
          </Typography>
        </Row>
      ))}
      {row('Materials', money(b.materialsCost))}
      {b.packagingCost > 0 && row('Packaging', money(b.packagingCost))}
      {row('Total cost', money(b.totalCost), { strong: true })}
      {b.units > 0 && (
        <Row gap="xs" wrap>
          <Badge label={`${money(b.costPerUnit)} / ${outputUnit}`} variant="neutral" size="sm" />
          {b.costPerBaseUnit > 0 && (
            <Badge
              label={`${money(b.costPerBaseUnit)} / ${baseUnit}`}
              variant="neutral"
              size="sm"
            />
          )}
        </Row>
      )}

      <Divider variant="subtle" spacing="xs" />
      <Typography variant="label" color="muted">
        What you gain
      </Typography>
      {b.sales ? (
        <>
          {row(`Sales value at ${money(price)} each`, money(b.sales.salesValue))}
          {row('Value added (sales − materials)', money(b.sales.valueAdded))}
          {row('Gain (sales − total cost)', money(b.sales.gain), {
            strong: true,
            color: b.sales.gain >= 0 ? 'success' : 'error',
          })}
          <Row gap="xs" wrap>
            <Badge label={`${b.sales.marginPct}% margin`} variant="neutral" size="sm" />
            <Badge
              label={`${money(b.sales.gainPerUnit)} gain / ${outputUnit}`}
              variant="neutral"
              size="sm"
            />
            {b.sales.gainPerBaseUnit > 0 && (
              <Badge
                label={`${money(b.sales.gainPerBaseUnit)} gain / ${baseUnit}`}
                variant="neutral"
                size="sm"
              />
            )}
          </Row>
          <Typography variant="caption" color="muted">
            Before labour, power and other expenses, which are recorded under Expenses.
          </Typography>
        </>
      ) : (
        <Stack gap="xs">
          <Typography variant="bodySmall" color="secondary">
            {b.units > 0
              ? 'This item has no selling price yet, so value added and gain cannot be shown.'
              : 'Enter the output above to see value added and gain.'}
          </Typography>
          {onAddPrice && (
            <Button
              label="Add selling price"
              variant="subtle"
              size="sm"
              leftIcon="pricetag-outline"
              onPress={onAddPrice}
            />
          )}
        </Stack>
      )}
    </Stack>
  );
};

export default BatchBreakdownView;
