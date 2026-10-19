import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
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

const resolveColor = (color: TextColor | string): string => {
  switch (color) {
    case 'primary':
      return theme.colors.text.primary;
    case 'secondary':
      return theme.colors.text.secondary;
    case 'muted':
      return theme.colors.text.muted;
    case 'subtle':
      return theme.colors.text.subtle;
    case 'onBrand':
    case 'onDark':
      return theme.colors.text.onBrand;
    case 'success':
      return theme.colors.text.success;
    case 'warning':
      return theme.colors.text.warning;
    case 'error':
      return theme.colors.text.error;
    case 'info':
      return theme.colors.text.info;
    case 'brandPrimary':
      return theme.colors.brand.primary;
    case 'brandDeep':
      return theme.colors.brand.deep;
    default:
      return color;
  }
};

export const Icon: React.FC<IconProps> = ({ name, size = 'md', color = 'primary', style }) => {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 20;
  const hexColor = resolveColor(color);

  return <Ionicons name={name} size={pixelSize} color={hexColor} style={style} />;
};

export default Icon;
