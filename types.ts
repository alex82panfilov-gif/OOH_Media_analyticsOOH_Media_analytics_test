// types.ts
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

// Остальные интерфейсы без изменений...
export interface FilterState {
  city: string[];
  year: string[];
  month: string[];
  format: string[];
  vendor: string[];
}
export type UserRole = 'ADMIN' | 'GUEST' | null;
export enum TabView { ANALYTICS = 'ANALYTICS', MAP = 'MAP', REPORTS = 'REPORTS' }
