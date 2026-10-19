import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme, useColors } from '../../theme';
import { Modal } from './Modal';
import { Typography } from '../primitives/Typography';
import { Icon } from '../primitives/Icon';
import { Row } from '../primitives/Row';

export interface ConfirmDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = false,
  loading = false,
}) => {
  const colors = useColors();
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
      primaryAction={{
        label: confirmLabel,
        onPress: onConfirm,
        variant: isDestructive ? 'danger' : 'primary',
        loading,
      }}
      secondaryAction={{
        label: cancelLabel,
        onPress: onClose,
      }}
    >
      <View style={styles.content}>
        <Row gap="md" align="flex-start">
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: isDestructive ? colors.status.error.bg : colors.brand.wash,
              },
            ]}
          >
            <Icon
              name={isDestructive ? 'alert-circle' : 'information-circle'}
              size="lg"
              color={isDestructive ? 'error' : 'brandPrimary'}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Typography variant="body" color="secondary" style={styles.messageText}>
              {message}
            </Typography>
          </View>
        </Row>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: theme.spacing.sm,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    lineHeight: 22,
  },
});

export default ConfirmDialog;
