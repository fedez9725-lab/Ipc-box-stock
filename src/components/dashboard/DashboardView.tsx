import React from 'react';
import {
  Package,
  Layers,
  Truck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Warehouse,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  Sliders,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { TabType } from '../layout/Sidebar';

interface DashboardViewProps {
  setCurrentTab: (tab: TabType) => void;
  openModal: (modal: 'reception' | 'usage' | 'damage' | 'recovery' | 'adjust' | 'zero') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setCurrentTab, openModal }) => {
  const { stock, metrics, piles, orders, workOrders, movements, settings } = useStock();

  // Orders aggregate
  const activeOrders = orders.filter(o => o.stato === 'IN_ATTESA' || o.stato === 'PARZIALE');
  const totalOrderedPending = activeOrders.reduce((sum, o) => sum + o.quantitaDaRicevere, 0);

  // WorkOrders aggregate
  const activeWorkOrders = workOrders.filter(w => w.stato === 'IN_CORSO' || w.stato === 'PIANIFICATA');
  const totalWorkOrdersNeeded = activeWorkOrders.reduce(
    (sum, w) => sum + Math.max(0, w.quantitaRichiesta - w.quantitaAssegnata),
    0
  );

  const usableDiffWithWorkOrders = metrics.boxUtilizzabili - totalWorkOrdersNeeded;

  return (
    <div className="space-y-6">
      {/* 1. TOP CRITICAL / STATUS HERO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Usable Boxes Card */}
        <div className="md:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white p-6 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/30 text-blue-400">
                <Package className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Disponibilità Effettiva
              </span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                metrics.statoScorta === 'VERDE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : metrics.statoScorta === 'GIALLO'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-red-500/30 text-red-300 border border-red-500/50 animate-pulse'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  metrics.statoScorta === 'VERDE'
                    ? 'bg-emerald-400'
                    : metrics.statoScorta === 'GIALLO'
                    ? 'bg-amber-400'
                    : 'bg-red-400'
                }`}
              />
              {metrics.statoScorta === 'VERDE'
                ? 'SITUAZIONE REGOLARE'
                : metrics.statoScorta === 'GIALLO'
                ? 'ATTENZIONE SCORTA'
                : 'SCORTA CRITICA'}
            </span>
          </div>

          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-5xl font-black tracking-tight text-white">{metrics.boxUtilizzabili}</span>
            <span className="text-lg font-medium text-slate-300">IPC BOX Completi</span>
          </div>

          <p className="text-xs text-slate-400 mb-5">
            Calcolato rigorosamente su <strong>{stock.basiIntegre} basi integre</strong> e{' '}
            <strong>{stock.coperchiIntegri} coperchi integri</strong>.
            {metrics.basiEccedenti > 0 && ` (+${metrics.basiEccedenti} basi spaiate in attesa coperchio)`}
            {metrics.coperchiEccedenti > 0 && ` (+${metrics.coperchiEccedenti} coperchi spaiati in attesa base)`}
          </p>

          {/* Quick Actions Row */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80">
            <button
              onClick={() => openModal('usage')}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ArrowUpFromLine className="w-3.5 h-3.5" />
              Scarica per Lavorazione
            </button>
            <button
              onClick={() => openModal('reception')}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              Ricevi Fornitura
            </button>
            <button
              onClick={() => setCurrentTab('forecast')}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 ml-auto transition-colors"
            >
              Calcola Fabbisogno &rarr;
            </button>
          </div>
        </div>

        {/* Component Balance Card */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Componenti Integri</span>
              <button
                onClick={() => openModal('adjust')}
                className="text-slate-400 hover:text-slate-700 p-1"
                title="Rettifica conteggio"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 block">Basi Integre</span>
                <span className="text-2xl font-bold text-slate-900">{stock.basiIntegre}</span>
                <span className="text-[10px] text-emerald-600 block font-medium">
                  {metrics.basiEccedenti > 0 ? `+${metrics.basiEccedenti} eccedenti` : 'Abbinate'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 block">Coperchi Integri</span>
                <span className="text-2xl font-bold text-slate-900">{stock.coperchiIntegri}</span>
                <span className="text-[10px] text-emerald-600 block font-medium">
                  {metrics.coperchiEccedenti > 0 ? `+${metrics.coperchiEccedenti} eccedenti` : 'Abbinati'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
            <span>Soglia min. sicurezza:</span>
            <strong className="text-slate-900">{settings.sogliaMinimaScorta} BOX</strong>
          </div>
        </div>

        {/* Damaged & Quarantine Card */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Danni & Quarantena</span>
              <button
                onClick={() => openModal('damage')}
                className="text-rose-600 hover:text-rose-800 text-xs font-bold"
              >
                + Registra
              </button>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-rose-50/70 border border-rose-100">
                <span className="text-rose-900 font-medium">Basi Rotte:</span>
                <strong className="text-rose-700 font-bold">{stock.basiRotte}</strong>
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-rose-50/70 border border-rose-100">
                <span className="text-rose-900 font-medium">Coperchi Rotti:</span>
                <strong className="text-rose-700 font-bold">{stock.coperchiRotti}</strong>
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-rose-50/70 border border-rose-100">
                <span className="text-rose-900 font-medium">Box Fuori Uso:</span>
                <strong className="text-rose-700 font-bold">{stock.boxDanneggiatiTotali || 0}</strong>
              </div>
            </div>
          </div>

          <button
            onClick={() => openModal('recovery')}
            className="w-full py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Ripristina / Recupera Componenti
          </button>
        </div>
      </div>

      {/* 2. OPERATIONAL SUMMARY SECTION: ORDERS vs WORKORDERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Orders In-Flight */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Rifornimenti & Ordini Fornitori</h3>
            </div>
            <button
              onClick={() => setCurrentTab('orders')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Vedi Tutti ({orders.length}) &rarr;
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Ordinati</span>
              <span className="text-lg font-bold text-slate-800">
                {orders.reduce((acc, o) => acc + o.quantitaOrdinata, 0)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
              <span className="text-[10px] text-emerald-700 uppercase block font-semibold">Ricevuti</span>
              <span className="text-lg font-bold text-emerald-700">
                {orders.reduce((acc, o) => acc + o.quantitaRicevuta, 0)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100">
              <span className="text-[10px] text-blue-700 uppercase block font-semibold">In Arrivo</span>
              <span className="text-lg font-bold text-blue-700">{totalOrderedPending}</span>
            </div>
          </div>

          {activeOrders.length > 0 ? (
            <div className="space-y-2">
              {activeOrders.slice(0, 2).map(ord => (
                <div
                  key={ord.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">{ord.codiceOrdine}</span>
                    <span className="text-slate-500 block">{ord.fornitore}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-blue-700 block">
                      {ord.quantitaDaRicevere} BOX da ricevere
                    </span>
                    <button
                      onClick={() => openModal('reception')}
                      className="text-[11px] text-slate-600 hover:text-blue-600 underline font-medium"
                    >
                      Ricevi Carico
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-3">Nessun ordine fornitore in attesa.</p>
          )}
        </div>

        {/* Processing / Work Orders */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-900">Lavorazioni & Fabbisogno Linee</h3>
            </div>
            <button
              onClick={() => setCurrentTab('workorders')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Vedi Lavorazioni &rarr;
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Richiesti</span>
              <span className="text-lg font-bold text-slate-800">
                {workOrders.reduce((acc, w) => acc + w.quantitaRichiesta, 0)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
              <span className="text-[10px] text-emerald-700 uppercase block font-semibold">Assegnati</span>
              <span className="text-lg font-bold text-emerald-700">
                {workOrders.reduce((acc, w) => acc + w.quantitaAssegnata, 0)}
              </span>
            </div>
            <div
              className={`p-2.5 rounded-xl border ${
                usableDiffWithWorkOrders >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-200'
              }`}
            >
              <span
                className={`text-[10px] uppercase block font-semibold ${
                  usableDiffWithWorkOrders >= 0 ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                Bilancio Netto
              </span>
              <span
                className={`text-lg font-bold ${
                  usableDiffWithWorkOrders >= 0 ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {usableDiffWithWorkOrders >= 0 ? `+${usableDiffWithWorkOrders}` : usableDiffWithWorkOrders}
              </span>
            </div>
          </div>

          {activeWorkOrders.length > 0 ? (
            <div className="space-y-2">
              {activeWorkOrders.slice(0, 2).map(wo => (
                <div
                  key={wo.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">{wo.codice}</span>
                    <span className="text-slate-500 block truncate max-w-[200px]">{wo.descrizione}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800 block">
                      {wo.quantitaAssegnata} / {wo.quantitaRichiesta} BOX
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        wo.stato === 'IN_CORSO' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {wo.stato}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-3">Tutte le lavorazioni sono completate.</p>
          )}
        </div>
      </div>

      {/* 3. PHYSICAL PILE STACKS VISUAL PREVIEW (MAX 7 PER PILA) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-slate-800" />
              <h3 className="font-bold text-sm text-slate-900">Disposizione Fisica Pile di Stoccaggio</h3>
              <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                Capienza Max: 7 BOX per pila
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Stock totale organizzato in <strong>{piles.filter(p => p.stato !== 'QUARANTENA').length} pile attive</strong>
            </p>
          </div>
          <button
            onClick={() => setCurrentTab('piles')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Mappa Completa Magazzino &rarr;
          </button>
        </div>

        {/* Visual stack mini columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {piles.slice(0, 8).map(pila => {
            const isFull = pila.boxes.length === 7;
            const isQuarantine = pila.stato === 'QUARANTENA';
            return (
              <div
                key={pila.id}
                onClick={() => setCurrentTab('piles')}
                className={`p-3 rounded-xl border cursor-pointer hover:shadow-sm transition-all text-center flex flex-col justify-between ${
                  isQuarantine
                    ? 'bg-rose-50/60 border-rose-200'
                    : isFull
                    ? 'bg-slate-50/80 border-slate-200'
                    : 'bg-amber-50/40 border-amber-200'
                }`}
              >
                <div className="text-[11px] font-mono font-bold text-slate-800 mb-2 truncate">
                  {pila.codice}
                </div>

                {/* Vertical Stack column representation (7 slots) */}
                <div className="flex flex-col-reverse gap-1 py-1 px-2 my-auto">
                  {Array.from({ length: 7 }, (_, i) => {
                    const boxInSlot = pila.boxes[i];
                    return (
                      <div
                        key={i}
                        className={`h-2.5 rounded-xs transition-colors ${
                          boxInSlot
                            ? isQuarantine
                              ? 'bg-rose-500 ring-1 ring-rose-400'
                              : 'bg-blue-600 ring-1 ring-blue-500 shadow-2xs'
                            : 'bg-slate-200/60 border border-dashed border-slate-300'
                        }`}
                        title={boxInSlot ? `Livello ${i + 1}: ${boxInSlot.stato}` : `Livello ${i + 1}: Vuoto`}
                      />
                    );
                  })}
                </div>

                <div className="mt-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Altezza:</span>
                  <strong
                    className={`font-bold ${
                      isFull ? 'text-emerald-700' : isQuarantine ? 'text-rose-700' : 'text-amber-700'
                    }`}
                  >
                    {pila.boxes.length}/7
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. RECENT MOVEMENTS AUDIT LOG PREVIEW */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-sm text-slate-900">Ultimi Movimenti Registrati</h3>
          </div>
          <button
            onClick={() => setCurrentTab('movements')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Registro Completo & Storico &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Data e Ora</th>
                <th className="py-2.5 px-3">Operazione</th>
                <th className="py-2.5 px-3 text-center">Quantità</th>
                <th className="py-2.5 px-3">Motivo / Dettaglio</th>
                <th className="py-2.5 px-3">Operatore</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.slice(0, 5).map(mov => (
                <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">{mov.timestamp}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-[10px] ${
                        mov.tipologia === 'RICEZIONE'
                          ? 'bg-blue-100 text-blue-800'
                          : mov.tipologia === 'UTILIZZO'
                          ? 'bg-amber-100 text-amber-800'
                          : mov.tipologia === 'ROTTURA'
                          ? 'bg-rose-100 text-rose-800'
                          : mov.tipologia === 'RECUPERO'
                          ? 'bg-emerald-100 text-emerald-800'
                          : mov.tipologia === 'ORDINE'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {mov.tipologia}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold font-mono">
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
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-slate-900">{mov.motivo}</div>
                    {mov.note && <div className="text-[11px] text-slate-500 truncate max-w-md">{mov.note}</div>}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{mov.utente}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
