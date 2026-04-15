import { usePriceStore } from '@/hooks/usePriceStore';
import { supabase } from './supabase';
import { engineCall } from './stability_engine';

/**
 * AURAMX Price Engine v2
 * Master controller for global market simulation.
 * Ensures the 'No Static UI' rule is enforced globally.
 */

let engineInterval: NodeJS.Timeout | null = null;

export const startPriceEngine = async () => {
    if (engineInterval) return;

    // 1. Initial Fetch
    const { data: assets } = await engineCall(async () => await supabase.from('assets').select('*'));
    
    if (assets) {
        assets.forEach(asset => {
            usePriceStore.getState().updatePrice(asset.symbol, asset.current_price);
        });
    }

    // 2. Start Jitter Loop (5s Rule)
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
