import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { theme, useColors } from '../../theme';
import { Typography } from '../primitives/Typography';
import { Icon } from '../primitives/Icon';
import { Row } from '../primitives/Row';
import { Ionicons } from '@expo/vector-icons';

export type BannerVariant = 'success' | 'warning' | 'danger' | 'info';

export interface FeedbackBannerProps {
  title?: string;
  message: string;
  variant?: BannerVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  onClose?: () => void;
  style?: ViewStyle;
}

export const FeedbackBanner: React.FC<FeedbackBannerProps> = ({
  title,
  message,
  variant = 'info',
  icon,
  onPress,
  onClose,
  style,
}) => {
  const colors = useColors();
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          bg: colors.status.success.bg,
          border: colors.status.success.border,
          text: colors.status.success.text,
          iconName: (icon || 'checkmark-circle') as keyof typeof Ionicons.glyphMap,
          iconColor: colors.status.success.icon,
        };
      case 'warning':
        return {
          bg: colors.status.warning.bg,
          border: colors.status.warning.border,
          text: colors.status.warning.text,
          iconName: (icon || 'warning') as keyof typeof Ionicons.glyphMap,
          iconColor: colors.status.warning.icon,
        };
      case 'danger':
        return {
          bg: colors.status.error.bg,
          border: colors.status.error.border,
          text: colors.status.error.text,
          iconName: (icon || 'alert-circle') as keyof typeof Ionicons.glyphMap,
          iconColor: colors.status.error.icon,
        };
      case 'info':
      default:
        return {
          bg: colors.status.info.bg,
          border: colors.status.info.border,
          text: colors.status.info.text,
          iconName: (icon || 'information-circle') as keyof typeof Ionicons.glyphMap,
          iconColor: colors.status.info.icon,
        };
    }
  };

  const currentTheme = getVariantStyles();

  const content = (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: currentTheme.bg,
          borderColor: currentTheme.border,
        },
        style,
      ]}
    >
      <Row gap="sm" align="flex-start" style={{ flex: 1 }}>
        <Icon
          name={currentTheme.iconName}
          size="sm"
          color={currentTheme.iconColor}
          style={styles.icon}
        />
        <View style={{ flex: 1 }}>
          {title && (
            <Typography variant="bodySmall" weight="bold" style={{ color: currentTheme.text }}>
              {title}
            </Typography>
          )}
          <Typography
            variant="caption"
            style={{ color: currentTheme.text, marginTop: title ? 2 : 0 }}
          >
            {message}
          </Typography>
        </View>
      </Row>

      {onClose && (
        <Pressable
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss message"
        >
          <Icon name="close" size="xs" color={currentTheme.iconColor} />
        </Pressable>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button">
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    marginVertical: theme.spacing.xs,
  },
  icon: {
    marginTop: theme.spacing.xxs,
  },
});

export default FeedbackBanner;
