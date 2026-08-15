import React, { useState } from 'react';
import {
  Calculator,
  ShieldCheck,
  Package,
  Truck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { TabType } from '../layout/Sidebar';

interface ForecastViewProps {
  setCurrentTab: (tab: TabType) => void;
}

export const ForecastView: React.FC<ForecastViewProps> = ({ setCurrentTab }) => {
  const { metrics, settings, orders, createOrder } = useStock();

  const [neededBoxes, setNeededBoxes] = useState<number>(80);
  const [safetyStockBuffer, setSafetyStockBuffer] = useState<number>(settings.scortaSicurezzaDefault || 10);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('EuroPackaging Containers S.p.A.');
  const [orderCreatedMsg, setOrderCreatedMsg] = useState<string | null>(null);

  // Incoming orders in-flight
  const totalInFlight = orders
    .filter(o => o.stato === 'IN_ATTESA' || o.stato === 'PARZIALE')
    .reduce((acc, o) => acc + o.quantitaDaRicevere, 0);

  // Calculation formulas
  const totalGrossDemand = neededBoxes + safetyStockBuffer;
  const availableUsable = metrics.boxUtilizzabili;
  const netDeficit = Math.max(0, totalGrossDemand - availableUsable);
  const netDeficitConsideringInFlight = Math.max(0, totalGrossDemand - (availableUsable + totalInFlight));

  const isStockSufficient = availableUsable >= totalGrossDemand;

  const handleCreateAutoOrder = () => {
    if (netDeficit <= 0) return;

    const ord = createOrder({
      fornitore: selectedSupplier,
      quantitaOrdinata: netDeficit,
      dataPrevista: new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10),
      note: `Ordine generato automaticamente da Calcolatore Fabbisogno per ${neededBoxes} BOX richiesti + ${safetyStockBuffer} scorta di sicurezza.`,
    });

    setOrderCreatedMsg(`Ordine ${ord.codiceOrdine} di ${netDeficit} IPC BOX creato con successo!`);
    setTimeout(() => setOrderCreatedMsg(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Calculator className="w-6 h-6 text-blue-600" />
              <span>Simulatore & Calcolatore Fabbisogno IPC BOX</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Inserisci i volumi previsti per le lavorazioni per calcolare in tempo reale il deficit e la quantità
              esatta da ordinare.
            </p>
          </div>
        </div>

        {orderCreatedMsg && (
          <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {orderCreatedMsg}
            </span>
            <button
              onClick={() => setCurrentTab('orders')}
              className="underline text-emerald-900 font-bold"
            >
              Visualizza Ordine &rarr;
            </button>
          </div>
        )}

        {/* 2. INTERACTIVE CALCULATOR INPUTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-5 rounded-2xl bg-slate-50 border border-slate-200 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">
              1. IPC BOX Necessari per Lavorazione
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={neededBoxes}
                onChange={e => setNeededBoxes(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-xl font-black text-slate-900 bg-white rounded-xl border border-slate-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Fabbisogno nominale delle lavorazioni pianificate
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">
              2. Scorta di Sicurezza Addizionale
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={safetyStockBuffer}
                onChange={e => setSafetyStockBuffer(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-xl font-black text-slate-900 bg-white rounded-xl border border-slate-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Buffer cuscinetto per assorbire imprevisti o rotture
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">
              3. Stock Utilizzabile Attuale
            </label>
            <div className="p-3 bg-white rounded-xl border border-slate-300 flex items-center justify-between">
              <div>
                <span className="text-2xl font-black text-emerald-700">{availableUsable}</span>
                <span className="text-xs text-slate-500 ml-1.5">BOX</span>
              </div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                Pronti
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Minimo tra basi integre ({metrics.basiDisponibili}) e coperchi ({metrics.coperchiDisponibili})
            </span>
          </div>
        </div>

        {/* 3. SIMULATION RESULTS BOARD */}
        <div
          className={`p-6 rounded-2xl border ${
            isStockSufficient
              ? 'bg-emerald-50/70 border-emerald-300'
              : 'bg-rose-50/70 border-rose-300'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  isStockSufficient
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {isStockSufficient ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {isStockSufficient
                    ? 'Quantità in Stock Sufficiente per la Lavorazione'
                    : 'IPC BOX Insufficienti - Necessario Ordine di Rifornimento'}
                </h3>
                <p className="text-xs text-slate-600">
                  {isStockSufficient
                    ? `Hai una scorta eccedente di ${availableUsable - totalGrossDemand} BOX rispetto al fabbisogno con scorta.`
                    : `Mancano ${netDeficit} IPC BOX completi per coprire la lavorazione e mantenere la scorta.`}
                </p>
              </div>
            </div>

            {!isStockSufficient && (
              <button
                onClick={handleCreateAutoOrder}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-colors"
              >
                <Truck className="w-4 h-4" />
                Genera Ordine per {netDeficit} BOX &rarr;
              </button>
            )}
          </div>

          {/* Mathematical Step-by-Step Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center pt-3 border-t border-slate-200/80 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Fabbisogno Lordo</span>
              <span className="text-xl font-black text-slate-900">{totalGrossDemand} BOX</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{neededBoxes} nec. + {safetyStockBuffer} scorta</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Disponibili Immediati</span>
              <span className="text-xl font-black text-emerald-700">{availableUsable} BOX</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Integri e pronti</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-blue-600 font-bold uppercase block">Ordini In Arrivo</span>
              <span className="text-xl font-black text-blue-700">+{totalInFlight} BOX</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Forniture confermate</span>
            </div>

            <div
              className={`p-3 rounded-xl border shadow-2xs ${
                netDeficit > 0 ? 'bg-rose-600 text-white border-rose-700' : 'bg-emerald-600 text-white border-emerald-700'
              }`}
            >
              <span className="text-[10px] uppercase font-bold block opacity-80">Quantità da Ordinare</span>
              <span className="text-xl font-black">{netDeficit > 0 ? `${netDeficit} BOX` : '0 BOX (OK)'}</span>
              <span className="text-[10px] block opacity-80 mt-0.5">
                {netDeficit > 0 ? `${Math.ceil(netDeficit / 7)} pile da 7` : 'Copertura 100%'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
