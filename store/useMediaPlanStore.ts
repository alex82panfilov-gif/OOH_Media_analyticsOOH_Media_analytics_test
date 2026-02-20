import { create } from 'zustand';
import { MediaPlanExportItem } from '../types';

export type MediaPlanItem = MediaPlanExportItem;

interface MediaPlanState {
  items: MediaPlanItem[];
  addItem: (item: MediaPlanItem) => void;
  removeItem: (id: string) => void;
  toggleItem: (item: MediaPlanItem) => void;
  clear: () => void;
}

export const useMediaPlanStore = create<MediaPlanState>((set, get) => ({
  items: [],
  addItem: (item) => {
    const hasItem = get().items.some((existing) => existing.id === item.id);
    if (hasItem) return;
    set((state) => ({ items: [...state.items, item] }));
  },
  removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
  toggleItem: (item) => {
    const hasItem = get().items.some((existing) => existing.id === item.id);
    if (hasItem) {
      set((state) => ({ items: state.items.filter((existing) => existing.id !== item.id) }));
      return;
    }
    set((state) => ({ items: [...state.items, item] }));
  },
  clear: () => set({ items: [] }),
}));
