import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, useColors } from '../../theme';
import { Typography } from '../primitives/Typography';
import { IconTile, IconTileTone } from '../composite/IconTile';

export interface SelectedCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  tone?: IconTileTone;
  title: string;
  subtitle?: string;
  /** Right-aligned content such as a status chip or a figure. */
  right?: React.ReactNode;
}

/** The currently chosen item (material, recipe, customer) in a tinted box. */
export const SelectedCard: React.FC<SelectedCardProps> = ({
  icon,
  tone = 'primary',
  title,
  subtitle,
  right,
}) => {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: theme.radii.md,
        backgroundColor: colors.background.surfaceSecondary,
      }}
    >
      <IconTile icon={icon} tone={tone} size={40} />
      <View style={{ flex: 1 }}>
        <Typography variant="title" color="primary" numberOfLines={2}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="bodySmall" color="secondary" numberOfLines={2}>
            {subtitle}
          </Typography>
        ) : null}
      </View>
      {right}
    </View>
  );
};

export default SelectedCard;
