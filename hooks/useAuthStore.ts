import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';

type AuthState = {
  user: User | null;
  session: Session | null;
  isInitialized: boolean;
  isGuest: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setInitialized: (isInitialized: boolean) => void;
  setGuestMode: (isGuest: boolean) => void;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isInitialized: false,
  isGuest: false,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  setGuestMode: (isGuest) => set({ isGuest }),
  signOut: () => set({ user: null, session: null, isGuest: false }),
}));
