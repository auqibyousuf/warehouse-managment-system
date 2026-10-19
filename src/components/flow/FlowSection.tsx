import React from 'react';
import { Pressable, View } from 'react-native';
import { theme } from '../../theme';
import { Card } from '../primitives/Card';
import { Typography } from '../primitives/Typography';
import { Icon } from '../primitives/Icon';
import { Ionicons } from '@expo/vector-icons';

export interface FlowSectionProps {
  /** Mono caps label, e.g. "Material selection". */
  label: string;
  hint?: string;
  action?: { label: string; icon?: keyof typeof Ionicons.glyphMap; onPress: () => void };
  children: React.ReactNode;
}

/** A labelled card in a flow, with an optional link on the right ("Change item"). */
export const FlowSection: React.FC<FlowSectionProps> = ({ label, hint, action, children }) => (
  <Card variant="elevated" padding="compact">
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
      }}
    >
      <Typography variant="label" color="muted">
        {label}
      </Typography>
      {action ? (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <Typography variant="bodySmall" weight="semibold" color="brandPrimary">
            {action.label}
          </Typography>
          {action.icon ? <Icon name={action.icon} size={16} color="brandPrimary" /> : null}
        </Pressable>
      ) : hint ? (
        <Typography variant="bodySmall" color="muted">
          {hint}
        </Typography>
      ) : null}
    </View>
    <View style={{ gap: theme.spacing.sm }}>{children}</View>
  </Card>
);

export default FlowSection;
