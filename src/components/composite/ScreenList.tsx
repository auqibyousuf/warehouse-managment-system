import React, { useMemo } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  ListRenderItem,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme, useColors, ColorTokens } from '../../theme';

export interface ScreenListProps<T> {
  /** Scrolls with the list: module title, tab switcher, filters. */
  header: React.ReactElement;
  data: readonly T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T) => string;
  /** Shown instead of rows while loading or when there is nothing to list. */
  placeholder?: React.ReactElement | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Shown after the last row (e.g. a download button). */
  footer?: React.ReactElement;
  /** Wrap all rows in one visual group (e.g. a ledger inside a single card). */
  rowGap?: number;
}

/**
 * Virtualized counterpart of ScreenContainer: same paddings, refresh and keyboard behavior,
 * but rows are windowed so long ledgers stay fast.
 */
export const ScreenList = <T,>({
  header,
  data,
  renderItem,
  keyExtractor,
  placeholder,
  refreshing = false,
  onRefresh,
  rowGap = theme.spacing.md,
  footer,
}: ScreenListProps<T>) => {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <FlatList
        style={styles.flex}
        data={placeholder ? [] : (data as T[])}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={header}
        ListEmptyComponent={placeholder ?? undefined}
        ListFooterComponent={footer}
        ItemSeparatorComponent={() => <View style={{ height: rowGap }} />}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.layout.screenPaddingHorizontal,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.xxxl + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        windowSize={7}
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
      />
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background.canvas },
  });
