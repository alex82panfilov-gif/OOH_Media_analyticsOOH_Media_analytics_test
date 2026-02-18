import React from 'react';
import { TabView } from './types';
import { useAuthStore } from './store/useAuthStore';
import { useUIStore } from './store/useUIStore';
import { useDataStore } from './store/useDataStore';
import { useAuth } from './hooks/useAuth';
import { useDataFetcher } from './hooks/useDataFetcher';
import { useFilterUrlSync } from './hooks/useFilterUrlSync';
import { AuthGate } from './components/containers/AuthGate';
import { TopNav } from './components/containers/TopNav';
import { FilterBar } from './components/containers/FilterBar';
import { AnalyticsTab } from './components/containers/AnalyticsTab';
import { MapTab } from './components/containers/MapTab';
import { ReportsTab } from './components/containers/ReportsTab';

const App: React.FC = () => {
  const userRole = useAuthStore((state) => state.userRole);
  const logoutAuth = useAuthStore((state) => state.logout);
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const resetUIState = useUIStore((state) => state.resetUIState);
  const isLoading = useUIStore((state) => state.isLoading);

  const filters = useDataStore((state) => state.filters);
  const setFilters = useDataStore((state) => state.setFilters);
  const resetFilters = useDataStore((state) => state.resetFilters);
  const mapData = useDataStore((state) => state.mapData);
  const trendData = useDataStore((state) => state.trendData);
  const matrixData = useDataStore((state) => state.matrixData);
  const reportData = useDataStore((state) => state.reportData);
  const smartOptions = useDataStore((state) => state.smartOptions);
  const kpis = useDataStore((state) => state.kpis);
  const resetDataState = useDataStore((state) => state.resetDataState);

  useDataFetcher();
  useFilterUrlSync();

  const logout = React.useCallback(() => {
    logoutAuth();
    resetUIState();
    resetDataState();
  }, [logoutAuth, resetUIState, resetDataState]);

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
            isLoading={isLoading}
          />
        )}

        {activeTab === TabView.MAP && userRole === 'ADMIN' && <MapTab data={mapData} isLoading={isLoading} />}

        {activeTab === TabView.REPORTS && userRole === 'ADMIN' && <ReportsTab data={reportData} isLoading={isLoading} />}
      </main>
    </div>
  );
};

export default App;
