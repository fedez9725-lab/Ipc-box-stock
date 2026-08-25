import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Plus,
  Trash2,
  Search,
  Download,
  Printer,
  Copy,
  Check,
  Globe2,
  FileText,
  AlertOctagon,
  Filter,
  Layers,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Edit3,
  Sparkles,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { EmbargoLDV } from '../../types';

// Preset suggested nations with flags
const SUGGESTED_NATIONS = [
  { name: 'Cuba', flag: '🇨🇺' },
  { name: 'Danimarca', flag: '🇩🇰' },
  { name: 'Iran', flag: '🇮🇷' },
  { name: 'Russia', flag: '🇷🇺' },
  { name: 'Siria', flag: '🇸🇾' },
  { name: 'Corea del Nord', flag: '🇰🇵' },
  { name: 'Bielorussia', flag: '🇧🇾' },
  { name: 'Venezuela', flag: '🇻🇪' },
  { name: 'Yemen', flag: '🇾🇪' },
  { name: 'Sudan', flag: '🇸🇩' },
];

export const EmbargoView: React.FC = () => {
  const {
    embargoLDVs,
    addEmbargoLDV,
    addBulkEmbargoLDVs,
    updateEmbargoLDV,
    deleteEmbargoLDV,
    deleteEmbargoLDVsByCountry,
    clearAllEmbargoLDVs,
    activeOperator,
  } = useStock();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedNationFilter, setSelectedNationFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');

  // Input Form Mode: 'single' | 'bulk'
  const [inputMode, setInputMode] = useState<'single' | 'bulk'>('single');

  // Single Form State
  const [nationInput, setNationInput] = useState('');
  const [ldvInput, setLdvInput] = useState('');
  const [motivoInput, setMotivoInput] = useState('Embargo merci / restrizioni doganali');
  const [collocazioneInput, setCollocazioneInput] = useState('Gabbia Embargo');
  const [noteInput, setNoteInput] = useState('');

  // Bulk Form State
  const [bulkNationInput, setBulkNationInput] = useState('');
  const [bulkLdvText, setBulkLdvText] = useState('');
  const [bulkMotivoInput, setBulkMotivoInput] = useState('Embargo merci / restrizioni doganali');
  const [bulkCollocazioneInput, setBulkCollocazioneInput] = useState('Gabbia Embargo');

  // UI States
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [collapsedNations, setCollapsedNations] = useState<Record<string, boolean>>({});
  const [editingItem, setEditingItem] = useState<EmbargoLDV | null>(null);
  const [showClearListModal, setShowClearListModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Submit Single LDV
  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nationInput.trim()) {
      alert('Inserisci la nazione');
      return;
    }
    if (!ldvInput.trim()) {
      alert('Inserisci il codice LDV');
      return;
    }

    addEmbargoLDV({
      nazione: nationInput,
      codiceLDV: ldvInput,
      motivo: motivoInput,
      collocazione: collocazioneInput,
      note: noteInput,
    });

    showToast(`LDV "${ldvInput.toUpperCase()}" aggiunta con successo sotto ${nationInput.trim()}!`);
    setLdvInput('');
    setNoteInput('');
  };

  // Submit Bulk LDVs
  const handleAddBulk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkNationInput.trim()) {
      alert('Inserisci la nazione per il caricamento multiplo');
      return;
    }
    if (!bulkLdvText.trim()) {
      alert('Inserisci almeno un codice LDV');
      return;
    }

    // Split by newline, comma or semicolon
    const codes = bulkLdvText
      .split(/[\n,;]+/)
      .map(c => c.trim())
      .filter(c => c.length > 0);

    if (codes.length === 0) {
      alert('Nessun codice LDV valido rilevato');
      return;
    }

    const count = addBulkEmbargoLDVs(
      bulkNationInput,
      codes,
      bulkMotivoInput,
      bulkCollocazioneInput
    );

    showToast(`${count} codici LDV aggiunti con successo sotto ${bulkNationInput.trim()}!`);
    setBulkLdvText('');
  };

  // Filtered LDVs
  const filteredLDVs = useMemo(() => {
    return embargoLDVs.filter(item => {
      const matchSearch =
        item.codiceLDV.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nazione.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.motivo && item.motivo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.collocazione && item.collocazione.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = filterStatus === 'ALL' || item.stato === filterStatus;
      const matchNation =
        selectedNationFilter === 'ALL' ||
        item.nazione.toLowerCase() === selectedNationFilter.toLowerCase();

      return matchSearch && matchStatus && matchNation;
    });
  }, [embargoLDVs, searchTerm, filterStatus, selectedNationFilter]);

  // Grouped and strictly Alphabetically Sorted by Country Name (A -> Z)
  const groupedByNation = useMemo(() => {
    const map: Record<string, EmbargoLDV[]> = {};

    filteredLDVs.forEach(item => {
      const country = item.nazione.trim();
      if (!map[country]) {
        map[country] = [];
      }
      map[country].push(item);
    });

    // Sort nations alphabetically A-Z (e.g. Cuba -> Danimarca -> Iran -> Russia -> Siria...)
    const sortedCountryNames = Object.keys(map).sort((a, b) =>
      a.localeCompare(b, 'it', { sensitivity: 'base' })
    );

    return sortedCountryNames.map(country => {
      // Sort LDVs within each country alphabetically or by date
      const sortedItems = [...map[country]].sort((a, b) =>
        a.codiceLDV.localeCompare(b.codiceLDV)
      );
      return {
        country,
        items: sortedItems,
        totalBlocked: sortedItems.filter(i => i.stato === 'BLOCCATO').length,
        totalInVerifica: sortedItems.filter(i => i.stato === 'IN_VERIFICA').length,
        totalSvincolati: sortedItems.filter(i => i.stato === 'SVINCOLATO').length,
        totalResi: sortedItems.filter(i => i.stato === 'RESO_MITTENTE').length,
      };
    });
  }, [filteredLDVs]);

  // Unique list of nations for filter dropdown
  const allUniqueNations = useMemo(() => {
    const set = new Set<string>(embargoLDVs.map(i => i.nazione.trim()));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }));
  }, [embargoLDVs]);

  // Toggle nation collapse
  const toggleNationCollapse = (country: string) => {
    setCollapsedNations(prev => ({
      ...prev,
      [country]: !prev[country],
    }));
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Nazione Destinazione',
      'Codice LDV (Lettera di Vettura)',
      'Data Blocco',
      'Orario Blocco',
      'Stato',
      'Motivo Embargo',
      'Collocazione / Posizione',
      'Operatore Registrazione',
      'Note',
    ];

    // Order alphabetically by country first, then LDV
    const sortedForExport = [...embargoLDVs].sort((a, b) => {
      const cmp = a.nazione.localeCompare(b.nazione, 'it', { sensitivity: 'base' });
      if (cmp !== 0) return cmp;
      return a.codiceLDV.localeCompare(b.codiceLDV);
    });

    const rows = sortedForExport.map(i => [
      `"${i.nazione}"`,
      `"${i.codiceLDV}"`,
      `"${i.dataBlocco}"`,
      `"${i.orarioBlocco || ''}"`,
      `"${i.stato}"`,
      `"${i.motivo || ''}"`,
      `"${i.collocazione || ''}"`,
      `"${i.operatore || ''}"`,
      `"${i.note || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Registro_LDV_Bloccate_Embargo_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Quick stats
  const totalBlocked = embargoLDVs.filter(i => i.stato === 'BLOCCATO').length;
  const totalInVerifica = embargoLDVs.filter(i => i.stato === 'IN_VERIFICA').length;
  const totalSvincolati = embargoLDVs.filter(i => i.stato === 'SVINCOLATO').length;
  const totalCountries = allUniqueNations.length;

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-200">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Registro LDV Bloccate per Embargo
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">
                {embargoLDVs.length} Totali
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Gestione lettere di vettura bloccate per restrizioni doganali, sanzioni ed embargo internazionale
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {embargoLDVs.length > 0 && (
            <button
              onClick={() => setShowClearListModal(true)}
              className="px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Elimina o svuota la lista giornaliera di LDV bloccate"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              Elimina Lista Giornaliera ({embargoLDVs.length})
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Esporta elenco completo in formato CSV / Excel"
          >
            <Download className="w-3.5 h-3.5" />
            Esporta Excel / CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Stampa foglio di registro per verifiche doganali"
          >
            <Printer className="w-3.5 h-3.5" />
            Stampa Registro
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-xs transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Top Summary KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Nazioni Coinvolte
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">{totalCountries}</span>
            <span className="text-xs text-slate-400">paesi esteri</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs">
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
            LDV Bloccate Attive
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-rose-700 font-mono">{totalBlocked}</span>
            <span className="text-xs text-rose-500">ferme in hub</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
            In Verifica Doganale
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-700 font-mono">{totalInVerifica}</span>
            <span className="text-xs text-amber-600">in esame</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
            Svincolate / Risolte
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-700 font-mono">{totalSvincolati}</span>
            <span className="text-xs text-emerald-600">autorizzate</span>
          </div>
        </div>
      </div>

      {/* 3. INPUT FORM PANEL (Single & Bulk Mode) */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm tracking-wide">
              Inserisci Nuova LDV Bloccata
            </h3>
          </div>

          {/* Switch Single / Bulk */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setInputMode('single')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                inputMode === 'single'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Inserimento Singolo (Nazione &rarr; LDV)
            </button>
            <button
              type="button"
              onClick={() => setInputMode('bulk')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                inputMode === 'bulk'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Caricamento Multiplo / Lista
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5">
          {/* Quick Nation Pills */}
          <div className="mb-4">
            <span className="text-xs font-bold text-slate-600 block mb-1.5 uppercase tracking-tight">
              Nazioni Rapide con Embargo Frequente (Clicca per selezionare):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_NATIONS.map(n => (
                <button
                  key={n.name}
                  type="button"
                  onClick={() => {
                    if (inputMode === 'single') setNationInput(n.name);
                    else setBulkNationInput(n.name);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{n.flag}</span>
                  <span>{n.name}</span>
                </button>
              ))}
            </div>
          </div>

          {inputMode === 'single' ? (
            /* SINGLE INSERTION FORM */
            <form onSubmit={handleAddSingle} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Nation */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    1. Nazione Destinazione <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nationInput}
                    onChange={e => setNationInput(e.target.value)}
                    placeholder="Es. Cuba, Danimarca, Iran..."
                    className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                {/* LDV Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    2. Codice LDV / Waybill <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={ldvInput}
                    onChange={e => setLdvInput(e.target.value)}
                    placeholder="Es. LDV-CU-884920, CP123456789IT..."
                    className="w-full text-xs font-mono font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none uppercase"
                  />
                </div>

                {/* Collocazione */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Collocazione / Ubicazione
                  </label>
                  <input
                    type="text"
                    value={collocazioneInput}
                    onChange={e => setCollocazioneInput(e.target.value)}
                    placeholder="Es. Gabbia Embargo, Scaffale D1..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                {/* Motivo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Motivo Blocco / Restrizione
                  </label>
                  <input
                    type="text"
                    value={motivoInput}
                    onChange={e => setMotivoInput(e.target.value)}
                    placeholder="Es. Sanzioni internazionali, embargo UPU..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Note and Submit */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="w-full sm:flex-1">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={e => setNoteInput(e.target.value)}
                    placeholder="Note opzionali (es. Trattenuta per ispezione doganale, mittente contattato...)"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Registra Blocco LDV
                </button>
              </div>
            </form>
          ) : (
            /* BULK MULTI-INSERTION FORM */
            <form onSubmit={handleAddBulk} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nazione di Destinazione <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bulkNationInput}
                    onChange={e => setBulkNationInput(e.target.value)}
                    placeholder="Es. Cuba, Danimarca..."
                    className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Collocazione Fisica
                  </label>
                  <input
                    type="text"
                    value={bulkCollocazioneInput}
                    onChange={e => setBulkCollocazioneInput(e.target.value)}
                    placeholder="Es. Gabbia Embargo"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Motivo Blocco
                  </label>
                  <input
                    type="text"
                    value={bulkMotivoInput}
                    onChange={e => setBulkMotivoInput(e.target.value)}
                    placeholder="Es. Embargo merci / restrizioni sanzionatorie"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Incolla Lista Codici LDV (uno per riga oppure separati da virgola) <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={bulkLdvText}
                  onChange={e => setBulkLdvText(e.target.value)}
                  placeholder={`LDV-CU-001\nLDV-CU-002\nLDV-CU-003\nCP987654321IT`}
                  className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none uppercase"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Carica Tutte le LDV in {bulkNationInput.trim() || 'Nazione'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* 4. SEARCH, FILTER & VIEW CONTROLS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cerca per codice LDV, Nazione, motivo o ubicazione..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              &times;
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Nation Filter */}
          <select
            value={selectedNationFilter}
            onChange={e => setSelectedNationFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
          >
            <option value="ALL">Tutte le Nazioni ({allUniqueNations.length})</option>
            {allUniqueNations.map(nat => (
              <option key={nat} value={nat}>
                {nat}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
          >
            <option value="ALL">Tutti gli stati</option>
            <option value="BLOCCATO">Solo Bloccate</option>
            <option value="IN_VERIFICA">Solo In Verifica</option>
            <option value="SVINCOLATO">Solo Svincolate</option>
            <option value="RESO_MITTENTE">Solo Reso al Mittente</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-2.5 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'grouped'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Visualizzazione ordinata A-Z raggruppata per nazione"
            >
              Per Nazione (A-Z)
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Visualizzazione elenco tabellare compatto"
            >
              Tabella Globale
            </button>
          </div>
        </div>
      </div>

      {/* 5. MAIN CONTENT: GROUPED BY NATION (ORDERED A-Z) */}
      {viewMode === 'grouped' ? (
        <div className="space-y-4">
          {groupedByNation.length > 0 ? (
            groupedByNation.map(group => {
              const isCollapsed = !!collapsedNations[group.country];

              return (
                <div
                  key={group.country}
                  className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden"
                >
                  {/* Nation Section Header */}
                  <div
                    onClick={() => toggleNationCollapse(group.country)}
                    className="p-4 bg-slate-50 hover:bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-slate-200/70 text-slate-700">
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe2 className="w-4 h-4 text-rose-600" />
                        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                          {group.country}
                        </h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black font-mono bg-rose-100 text-rose-800 border border-rose-200">
                        {group.items.length} {group.items.length === 1 ? 'LDV' : 'LDV'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setNationInput(group.country);
                          window.scrollTo({ top: 150, behavior: 'smooth' });
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="Aggiungi altra LDV a questa nazione"
                      >
                        <Plus className="w-3 h-3 text-emerald-600" />
                        + Aggiungi LDV
                      </button>

                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Sei sicuro di voler eliminare TUTTE le ${group.items.length} LDV registrate per la nazione "${group.country}"?`
                            )
                          ) {
                            deleteEmbargoLDVsByCountry(group.country);
                            showToast(`Tutte le LDV di ${group.country} sono state eliminate.`);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Elimina tutte le LDV di questa nazione"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Nation Items Table */}
                  {!isCollapsed && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider select-none">
                            <th className="p-3 w-52">Codice LDV (Lettera di Vettura)</th>
                            <th className="p-3 w-36">Data / Ora Blocco</th>
                            <th className="p-3 w-32">Stato</th>
                            <th className="p-3 w-40">Ubicazione</th>
                            <th className="p-3">Motivo & Note</th>
                            <th className="p-3 text-right w-28 print:hidden">Azioni</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {group.items.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Codice LDV */}
                              <td className="p-3 font-mono font-bold text-slate-900 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-rose-900 font-extrabold">
                                    {item.codiceLDV}
                                  </span>
                                  <button
                                    onClick={() => handleCopy(item.codiceLDV, item.id)}
                                    className="text-slate-400 hover:text-slate-700 p-1 transition-colors cursor-pointer"
                                    title="Copia codice negli appunti"
                                  >
                                    {copiedId === item.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              {/* Data / Ora */}
                              <td className="p-3 text-slate-600 font-mono text-[11px]">
                                <div>{item.dataBlocco}</div>
                                {item.orarioBlocco && (
                                  <div className="text-slate-400 text-[10px]">{item.orarioBlocco}</div>
                                )}
                              </td>

                              {/* Stato */}
                              <td className="p-3">
                                <select
                                  value={item.stato}
                                  onChange={e =>
                                    updateEmbargoLDV(item.id, {
                                      stato: e.target.value as EmbargoLDV['stato'],
                                    })
                                  }
                                  className={`text-[11px] font-bold px-2 py-1 rounded-md border focus:outline-none cursor-pointer ${
                                    item.stato === 'BLOCCATO'
                                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                                      : item.stato === 'IN_VERIFICA'
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : item.stato === 'SVINCOLATO'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : 'bg-slate-100 text-slate-800 border-slate-300'
                                  }`}
                                >
                                  <option value="BLOCCATO">BLOCCATO</option>
                                  <option value="IN_VERIFICA">IN VERIFICA</option>
                                  <option value="SVINCOLATO">SVINCOLATO</option>
                                  <option value="RESO_MITTENTE">RESO MITTENTE</option>
                                </select>
                              </td>

                              {/* Collocazione */}
                              <td className="p-3 text-slate-700">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{item.collocazione || 'Gabbia Embargo'}</span>
                                </div>
                              </td>

                              {/* Motivo & Note */}
                              <td className="p-3">
                                <div className="text-slate-800 font-medium text-xs">
                                  {item.motivo || 'Embargo merci'}
                                </div>
                                {item.note && (
                                  <div className="text-slate-500 text-[11px] italic mt-0.5">
                                    &ldquo;{item.note}&rdquo;
                                  </div>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="p-3 text-right print:hidden">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => setEditingItem(item)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                    title="Modifica"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Eliminare LDV ${item.codiceLDV}?`)) {
                                        deleteEmbargoLDV(item.id);
                                        showToast(`LDV ${item.codiceLDV} eliminata.`);
                                      }
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Elimina"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Globe2 className="w-6 h-6 text-slate-400" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                {embargoLDVs.length === 0
                  ? 'Lista Giornaliera Vuota'
                  : 'Nessuna LDV trovata per i filtri selezionati'}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {embargoLDVs.length === 0
                  ? 'Non ci sono lettere di vettura bloccate registrate per oggi. Puoi iniziare la nuova lista giornaliera inserendo Nazione e codice LDV nel modulo in alto.'
                  : 'Modifica il termine di ricerca o i filtri per visualizzare le lettere di vettura registrate.'}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* GLOBAL TABLE VIEW (ORDERED BY NATION A-Z) */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider select-none">
                  <th className="p-3 w-40">Nazione (A-Z)</th>
                  <th className="p-3 w-52">Codice LDV</th>
                  <th className="p-3 w-32">Data Blocco</th>
                  <th className="p-3 w-32">Stato</th>
                  <th className="p-3 w-36">Collocazione</th>
                  <th className="p-3">Motivo & Note</th>
                  <th className="p-3 text-right w-24 print:hidden">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLDVs
                  .slice()
                  .sort((a, b) => {
                    const cmp = a.nazione.localeCompare(b.nazione, 'it', { sensitivity: 'base' });
                    if (cmp !== 0) return cmp;
                    return a.codiceLDV.localeCompare(b.codiceLDV);
                  })
                  .map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Globe2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>{item.nazione}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-rose-900">
                        {item.codiceLDV}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600">
                        {item.dataBlocco}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            item.stato === 'BLOCCATO'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : item.stato === 'IN_VERIFICA'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {item.stato}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{item.collocazione || 'Gabbia Embargo'}</td>
                      <td className="p-3 text-slate-700">
                        <div>{item.motivo || 'Embargo merci'}</div>
                        {item.note && <div className="text-[11px] text-slate-400 italic">{item.note}</div>}
                      </td>
                      <td className="p-3 text-right print:hidden">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Eliminare LDV ${item.codiceLDV}?`)) {
                                deleteEmbargoLDV(item.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. EDITING MODAL */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Modifica LDV Bloccata
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                updateEmbargoLDV(editingItem.id, {
                  nazione: editingItem.nazione,
                  codiceLDV: editingItem.codiceLDV,
                  motivo: editingItem.motivo,
                  collocazione: editingItem.collocazione,
                  stato: editingItem.stato,
                  note: editingItem.note,
                });
                showToast(`LDV ${editingItem.codiceLDV} aggiornata.`);
                setEditingItem(null);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nazione:</label>
                <input
                  type="text"
                  required
                  value={editingItem.nazione}
                  onChange={e => setEditingItem({ ...editingItem, nazione: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Codice LDV:</label>
                <input
                  type="text"
                  required
                  value={editingItem.codiceLDV}
                  onChange={e => setEditingItem({ ...editingItem, codiceLDV: e.target.value })}
                  className="w-full font-mono font-bold p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stato:</label>
                  <select
                    value={editingItem.stato}
                    onChange={e =>
                      setEditingItem({
                        ...editingItem,
                        stato: e.target.value as EmbargoLDV['stato'],
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none font-semibold"
                  >
                    <option value="BLOCCATO">BLOCCATO</option>
                    <option value="IN_VERIFICA">IN VERIFICA</option>
                    <option value="SVINCOLATO">SVINCOLATO</option>
                    <option value="RESO_MITTENTE">RESO MITTENTE</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Collocazione:</label>
                  <input
                    type="text"
                    value={editingItem.collocazione || ''}
                    onChange={e => setEditingItem({ ...editingItem, collocazione: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivo Blocco:</label>
                <input
                  type="text"
                  value={editingItem.motivo || ''}
                  onChange={e => setEditingItem({ ...editingItem, motivo: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Note:</label>
                <textarea
                  rows={2}
                  value={editingItem.note || ''}
                  onChange={e => setEditingItem({ ...editingItem, note: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 cursor-pointer"
                >
                  Salva Modifiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFERMA ELIMINA LISTA GIORNALIERA */}
      {showClearListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-3 bg-rose-100 rounded-xl border border-rose-200">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Elimina Lista Giornaliera
                </h3>
                <p className="text-xs text-slate-500">
                  Conferma cancellazione registro giornaliero
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Sei sicuro di voler eliminare tutte le <strong>{embargoLDVs.length}</strong> lettere di vettura
              registrate nella lista giornaliera? Una volta eliminata, potrai iniziare subito una nuova lista pulita per il turno successivo.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-[11px] text-amber-800 flex items-start gap-2">
              <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Suggerimento:</strong> Se hai bisogno di conservare uno storico o il report per la dogana, puoi esportare il file Excel prima di cancellare.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  handleExportCSV();
                  clearAllEmbargoLDVs();
                  setShowClearListModal(false);
                  showToast('File Excel esportato e lista giornaliera azzerata con successo.');
                }}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Scarica Excel ed Elimina
              </button>
              <button
                type="button"
                onClick={() => setShowClearListModal(false)}
                className="px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllEmbargoLDVs();
                  setShowClearListModal(false);
                  showToast('Lista giornaliera eliminata. Registro azzerato.');
                }}
                className="px-4 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Conferma ed Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
