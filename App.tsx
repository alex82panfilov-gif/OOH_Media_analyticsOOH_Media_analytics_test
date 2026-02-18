import React from 'react';
import { TabView } from './types';
import { useStore } from './store/useStore';
import { useAuth } from './hooks/useAuth';
import { useDataFetcher } from './hooks/useDataFetcher';
import { AnalyticsTab, AuthGate, FilterBar, MapTab, ReportsTab, TopNav } from './components/containers';

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
        isAuthLoading={isAuthLoading}
        loginError={loginError}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
      <TopNav
        userRole={userRole}
        activeTab={activeTab}
        isLoading={isLoading}
        onTabChange={setActiveTab}
        onLogout={logout}
      />

      <FilterBar
        userRole={userRole}
        filters={filters}
        smartOptions={smartOptions}
        reportData={reportData}
        onFilterChange={setFilters}
        onResetFilters={resetFilters}
      />

      <main className="max-w-[1600px] mx-auto w-full p-6 space-y-6">
        {activeTab === TabView.ANALYTICS && (
          <AnalyticsTab kpis={kpis} trendData={trendData} matrixData={matrixData} mapData={mapData} />
        )}

        {activeTab === TabView.MAP && userRole === 'ADMIN' && <MapTab data={mapData} />}

        {activeTab === TabView.REPORTS && userRole === 'ADMIN' && <ReportsTab data={reportData} />}
      </main>
    </div>
  );
};

export default App;
