import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { theme } from '../../theme';

export interface RowProps {
  gap?: keyof typeof theme.spacing;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  wrap?: boolean;
  flex?: number;
  className?: string;
  style?: ViewStyle;
  children: React.ReactNode;
}

export const Row: React.FC<RowProps> = ({
  gap = 'sm',
  align = 'center',
  justify = 'flex-start',
  wrap = false,
  flex,
  className,
  style,
  children,
}) => {
  const gapValue = typeof theme.spacing[gap] === 'number' ? (theme.spacing[gap] as number) : 8;

  return (
    <View
      className={className}
      style={[
        styles.row,
        {
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? 'wrap' : 'nowrap',
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
  row: {
    flexDirection: 'row',
  },
});

export default Row;
