import { supabase } from './supabase';
import { PostgrestResponse, PostgrestSingleResponse } from '@supabase/postgrest-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Robust wrapper for Supabase calls with 3x retry and offline cache fallback
 */
export async function safeSupabaseCall<T>(
  call: () => Promise<PostgrestResponse<T> | PostgrestSingleResponse<T>>,
  cacheKey?: string,
  retries = 3
): Promise<{ data: T | T[] | null; error: any }> {
  let lastError: any;
  
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await call();
      if (!error) {
        if (cacheKey && data) {
          await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
        }
        return { data, error: null };
      }
      lastError = error;
    } catch (err) {
      lastError = err;
    }
    
    // Exponential backoff or simple delay
    if (i < retries - 1) {
      await new Promise(res => setTimeout(res, 1000 * (i + 1)));
    }
  }

  // If we reach here, all retries failed. Try to load from cache.
  if (cacheKey) {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      console.warn(`Supabase call failed after ${retries} attempts. Using cached data for ${cacheKey}`);
      return { data: JSON.parse(cached), error: null };
    }
  }

  return { data: null, error: lastError };
}
