import React from 'react';
import { PivotReports } from '../Reports';
import { ReportDataPoint } from '../../types';

export const ReportsTab: React.FC<{ data: ReportDataPoint[] }> = ({ data }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <PivotReports data={data} />
    </div>
  );
};
