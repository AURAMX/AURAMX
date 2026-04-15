import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Production-Grade Stability Engine for AURAMX
 * Strictly enforces: 3x Retries, Offline Caching, and Session Persistence
 */

export type StabilityResponse<T> = {
    data: T | null;
    error: any;
    fromCache: boolean;
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export async function engineCall<T>(
    call: () => Promise<{ data: T | null; error: any }>,
    config: {
        cacheKey?: string;
        fallbackData?: T;
        silent?: boolean;
    } = {}
): Promise<StabilityResponse<T>> {
    const { cacheKey, fallbackData, silent = false } = config;
    let lastError: any;

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            // Check session before call
            const { data: { session } } = await supabase.auth.getSession();
            if (i > 0 && !session && !silent) {
                console.warn('[StabilityEngine] No session detected, attempting silent recovery...');
            }

            const { data, error } = await call();
            
            if (!error && data !== undefined) {
                if (cacheKey && data !== null) {
                    await AsyncStorage.setItem(`auramx_prod_${cacheKey}`, JSON.stringify(data));
                }
                return { data: data as T, error: null, fromCache: false };
            }
            
            lastError = error;
            if (!silent) console.error(`[StabilityEngine] Attempt ${i + 1} failed:`, error?.message || error);

        } catch (err: any) {
            lastError = err;
            if (!silent) console.error(`[StabilityEngine] Catch block in attempt ${i + 1}:`, err.message || err);
        }

        if (i < MAX_RETRIES - 1) {
            await new Promise(res => setTimeout(res, RETRY_DELAY * (i + 1))); 
        }
    }

    // Cache Recovery Logic
    if (cacheKey) {
        try {
            const cached = await AsyncStorage.getItem(`auramx_prod_${cacheKey}`);
            if (cached) {
                if (!silent) console.warn(`[StabilityEngine] Recovered ${cacheKey} from persistent cache.`);
                return { data: JSON.parse(cached), error: null, fromCache: true };
            }
        } catch (e) {
            if (!silent) console.error('[StabilityEngine] Cache retrieval failed', e);
        }
    }

    return { 
        data: fallbackData ?? null, 
        error: lastError ?? 'Critical API Failure', 
        fromCache: false 
    };
}

/**
 * Ensures user profile is synced or created using Upsert (Locked Rule)
 * Called on every login to restore XP, Streaks, and Levels
 */
export async function upsertAccount(userId: string, email?: string, name?: string) {
    if (userId.startsWith('guest_')) return { data: null, error: null, fromCache: false };

    return engineCall(async () => {
        // Fetch current profile to check streak
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
        
        const now = new Date();
        let newStreak = profile?.streak || 0;
        let lastUpdate = profile?.updated_at ? new Date(profile.updated_at) : null;

        // Streak recovery logic
        if (!lastUpdate || (now.getTime() - lastUpdate.getTime()) > 86400000 * 2) {
            newStreak = 1;
        } else if (now.getDate() !== lastUpdate.getDate()) {
            newStreak += 1;
        }

        return await supabase
            .from('profiles')
            .upsert({ 
                id: userId, 
                email: email,
                name: name || email?.split('@')[0] || 'Aura Trader',
                streak: newStreak,
                updated_at: now.toISOString() 
            }, { onConflict: 'id' })
            .select()
            .single();
    }, { cacheKey: `profile_${userId}`, silent: true });
}
