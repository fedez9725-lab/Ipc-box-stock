import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Package,
  AlertTriangle,
  Truck,
  CheckCircle2,
  PieChart as PieIcon,
  Download,
  Printer,
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
} from 'recharts';
import { useStock } from '../../context/StockContext';

export const ReportsView: React.FC = () => {
  const { stock, metrics, orders, workOrders, damageReports, movements, settings } = useStock();

  // Aggregate stats
  const totalReceived = orders.reduce((sum, o) => sum + o.quantitaRicevuta, 0);
  const totalOrdered = orders.reduce((sum, o) => sum + o.quantitaOrdinata, 0);
  const totalConsumed = workOrders.reduce((sum, w) => sum + w.quantitaAssegnata, 0);
  const totalDamagesCount = damageReports.reduce((sum, d) => sum + d.quantita, 0);

  const supplierDiscrepancy = Math.max(0, totalOrdered - totalReceived);
  const supplierFulfillmentRate = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 100;

  // Chart 1: Stock Breakdown Data
  const stockBreakdownData = [
    { name: 'BOX Utilizzabili', quantita: metrics.boxUtilizzabili, fill: '#059669' },
    { name: 'Basi Eccedenti', quantita: metrics.basiEccedenti, fill: '#2563eb' },
    { name: 'Coperchi Eccedenti', quantita: metrics.coperchiEccedenti, fill: '#3b82f6' },
    { name: 'Basi Rotte', quantita: stock.basiRotte, fill: '#e11d48' },
    { name: 'Coperchi Rotti', quantita: stock.coperchiRotti, fill: '#f43f5e' },
    { name: 'Box Fuori Uso', quantita: stock.boxDanneggiatiTotali || 0, fill: '#64748b' },
  ];

  // Chart 2: Damage Causes Distribution
  const damageCausesMap: Record<string, number> = {};
  damageReports.forEach(d => {
    const key = d.causaDanno.replace('_', ' ');
    damageCausesMap[key] = (damageCausesMap[key] || 0) + d.quantita;
  });

  const damageCausesData = Object.entries(damageCausesMap).map(([name, value]) => ({
    name,
    value,
  }));

  const PIE_COLORS = ['#e11d48', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

  // Chart 3: Movements summary by type
  const movementsByType: Record<string, number> = {};
  movements.forEach(m => {
    movementsByType[m.tipologia] = (movementsByType[m.tipologia] || 0) + (m.quantita || 1);
  });

  const movementsBarData = [
    { name: 'Ricezioni', quantita: movementsByType['RICEZIONE'] || 0, fill: '#2563eb' },
    { name: 'Utilizzi', quantita: movementsByType['UTILIZZO'] || 0, fill: '#d97706' },
    { name: 'Rotture', quantita: movementsByType['ROTTURA'] || 0, fill: '#e11d48' },
    { name: 'Recuperi', quantita: movementsByType['RECUPERO'] || 0, fill: '#059669' },
    { name: 'Ordini', quantita: movementsByType['ORDINE'] || 0, fill: '#4f46e5' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & PRINT/EXPORT */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <span>Report Operativo & Analisi Prestazioni IPC BOX</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Riepilogo statistico di disponibilità, tassi di rottura, conformità fornitori e consumi di linea.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Stampa Report PDF
            </button>
          </div>
        </div>

        {/* Top 4 KPI Executive Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] text-emerald-800 font-bold uppercase block">Stock Utilizzabile</span>
            <span className="text-3xl font-black text-emerald-900">{metrics.boxUtilizzabili} BOX</span>
            <span className="text-[11px] text-emerald-700 block mt-0.5">
              {Math.floor(metrics.boxUtilizzabili / 7)} pile da 7 pronte
            </span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-[10px] text-amber-800 font-bold uppercase block">Consumi Totali Lavorazioni</span>
            <span className="text-3xl font-black text-amber-900">{totalConsumed} BOX</span>
            <span className="text-[11px] text-amber-700 block mt-0.5">Assegnati alle linee</span>
          </div>

          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
            <span className="text-[10px] text-rose-800 font-bold uppercase block">Rotture & Scarti</span>
            <span className="text-3xl font-black text-rose-900">{metrics.totaleComponentiRotte} PZ</span>
            <span className="text-[11px] text-rose-700 block mt-0.5">
              {stock.basiRotte} basi + {stock.coperchiRotti} coperchi
            </span>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <span className="text-[10px] text-blue-800 font-bold uppercase block">Tasso Fornitura Conforme</span>
            <span className="text-3xl font-black text-blue-900">{supplierFulfillmentRate}%</span>
            <span className="text-[11px] text-blue-700 block mt-0.5">
              {totalReceived} su {totalOrdered} ordinati
            </span>
          </div>
        </div>
      </div>

      {/* 2. CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Stock Balance Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <span>Ripartizione Fisica Componenti in Magazzino</span>
            </h3>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockBreakdownData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="quantita" name="Quantità" radius={[4, 4, 0, 0]}>
                  {stockBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Damage Causes Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Cause Principali di Danneggiamento IPC BOX</span>
            </h3>
          </div>

          {damageCausesData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={damageCausesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {damageCausesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-20">Nessun dato di danno disponibile.</p>
          )}
        </div>
      </div>

      {/* 3. MOVEMENTS VOLUME COMPARISON */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-700" />
            <span>Volumi Movimentati per Tipologia Operativa</span>
          </h3>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={movementsBarData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="quantita" name="Unità Movimentate" radius={[4, 4, 0, 0]}>
                {movementsBarData.map((entry, index) => (
                  <Cell key={`cell-mov-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
