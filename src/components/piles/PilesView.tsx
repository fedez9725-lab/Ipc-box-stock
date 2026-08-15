import React, { useState } from 'react';
import {
  Warehouse,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Maximize2,
  Filter,
  Plus,
  Box,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Pila } from '../../types';

export const PilesView: React.FC = () => {
  const { piles, metrics, settings, rebuildPilesManually, updatePilaZone } = useStock();
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [activePilaModal, setActivePilaModal] = useState<Pila | null>(null);

  // Filter piles by zone
  const filteredPiles = piles.filter(p => {
    if (selectedZone === 'ALL') return true;
    return p.zona === selectedZone;
  });

  const normalPiles = filteredPiles.filter(p => p.stato !== 'QUARANTENA');
  const quarantinePiles = filteredPiles.filter(p => p.stato === 'QUARANTENA');

  const totalBoxesInPiles = filteredPiles.reduce((acc, p) => acc + p.boxes.length, 0);

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & METRICS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Warehouse className="w-6 h-6 text-blue-600" />
              <span>Mappa & Gestione Fisica Pile IPC BOX</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Vincolo di sicurezza magazzino: <strong>Massimo 7 IPC BOX per pila</strong> (altezza standard
              antiribaltamento logistico).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={rebuildPilesManually}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
              title="Riorganizza e ridistribuisci automaticamente le pile in base allo stock utilizzabile"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Ribilancia Pile Auto (Max 7)
            </button>
          </div>
        </div>

        {/* Quick Pile Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Totale Pile Attive</span>
            <span className="text-2xl font-black text-slate-900">{piles.length}</span>
            <span className="text-[10px] text-slate-500 block">nel magazzino</span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-emerald-700 uppercase block">Pile Complete (7/7)</span>
            <span className="text-2xl font-black text-emerald-700">
              {piles.filter(p => p.boxes.length === 7 && p.stato !== 'QUARANTENA').length}
            </span>
            <span className="text-[10px] text-emerald-600 block">Capienza ottimale</span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-amber-700 uppercase block">Pile Parziali (&lt;7)</span>
            <span className="text-2xl font-black text-amber-700">
              {piles.filter(p => p.boxes.length < 7 && p.stato !== 'QUARANTENA').length}
            </span>
            <span className="text-[10px] text-amber-600 block">Pronte per completamento</span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-rose-700 uppercase block">Pile Quarantena</span>
            <span className="text-2xl font-black text-rose-700">
              {piles.filter(p => p.stato === 'QUARANTENA').length}
            </span>
            <span className="text-[10px] text-rose-600 block">Pezzi da riparare</span>
          </div>
        </div>

        {/* Zone Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-600 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filtra Zona:
          </span>
          <button
            onClick={() => setSelectedZone('ALL')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              selectedZone === 'ALL'
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tutte le Zone ({piles.length})
          </button>
          {settings.zoneDisponibili.map(zone => {
            const countInZone = piles.filter(p => p.zona === zone).length;
            return (
              <button
                key={zone}
                onClick={() => setSelectedZone(zone)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  selectedZone === zone
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {zone} ({countInZone})
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. PHYSICAL STACK VISUAL CARDS GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-slate-700" />
            <span>Pile Standard di Stoccaggio ({normalPiles.length})</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {totalBoxesInPiles} BOX allocati fisicamente
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {normalPiles.map(pila => {
            const isFull = pila.boxes.length === 7;
            const occupancyPct = Math.round((pila.boxes.length / 7) * 100);

            return (
              <div
                key={pila.id}
                className={`bg-white rounded-2xl p-4 border transition-all hover:shadow-md flex flex-col justify-between ${
                  isFull ? 'border-slate-200' : 'border-amber-300 ring-1 ring-amber-200 bg-amber-50/10'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm font-black font-mono text-slate-900">{pila.codice}</span>
                    <span className="text-[11px] text-slate-500 block truncate max-w-[150px]">{pila.zona}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      isFull
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {pila.boxes.length} / 7 BOX
                  </span>
                </div>

                {/* VISUAL 3D/2D STACK RENDERING (7 SLOTS, BOTTOM UP) */}
                <div className="p-3 my-2 rounded-xl bg-slate-100 border border-slate-200 flex flex-col-reverse gap-1.5 min-h-[190px]">
                  {Array.from({ length: 7 }, (_, index) => {
                    const box = pila.boxes[index];
                    const slotPosition = index + 1;

                    if (box) {
                      return (
                        <div
                          key={box.id}
                          className="h-5 rounded-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white text-[10px] font-mono font-semibold px-2 flex items-center justify-between shadow-2xs border border-blue-500 cursor-pointer hover:brightness-110"
                          title={`Posizione ${slotPosition}: ${box.codiceSeriale || 'IPC BOX'}`}
                        >
                          <div className="flex items-center gap-1">
                            <Box className="w-2.5 h-2.5 text-blue-200" />
                            <span>Liv. {slotPosition}</span>
                          </div>
                          <span className="text-[9px] text-blue-100 truncate max-w-[80px]">
                            {box.codiceSeriale || 'INTEGRO'}
                          </span>
                        </div>
                      );
                    }

                    // Empty slot
                    return (
                      <div
                        key={`empty-${slotPosition}`}
                        className="h-5 rounded-sm bg-white/70 border border-dashed border-slate-300 text-slate-400 text-[9px] px-2 flex items-center justify-center font-mono"
                      >
                        Livello {slotPosition} (Disponibile)
                      </div>
                    );
                  })}
                </div>

                {/* Zone switcher & Details action */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <select
                    value={pila.zona}
                    onChange={e => updatePilaZone(pila.id, e.target.value)}
                    className="text-[11px] bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-700 focus:outline-none max-w-[140px]"
                  >
                    {settings.zoneDisponibili.map(z => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setActivePilaModal(pila)}
                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                    title="Vedi dettagli pila"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. QUARANTINE PILES (IF PRESENT) */}
      {quarantinePiles.length > 0 && (
        <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-base text-rose-900">
              Pile in Zona Quarantena & Riparazioni ({quarantinePiles.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {quarantinePiles.map(pila => (
              <div key={pila.id} className="bg-white rounded-xl p-4 border border-rose-200 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-rose-900">{pila.codice}</span>
                  <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                    {pila.boxes.length} / 7
                  </span>
                </div>

                <div className="space-y-1.5 my-3">
                  {pila.boxes.map(b => (
                    <div
                      key={b.id}
                      className="p-2 rounded bg-rose-50 border border-rose-200 text-xs flex items-center justify-between text-rose-900"
                    >
                      <span>
                        Liv. {b.posizione}: <strong>{b.stato}</strong>
                      </span>
                      <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{b.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. PILA DETAIL MODAL */}
      {activePilaModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Dettaglio Pila {activePilaModal.codice}</h3>
                <p className="text-xs text-slate-500">Ubicazione: {activePilaModal.zona}</p>
              </div>
              <button
                onClick={() => setActivePilaModal(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <div className="text-xs font-bold text-slate-700 uppercase">
                Composizione Livelli ({activePilaModal.boxes.length}/7):
              </div>
              {Array.from({ length: 7 }, (_, i) => {
                const box = activePilaModal.boxes[i];
                return (
                  <div
                    key={i}
                    className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                      box ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-100/50 border-dashed text-slate-400'
                    }`}
                  >
                    <span>Livello {i + 1}</span>
                    {box ? (
                      <span className="font-mono font-medium">
                        {box.codiceSeriale} &bull; {box.stato}
                      </span>
                    ) : (
                      <span className="italic">Slot Vuoto</span>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setActivePilaModal(null)}
              className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black"
            >
              Chiudi Dettaglio
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
