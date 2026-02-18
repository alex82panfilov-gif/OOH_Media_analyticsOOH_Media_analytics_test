import { create } from 'zustand';
import { TabView } from '../types';

interface UIState {
  isLoading: boolean;
  activeTab: TabView;
  setActiveTab: (tab: TabView) => void;
  setIsLoading: (loading: boolean) => void;
  resetUIState: () => void;
}

const defaultState = {
  isLoading: false,
  activeTab: TabView.ANALYTICS,
};

export const useUIStore = create<UIState>((set) => ({
  ...defaultState,
  setActiveTab: (activeTab) => set({ activeTab }),
  setIsLoading: (isLoading) => set({ isLoading }),
  resetUIState: () => set(defaultState),
}));
