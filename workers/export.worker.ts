/// <reference lib="webworker" />
import * as XLSX from 'xlsx';
import { MediaPlanExportItem, ReportDataItem } from '../types';

const monthAliases: Record<string, number> = { янв: 0, январь: 0, feb: 1, фев: 1, февраль: 1, мар: 2, март: 2, апр: 3, апрель: 3, май: 4, июн: 5, июнь: 5, июл: 6, июль: 6, авг: 7, август: 7, сен: 8, сентябрь: 8, окт: 9, октябрь: 9, ноя: 10, ноябрь: 10, дек: 11, декабрь: 11 };
const toSafeString = (value: unknown) => (typeof value === 'string' ? value : String(value ?? ''));

const getMonthIndex = (monthValue: unknown) => {
  if (typeof monthValue === 'number' && Number.isFinite(monthValue)) {
    if (monthValue >= 1 && monthValue <= 12) return monthValue - 1;
    if (monthValue >= 0 && monthValue <= 11) return monthValue;
  }
  const monthStr = toSafeString(monthValue).trim().toLowerCase();
  if (!monthStr) return Number.MAX_SAFE_INTEGER;
  const numericMonth = Number(monthStr);
  if (Number.isInteger(numericMonth) && numericMonth >= 1 && numericMonth <= 12) return numericMonth - 1;
  const shortKey = monthStr.slice(0, 3);
  return monthAliases[monthStr] ?? monthAliases[shortKey] ?? Number.MAX_SAFE_INTEGER;
};

self.onmessage = (event: MessageEvent<{ data: ReportDataItem[]; mediaPlan?: MediaPlanExportItem[]; fileName: string }>) => {
  const { data, mediaPlan = [], fileName } = event.data;
  if (!data || data.length === 0) {
    self.postMessage({ error: 'EMPTY_DATA' });
    return;
  }

  const workbook = XLSX.utils.book_new();
  const weightedGrpSum = data.reduce((acc, curr) => acc + ((curr.avgGrp || 0) * (curr.sideCount || 0)), 0);
  const totalSides = data.reduce((acc, curr) => acc + (curr.sideCount || 0), 0);
  const avgGrp = totalSides > 0 ? weightedGrpSum / totalSides : 0;
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
    ['СВОДНЫЙ ОТЧЕТ ПО ЭФФЕКТИВНОСТИ OOH'],
    ['Дата выгрузки', new Date().toLocaleDateString('ru-RU')],
    ['Период/Выборка', `${totalSides} рекламных поверхностей`],
    [],
    ['ОСНОВНЫЕ ПОКАЗАТЕЛИ'],
    ['Средний GRP (взвешенный по количеству конструкций)', Number(avgGrp.toFixed(4))],
    ['Количество уникальных городов', new Set(data.map((d) => d.city)).size],
    ['Количество форматов', new Set(data.map((d) => d.format)).size],
    ['Количество периодов (город+формат+месяц)', data.length],
  ]), 'Сводка');

  const cities = Array.from(new Set(data.map((d) => d.city))).sort();
  const formats = Array.from(new Set(data.map((d) => d.format))).sort();
  const matrixRows = cities.map((city) => {
    const row: (string | number | null)[] = [city];
    formats.forEach((fmt) => {
      const cellData = data.filter((d) => d.city === city && d.format === fmt && (d.avgGrp || 0) > 0);
      if (cellData.length > 0) {
        const weightedSum = cellData.reduce((s, c) => s + ((c.avgGrp || 0) * (c.sideCount || 0)), 0);
        const count = cellData.reduce((s, c) => s + (c.sideCount || 0), 0);
        row.push(count > 0 ? Number((weightedSum / count).toFixed(3)) : null);
      } else row.push(null);
    });
    return row;
  });
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['Город / Формат (Средний GRP)', ...formats], ...matrixRows]), 'Город_Формат');

  const dynReportData = [...data].sort((a, b) => {
    const cityA = toSafeString(a.city);
    const cityB = toSafeString(b.city);
    if (cityA !== cityB) return cityA.localeCompare(cityB, 'ru');
    if (a.year !== b.year) return a.year - b.year;
    return getMonthIndex(a.month) - getMonthIndex(b.month);
  }).map((item) => ({
    Город: item.city,
    Формат: item.format,
    Год: item.year,
    Месяц: item.month,
    'Средний GRP': Number((item.avgGrp || 0).toFixed(3)),
    'Количество конструкций': item.sideCount || 0,
  }));

  const wsDyn = XLSX.utils.json_to_sheet(dynReportData);
  wsDyn['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 8 }, { wch: 10 }, { wch: 15 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, wsDyn, 'Динамика_Детально');

  if (mediaPlan.length > 0) {
    const sortedPlan = [...mediaPlan].sort((a, b) => {
      const cityCmp = toSafeString(a.city).localeCompare(toSafeString(b.city), 'ru');
      if (cityCmp !== 0) return cityCmp;
      return toSafeString(a.title).localeCompare(toSafeString(b.title), 'ru');
    });

    const hasManyCities = new Set(sortedPlan.map((item) => item.city)).size > 1;
    const planRows: Array<Array<string | number>> = [];

    if (hasManyCities) {
      const cityGroups = new Map<string, MediaPlanExportItem[]>();
      sortedPlan.forEach((item) => {
        const key = item.city || 'Не указан';
        const group = cityGroups.get(key) ?? [];
        group.push(item);
        cityGroups.set(key, group);
      });

      Array.from(cityGroups.entries()).forEach(([city, items], cityIndex) => {
        items.forEach((item) => {
          planRows.push([
            city,
            item.title,
            item.format,
            item.period,
            Number((item.grp || 0).toFixed(3)),
            Number((item.ots || 0).toFixed(1)),
          ]);
        });

        const grpAvg = items.reduce((sum, item) => sum + (item.grp || 0), 0) / items.length;
        const otsTotal = items.reduce((sum, item) => sum + (item.ots || 0), 0);
        planRows.push([
          `${city} — Итого`,
          '',
          '',
          '',
          Number(grpAvg.toFixed(3)),
          Number(otsTotal.toFixed(1)),
        ]);

        if (cityIndex < cityGroups.size - 1) {
          planRows.push(['', '', '', '', '', '']);
        }
      });
    } else {
      sortedPlan.forEach((item) => {
        planRows.push([
          item.city,
          item.title,
          item.format,
          item.period,
          Number((item.grp || 0).toFixed(3)),
          Number((item.ots || 0).toFixed(1)),
        ]);
      });
    }

    const totalGrpAvg = sortedPlan.reduce((sum, item) => sum + (item.grp || 0), 0) / sortedPlan.length;
    const totalOts = sortedPlan.reduce((sum, item) => sum + (item.ots || 0), 0);

    planRows.push(['ИТОГО', '', '', '', Number(totalGrpAvg.toFixed(3)), Number(totalOts.toFixed(1))]);

    const wsMediaPlan = XLSX.utils.aoa_to_sheet([
      ['МЕДИАПЛАН'],
      ['Дата выгрузки', new Date().toLocaleDateString('ru-RU')],
      ['Выбрано поверхностей', sortedPlan.length],
      ['Выбрано городов', new Set(sortedPlan.map((item) => item.city)).size],
      ['Средний GRP', Number(totalGrpAvg.toFixed(3))],
      ['Total OTS', Number(totalOts.toFixed(1))],
      [],
      ['Город', 'Объект/адрес', 'Формат', 'Период', 'Средний GRP', 'OTS'],
      ...planRows,
    ]);
    wsMediaPlan['!cols'] = [{ wch: 20 }, { wch: 55 }, { wch: 14 }, { wch: 20 }, { wch: 14 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, wsMediaPlan, 'Медиаплан');
  }

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const dateStr = new Date().toISOString().split('T')[0];
  self.postMessage({ buffer, fullFileName: `${fileName}_${dateStr}.xlsx` }, [buffer as ArrayBuffer]);
};
