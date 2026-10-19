import React from 'react';
import { TextProps as RNTextProps, TextStyle } from 'react-native';
import { Text as PanelText } from 'panelui-native';
import { theme } from '../../theme';
import { textVariants } from '../../theme/tokens/typography';

export type TypographyVariant = keyof typeof textVariants;

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'subtle'
  | 'onBrand'
  | 'onDark'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'brandPrimary'
  | 'brandDeep';

export interface TypographyProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: TextColor;
  weight?: keyof typeof theme.typography.fontWeights;
  align?: TextStyle['textAlign'];
  transform?: TextStyle['textTransform'];
  tabular?: boolean;
  className?: string;
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
}

const colorMap: Record<TextColor, string> = {
  primary: theme.colors.text.primary,
  secondary: theme.colors.text.secondary,
  muted: theme.colors.text.muted,
  subtle: theme.colors.text.subtle,
  onBrand: theme.colors.text.onBrand,
  onDark: theme.colors.text.onDark,
  success: theme.colors.text.success,
  warning: theme.colors.text.warning,
  error: theme.colors.text.error,
  info: theme.colors.text.info,
  brandPrimary: theme.colors.brand.primary,
  brandDeep: theme.colors.brand.deep,
};

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color = 'primary',
  weight,
  align,
  transform,
  tabular = false,
  className,
  style,
  children,
  ...rest
}) => {
  const variantStyle = theme.typography.variants[variant] || theme.typography.variants.body;
  const textColor = colorMap[color] || theme.colors.text.primary;
  const fontWeight = weight ? theme.typography.fontWeights[weight] : variantStyle.fontWeight;

  const computedStyle: TextStyle = {
    ...variantStyle,
    color: textColor,
    ...(fontWeight ? { fontWeight } : {}),
    ...(align ? { textAlign: align } : {}),
    ...(transform ? { textTransform: transform } : {}),
    ...(tabular ? { fontVariant: ['tabular-nums'] } : {}),
  };

  return (
    <PanelText className={className} style={[computedStyle, style]} {...rest}>
      {children}
    </PanelText>
  );
};

export default Typography;

