import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

import { Platform } from 'react-native';

// Multi-platform storage adapter (Secure on Mobile, Standard on Web)
const UniversalStorageAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') return AsyncStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') AsyncStorage.setItem(key, value);
    else SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') AsyncStorage.removeItem(key);
    else SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = 'https://ukwxrenvkepqprjqvnmd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrd3hyZW52a2VwcXByanF2bm1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MjEyNTAsImV4cCI6MjA5MTI5NzI1MH0.tHKFBVwnKSXGCM4Sy8ffGHkKNPMv2rhNikUPSKhwB5A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: UniversalStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
