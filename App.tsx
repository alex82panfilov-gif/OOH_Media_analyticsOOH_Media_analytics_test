import React from 'react';
import { TabView } from './types';
import { useStore } from './store/useStore';
import { useAuth } from './hooks/useAuth';
import { useDataFetcher } from './hooks/useDataFetcher';
import { AuthGate } from './components/containers/AuthGate';
import { TopNav } from './components/containers/TopNav';
import { FilterBar } from './components/containers/FilterBar';
import { AnalyticsTab } from './components/containers/AnalyticsTab';
import { MapTab } from './components/containers/MapTab';
import { ReportsTab } from './components/containers/ReportsTab';

const App: React.FC = () => {
  const {
    userRole,
    activeTab,
    setActiveTab,
    isLoading,
    filters,
    setFilters,
    resetFilters,
    logout,
    mapData,
    trendData,
    matrixData,
    reportData,
    smartOptions,
    kpis,
  } = useStore();

  useDataFetcher();
  const { password, setPassword, handleLogin, loginError, isAuthLoading } = useAuth();

  if (!userRole) {
    return (
      <AuthGate
        password={password}
        loginError={loginError}
        isAuthLoading={isAuthLoading}
        setPassword={setPassword}
        handleLogin={handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
      <div className="h-1 w-full fixed top-0 left-0 z-[100] overflow-hidden bg-gray-100">
        {isLoading && <div className="h-full bg-teal-500 animate-[pulse_2s_infinite] w-full shadow-[0_0_8px_rgba(20,184,166,0.5)]"></div>}
      </div>

      <TopNav activeTab={activeTab} userRole={userRole} setActiveTab={setActiveTab} logout={logout} />

      <FilterBar
        filters={filters}
        smartOptions={smartOptions}
        reportData={reportData}
        userRole={userRole}
        setFilters={setFilters}
        resetFilters={resetFilters}
      />

      <main className="max-w-[1600px] mx-auto w-full p-6 space-y-6">
        {activeTab === TabView.ANALYTICS && (
          <AnalyticsTab
            kpis={kpis}
            trendData={trendData}
            matrixData={matrixData}
            mapData={mapData}
          />
        )}

        {activeTab === TabView.MAP && userRole === 'ADMIN' && <MapTab data={mapData} />}

        {activeTab === TabView.REPORTS && userRole === 'ADMIN' && <ReportsTab data={reportData} />}
      </main>
    </div>
  );
};

export default App;
