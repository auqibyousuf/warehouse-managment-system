import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme, useColors, ColorTokens } from '../../theme';
import { TextColor } from './Typography';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface IconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: IconSize | number;
  color?: TextColor | string;
  style?: any;
}

const sizeMap: Record<IconSize, number> = {
  xs: 14,
  sm: theme.spacing.layout.iconSizeSm, // 16
  md: theme.spacing.layout.iconSizeMd, // 20
  lg: theme.spacing.layout.iconSizeLg, // 24
  xl: theme.spacing.layout.iconSizeXl, // 28
};

const resolveColor = (colors: ColorTokens, color: TextColor | string): string => {
  switch (color) {
    case 'primary':
      return colors.text.primary;
    case 'secondary':
      return colors.text.secondary;
    case 'muted':
      return colors.text.muted;
    case 'subtle':
      return colors.text.subtle;
    case 'onBrand':
    case 'onDark':
      return colors.text.onBrand;
    case 'success':
      return colors.text.success;
    case 'warning':
      return colors.text.warning;
    case 'error':
      return colors.text.error;
    case 'info':
      return colors.text.info;
    case 'brandPrimary':
      return colors.brand.primary;
    case 'brandDeep':
      return colors.brand.deep;
    default:
      return color;
  }
};

export const Icon: React.FC<IconProps> = ({ name, size = 'md', color = 'primary', style }) => {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 20;
  const colors = useColors();
  const hexColor = resolveColor(colors, color);

  return <Ionicons name={name} size={pixelSize} color={hexColor} style={style} />;
};

export default Icon;
