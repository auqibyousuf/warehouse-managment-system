import React from 'react';
import { ViewStyle } from 'react-native';
import { Card as PanelCard, AnimatedPressable } from 'panelui-native';
import { tapLight } from '../../utils/haptics';
import { theme, useColors } from '../../theme';

export type CardVariant = 'elevated' | 'outlined' | 'flat' | 'accent' | 'interactive';
export type CardPadding = 'none' | 'compact' | 'normal' | 'spacious';
export type CardTone = 'warning' | 'success' | 'danger' | 'info';

export interface CardProps {
  variant?: CardVariant;
  padding?: CardPadding;
  /** Tinted card for alerts and highlights (no border), e.g. a low-stock warning. */
  tone?: CardTone;
  onPress?: () => void;
  className?: string;
  style?: ViewStyle | (ViewStyle | undefined)[];
  children: React.ReactNode;
}

export const CardComponent: React.FC<CardProps> = ({
  variant = 'elevated',
  padding = 'normal',
  tone,
  onPress,
  className,
  style,
  children,
}) => {
  const colors = useColors();
  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'compact':
        return theme.spacing.layout.cardPaddingCompact;
      case 'spacious':
        return theme.spacing.xl;
      case 'normal':
      default:
        return theme.spacing.layout.cardPadding;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: colors.background.surface,
          borderColor: colors.border.default,
          borderWidth: 1,
          ...theme.shadows.none,
        };
      case 'flat':
        return {
          backgroundColor: colors.background.surfaceSecondary,
          borderColor: 'transparent',
          borderWidth: 0,
          ...theme.shadows.none,
        };
      case 'accent':
        return {
          backgroundColor: colors.brand.wash,
          borderColor: 'transparent',
          borderWidth: 0,
          ...theme.shadows.none,
        };
      case 'interactive':
      case 'elevated':
      default:
        // Stitch: white card, no border, soft shadow. Dark mode keeps a hairline since shadows vanish.
        return {
          backgroundColor: colors.background.surface,
          borderColor: colors.border.subtle,
          borderWidth: colors.scheme === 'dark' ? 1 : 0,
          ...theme.shadows.card,
        };
    }
  };

  const toneColors = tone ? colors.status[tone === 'danger' ? 'error' : tone] : null;
  const toneStyles = toneColors
    ? {
        backgroundColor: toneColors.bg,
        borderColor: toneColors.border,
        borderWidth: colors.scheme === 'dark' ? 1 : 0,
        ...theme.shadows.none,
      }
    : null;

  const baseCardStyle: ViewStyle = {
    borderRadius: theme.radii.xl,
    padding: getPadding(),
    overflow: 'hidden',
    ...getVariantStyles(),
    ...(toneStyles ?? {}),
  };

  const combinedStyle = Array.isArray(style) ? [baseCardStyle, ...style] : [baseCardStyle, style];

  if (onPress || variant === 'interactive') {
    return (
      <AnimatedPressable
        className={className}
        accessibilityRole="button"
        pressScale={0.98}
        pressOpacity={0.92}
        onPress={() => {
          tapLight();
          if (onPress) onPress();
        }}
        style={combinedStyle}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <PanelCard className={className} style={combinedStyle}>
      {children}
    </PanelCard>
  );
};

export const Card = Object.assign(CardComponent, {
  Header: PanelCard.Header,
  Title: PanelCard.Title,
  Description: PanelCard.Description,
  Content: PanelCard.Content,
  Footer: PanelCard.Footer,
});

export default Card;
