import { z } from 'zod';

export const OOHRecordSchema = z.object({
  id: z.string(),
  address: z.coerce.string().default('Адрес не указан'),
  city: z.coerce.string().default('Неизвестный город'),
  
  // Год: преобразуем в число, убираем дробную часть
  year: z.preprocess((val) => {
    const n = Number(val);
    return isNaN(n) ? 0 : Math.floor(n);
  }, z.number().default(0)),

  // Месяц: принудительно в строку, если null -> пустая строка
  month: z.coerce.string().nullable().transform(v => v || ''),
  
  // Продавец: принудительно в строку, обрезаем пробелы
  vendor: z.coerce.string().nullable().transform(v => v?.trim() || 'Неизвестный продавец'),
  
  format: z.coerce.string().default('Unknown'),
  
  // Числовые поля с защитой от строк с запятыми и null
  grp: z.preprocess((val) => {
    if (typeof val === 'string') return parseFloat(val.replace(',', '.'));
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  }, z.number().default(0)),

  ots: z.preprocess((val) => {
    if (typeof val === 'string') return parseFloat(val.replace(',', '.'));
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  }, z.number().default(0)),
  
  lat: z.preprocess((val) => {
    if (typeof val === 'string') return parseFloat(val.replace(',', '.'));
    const n = Number(val);
    return isNaN(n) ? 55.75 : n;
  }, z.number().default(55.75)),

  lng: z.preprocess((val) => {
    if (typeof val === 'string') return parseFloat(val.replace(',', '.'));
    const n = Number(val);
    return isNaN(n) ? 37.61 : n;
  }, z.number().default(37.61)),
});

export type OOHRecord = z.infer<typeof OOHRecordSchema>;

export interface KpiData {
  avgGrp: number;
  totalOts: number;
  uniqueSurfaces: number;
}

export interface SmartOptions {
  cities: string[];
  years: string[];
  months: string[];
  formats: string[];
  vendors: string[];
}

export interface MapDataItem {
  address: string;
  city: string;
  vendor: string;
  format: string;
  avgGrp: number;
  avgOts: number;
  lat: number;
  lng: number;
}

export interface MatrixDataItem {
  city: string;
  format: string;
  avgGrp: number;
}

export interface TrendDataItem {
  month: string;
  year: number;
  avgGrp: number;
}

export interface ReportDataItem {
  city: string;
  format: string;
  year: number;
  month: string;
  avgGrp: number;
  sideCount: number;
}

export interface MediaPlanItem {
  id: string;
  source: 'MAP' | 'REPORT';
  address: string;
  city: string;
  format: string;
  vendor: string;
  month: string;
  year: number;
  avgGrp: number;
  avgOts: number;
}

export interface QueryResult {
  type: 'QUERY_RESULT';
  requestId: number;
  kpis: KpiData;
  mapData: MapDataItem[];
  trendData: TrendDataItem[];
  matrixData: MatrixDataItem[];
  reportData: ReportDataItem[];
  options: SmartOptions;
}

export interface FilterState {
  city: string[];
  year: string[];
  month: string[];
  format: string[];
  vendor: string[];
}

export type UserRole = 'ADMIN' | 'GUEST' | null;

export enum TabView { ANALYTICS = 'ANALYTICS', MAP = 'MAP', REPORTS = 'REPORTS', MEDIAPLAN = 'MEDIAPLAN' }
