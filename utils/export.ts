import * as XLSX from 'xlsx';
import { OOHRecord } from '../types';

// Помощник для определения порядка месяцев
const getMonthIndex = (monthStr: string) => {
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const m = monthStr.toLowerCase().slice(0, 3);
  return months.findIndex(x => x === m);
};

export const exportToExcel = (data: OOHRecord[], fileName: string = 'OOH_Aggregated_Report') => {
  if (!data || data.length === 0) return;

  const workbook = XLSX.utils.book_new();

  // --- ЛИСТ 1: ОБЩАЯ СВОДКА (KPI) ---
  const totalGrp = data.reduce((acc, curr) => acc + (curr.grp || 0), 0);
  const avgGrp = data.length > 0 ? totalGrp / data.length : 0;
  
  const summaryData = [
    ['СВОДНЫЙ ОТЧЕТ ПО ЭФФЕКТИВНОСТИ OOH'],
    ['Дата выгрузки', new Date().toLocaleDateString('ru-RU')],
    ['Период/Выборка', `${data.length} рекламных поверхностей`],
    [],
    ['ОСНОВНЫЕ ПОКАЗАТЕЛИ'],
    ['Средний GRP (по всем городам)', Number(avgGrp.toFixed(4))],
    ['Общий OTS (суммарный, тыс. чел)', Number(data.reduce((acc, curr) => acc + (curr.ots || 0), 0).toFixed(2))],
    ['Количество уникальных городов', new Set(data.map(d => d.city)).size],
    ['Количество форматов', new Set(data.map(d => d.format)).size]
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, wsSummary, "Сводка");

  // --- ЛИСТ 2: МАТРИЦА (ГОРОД / ФОРМАТ) ---
  // Решает задачу: средний рейтинг по всем городам и форматам за период в одной таблице
  const cities = Array.from(new Set(data.map(d => d.city))).sort();
  const formats = Array.from(new Set(data.map(d => d.format))).sort();
  
  const matrixHeader = ['Город / Формат (Средний GRP)', ...formats];
  const matrixRows = cities.map(city => {
    const row: any[] = [city];
    formats.forEach(fmt => {
      // Фильтруем данные конкретно под ячейку (город + формат)
      const cellData = data.filter(d => d.city === city && d.format === fmt && (d.grp || 0) > 0);
      if (cellData.length > 0) {
        const avg = cellData.reduce((s, c) => s + (c.grp || 0), 0) / cellData.length;
        row.push(Number(avg.toFixed(3)));
      } else {
        row.push(null); // В Excel будет пустая ячейка
      }
    });
    return row;
  });
  const wsMatrix = XLSX.utils.aoa_to_sheet([matrixHeader, ...matrixRows]);
  XLSX.utils.book_append_sheet(workbook, wsMatrix, "Город_Формат");

  // --- ЛИСТ 3: ДЕТАЛЬНАЯ ДИНАМИКА (ГОРОД + ФОРМАТ + МЕСЯЦ) ---
  // Решает задачу: динамика всех городов и форматов без ручного переключения
  const dynGroups: Record<string, { sum: number, count: number, city: string, fmt: string, y: number, m: string }> = {};
  
  data.forEach(d => {
    const key = `${d.city}|${d.format}|${d.year}|${d.month}`;
    if (!dynGroups[key]) {
      dynGroups[key] = { sum: 0, count: 0, city: d.city, fmt: d.format, y: d.year, m: d.month };
    }
    dynGroups[key].sum += (d.grp || 0);
    dynGroups[key].count += 1;
  });

  const dynReportData = Object.values(dynGroups)
    .sort((a, b) => {
      if (a.city !== b.city) return a.city.localeCompare(b.city);
      if (a.y !== b.y) return a.y - b.y;
      return getMonthIndex(a.m) - getMonthIndex(b.m);
    })
    .map(item => ({
      'Город': item.city,
      'Формат': item.fmt,
      'Год': item.y,
      'Месяц': item.m,
      'Средний GRP': Number((item.sum / item.count).toFixed(3)),
      'Количество конструкций': item.count
    }));
  const wsDyn = XLSX.utils.json_to_sheet(dynReportData);
  
  // Авто-ширина колонок для листа динамики
  wsDyn['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 8 }, { wch: 10 }, { wch: 15 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, wsDyn, "Динамика_Детально");

  // Генерация файла
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${fileName}_${dateStr}.xlsx`);
};
