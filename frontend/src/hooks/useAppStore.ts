import { create } from 'zustand';

interface AppState {
  city: string;
  setCity: (city: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  city: 'All Cities',
  setCity: (city) => set({ city }),
}));
