import React, { useState } from 'react';
import {
  Truck,
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowDownToLine,
  FileText,
  Calendar,
  Layers,
  Search,
  Building,
  ArrowRight,
  Package,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { PurchaseOrder } from '../../types';

interface OrdersViewProps {
  openModal: (modal: 'reception' | 'usage' | 'damage' | 'recovery' | 'adjust') => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ openModal }) => {
  const { orders, createOrder, updateOrderStatus, deleteOrder, activeOperator } = useStock();

  const [isCreatingOrder, setIsCreatingOrder] = useState<boolean>(false);
  const [newSupplier, setNewSupplier] = useState<string>('EuroPackaging Containers S.p.A.');
  const [newQty, setNewQty] = useState<number>(50);
  const [newDeliveryDate, setNewDeliveryDate] = useState<string>('2026-08-25');
  const [newNotes, setNewNotes] = useState<string>('Fornitura standard per incremento stock lavorazioni');

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<PurchaseOrder | null>(null);

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newQty <= 0) return;

    createOrder({
      fornitore: newSupplier,
      quantitaOrdinata: Number(newQty),
      dataPrevista: newDeliveryDate,
      note: newNotes,
    });

    setIsCreatingOrder(false);
    setNewQty(50);
  };

  const filteredOrders = orders.filter(
    o =>
      o.codiceOrdine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.fornitore.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.note && o.note.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Truck className="w-6 h-6 text-blue-600" />
              <span>Gestione Ordini Fornitori & Ricezioni IPC BOX</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Traccia gli approvvigionamenti, confronta le bolle con il conteggio fisico e gestisci le non conformità.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreatingOrder(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              Nuovo Ordine Fornitore
            </button>
            <button
              onClick={() => openModal('reception')}
              className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <ArrowDownToLine className="w-4 h-4" />
              Registra Ricezione Merce
            </button>
          </div>
        </div>

        {/* 2. ORDER CREATION FORM (COLLAPSIBLE) */}
        {isCreatingOrder && (
          <form
            onSubmit={handleCreateOrder}
            className="mt-5 p-5 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-4 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-blue-950 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-blue-600" />
                Emissione Nuovo Ordine IPC BOX
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingOrder(false)}
                className="text-xs text-slate-500 hover:text-slate-900"
              >
                Annulla
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fornitore / Produttore</label>
                <input
                  type="text"
                  required
                  value={newSupplier}
                  onChange={e => setNewSupplier(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantità Ordinata (BOX Completi)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newQty}
                  onChange={e => setNewQty(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full text-sm font-bold text-slate-900 rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">
                  Equivale a {Math.floor(newQty / 7)} pile da 7 {newQty % 7 > 0 ? `+ ${newQty % 7} box` : ''}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Data Consegna Prevista</label>
                <input
                  type="date"
                  value={newDeliveryDate}
                  onChange={e => setNewDeliveryDate(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Note & Riferimenti Acquisto</label>
              <input
                type="text"
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                placeholder="Riferimento offerta commerciale, clausole ISO, ecc."
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingOrder(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Chiudi
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                Invia Ordine Fornitore
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 3. ORDERS LIST & RECONCILIATION */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-700" />
            <span>Elenco Ordini di Acquisto ({filteredOrders.length})</span>
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cerca ordine, fornitore..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredOrders.map(order => {
            const pctReceived = Math.round((order.quantitaRicevuta / order.quantitaOrdinata) * 100);

            return (
              <div
                key={order.id}
                className="p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all bg-slate-50/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black font-mono text-slate-900">{order.codiceOrdine}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.stato === 'COMPLETATO'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : order.stato === 'PARZIALE'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {order.stato}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 block mt-0.5">{order.fornitore}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.stato !== 'COMPLETATO' && (
                      <button
                        onClick={() => openModal('reception')}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1 shadow-xs"
                      >
                        <ArrowDownToLine className="w-3.5 h-3.5" />
                        Ricevi Carico
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOrderDetails(order)}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg"
                    >
                      Dettagli Bolle ({order.ricezioni?.length || 0})
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Numerical Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-white p-3.5 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Quantità Ordinata</span>
                    <span className="text-lg font-black text-slate-900">{order.quantitaOrdinata} BOX</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase block">Quantità Ricevuta</span>
                    <span className="text-lg font-black text-emerald-700">{order.quantitaRicevuta} BOX</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-blue-600 font-bold uppercase block">Ancora da Ricevere</span>
                    <span className="text-lg font-black text-blue-700">{order.quantitaDaRicevere} BOX</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span>Avanzamento Fornitura</span>
                      <span>{pctReceived}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          pctReceived === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(100, pctReceived)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Notes */}
                {order.note && (
                  <p className="text-xs text-slate-500 mt-2 px-1 flex items-center gap-1.5">
                    <span>Note:</span> <em>{order.note}</em>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. RECEPTION HISTORY MODAL */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Storico Ricezioni Merce: {selectedOrderDetails.codiceOrdine}
                </h3>
                <p className="text-xs text-slate-500">Fornitore: {selectedOrderDetails.fornitore}</p>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {selectedOrderDetails.ricezioni && selectedOrderDetails.ricezioni.length > 0 ? (
              <div className="space-y-3">
                {selectedOrderDetails.ricezioni.map((rec, i) => (
                  <div key={rec.id || i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                    <div className="flex justify-between font-bold text-slate-800 mb-2">
                      <span className="font-mono">{rec.timestamp}</span>
                      <span className="text-slate-500">Op: {rec.operatore}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Dichiarati Bolla</span>
                        <strong className="text-sm text-slate-800">{rec.quantitaDichiarataBolla}</strong>
                      </div>
                      <div className="bg-white p-2 rounded border border-emerald-200">
                        <span className="text-[10px] text-emerald-700 block">Integri Utilizzabili</span>
                        <strong className="text-sm text-emerald-700">{rec.boxRicevutiIntegri}</strong>
                      </div>
                      <div className="bg-white p-2 rounded border border-rose-200">
                        <span className="text-[10px] text-rose-700 block">Box Danneggiati</span>
                        <strong className="text-sm text-rose-700">{rec.boxRicevutiDanneggiati}</strong>
                      </div>
                      <div className="bg-white p-2 rounded border border-amber-200">
                        <span className="text-[10px] text-amber-700 block">Basi/Cop. Rotti</span>
                        <strong className="text-sm text-amber-700">
                          {rec.basiRotte} B / {rec.coperchiRotti} C
                        </strong>
                      </div>
                    </div>

                    {rec.note && <div className="text-slate-600 italic">Note bolla: {rec.note}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-6">
                Nessuna ricezione ancora registrata per questo ordine.
              </p>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
