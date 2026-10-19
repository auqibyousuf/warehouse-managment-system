import React from 'react';
import { View, ViewStyle } from 'react-native';
import { theme, useColors, ColorTokens } from '../../theme';
import { spacingScale } from '../../theme/tokens/spacing';

export type BoxSpacing = keyof typeof spacingScale | 'compact';

export interface BoxProps {
  padding?: BoxSpacing;
  paddingHorizontal?: BoxSpacing;
  paddingVertical?: BoxSpacing;
  paddingTop?: BoxSpacing;
  paddingBottom?: BoxSpacing;
  margin?: BoxSpacing;
  marginHorizontal?: BoxSpacing;
  marginVertical?: BoxSpacing;
  marginTop?: BoxSpacing;
  marginBottom?: BoxSpacing;
  bg?:
    | keyof ColorTokens['background']
    | 'transparent'
    | 'brandWash'
    | 'brandPrimary'
    | 'amberWash'
    | 'redWash'
    | 'greenWash';
  borderRadius?: keyof typeof theme.radii;
  borderWidth?: number;
  borderColor?: keyof ColorTokens['border'];
  flex?: number;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  className?: string;
  style?: ViewStyle | (ViewStyle | undefined)[];
  children?: React.ReactNode;
}

const resolveSpacing = (val?: BoxSpacing): number | undefined => {
  if (val === undefined) return undefined;
  if (val === 'compact') return theme.spacing.layout.cardPaddingCompact;
  return spacingScale[val];
};

export const Box: React.FC<BoxProps> = ({
  padding,
  paddingHorizontal,
  paddingVertical,
  paddingTop,
  paddingBottom,
  margin,
  marginHorizontal,
  marginVertical,
  marginTop,
  marginBottom,
  bg,
  borderRadius,
  borderWidth,
  borderColor,
  flex,
  align,
  justify,
  className,
  style,
  children,
}) => {
  const colors = useColors();
  const resolveBg = () => {
    if (!bg || bg === 'transparent') return 'transparent';
    if (bg === 'brandWash') return colors.brand.wash;
    if (bg === 'brandPrimary') return colors.brand.primary;
    if (bg === 'amberWash') return colors.status.warning.bg;
    if (bg === 'redWash') return colors.status.error.bg;
    if (bg === 'greenWash') return colors.status.success.bg;
    return colors.background[bg];
  };

  const computedStyle: ViewStyle = {
    ...(padding !== undefined && { padding: resolveSpacing(padding) }),
    ...(paddingHorizontal !== undefined && {
      paddingHorizontal: resolveSpacing(paddingHorizontal),
    }),
    ...(paddingVertical !== undefined && {
      paddingVertical: resolveSpacing(paddingVertical),
    }),
    ...(paddingTop !== undefined && {
      paddingTop: resolveSpacing(paddingTop),
    }),
    ...(paddingBottom !== undefined && {
      paddingBottom: resolveSpacing(paddingBottom),
    }),
    ...(margin !== undefined && { margin: resolveSpacing(margin) }),
    ...(marginHorizontal !== undefined && {
      marginHorizontal: resolveSpacing(marginHorizontal),
    }),
    ...(marginVertical !== undefined && {
      marginVertical: resolveSpacing(marginVertical),
    }),
    ...(marginTop !== undefined && { marginTop: resolveSpacing(marginTop) }),
    ...(marginBottom !== undefined && {
      marginBottom: resolveSpacing(marginBottom),
    }),
    ...(bg !== undefined && { backgroundColor: resolveBg() }),
    ...(borderRadius !== undefined && { borderRadius: theme.radii[borderRadius] }),
    ...(borderWidth !== undefined && { borderWidth }),
    ...(borderColor !== undefined && { borderColor: colors.border[borderColor] }),
    ...(flex !== undefined && { flex }),
    ...(align !== undefined && { alignItems: align }),
    ...(justify !== undefined && { justifyContent: justify }),
  };

  return (
    // A plain View on purpose: PanelUI's Surface adds overflow-hidden + a 12px radius,
    // which clipped borders, shadows and text of everything wrapped in a Box.
    <View className={className} style={[computedStyle, style]}>
      {children}
    </View>
  );
};

export default Box;
