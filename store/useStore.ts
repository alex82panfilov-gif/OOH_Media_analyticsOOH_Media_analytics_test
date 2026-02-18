import { create } from 'zustand';
import {
  FilterState,
  KpiData,
  MapDataItem,
  MatrixDataItem,
  QueryResult,
  ReportDataItem,
  SmartOptions,
  TabView,
  TrendDataItem,
  UserRole,
} from '../types';

interface AppState {
  isLoading: boolean;
  userRole: UserRole;
  activeTab: TabView;
  filters: FilterState;
  mapData: MapDataItem[];
  matrixData: MatrixDataItem[];
  reportData: ReportDataItem[];
  trendData: TrendDataItem[];
  kpis: KpiData;
  smartOptions: SmartOptions;

  setUserRole: (role: UserRole) => void;
  setActiveTab: (tab: TabView) => void;
  setIsLoading: (loading: boolean) => void;
  setQueryResult: (result: QueryResult) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  logout: () => void;
}

const emptyFilters: FilterState = { city: [], year: [], month: [], format: [], vendor: [] };
const emptyKpis: KpiData = { avgGrp: 0, totalOts: 0, uniqueSurfaces: 0 };
const emptyOptions: SmartOptions = { cities: [], years: [], months: [], formats: [], vendors: [] };

export const useStore = create<AppState>((set) => ({
  isLoading: false,
  userRole: null,
  activeTab: TabView.ANALYTICS,
  filters: emptyFilters,
  mapData: [],
  matrixData: [],
  reportData: [],
  trendData: [],
  kpis: emptyKpis,
  smartOptions: emptyOptions,

  setUserRole: (userRole) => set({ userRole }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),

  setQueryResult: (res) => set({
    kpis: res.kpis || emptyKpis,
    mapData: res.mapData || [],
    matrixData: res.matrixData || [],
    reportData: res.reportData || [],
    trendData: res.trendData || [],
    smartOptions: res.options || emptyOptions,
    isLoading: false,
  }),

  resetFilters: () => set({ filters: emptyFilters }),
  logout: () => set({
    userRole: null,
    activeTab: TabView.ANALYTICS,
    filters: emptyFilters,
    mapData: [],
    matrixData: [],
    reportData: [],
    trendData: [],
    kpis: emptyKpis,
    smartOptions: emptyOptions,
    isLoading: false,
  }),
}));
