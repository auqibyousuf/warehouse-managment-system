import React from 'react';
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme, useColors } from '../../theme';
import { Box } from '../primitives/Box';

export interface ScreenContainerProps {
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  children: React.ReactNode;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  scrollable = true,
  refreshing = false,
  onRefresh,
  style,
  contentContainerStyle,
  children,
}) => {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background.canvas,
    ...style,
  };

  const innerContentStyle: ViewStyle = {
    paddingHorizontal: theme.spacing.layout.screenPaddingHorizontal,
    paddingTop: theme.spacing.md,
    paddingBottom: (theme.spacing.xxxl as number) + insets.bottom,
    ...contentContainerStyle,
  };

  if (!scrollable) {
    return (
      <Box flex={1} bg="canvas" style={[innerContentStyle, style]}>
        {children}
      </Box>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={containerStyle}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={innerContentStyle}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brand.primary}
              colors={[colors.brand.primary]}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
});

export default ScreenContainer;
