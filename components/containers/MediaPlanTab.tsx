import React from 'react';
import { Trash2 } from 'lucide-react';
import { formatNumberRussian } from '../../utils/data';
import { useMediaPlanStore } from '../../store/useMediaPlanStore';

export const MediaPlanTab: React.FC = () => {
  const items = useMediaPlanStore((state) => state.items);
  const removeItem = useMediaPlanStore((state) => state.removeItem);
  const clear = useMediaPlanStore((state) => state.clear);

  const totals = React.useMemo(() => ({
    grp: items.reduce((sum, item) => sum + item.grp, 0),
    ots: items.reduce((sum, item) => sum + item.ots, 0),
  }), [items]);

  if (items.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500 min-h-[50vh] flex flex-col justify-center">
        <p className="text-sm font-bold uppercase tracking-wide">Медиаплан пуст</p>
        <p className="text-xs mt-2">Добавьте поверхности кнопкой «В план» на карте или в отчете.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
        <h2 className="text-sm font-black uppercase text-slate-900">Медиаплан</h2>
        <button onClick={clear} className="text-[11px] font-bold uppercase text-gray-500 hover:text-red-600">Очистить</button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Объект</th>
              <th className="px-4 py-3 text-left">Город</th>
              <th className="px-4 py-3 text-left">Формат</th>
              <th className="px-4 py-3 text-center">Период</th>
              <th className="px-4 py-3 text-right">GRP</th>
              <th className="px-4 py-3 text-right">OTS</th>
              <th className="px-4 py-3 text-right">Действие</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold">{item.title}</td>
                <td className="px-4 py-3">{item.city}</td>
                <td className="px-4 py-3">{item.format}</td>
                <td className="px-4 py-3 text-center">{item.period}</td>
                <td className="px-4 py-3 text-right text-teal-700 font-bold">{formatNumberRussian(item.grp)}</td>
                <td className="px-4 py-3 text-right">{formatNumberRussian(item.ots, 1)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <button onClick={() => removeItem(item.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" aria-label="Удалить из медиаплана">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t border-gray-200">
            <tr>
              <td className="px-4 py-3 font-black uppercase" colSpan={4}>Итого</td>
              <td className="px-4 py-3 text-right font-black text-teal-700">{formatNumberRussian(totals.grp)}</td>
              <td className="px-4 py-3 text-right font-black">{formatNumberRussian(totals.ots, 1)}</td>
              <td className="px-4 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
