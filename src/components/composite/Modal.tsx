import React from 'react';
import {
  Modal as RNModal,
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { Typography } from '../primitives/Typography';
import { Icon } from '../primitives/Icon';
import { Button } from '../primitives/Button';
import { Row } from '../primitives/Row';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  primaryAction?: {
    label: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'danger' | 'success';
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  children,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View
          style={[
            styles.sheetContainer,
            {
              paddingBottom: Math.max(insets.bottom, theme.spacing.base),
            },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <Row justify="space-between" align="flex-start" style={styles.header}>
            <View style={{ flex: 1, paddingRight: theme.spacing.md }}>
              <Typography variant="h3" weight="bold" color="primary">
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="muted" style={{ marginTop: 2 }}>
                  {subtitle}
                </Typography>
              )}
            </View>

            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close" size="sm" color="muted" />
            </Pressable>
          </Row>

          {/* Scrollable Body */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>

          {/* Optional Footer */}
          {(primaryAction || secondaryAction) && (
            <Row gap="sm" style={styles.footer}>
              {secondaryAction && (
                <Button
                  label={secondaryAction.label}
                  onPress={secondaryAction.onPress}
                  variant="subtle"
                  style={{ flex: 1 }}
                />
              )}
              {primaryAction && (
                <Button
                  label={primaryAction.label}
                  onPress={primaryAction.onPress}
                  variant={primaryAction.variant || 'primary'}
                  loading={primaryAction.loading}
                  disabled={primaryAction.disabled}
                  style={{ flex: 1 }}
                />
              )}
            </Row>
          )}
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay.backdrop,
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: theme.colors.background.surface,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    maxHeight: '90%',
    ...theme.shadows.modal,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.border.medium,
  },
  header: {
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.background.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    maxHeight: 460,
  },
  bodyContent: {
    padding: theme.spacing.base,
  },
  footer: {
    paddingHorizontal: theme.spacing.base,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
});

export default Modal;
