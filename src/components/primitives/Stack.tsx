import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { theme } from '../../theme';

export interface StackProps {
  gap?: keyof typeof theme.spacing;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  flex?: number;
  className?: string;
  style?: ViewStyle;
  children: React.ReactNode;
}

export const Stack: React.FC<StackProps> = ({
  gap = 'md',
  align = 'stretch',
  justify = 'flex-start',
  flex,
  className,
  style,
  children,
}) => {
  const gapValue = typeof theme.spacing[gap] === 'number' ? (theme.spacing[gap] as number) : 12;

  return (
    <View
      className={className}
      style={[
        styles.stack,
        {
          alignItems: align,
          justifyContent: justify,
          gap: gapValue,
          ...(flex !== undefined && { flex }),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  stack: {
    flexDirection: 'column',
  },
});

export default Stack;
