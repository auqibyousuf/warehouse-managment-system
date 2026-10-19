import React, { useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme, useColors, ColorTokens } from '../../theme';
import { Typography } from '../primitives/Typography';
import { Icon } from '../primitives/Icon';

export interface FlowPageProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Stitch full-page flow: back arrow, BATCHIQ label and page title on a flat bar,
 * then a scrolling stack of labelled cards. Used by Add Stock, Use Stock, Start Batch, Create Invoice.
 */
export const FlowPage: React.FC<FlowPageProps> = ({ title, onClose, children }) => {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.page}>
      <View style={styles.bar}>
        <Pressable
          onPress={onClose}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Icon name="arrow-back" size={22} color="primary" />
        </Pressable>
        <View style={styles.titles}>
          <Typography variant="label" color="brandPrimary">
            BatchIQ
          </Typography>
          <Typography variant="title" color="primary" numberOfLines={1}>
            {title}
          </Typography>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: colors.background.canvas },
    flex: { flex: 1 },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 64,
      paddingHorizontal: theme.spacing.xs,
      backgroundColor: colors.background.canvas,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: colors.scheme === 'dark' ? 0.4 : 0.04,
      shadowRadius: 8,
      elevation: 2,
      zIndex: 2,
    },
    back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    titles: { flex: 1, marginLeft: theme.spacing.xs },
    content: { padding: theme.spacing.base, gap: theme.spacing.base },
  });

export default FlowPage;
