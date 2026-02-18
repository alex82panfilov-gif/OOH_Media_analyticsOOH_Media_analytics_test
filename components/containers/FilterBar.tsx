import React, { useCallback } from 'react';
import { MultiSelect } from '../MultiSelect';
import { FilterState, ReportDataItem, SmartOptions, UserRole } from '../../types';
import { exportToExcel } from '../../utils/export';

interface FilterBarProps {
  filters: FilterState;
  smartOptions: SmartOptions;
  reportData: ReportDataItem[];
  userRole: UserRole;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  smartOptions,
  reportData,
  userRole,
  setFilters,
  resetFilters,
}) => {
  const handleCityChange = useCallback((value: string[]) => setFilters({ city: value }), [setFilters]);
  const handleYearChange = useCallback((value: string[]) => setFilters({ year: value }), [setFilters]);
  const handleMonthChange = useCallback((value: string[]) => setFilters({ month: value }), [setFilters]);
  const handleFormatChange = useCallback((value: string[]) => setFilters({ format: value }), [setFilters]);
  const handleVendorChange = useCallback((value: string[]) => setFilters({ vendor: value }), [setFilters]);

  return (
    <section className="bg-white border-b border-gray-200 sticky top-[73px] z-30 py-4 shadow-sm px-6">
      <div className="max-w-[1600px] mx-auto flex flex-wrap gap-4 items-end">
        <MultiSelect label="Город" value={filters.city} options={smartOptions.cities} onChange={handleCityChange} />
        <MultiSelect label="Год" value={filters.year} options={smartOptions.years} onChange={handleYearChange} />
        <MultiSelect label="Месяц" value={filters.month} options={smartOptions.months} onChange={handleMonthChange} />
        <MultiSelect label="Формат" value={filters.format} options={smartOptions.formats} onChange={handleFormatChange} />
        <MultiSelect label="Продавец" value={filters.vendor} options={smartOptions.vendors} onChange={handleVendorChange} />
        <div className="ml-auto flex gap-2">
          {userRole === 'ADMIN' && <button onClick={() => exportToExcel(reportData)} className="px-6 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold uppercase hover:bg-teal-700 transition-colors">Excel</button>}
          <button onClick={resetFilters} className="px-4 py-2 text-gray-400 hover:text-gray-600 text-xs font-bold uppercase">Сброс</button>
        </div>
      </div>
    </section>
  );
};
