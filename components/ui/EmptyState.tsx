import React from 'react';
import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Ничего не найдено',
  description = 'Попробуйте изменить фильтры и повторить поиск.',
  className = '',
}) => (
  <div className={`h-full min-h-[220px] w-full flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 ${className}`}>
    <div className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
      <SearchX size={28} className="text-slate-400" />
    </div>
    <h4 className="text-sm font-bold text-slate-800 mb-1">{title}</h4>
    <p className="text-xs text-slate-500">{description}</p>
  </div>
);
