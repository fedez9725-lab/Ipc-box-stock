import React, { useState } from 'react';
import {
  History,
  Filter,
  Search,
  Download,
  Calendar,
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Printer,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { MovementType, StockMovement } from '../../types';

export const MovementsView: React.FC = () => {
  const { movements } = useStock();

  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filteredMovements = movements.filter(mov => {
    if (selectedType !== 'ALL' && mov.tipologia !== selectedType) {
      return false;
    }

    if (startDate && mov.timestamp.substring(0, 10) < startDate) {
      return false;
    }

    if (endDate && mov.timestamp.substring(0, 10) > endDate) {
      return false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchMotivo = mov.motivo.toLowerCase().includes(term);
      const matchUtente = mov.utente.toLowerCase().includes(term);
      const matchNote = mov.note?.toLowerCase().includes(term);
      const matchLav = mov.lavorazioneCodice?.toLowerCase().includes(term);
      if (!matchMotivo && !matchUtente && !matchNote && !matchLav) return false;
    }

    return true;
  });

  const exportCSV = () => {
    const headers = ['ID', 'Data_Ora', 'Tipologia', 'Quantita', 'Delta_Basi', 'Delta_Coperchi', 'Motivo', 'Utente', 'Note'];
    const rows = filteredMovements.map(m => [
      m.id,
      m.timestamp,
      m.tipologia,
      m.quantita,
      m.deltaBasiIntegre,
      m.deltaCoperchiIntegri,
      `"${m.motivo.replace(/"/g, '""')}"`,
      `"${m.utente.replace(/"/g, '""')}"`,
      `"${(m.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `storico_movimenti_ipc_box_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMovementBadgeClass = (tipo: MovementType) => {
    switch (tipo) {
      case 'RICEZIONE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'UTILIZZO':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ROTTURA':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'RECUPERO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'ORDINE':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'MANCANZA':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <History className="w-6 h-6 text-blue-600" />
              <span>Audit Trail & Registro Storico Movimentazioni</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Ogni variazione fisica o amministrativa di stock è tracciata in modo immutabile con operatore e timestamp.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Esporta CSV
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Stampa
            </button>
          </div>
        </div>

        {/* 2. FILTERS BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          {/* Movement Type Filter */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Tipologia Operazione</label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">Tutte le Operazioni ({movements.length})</option>
              <option value="RICEZIONE">Ricezione Merce</option>
              <option value="UTILIZZO">Utilizzo / Scarico</option>
              <option value="ROTTURA">Rottura / Danno</option>
              <option value="RECUPERO">Recupero Componenti</option>
              <option value="ORDINE">Emissione Ordine</option>
              <option value="RETTIFICA">Rettifica Inventario</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Ricerca Libera</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Motivo, operatore, note..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-2.5 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Date Start */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Data Inizio</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Date End */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Data Fine</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. MOVEMENTS TABLE */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-sm text-slate-900">
            Trovati <strong>{filteredMovements.length}</strong> movimenti
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200">
              <tr>
                <th className="py-3 px-3">Data e Ora</th>
                <th className="py-3 px-3">Tipologia</th>
                <th className="py-3 px-3 text-center">Quantità</th>
                <th className="py-3 px-3">Dettagli Stock (Δ Basi / Δ Coperchi)</th>
                <th className="py-3 px-3">Motivo & Operazione</th>
                <th className="py-3 px-3">Operatore</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length > 0 ? (
                filteredMovements.map(mov => (
                  <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">{mov.timestamp}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${getMovementBadgeClass(
                          mov.tipologia
                        )}`}
                      >
                        {mov.tipologia}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-black font-mono text-sm">
                      <span
                        className={
                          mov.deltaBasiIntegre > 0
                            ? 'text-emerald-600'
                            : mov.deltaBasiIntegre < 0
                            ? 'text-rose-600'
                            : 'text-slate-800'
                        }
                      >
                        {mov.quantita > 0 ? mov.quantita : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] whitespace-nowrap">
                      <span
                        className={
                          mov.deltaBasiIntegre >= 0 ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'
                        }
                      >
                        Basi: {mov.deltaBasiIntegre > 0 ? `+${mov.deltaBasiIntegre}` : mov.deltaBasiIntegre}
                      </span>
                      <span className="text-slate-300 mx-1.5">|</span>
                      <span
                        className={
                          mov.deltaCoperchiIntegri >= 0
                            ? 'text-emerald-700 font-medium'
                            : 'text-rose-700 font-medium'
                        }
                      >
                        Cop: {mov.deltaCoperchiIntegri > 0 ? `+${mov.deltaCoperchiIntegri}` : mov.deltaCoperchiIntegri}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{mov.motivo}</div>
                      {mov.note && <div className="text-[11px] text-slate-500">{mov.note}</div>}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{mov.utente}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    Nessun movimento corrisponde ai criteri di ricerca.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
