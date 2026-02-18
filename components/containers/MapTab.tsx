import React from 'react';
import { MapViz } from '../MapViz';
import { MapDataPoint } from '../../types';

export const MapTab: React.FC<{ data: MapDataPoint[] }> = ({ data }) => {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white p-2">
      <MapViz data={data} />
    </div>
  );
};
