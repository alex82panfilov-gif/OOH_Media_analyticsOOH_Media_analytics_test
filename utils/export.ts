import * as XLSX from 'xlsx';
import { ReportDataItem } from '../types';

// Помощник для определения порядка месяцев
const getMonthIndex = (monthStr: string) => {
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const m = monthStr.toLowerCase().slice(0, 3);
  return months.findIndex(x => x === m);
};

export const exportToExcel = (data: ReportDataItem[], fileName: string = 'OOH_Aggregated_Report') => {
  if (!data || data.length === 0) return;

  const workbook = XLSX.utils.book_new();

  // --- ЛИСТ 1: ОБЩАЯ СВОДКА (KPI) ---
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
    ['Количество уникальных городов', new Set(data.map(d => d.city)).size],
    ['Количество форматов', new Set(data.map(d => d.format)).size],
    ['Количество периодов (город+формат+месяц)', data.length],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'Сводка');

  // --- ЛИСТ 2: МАТРИЦА (ГОРОД / ФОРМАТ) ---
  const cities = Array.from(new Set(data.map(d => d.city))).sort();
  const formats = Array.from(new Set(data.map(d => d.format))).sort();

  const matrixHeader = ['Город / Формат (Средний GRP)', ...formats];
  const matrixRows = cities.map(city => {
    const row: (string | number | null)[] = [city];
    formats.forEach(fmt => {
      const cellData = data.filter(d => d.city === city && d.format === fmt && (d.avgGrp || 0) > 0);
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
  const wsMatrix = XLSX.utils.aoa_to_sheet([matrixHeader, ...matrixRows]);
  XLSX.utils.book_append_sheet(workbook, wsMatrix, 'Город_Формат');

  // --- ЛИСТ 3: ДЕТАЛЬНАЯ ДИНАМИКА (ГОРОД + ФОРМАТ + МЕСЯЦ) ---
  const dynReportData = [...data]
    .sort((a, b) => {
      if (a.city !== b.city) return a.city.localeCompare(b.city);
      if (a.year !== b.year) return a.year - b.year;
      return getMonthIndex(a.month) - getMonthIndex(b.month);
    })
    .map(item => ({
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

  const dateStr = new Date().toISOString().split('T')[0];
  const fullFileName = `${fileName}_${dateStr}.xlsx`;

  // XLSX.writeFile может не работать в некоторых браузерах/сборках,
  // поэтому формируем Blob и инициируем скачивание вручную.
  const workbookBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([workbookBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fullFileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // В некоторых браузерах мгновенный revokeObjectURL отменяет скачивание.
  // Небольшая задержка делает поведение стабильным.
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
};
