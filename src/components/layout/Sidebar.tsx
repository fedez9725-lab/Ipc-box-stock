import React from 'react';
import {
  Package,
  Layers,
  Truck,
  FileSpreadsheet,
  AlertTriangle,
  History,
  BarChart3,
  Settings as SettingsIcon,
  Calculator,
  ShieldCheck,
  Menu,
  X,
  PlusCircle,
  Warehouse,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';

export type TabType =
  | 'dashboard'
  | 'stock'
  | 'ipc-sheet'
  | 'piles'
  | 'orders'
  | 'workorders'
  | 'forecast'
  | 'movements'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  mobileOpen,
  setMobileOpen,
}) => {
  const { metrics, settings, orders, workOrders } = useStock();

  const pendingOrdersCount = orders.filter(o => o.stato === 'IN_ATTESA' || o.stato === 'PARZIALE').length;
  const activeWorkOrdersCount = workOrders.filter(w => w.stato === 'IN_CORSO' || w.stato === 'PIANIFICATA').length;

  const navItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: Layers, badge: null },
    {
      id: 'stock' as TabType,
      label: 'Stock & Componenti',
      icon: Package,
      badge: metrics.boxUtilizzabili.toString(),
      badgeColor: metrics.statoScorta === 'ROSSO' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white',
    },
    {
      id: 'ipc-sheet' as TabType,
      label: 'Scheda Inventario IPC',
      icon: FileSpreadsheet,
      badge: metrics.totaleComponentiRotte > 0 ? `${metrics.totaleComponentiRotte} rotti` : null,
      badgeColor: metrics.totaleComponentiRotte > 0 ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-300',
    },
    { id: 'piles' as TabType, label: 'Pile IPC BOX (Max 7)', icon: Warehouse, badge: 'Max 7' },
    {
      id: 'orders' as TabType,
      label: 'Ordini & Ricezioni',
      icon: Truck,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount.toString() : null,
      badgeColor: 'bg-blue-600 text-white',
    },
    {
      id: 'workorders' as TabType,
      label: 'Lavorazioni & Utilizzo',
      icon: FileSpreadsheet,
      badge: activeWorkOrdersCount > 0 ? activeWorkOrdersCount.toString() : null,
      badgeColor: 'bg-amber-600 text-white',
    },
    { id: 'forecast' as TabType, label: 'Fabbisogno & Calcolo', icon: Calculator, badge: null },
    { id: 'movements' as TabType, label: 'Storico Movimenti', icon: History, badge: null },
    { id: 'reports' as TabType, label: 'Report & Analisi', icon: BarChart3, badge: null },
    { id: 'settings' as TabType, label: 'Impostazioni Hub', icon: SettingsIcon, badge: null },
  ];

  const handleSelect = (tab: TabType) => {
    setCurrentTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          id="sidebar-mobile-backdrop"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-72 bg-slate-900 border-r border-slate-800 text-slate-200 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold text-lg border border-blue-400/30">
              IPC
            </div>
            <div>
              <h1 className="font-bold text-white text-base tracking-tight leading-tight">IPC BOX Hub</h1>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    metrics.statoScorta === 'VERDE'
                      ? 'bg-emerald-500 ring-2 ring-emerald-500/30'
                      : metrics.statoScorta === 'GIALLO'
                      ? 'bg-amber-500 ring-2 ring-amber-500/30'
                      : 'bg-red-500 ring-2 ring-red-500/30 animate-pulse'
                  }`}
                />
                {settings.codiceHub}
              </p>
            </div>
          </div>
          <button
            id="close-mobile-sidebar-btn"
            onClick={() => setMobileOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
            aria-label="Chiudi menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Mini Summary Card */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
          <div className="flex items-center justify-between text-slate-300 font-medium mb-1">
            <span>Disponibilità Immediata</span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                metrics.statoScorta === 'VERDE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : metrics.statoScorta === 'GIALLO'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}
            >
              {metrics.boxUtilizzabili} BOX
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400 text-[11px] mt-1.5 pt-1.5 border-t border-slate-700/40">
            <span>Basi: <strong className="text-slate-200">{metrics.basiDisponibili}</strong></span>
            <span>Coperchi: <strong className="text-slate-200">{metrics.coperchiDisponibili}</strong></span>
            <span>Rotti: <strong className="text-rose-400">{metrics.totaleComponentiRotte}</strong></span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu Operativo
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
          <div className="flex items-center gap-2 mb-1 text-slate-300 font-medium truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">{settings.nomeHub}</span>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500">
            <span>Soglia min: {settings.sogliaMinimaScorta} BOX</span>
            <span>Pile: Max 7</span>
          </div>
        </div>
      </aside>
    </>
  );
};
