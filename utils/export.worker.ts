import * as XLSX from 'xlsx';
import { ReportDataItem } from '../types';

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
};

interface WorkerRequest {
  data: ReportDataItem[];
  fileName: string;
}

const monthAliases: Record<string, number> = {
  янв: 0,
  январь: 0,
  feb: 1,
  фев: 1,
  февраль: 1,
  мар: 2,
  март: 2,
  апр: 3,
  апрель: 3,
  май: 4,
  июн: 5,
  июнь: 5,
  июл: 6,
  июль: 6,
  авг: 7,
  август: 7,
  сен: 8,
  сентябрь: 8,
  окт: 9,
  октябрь: 9,
  ноя: 10,
  ноябрь: 10,
  дек: 11,
  декабрь: 11,
};

const toSafeString = (value: unknown) => (typeof value === 'string' ? value : String(value ?? ''));

const getMonthIndex = (monthValue: unknown) => {
  if (typeof monthValue === 'number' && Number.isFinite(monthValue)) {
    if (monthValue >= 1 && monthValue <= 12) return monthValue - 1;
    if (monthValue >= 0 && monthValue <= 11) return monthValue;
  }

  const monthStr = toSafeString(monthValue).trim().toLowerCase();
  if (!monthStr) return Number.MAX_SAFE_INTEGER;

  const numericMonth = Number(monthStr);
  if (Number.isInteger(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
    return numericMonth - 1;
  }

  const shortKey = monthStr.slice(0, 3);
  return monthAliases[monthStr] ?? monthAliases[shortKey] ?? Number.MAX_SAFE_INTEGER;
};

const buildBuffer = (data: ReportDataItem[]): ArrayBuffer => {
  const workbook = XLSX.utils.book_new();

  const weightedGrpSum = data.reduce((acc, curr) => acc + ((curr.avgGrp || 0) * (curr.sideCount || 0)), 0);
  const totalSides = data.reduce((acc, curr) => acc + (curr.sideCount || 0), 0);
  const avgGrp = totalSides > 0 ? weightedGrpSum / totalSides : 0;

  const summaryData = [
    ['СВОДНЫЙ ОТЧЕТ ПО ЭФФЕКТИВНОСТИ OOH'],
    ['Дата выгрузки', new Date().toLocaleDateString('ru-RU')],
    ['Период/Выборка', `${totalSides} рекламных поверхностей`],
    [],
    ['ОСНОВНЫЕ ПОКАЗАТЕЛИ'],
    ['Средний GRP (взвешенный по количеству конструкций)', Number(avgGrp.toFixed(4))],
    ['Количество уникальных городов', new Set(data.map((d) => d.city)).size],
    ['Количество форматов', new Set(data.map((d) => d.format)).size],
    ['Количество периодов (город+формат+месяц)', data.length],
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryData), 'Сводка');

  const cities = Array.from(new Set(data.map((d) => d.city))).sort();
  const formats = Array.from(new Set(data.map((d) => d.format))).sort();

  const matrixHeader = ['Город / Формат (Средний GRP)', ...formats];
  const matrixRows = cities.map((city) => {
    const row: (string | number | null)[] = [city];
    formats.forEach((fmt) => {
      const cellData = data.filter((d) => d.city === city && d.format === fmt && (d.avgGrp || 0) > 0);
      if (cellData.length > 0) {
        const weightedSum = cellData.reduce((s, c) => s + ((c.avgGrp || 0) * (c.sideCount || 0)), 0);
        const count = cellData.reduce((s, c) => s + (c.sideCount || 0), 0);
        row.push(count > 0 ? Number((weightedSum / count).toFixed(3)) : null);
      } else {
        row.push(null);
      }
    });
    return row;
  });
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([matrixHeader, ...matrixRows]), 'Город_Формат');

  const dynReportData = [...data]
    .sort((a, b) => {
      const cityA = toSafeString(a.city);
      const cityB = toSafeString(b.city);
      if (cityA !== cityB) return cityA.localeCompare(cityB, 'ru');
      if (a.year !== b.year) return a.year - b.year;
      return getMonthIndex(a.month) - getMonthIndex(b.month);
    })
    .map((item) => ({
      'Город': item.city,
      'Формат': item.format,
      'Год': item.year,
      'Месяц': item.month,
      'Средний GRP': Number((item.avgGrp || 0).toFixed(3)),
      'Количество конструкций': item.sideCount || 0,
    }));
  const wsDyn = XLSX.utils.json_to_sheet(dynReportData);
  wsDyn['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 8 }, { wch: 10 }, { wch: 15 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, wsDyn, 'Динамика_Детально');

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
};

workerScope.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { data, fileName } = event.data;
  const dateStr = new Date().toISOString().split('T')[0];
  const fullFileName = `${fileName}_${dateStr}.xlsx`;

  try {
    const buffer = buildBuffer(data);
    workerScope.postMessage({ buffer, fullFileName }, [buffer]);
  } catch (error) {
    workerScope.postMessage({ error: error instanceof Error ? error.message : 'Unknown export error' });
  }
};
