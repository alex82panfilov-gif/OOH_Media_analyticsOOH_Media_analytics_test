import React from 'react';
import { MapDataItem } from '../../types';
import { MapViz } from '../MapViz';

export const MapTab: React.FC<{ data: MapDataItem[] }> = ({ data }) => (
  <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white p-2">
    <MapViz data={data} />
  </div>
);
