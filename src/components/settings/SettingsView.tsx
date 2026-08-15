import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Download,
  Upload,
  Plus,
  Trash2,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetAllData, zeroAllData } = useStock();

  const [minStock, setMinStock] = useState<number>(settings.sogliaMinimaScorta);
  const [warnStock, setWarnStock] = useState<number>(settings.sogliaAttenzioneScorta);
  const [maxPerPila, setMaxPerPila] = useState<number>(settings.maxBoxPerPila);
  const [safetyBuffer, setSafetyBuffer] = useState<number>(settings.scortaSicurezzaDefault);
  const [hubName, setHubName] = useState<string>(settings.nomeHub);
  const [hubCode, setHubCode] = useState<string>(settings.codiceHub);
  const [autoPiles, setAutoPiles] = useState<boolean>(settings.autoDistribuzionePile);

  const [zones, setZones] = useState<string[]>(settings.zoneDisponibili);
  const [newZone, setNewZone] = useState<string>('');

  const [operators, setOperators] = useState<string[]>(settings.operatori);
  const [newOperator, setNewOperator] = useState<string>('');

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      sogliaMinimaScorta: Number(minStock),
      sogliaAttenzioneScorta: Number(warnStock),
      maxBoxPerPila: Number(maxPerPila),
      scortaSicurezzaDefault: Number(safetyBuffer),
      nomeHub: hubName,
      codiceHub: hubCode,
      zoneDisponibili: zones,
      operatori: operators,
      autoDistribuzionePile: autoPiles,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleAddZone = () => {
    if (newZone && !zones.includes(newZone)) {
      setZones([...zones, newZone]);
      setNewZone('');
    }
  };

  const handleRemoveZone = (z: string) => {
    if (zones.length > 1) {
      setZones(zones.filter(item => item !== z));
    }
  };

  const handleAddOperator = () => {
    if (newOperator && !operators.includes(newOperator)) {
      setOperators([...operators, newOperator]);
      setNewOperator('');
    }
  };

  const handleRemoveOperator = (op: string) => {
    if (operators.length > 1) {
      setOperators(operators.filter(item => item !== op));
    }
  };

  const handleExportJSON = () => {
    const data = {
      stock: localStorage.getItem('IPC_BOX_SYSTEM_stock'),
      piles: localStorage.getItem('IPC_BOX_SYSTEM_piles'),
      orders: localStorage.getItem('IPC_BOX_SYSTEM_orders'),
      workOrders: localStorage.getItem('IPC_BOX_SYSTEM_workOrders'),
      damageReports: localStorage.getItem('IPC_BOX_SYSTEM_damageReports'),
      movements: localStorage.getItem('IPC_BOX_SYSTEM_movements'),
      settings: localStorage.getItem('IPC_BOX_SYSTEM_settings'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_ipc_box_hub_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <SettingsIcon className="w-6 h-6 text-blue-600" />
              <span>Parametri & Impostazioni Hub Logistico</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Configura soglie di allerta scorta minima, capienza pile antiribaltamento (Max 7), zone fisiche e anagrafica operatori.
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Configurazione salvata e applicata con successo!
          </div>
        )}
      </div>

      {/* 2. MAIN SETTINGS FORM */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Thresholds & Logistics Specs */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Soglie di Scorta & Parametri Magazzino</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-rose-800 uppercase mb-1">
                Soglia Minima di Sicurezza (BOX)
              </label>
              <input
                type="number"
                min="1"
                required
                value={minStock}
                onChange={e => setMinStock(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-sm font-bold text-rose-900 rounded-lg border border-rose-300 p-2.5 focus:ring-2 focus:ring-rose-500"
              />
              <span className="text-[10px] text-slate-500">Sotto questo valore scatta l'allerta rossa</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-800 uppercase mb-1">
                Soglia di Attenzione (BOX)
              </label>
              <input
                type="number"
                min="1"
                required
                value={warnStock}
                onChange={e => setWarnStock(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-sm font-bold text-amber-900 rounded-lg border border-amber-300 p-2.5 focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[10px] text-slate-500">Avviso giallo pre-esaurimento</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                Capienza Max per Pila (Standard 7)
              </label>
              <input
                type="number"
                min="1"
                max="7"
                required
                value={maxPerPila}
                onChange={e => setMaxPerPila(Math.min(7, Math.max(1, parseInt(e.target.value) || 7)))}
                className="w-full text-sm font-bold text-slate-900 rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-500">Massimo 7 per sicurezza fisica</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                Scorta Sicurezza Default (Calcolatore)
              </label>
              <input
                type="number"
                min="0"
                required
                value={safetyBuffer}
                onChange={e => setSafetyBuffer(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-sm font-bold text-slate-900 rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-500">Cuscinetto buffer di default</span>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoPiles}
                onChange={e => setAutoPiles(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span>
                <strong>Ridistribuzione automatica delle pile (Max 7):</strong> Ricalcola e organizza automaticamente
                le pile di stoccaggio a ogni ricezione, utilizzo o rottura.
              </span>
            </label>
          </div>
        </div>

        {/* Hub Identity */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-700" />
            <span>Identificazione Sito & Terminal Logistico</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome Hub / Terminal</label>
              <input
                type="text"
                required
                value={hubName}
                onChange={e => setHubName(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Codice Hub</label>
              <input
                type="text"
                required
                value={hubCode}
                onChange={e => setHubCode(e.target.value)}
                className="w-full text-sm font-mono rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Warehouse Storage Zones & Operators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Storage Zones */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase">Zone di Stoccaggio Magazzino</h4>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nuova zona (es. Area D - Corsia 5)"
                value={newZone}
                onChange={e => setNewZone(e.target.value)}
                className="flex-1 text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddZone}
                className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {zones.map(z => (
                <div key={z} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs text-slate-800">
                  <span>{z}</span>
                  {zones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveZone(z)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Operators */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase">Operatori & Responsabili Turno</h4>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nuovo operatore (es. Mario Verdi)"
                value={newOperator}
                onChange={e => setNewOperator(e.target.value)}
                className="flex-1 text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddOperator}
                className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {operators.map(op => (
                <div key={op} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs text-slate-800">
                  <span>{op}</span>
                  {operators.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOperator(op)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJSON}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Backup Dati JSON
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Sei sicuro di voler azzerare tutti i dati di magazzino a 0 (svuotare tutte le quantità)?')) {
                  zeroAllData();
                }
              }}
              className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              Azzera Tutto a 0
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Sei sicuro di voler ripristinare i dati demo di esempio?')) {
                  resetAllData();
                }
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Ripristina Dati Iniziali Demo
            </button>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            Salva Modifiche Configurazione
          </button>
        </div>
      </form>
    </div>
  );
};
