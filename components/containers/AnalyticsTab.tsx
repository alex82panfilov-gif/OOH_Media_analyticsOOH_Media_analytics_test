import React from 'react';
import { TrendChart, FormatBarChart, VendorTreemap } from '../Charts';
import { formatCompactRussian, formatNumberRussian } from '../../utils/data';
import { KpiData, MapDataItem, MatrixDataItem, TrendDataItem } from '../../types';
import { EmptyState } from '../ui/EmptyState';
import { SkeletonBlock } from '../ui/SkeletonBlock';

interface AnalyticsTabProps {
  kpis: KpiData;
  trendData: TrendDataItem[];
  matrixData: MatrixDataItem[];
  mapData: MapDataItem[];
  isLoading: boolean;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ kpis, trendData, matrixData, mapData, isLoading }) => {
  const hasAnyData = trendData.length > 0 || matrixData.length > 0 || mapData.length > 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonBlock className="h-[110px]" />
          <SkeletonBlock className="h-[110px]" />
          <SkeletonBlock className="h-[110px]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonBlock className="lg:col-span-2 h-[400px]" />
          <SkeletonBlock className="h-[400px]" />
        </div>
        <SkeletonBlock className="h-64" />
      </div>
    );
  }

  if (!hasAnyData) {
    return <EmptyState className="min-h-[460px]" />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Средний GRP</div>
          <div className="text-3xl font-black text-slate-900">{formatNumberRussian(kpis.avgGrp)}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Общий OTS в сутки</div>
          <div className="text-3xl font-black text-slate-900">{formatCompactRussian(kpis.totalOts * 1000)} <span className="text-xs text-gray-400 ml-1 font-normal">контактов</span></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Уникальных поверхностей</div>
          <div className="text-3xl font-black text-slate-900">{kpis.uniqueSurfaces.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 h-[400px]">
          <TrendChart data={trendData} />
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 h-[400px]">
          <FormatBarChart data={matrixData} />
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-gray-200">
        <VendorTreemap data={mapData} />
      </div>
    </div>
  );
};
