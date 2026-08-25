import React, { useState } from 'react';
import { StockProvider } from './context/StockContext';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { StockView } from './components/stock/StockView';
import { IPCInventoryView } from './components/ipc/IPCInventoryView';
import { EmbargoView } from './components/embargo/EmbargoView';
import { WorkstationsView } from './components/dispacciatori/WorkstationsView';
import { PilesView } from './components/piles/PilesView';
import { OrdersView } from './components/orders/OrdersView';
import { WorkOrdersView } from './components/workorders/WorkOrdersView';
import { ForecastView } from './components/forecast/ForecastView';
import { MovementsView } from './components/movements/MovementsView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { QuickActionModals } from './components/modals/QuickActionModals';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<
    'reception' | 'usage' | 'damage' | 'recovery' | 'adjust' | 'zero' | null
  >(null);

  const openModal = (modal: 'reception' | 'usage' | 'damage' | 'recovery' | 'adjust' | 'zero') => {
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <StockProvider>
      <div id="app-root" className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col antialiased">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* Main Content Area (offset on large screens by sidebar width) */}
        <div className="flex-1 flex flex-col lg:pl-72 min-w-0 transition-all duration-200">
          {/* Top Navbar */}
          <Navbar
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            setMobileOpen={setMobileOpen}
            openModal={openModal}
          />

          {/* Body Content Container - High Density layout */}
          <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto space-y-4">
            {currentTab === 'dashboard' && (
              <DashboardView setCurrentTab={setCurrentTab} openModal={openModal} />
            )}
            {currentTab === 'workstations' && <WorkstationsView />}
            {currentTab === 'stock' && <StockView openModal={openModal} />}
            {currentTab === 'ipc-sheet' && <IPCInventoryView />}
            {currentTab === 'embargo' && <EmbargoView />}
            {currentTab === 'piles' && <PilesView />}
            {currentTab === 'orders' && <OrdersView openModal={openModal} />}
            {currentTab === 'workorders' && <WorkOrdersView openModal={openModal} />}
            {currentTab === 'forecast' && <ForecastView setCurrentTab={setCurrentTab} />}
            {currentTab === 'movements' && <MovementsView />}
            {currentTab === 'reports' && <ReportsView />}
            {currentTab === 'settings' && <SettingsView />}
          </main>
        </div>

        {/* Global Action Modals */}
        <QuickActionModals currentModal={activeModal} closeModal={closeModal} />
      </div>
    </StockProvider>
  );
}
