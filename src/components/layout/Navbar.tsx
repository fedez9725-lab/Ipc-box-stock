import React from 'react';
import {
  Menu,
  AlertTriangle,
  PlusCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wrench,
  UserCheck,
  PackageCheck,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { TabType } from './Sidebar';

interface NavbarProps {
  currentTab: TabType;
  setMobileOpen: (open: boolean) => void;
  openModal: (modal: 'reception' | 'usage' | 'damage' | 'recovery' | 'adjust' | 'zero') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setMobileOpen,
  openModal,
}) => {
  const { metrics, settings, activeOperator, setActiveOperator } = useStock();

  const getTabTitle = (tab: TabType) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard Panoramica';
      case 'stock':
        return 'Gestione Stock & Componenti IPC';
      case 'piles':
        return 'Mappa Pile Magazzino (Max 7 BOX)';
      case 'orders':
        return 'Ordini Fornitori & Ricezione';
      case 'workorders':
        return 'Lavorazioni & Consumi Linea';
      case 'forecast':
        return 'Previsione Fabbisogno & Calcolatore';
      case 'movements':
        return 'Registro Storico Movimentazioni';
      case 'reports':
        return 'Report Statistiche & Danneggiamenti';
      case 'settings':
        return 'Configurazione Hub & Parametri';
      default:
        return 'Gestionale IPC BOX';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left Side: Hamburger & Title */}
        <div className="flex items-center gap-3">
          <button
            id="open-mobile-sidebar-btn"
            onClick={() => setMobileOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden"
            aria-label="Apri menu laterale"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>{getTabTitle(currentTab)}</span>
            </h2>
            <p className="text-xs text-slate-500 hidden sm:block">
              {settings.nomeHub} &bull; <span className="font-mono">{settings.codiceHub}</span>
            </p>
          </div>
        </div>

        {/* Right Side: Quick Action Buttons & Operator */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Quick Stock Indicator Badge */}
          <div
            id="navbar-stock-indicator"
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
              metrics.statoScorta === 'VERDE'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : metrics.statoScorta === 'GIALLO'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-red-50 text-red-800 border-red-200 animate-pulse'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                metrics.statoScorta === 'VERDE'
                  ? 'bg-emerald-500'
                  : metrics.statoScorta === 'GIALLO'
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
            />
            <span>
              <strong>{metrics.boxUtilizzabili}</strong> BOX Utilizzabili
            </span>
            <span className="text-slate-400">|</span>
            <span className="font-normal text-slate-600">
              Min: {settings.sogliaMinimaScorta}
            </span>
          </div>

          {/* Operator Switcher */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              id="active-operator-select"
              value={activeOperator}
              onChange={e => setActiveOperator(e.target.value)}
              className="bg-transparent border-none text-slate-800 font-medium focus:ring-0 cursor-pointer text-xs pr-4 py-0.5 outline-none"
            >
              {settings.operatori.map(op => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Action Trigger Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              id="btn-quick-reception"
              onClick={() => openModal('reception')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
              title="Registra arrivo fornitura"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ricevi Carico</span>
            </button>

            <button
              id="btn-quick-usage"
              onClick={() => openModal('usage')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-xs transition-colors"
              title="Registra prelievo box per lavorazione"
            >
              <ArrowUpFromLine className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Scarica Box</span>
            </button>

            <button
              id="btn-quick-damage"
              onClick={() => openModal('damage')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              title="Registra rottura o componente mancante"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden md:inline">Danno</span>
            </button>

            <button
              id="btn-quick-recovery"
              onClick={() => openModal('recovery')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
              title="Recupera o ripara componenti"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">Recupero</span>
            </button>

            <button
              id="btn-quick-zero"
              onClick={() => openModal('zero')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              title="Azzera tutto o ripristina dati iniziali"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden xl:inline">Azzera Tutto</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Critical Alert Banner if Low Stock or Insufficient */}
      {metrics.messaggioAllerta && (
        <div
          id="global-critical-alert"
          className={`px-4 sm:px-6 py-2 border-t text-xs font-medium flex items-center justify-between ${
            metrics.statoScorta === 'ROSSO'
              ? 'bg-red-600 text-white border-red-700 shadow-inner'
              : 'bg-amber-100 text-amber-900 border-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 shrink-0 ${metrics.statoScorta === 'ROSSO' ? 'text-white animate-bounce' : 'text-amber-700'}`} />
            <span>{metrics.messaggioAllerta}</span>
          </div>
          <span className="font-bold underline text-[11px] cursor-pointer" onClick={() => openModal('reception')}>
            Pianifica Rifornimento &rarr;
          </span>
        </div>
      )}
    </header>
  );
};
