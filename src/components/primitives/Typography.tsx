import React from 'react';
import { TextProps as RNTextProps, TextStyle } from 'react-native';
import { Text as PanelText } from 'panelui-native';
import { theme, useColors, ColorTokens } from '../../theme';
import {
  textVariants,
  displayVariants,
  dataVariants,
  FontWeightKey,
} from '../../theme/tokens/typography';

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

const resolveTextColor = (colors: ColorTokens, color: TextColor): string => {
  const map: Record<TextColor, string> = {
    primary: colors.text.primary,
    secondary: colors.text.secondary,
    muted: colors.text.muted,
    subtle: colors.text.subtle,
    onBrand: colors.text.onBrand,
    onDark: colors.text.onDark,
    success: colors.text.success,
    warning: colors.text.warning,
    error: colors.text.error,
    info: colors.text.info,
    brandPrimary: colors.brand.primary,
    brandDeep: colors.brand.deep,
  };
  return map[color] || colors.text.primary;
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
  const colors = useColors();
  const variantStyle = theme.typography.variants[variant] || theme.typography.variants.body;
  const textColor = resolveTextColor(colors, color);
  const weightValue = weight ? theme.typography.fontWeights[weight] : variantStyle.fontWeight;
  const weightKey =
    (Object.keys(theme.typography.fontWeights) as FontWeightKey[]).find(
      (key) => theme.typography.fontWeights[key] === weightValue,
    ) ?? 'regular';
  const face = displayVariants.has(variant)
    ? theme.typography.fontFamilies.display
    : dataVariants.has(variant)
      ? theme.typography.fontFamilies.data
      : theme.typography.fontFamilies.body;

  const computedStyle: TextStyle = {
    ...variantStyle,
    color: textColor,
    // The face carries the weight; a separate fontWeight would fake-bold it on web.
    fontFamily: face[weightKey],
    fontWeight: 'normal',
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
