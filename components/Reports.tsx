import React, { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { formatNumberRussian } from '../utils/data';

export const PivotReports: React.FC<{ data: any[] }> = ({ data }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Группируем данные для матрицы (Город / Формат)
  const matrix = useMemo(() => {
    const cities = Array.from(new Set(data.map(d => d.city))).sort();
    const formats = Array.from(new Set(data.map(d => d.format))).sort();
    const lookup: any = {};
    data.forEach(d => {
      if (!lookup[d.city]) lookup[d.city] = {};
      lookup[d.city][d.format] = d.avgGrp;
    });
    return { cities, formats, lookup };
  }, [data]);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  return (
    <div className="space-y-6 p-6">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-xs uppercase text-gray-500">Матрица GRP</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-[10px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3 text-left border-r border-gray-100">Город</th>
                {matrix.formats.map(f => <th key={f} className="p-3 text-center">{f}</th>)}
              </tr>
            </thead>
            <tbody>
              {matrix.cities.map(c => (
                <tr key={c} className="border-t border-gray-100 hover:bg-slate-50">
                  <td className="p-3 font-bold border-r border-gray-100">{c}</td>
                  {matrix.formats.map(f => (
                    <td key={f} className="p-3 text-center">{matrix.lookup[c]?.[f] ? formatNumberRussian(matrix.lookup[c][f]) : '-'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-xs uppercase text-gray-500">Детальный отчет</div>
        <div ref={parentRef} className="h-[400px] overflow-auto relative">
          <table className="min-w-full text-[11px]">
            <thead className="sticky top-0 z-10 bg-white shadow-sm">
              <tr>
                <th className="px-4 py-3 text-left">Город</th>
                <th className="px-4 py-3 text-left">Формат</th>
                <th className="px-4 py-3 text-center">Период</th>
                <th className="px-4 py-3 text-right">Средний GRP</th>
              </tr>
            </thead>
            <tbody style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = data[virtualRow.index];
                return (
                  <tr key={virtualRow.key} className="absolute top-0 left-0 w-full flex items-center border-b border-gray-50 hover:bg-gray-50" style={{ height: '40px', transform: `translateY(${virtualRow.start}px)` }}>
                    <td className="px-4 flex-1">{row.city}</td>
                    <td className="px-4 flex-1 text-gray-400">{row.format}</td>
                    <td className="px-4 flex-1 text-center">{row.month} {row.year}</td>
                    <td className="px-4 flex-1 text-right font-black text-teal-600">{formatNumberRussian(row.avgGrp)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
