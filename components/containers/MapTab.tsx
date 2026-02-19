import React from 'react';
import { MapDataItem } from '../../types';
import { MapViz } from '../MapViz';
import { EmptyState } from '../ui/EmptyState';
import { SkeletonBlock } from '../ui/SkeletonBlock';

interface MapTabProps {
  data: MapDataItem[];
  isLoading: boolean;
}

export const MapTab: React.FC<MapTabProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return <SkeletonBlock className="h-[70vh] border border-gray-200" />;
  }

  if (data.length === 0) {
    return <EmptyState className="min-h-[70vh]" />;
  }

  return (
    <>
      <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white p-2 hidden md:block">
        <MapViz data={data} />
      </div>
      <div className="md:hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-100 to-slate-200 p-6 min-h-[260px] flex flex-col justify-end">
        <div className="text-xs uppercase font-black text-gray-500 mb-2">Карта отключена на мобильных</div>
        <p className="text-sm text-gray-700">Для интерактивной карты откройте дашборд на планшете или десктопе.</p>
      </div>
    </>
  );
};
