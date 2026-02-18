import React from 'react';
import { TabView } from './types';
import { useStore } from './store/useStore';
import { useAuth } from './hooks/useAuth';
import { useDataFetcher } from './hooks/useDataFetcher';

// Компоненты
import { TrendChart, FormatBarChart, VendorTreemap } from './components/Charts';
import { MapViz } from './components/MapViz';
import { MultiSelect } from './components/MultiSelect';
import { PivotReports } from './components/Reports';
import { formatNumberRussian, formatCompactRussian } from './utils/data';
import { exportToExcel } from './utils/export';

const App: React.FC = () => {
  const { 
    userRole, activeTab, setActiveTab, isLoading, 
    filters, setFilters, resetFilters, logout,
    mapData, trendData, matrixData, reportData, smartOptions, kpis
  } = useStore();

  useDataFetcher();
  const { password, setPassword, handleLogin, loginError, isAuthLoading } = useAuth();

  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900">OOH <span className="text-teal-600">Analytics</span></h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" className={`w-full px-6 py-4 rounded-2xl border-2 outline-none ${loginError ? 'border-red-500 bg-red-50' : 'border-gray-100 focus:border-teal-500 bg-gray-50'}`} />
            <button type="submit" disabled={isAuthLoading} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-800 disabled:bg-gray-400 shadow-lg">{isAuthLoading ? 'Проверка...' : 'Войти'}</button>
            {loginError && <p className="text-red-500 text-[10px] font-bold uppercase text-center">Неверный пароль</p>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
      <div className="h-1 w-full fixed top-0 left-0 z-[100] overflow-hidden bg-gray-100">
        {isLoading && <div className="h-full bg-teal-500 animate-[pulse_2s_infinite] w-full shadow-[0_0_8px_rgba(20,184,166,0.5)]"></div>}
      </div>

      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-xl font-black uppercase tracking-tighter text-slate-900">OOH <span className="text-teal-600">Analytics</span></h1>
          <nav className="flex bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setActiveTab(TabView.ANALYTICS)} className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === TabView.ANALYTICS ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'}`}>Дашборд</button>
            {userRole === 'ADMIN' && (
              <>
                <button onClick={() => setActiveTab(TabView.MAP)} className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === TabView.MAP ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'}`}>Карта</button>
                <button onClick={() => setActiveTab(TabView.REPORTS)} className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === TabView.REPORTS ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'}`}>Отчеты</button>
              </>
            )}
          </nav>
          <button onClick={logout} className="text-[10px] font-bold text-gray-400 uppercase hover:text-red-500">Выход</button>
        </div>
      </header>

      <section className="bg-white border-b border-gray-200 sticky top-[73px] z-30 py-4 shadow-sm px-6">
        <div className="max-w-[1600px] mx-auto flex flex-wrap gap-4 items-end">
          <MultiSelect label="Город" value={filters.city} options={smartOptions.cities} onChange={v => setFilters({city: v})} />
          <MultiSelect label="Год" value={filters.year} options={smartOptions.years} onChange={v => setFilters({year: v})} />
          <MultiSelect label="Месяц" value={filters.month} options={smartOptions.months} onChange={v => setFilters({month: v})} />
          <MultiSelect label="Формат" value={filters.format} options={smartOptions.formats} onChange={v => setFilters({format: v})} />
          <MultiSelect label="Продавец" value={filters.vendor} options={smartOptions.vendors} onChange={v => setFilters({vendor: v})} />
          <div className="ml-auto flex gap-2">
            {userRole === 'ADMIN' && <button onClick={() => exportToExcel(reportData)} className="px-6 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold uppercase hover:bg-teal-700 transition-colors">Excel</button>}
            <button onClick={resetFilters} className="px-4 py-2 text-gray-400 hover:text-gray-600 text-xs font-bold uppercase">Сброс</button>
          </div>
        </div>
      </section>

      <main className="max-w-[1600px] mx-auto w-full p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Средний GRP</div>
            <div className="text-3xl font-black text-slate-900">{formatNumberRussian(kpis.avgGrp)}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Общий OTS в сутки</div>
            <div className="text-3xl font-black text-slate-900">{formatCompactRussian(kpis.totalOts * 1000)} <span className="text-xs text-gray-400 ml-1 font-normal">контактов</span></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Уникальных поверхностей</div>
            <div className="text-3xl font-black text-slate-900">{kpis.uniqueSurfaces.toLocaleString()}</div>
          </div>
        </div>

        {activeTab === TabView.ANALYTICS && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 h-[400px]">
                <TrendChart data={trendData} />
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 h-[400px]">
                <FormatBarChart data={matrixData} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
               <VendorTreemap data={mapData} />
            </div>
          </div>
        )}

        {activeTab === TabView.MAP && userRole === 'ADMIN' && (
          <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white p-2">
             <MapViz data={mapData} />
          </div>
        )}

        {activeTab === TabView.REPORTS && userRole === 'ADMIN' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
             <PivotReports data={reportData} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
