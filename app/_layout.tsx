import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { SafeView } from '@/components/SafeView';
import { Shield } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { SecurityShield } from '@/components/ui/SecurityShield';
import { upsertAccount } from '@/lib/stability_engine';
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync();

const PIN_KEY = 'auramx_pin_lock';
const GOLD = '#D4AF37';

function SecureBoot() {
  const { isInitialized, session, isGuest, setSession, setUser, setInitialized, showCelebration, setShowCelebration } = useAuthStore();
  const [isLocked, setIsLocked] = useState(true);

  const segments = useSegments();
  const router = useRouter();

  // 1. Initial Load: Check PIN and Auth session
  useEffect(() => {
    async function boot() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await upsertAccount(session.user.id, session.user.email);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setInitialized(true);
      } finally {
        SplashScreen.hideAsync();
      }
    }
    boot();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
          await upsertAccount(session.user.id, session.user.email);
      }
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLocked && !isGuest) {
    return <SecurityShield onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <SafeView loading={!isInitialized}>
      <Slot />
      {showCelebration && <Celebration onComplete={() => setShowCelebration(false)} />}
    </SafeView>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SecureBoot />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  lockContainer: { flex: 1, backgroundColor: '#0B0F1A', justifyContent: 'center', alignItems: 'center', padding: 30 },
  lockContent: { width: '100%', padding: 40, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' },
  lockTitle: { color: GOLD, fontSize: 24, fontWeight: 'bold', letterSpacing: 2 },
  lockSubtitle: { color: '#8A8D93', marginTop: 8, marginBottom: 30 },
  pinInput: { backgroundColor: '#000', color: '#fff', width: '100%', height: 60, borderRadius: 12, fontSize: 32, textAlign: 'center', letterSpacing: 10, borderWidth: 1, borderColor: '#333', marginBottom: 30 },
  unlockBtn: { backgroundColor: GOLD, width: '100%', height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  unlockText: { color: '#000', fontWeight: 'bold', fontSize: 16 }
});
