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
    <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white p-2">
      <MapViz data={data} />
    </div>
  );
};
