import React from 'react';
import { TabView, UserRole } from '../../types';

interface TopNavProps {
  userRole: UserRole;
  activeTab: TabView;
  isLoading: boolean;
  onTabChange: (tab: TabView) => void;
  onLogout: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ userRole, activeTab, isLoading, onTabChange, onLogout }) => {
  return (
    <>
      <div className="h-1 w-full fixed top-0 left-0 z-[100] overflow-hidden bg-gray-100">
        {isLoading && <div className="h-full bg-teal-500 animate-[pulse_2s_infinite] w-full shadow-[0_0_8px_rgba(20,184,166,0.5)]"></div>}
      </div>

      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-xl font-black uppercase tracking-tighter text-slate-900">OOH <span className="text-teal-600">Analytics</span></h1>
          <nav className="flex bg-gray-100 p-1 rounded-xl">
            <button onClick={() => onTabChange(TabView.ANALYTICS)} className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === TabView.ANALYTICS ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'}`}>Дашборд</button>
            {userRole === 'ADMIN' && (
              <>
                <button onClick={() => onTabChange(TabView.MAP)} className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === TabView.MAP ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'}`}>Карта</button>
                <button onClick={() => onTabChange(TabView.REPORTS)} className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === TabView.REPORTS ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'}`}>Отчеты</button>
              </>
            )}
          </nav>
          <button onClick={onLogout} className="text-[10px] font-bold text-gray-400 uppercase hover:text-red-500">Выход</button>
        </div>
      </header>
    </>
  );
};
