import React from 'react';
import { Trash2 } from 'lucide-react';
import { formatNumberRussian } from '../../utils/data';
import { useMediaPlanStore } from '../../store/useMediaPlanStore';

export const MediaPlanTab: React.FC = () => {
  const items = useMediaPlanStore((state) => state.items);
  const removeItem = useMediaPlanStore((state) => state.removeItem);
  const clear = useMediaPlanStore((state) => state.clear);

  const totals = React.useMemo(() => ({
    grp: items.length > 0 ? items.reduce((sum, item) => sum + item.grp, 0) / items.length : 0,
    ots: items.reduce((sum, item) => sum + item.ots, 0),
  }), [items]);

  const groupedByCity = React.useMemo(() => {
    const grouped = new Map<string, typeof items>();
    items.forEach((item) => {
      const key = item.city || 'Не указан';
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    });
    return Array.from(grouped.entries()).sort(([cityA], [cityB]) => cityA.localeCompare(cityB, 'ru'));
  }, [items]);

  const hasManyCities = groupedByCity.length > 1;

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
              <th className="px-4 py-3 text-left">Город</th>
              <th className="px-4 py-3 text-left">Объект</th>
              <th className="px-4 py-3 text-left">Формат</th>
              <th className="px-4 py-3 text-center">Период</th>
              <th className="px-4 py-3 text-right">GRP</th>
              <th className="px-4 py-3 text-right">OTS</th>
              <th className="px-4 py-3 text-right">Действие</th>
            </tr>
          </thead>
          <tbody>
            {groupedByCity.map(([city, cityItems]) => (
              <React.Fragment key={city}>
                {cityItems.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">{item.city}</td>
                    <td className="px-4 py-3 font-semibold">{item.title}</td>
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
                {hasManyCities && (
                  <tr className="border-t border-gray-200 bg-slate-50/70">
                    <td className="px-4 py-2 font-bold">{city}</td>
                    <td className="px-4 py-2 text-xs uppercase text-gray-500" colSpan={3}>Итого по городу</td>
                    <td className="px-4 py-2 text-right font-bold text-teal-700">
                      {formatNumberRussian(cityItems.reduce((sum, item) => sum + item.grp, 0) / cityItems.length)}
                    </td>
                    <td className="px-4 py-2 text-right font-bold">
                      {formatNumberRussian(cityItems.reduce((sum, item) => sum + item.ots, 0), 1)}
                    </td>
                    <td className="px-4 py-2" />
                  </tr>
                )}
              </React.Fragment>
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
