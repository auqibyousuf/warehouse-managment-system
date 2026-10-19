import './global.css';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PanelUIProvider } from 'panelui-native';
import { ThemeProvider } from './src/theme';
import { AppNavigator } from './src/navigation/AppNavigator';

// Initialize React Query Client with zero-refetch-on-focus defaults for mobile stability
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <PanelUIProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <StatusBar style="dark" />
            <AppNavigator />
          </QueryClientProvider>
        </ThemeProvider>
      </PanelUIProvider>
    </SafeAreaProvider>
  );
}

