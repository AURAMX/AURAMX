import { create } from 'zustand';

type AssetPrice = {
    symbol: string;
    price: number;
    change24h: number;
    high: number;
    low: number;
};

type PriceState = {
    prices: Record<string, AssetPrice>;
    marketMood: 'Bullish' | 'Bearish' | 'Neutral';
    updatePrice: (symbol: string, basePrice: number) => void;
    jitterPrices: () => void;
};

export const usePriceStore = create<PriceState>((set, get) => ({
    prices: {},
    marketMood: 'Neutral',

    updatePrice: (symbol, basePrice) => {
        set((state) => ({
            prices: {
                ...state.prices,
                [symbol]: {
                    symbol,
                    price: basePrice,
                    change24h: 0,
                    high: basePrice * 1.05,
                    low: basePrice * 0.95,
                }
            }
        }));
    },

    jitterPrices: () => {
        const { prices } = get();
        const newPrices = { ...prices };
        let btcChange = 0;

        Object.keys(newPrices).forEach((symbol) => {
            const asset = newPrices[symbol];
            const jitter = 1 + (Math.random() * 0.016 - 0.008); // +/- 0.8%
            const newPrice = asset.price * jitter;
            
            const currentChange = ((newPrice - asset.price) / asset.price) * 100;
            if (symbol === 'BTC') btcChange = currentChange;

            newPrices[symbol] = {
                ...asset,
                price: newPrice,
                change24h: parseFloat((asset.change24h + currentChange).toFixed(2)),
                high: Math.max(asset.high, newPrice),
                low: Math.min(asset.low, newPrice),
            };
        });

        // Compute Market Mood
        let mood: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
        if (btcChange > 0.3) mood = 'Bullish';
        else if (btcChange < -0.3) mood = 'Bearish';

        set({ prices: newPrices, marketMood: mood });
    }
}));
