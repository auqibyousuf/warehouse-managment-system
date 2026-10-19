import React from 'react';
import { ViewStyle } from 'react-native';
import { Surface as PanelSurface } from 'panelui-native';
import { theme } from '../../theme';
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
    | keyof typeof theme.colors.background
    | 'transparent'
    | 'brandWash'
    | 'brandPrimary'
    | 'amberWash'
    | 'redWash'
    | 'greenWash';
  borderRadius?: keyof typeof theme.radii;
  borderWidth?: number;
  borderColor?: keyof typeof theme.colors.border;
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
  const resolveBg = () => {
    if (!bg || bg === 'transparent') return 'transparent';
    if (bg === 'brandWash') return theme.colors.brand.wash;
    if (bg === 'brandPrimary') return theme.colors.brand.primary;
    if (bg === 'amberWash') return theme.colors.palette.amberWash;
    if (bg === 'redWash') return theme.colors.palette.redWash;
    if (bg === 'greenWash') return theme.colors.palette.greenWash;
    return theme.colors.background[bg];
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
    ...(borderColor !== undefined && { borderColor: theme.colors.border[borderColor] }),
    ...(flex !== undefined && { flex }),
    ...(align !== undefined && { alignItems: align }),
    ...(justify !== undefined && { justifyContent: justify }),
  };

  return (
    <PanelSurface
      variant="transparent"
      padding="none"
      className={className}
      style={[computedStyle, style]}
    >
      {children}
    </PanelSurface>
  );
};

export default Box;

