import React from 'react';
import { SkeletonBlock } from './SkeletonBlock';

export const TabLoadingFallback: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <SkeletonBlock className="h-[110px]" />
      <SkeletonBlock className="h-[110px]" />
      <SkeletonBlock className="h-[110px]" />
    </div>
    <SkeletonBlock className="h-[420px]" />
  </div>
);
