import React from 'react';
import { useMediaPlanStore } from '../../store/mediaPlanStore';
import { formatNumberRussian } from '../../utils/data';
import { EmptyState } from '../ui/EmptyState';

export const MediaPlanTab: React.FC = () => {
  const items = useMediaPlanStore((state) => state.items);
  const removeItem = useMediaPlanStore((state) => state.removeItem);
  const clearPlan = useMediaPlanStore((state) => state.clearPlan);
  const totalGrp = useMediaPlanStore((state) => state.totalGrp());
  const totalOts = useMediaPlanStore((state) => state.totalOts());

  if (items.length === 0) {
    return <EmptyState title="Медиаплан пуст" description="Добавьте поверхности из карты или строки отчета через кнопку +" className="min-h-[60vh]" />;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase text-slate-700">Медиаплан</h2>
        <button onClick={clearPlan} className="text-[10px] font-bold uppercase text-gray-400 hover:text-red-500">Очистить</button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Адрес / Период</th>
              <th className="px-4 py-3 text-left">Город</th>
              <th className="px-4 py-3 text-left">Формат</th>
              <th className="px-4 py-3 text-left">Продавец</th>
              <th className="px-4 py-3 text-right">GRP</th>
              <th className="px-4 py-3 text-right">OTS</th>
              <th className="px-4 py-3 text-right">Действие</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-700">{item.address}</div>
                  <div className="text-[10px] text-gray-400">{item.month} {item.year}</div>
                </td>
                <td className="px-4 py-3">{item.city}</td>
                <td className="px-4 py-3">{item.format}</td>
                <td className="px-4 py-3">{item.vendor}</td>
                <td className="px-4 py-3 text-right font-bold text-teal-600">{formatNumberRussian(item.avgGrp)}</td>
                <td className="px-4 py-3 text-right">{formatNumberRussian(item.avgOts, 1)}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => removeItem(item.id)} className="text-red-500 font-bold">−</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-100 bg-slate-50 flex flex-wrap gap-6 justify-end">
        <div className="text-xs font-bold">Итого GRP: <span className="text-teal-700">{formatNumberRussian(totalGrp)}</span></div>
        <div className="text-xs font-bold">Итого OTS: <span className="text-slate-900">{formatNumberRussian(totalOts, 1)}</span></div>
      </div>
    </div>
  );
};
