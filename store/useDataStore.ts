import { create } from 'zustand';
import {
  FilterState,
  KpiData,
  MapDataItem,
  MatrixDataItem,
  QueryResult,
  ReportDataItem,
  SmartOptions,
  TrendDataItem,
} from '../types';

interface DataState {
  filters: FilterState;
  mapData: MapDataItem[];
  matrixData: MatrixDataItem[];
  reportData: ReportDataItem[];
  trendData: TrendDataItem[];
  kpis: KpiData;
  smartOptions: SmartOptions;
  setQueryResult: (result: QueryResult) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  replaceFilters: (filters: FilterState) => void;
  resetFilters: () => void;
  resetDataState: () => void;
}

export const emptyFilters: FilterState = { city: [], year: [], month: [], format: [], vendor: [] };
export const emptyKpis: KpiData = { avgGrp: 0, totalOts: 0, uniqueSurfaces: 0 };
export const emptyOptions: SmartOptions = { cities: [], years: [], months: [], formats: [], vendors: [] };

const defaultState = {
  filters: emptyFilters,
  mapData: [],
  matrixData: [],
  reportData: [],
  trendData: [],
  kpis: emptyKpis,
  smartOptions: emptyOptions,
};

export const useDataStore = create<DataState>((set) => ({
  ...defaultState,
  setFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  replaceFilters: (filters) => set({ filters }),
  setQueryResult: (res) => set({
    kpis: res.kpis || emptyKpis,
    mapData: res.mapData || [],
    matrixData: res.matrixData || [],
    reportData: res.reportData || [],
    trendData: res.trendData || [],
    smartOptions: res.options || emptyOptions,
  }),
  resetFilters: () => set({ filters: emptyFilters }),
  resetDataState: () => set(defaultState),
}));
