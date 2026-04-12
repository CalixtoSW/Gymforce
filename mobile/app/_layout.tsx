import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AppState } from 'react-native';
import { useEffect, useMemo } from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import { registerForPushNotifications } from '@/services/notifications';
import { useAuthStore } from '@/stores/authStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useColorScheme();
  const queryClient = useMemo(() => new QueryClient(), []);
  const [fontsLoaded] = useFonts({
    SpaceMono: require('@/assets/fonts/SpaceMono-Regular.ttf'),
  });
  const { isAuthenticated, isLoading, loadSession, refreshUser } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      await loadSession();
      const state = useAuthStore.getState();
      if (state.isAuthenticated) {
        await registerForPushNotifications();
      }
    };

    init();
  }, [loadSession]);

  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && isAuthenticated) {
        refreshUser();
      }
    });

    return () => subscription.remove();
  }, [isAuthenticated, refreshUser]);

  if (!fontsLoaded || isLoading) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="redemptions" />
        <Stack.Screen name="badges" />
      </Stack>
    </QueryClientProvider>
  );
}
