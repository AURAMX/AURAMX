import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { View, Text, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGuard() {
  const { isInitialized, session, isGuest, setSession, setUser, setInitialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Setup auth and listen to changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setInitialized(true);
      SplashScreen.hideAsync();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isAuthenticated = session?.user || isGuest;

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to the login page
      router.replace('/(auth)');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect away from the login page
      router.replace('/(tabs)');
    }
  }, [session, isInitialized, segments, isGuest]);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#d4af37" />
        <Text style={{ color: '#d4af37', marginTop: 20 }}>Booting securely...</Text>
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthGuard />
    </ThemeProvider>
  );
}
