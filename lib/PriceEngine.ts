import { usePriceStore } from '@/hooks/usePriceStore';
import { supabase } from './supabase';

/**
 * AURAMX Price Engine v2 - Crash-Proof Edition
 * Starts immediately with fallback prices. Supabase sync is non-blocking.
 */

// Fallback prices - app works even with zero network
const FALLBACK_PRICES: Record<string, number> = {
    BTC: 8420000,
    ETH: 320000,
    SOL: 15000,
    BNB: 48000,
    NIFTY: 22500,
    SENSEX: 74000,
    RELIANCE: 2950,
    TCS: 4100,
};

let engineInterval: NodeJS.Timeout | null = null;

export const startPriceEngine = async () => {
    if (engineInterval) return;

    // 1. Load fallback prices IMMEDIATELY (zero network dependency)
    Object.entries(FALLBACK_PRICES).forEach(([symbol, price]) => {
        usePriceStore.getState().updatePrice(symbol, price);
    });

    // 2. Try Supabase in background - non-blocking, won't crash if it fails
    try {
        const { data: assets } = await supabase
            .from('assets')
            .select('symbol, current_price')
            .limit(50);

        if (assets && assets.length > 0) {
            assets.forEach((asset: any) => {
                usePriceStore.getState().updatePrice(asset.symbol, asset.current_price);
            });
            console.log('[PriceEngine] Synced', assets.length, 'live prices from Supabase');
        }
    } catch (err) {
        // Silently fail - fallback prices are already loaded
        console.warn('[PriceEngine] Supabase sync failed, using fallback prices');
    }

    // 3. Start jitter loop regardless of network state
    engineInterval = setInterval(() => {
        usePriceStore.getState().jitterPrices();
    }, 5000);

    console.log('[PriceEngine] v2 Online - Market Dynamics Active');
};

export const stopPriceEngine = () => {
    if (engineInterval) {
        clearInterval(engineInterval);
        engineInterval = null;
    }
};
