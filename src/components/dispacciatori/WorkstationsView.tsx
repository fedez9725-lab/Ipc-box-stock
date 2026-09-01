import React, { useState, useMemo } from 'react';
import {
  Monitor,
  Mouse,
  Keyboard,
  ScanLine,
  Printer,
  FileText,
  Wifi,
  Globe2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  UserCheck,
  Clock,
  Layers,
  MapPin,
  ChevronRight,
  Sparkles,
  FileSpreadsheet,
  Download,
  Info,
  SlidersHorizontal,
  LayoutGrid,
  Map,
  History,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Sun,
  Moon,
  Tag,
  Check,
  Activity,
  Zap,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import {
  Workstation,
  WorkstationHardware,
  HardwareStatus,
  WorkstationLog,
} from '../../types';

// Helper component health score & status calculator
export const getWorkstationHealth = (ws: Workstation): {
  status: 'OPERATIVA' | 'ATTENZIONE' | 'FUORI_SERVIZIO';
  brokenCount: number;
  problemCount: number;
  totalOk: number;
  brokenList: { key: keyof WorkstationHardware; label: string; detail?: string; status: HardwareStatus }[];
} => {
  const compLabels: Record<keyof WorkstationHardware, string> = {
    pcMonitor: 'Computer / Monitor',
    mouse: 'Mouse',
    tastiera: 'Tastiera',
    pistola: 'Pistola Scanner',
    stampanteTermica: 'Stampante Termica',
    stampanteDocumenti: 'Stampante Documenti',
    internet: 'Internet / Rete',
    ilp: 'Piattaforma ILP',
  };

  let brokenCount = 0;
  let totalOk = 0;
  const brokenList: { key: keyof WorkstationHardware; label: string; detail?: string; status: HardwareStatus }[] = [];

  const keys = Object.keys(ws.hardware) as (keyof WorkstationHardware)[];
  keys.forEach(k => {
    const item = ws.hardware[k];
    if (!item) return;
    if (item.status !== 'OK') {
      brokenCount++;
      brokenList.push({ key: k, label: compLabels[k], detail: '', status: 'GUASTO' });
    } else {
      totalOk++;
    }
  });

  let status: 'OPERATIVA' | 'ATTENZIONE' | 'FUORI_SERVIZIO' = 'OPERATIVA';
  if (brokenCount >= 2) {
    status = 'FUORI_SERVIZIO';
  } else if (brokenCount > 0) {
    status = 'ATTENZIONE';
  }

  return { status, brokenCount, problemCount: 0, totalOk, brokenList };
};

export type WorkstationColorKey = 'BLU' | 'GIALLO' | 'VERDE';

export interface WorkstationColorPreset {
  id: WorkstationColorKey;
  label: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  cardBg: string;
  cardBorder: string;
  cardCodeText: string;
  cardSubText: string;
  cardHover: string;
  dotColor: string;
}

export const WORKSTATION_COLOR_PRESETS: WorkstationColorPreset[] = [
  {
    id: 'BLU',
    label: 'Blu',
    badgeBg: 'bg-blue-100',
    badgeBorder: 'border-blue-300',
    badgeText: 'text-blue-950',
    cardBg: 'bg-[#dbeafe]',
    cardBorder: 'border-[#3b82f6]',
    cardCodeText: 'text-[#1e293b]',
    cardSubText: 'text-[#475569]',
    cardHover: 'hover:border-[#2563eb]',
    dotColor: 'bg-blue-500',
  },
  {
    id: 'GIALLO',
    label: 'Giallo',
    badgeBg: 'bg-amber-100',
    badgeBorder: 'border-amber-300',
    badgeText: 'text-amber-950',
    cardBg: 'bg-[#fef08a]',
    cardBorder: 'border-[#eab308]',
    cardCodeText: 'text-[#1e293b]',
    cardSubText: 'text-[#475569]',
    cardHover: 'hover:border-[#ca8a04]',
    dotColor: 'bg-amber-500',
  },
  {
    id: 'VERDE',
    label: 'Verde',
    badgeBg: 'bg-emerald-100',
    badgeBorder: 'border-emerald-300',
    badgeText: 'text-emerald-950',
    cardBg: 'bg-[#dcfce7]',
    cardBorder: 'border-[#22c55e]',
    cardCodeText: 'text-[#1e293b]',
    cardSubText: 'text-[#475569]',
    cardHover: 'hover:border-[#16a34a]',
    dotColor: 'bg-emerald-500',
  },
];

export const getWorkstationColorTheme = (ws: {
  coloreTema?: string;
  assegnazione?: string;
  codice?: string;
}): WorkstationColorPreset => {
  // Direct user choice with clean fallback to BLU:
  if (ws.coloreTema) {
    const found = WORKSTATION_COLOR_PRESETS.find(p => p.id === ws.coloreTema);
    if (found) return found;
  }
  return WORKSTATION_COLOR_PRESETS[0]; // Default: BLU
};

export const WorkstationsView: React.FC = () => {
  const {
    workstations,
    workstationLogs,
    updateWorkstationComponent,
    updateWorkstation,
    quickAuditWorkstation,
    resetAllWorkstationsToOk,
    addWorkstation,
    deleteWorkstation,
    activeOperator,
    settings,
  } = useStock();

  // View mode
  const [viewMode, setViewMode] = useState<'map' | 'cards' | 'logs'>('map');
  const [mapTheme, setMapTheme] = useState<'blueprint' | 'dark'>('blueprint');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [bancoFilter, setBancoFilter] = useState<'ALL' | 'LATO_A' | 'LATO_B' | 'LATO_C' | 'LATO_D'>('ALL');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLY_PROBLEMS' | 'ONLY_OK'>('ALL');
  const [componentFilter, setComponentFilter] = useState<string>('ALL');

  // Active inspected workstation drawer/modal
  const [selectedWsId, setSelectedWsId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string>('');
  const [editingOperator, setEditingOperator] = useState<string>('');
  const [editingAssignment, setEditingAssignment] = useState<string>('');
  const [editingColor, setEditingColor] = useState<WorkstationColorKey>('BLU');

  // Modals
  const [showResetAllModal, setShowResetAllModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWsCode, setNewWsCode] = useState('');
  const [newWsName, setNewWsName] = useState('');
  const [newWsOperator, setNewWsOperator] = useState('');
  const [newWsBanco, setNewWsBanco] = useState<'LATO_A' | 'LATO_B' | 'LATO_C' | 'LATO_D'>('LATO_A');
  const [newWsAssignment, setNewWsAssignment] = useState('Libera');
  const [newWsColor, setNewWsColor] = useState<WorkstationColorKey>('BLU');

  // Clear all operators function
  const handleClearAllOperators = () => {
    if (confirm('Vuoi rimuovere tutti i nomi degli operatori assegnati a tutte le postazioni?')) {
      workstations.forEach(ws => {
        if (ws.operatore) {
          updateWorkstation(ws.id, { operatore: '' });
        }
      });
      showToast('Tutti i nomi degli operatori sono stati azzerati');
    }
  };

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const selectedWorkstation = useMemo(() => {
    return workstations.find(w => w.id === selectedWsId) || null;
  }, [workstations, selectedWsId]);

  // Open drawer
  const handleOpenInspect = (ws: Workstation) => {
    setSelectedWsId(ws.id);
    setEditingNotes(ws.note || '');
    setEditingOperator(ws.operatore || '');
    setEditingAssignment(ws.assegnazione || 'Libera');
    const colorTheme = getWorkstationColorTheme(ws);
    setEditingColor(ws.coloreTema || colorTheme.id);
  };

  // KPIs
  const stats = useMemo(() => {
    let ok = 0;
    let warning = 0;
    let error = 0;

    let pcFail = 0;
    let mouseFail = 0;
    let keyboardFail = 0;
    let scannerFail = 0;
    let thermalFail = 0;
    let docPrinterFail = 0;
    let netFail = 0;
    let ilpFail = 0;

    workstations.forEach(ws => {
      const health = getWorkstationHealth(ws);
      if (health.status === 'OPERATIVA') ok++;
      else if (health.status === 'ATTENZIONE') warning++;
      else error++;

      if (ws.hardware.pcMonitor?.status !== 'OK') pcFail++;
      if (ws.hardware.mouse?.status !== 'OK') mouseFail++;
      if (ws.hardware.tastiera?.status !== 'OK') keyboardFail++;
      if (ws.hardware.pistola?.status !== 'OK') scannerFail++;
      if (ws.hardware.stampanteTermica?.status !== 'OK') thermalFail++;
      if (ws.hardware.stampanteDocumenti?.status !== 'OK') docPrinterFail++;
      if (ws.hardware.internet?.status !== 'OK') netFail++;
      if (ws.hardware.ilp?.status !== 'OK') ilpFail++;
    });

    return {
      total: workstations.length,
      ok,
      warning,
      error,
      pcFail,
      mouseFail,
      keyboardFail,
      scannerFail,
      thermalFail,
      docPrinterFail,
      netFail,
      ilpFail,
    };
  }, [workstations]);

  // Unique assignments for filtering
  const availableAssignments = useMemo(() => {
    const set = new Set<string>();
    workstations.forEach(w => {
      if (w.assegnazione) set.add(w.assegnazione);
    });
    return Array.from(set);
  }, [workstations]);

  // Filtered workstations
  const filteredWorkstations = useMemo(() => {
    return workstations.filter(ws => {
      // Search
      const matchSearch =
        ws.codice.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ws.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ws.assegnazione && ws.assegnazione.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ws.operatore && ws.operatore.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ws.note && ws.note.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      // Banco filter
      if (bancoFilter !== 'ALL') {
        const isLatoA = bancoFilter === 'LATO_A' && (ws.bancoId === 'LATO_A' || ws.bancoId === 'ORIZZONTALE_NORD');
        const isLatoB = bancoFilter === 'LATO_B' && (ws.bancoId === 'LATO_B' || ws.bancoId === 'ORIZZONTALE_SUD');
        const isLatoC = bancoFilter === 'LATO_C' && (ws.bancoId === 'LATO_C' || ws.bancoId === 'VERTICALE_EST_1');
        const isLatoD = bancoFilter === 'LATO_D' && (ws.bancoId === 'LATO_D' || ws.bancoId === 'VERTICALE_EST_2');
        if (!isLatoA && !isLatoB && !isLatoC && !isLatoD) return false;
      }

      // Assignment filter
      if (assignmentFilter !== 'ALL' && ws.assegnazione !== assignmentFilter) {
        return false;
      }

      // Status filter
      const health = getWorkstationHealth(ws);
      if (statusFilter === 'ONLY_PROBLEMS' && health.status === 'OPERATIVA') return false;
      if (statusFilter === 'ONLY_OK' && health.status !== 'OPERATIVA') return false;

      // Component filter
      if (componentFilter !== 'ALL') {
        const compKey = componentFilter as keyof WorkstationHardware;
        if (ws.hardware[compKey]?.status === 'OK') return false;
      }

      return true;
    });
  }, [workstations, searchTerm, bancoFilter, assignmentFilter, statusFilter, componentFilter]);

  // Grouped for exact planimetric benches matching the uploaded scheme
  const benches = useMemo(() => {
    const isMatching = (ws: Workstation, bank: 'LATO_A' | 'LATO_B' | 'LATO_C' | 'LATO_D') => {
      if (bank === 'LATO_A') return ws.bancoId === 'LATO_A' || ws.bancoId === 'ORIZZONTALE_NORD' || ws.codice.startsWith('A');
      if (bank === 'LATO_B') return ws.bancoId === 'LATO_B' || ws.bancoId === 'ORIZZONTALE_SUD' || ws.codice.startsWith('B');
      if (bank === 'LATO_C') return ws.bancoId === 'LATO_C' || ws.bancoId === 'VERTICALE_EST_1' || ws.codice.startsWith('C');
      if (bank === 'LATO_D') return ws.bancoId === 'LATO_D' || ws.bancoId === 'VERTICALE_EST_2' || ws.codice.startsWith('D');
      return false;
    };

    return {
      latoA: workstations.filter(w => isMatching(w, 'LATO_A')).sort((a, b) => a.posizione - b.posizione),
      latoB: workstations.filter(w => isMatching(w, 'LATO_B')).sort((a, b) => a.posizione - b.posizione),
      latoC: workstations.filter(w => isMatching(w, 'LATO_C')).sort((a, b) => a.posizione - b.posizione),
      latoD: workstations.filter(w => isMatching(w, 'LATO_D')).sort((a, b) => a.posizione - b.posizione),
    };
  }, [workstations]);

  // Component definition for rendering
  const componentConfig: {
    key: keyof WorkstationHardware;
    name: string;
    icon: React.ElementType;
    description: string;
  }[] = [
    {
      key: 'pcMonitor',
      name: 'Computer / Monitor',
      icon: Monitor,
      description: 'PC fisso e schermo operativi',
    },
    {
      key: 'pistola',
      name: 'Pistola Scanner Barcode',
      icon: ScanLine,
      description: 'Lettore barcode laser per scansione colli',
    },
    {
      key: 'stampanteTermica',
      name: 'Stampante Termica (Etichette/LDV)',
      icon: Printer,
      description: 'Stampa etichette e adesivi barcode',
    },
    {
      key: 'stampanteDocumenti',
      name: 'Stampante Documenti (Bolle A4)',
      icon: FileText,
      description: 'Stampa bolle doganali e fogli A4',
    },
    {
      key: 'mouse',
      name: 'Mouse',
      icon: Mouse,
      description: 'Mouse ottico di puntamento',
    },
    {
      key: 'tastiera',
      name: 'Tastiera',
      icon: Keyboard,
      description: 'Tastiera di immissione dati',
    },
    {
      key: 'internet',
      name: 'Rete / Connessione Internet',
      icon: Wifi,
      description: 'Cavo di rete LAN o segnale Wi-Fi',
    },
    {
      key: 'ilp',
      name: 'Sistema / Piattaforma ILP',
      icon: Globe2,
      description: 'Piattaforma software dispacci',
    },
  ];

  // Export fault list for Maintenance
  const handleExportFaultReport = () => {
    const brokenRows: string[] = ['Codice Postazione;Nome Postazione;Banco;Assegnazione;Operatore;Componente;Stato;Dettaglio Anomalia;Ultimo Controllo'];

    workstations.forEach(ws => {
      const health = getWorkstationHealth(ws);
      health.brokenList.forEach(item => {
        brokenRows.push(
          `"${ws.codice}";"${ws.nome}";"${ws.bancoNome}";"${ws.assegnazione || 'Libera'}";"${ws.operatore || 'N/A'}";"${item.label}";"${item.status}";"${item.detail || ''}";"${ws.ultimoControllo}"`
        );
      });
    });

    if (brokenRows.length === 1) {
      showToast('Nessun guasto registrato al momento: tutte le postazioni sono al 100%');
      return;
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(brokenRows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `Report_Guasti_Postazioni_Dispacciatori_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report guasti IT scaricato con successo');
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/30">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Mappa Postazioni Dispacciatori Live
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  {workstations.length} Postazioni (14 Schema Ufficiale)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Planimetria interattiva con assegnazioni Nazioni/Progetti, controllo hardware in tempo reale e registro guasti
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowResetAllModal(true)}
            className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Segna tutte le postazioni come 100% funzionanti ad inizio turno"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Tutto OK Inizio Turno
          </button>

          <button
            onClick={handleClearAllOperators}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-slate-300 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Azzera tutti i nomi degli operatori assegnati su tutte le postazioni"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-600" />
            Svuota Operatori
          </button>

          <button
            onClick={handleExportFaultReport}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Esporta foglio Excel / CSV per manutenzione IT"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Report Guasti IT
          </button>

          <button
            onClick={() => {
              setNewWsCode(`P${String(workstations.length + 1).padStart(2, '0')}`);
              setNewWsName(`Postazione Dispacci ${String(workstations.length + 1).padStart(2, '0')}`);
              setNewWsAssignment('Libera');
              setNewWsOperator('');
              setShowAddModal(true);
            }}
            className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Aggiungi Postazione
          </button>
        </div>
      </div>

      {/* 2. STATS & STATUS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Totale Postazioni
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Disposte su 4 Lati (A, B, C, D)</div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <LayoutGrid className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
              100% Operative
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{stats.ok}</div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Tutti i componenti OK</div>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
              Con Anomalie Minori
            </span>
            <div className="text-2xl font-black text-amber-800 mt-1">{stats.warning}</div>
            <div className="text-[10px] text-amber-700 font-medium mt-0.5">Richiedono controllo</div>
          </div>
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl border border-amber-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider block">
              Fuori Servizio / Bloccanti
            </span>
            <div className="text-2xl font-black text-rose-800 mt-1">{stats.error}</div>
            <div className="text-[10px] text-rose-600 font-medium mt-0.5">PC / Scanner / ILP fermi</div>
          </div>
          <div className="p-3 bg-rose-100 text-rose-700 rounded-xl border border-rose-200">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* QUICK HARDWARE HEALTH METERS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Stato Componenti Hardware e Servizi su Tutte le Postazioni
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Fai clic su qualsiasi postazione nella mappa per testare o segnalare un guasto
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            { label: 'PC / Monitor', fail: stats.pcFail, icon: Monitor },
            { label: 'Pistole Laser', fail: stats.scannerFail, icon: ScanLine },
            { label: 'Stampanti Term.', fail: stats.thermalFail, icon: Printer },
            { label: 'Stampanti Doc.', fail: stats.docPrinterFail, icon: FileText },
            { label: 'Mouse', fail: stats.mouseFail, icon: Mouse },
            { label: 'Tastiere', fail: stats.keyboardFail, icon: Keyboard },
            { label: 'Rete / Internet', fail: stats.netFail, icon: Wifi },
            { label: 'Sistema ILP', fail: stats.ilpFail, icon: Globe2 },
          ].map((item, idx) => {
            const Icon = item.icon;
            const isAllOk = item.fail === 0;
            return (
              <div
                key={idx}
                onClick={() => {
                  const keyMap: Record<string, string> = {
                    'PC / Monitor': 'pcMonitor',
                    'Pistole Laser': 'pistola',
                    'Stampanti Term.': 'stampanteTermica',
                    'Stampanti Doc.': 'stampanteDocumenti',
                    'Mouse': 'mouse',
                    'Tastiere': 'tastiera',
                    'Rete / Internet': 'internet',
                    'Sistema ILP': 'ilp',
                  };
                  const compKey = keyMap[item.label];
                  setComponentFilter(componentFilter === compKey ? 'ALL' : compKey);
                }}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  componentFilter ===
                  (item.label === 'PC / Monitor'
                    ? 'pcMonitor'
                    : item.label === 'Pistole Laser'
                    ? 'pistola'
                    : item.label === 'Stampanti Term.'
                    ? 'stampanteTermica'
                    : item.label === 'Stampanti Doc.'
                    ? 'stampanteDocumenti'
                    : item.label === 'Mouse'
                    ? 'mouse'
                    : item.label === 'Tastiere'
                    ? 'tastiera'
                    : item.label === 'Rete / Internet'
                    ? 'internet'
                    : 'ilp')
                    ? 'ring-2 ring-blue-500 bg-blue-50/50 border-blue-300'
                    : isAllOk
                    ? 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                    : 'bg-rose-50/50 border-rose-200 hover:bg-rose-100/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Icon className={`w-3.5 h-3.5 ${isAllOk ? 'text-slate-600' : 'text-rose-600'}`} />
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                      isAllOk ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {isAllOk ? 'OK' : `${item.fail} Guasti`}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-slate-800 truncate">{item.label}</div>
                <div className="text-[10px] text-slate-500">
                  {stats.total - item.fail}/{stats.total} attivi
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. TOOLBAR & VIEW CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search & Quick Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cerca nazione, operatore o postazione..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Assegnazione / Nazione Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">Linea:</span>
            <select
              value={assignmentFilter}
              onChange={e => setAssignmentFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
            >
              <option value="ALL">Tutte le Destinazioni</option>
              {availableAssignments.map(asg => (
                <option key={asg} value={asg}>
                  {asg}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">Banco:</span>
            <select
              value={bancoFilter}
              onChange={e => setBancoFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
            >
              <option value="ALL">Tutti i Lati (A, B, C, D)</option>
              <option value="LATO_A">Lato A (Orizzontale Superiore)</option>
              <option value="LATO_B">Lato B (Orizzontale Inferiore)</option>
              <option value="LATO_C">Lato C (Verticale)</option>
              <option value="LATO_D">Lato D (Verticale)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">Stato:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
            >
              <option value="ALL">Tutti gli stati</option>
              <option value="ONLY_PROBLEMS">Solo con Guasti / Anomalie</option>
              <option value="ONLY_OK">Solo 100% Operative</option>
            </select>
          </div>

          {(searchTerm || bancoFilter !== 'ALL' || assignmentFilter !== 'ALL' || statusFilter !== 'ALL' || componentFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setBancoFilter('ALL');
                setAssignmentFilter('ALL');
                setStatusFilter('ALL');
                setComponentFilter('ALL');
              }}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Azzera Filtri
            </button>
          )}
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'map' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            Mappa Live Schema
          </button>

          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'cards' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Vista Schede Banchi
          </button>

          <button
            onClick={() => setViewMode('logs')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'logs' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Storico Guasti ({workstationLogs.length})
          </button>
        </div>
      </div>

      {/* 4. MAIN INTERACTIVE VIEWS */}

      {/* VISTA A: MAPPA PLANIMETRICA UFFICIALE (FEDELMENTE CORRISPONDENTE AL LAYOUT PDF) */}
      {viewMode === 'map' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden transition-all">
          {/* Top Planimetric Blueprint Title Banner */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                <h3 className="text-base sm:text-lg font-black tracking-wider uppercase text-white font-mono">
                  SCHEMA PLANIMETRICO POSTAZIONI CON ASSEGNAZIONE
                </h3>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Layout Operativo: {workstations.length} Postazioni Totali (Assegnazione specifica Nazioni e Progetti)
              </p>
            </div>

            {/* Live Indicator Controls */}
            <div className="flex items-center gap-2">
              <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-slate-300 font-mono font-bold">LIVE TELEMETRIA ATTIVA</span>
              </div>
            </div>
          </div>

          {/* Planimetric Canvas Area */}
          <div className="p-4 sm:p-7 bg-slate-50/60">
            {/* Header label */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Mappa Grafica del Layout (Vista dall'alto)
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  &bull; Clicca su qualsiasi postazione per visualizzare dettagli hardware, operatore o modificare nazione
                </span>
              </div>

              {/* Legend of colors */}
              <div className="hidden lg:flex items-center gap-2 text-xs flex-wrap">
                <span className="flex items-center gap-1.5 font-semibold text-blue-900 bg-blue-100 px-2 py-0.5 rounded-md border border-blue-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                  Blu
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-amber-950 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  Giallo
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  Verde
                </span>
              </div>
            </div>

            {/* THE EXACT BLUEPRINT SCHEMATIC BOX (Dashed outer frame) */}
            <div className="border-2 border-dashed border-slate-300 rounded-3xl p-4 sm:p-7 bg-white shadow-inner relative">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* SINISTRA: LATO A (Orizzontale Superiore) + LATO B (Orizzontale Inferiore) */}
                <div className="lg:col-span-7 space-y-8">
                  
                  {/* --- LATO A (ORIZZONTALE SUPERIORE) --- */}
                  <div className="space-y-2">
                    <div className="text-center">
                      <span className="text-xs font-extrabold text-slate-800 tracking-wider uppercase">
                        LATO A (ORIZZONTALE SUPERIORE)
                      </span>
                    </div>

                    {/* Workbench Container Lato A */}
                    <div className="bg-slate-100/70 border-2 border-slate-400/90 rounded-2xl p-4 sm:p-5 shadow-xs">
                      <div className="grid grid-cols-3 gap-3 sm:gap-4">
                        {benches.latoA.map(ws => (
                          <PlanimetricCard
                            key={ws.id}
                            ws={ws}
                            isSelected={selectedWsId === ws.id}
                            onClick={() => handleOpenInspect(ws)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* --- LATO B (ORIZZONTALE INFERIORE) --- */}
                  <div className="space-y-2">
                    {/* Workbench Container Lato B */}
                    <div className="bg-slate-100/70 border-2 border-slate-400/90 rounded-2xl p-4 sm:p-5 shadow-xs">
                      <div className="grid grid-cols-3 gap-3 sm:gap-4">
                        {benches.latoB.map(ws => (
                          <PlanimetricCard
                            key={ws.id}
                            ws={ws}
                            isSelected={selectedWsId === ws.id}
                            onClick={() => handleOpenInspect(ws)}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="text-center pt-1">
                      <span className="text-xs font-extrabold text-slate-800 tracking-wider uppercase">
                        LATO B (ORIZZONTALE INFERIORE)
                      </span>
                    </div>
                  </div>
                </div>

                {/* DESTRA: LATO C (Verticale) + LATO D (Verticale) */}
                <div className="lg:col-span-5 grid grid-cols-2 gap-4 sm:gap-6">
                  
                  {/* --- LATO C --- */}
                  <div className="space-y-2">
                    <div className="text-center">
                      <span className="text-xs font-extrabold text-slate-800 tracking-wider uppercase">
                        LATO C
                      </span>
                    </div>

                    {/* Vertical Workbench Column Lato C */}
                    <div className="bg-slate-100/70 border-2 border-slate-400/90 rounded-2xl p-3 sm:p-4 shadow-xs space-y-3.5">
                      {benches.latoC.map(ws => (
                        <PlanimetricCard
                          key={ws.id}
                          ws={ws}
                          isSelected={selectedWsId === ws.id}
                          onClick={() => handleOpenInspect(ws)}
                          isVertical
                        />
                      ))}
                    </div>
                  </div>

                  {/* --- LATO D --- */}
                  <div className="space-y-2">
                    <div className="text-center">
                      <span className="text-xs font-extrabold text-slate-800 tracking-wider uppercase">
                        LATO D
                      </span>
                    </div>

                    {/* Vertical Workbench Column Lato D */}
                    <div className="bg-slate-100/70 border-2 border-slate-400/90 rounded-2xl p-3 sm:p-4 shadow-xs space-y-3.5">
                      {benches.latoD.map(ws => (
                        <PlanimetricCard
                          key={ws.id}
                          ws={ws}
                          isSelected={selectedWsId === ws.id}
                          onClick={() => handleOpenInspect(ws)}
                          isVertical
                        />
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* Bottom Real-time legend & footer */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> 100% Funzionante
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block animate-pulse" /> Anomalia Minore
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block animate-pulse" /> Fuori Servizio
                </span>
              </div>
              <span className="font-mono text-slate-400">Planimetria Hub Dispacciatori V4.0</span>
            </div>
          </div>
        </div>
      )}

      {/* VISTA B: SCHEDE BANCO (GRID DETTAGLIATA) */}
      {viewMode === 'cards' && (
        <div className="space-y-6">
          {[
            { id: 'LATO_A', title: 'Lato A (Orizzontale Superiore - 3 Postazioni)', items: benches.latoA },
            { id: 'LATO_B', title: 'Lato B (Orizzontale Inferiore - 3 Postazioni)', items: benches.latoB },
            { id: 'LATO_C', title: 'Lato C (Verticale - 4 Postazioni)', items: benches.latoC },
            { id: 'LATO_D', title: 'Lato D (Verticale - 4 Postazioni)', items: benches.latoD },
          ].map(group => {
            const visibleItems = group.items.filter(item =>
              filteredWorkstations.some(f => f.id === item.id)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.id} className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                    {group.title}
                  </h3>
                  <span className="text-xs font-semibold text-slate-500">
                    {visibleItems.length} Postazioni
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {visibleItems.map(ws => (
                    <WorkstationCard
                      key={ws.id}
                      ws={ws}
                      onClick={() => handleOpenInspect(ws)}
                      onQuickAuditOk={() => {
                        quickAuditWorkstation(ws.id, true);
                        showToast(`${ws.codice}: Segnata 100% Operativa`);
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VISTA C: STORICO INTERVENTI & LOG IT */}
      {viewMode === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Registro Modifiche Hardware & Storico Guasti
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              {workstationLogs.length} eventi registrati
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {workstationLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Nessun evento o segnalazione guasto presente nel registro.
              </div>
            ) : (
              workstationLogs.map(log => (
                <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl border mt-0.5 shrink-0 ${
                        log.nuovoStato === 'OK'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : log.nuovoStato === 'GUASTO'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {log.nuovoStato === 'OK' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono px-2 py-0.5 bg-slate-100 rounded-md">
                          {log.workstationCodice}
                        </span>
                        <span className="font-semibold text-slate-700">
                          {log.componente}
                        </span>
                        <span className="text-slate-400">&rarr;</span>
                        <span
                          className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                            log.nuovoStato === 'OK'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {log.nuovoStato}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1">{log.note}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 text-slate-400 text-[11px] font-mono">
                    <div>{log.timestamp}</div>
                    <div className="text-slate-500 font-sans font-semibold mt-0.5">
                      Op: {log.operatore}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. DRAWER / MODAL DI ISPEZIONE DETTAGLIATA POSTAZIONE */}
      {selectedWorkstation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0 rounded-t-2xl">
              <div className="flex items-center gap-3">
                {(() => {
                  const headerTheme = getWorkstationColorTheme(selectedWorkstation);
                  return (
                    <div
                      className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-mono font-black text-base shadow-sm border-2 ${headerTheme.cardBg} ${headerTheme.cardBorder} ${headerTheme.cardCodeText}`}
                    >
                      <span className="leading-tight">{selectedWorkstation.codice}</span>
                      <span className="text-[9px] font-sans font-bold -mt-0.5 truncate max-w-[42px]">
                        {selectedWorkstation.assegnazione || 'Libera'}
                      </span>
                    </div>
                  );
                })()}

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedWorkstation.nome}
                    </h3>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        getWorkstationHealth(selectedWorkstation).status === 'OPERATIVA'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : getWorkstationHealth(selectedWorkstation).status === 'ATTENZIONE'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {getWorkstationHealth(selectedWorkstation).status === 'OPERATIVA'
                        ? '100% OPERATIVA'
                        : getWorkstationHealth(selectedWorkstation).status === 'ATTENZIONE'
                        ? 'ANOMALIA PRESENTE'
                        : 'FUORI SERVIZIO'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedWorkstation.bancoNome} &bull; Ultimo controllo: {selectedWorkstation.ultimoControllo} ({selectedWorkstation.ultimoOperatore || 'N/D'})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    quickAuditWorkstation(selectedWorkstation.id, true);
                    showToast(`${selectedWorkstation.codice}: Tutti i componenti ripristinati su OK`);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Imposta istantaneamente tutti i componenti su funzionanti"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Segna Tutto OK
                </button>
                <button
                  onClick={() => setSelectedWsId(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body - Scrollable Components Checklist */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Assegnazione Linea / Progetto & Colore Banco */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    Assegnazione Destinazione & Colore Planimetria
                  </h4>
                  <span className="text-[11px] text-slate-500">Aggiornamento in tempo reale</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Destinazione / Progetto Assegnato
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Es: Svizzera, Austria, CRONOS, Francia..."
                        value={editingAssignment}
                        onChange={e => {
                          setEditingAssignment(e.target.value);
                          updateWorkstation(selectedWorkstation.id, { assegnazione: e.target.value });
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAssignment('Libera');
                          updateWorkstation(selectedWorkstation.id, { assegnazione: 'Libera' });
                        }}
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
                      >
                        Libera
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Colore Grafico Postazione (Seleziona per cambiare)
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {WORKSTATION_COLOR_PRESETS.map(c => {
                        const isCurrent = (selectedWorkstation.coloreTema || getWorkstationColorTheme(selectedWorkstation).id) === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setEditingColor(c.id);
                              updateWorkstation(selectedWorkstation.id, { coloreTema: c.id });
                              showToast(`${selectedWorkstation.codice}: Colore modificato in ${c.label}`);
                            }}
                            className={`py-2.5 px-3 text-xs font-bold rounded-xl border-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                              c.cardBg
                            } ${c.cardBorder} ${
                              isCurrent
                                ? 'ring-2 ring-blue-600 shadow-md scale-102 font-black z-10'
                                : 'opacity-70 hover:opacity-100 hover:scale-101'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded-full ${c.dotColor} border border-white shadow-2xs`} />
                            <span className="text-xs leading-none text-slate-900">{c.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Operator & Note Quick Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                      Operatore Dispacciatore
                    </label>
                    {editingOperator && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingOperator('');
                          updateWorkstation(selectedWorkstation.id, { operatore: '' });
                          showToast('Operatore rimosso dalla postazione');
                        }}
                        className="text-[10px] text-rose-600 hover:text-rose-700 hover:underline font-semibold cursor-pointer"
                      >
                        Svuota
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      list="ws-operators-list"
                      placeholder="Scrivi nome operatore di turno..."
                      value={editingOperator}
                      onChange={e => {
                        const val = e.target.value;
                        setEditingOperator(val);
                        updateWorkstation(selectedWorkstation.id, { operatore: val });
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden"
                    />
                    <datalist id="ws-operators-list">
                      {settings.operatori.map(op => (
                        <option key={op} value={op} />
                      ))}
                    </datalist>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Inserisci o modifica liberamente il nome dell'operatore assegnato
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                    Note / Segnalazioni Tecniche
                  </label>
                  <input
                    type="text"
                    placeholder="Es: Cavo USB allentato, chiamato IT, postazione di scorta..."
                    value={editingNotes}
                    onChange={e => setEditingNotes(e.target.value)}
                    onBlur={() => updateWorkstation(selectedWorkstation.id, { note: editingNotes })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Note operative visibili su scheda e registro
                  </span>
                </div>
              </div>

              {/* Malfunction Banner if any */}
              {(() => {
                const wsHealth = getWorkstationHealth(selectedWorkstation);
                return wsHealth.brokenList.length > 0 ? (
                  <div className="p-4 rounded-2xl bg-rose-600 text-white shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-5 h-5" />
                        <span className="text-sm font-black uppercase tracking-wider">
                          Componenti non funzionanti ({wsHealth.brokenList.length})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          quickAuditWorkstation(selectedWorkstation.id, true);
                          showToast(`${selectedWorkstation.codice}: Tutti i componenti ripristinati su OK`);
                        }}
                        className="px-3 py-1 bg-white text-rose-700 hover:bg-rose-50 text-xs font-black rounded-lg cursor-pointer transition-colors shadow-2xs"
                      >
                        Ripristina Tutto OK
                      </button>
                    </div>
                    <div className="space-y-1">
                      {wsHealth.brokenList.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs bg-rose-700/80 px-2.5 py-1 rounded-lg font-bold"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>•</span>
                            <span>{item.label} non funzionante</span>
                          </div>
                          <span className="text-[10px] uppercase px-1.5 py-0.5 bg-rose-900 rounded">
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Tutti i componenti hardware sono operativi al 100%</span>
                    </div>
                  </div>
                );
              })()}

              {/* 8 Component Status Tiles */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Configurazione Stato Hardware & Servizi
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Seleziona lo stato per contrassegnare componenti non funzionanti in rosso
                  </span>
                </div>

                <div className="space-y-2.5">
                  {componentConfig.map(comp => {
                    const Icon = comp.icon;
                    const currentState = selectedWorkstation.hardware[comp.key] || { status: 'OK' };
                    const isOk = currentState.status === 'OK';

                    return (
                      <div
                        key={comp.key}
                        className={`p-3 rounded-xl border transition-all ${
                          isOk
                            ? 'bg-slate-50/50 border-slate-200'
                            : 'bg-rose-50 border-rose-300 ring-1 ring-rose-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2.5 rounded-xl border ${
                                isOk
                                  ? 'bg-white text-slate-700 border-slate-200'
                                  : 'bg-rose-600 text-white border-rose-700 shadow-xs'
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">{comp.name}</span>
                                {!isOk ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider">
                                    Non Funzionante
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    Funzionante
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500">{comp.description}</p>
                            </div>
                          </div>

                          {/* Direct Funzionante / Non Funzionante Selector */}
                          <div className="flex items-center gap-1.5 sm:ml-auto">
                            <button
                              type="button"
                              onClick={() => {
                                updateWorkstationComponent(
                                  selectedWorkstation.id,
                                  comp.key,
                                  'OK',
                                  ''
                                );
                                showToast(`${comp.name}: Funzionante`);
                              }}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                                isOk
                                  ? 'bg-emerald-600 text-white shadow-xs scale-102 ring-1 ring-emerald-700'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Funzionante</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                updateWorkstationComponent(
                                  selectedWorkstation.id,
                                  comp.key,
                                  'GUASTO',
                                  ''
                                );
                                showToast(`${comp.name}: Segnalato come Non Funzionante`);
                              }}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                                !isOk
                                  ? 'bg-rose-600 text-white shadow-xs scale-102 ring-1 ring-rose-700'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Non Funzionante</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/90 flex items-center justify-between shrink-0 rounded-b-2xl">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Sei sicuro di voler eliminare la postazione ${selectedWorkstation.codice}?`)) {
                    deleteWorkstation(selectedWorkstation.id);
                    setSelectedWsId(null);
                    showToast(`Postazione ${selectedWorkstation.codice} rimossa`);
                  }
                }}
                className="px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-100 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Elimina Postazione
              </button>

              <button
                type="button"
                onClick={() => setSelectedWsId(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Chiudi Quadro Postazione
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RESET ALL AD INIZIO TURNO */}
      {showResetAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-emerald-600 mb-3">
              <div className="p-3 bg-emerald-100 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Controllo Rapido Inizio Turno
                </h3>
                <p className="text-xs text-slate-500">
                  Ripristino globale stato postazioni
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Vuoi impostare tutti i componenti (Computer, Pistole Scanner, Stampanti Termiche e Documenti, ILP e Rete) di tutte le <strong>{workstations.length}</strong> postazioni come <strong>100% Operativi (OK)</strong>?
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetAllModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAllWorkstationsToOk(activeOperator);
                  setShowResetAllModal(false);
                  showToast('Tutte le postazioni sono state segnate come 100% Operative!');
                }}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Conferma Tutto OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AGGIUNGI POSTAZIONE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-blue-600 mb-4">
              <div className="p-3 bg-blue-100 rounded-xl border border-blue-200">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Aggiungi Nuova Postazione</h3>
                <p className="text-xs text-slate-500">Configurazione banco dispacciatori</p>
              </div>
            </div>

            <div className="space-y-3.5 mb-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Codice Postazione</label>
                <input
                  type="text"
                  value={newWsCode}
                  onChange={e => setNewWsCode(e.target.value.toUpperCase())}
                  placeholder="Es: A4, B4, C5, D5..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Descrittivo</label>
                <input
                  type="text"
                  value={newWsName}
                  onChange={e => setNewWsName(e.target.value)}
                  placeholder="Es: Postazione A4"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Destinazione / Progetto</label>
                <input
                  type="text"
                  value={newWsAssignment}
                  onChange={e => setNewWsAssignment(e.target.value)}
                  placeholder="Es: Libera, Svizzera, Austria, CRONOS..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Operatore Assegnato (Facoltativo)</label>
                <input
                  type="text"
                  list="ws-operators-list"
                  value={newWsOperator}
                  onChange={e => setNewWsOperator(e.target.value)}
                  placeholder="Scrivi nome operatore..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Banco / Collocazione</label>
                  <select
                    value={newWsBanco}
                    onChange={e => setNewWsBanco(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                  >
                    <option value="LATO_A">Lato A (Orizzontale Superiore)</option>
                    <option value="LATO_B">Lato B (Orizzontale Inferiore)</option>
                    <option value="LATO_C">Lato C (Verticale)</option>
                    <option value="LATO_D">Lato D (Verticale)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Colore Grafico</label>
                  <select
                    value={newWsColor}
                    onChange={e => setNewWsColor(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                  >
                    {WORKSTATION_COLOR_PRESETS.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newWsCode || !newWsName) {
                    alert('Inserisci codice e nome della postazione');
                    return;
                  }
                  const bancoNames: Record<string, string> = {
                    LATO_A: 'Lato A (Orizzontale Superiore)',
                    LATO_B: 'Lato B (Orizzontale Inferiore)',
                    LATO_C: 'Lato C (Verticale)',
                    LATO_D: 'Lato D (Verticale)',
                  };
                  addWorkstation({
                    codice: newWsCode,
                    nome: newWsName,
                    bancoId: newWsBanco as any,
                    bancoNome: bancoNames[newWsBanco],
                    assegnazione: newWsAssignment,
                    coloreTema: newWsColor,
                    operatore: newWsOperator.trim(),
                  });
                  setShowAddModal(false);
                  showToast(`Postazione ${newWsCode} creata con successo`);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
              >
                Crea Postazione
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// SUB-COMPONENT: PLANIMETRIC SCHEMATIC CARD (PERFECT REPLICA)
// -------------------------------------------------------------
interface PlanimetricCardProps {
  ws: Workstation;
  isSelected: boolean;
  onClick: () => void;
  isVertical?: boolean;
}

const PlanimetricCard: React.FC<PlanimetricCardProps> = ({ ws, isSelected, onClick, isVertical }) => {
  const health = getWorkstationHealth(ws);
  const cardTheme = getWorkstationColorTheme(ws);

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-xl border-[2.5px] p-3 transition-all duration-200 cursor-pointer select-none flex flex-col justify-between shadow-xs ${
        cardTheme.cardBg
      } ${cardTheme.cardBorder} ${cardTheme.cardHover} ${
        isSelected
          ? 'ring-4 ring-blue-600 scale-[1.03] shadow-lg z-20'
          : 'hover:scale-[1.02] hover:shadow-md'
      } ${isVertical ? 'min-h-[88px]' : 'min-h-[96px]'}`}
    >
      {/* Live Status LED Dot & Telemetry (Top Right) */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        {health.status === 'OPERATIVA' ? (
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white shadow-xs" title="100% Operativa" />
        ) : health.status === 'ATTENZIONE' ? (
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white shadow-xs animate-pulse" title="Anomalia segnalata" />
        ) : (
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-white shadow-xs animate-ping" title="Guasto bloccante" />
        )}
      </div>

      {/* Main Top Header: Postazione Code (e.g. A1, A2, B1, C1, D1) */}
      <div className="text-center pt-0.5">
        <div className={`text-base sm:text-lg font-black tracking-tight font-sans ${cardTheme.cardCodeText}`}>
          {ws.codice}
        </div>
      </div>

      {/* Assignment / Destination Text (e.g. Libera, Svizzera, Austria, CRONOS, Germania, Francia) */}
      <div className="text-center pb-1">
        <div className={`text-xs sm:text-sm font-extrabold capitalize ${cardTheme.cardSubText}`}>
          {ws.assegnazione || 'Libera'}
        </div>
      </div>

      {/* Footer Malfunctions List / Hardware Alert */}
      <div className="pt-1.5 border-t border-black/10">
        {health.brokenList.length > 0 ? (
          <div className="flex flex-col gap-1">
            {health.brokenList.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1 text-[10px] font-black text-white bg-rose-600 px-1.5 py-0.5 rounded shadow-2xs truncate"
                title={`${item.label}: ${item.status}${item.detail ? ` - ${item.detail}` : ''}`}
              >
                <XCircle className="w-3 h-3 shrink-0" />
                <span className="truncate">{item.label} non funzionante</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-800/80">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Tutto OK</span>
          </div>
        )}
      </div>

      {/* Assigned Operator Chip if active */}
      {ws.operatore && ws.operatore.trim() !== '' ? (
        <div className="mt-1 text-[10px] font-bold text-slate-900 bg-white/90 px-1.5 py-0.5 rounded text-center truncate border border-black/10 shadow-2xs">
          👤 {ws.operatore}
        </div>
      ) : null}
    </div>
  );
};

// -------------------------------------------------------------
// SUB-COMPONENT: WORKSTATION CARD (GRID VIEW)
// -------------------------------------------------------------
interface WorkstationCardProps {
  ws: Workstation;
  onClick: () => void;
  onQuickAuditOk: () => void;
}

const WorkstationCard: React.FC<WorkstationCardProps> = ({ ws, onClick, onQuickAuditOk }) => {
  const health = getWorkstationHealth(ws);
  const colorTheme = getWorkstationColorTheme(ws);

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md ${
        health.status === 'OPERATIVA'
          ? 'border-slate-200 hover:border-blue-300'
          : health.status === 'ATTENZIONE'
          ? 'border-amber-300 bg-amber-50/10'
          : 'border-rose-300 bg-rose-50/10'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm shadow-xs ${
              health.status === 'OPERATIVA'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : health.status === 'ATTENZIONE'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}
          >
            {ws.codice}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">{ws.nome}</h4>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border flex items-center gap-1 ${colorTheme.cardBg} ${colorTheme.cardBorder} text-slate-900`}>
                <span className={`w-1.5 h-1.5 rounded-full ${colorTheme.dotColor}`} />
                {ws.assegnazione || 'Libera'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block">{ws.bancoNome}</span>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            health.status === 'OPERATIVA'
              ? 'bg-emerald-100 text-emerald-800'
              : health.status === 'ATTENZIONE'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-rose-100 text-rose-800'
          }`}
        >
          {health.status}
        </span>
      </div>

      {/* Operator & Notes */}
      <div className="space-y-1.5 text-xs text-slate-600 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Operatore:</span>
          <span className="font-semibold text-slate-800">
            {ws.operatore && ws.operatore.trim() !== '' ? (
              ws.operatore
            ) : (
              <span className="text-slate-400 font-normal italic">Non assegnato (fai clic per scrivere)</span>
            )}
          </span>
        </div>
        {ws.note && (
          <div className="text-[11px] text-slate-600 italic border-t border-slate-200/60 pt-1">
            "{ws.note}"
          </div>
        )}
      </div>

      {/* ONLY DISPLAY NON-FUNCTIONAL / FAULTY ITEMS IN RED */}
      <div className="mb-3">
        {health.brokenList.length > 0 ? (
          <div className="space-y-1.5">
            {health.brokenList.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-xs"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label} non funzionante</span>
                </div>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 bg-rose-700/80 rounded shrink-0">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Tutti i componenti sono operativi</span>
          </div>
        )}
      </div>

      {/* Card Action footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <span className="text-[10px] text-slate-400">Ctrl: {ws.ultimoControllo}</span>
        <button
          onClick={e => {
            e.stopPropagation();
            onQuickAuditOk();
          }}
          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Segna Tutto OK
        </button>
      </div>
    </div>
  );
};
