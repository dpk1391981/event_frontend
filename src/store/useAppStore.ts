import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { City, Locality } from '@/types';

export interface User {
  id: number;
  name?: string;
  phone?: string;
  email?: string;
  role: 'user' | 'vendor' | 'admin' | 'super_admin';
  vendorId?: number; // populated after vendor profile fetch
}

interface AppStore {
  user: User | null;
  token: string | null;
  selectedCity: City | null;
  selectedLocality: Locality | null;
  authModalOpen: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setSelectedCity: (city: City | null) => void;
  setSelectedLocality: (locality: Locality | null) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  logout: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      selectedCity: null,
      selectedLocality: null,
      authModalOpen: false,
      setUser: (user) => set({ user }),
      setToken: (token) => {
        set({ token });
        if (token) localStorage.setItem('token', token);
        else localStorage.removeItem('token');
      },
      setSelectedCity: (city) => set({ selectedCity: city, selectedLocality: null }),
      setSelectedLocality: (locality) => set({ selectedLocality: locality }),
      openAuthModal:  () => set({ authModalOpen: true }),
      closeAuthModal: () => set({ authModalOpen: false }),
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },
    }),
    { name: 'events-app', partialize: (s) => ({ user: s.user, token: s.token, selectedCity: s.selectedCity }) },
  ),
);
