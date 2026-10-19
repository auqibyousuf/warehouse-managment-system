import '../../global.css';
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PanelUIProvider } from 'panelui-native';
import { ThemeProvider, theme } from '../theme';
import { useAppStore } from '../stores/useAppStore';
import { FeedbackBanner, Box } from '../components';

SplashScreen.preventAutoHideAsync().catch(() => {});

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
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  // Wait for the type system so text never flashes in a fallback face.
  if (!fontsLoaded && !fontError) return null;

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
