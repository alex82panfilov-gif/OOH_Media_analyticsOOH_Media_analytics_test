import React from 'react';
import { TabView, UserRole } from '../../types';

interface TopNavProps {
  activeTab: TabView;
  userRole: UserRole;
  setActiveTab: (tab: TabView) => void;
  logout: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ activeTab, userRole, setActiveTab, logout }) => (
  <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm px-6 py-4">
    <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
      <h1 className="text-xl font-black uppercase tracking-tighter text-slate-900">OOH <span className="text-teal-600">Analytics</span></h1>
      <nav className="flex bg-gray-100 p-1 rounded-xl">
        <button onClick={() => setActiveTab(TabView.ANALYTICS)} className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === TabView.ANALYTICS ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'}`}>Дашборд</button>
        {userRole === 'ADMIN' && (
          <>
            <button onClick={() => setActiveTab(TabView.MAP)} className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === TabView.MAP ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'}`}>Карта</button>
            <button onClick={() => setActiveTab(TabView.REPORTS)} className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === TabView.REPORTS ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'}`}>Отчеты</button>
            <button onClick={() => setActiveTab(TabView.MEDIA_PLAN)} className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === TabView.MEDIA_PLAN ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'}`}>Медиаплан</button>
          </>
        )}
      </nav>
      <button onClick={logout} className="text-[10px] font-bold text-gray-400 uppercase hover:text-red-500">Выход</button>
    </div>
  </header>
);
