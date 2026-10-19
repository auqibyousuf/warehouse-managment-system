import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, useColors } from '../../theme';
import { Icon } from '../primitives/Icon';

export type IconTileTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface IconTileProps {
  icon: keyof typeof Ionicons.glyphMap;
  tone?: IconTileTone;
  /** Tile edge in px. Stitch uses 28, 32 and 40. */
  size?: 28 | 32 | 40;
}

/** Tinted rounded-square icon holder (Stitch status and list icons). */
export const IconTile: React.FC<IconTileProps> = ({ icon, tone = 'primary', size = 32 }) => {
  const colors = useColors();
  const palette = {
    primary: { bg: colors.brand.wash, fg: colors.brand.primary },
    success: { bg: colors.status.success.bg, fg: colors.status.success.icon },
    warning: { bg: colors.status.warning.bg, fg: colors.status.warning.icon },
    danger: { bg: colors.status.error.bg, fg: colors.status.error.icon },
    info: { bg: colors.status.info.bg, fg: colors.status.info.icon },
    neutral: { bg: colors.background.surfaceTertiary, fg: colors.text.secondary },
  }[tone];

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: theme.radii.xl,
        backgroundColor: palette.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} size={Math.round(size * 0.56)} color={palette.fg} />
    </View>
  );
};

export default IconTile;
