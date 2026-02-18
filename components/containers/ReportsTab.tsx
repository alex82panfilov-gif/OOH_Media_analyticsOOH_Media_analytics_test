import React from 'react';
import { ReportDataItem } from '../../types';
import { PivotReports } from '../Reports';

export const ReportsTab: React.FC<{ data: ReportDataItem[] }> = ({ data }) => (
  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
    <PivotReports data={data} />
  </div>
);
