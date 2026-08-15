import React, { useState } from 'react';
import {
  Package,
  Layers,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Info,
  Wrench,
  Plus,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';

interface StockViewProps {
  openModal: (modal: 'reception' | 'usage' | 'damage' | 'recovery' | 'adjust') => void;
}

export const StockView: React.FC<StockViewProps> = ({ openModal }) => {
  const { stock, metrics, damageReports, settings, recordRecovery, activeOperator } = useStock();
  const [selectedDamageFilter, setSelectedDamageFilter] = useState<'ALL' | 'BASE' | 'COPERCHIO' | 'BOX_COMPLETO'>('ALL');

  const filteredDamages = damageReports.filter(d => {
    if (selectedDamageFilter === 'ALL') return true;
    return d.tipoElemento === selectedDamageFilter;
  });

  return (
    <div className="space-y-6">
      {/* 1. TOP SUMMARY CARD */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Package className="w-6 h-6 text-blue-600" />
              <span>Inventario Analitico Componenti IPC BOX</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Ogni IPC BOX richiede tassativamente <strong>1 Base integra</strong> e <strong>1 Coperchio integro</strong>{' '}
              per essere qualificato come utilizzabile nelle lavorazioni logistiche.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openModal('adjust')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              Rettifica Inventario
            </button>
            <button
              onClick={() => openModal('damage')}
              className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              Registra Danno
            </button>
            <button
              onClick={() => openModal('recovery')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Recupero / Ripristino
            </button>
          </div>
        </div>

        {/* 2. CALCULATION BREAKDOWN FORMULA DISPLAY */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 border border-blue-200/80 mb-6">
          <div className="flex items-center gap-2 mb-3 text-blue-900 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Formula di Calcolo Disponibilità Effettiva</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center text-center">
            {/* Step 1: Basi */}
            <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Basi Integre</span>
              <span className="text-3xl font-black text-blue-700">{stock.basiIntegre}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Componenti inferiori</span>
            </div>

            <div className="text-xl font-black text-slate-400 hidden md:block">&cap;</div>

            {/* Step 2: Coperchi */}
            <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Coperchi Integri</span>
              <span className="text-3xl font-black text-blue-700">{stock.coperchiIntegri}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Componenti superiori</span>
            </div>

            <div className="text-xl font-black text-slate-400 hidden md:block">=</div>

            {/* Step 3: Result Usable */}
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md border border-emerald-500">
              <span className="text-[10px] text-emerald-100 font-bold uppercase block">BOX Utilizzabili</span>
              <span className="text-3xl font-black text-white">{metrics.boxUtilizzabili}</span>
              <span className="text-[10px] text-emerald-100 block mt-0.5">Abbinamenti completi</span>
            </div>
          </div>

          {/* Excess Spare Analysis Note */}
          {(metrics.basiEccedenti > 0 || metrics.coperchiEccedenti > 0) && (
            <div className="mt-4 p-3 bg-white/90 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Sbilanciamento Componenti Rilevato: </strong>
                {metrics.basiEccedenti > 0 && (
                  <span>
                    Ci sono <strong>{metrics.basiEccedenti} basi integre spaiate</strong> (in eccesso rispetto ai
                    coperchi). Per renderle utilizzabili servono <strong>{metrics.basiEccedenti} coperchi</strong>.
                  </span>
                )}
                {metrics.coperchiEccedenti > 0 && (
                  <span>
                    Ci sono <strong>{metrics.coperchiEccedenti} coperchi integri spaiati</strong> (in eccesso rispetto
                    alle basi). Per renderli utilizzabili servono <strong>{metrics.coperchiEccedenti} basi</strong>.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. DETAILED COMPONENT GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Usable Complete */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase mb-1">
              <span>BOX Utilizzabili</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-3xl font-black text-emerald-900">{metrics.boxUtilizzabili}</span>
            <p className="text-[11px] text-emerald-700 mt-1">100% conformi per lavorazioni</p>
          </div>

          {/* Broken Bases */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50">
            <div className="flex items-center justify-between text-rose-800 text-xs font-bold uppercase mb-1">
              <span>Basi Rotte</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <span className="text-3xl font-black text-rose-900">{stock.basiRotte}</span>
            <p className="text-[11px] text-rose-700 mt-1">In attesa sostituzione / riparazione</p>
          </div>

          {/* Broken Lids */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50">
            <div className="flex items-center justify-between text-rose-800 text-xs font-bold uppercase mb-1">
              <span>Coperchi Rotti</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <span className="text-3xl font-black text-rose-900">{stock.coperchiRotti}</span>
            <p className="text-[11px] text-rose-700 mt-1">In attesa sostituzione / riparazione</p>
          </div>

          {/* Full Boxes Damaged */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between text-slate-700 text-xs font-bold uppercase mb-1">
              <span>BOX Fuori Uso</span>
              <ShieldAlert className="w-4 h-4 text-slate-500" />
            </div>
            <span className="text-3xl font-black text-slate-900">{stock.boxDanneggiatiTotali || 0}</span>
            <p className="text-[11px] text-slate-600 mt-1">Danni strutturali corpo scatola</p>
          </div>
        </div>
      </div>

      {/* 4. DAMAGE LOG & RECENT DEFECTS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Registro Segnalazione Danni & Non Conformità</span>
            </h3>
            <p className="text-xs text-slate-500">Tracciamento guasti, cause e collocazione di origine</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-100 p-1 rounded-lg">
            {(['ALL', 'BASE', 'COPERCHIO', 'BOX_COMPLETO'] as const).map(f => (
              <button
                key={f}
                onClick={() => setSelectedDamageFilter(f)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  selectedDamageFilter === f
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f === 'ALL' && 'Tutti i Danni'}
                {f === 'BASE' && 'Solo Basi'}
                {f === 'COPERCHIO' && 'Solo Coperchi'}
                {f === 'BOX_COMPLETO' && 'Box Completi'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Data e Ora</th>
                <th className="py-2.5 px-3">Componente</th>
                <th className="py-2.5 px-3 text-center">Quantità</th>
                <th className="py-2.5 px-3">Causa Riscontrata</th>
                <th className="py-2.5 px-3">Origine</th>
                <th className="py-2.5 px-3">Descrizione</th>
                <th className="py-2.5 px-3">Operatore</th>
                <th className="py-2.5 px-3 text-right">Azione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDamages.length > 0 ? (
                filteredDamages.map(dam => (
                  <tr key={dam.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">{dam.timestamp}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {dam.tipoElemento}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold font-mono text-rose-700">{dam.quantita}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{dam.causaDanno.replace('_', ' ')}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{dam.pilaOrigine || 'Magazzino'}</td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs">{dam.descrizione}</td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{dam.operatore}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => openModal('recovery')}
                        className="px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-200"
                      >
                        Ripara &rarr;
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                    Nessun danno registrato per il filtro selezionato.
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
