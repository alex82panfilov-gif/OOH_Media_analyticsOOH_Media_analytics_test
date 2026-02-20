import { create } from 'zustand';
import { MediaPlanItem } from '../types';

interface MediaPlanState {
  items: MediaPlanItem[];
  addItem: (item: MediaPlanItem) => void;
  removeItem: (id: string) => void;
  clearPlan: () => void;
  isInPlan: (id: string) => boolean;
  totalGrp: () => number;
  totalOts: () => number;
}

export const useMediaPlanStore = create<MediaPlanState>((set, get) => ({
  items: [],
  addItem: (item) => set((state) => {
    if (state.items.some((existing) => existing.id === item.id)) {
      return state;
    }
    return { items: [...state.items, item] };
  }),
  removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
  clearPlan: () => set({ items: [] }),
  isInPlan: (id) => get().items.some((item) => item.id === id),
  totalGrp: () => get().items.reduce((sum, item) => sum + (item.avgGrp || 0), 0),
  totalOts: () => get().items.reduce((sum, item) => sum + (item.avgOts || 0), 0),
}));
