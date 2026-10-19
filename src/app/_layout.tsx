import '../../global.css';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PanelUIProvider } from 'panelui-native';
import { ThemeProvider, theme } from '../theme';
import { useAppStore } from '../stores/useAppStore';
import { FeedbackBanner, Box } from '../components';

// Zero-refetch-on-focus defaults for mobile stability
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

const Shell: React.FC = () => {
  const insets = useSafeAreaInsets();
  const bannerAlert = useAppStore((s) => s.bannerAlert);
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {bannerAlert && (
        <Box paddingHorizontal="base" paddingTop="xs">
          <FeedbackBanner
            title={bannerAlert.title}
            message={bannerAlert.message}
            variant={bannerAlert.variant}
            onClose={() => setBannerAlert(null)}
          />
        </Box>
      )}

      <View style={styles.screens}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="sheets/[sheet]"
            options={{ presentation: 'transparentModal', animation: 'none' }}
          />
        </Stack>
      </View>
    </View>
  );
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PanelUIProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <StatusBar style="dark" />
            <Shell />
          </QueryClientProvider>
        </ThemeProvider>
      </PanelUIProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background.canvas,
  },
  screens: {
    flex: 1,
  },
});
