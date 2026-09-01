import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Printer,
  Copy,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  Truck,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Layers,
  Plane,
  RotateCcw,
  CheckCircle2,
  FileText,
  X,
  PlusCircle,
  FileCheck,
  ChevronDown,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { useStock } from '../../context/StockContext';
import { RoutingError, AirportCode } from '../../types';

export const RoutingErrorsView: React.FC = () => {
  const {
    routingErrors,
    addRoutingError,
    updateRoutingError,
    deleteRoutingError,
    duplicateRoutingError,
    clearAllRoutingErrors,
    settings,
    activeOperator,
  } = useStock();

  // Sub-views: 'list' (Storico), 'dashboard' (Grafici e KPI), 'report' (Report formale / Stampa)
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'dashboard' | 'report'>('list');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'LIN_TO_MXP' | 'MXP_TO_LIN'>('ALL');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedLineFilter, setSelectedLineFilter] = useState<string>('ALL');

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingErrorId, setEditingErrorId] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    ora: `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`,
    linea: '',
    dispaccio: '',
    destinazioneCorretta: 'LIN' as AirportCode,
    destinazioneErrata: 'MXP' as AirportCode,
    numeroSpedizioni: 1,
    numeroLdv: '',
    note: '',
  });

  // Modal Toast / Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [copiedLdvId, setCopiedLdvId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Distinct list of lines for autocomplete / filter
  const existingLines = useMemo(() => {
    const lines = new Set<string>();
    routingErrors.forEach(e => {
      if (e.linea) lines.add(e.linea.trim());
    });
    return Array.from(lines).sort();
  }, [routingErrors]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    const now = new Date();
    setEditingErrorId(null);
    setFormData({
      data: now.toISOString().split('T')[0],
      ora: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      linea: existingLines[0] || 'Linea Notte Milano-Hub',
      dispaccio: '',
      destinazioneCorretta: 'LIN',
      destinazioneErrata: 'MXP',
      numeroSpedizioni: 1,
      numeroLdv: '',
      note: '',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (error: RoutingError) => {
    setEditingErrorId(error.id);
    setFormData({
      data: error.data,
      ora: error.ora,
      linea: error.linea,
      dispaccio: error.dispaccio,
      destinazioneCorretta: error.destinazioneCorretta,
      destinazioneErrata: error.destinazioneErrata,
      numeroSpedizioni: error.numeroSpedizioni,
      numeroLdv: error.numeroLdv || '',
      note: error.note || '',
    });
    setIsModalOpen(true);
  };

  // Handle Airport Toggle in Form
  const handleToggleAirport = (corretta: AirportCode) => {
    const errata: AirportCode = corretta === 'LIN' ? 'MXP' : 'LIN';
    setFormData(prev => ({
      ...prev,
      destinazioneCorretta: corretta,
      destinazioneErrata: errata,
    }));
  };

  // Save Modal
  const handleSaveError = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.linea.trim()) {
      showToast('Inserisci il nome della linea');
      return;
    }
    if (!formData.dispaccio.trim()) {
      showToast('Inserisci il numero di dispaccio');
      return;
    }

    if (editingErrorId) {
      updateRoutingError(editingErrorId, {
        data: formData.data,
        ora: formData.ora,
        linea: formData.linea,
        dispaccio: formData.dispaccio,
        destinazioneCorretta: formData.destinazioneCorretta,
        destinazioneErrata: formData.destinazioneErrata,
        numeroSpedizioni: formData.numeroSpedizioni,
        numeroLdv: formData.numeroLdv,
        note: formData.note,
      });
      showToast(`Errore su dispaccio ${formData.dispaccio.toUpperCase()} aggiornato`);
    } else {
      addRoutingError({
        data: formData.data,
        ora: formData.ora,
        linea: formData.linea,
        dispaccio: formData.dispaccio,
        destinazioneCorretta: formData.destinazioneCorretta,
        destinazioneErrata: formData.destinazioneErrata,
        numeroSpedizioni: formData.numeroSpedizioni,
        numeroLdv: formData.numeroLdv,
        note: formData.note,
      });
      showToast(`Nuovo errore registrato: ${formData.dispaccio.toUpperCase()} (${formData.numeroSpedizioni} sped.)`);
    }

    setIsModalOpen(false);
  };

  // Quick Duplicate
  const handleDuplicate = (id: string) => {
    const dup = duplicateRoutingError(id);
    if (dup) {
      showToast(`Duplicato errore dispaccio ${dup.dispaccio}`);
    }
  };

  // Copy LDV to clipboard
  const handleCopyLdv = (ldv: string, id: string) => {
    navigator.clipboard.writeText(ldv);
    setCopiedLdvId(id);
    showToast(`LDV ${ldv} copiata negli appunti`);
    setTimeout(() => setCopiedLdvId(null), 2000);
  };

  // Filtering Logic
  const filteredErrors = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    const sevenDaysAgoDate = new Date();
    sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);
    const sevenDaysAgo = sevenDaysAgoDate.toISOString().split('T')[0];

    const currentMonthPrefix = today.substring(0, 7); // YYYY-MM

    return routingErrors.filter(err => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchLinea = err.linea.toLowerCase().includes(q);
        const matchDispaccio = err.dispaccio.toLowerCase().includes(q);
        const matchLdv = (err.numeroLdv || '').toLowerCase().includes(q);
        const matchNote = (err.note || '').toLowerCase().includes(q);
        if (!matchLinea && !matchDispaccio && !matchLdv && !matchNote) return false;
      }

      // 2. Line Filter
      if (selectedLineFilter !== 'ALL' && err.linea !== selectedLineFilter) {
        return false;
      }

      // 3. Direction Filter
      if (directionFilter === 'LIN_TO_MXP') {
        // Corretta LIN, Inviata a MXP
        if (!(err.destinazioneCorretta === 'LIN' && err.destinazioneErrata === 'MXP')) return false;
      } else if (directionFilter === 'MXP_TO_LIN') {
        // Corretta MXP, Inviata a LIN
        if (!(err.destinazioneCorretta === 'MXP' && err.destinazioneErrata === 'LIN')) return false;
      }

      // 4. Period Filter
      if (periodFilter === 'TODAY') {
        if (err.data !== today) return false;
      } else if (periodFilter === 'YESTERDAY') {
        if (err.data !== yesterday) return false;
      } else if (periodFilter === 'WEEK') {
        if (err.data < sevenDaysAgo) return false;
      } else if (periodFilter === 'MONTH') {
        if (!err.data.startsWith(currentMonthPrefix)) return false;
      } else if (periodFilter === 'CUSTOM') {
        if (customStartDate && err.data < customStartDate) return false;
        if (customEndDate && err.data > customEndDate) return false;
      }

      return true;
    });
  }, [
    routingErrors,
    searchQuery,
    selectedLineFilter,
    directionFilter,
    periodFilter,
    customStartDate,
    customEndDate,
  ]);

  // Key KPI Metrics
  const kpis = useMemo(() => {
    const totaleErrori = filteredErrors.length;
    const totaleSpedizioni = filteredErrors.reduce((acc, curr) => acc + curr.numeroSpedizioni, 0);

    const linToMxp = filteredErrors.filter(
      e => e.destinazioneCorretta === 'LIN' && e.destinazioneErrata === 'MXP'
    );
    const mxpToLin = filteredErrors.filter(
      e => e.destinazioneCorretta === 'MXP' && e.destinazioneErrata === 'LIN'
    );

    const erroriLinToMxp = linToMxp.length;
    const spedizioniLinToMxp = linToMxp.reduce((acc, c) => acc + c.numeroSpedizioni, 0);

    const erroriMxpToLin = mxpToLin.length;
    const spedizioniMxpToLin = mxpToLin.reduce((acc, c) => acc + c.numeroSpedizioni, 0);

    const percLinToMxp = totaleErrori > 0 ? Math.round((erroriLinToMxp / totaleErrori) * 100) : 0;
    const percMxpToLin = totaleErrori > 0 ? Math.round((erroriMxpToLin / totaleErrori) * 100) : 0;

    // Line with most errors
    const lineMap: Record<string, { count: number; spedizioni: number }> = {};
    filteredErrors.forEach(e => {
      if (!lineMap[e.linea]) lineMap[e.linea] = { count: 0, spedizioni: 0 };
      lineMap[e.linea].count += 1;
      lineMap[e.linea].spedizioni += e.numeroSpedizioni;
    });

    let topLinea: { linea: string; count: number; spedizioni: number } | null = null;
    Object.entries(lineMap).forEach(([linea, data]) => {
      if (!topLinea || data.count > topLinea.count) {
        topLinea = { linea, ...data };
      }
    });

    // Date with most errors
    const dateMap: Record<string, { count: number; spedizioni: number }> = {};
    filteredErrors.forEach(e => {
      if (!dateMap[e.data]) dateMap[e.data] = { count: 0, spedizioni: 0 };
      dateMap[e.data].count += 1;
      dateMap[e.data].spedizioni += e.numeroSpedizioni;
    });

    let topDate: { data: string; count: number; spedizioni: number } | null = null;
    Object.entries(dateMap).forEach(([data, d]) => {
      if (!topDate || d.count > topDate.count) {
        topDate = { data, ...d };
      }
    });

    return {
      totaleErrori,
      totaleSpedizioni,
      erroriLinToMxp,
      spedizioniLinToMxp,
      erroriMxpToLin,
      spedizioniMxpToLin,
      percLinToMxp,
      percMxpToLin,
      topLinea,
      topDate,
      lineMap,
    };
  }, [filteredErrors]);

  // Chart Data: Trend over time
  const timelineChartData = useMemo(() => {
    const datesMap: Record<string, { data: string; linToMxp: number; mxpToLin: number; totalSped: number }> = {};

    filteredErrors.forEach(err => {
      if (!datesMap[err.data]) {
        datesMap[err.data] = { data: err.data, linToMxp: 0, mxpToLin: 0, totalSped: 0 };
      }
      if (err.destinazioneCorretta === 'LIN') {
        datesMap[err.data].linToMxp += 1;
      } else {
        datesMap[err.data].mxpToLin += 1;
      }
      datesMap[err.data].totalSped += err.numeroSpedizioni;
    });

    return Object.values(datesMap)
      .sort((a, b) => a.data.localeCompare(b.data))
      .slice(-14); // Last 14 active days
  }, [filteredErrors]);

  // Chart Data: Lines Breakdown
  const linesChartData = useMemo(() => {
    return (Object.entries(kpis.lineMap) as [string, { count: number; spedizioni: number }][])
      .map(([linea, d]) => ({
        linea: linea.length > 18 ? `${linea.substring(0, 18)}...` : linea,
        nomeCompleto: linea,
        errori: d.count,
        spedizioni: d.spedizioni,
      }))
      .sort((a, b) => b.errori - a.errori)
      .slice(0, 6);
  }, [kpis.lineMap]);

  // Chart Data: Donut Pie
  const directionPieData = useMemo(() => {
    return [
      { name: 'LIN ➔ MXP (Inviata errata a MXP)', value: kpis.erroriLinToMxp, color: '#3b82f6' },
      { name: 'MXP ➔ LIN (Inviata errata a LIN)', value: kpis.erroriMxpToLin, color: '#f59e0b' },
    ].filter(item => item.value > 0);
  }, [kpis.erroriLinToMxp, kpis.erroriMxpToLin]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredErrors.length === 0) {
      showToast('Nessun record da esportare');
      return;
    }

    const headers = [
      'Data',
      'Ora',
      'Nome Linea',
      'Numero Dispaccio',
      'Destinazione Corretta',
      'Destinazione Errata',
      'Direzione Anomalia',
      'Numero Spedizioni',
      'Numero LDV / Spedizione',
      'Note',
      'Operatore Registrazione',
    ];

    const rows = filteredErrors.map(err => [
      `"${err.data}"`,
      `"${err.ora}"`,
      `"${err.linea.replace(/"/g, '""')}"`,
      `"${err.dispaccio.replace(/"/g, '""')}"`,
      `"${err.destinazioneCorretta}"`,
      `"${err.destinazioneErrata}"`,
      `"${err.destinazioneCorretta} -> ${err.destinazioneErrata}"`,
      err.numeroSpedizioni,
      `"${(err.numeroLdv || '').replace(/"/g, '""')}"`,
      `"${(err.note || '').replace(/"/g, '""')}"`,
      `"${(err.operatore || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Report_Errori_Instradamento_LIN_MXP_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('File CSV esportato con successo');
  };

  // Copy Printable Report Text
  const handleCopyReportText = () => {
    let report = `==========================================================\n`;
    report += `REPORT CONTESTAZIONE ERRORI DI INSTRADAMENTO LIN <-> MXP\n`;
    report += `Hub Riferimento: ${settings.nomeHub} (${settings.codiceHub})\n`;
    report += `Data Generazione: ${new Date().toLocaleString('it-IT')}\n`;
    report += `Totale Errori Registrati: ${kpis.totaleErrori}\n`;
    report += `Totale Spedizioni Impattate: ${kpis.totaleSpedizioni}\n`;
    report += `----------------------------------------------------------\n`;
    report += `RIEPILOGO PER DIREZIONE:\n`;
    report += `- Destinazione Corretta LIN -> Inviata a MXP: ${kpis.erroriLinToMxp} errori (${kpis.spedizioniLinToMxp} spedizioni, ${kpis.percLinToMxp}%)\n`;
    report += `- Destinazione Corretta MXP -> Inviata a LIN: ${kpis.erroriMxpToLin} errori (${kpis.spedizioniMxpToLin} spedizioni, ${kpis.percMxpToLin}%)\n`;
    report += `----------------------------------------------------------\n`;
    report += `DETTAGLIO COMPLETO ANOMALIE:\n\n`;

    filteredErrors.forEach((e, idx) => {
      report += `${idx + 1}. [${e.data} ${e.ora}] Linea: ${e.linea} | Dispaccio: ${e.dispaccio}\n`;
      report += `   Corretta: ${e.destinazioneCorretta} ➔ Inviata Errata a: ${e.destinazioneErrata} | Spedizioni: ${e.numeroSpedizioni}\n`;
      if (e.numeroLdv) report += `   LDV/Tracking: ${e.numeroLdv}\n`;
      if (e.note) report += `   Note: ${e.note}\n`;
      report += `\n`;
    });

    report += `==========================================================\n`;

    navigator.clipboard.writeText(report);
    showToast('Report formale copiato negli appunti per invio contestazione');
  };

  return (
    <div className="space-y-5">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 animate-bounce text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header & Sub-Nav */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 font-black text-base">
                <Plane className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Monitoraggio Errori LIN ⇄ MXP</span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                    {kpis.totaleErrori} {kpis.totaleErrori === 1 ? 'errore' : 'errori'}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Registro disservizi e spedizioni deviate tra Linate (LIN) e Malpensa (MXP)
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              id="open-new-routing-error-btn"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Nuovo Errore</span>
            </button>

            <button
              id="export-routing-errors-csv-btn"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer"
              title="Esporta in formato Excel CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Esporta CSV</span>
            </button>

            <button
              id="copy-formal-report-btn"
              onClick={handleCopyReportText}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer"
              title="Copia riepilogo formale per contestazione"
            >
              <Copy className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Copia Report</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('list')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'list'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Storico & Tabella Errori ({filteredErrors.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'dashboard'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard & Analisi Trend</span>
          </button>

          <button
            onClick={() => setActiveSubTab('report')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'report'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Report Formale Contestazione</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards (Always fast to read) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Errors */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Totale Anomalie</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-sans">
              {kpis.totaleErrori}
            </div>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              Registrate nello storico
            </p>
          </div>
        </div>

        {/* Card 2: Total Shipments */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Spedizioni Coinvolte</span>
            <Truck className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-blue-600 font-sans">
              {kpis.totaleSpedizioni} <span className="text-xs font-bold text-slate-600 font-normal">colli</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              Deviate o recapitate errate
            </p>
          </div>
        </div>

        {/* Card 3: LIN -> MXP */}
        <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/50 p-4 rounded-2xl border border-blue-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-900 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <span>LIN</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
              <span>MXP</span>
            </span>
            <span className="text-xs font-black bg-blue-600 text-white px-2 py-0.5 rounded-full">
              {kpis.percLinToMxp}%
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-blue-950 font-sans">
              {kpis.erroriLinToMxp} <span className="text-xs font-bold text-slate-600">err.</span>
            </div>
            <p className="text-[11px] font-semibold text-blue-800 mt-0.5">
              {kpis.spedizioniLinToMxp} colli corretti LIN inviati a MXP
            </p>
          </div>
        </div>

        {/* Card 4: MXP -> LIN */}
        <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/50 p-4 rounded-2xl border border-amber-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-950 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <span>MXP</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
              <span>LIN</span>
            </span>
            <span className="text-xs font-black bg-amber-600 text-white px-2 py-0.5 rounded-full">
              {kpis.percMxpToLin}%
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-amber-950 font-sans">
              {kpis.erroriMxpToLin} <span className="text-xs font-bold text-slate-600">err.</span>
            </div>
            <p className="text-[11px] font-semibold text-amber-800 mt-0.5">
              {kpis.spedizioniMxpToLin} colli corretti MXP inviati a LIN
            </p>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cerca per linea, dispaccio, LDV o note..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Direction Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setDirectionFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  directionFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tutti ({routingErrors.length})
              </button>
              <button
                onClick={() => setDirectionFilter('LIN_TO_MXP')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  directionFilter === 'LIN_TO_MXP'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-blue-700 hover:text-blue-900'
                }`}
              >
                <span>LIN</span>
                <ArrowRight className="w-3 h-3" />
                <span>MXP</span>
              </button>
              <button
                onClick={() => setDirectionFilter('MXP_TO_LIN')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  directionFilter === 'MXP_TO_LIN'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-amber-800 hover:text-amber-950'
                }`}
              >
                <span>MXP</span>
                <ArrowRight className="w-3 h-3" />
                <span>LIN</span>
              </button>
            </div>

            {/* Line Dropdown */}
            {existingLines.length > 0 && (
              <select
                value={selectedLineFilter}
                onChange={e => setSelectedLineFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="ALL">Tutte le Linee ({existingLines.length})</option>
                {existingLines.map(line => (
                  <option key={line} value={line}>
                    {line}
                  </option>
                ))}
              </select>
            )}

            {/* Period Dropdown */}
            <select
              value={periodFilter}
              onChange={e => setPeriodFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="ALL">Tutti i Periodi</option>
              <option value="TODAY">Oggi</option>
              <option value="YESTERDAY">Ieri</option>
              <option value="WEEK">Ultimi 7 giorni</option>
              <option value="MONTH">Mese Corrente</option>
              <option value="CUSTOM">Data Personalizzata...</option>
            </select>

            {/* Reset Filter button */}
            {(searchQuery || directionFilter !== 'ALL' || periodFilter !== 'ALL' || selectedLineFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDirectionFilter('ALL');
                  setPeriodFilter('ALL');
                  setSelectedLineFilter('ALL');
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold border border-rose-200 flex items-center gap-1 cursor-pointer"
                title="Azzera filtri"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Range Row */}
        {periodFilter === 'CUSTOM' && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="font-semibold text-slate-600">Intervallo:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
            <span>fino a</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        )}
      </div>

      {/* SUB-VIEW 1: STORICO & LISTA TABELLARE */}
      {activeSubTab === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {filteredErrors.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Plane className="w-8 h-8 opacity-40" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Nessun errore di instradamento trovato</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                Non ci sono anomalie corrispondenti ai filtri attuali, oppure puoi registrarne una nuova tramite il pulsante in alto.
              </p>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Registra Primo Errore</span>
              </button>
            </div>
          ) : (
            <div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Data & Ora</th>
                      <th className="py-3 px-4">Linea</th>
                      <th className="py-3 px-4">Dispaccio</th>
                      <th className="py-3 px-4">Instradamento Anomalo</th>
                      <th className="py-3 px-4 text-center">N. Spedizioni</th>
                      <th className="py-3 px-4">LDV / Tracking</th>
                      <th className="py-3 px-4">Note</th>
                      <th className="py-3 px-4 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredErrors.map(err => {
                      const isLinToMxp = err.destinazioneCorretta === 'LIN';
                      return (
                        <tr key={err.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Data & Ora */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-bold text-slate-900">{err.data}</div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {err.ora}
                            </div>
                          </td>

                          {/* Linea */}
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            <div className="flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{err.linea}</span>
                            </div>
                          </td>

                          {/* Dispaccio */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            <span className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200">
                              {err.dispaccio}
                            </span>
                          </td>

                          {/* Instradamento Badge */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {isLinToMxp ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
                                  <span className="bg-emerald-600 text-white text-[10px] px-1 rounded font-black">
                                    LIN
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-blue-600" />
                                  <span className="bg-rose-600 text-white text-[10px] px-1 rounded font-black">
                                    MXP
                                  </span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300">
                                  <span className="bg-emerald-600 text-white text-[10px] px-1 rounded font-black">
                                    MXP
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-amber-600" />
                                  <span className="bg-rose-600 text-white text-[10px] px-1 rounded font-black">
                                    LIN
                                  </span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Numero Spedizioni */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 font-black text-xs rounded-full bg-slate-900 text-white">
                              {err.numeroSpedizioni}
                            </span>
                          </td>

                          {/* LDV / Tracking */}
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700 max-w-[160px] truncate">
                            {err.numeroLdv ? (
                              <div className="flex items-center gap-1.5">
                                <span className="truncate" title={err.numeroLdv}>
                                  {err.numeroLdv}
                                </span>
                                <button
                                  onClick={() => handleCopyLdv(err.numeroLdv!, err.id)}
                                  className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                                  title="Copia LDV"
                                >
                                  {copiedLdvId === err.id ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">-</span>
                            )}
                          </td>

                          {/* Note */}
                          <td className="py-3.5 px-4 text-slate-600 max-w-[200px] truncate">
                            {err.note ? (
                              <span title={err.note}>{err.note}</span>
                            ) : (
                              <span className="text-slate-400 italic">-</span>
                            )}
                          </td>

                          {/* Azioni */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleDuplicate(err.id)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Duplica Errore"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(err)}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Modifica"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Sei sicuro di voler eliminare l'errore sul dispaccio ${err.dispaccio}?`)) {
                                    deleteRoutingError(err.id);
                                    showToast(`Errore ${err.dispaccio} eliminato`);
                                  }
                                }}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Elimina"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredErrors.map(err => {
                  const isLinToMxp = err.destinazioneCorretta === 'LIN';
                  return (
                    <div key={err.id} className="p-4 space-y-3">
                      {/* Top line: Dispaccio & Direction */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-slate-900">
                            {err.dispaccio}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {err.data} • {err.ora}
                          </span>
                        </div>

                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 font-black text-xs rounded-full bg-slate-900 text-white">
                          {err.numeroSpedizioni} {err.numeroSpedizioni === 1 ? 'collo' : 'colli'}
                        </span>
                      </div>

                      {/* Direction and Line */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{err.linea}</span>
                        </div>

                        {isLinToMxp ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
                            <span>Corretta LIN</span>
                            <ArrowRight className="w-3 h-3" />
                            <span className="text-rose-600 font-black">Errata MXP</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300">
                            <span>Corretta MXP</span>
                            <ArrowRight className="w-3 h-3" />
                            <span className="text-rose-600 font-black">Errata LIN</span>
                          </span>
                        )}
                      </div>

                      {/* LDV & Note */}
                      {(err.numeroLdv || err.note) && (
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                          {err.numeroLdv && (
                            <div className="font-mono text-[11px] text-slate-700 flex items-center justify-between">
                              <span>LDV: {err.numeroLdv}</span>
                              <button
                                onClick={() => handleCopyLdv(err.numeroLdv!, err.id)}
                                className="text-blue-600 font-sans text-[11px] font-bold"
                              >
                                Copia
                              </button>
                            </div>
                          )}
                          {err.note && <div className="text-slate-600">{err.note}</div>}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50">
                        <button
                          onClick={() => handleDuplicate(err.id)}
                          className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                        >
                          Duplica
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(err)}
                          className="px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 rounded-lg border border-amber-200 hover:bg-amber-100"
                        >
                          Modifica
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Eliminare errore ${err.dispaccio}?`)) {
                              deleteRoutingError(err.id);
                              showToast(`Eliminato ${err.dispaccio}`);
                            }
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 rounded-lg border border-rose-200 hover:bg-rose-100"
                        >
                          Elimina
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: DASHBOARD & GRAFICI ANALITICI */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-4">
          {/* Insights Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Critical Line */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Linea con maggior numero di errori
                </span>
                <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  {kpis.topLinea ? kpis.topLinea.linea : 'Nessun dato registrato'}
                </div>
                {kpis.topLinea && (
                  <p className="text-xs text-rose-600 font-semibold mt-0.5">
                    {kpis.topLinea.count} errori totali &bull; {kpis.topLinea.spedizioni} spedizioni coinvolte
                  </p>
                )}
              </div>
            </div>

            {/* Peak Error Date */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Giorno di picco disservizi
                </span>
                <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  {kpis.topDate ? kpis.topDate.data : 'Nessun dato registrato'}
                </div>
                {kpis.topDate && (
                  <p className="text-xs text-amber-700 font-semibold mt-0.5">
                    {kpis.topDate.count} errori in un solo giorno &bull; {kpis.topDate.spedizioni} colli
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chart 1: Andamento Temporale (2 cols on large) */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Andamento Errori di Instradamento nel Tempo
                  </h3>
                  <p className="text-xs text-slate-500">Distribuzione giornaliera per direzione LIN vs MXP</p>
                </div>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>

              <div className="h-64 sm:h-72 w-full">
                {timelineChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Dati insufficienti per il grafico temporale
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="data" tick={{ fontSize: 11 }} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          backgroundColor: '#0f172a',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="linToMxp" name="LIN ➔ inviata a MXP" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="mxpToLin" name="MXP ➔ inviata a LIN" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 2: Percentuale Direzioni (Donut Pie) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">Percentuale per Direzione</h3>
                  <Plane className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-xs text-slate-500 mb-2">Ripartizione delle spedizioni deviate</p>
              </div>

              <div className="h-52 w-full flex items-center justify-center">
                {directionPieData.length === 0 ? (
                  <div className="text-xs text-slate-400">Nessun dato</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={directionPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {directionPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '10px',
                          backgroundColor: '#0f172a',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '11px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Legend with percentages */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="font-medium text-slate-700">LIN ➔ inviata MXP</span>
                  </div>
                  <span className="font-bold text-slate-900">{kpis.percLinToMxp}% ({kpis.erroriLinToMxp})</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="font-medium text-slate-700">MXP ➔ inviata LIN</span>
                  </div>
                  <span className="font-bold text-slate-900">{kpis.percMxpToLin}% ({kpis.erroriMxpToLin})</span>
                </div>
              </div>
            </div>

            {/* Chart 3: Top Linee con Errori */}
            <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Classifica Linee con Maggior Frequenza di Errori
                  </h3>
                  <p className="text-xs text-slate-500">Ripartizione anomalie e volumi di spedizioni per linea</p>
                </div>
                <Truck className="w-4 h-4 text-slate-400" />
              </div>

              <div className="h-60 w-full">
                {linesChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Nessuna linea registrata
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={linesChartData} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} />
                      <YAxis dataKey="linea" type="category" tick={{ fontSize: 11 }} tickLine={false} width={130} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          backgroundColor: '#0f172a',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                      <Bar dataKey="errori" name="Numero Anomalie" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="spedizioni" name="Spedizioni Coinvolte" fill="#64748b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: REPORT FORMALE CONTESTAZIONE & STAMPA */}
      {activeSubTab === 'report' && (
        <div className="space-y-4">
          {/* Printable Container */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-300 shadow-md print:shadow-none print:border-none">
            {/* Header Document */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b-2 border-slate-900 gap-4">
              <div>
                <div className="text-xs uppercase tracking-widest font-black text-slate-500">
                  Documento Ufficiale di Rilevazione Disservizi
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                  Prospetto Errori di Instradamento Spedizioni LIN / MXP
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Hub Operativo: <span className="font-bold">{settings.nomeHub}</span> ({settings.codiceHub})
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded-lg font-mono">
                  {new Date().toLocaleDateString('it-IT')}
                </span>
                <div className="text-[11px] text-slate-500 mt-1">
                  Generato il: {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            {/* Executive Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Totale Disservizi</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{kpis.totaleErrori}</div>
                <p className="text-[11px] text-slate-500">Eventi di instradamento errato</p>
              </div>

              <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200">
                <span className="text-[11px] font-bold text-blue-900 uppercase">Totale Colli / Spedizioni</span>
                <div className="text-2xl font-black text-blue-900 mt-1">{kpis.totaleSpedizioni}</div>
                <p className="text-[11px] text-blue-700">Pezzi deviati verso aeroporto non conforme</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Ripartizione Flussi</span>
                <div className="text-xs font-bold text-slate-800 mt-1.5 space-y-1">
                  <div>LIN ➔ MXP: <span className="font-black text-blue-700">{kpis.erroriLinToMxp} err. ({kpis.percLinToMxp}%)</span></div>
                  <div>MXP ➔ LIN: <span className="font-black text-amber-700">{kpis.erroriMxpToLin} err. ({kpis.percMxpToLin}%)</span></div>
                </div>
              </div>
            </div>

            {/* Detailed Table for formal dispute */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold text-[11px] uppercase">
                    <th className="py-2.5 px-3 border border-slate-700">#</th>
                    <th className="py-2.5 px-3 border border-slate-700">Data & Ora</th>
                    <th className="py-2.5 px-3 border border-slate-700">Linea</th>
                    <th className="py-2.5 px-3 border border-slate-700">Dispaccio</th>
                    <th className="py-2.5 px-3 border border-slate-700">Dest. Corretta</th>
                    <th className="py-2.5 px-3 border border-slate-700">Inviata a (Errata)</th>
                    <th className="py-2.5 px-3 border border-slate-700 text-center">Sped.</th>
                    <th className="py-2.5 px-3 border border-slate-700">Rif. LDV / Tracking</th>
                    <th className="py-2.5 px-3 border border-slate-700">Note & Descrizione</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredErrors.map((e, idx) => (
                    <tr key={e.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="py-2 px-3 border border-slate-200 font-mono font-bold">{idx + 1}</td>
                      <td className="py-2 px-3 border border-slate-200 whitespace-nowrap">{e.data} {e.ora}</td>
                      <td className="py-2 px-3 border border-slate-200 font-bold">{e.linea}</td>
                      <td className="py-2 px-3 border border-slate-200 font-mono font-bold">{e.dispaccio}</td>
                      <td className="py-2 px-3 border border-slate-200 font-black text-emerald-700">{e.destinazioneCorretta}</td>
                      <td className="py-2 px-3 border border-slate-200 font-black text-rose-700">{e.destinazioneErrata}</td>
                      <td className="py-2 px-3 border border-slate-200 text-center font-bold">{e.numeroSpedizioni}</td>
                      <td className="py-2 px-3 border border-slate-200 font-mono text-[11px]">{e.numeroLdv || '-'}</td>
                      <td className="py-2 px-3 border border-slate-200 text-slate-700">{e.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Document Footer Notes */}
            <div className="mt-8 pt-4 border-t border-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 gap-2">
              <div>
                Rapporto generato ai fini del controllo qualità e contestazione formale delle non-conformità di routing.
              </div>
              <div className="font-semibold text-slate-700">
                Firma Responsabile Reparto: ___________________________
              </div>
            </div>
          </div>

          {/* Action Bar for Report */}
          <div className="flex flex-wrap items-center justify-end gap-3 print:hidden">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Stampa Prospetto (PDF)</span>
            </button>
            <button
              onClick={handleCopyReportText}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              <Copy className="w-4 h-4" />
              <span>Copia Testo per Email</span>
            </button>
          </div>
        </div>
      )}

      {/* QUICK ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Plane className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingErrorId ? 'Modifica Errore di Instradamento' : 'Registra Nuovo Errore'}
                  </h3>
                  <p className="text-xs text-slate-500">Modulo rapido per turno operativo</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveError} className="mt-4 space-y-4">
              {/* DIRECTION TOGGLE (LIN / MXP) */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Direzione Anomalia (Seleziona aeroporto corretto):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleAirport('LIN')}
                    className={`py-3 px-3 rounded-xl border-2 font-bold text-xs sm:text-sm flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      formData.destinazioneCorretta === 'LIN'
                        ? 'bg-blue-50 border-blue-600 text-blue-950 ring-2 ring-blue-500/20 shadow-xs scale-101'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black text-sm">
                      <span className="text-emerald-700">LIN</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-rose-600">MXP</span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">
                      Corretta LIN ➔ Inviata a MXP
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleAirport('MXP')}
                    className={`py-3 px-3 rounded-xl border-2 font-bold text-xs sm:text-sm flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      formData.destinazioneCorretta === 'MXP'
                        ? 'bg-amber-50 border-amber-600 text-amber-950 ring-2 ring-amber-500/20 shadow-xs scale-101'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black text-sm">
                      <span className="text-emerald-700">MXP</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-rose-600">LIN</span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">
                      Corretta MXP ➔ Inviata a LIN
                    </span>
                  </button>
                </div>
              </div>

              {/* Linea & Dispaccio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Linea *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.linea}
                    onChange={e => setFormData({ ...formData, linea: e.target.value })}
                    placeholder="Es: Linea Notte Hub, Navetta 02..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {/* Quick line suggestions */}
                  {existingLines.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {existingLines.slice(0, 3).map(line => (
                        <button
                          key={line}
                          type="button"
                          onClick={() => setFormData({ ...formData, linea: line })}
                          className="text-[10px] bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 cursor-pointer"
                        >
                          {line}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Numero Dispaccio *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.dispaccio}
                    onChange={e => setFormData({ ...formData, dispaccio: e.target.value.toUpperCase() })}
                    placeholder="Es: DSP-94210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 uppercase focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Data, Ora & Numero Spedizioni */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.data}
                    onChange={e => setFormData({ ...formData, data: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ora Rilevazione
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.ora}
                    onChange={e => setFormData({ ...formData, ora: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    N. Spedizioni
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.numeroSpedizioni}
                      onChange={e => setFormData({ ...formData, numeroSpedizioni: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:bg-white text-center"
                    />
                  </div>
                </div>
              </div>

              {/* LDV / Tracking */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Eventuale Numero LDV / Spedizione (Opzionale)
                </label>
                <input
                  type="text"
                  value={formData.numeroLdv}
                  onChange={e => setFormData({ ...formData, numeroLdv: e.target.value })}
                  placeholder="Es: LDV-99214412, 048-88219..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Note & Dettagli Anomalie
                </label>
                <textarea
                  rows={2}
                  value={formData.note}
                  onChange={e => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Dettagli: Pallet caricato su bilico errato, ritardo volo, mancata etichettatura..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  {editingErrorId ? 'Salva Modifiche' : 'Registra Errore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
