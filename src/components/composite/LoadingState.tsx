import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { theme, useColors } from '../../theme';
import { Typography } from '../primitives/Typography';

export interface LoadingStateProps {
  message?: string;
  style?: ViewStyle;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading factory data...',
  style,
}) => {
  const colors = useColors();
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size="large" color={colors.brand.primary} />
      {message && (
        <Typography variant="bodySmall" color="muted" style={styles.message}>
          {message}
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: theme.spacing.md,
  },
});

export default LoadingState;
