import React from 'react';
import { ReportDataItem } from '../../types';
import { PivotReports } from '../Reports';
import { EmptyState } from '../ui/EmptyState';
import { SkeletonBlock } from '../ui/SkeletonBlock';

interface ReportsTabProps {
  data: ReportDataItem[];
  isLoading: boolean;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return <SkeletonBlock className="h-[60vh] border border-gray-200" />;
  }

  if (data.length === 0) {
    return <EmptyState className="min-h-[60vh]" />;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <PivotReports data={data} />
    </div>
  );
};
