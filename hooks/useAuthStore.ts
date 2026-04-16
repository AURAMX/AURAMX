import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';

type AuthState = {
  user: User | null;
  session: Session | null;
  isInitialized: boolean;
  isGuest: boolean;
  balance: number;
  portfolioStocks: number;
  portfolioCrypto: number;
  currency: 'INR' | 'USDT';
  exchangeRate: number; // e.g., 83 INR per USDT
  showCelebration: boolean;
  soundEnabled: boolean;
  
  setBalance: (balance: number) => void;
  setPortfolio: (stocks: number, crypto: number) => void;
  toggleCurrency: () => void;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setInitialized: (isInitialized: boolean) => void;
  setGuestMode: (isGuest: boolean) => void;
  setShowCelebration: (show: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  triggerCelebration: () => void;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isInitialized: false,
      isGuest: false,
      balance: 100000,
      portfolioStocks: 200000,
      portfolioCrypto: 300000,
      currency: 'INR',
      exchangeRate: 83.5, // Used for conversion
      soundEnabled: false,
      showCelebration: false,
      
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setBalance: (balance) => set({ balance }),
      setPortfolio: (stocks, crypto) => set({ portfolioStocks: stocks, portfolioCrypto: crypto }),
      toggleCurrency: () => set((state) => ({ currency: state.currency === 'INR' ? 'USDT' : 'INR' })),
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      setGuestMode: (isGuest) => set({ isGuest }),
      setShowCelebration: (show) => set({ showCelebration: show }),
      triggerCelebration: () => set({ showCelebration: true }),
      signOut: () => set({ user: null, session: null, isGuest: false }),
    }),
    {
      name: 'auramx-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        balance: state.balance,
        portfolioStocks: state.portfolioStocks,
        portfolioCrypto: state.portfolioCrypto,
        soundEnabled: state.soundEnabled,
        currency: state.currency
      }), // only persist these fields
    }
  )
);
