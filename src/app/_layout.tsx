import '../../global.css';
import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';
import {
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
} from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PanelUIProvider } from 'panelui-native';
import { ThemeProvider, theme, useColors, ColorTokens } from '../theme';
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
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
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
            <StatusBar style="auto" />
            <Shell />
          </QueryClientProvider>
        </ThemeProvider>
      </PanelUIProvider>
    </SafeAreaProvider>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background.canvas,
    },
    screens: {
      flex: 1,
    },
  });
