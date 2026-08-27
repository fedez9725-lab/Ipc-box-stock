import React, { useState } from 'react';
import {
  X,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Layers,
  Info,
  Truck,
  Building,
  Trash2,
  RefreshCw,
  AlertOctagon,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';

interface ModalsProps {
  currentModal: 'reception' | 'usage' | 'damage' | 'recovery' | 'adjust' | 'zero' | null;
  closeModal: () => void;
}

export const QuickActionModals: React.FC<ModalsProps> = ({ currentModal, closeModal }) => {
  const {
    stock,
    metrics,
    orders,
    workOrders,
    settings,
    activeOperator,
    recordReception,
    recordUsage,
    recordDamage,
    recordRecovery,
    adjustStock,
    resetAllData,
    zeroAllData,
  } = useStock();

  // Reception Form State
  const [recLinea, setRecLinea] = useState<string>('');
  const [recBollaQty, setRecBollaQty] = useState<number>(0);
  const [recIntegri, setRecIntegri] = useState<number>(0);
  const [recDanneggiati, setRecDanneggiati] = useState<number>(0);
  const [recBasiRotte, setRecBasiRotte] = useState<number>(0);
  const [recCoperchiRotti, setRecCoperchiRotti] = useState<number>(0);
  const [recBasiMancanti, setRecBasiMancanti] = useState<number>(0);
  const [recCoperchiMancanti, setRecCoperchiMancanti] = useState<number>(0);
  const [recZona, setRecZona] = useState<string>(settings.zoneDisponibili[0] || 'Magazzino');
  const [recNotes, setRecNotes] = useState<string>('');

  // Usage Form State - Only Qty & Notes
  const [useQty, setUseQty] = useState<number>(7);
  const [useNotes, setUseNotes] = useState<string>('');

  // Damage Form State
  const [damType, setDamType] = useState<'BOX_COMPLETO' | 'BASE' | 'COPERCHIO'>('BASE');
  const [damQty, setDamQty] = useState<number>(1);
  const [damCause, setDamCause] = useState<
    'CADUTA_CARRELLO' | 'SCHIACCIAMENTO' | 'USURA_LAVORAZIONE' | 'DIFETTO_FORNITURA' | 'GANCIO_ROTTO' | 'ALTRO'
  >('CADUTA_CARRELLO');
  const [damDesc, setDamDesc] = useState<string>('');
  const [damPila, setDamPila] = useState<string>('');

  // Recovery Form State
  const [recovType, setRecovType] = useState<'BOX_COMPLETO' | 'BASE' | 'COPERCHIO'>('BASE');
  const [recovQty, setRecovQty] = useState<number>(1);
  const [recovNotes, setRecovNotes] = useState<string>('');

  // Adjust Form State
  const [adjBasiInt, setAdjBasiInt] = useState<number>(stock.basiIntegre);
  const [adjCopInt, setAdjCopInt] = useState<number>(stock.coperchiIntegri);
  const [adjBasiRot, setAdjBasiRot] = useState<number>(stock.basiRotte);
  const [adjCopRot, setAdjCopRot] = useState<number>(stock.coperchiRotti);
  const [adjMotivo, setAdjMotivo] = useState<string>('Conteggio fisico inventario periodico');

  // Feedback message
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  if (!currentModal) return null;

  // 1. Submit Reception
  const handleReceptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (recIntegri <= 0 && recDanneggiati <= 0 && recBasiRotte <= 0 && recCoperchiRotti <= 0) {
      setNotification({ type: 'error', msg: 'Inserisci almeno un componente o box ricevuto.' });
      return;
    }
    const res = recordReception({
      lineaRiferimento: recLinea.trim() || undefined,
      quantitaDichiarata: Number(recBollaQty),
      boxIntegri: Number(recIntegri),
      boxDanneggiati: Number(recDanneggiati),
      basiRotte: Number(recBasiRotte),
      coperchiRotti: Number(recCoperchiRotti),
      basiMancanti: Number(recBasiMancanti),
      coperchiMancanti: Number(recCoperchiMancanti),
      zona: recZona || 'Magazzino',
      note: recNotes,
    });
    if (res.success) {
      closeModal();
    }
  };

  // 2. Submit Usage (Prelevati + Note)
  const handleUsageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (useQty <= 0) {
      setNotification({ type: 'error', msg: 'Inserisci una quantità valida maggiore di zero.' });
      return;
    }
    if (useQty > metrics.boxUtilizzabili) {
      setNotification({
        type: 'error',
        msg: `Quantità richiesta (${useQty}) superiore alla disponibilità utilizzabile (${metrics.boxUtilizzabili}).`,
      });
      return;
    }
    const res = recordUsage({
      quantita: Number(useQty),
      lavorazioneCodice: 'Prelievo Operativo',
      note: useNotes,
    });
    if (res.success) {
      closeModal();
    } else {
      setNotification({ type: 'error', msg: res.message });
    }
  };

  // 3. Submit Damage
  const handleDamageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (damQty <= 0) {
      setNotification({ type: 'error', msg: 'Inserisci una quantità valida.' });
      return;
    }
    const res = recordDamage({
      tipoElemento: damType,
      quantita: Number(damQty),
      causaDanno: damCause,
      descrizione: damDesc || `Danno ${damType} per ${damCause}`,
      pilaOrigine: damPila,
    });
    if (res.success) {
      closeModal();
    }
  };

  // 4. Submit Recovery
  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (recovQty <= 0) {
      setNotification({ type: 'error', msg: 'Inserisci una quantità valida.' });
      return;
    }
    const res = recordRecovery({
      tipoElemento: recovType,
      quantita: Number(recovQty),
      note: recovNotes || `Recupero ${recovType}`,
    });
    if (res.success) {
      closeModal();
    }
  };

  // 5. Submit Adjustment
  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adjustStock({
      basiIntegre: Number(adjBasiInt),
      coperchiIntegri: Number(adjCopInt),
      basiRotte: Number(adjBasiRot),
      coperchiRotti: Number(adjCopRot),
      motivo: adjMotivo,
    });
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="quick-action-modal-container"
        className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentModal === 'reception' && <ArrowDownToLine className="w-5 h-5 text-blue-400" />}
            {currentModal === 'usage' && <ArrowUpFromLine className="w-5 h-5 text-amber-400" />}
            {currentModal === 'damage' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
            {currentModal === 'recovery' && <RotateCcw className="w-5 h-5 text-emerald-400" />}
            {currentModal === 'adjust' && <Sliders className="w-5 h-5 text-purple-400" />}
            {currentModal === 'zero' && <Trash2 className="w-5 h-5 text-rose-400" />}
            <div>
              <h3 className="font-bold text-base tracking-tight">
                {currentModal === 'reception' && 'Ricezione Materiale & Nuova Fornitura'}
                {currentModal === 'usage' && 'Registra Prelievo / Scarico BOX'}
                {currentModal === 'damage' && 'Segnalazione Danno / Componente Rotto'}
                {currentModal === 'recovery' && 'Recupero e Riparazione Componenti'}
                {currentModal === 'adjust' && 'Rettifica Inventariale Straordinaria'}
                {currentModal === 'zero' && 'Azzeramento Dati Magazzino'}
              </h3>
              <p className="text-xs text-slate-400">Operatore attivo: {activeOperator}</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {notification && (
          <div
            className={`p-3 text-xs font-medium ${
              notification.type === 'error' ? 'bg-rose-50 text-rose-800 border-b border-rose-200' : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            {notification.msg}
          </div>
        )}

        {/* 1. RECEPTION MODAL */}
        {currentModal === 'reception' && (
          <form onSubmit={handleReceptionSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Linea di Riferimento
                </label>
                <input
                  type="text"
                  placeholder="Es. Linea 1, Linea 2, Imballaggio, Fornitore..."
                  value={recLinea}
                  onChange={e => setRecLinea(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Quantità Dichiarata in Bolla / DDT
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={recBollaQty === 0 ? '' : recBollaQty}
                  onFocus={e => e.target.select()}
                  onChange={e =>
                    setRecBollaQty(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Quality Inspection Breakdown */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Controllo Qualità & Integrità al Ricevimento
                </span>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                  Effettivamente Utilizzabili: {recIntegri} BOX
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-emerald-800 mb-1">
                    BOX Integri Completi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={recIntegri === 0 ? '' : recIntegri}
                    onFocus={e => e.target.select()}
                    onChange={e =>
                      setRecIntegri(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    className="w-full text-sm font-bold text-emerald-700 bg-white border border-emerald-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">1 Base integra + 1 Coperchio integro</span>
                </div>

                <div>
                  <label className="block font-medium text-rose-800 mb-1">BOX Danneggiati</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={recDanneggiati === 0 ? '' : recDanneggiati}
                    onFocus={e => e.target.select()}
                    onChange={e =>
                      setRecDanneggiati(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    className="w-full text-sm font-semibold text-rose-700 bg-white border border-rose-300 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Struttura o ganci rotti</span>
                </div>

                <div>
                  <label className="block font-medium text-amber-800 mb-1">Basi Rotte</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={recBasiRotte === 0 ? '' : recBasiRotte}
                    onFocus={e => e.target.select()}
                    onChange={e =>
                      setRecBasiRotte(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    className="w-full text-sm bg-white border border-amber-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Basi lesionate</span>
                </div>

                <div>
                  <label className="block font-medium text-amber-800 mb-1">Coperchi Rotti</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={recCoperchiRotti === 0 ? '' : recCoperchiRotti}
                    onFocus={e => e.target.select()}
                    onChange={e =>
                      setRecCoperchiRotti(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    className="w-full text-sm bg-white border border-amber-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Coperchi fessurati</span>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Basi Mancanti</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={recBasiMancanti === 0 ? '' : recBasiMancanti}
                    onFocus={e => e.target.select()}
                    onChange={e =>
                      setRecBasiMancanti(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-slate-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Solo coperchio consegnato</span>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Coperchi Mancanti</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={recCoperchiMancanti === 0 ? '' : recCoperchiMancanti}
                    onFocus={e => e.target.select()}
                    onChange={e =>
                      setRecCoperchiMancanti(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-slate-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Solo base consegnata</span>
                </div>
              </div>

              {/* Live Stack calculation info */}
              <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Organizzazione in pile:{' '}
                  <strong>
                    {Math.floor(recIntegri / 7)} pile complete da 7
                    {recIntegri % 7 > 0 ? ` + 1 parziale da ${recIntegri % 7}` : ''}
                  </strong>
                </span>
                {recBollaQty > 0 && (
                  <span
                    className={`font-semibold ${
                      recIntegri + recDanneggiati === recBollaQty ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    Discrepanza bolla: {recBollaQty - (recIntegri + recDanneggiati)} pz
                  </span>
                )}
              </div>
            </div>

            {/* Warehouse Zone & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Zona di Stoccaggio Pile
                </label>
                <select
                  value={recZona}
                  onChange={e => setRecZona(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {settings.zoneDisponibili.map(z => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Note Ricezione / DDT</label>
                <input
                  type="text"
                  placeholder="Es. DDT n. 45892 del vettore Poste Italiane, controllato conforme"
                  value={recNotes}
                  onChange={e => setRecNotes(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Conferma Ricezione & Aggiorna Stock
              </button>
            </div>
          </form>
        )}

        {/* 2. USAGE MODAL - Simplified (Only Quantità Box Prelevati + Note) */}
        {currentModal === 'usage' && (
          <form onSubmit={handleUsageSubmit} className="p-6 space-y-5">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between text-amber-900">
              <span>
                Disponibilità attuale: <strong>{metrics.boxUtilizzabili} BOX utilizzabili</strong>
              </span>
              <span>
                Pile da 7 pronte: <strong>{Math.floor(metrics.boxUtilizzabili / 7)}</strong>
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Quantità BOX da Prelevare <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={metrics.boxUtilizzabili}
                placeholder="0"
                value={useQty === 0 ? '' : useQty}
                onFocus={e => e.target.select()}
                onChange={e =>
                  setUseQty(e.target.value === '' ? 0 : Math.max(1, parseInt(e.target.value, 10) || 0))
                }
                className="w-full text-lg font-bold text-slate-900 rounded-xl border border-slate-300 p-3.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none bg-slate-50 focus:bg-white"
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-1.5">
                {useQty > 0
                  ? `Corrisponde a ${Math.floor(useQty / 7)} pile complete da 7${useQty % 7 > 0 ? ` + ${useQty % 7} box singoli` : ''}`
                  : 'Inserisci il quantitativo da prelevare per la linea'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Note
              </label>
              <textarea
                rows={3}
                placeholder="Note operative (es. Linea di produzione, turno, pallet, destinazione...)"
                value={useNotes}
                onChange={e => setUseNotes(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-300 p-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-black rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Conferma Prelievo & Scarica Box
              </button>
            </div>
          </form>
        )}

        {/* 3. DAMAGE MODAL */}
        {currentModal === 'damage' && (
          <form onSubmit={handleDamageSubmit} className="p-6 space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
              Registra componenti lesionati o rotti. Il sistema scalerà immediatamente la disponibilità di BOX
              utilizzabili e sposterà i pezzi danneggiati in Quarantena / Riparazione.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setDamType('BASE')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  damType === 'BASE'
                    ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold ring-2 ring-rose-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs uppercase">Base Rotta</div>
                <div className="text-[11px] text-slate-500 mt-1">Coperchio rimane integro</div>
              </button>

              <button
                type="button"
                onClick={() => setDamType('COPERCHIO')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  damType === 'COPERCHIO'
                    ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold ring-2 ring-rose-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs uppercase">Coperchio Rotto</div>
                <div className="text-[11px] text-slate-500 mt-1">Base rimane integra</div>
              </button>

              <button
                type="button"
                onClick={() => setDamType('BOX_COMPLETO')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  damType === 'BOX_COMPLETO'
                    ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold ring-2 ring-rose-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs uppercase">BOX Completo</div>
                <div className="text-[11px] text-slate-500 mt-1">Danno strutturale grave</div>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Quantità Danneggiata <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="0"
                  value={damQty === 0 ? '' : damQty}
                  onFocus={e => e.target.select()}
                  onChange={e =>
                    setDamQty(e.target.value === '' ? 0 : Math.max(1, parseInt(e.target.value, 10) || 0))
                  }
                  className="w-full text-sm font-bold text-rose-800 rounded-lg border border-rose-300 p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Causa del Danno</label>
                <select
                  value={damCause}
                  onChange={e => setDamCause(e.target.value as any)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="CADUTA_CARRELLO">Caduta dal carrello / Transpallet</option>
                  <option value="SCHIACCIAMENTO">Schiacciamento / Sovraccarico</option>
                  <option value="USURA_LAVORAZIONE">Usura lavorazione ordinaria</option>
                  <option value="GANCIO_ROTTO">Rottura ganci laterali / cerniere</option>
                  <option value="DIFETTO_FORNITURA">Difetto materiale fornitura</option>
                  <option value="ALTRO">Altra causa / Da accertare</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pila di Origine (Opzionale)</label>
                <input
                  type="text"
                  placeholder="Es. PILA-M02 o Capannone"
                  value={damPila}
                  onChange={e => setDamPila(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descrizione Danno</label>
                <input
                  type="text"
                  placeholder="Es. Fondo forato da forche carrello elevatore"
                  value={damDesc}
                  onChange={e => setDamDesc(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Registra Danno
              </button>
            </div>
          </form>
        )}

        {/* 4. RECOVERY MODAL */}
        {currentModal === 'recovery' && (
          <form onSubmit={handleRecoverySubmit} className="p-6 space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
              Ripristina e rimetti in circolazione componenti precedentemente rotti o sostituiti con parti di ricambio.
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div
                onClick={() => setRecovType('BASE')}
                className={`p-3 rounded-xl border cursor-pointer ${
                  recovType === 'BASE'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="text-xs">Ripara Base</div>
                <div className="text-sm font-bold text-rose-600">{stock.basiRotte} rotte</div>
              </div>

              <div
                onClick={() => setRecovType('COPERCHIO')}
                className={`p-3 rounded-xl border cursor-pointer ${
                  recovType === 'COPERCHIO'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="text-xs">Ripara Coperchio</div>
                <div className="text-sm font-bold text-rose-600">{stock.coperchiRotti} rotti</div>
              </div>

              <div
                onClick={() => setRecovType('BOX_COMPLETO')}
                className={`p-3 rounded-xl border cursor-pointer ${
                  recovType === 'BOX_COMPLETO'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="text-xs">Ripara Box Completo</div>
                <div className="text-sm font-bold text-rose-600">{stock.boxDanneggiatiTotali || 0} rotti</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Quantità da Ripristinare
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="0"
                  value={recovQty === 0 ? '' : recovQty}
                  onFocus={e => e.target.select()}
                  onChange={e =>
                    setRecovQty(e.target.value === '' ? 0 : Math.max(1, parseInt(e.target.value, 10) || 0))
                  }
                  className="w-full text-sm font-bold text-emerald-800 rounded-lg border border-emerald-300 p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Note Riparazione / Ricambio</label>
                <input
                  type="text"
                  placeholder="Es. Sostituzione cardini con perni nuovi"
                  value={recovNotes}
                  onChange={e => setRecovNotes(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Conferma Recupero
              </button>
            </div>
          </form>
        )}

        {/* 5. ADJUST MODAL */}
        {currentModal === 'adjust' && (
          <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900">
              Rettifica diretta inventario fisico. Utilizza questa procedura solo in caso di discrepanze accertate
              durante i conteggi di magazzino.
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Basi Integre</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={adjBasiInt === 0 ? '' : adjBasiInt}
                  onFocus={e => e.target.select()}
                  onChange={e =>
                    setAdjBasiInt(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  className="w-full text-sm font-bold text-slate-900 rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Coperchi Integri</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={adjCopInt === 0 ? '' : adjCopInt}
                  onFocus={e => e.target.select()}
                  onChange={e =>
                    setAdjCopInt(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  className="w-full text-sm font-bold text-slate-900 rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Basi Rotte</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={adjBasiRot === 0 ? '' : adjBasiRot}
                  onFocus={e => e.target.select()}
                  onChange={e =>
                    setAdjBasiRot(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  className="w-full text-sm font-bold text-rose-700 rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Coperchi Rotti</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={adjCopRot === 0 ? '' : adjCopRot}
                  onFocus={e => e.target.select()}
                  onChange={e =>
                    setAdjCopRot(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  className="w-full text-sm font-bold text-rose-700 rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Motivazione Rettifica</label>
              <input
                type="text"
                value={adjMotivo}
                onChange={e => setAdjMotivo(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Salva Rettifica & Rigenera Pile
              </button>
            </div>
          </form>
        )}

        {/* 6. ZERO ALL / RESET MODAL */}
        {currentModal === 'zero' && (
          <div className="p-6 space-y-6">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3.5">
              <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-900">Operazione di Azzeramento</h4>
                <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                  Scegli se azzerare tutti i conteggi a zero (0 box, 0 basi, 0 coperchi, 0 pile) per iniziare una nuova gestione pulita, oppure se ripristinare il set di dati dimostrativo iniziale.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: Zero All */}
              <div className="p-5 rounded-2xl border-2 border-rose-200 bg-white hover:border-rose-400 hover:bg-rose-50/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold mb-3">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm">Azzera Tutto a 0</h5>
                  <p className="text-xs text-slate-500 mt-1">
                    Porta tutte le quantità di magazzino a 0 (basi integre, coperchi integri, rotti, pile svuotate).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    zeroAllData();
                    closeModal();
                  }}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Conferma Azzeramento a 0
                </button>
              </div>

              {/* Option B: Reset Demo Data */}
              <div className="p-5 rounded-2xl border-2 border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold mb-3">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm">Ripristina Dati Iniziali Demo</h5>
                  <p className="text-xs text-slate-500 mt-1">
                    Ripristina i dati di prova predefiniti (58 basi, 54 coperchi, pile in Magazzino e Capannone).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetAllData();
                    closeModal();
                  }}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Ripristina Demo
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Annulla
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
