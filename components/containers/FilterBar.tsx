import React from 'react';
import { MultiSelect } from '../MultiSelect';
import { FilterState, ReportDataPoint, SmartOptions, UserRole } from '../../types';
import { exportToExcel } from '../../utils/export';

interface FilterBarProps {
  userRole: UserRole;
  filters: FilterState;
  smartOptions: SmartOptions;
  reportData: ReportDataPoint[];
  onFilterChange: (filters: Partial<FilterState>) => void;
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  userRole,
  filters,
  smartOptions,
  reportData,
  onFilterChange,
  onResetFilters,
}) => {
  return (
    <section className="bg-white border-b border-gray-200 sticky top-[73px] z-30 py-4 shadow-sm px-6">
      <div className="max-w-[1600px] mx-auto flex flex-wrap gap-4 items-end">
        <MultiSelect label="Город" value={filters.city} options={smartOptions.cities} onChange={(v) => onFilterChange({ city: v })} />
        <MultiSelect label="Год" value={filters.year} options={smartOptions.years} onChange={(v) => onFilterChange({ year: v })} />
        <MultiSelect label="Месяц" value={filters.month} options={smartOptions.months} onChange={(v) => onFilterChange({ month: v })} />
        <MultiSelect label="Формат" value={filters.format} options={smartOptions.formats} onChange={(v) => onFilterChange({ format: v })} />
        <MultiSelect label="Продавец" value={filters.vendor} options={smartOptions.vendors} onChange={(v) => onFilterChange({ vendor: v })} />
        <div className="ml-auto flex gap-2">
          {userRole === 'ADMIN' && <button onClick={() => exportToExcel(reportData)} className="px-6 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold uppercase hover:bg-teal-700 transition-colors">Excel</button>}
          <button onClick={onResetFilters} className="px-4 py-2 text-gray-400 hover:text-gray-600 text-xs font-bold uppercase">Сброс</button>
        </div>
      </div>
    </section>
  );
};
