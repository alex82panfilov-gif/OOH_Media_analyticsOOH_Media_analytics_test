// utils/data.ts
import { OOHRecord } from '../types';

// --- ФОРМАТТЕРЫ (Оставляем, они нужны для графиков и таблиц) ---

export const formatNumberRussian = (num: number | undefined | null, decimals = 2): string => {
  if (num === undefined || num === null || isNaN(num)) return '0,00';
  return num.toLocaleString('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export const formatCompactRussian = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  if (num >= 1000000) return `${(num / 1000000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн`;
  if (num >= 1000) return `${(num / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} тыс.`;
  return num.toLocaleString('ru-RU');
};

// --- ГЕНЕРАТОР MOCK-ДАННЫХ (Оставляем как запасной вариант) ---

export const generateData = (count: number = 1000): OOHRecord[] => {
  const cities = ['Москва', 'СПб', 'Казань'];
  const vendors = ['RUSS', 'Gallery', 'LAMA'];
  const formats = ['BB', 'SS', 'MF'];
  const months = ['янв', 'фев', 'мар'];

  return Array.from({ length: count }).map((_, i) => ({
    id: `mock-${i}`,
    address: `Улица ${i}`,
    city: cities[i % cities.length],
    year: 2024,
    month: months[i % months.length],
    vendor: vendors[i % vendors.length],
    format: formats[i % formats.length],
    grp: Math.random() * 2,
    ots: Math.random() * 50,
    lat: 55.75 + Math.random() * 0.1,
    lng: 37.61 + Math.random() * 0.1,
  }));
};
