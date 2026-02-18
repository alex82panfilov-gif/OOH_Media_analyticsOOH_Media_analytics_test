import { create } from 'zustand';
import {
  FilterState,
  KPIData,
  MapDataPoint,
  MatrixDataPoint,
  ReportDataPoint,
  SmartOptions,
  TrendDataPoint,
  UserRole,
  TabView,
  WorkerQueryResult,
} from '../types';

const EMPTY_FILTERS: FilterState = { city: [], year: [], month: [], format: [], vendor: [] };
const EMPTY_OPTIONS: SmartOptions = { cities: [], years: [], months: [], formats: [], vendors: [] };
const EMPTY_KPIS: KPIData = { avgGrp: 0, totalOts: 0, uniqueSurfaces: 0 };

interface AppState {
  isLoading: boolean;
  userRole: UserRole;
  activeTab: TabView;
  filters: FilterState;

  mapData: MapDataPoint[];
  matrixData: MatrixDataPoint[];
  reportData: ReportDataPoint[];
  trendData: TrendDataPoint[];

  kpis: KPIData;
  smartOptions: SmartOptions;

  setUserRole: (role: UserRole) => void;
  setActiveTab: (tab: TabView) => void;
  setIsLoading: (loading: boolean) => void;
  setQueryResult: (result: WorkerQueryResult) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  isLoading: false,
  userRole: null,
  activeTab: TabView.ANALYTICS,
  filters: EMPTY_FILTERS,
  mapData: [],
  matrixData: [],
  reportData: [],
  trendData: [],
  kpis: EMPTY_KPIS,
  smartOptions: EMPTY_OPTIONS,

  setUserRole: (userRole) => set({ userRole }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),

  setQueryResult: (res) => set({
    kpis: res.kpis || EMPTY_KPIS,
    mapData: res.mapData || [],
    matrixData: res.matrixData || [],
    reportData: res.reportData || [],
    trendData: res.trendData || [],
    smartOptions: res.options || EMPTY_OPTIONS,
    isLoading: false,
  }),

  resetFilters: () => set({ filters: EMPTY_FILTERS }),
  logout: () => set({
    userRole: null,
    activeTab: TabView.ANALYTICS,
    filters: EMPTY_FILTERS,
    mapData: [],
    matrixData: [],
    reportData: [],
    trendData: [],
    kpis: EMPTY_KPIS,
    smartOptions: EMPTY_OPTIONS,
    isLoading: false,
  }),
}));
