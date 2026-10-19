import React from 'react';
import { ViewStyle } from 'react-native';
import { Separator as PanelSeparator } from 'panelui-native';
import { theme, useColors } from '../../theme';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'subtle' | 'default' | 'medium' | 'brand';
  spacing?: keyof typeof theme.spacing;
  className?: string;
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  variant = 'default',
  spacing = 'sm',
  className,
  style,
}) => {
  const colors = useColors();
  const getColor = () => {
    switch (variant) {
      case 'subtle':
        return colors.border.subtle;
      case 'medium':
        return colors.border.medium;
      case 'brand':
        return colors.brand.subtle;
      case 'default':
      default:
        return colors.border.default;
    }
  };

  const marginValue =
    typeof theme.spacing[spacing] === 'number' ? (theme.spacing[spacing] as number) : 8;

  return (
    <PanelSeparator
      orientation={orientation}
      className={className}
      style={[
        orientation === 'vertical'
          ? { backgroundColor: getColor(), marginHorizontal: marginValue }
          : { backgroundColor: getColor(), marginVertical: marginValue },
        style,
      ]}
    />
  );
};

export default Divider;
