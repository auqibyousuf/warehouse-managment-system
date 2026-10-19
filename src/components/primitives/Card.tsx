import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Card as PanelCard, AnimatedPressable } from 'panelui-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme';

export type CardVariant = 'elevated' | 'outlined' | 'flat' | 'accent' | 'interactive';
export type CardPadding = 'none' | 'compact' | 'normal' | 'spacious';

export interface CardProps {
  variant?: CardVariant;
  padding?: CardPadding;
  onPress?: () => void;
  className?: string;
  style?: ViewStyle | (ViewStyle | undefined)[];
  children: React.ReactNode;
}

export const CardComponent: React.FC<CardProps> = ({
  variant = 'elevated',
  padding = 'normal',
  onPress,
  className,
  style,
  children,
}) => {
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
          backgroundColor: theme.colors.background.surface,
          borderColor: theme.colors.border.default,
          borderWidth: 1,
          ...theme.shadows.none,
        };
      case 'flat':
        return {
          backgroundColor: theme.colors.background.surfaceSecondary,
          borderColor: 'transparent',
          borderWidth: 0,
          ...theme.shadows.none,
        };
      case 'accent':
        return {
          backgroundColor: theme.colors.brand.wash,
          borderColor: theme.colors.brand.subtle,
          borderWidth: 1,
          ...theme.shadows.none,
        };
      case 'interactive':
      case 'elevated':
      default:
        return {
          backgroundColor: theme.colors.background.surface,
          borderColor: theme.colors.border.subtle,
          borderWidth: 1,
          ...theme.shadows.card,
        };
    }
  };

  const baseCardStyle: ViewStyle = {
    borderRadius: theme.radii.md,
    padding: getPadding(),
    overflow: 'hidden',
    ...getVariantStyles(),
  };

  const combinedStyle = Array.isArray(style)
    ? [baseCardStyle, ...style]
    : [baseCardStyle, style];

  if (onPress || variant === 'interactive') {
    return (
      <AnimatedPressable
        className={`rounded-lg overflow-hidden ${className || ''}`}
        pressScale={0.98}
        pressOpacity={0.92}
        onPress={() => {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch {}
          if (onPress) onPress();
        }}
        style={combinedStyle}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <PanelCard
      className={`rounded-lg overflow-hidden ${className || ''}`}
      style={combinedStyle}
    >
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

