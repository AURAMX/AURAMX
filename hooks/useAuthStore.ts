import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';

type AuthState = {
  user: User | null;
  session: Session | null;
  isInitialized: boolean;
  isGuest: boolean;
  balance: number;
  showCelebration: boolean;
  setBalance: (balance: number) => void;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setInitialized: (isInitialized: boolean) => void;
  setGuestMode: (isGuest: boolean) => void;
  setShowCelebration: (show: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  triggerCelebration: () => void;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isInitialized: false,
  isGuest: false,
  balance: 100000,
  soundEnabled: false,
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  setBalance: (balance) => set({ balance }),
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  setGuestMode: (isGuest) => set({ isGuest }),
  setShowCelebration: (show) => set({ showCelebration: show }),
  triggerCelebration: () => set({ showCelebration: true }),
  signOut: () => set({ user: null, session: null, isGuest: false }),
}));
