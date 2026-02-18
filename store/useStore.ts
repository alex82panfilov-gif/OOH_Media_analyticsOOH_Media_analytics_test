import { create } from 'zustand';
import { FilterState, UserRole, TabView } from '../types';

interface AppState {
  isLoading: boolean;
  userRole: UserRole;
  activeTab: TabView;
  filters: FilterState;
  
  // Данные для разных компонентов
  mapData: any[];
  matrixData: any[];
  reportData: any[];
  trendData: any[];
  
  // Точные КПИ из базы
  kpis: {
    avgGrp: number;
    totalOts: number;
    uniqueSurfaces: number;
  };
  
  smartOptions: {
    cities: string[]; years: string[]; months: string[]; formats: string[]; vendors: string[];
  };

  setUserRole: (role: UserRole) => void;
  setActiveTab: (tab: TabView) => void;
  setIsLoading: (loading: boolean) => void;
  setQueryResult: (result: any) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
}

export const useStore = create<AppState>((set) => ({
  isLoading: false,
  userRole: null,
  activeTab: TabView.ANALYTICS,
  filters: { city: [], year: [], month: [], format: [], vendor: [] },
  mapData: [], matrixData: [], reportData: [], trendData: [],
  kpis: { avgGrp: 0, totalOts: 0, uniqueSurfaces: 0 },
  smartOptions: { cities: [], years: [], months: [], formats: [], vendors: [] },

  setUserRole: (userRole) => set({ userRole }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  
setQueryResult: (res) => set({
    // ЗАЩИТА: Если res.kpis пустой, оставляем нули вместо null
    kpis: res.kpis || { avgGrp: 0, totalOts: 0, uniqueSurfaces: 0 },
    mapData: res.mapData || [],
    matrixData: res.matrixData || [],
    reportData: res.reportData || [],
    trendData: res.trendData || [],
    smartOptions: res.options || { cities: [], years: [], months: [], formats: [], vendors: [] },
    isLoading: false
  }),

  resetFilters: () => set({ filters: { city: [], year: [], month: [], format: [], vendor: [] } }),
}));
