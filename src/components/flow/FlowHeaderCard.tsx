import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, useColors } from '../../theme';
import { Typography } from '../primitives/Typography';
import { Icon } from '../primitives/Icon';
import { Badge } from '../primitives/Badge';
import { ProgressBar } from '../composite/ProgressBar';

export interface FlowHeaderCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  tone?: 'primary' | 'success' | 'warning';
  title: string;
  description: string;
  chip?: string;
  /** Shows "Step n of m" with a progress bar. */
  step?: { current: number; total: number };
}

/** Opening card of a flow: what this page does, and where you are in it. */
export const FlowHeaderCard: React.FC<FlowHeaderCardProps> = ({
  icon,
  tone = 'primary',
  title,
  description,
  chip,
  step,
}) => {
  const colors = useColors();
  const fill =
    tone === 'success'
      ? colors.accent.success
      : tone === 'warning'
        ? colors.accent.warning
        : colors.brand.primary;
  const fg =
    tone === 'success'
      ? colors.onAccent.success
      : tone === 'warning'
        ? colors.onAccent.warning
        : colors.text.onBrand;
  return (
    <View
      style={{
        padding: theme.spacing.md,
        borderRadius: theme.radii.md,
        backgroundColor: colors.background.surface,
        gap: theme.spacing.sm,
        ...theme.shadows.card,
      }}
    >
      {step ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Typography variant="label" color="brandPrimary">
            Configuration flow
          </Typography>
          <Typography variant="bodySmall" color="secondary">
            Step {step.current} of {step.total}
          </Typography>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: theme.radii.md,
            backgroundColor: fill,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={24} color={fg} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Typography variant="h3" color="primary">
              {title}
            </Typography>
            {chip ? (
              <Badge
                label={chip}
                variant={tone === 'warning' ? 'warning' : tone === 'success' ? 'success' : 'info'}
                size="sm"
              />
            ) : null}
          </View>
          <Typography variant="bodySmall" color="secondary">
            {description}
          </Typography>
        </View>
      </View>
      {step ? <ProgressBar value={step.current / step.total} height={6} /> : null}
    </View>
  );
};

export default FlowHeaderCard;
