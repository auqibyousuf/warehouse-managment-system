import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme, useColors, ColorTokens } from '../../theme';
import { Typography } from '../primitives/Typography';
import { Icon } from '../primitives/Icon';
import { Button } from '../primitives/Button';
import { Ionicons } from '@expo/vector-icons';

export interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'cube-outline',
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Icon name={icon} size="xl" color="brandPrimary" />
      </View>
      <Typography variant="title" weight="bold" color="primary" style={styles.title}>
        {title}
      </Typography>
      <Typography variant="body" color="muted" align="center" style={styles.description}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="primary"
          size="sm"
          style={styles.actionBtn}
        />
      )}
    </View>
  );
};

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
      marginVertical: theme.spacing.lg,
    },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: theme.radii.full,
      backgroundColor: colors.brand.wash,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    title: {
      marginBottom: theme.spacing.xs,
      textAlign: 'center',
    },
    description: {
      maxWidth: 280,
      marginBottom: theme.spacing.md,
    },
    actionBtn: {
      marginTop: theme.spacing.xs,
    },
  });

export default EmptyState;
