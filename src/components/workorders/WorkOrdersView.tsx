import React, { useState } from 'react';
import {
  FileSpreadsheet,
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpFromLine,
  ArrowRight,
  Layers,
  Search,
  Building,
  User,
  Zap,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { WorkOrder } from '../../types';

interface WorkOrdersViewProps {
  openModal: (modal: 'reception' | 'usage' | 'damage' | 'recovery' | 'adjust' | 'zero') => void;
}

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({ openModal }) => {
  const { workOrders, metrics, createWorkOrder, updateWorkOrderStatus, recordUsage, activeOperator, settings } = useStock();

  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newCode, setNewCode] = useState<string>(`LAV-INT-2026-${workOrders.length + 120}`);
  const [newDesc, setNewDesc] = useState<string>('');
  const [newClient, setNewClient] = useState<string>('');
  const [newLine, setNewLine] = useState<string>('Linea 1 - Export Standard');
  const [newQty, setNewQty] = useState<number>(21);
  const [newDeadline, setNewDeadline] = useState<string>('2026-08-20');
  const [newNotes, setNewNotes] = useState<string>('');
  const [newOperator, setNewOperator] = useState<string>(activeOperator || '');

  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc || newQty <= 0) return;

    createWorkOrder({
      codice: newCode,
      descrizione: newDesc,
      clienteDestinazione: newClient || 'Hub Internazionale',
      lineaLavorazione: newLine,
      quantitaRichiesta: Number(newQty),
      dataScadenza: newDeadline,
      note: newNotes,
      operatore: newOperator.trim() || undefined,
    });

    setIsCreating(false);
    setNewDesc('');
    setNewClient('');
  };

  const handleQuickAllocate = (wo: WorkOrder) => {
    const needed = Math.max(0, wo.quantitaRichiesta - wo.quantitaAssegnata);
    const toAllocate = Math.min(needed, metrics.boxUtilizzabili);
    if (toAllocate <= 0) return;

    recordUsage({
      quantita: toAllocate,
      lavorazioneCodice: wo.codice,
      lavorazioneId: wo.id,
      note: `Assegnazione rapida per lavorazione ${wo.codice}`,
    });
  };

  const filteredWorkOrders = workOrders.filter(
    w =>
      w.codice.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.descrizione.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.clienteDestinazione.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
              <span>Lavorazioni Logistiche & Assegnazione IPC BOX</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Pianifica il fabbisogno per le commesse di spedizione e scarica i BOX utilizzati dalle pile.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              Nuova Lavorazione
            </button>
            <button
              onClick={() => openModal('usage')}
              className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <ArrowUpFromLine className="w-4 h-4" />
              Scarica Box da Magazzino
            </button>
          </div>
        </div>

        {/* 2. CREATION FORM (COLLAPSIBLE) */}
        {isCreating && (
          <form
            onSubmit={handleCreate}
            className="mt-5 p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-blue-600" />
                Apertura Nuova Lavorazione
              </span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-xs text-slate-500 hover:text-slate-900"
              >
                Annulla
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Codice Lavorazione</label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={e => setNewCode(e.target.value)}
                  className="w-full text-sm font-mono rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrizione Commessa / Spedizione</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Spedizione Export Componenti Francoforte"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cliente / Destinazione</label>
                <input
                  type="text"
                  placeholder="Es. BMW Logistics Monaco"
                  value={newClient}
                  onChange={e => setNewClient(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Linea di Produzione / Area</label>
                <select
                  value={newLine}
                  onChange={e => setNewLine(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Linea 1 - Export Standard">Linea 1 - Export Standard</option>
                  <option value="Linea 2 - High Security">Linea 2 - High Security</option>
                  <option value="Linea 4 - Export Automotive">Linea 4 - Export Automotive</option>
                  <option value="Linea Pharma Cold-Chain">Linea Pharma Cold-Chain</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantità IPC BOX Necessari <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="0"
                  value={newQty === 0 ? '' : newQty}
                  onFocus={e => e.target.select()}
                  onChange={e =>
                    setNewQty(e.target.value === '' ? 0 : Math.max(1, parseInt(e.target.value, 10) || 0))
                  }
                  className="w-full text-sm font-bold text-slate-900 rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">
                  {Math.floor(newQty / 7)} pile da 7 {newQty % 7 > 0 ? `+ ${newQty % 7} box` : ''}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Data Consegna / Partenza</label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={e => setNewDeadline(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Operatore / Responsabile</label>
                <input
                  type="text"
                  list="wo-operators-list"
                  placeholder="Inserisci nome operatore..."
                  value={newOperator}
                  onChange={e => setNewOperator(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <datalist id="wo-operators-list">
                  {settings.operatori.map(op => (
                    <option key={op} value={op} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note Lavorazione (Opzionali)</label>
                <input
                  type="text"
                  placeholder="Es. Pallettizzare su pallet EPAL blu..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Chiudi
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                Crea Lavorazione
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 3. WORK ORDERS LIST */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600" />
            <span>Elenco Lavorazioni ({filteredWorkOrders.length})</span>
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cerca lavorazione, commessa..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredWorkOrders.map(wo => {
            const isCompleted = wo.stato === 'COMPLETATA';
            const missing = Math.max(0, wo.quantitaRichiesta - wo.quantitaAssegnata);
            const canFulfillNow = metrics.boxUtilizzabili >= missing;
            const pct = Math.round((wo.quantitaAssegnata / wo.quantitaRichiesta) * 100);

            return (
              <div
                key={wo.id}
                className="p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all bg-slate-50/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black font-mono text-slate-900">{wo.codice}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : wo.stato === 'IN_CORSO'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}
                      >
                        {wo.stato}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">{wo.descrizione}</span>
                    <span className="text-xs text-slate-500">
                      Cliente: <strong>{wo.clienteDestinazione}</strong> &bull; Linea: {wo.lineaLavorazione}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isCompleted && missing > 0 && (
                      <button
                        onClick={() => handleQuickAllocate(wo)}
                        disabled={metrics.boxUtilizzabili <= 0}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs transition-colors ${
                          canFulfillNow
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        <ArrowUpFromLine className="w-3.5 h-3.5" />
                        {canFulfillNow
                          ? `Assegna ${missing} BOX`
                          : `Assegna Parziale (${metrics.boxUtilizzabili} disp.)`}
                      </button>
                    )}

                    <select
                      value={wo.stato}
                      onChange={e => updateWorkOrderStatus(wo.id, e.target.value as any)}
                      className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
                    >
                      <option value="PIANIFICATA">Pianificata</option>
                      <option value="IN_CORSO">In Corso</option>
                      <option value="COMPLETATA">Completata</option>
                      <option value="ANNULLATA">Annullata</option>
                    </select>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-white p-3.5 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Fabbisogno Totale</span>
                    <span className="text-lg font-black text-slate-900">{wo.quantitaRichiesta} BOX</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase block">Già Assegnati</span>
                    <span className="text-lg font-black text-emerald-700">{wo.quantitaAssegnata} BOX</span>
                  </div>

                  <div>
                    <span
                      className={`text-[10px] font-bold uppercase block ${
                        missing > 0 ? (canFulfillNow ? 'text-amber-600' : 'text-rose-600') : 'text-slate-400'
                      }`}
                    >
                      Mancanti alla Lavorazione
                    </span>
                    <span
                      className={`text-lg font-black ${
                        missing > 0 ? (canFulfillNow ? 'text-amber-700' : 'text-rose-700') : 'text-slate-400'
                      }`}
                    >
                      {missing} BOX
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span>Completamento</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
