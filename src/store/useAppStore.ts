import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { City, Locality } from '@/types';

export interface User {
  id: number;
  name?: string;
  phone?: string;
  email?: string;
  role: 'user' | 'vendor' | 'admin' | 'super_admin';
  vendorId?: number;
  onboardingComplete?: boolean;
}

export interface UserPreferences {
  eventType?: string;
  budgetMin?: number;
  budgetMax?: number;
  cityId?: number;
  guestCount?: number;
  eventDate?: string;
  isFlexibleDate?: boolean;
  services?: string[];
  priceType?: string;
}

export interface AuthModalIntent {
  /** Where to navigate after successful auth */
  redirectTo?:   string;
  /** Pre-select this role in onboarding */
  defaultRole?:  'user' | 'vendor';
  /** Which tab to start on */
  initialStep?:  'signin' | 'signup';
}

interface AppStore {
  user:              User | null;
  token:             string | null;
  preferences:       UserPreferences | null;
  selectedCity:      City | null;
  selectedLocality:  Locality | null;
  authModalOpen:     boolean;
  authModalIntent:   AuthModalIntent | null;
  setUser:           (user: User | null) => void;
  setToken:          (token: string | null) => void;
  setPreferences:    (prefs: UserPreferences | null) => void;
  setSelectedCity:   (city: City | null) => void;
  setSelectedLocality: (locality: Locality | null) => void;
  openAuthModal:     (intent?: AuthModalIntent) => void;
  closeAuthModal:    () => void;
  logout:            () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      user:             null,
      token:            null,
      preferences:      null,
      selectedCity:     null,
      selectedLocality: null,
      authModalOpen:    false,
      authModalIntent:  null,

      setUser:        (user)  => set({ user }),
      setPreferences: (preferences) => set({ preferences }),
      setToken:       (token) => {
        set({ token });
        if (token) localStorage.setItem('token', token);
        else        localStorage.removeItem('token');
      },
      setSelectedCity:     (city)     => set({ selectedCity: city, selectedLocality: null }),
      setSelectedLocality: (locality) => set({ selectedLocality: locality }),

      openAuthModal: (intent?: AuthModalIntent) =>
        set({ authModalOpen: true, authModalIntent: intent ?? null }),

      closeAuthModal: () =>
        set({ authModalOpen: false, authModalIntent: null }),

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, preferences: null });
      },
    }),
    {
      name: 'events-app',
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        selectedCity: s.selectedCity,
        preferences: s.preferences,
      }),
    },
  ),
);
