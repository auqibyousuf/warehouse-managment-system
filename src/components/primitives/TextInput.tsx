import React from 'react';
import {
  View,
  TextInputProps as RNTextInputProps,
  ViewStyle,
} from 'react-native';
import { Input as PanelInput } from 'panelui-native';
import { Typography } from './Typography';
import { Icon } from './Icon';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

export interface FormTextInputProps extends RNTextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  containerStyle?: ViewStyle;
  className?: string;
}

export const TextInput: React.FC<FormTextInputProps> = ({
  label,
  hint,
  error,
  prefix,
  suffix,
  leftIcon,
  rightIcon,
  containerStyle,
  className,
  style,
  editable = true,
  ...rest
}) => {
  const startContent = (prefix || leftIcon) ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
      {leftIcon && <Icon name={leftIcon} size="sm" color="muted" />}
      {prefix && (
        <Typography variant="bodyMedium" weight="semibold" color="muted">
          {prefix}
        </Typography>
      )}
    </View>
  ) : undefined;

  const endContent = (suffix || rightIcon) ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
      {suffix && (
        <Typography variant="bodySmall" weight="medium" color="muted">
          {suffix}
        </Typography>
      )}
      {rightIcon && <Icon name={rightIcon} size="sm" color="muted" />}
    </View>
  ) : undefined;

  return (
    <View style={containerStyle}>
      <PanelInput
        label={label}
        description={hint}
        errorMessage={error}
        editable={editable}
        startContent={startContent}
        endContent={endContent}
        containerClassName={className}
        style={[{ borderRadius: theme.radii.md }, style]}
        {...rest}
      />
    </View>
  );
};

export default TextInput;

