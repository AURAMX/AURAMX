import { supabase } from './supabase';
import { engineCall } from './stability_engine';

/**
 * PRODUCTION Analytics & Anti-Cheat Engine (LOCKED SPEC)
 */

const eventDebounce: Record<string, number> = {};

export async function earnXP(userId: string, amount: number, source: string) {
    // 1. Anti-Cheat: Deduplicate rapid events (5 sec window)
    const now = Date.now();
    const eventKey = `${userId}_${source}`;
    if (eventDebounce[eventKey] && (now - eventDebounce[eventKey] < 5000)) return;
    eventDebounce[eventKey] = now;

    return engineCall(async () => {
        const { data: profile } = await supabase.from('profiles').select('xp, level').eq('id', userId).single();
        if (!profile) return { data: null, error: 'No Profile' };

        const newXP = profile.xp + amount;
        
        // Level = derived ONLY from XP (Locked Rule)
        let newLevel = 1;
        if (newXP >= 5000) newLevel = 10;
        else if (newXP >= 2000) newLevel = 5;
        else if (newXP >= 1000) newLevel = 4;
        else if (newXP >= 500) newLevel = 3;
        else if (newXP >= 100) newLevel = 2;

        const updateRes = await supabase.from('profiles').update({
            xp: newXP,
            level: newLevel,
            updated_at: new Date().toISOString()
        }).eq('id', userId);

        // 2. Log Analytics (Metrics Tracking)
        await supabase.from('user_analytics').insert({
            user_id: userId,
            event_type: 'xp_gain',
            event_data: { amount, source, new_total: newXP }
        });

        return updateRes;
    });
}

export async function logMetric(userId: string, type: string, data: any) {
    return engineCall(async () => {
        return await supabase.from('user_analytics').insert({
            user_id: userId,
            event_type: type,
            event_data: data
        });
    }, { silent: true });
}

export async function unlockBadge(userId: string, badgeId: string) {
    // Badges unlock ONCE ONLY (no duplicates allowed - server validated)
    return engineCall(async () => {
        const { data } = await supabase.from('user_badges').select('*').eq('user_id', userId).eq('badge_id', badgeId).single();
        if (data) return { data, error: null };

        return await supabase.from('user_badges').insert({
            user_id: userId,
            badge_id: badgeId
        }).select();
    });
}
