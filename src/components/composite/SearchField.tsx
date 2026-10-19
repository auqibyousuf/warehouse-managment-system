import React from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { theme, useColors } from '../../theme';
import { Icon } from '../primitives/Icon';

export interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChangeText,
  placeholder = 'Search',
}) => {
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.background.surfaceSecondary }]}>
      <Icon name="search" size={22} color="muted" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.subtle}
        accessibilityLabel={placeholder}
        style={[
          styles.input,
          { color: colors.text.primary, fontFamily: theme.typography.fontFamilies.body.regular },
        ]}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
        >
          <Icon name="close-circle" size="sm" color="subtle" />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    height: 44,
    borderRadius: theme.radii.md,
    ...theme.shadows.card,
  },
  input: { flex: 1, fontSize: 14, height: '100%' },
});

export default SearchField;
