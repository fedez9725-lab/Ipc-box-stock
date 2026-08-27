import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Save,
  Download,
  Printer,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Clock,
  Building2,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { IPCInventoryRow, IPCInventorySheet, IPCInventoryExtra } from '../../types';

export const IPCInventoryView: React.FC = () => {
  const {
    stock,
    metrics,
    piles,
    workOrders,
    settings,
    activeOperator,
    ipcSheets,
    saveIPCSheet,
    deleteIPCSheet,
    applyIPCSheetToStock,
  } = useStock();

  const [currentSheetId, setCurrentSheetId] = useState<string>(() => {
    return ipcSheets[0]?.id || `ipc-inv-${Date.now()}`;
  });

  const [poolMemberOperator, setPoolMemberOperator] = useState<string>(() => {
    return ipcSheets[0]?.poolMemberOperator || 'Poste Italiane - Hub Logistico';
  });

  const [sheetDate, setSheetDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [sheetNotes, setSheetNotes] = useState<string>(() => {
    return ipcSheets[0]?.note || 'Conteggio inventariale periodico Pool IPC Pallet Box';
  });

  const [rows, setRows] = useState<IPCInventoryRow[]>(() => {
    if (ipcSheets[0]?.rows && ipcSheets[0].rows.length > 0) {
      return ipcSheets[0].rows;
    }
    return [
      {
        id: 'row-1',
        csiMle: 'CSI 01 - Magazzino Centrale',
        impcCode: 'ITBLGA',
        dataConteggio: new Date().toISOString().split('T')[0],
        orarioConteggio: '08:30',
        giaImpilati: 35,
        daImpilare: 14,
        vuotiProduzione: 5,
        pieniProduzione: 18,
        danneggiatiRotti: 3,
        totaleCsiMle: 75,
      },
      {
        id: 'row-2',
        csiMle: 'MLE 02 - Capannone Smistamento',
        impcCode: 'ITMXPA',
        dataConteggio: new Date().toISOString().split('T')[0],
        orarioConteggio: '09:00',
        giaImpilati: 21,
        daImpilare: 7,
        vuotiProduzione: 4,
        pieniProduzione: 12,
        danneggiatiRotti: 2,
        totaleCsiMle: 46,
      },
    ];
  });

  const [eccedenze, setEccedenze] = useState<IPCInventoryExtra>(() => {
    return (
      ipcSheets[0]?.eccedenze || {
        coperchi: metrics.coperchiEccedenti || 0,
        casse: 0,
        basi: metrics.basiEccedenti || 0,
      }
    );
  });

  const [mancanti, setMancanti] = useState<IPCInventoryExtra>(() => {
    return (
      ipcSheets[0]?.mancanti || {
        coperchi: 0,
        casse: 0,
        basi: 0,
      }
    );
  });

  const [brokenBoxesCount, setBrokenBoxesCount] = useState<number>(() => {
    return ipcSheets[0]?.palletBoxRottiNonUtilizzabili ?? stock.boxDanneggiatiTotali ?? 5;
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Auto notification clear
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Recalculate row total on field change
  const handleRowChange = (id: string, field: keyof IPCInventoryRow, value: string | number) => {
    setRows(prevRows =>
      prevRows.map(row => {
        if (row.id !== id) return row;
        const updatedRow = { ...row, [field]: value };
        // Recalculate totaleCsiMle
        const total =
          (Number(updatedRow.giaImpilati) || 0) +
          (Number(updatedRow.daImpilare) || 0) +
          (Number(updatedRow.vuotiProduzione) || 0) +
          (Number(updatedRow.pieniProduzione) || 0) +
          (Number(updatedRow.danneggiatiRotti) || 0);
        updatedRow.totaleCsiMle = total;
        return updatedRow;
      })
    );
  };

  const addRow = () => {
    const newId = `row-${Date.now()}`;
    const newRow: IPCInventoryRow = {
      id: newId,
      csiMle: `CSI/MLE Postazione ${rows.length + 1}`,
      impcCode: 'ITPOST',
      dataConteggio: sheetDate,
      orarioConteggio: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      giaImpilati: 0,
      daImpilare: 0,
      vuotiProduzione: 0,
      pieniProduzione: 0,
      danneggiatiRotti: 0,
      totaleCsiMle: 0,
    };
    setRows([...rows, newRow]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) {
      alert('Deve rimanere almeno una riga di conteggio.');
      return;
    }
    setRows(rows.filter(r => r.id !== id));
  };

  // Grand total
  const totalGiaImpilati = rows.reduce((s, r) => s + (Number(r.giaImpilati) || 0), 0);
  const totalDaImpilare = rows.reduce((s, r) => s + (Number(r.daImpilare) || 0), 0);
  const totalVuotiProduzione = rows.reduce((s, r) => s + (Number(r.vuotiProduzione) || 0), 0);
  const totalPieniProduzione = rows.reduce((s, r) => s + (Number(r.pieniProduzione) || 0), 0);
  const totalDanneggiatiRotti = rows.reduce((s, r) => s + (Number(r.danneggiatiRotti) || 0), 0);
  const operatorGrandTotal = rows.reduce((s, r) => s + (Number(r.totaleCsiMle) || 0), 0);

  // Pre-populate from system stock
  const handlePrepopulateFromSystem = () => {
    const totalStacked = piles.reduce((acc, p) => acc + (p.stato !== 'QUARANTENA' ? p.boxes.length : 0), 0);
    const quarantineStacked = piles.reduce((acc, p) => acc + (p.stato === 'QUARANTENA' ? p.boxes.length : 0), 0);
    const inUseWorkOrders = workOrders
      .filter(w => w.stato === 'IN_CORSO')
      .reduce((sum, w) => sum + w.quantitaAssegnata, 0);

    const newRows: IPCInventoryRow[] = [
      {
        id: `row-${Date.now()}-1`,
        csiMle: 'Magazzino Principale (Stoccaggio)',
        impcCode: settings.codiceHub || 'ITBLGA',
        dataConteggio: sheetDate,
        orarioConteggio: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        giaImpilati: totalStacked,
        daImpilare: Math.max(0, metrics.boxUtilizzabili - totalStacked),
        vuotiProduzione: 0,
        pieniProduzione: 0,
        danneggiatiRotti: quarantineStacked + stock.basiRotte,
        totaleCsiMle: totalStacked + Math.max(0, metrics.boxUtilizzabili - totalStacked) + quarantineStacked + stock.basiRotte,
      },
      {
        id: `row-${Date.now()}-2`,
        csiMle: 'Capannone Produzione & Smistamento',
        impcCode: 'ITMXPA',
        dataConteggio: sheetDate,
        orarioConteggio: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        giaImpilati: 0,
        daImpilare: 0,
        vuotiProduzione: 0,
        pieniProduzione: inUseWorkOrders,
        danneggiatiRotti: stock.coperchiRotti > stock.basiRotte ? stock.coperchiRotti - stock.basiRotte : 0,
        totaleCsiMle: inUseWorkOrders + (stock.coperchiRotti > stock.basiRotte ? stock.coperchiRotti - stock.basiRotte : 0),
      },
    ];

    setRows(newRows);
    setEccedenze({
      coperchi: metrics.coperchiEccedenti,
      casse: 0,
      basi: metrics.basiEccedenti,
    });
    setMancanti({
      coperchi: metrics.coperchiMancantiPerPareggio,
      casse: 0,
      basi: metrics.basiMancantiPerPareggio,
    });
    setBrokenBoxesCount(metrics.totaleComponentiRotte);

    setNotification({
      type: 'info',
      text: 'Dati pre-popolati istantaneamente dai conteggi fisici e pile attuali del sistema.',
    });
  };

  // Save current sheet
  const handleSaveSheet = () => {
    const sheetToSave: IPCInventorySheet = {
      id: currentSheetId,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      data: sheetDate,
      poolMemberOperator,
      rows,
      eccedenze,
      mancanti,
      palletBoxRottiNonUtilizzabili: brokenBoxesCount,
      note: sheetNotes,
    };

    saveIPCSheet(sheetToSave);
    setNotification({
      type: 'success',
      text: `Scheda inventario "${sheetToSave.id}" salvata correttamente nello storico.`,
    });
  };

  // Apply to stock
  const handleApplyToStock = () => {
    if (
      window.confirm(
        `Sei sicuro di voler allineare le giacenze di magazzino ai dati contati in questo foglio?\n\nTotale Box Rilevati: ${operatorGrandTotal}\nBox Danneggiati / Fuori uso: ${brokenBoxesCount}`
      )
    ) {
      const sheetToApply: IPCInventorySheet = {
        id: currentSheetId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        data: sheetDate,
        poolMemberOperator,
        rows,
        eccedenze,
        mancanti,
        palletBoxRottiNonUtilizzabili: brokenBoxesCount,
        note: sheetNotes,
      };
      const res = applyIPCSheetToStock(sheetToApply);
      saveIPCSheet(sheetToApply);
      setNotification({
        type: 'success',
        text: res.message,
      });
    }
  };

  // Load a historical sheet
  const handleLoadSheet = (sheet: IPCInventorySheet) => {
    setCurrentSheetId(sheet.id);
    setPoolMemberOperator(sheet.poolMemberOperator);
    setSheetDate(sheet.data || sheet.timestamp?.split(' ')[0] || new Date().toISOString().split('T')[0]);
    setSheetNotes(sheet.note || '');
    setRows(sheet.rows);
    setEccedenze(sheet.eccedenze);
    setMancanti(sheet.mancanti);
    setBrokenBoxesCount(sheet.palletBoxRottiNonUtilizzabili);
    setNotification({
      type: 'info',
      text: `Caricata scheda inventario del ${sheet.data || sheet.timestamp}.`,
    });
  };

  // Export to CSV formatted for Excel
  const handleExportCSV = () => {
    const headers = [
      'CSI/MLE',
      'IMPC code',
      'Data conteggio',
      'Orario conteggio',
      'Pallet Box gia impilati',
      'Pallet Box da impilare',
      'Pallet Box vuoti, in produzione',
      'Pallet Box pieni, in produzione',
      'Pallet Box danneggiati/rotti',
      'Totale CSI/MLE',
    ];

    const csvRows = [
      ['IPC Pallet Box Pool - Inventory counting'],
      ['Pool Member / Operator:', poolMemberOperator],
      ['Data Scheda:', sheetDate],
      [],
      headers,
      ...rows.map(r => [
        `"${r.csiMle}"`,
        `"${r.impcCode}"`,
        `"${r.dataConteggio}"`,
        `"${r.orarioConteggio}"`,
        r.giaImpilati,
        r.daImpilare,
        r.vuotiProduzione,
        r.pieniProduzione,
        r.danneggiatiRotti,
        r.totaleCsiMle,
      ]),
      ['Pool member / Operator Total >', '', '', '', totalGiaImpilati, totalDaImpilare, totalVuotiProduzione, totalPieniProduzione, totalDanneggiatiRotti, operatorGrandTotal],
      [],
      ['ECCEDENZE', 'Nr.'],
      ['Coperchi', eccedenze.coperchi],
      ['Casse', eccedenze.casse],
      ['Basi', eccedenze.basi],
      [],
      ['MANCANTI', 'Nr.'],
      ['Coperchi', mancanti.coperchi],
      ['Casse', mancanti.casse],
      ['Basi', mancanti.basi],
      [],
      ['Numero pallet box rotti e non piu utilizzabili', brokenBoxesCount],
      ['Note / Osservazioni:', `"${sheetNotes}"`],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventory_sheet_IPC_Pallet_Boxes_${sheetDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-700 border border-emerald-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Foglio Inventario IPC Pallet Boxes (Pool Counting)
              </h2>
              <p className="text-xs text-slate-500">
                Modulo ufficiale conteggio stock, ripartizione linee, componenti ed eccedenze/mancanze
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrepopulateFromSystem}
            className="px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Pre-popola la tabella con i conteggi correnti del sistema"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Pre-popola da Stock
          </button>
          <button
            onClick={handleSaveSheet}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Salva Scheda
          </button>
          <button
            onClick={handleApplyToStock}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            title="Aggiorna il magazzino con i conteggi inseriti in questa scheda"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Allinea a Magazzino
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Esporta CSV / Excel
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Stampa
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-3 rounded-xl flex items-center gap-2 text-xs font-medium border ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* 2. THE OFFICIAL DIGITAL EXCEL SPREADSHEET SHEET */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden print:border-none print:shadow-none">
        {/* Spreadsheet Top Banner Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="bg-emerald-500 text-slate-900 text-xs font-black px-2 py-0.5 rounded font-mono uppercase tracking-wider">
              XLSX Form
            </span>
            <h3 className="font-extrabold text-base tracking-wide uppercase text-white font-mono">
              IPC Pallet Box Pool - Inventory counting
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">Data Rilevazione:</span>
            <input
              type="date"
              value={sheetDate}
              onChange={e => setSheetDate(e.target.value)}
              className="bg-slate-800 text-white border border-slate-700 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-emerald-400 font-mono"
            />
          </div>
        </div>

        {/* Operator / Pool Member Row (with yellow highlight as in Excel) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-rose-700 uppercase tracking-tight font-mono">
              Pool Member / Operator:
            </span>
            <input
              type="text"
              value={poolMemberOperator}
              onChange={e => setPoolMemberOperator(e.target.value)}
              className="bg-[#fef08a] text-slate-900 font-bold border border-amber-300 rounded px-3 py-1 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none min-w-[280px]"
              placeholder="Es. Poste Italiane - Hub / Centro Operativo"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={addRow}
              className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              + Aggiungi Riga Postazione
            </button>
          </div>
        </div>

        {/* Main Table Grid with exact Excel chromatic accents */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-800 border-collapse">
            <thead>
              <tr className="text-center font-bold text-[11px] leading-tight select-none">
                <th className="p-2.5 border border-slate-300 bg-[#dcfce7] text-emerald-950 w-44">
                  CSI / MLE
                </th>
                <th className="p-2.5 border border-slate-300 bg-[#dcfce7] text-emerald-950 w-28">
                  IMPC code
                </th>
                <th className="p-2.5 border border-slate-300 bg-[#dbeafe] text-blue-950 w-28">
                  Data conteggio
                </th>
                <th className="p-2.5 border border-slate-300 bg-[#dbeafe] text-blue-950 w-24">
                  Orario conteggio
                </th>
                <th className="p-2.5 border border-slate-300 bg-[#ffedd5] text-amber-950 w-28">
                  Pallet Box già impilati
                </th>
                <th className="p-2.5 border border-slate-300 bg-[#ffedd5] text-amber-950 w-28">
                  Pallet Box da impilare
                </th>
                <th className="p-2.5 border border-slate-300 bg-[#ffedd5] text-amber-950 w-28">
                  Pallet Box vuoti, in produzione
                </th>
                <th className="p-2.5 border border-slate-300 bg-[#ffedd5] text-amber-950 w-28">
                  Pallet Box pieni, in produzione
                </th>
                <th className="p-2.5 border border-slate-300 bg-[#fee2e2] text-rose-950 w-28">
                  Pallet Box danneggiati / rotti
                </th>
                <th className="p-2.5 border border-slate-300 bg-[#fef08a] text-amber-950 font-black w-28">
                  Totale CSI/MLE
                </th>
                <th className="p-2.5 border border-slate-300 bg-slate-100 text-slate-600 w-12 print:hidden">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {rows.map((row, idx) => (
                <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* CSI / MLE */}
                  <td className="p-1 border border-slate-300 bg-[#f0fdf4]/50">
                    <input
                      type="text"
                      value={row.csiMle}
                      onChange={e => handleRowChange(row.id, 'csiMle', e.target.value)}
                      className="w-full text-xs font-sans font-semibold p-1.5 bg-transparent rounded focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </td>

                  {/* IMPC Code */}
                  <td className="p-1 border border-slate-300 bg-[#f0fdf4]/50">
                    <input
                      type="text"
                      value={row.impcCode}
                      onChange={e => handleRowChange(row.id, 'impcCode', e.target.value)}
                      className="w-full text-xs font-mono font-bold text-center p-1.5 bg-transparent rounded focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </td>

                  {/* Data conteggio */}
                  <td className="p-1 border border-slate-300 bg-[#eff6ff]/50 text-center">
                    <input
                      type="date"
                      value={row.dataConteggio}
                      onChange={e => handleRowChange(row.id, 'dataConteggio', e.target.value)}
                      className="w-full text-[11px] font-mono text-center p-1 bg-transparent rounded focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </td>

                  {/* Orario conteggio */}
                  <td className="p-1 border border-slate-300 bg-[#eff6ff]/50 text-center">
                    <input
                      type="time"
                      value={row.orarioConteggio}
                      onChange={e => handleRowChange(row.id, 'orarioConteggio', e.target.value)}
                      className="w-full text-xs font-mono text-center p-1 bg-transparent rounded focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </td>

                  {/* Pallet Box già impilati */}
                  <td className="p-1 border border-slate-300 bg-[#fff7ed]/50 text-center">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={row.giaImpilati === 0 ? '' : row.giaImpilati}
                      onFocus={e => e.target.select()}
                      onChange={e =>
                        handleRowChange(
                          row.id,
                          'giaImpilati',
                          e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0)
                        )
                      }
                      className="w-full text-xs font-bold text-center p-1.5 bg-transparent rounded focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </td>

                  {/* Pallet Box da impilare */}
                  <td className="p-1 border border-slate-300 bg-[#fff7ed]/50 text-center">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={row.daImpilare === 0 ? '' : row.daImpilare}
                      onFocus={e => e.target.select()}
                      onChange={e =>
                        handleRowChange(
                          row.id,
                          'daImpilare',
                          e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0)
                        )
                      }
                      className="w-full text-xs font-bold text-center p-1.5 bg-transparent rounded focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </td>

                  {/* Pallet Box vuoti, in produzione */}
                  <td className="p-1 border border-slate-300 bg-[#fff7ed]/50 text-center">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={row.vuotiProduzione === 0 ? '' : row.vuotiProduzione}
                      onFocus={e => e.target.select()}
                      onChange={e =>
                        handleRowChange(
                          row.id,
                          'vuotiProduzione',
                          e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0)
                        )
                      }
                      className="w-full text-xs font-bold text-center p-1.5 bg-transparent rounded focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </td>

                  {/* Pallet Box pieni, in produzione */}
                  <td className="p-1 border border-slate-300 bg-[#fff7ed]/50 text-center">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={row.pieniProduzione === 0 ? '' : row.pieniProduzione}
                      onFocus={e => e.target.select()}
                      onChange={e =>
                        handleRowChange(
                          row.id,
                          'pieniProduzione',
                          e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0)
                        )
                      }
                      className="w-full text-xs font-bold text-center p-1.5 bg-transparent rounded focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </td>

                  {/* Pallet Box danneggiati/rotti */}
                  <td className="p-1 border border-slate-300 bg-[#fef2f2]/60 text-center">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={row.danneggiatiRotti === 0 ? '' : row.danneggiatiRotti}
                      onFocus={e => e.target.select()}
                      onChange={e =>
                        handleRowChange(
                          row.id,
                          'danneggiatiRotti',
                          e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0)
                        )
                      }
                      className="w-full text-xs font-bold text-rose-700 text-center p-1.5 bg-transparent rounded focus:bg-white focus:ring-1 focus:ring-rose-500 focus:outline-none"
                    />
                  </td>

                  {/* Totale CSI/MLE (Calculated) */}
                  <td className="p-2.5 border border-slate-300 bg-[#fef9c3] text-center font-bold text-slate-900 text-sm">
                    {row.totaleCsiMle}
                  </td>

                  {/* Actions */}
                  <td className="p-1 border border-slate-300 text-center print:hidden">
                    <button
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                      title="Elimina riga"
                    >
                      <Trash2 className="w-3.5 h-3.5 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* OPERATOR GRAND TOTAL ROW */}
              <tr className="font-extrabold bg-slate-100 border-t-2 border-slate-400">
                <td colSpan={4} className="p-3 text-right text-rose-700 uppercase font-mono text-xs pr-4 border border-slate-300">
                  Pool member / Operator Total &gt;
                </td>
                <td className="p-2.5 text-center text-slate-900 border border-slate-300 bg-[#fff7ed]">
                  {totalGiaImpilati}
                </td>
                <td className="p-2.5 text-center text-slate-900 border border-slate-300 bg-[#fff7ed]">
                  {totalDaImpilare}
                </td>
                <td className="p-2.5 text-center text-slate-900 border border-slate-300 bg-[#fff7ed]">
                  {totalVuotiProduzione}
                </td>
                <td className="p-2.5 text-center text-slate-900 border border-slate-300 bg-[#fff7ed]">
                  {totalPieniProduzione}
                </td>
                <td className="p-2.5 text-center text-rose-700 border border-slate-300 bg-[#fee2e2]">
                  {totalDanneggiatiRotti}
                </td>
                <td className="p-3 text-center text-rose-800 bg-[#fef08a] border border-slate-300 text-base font-black">
                  {operatorGrandTotal}
                </td>
                <td className="border border-slate-300 print:hidden" />
              </tr>
            </tbody>
          </table>
        </div>

        {/* Sub-tables: Eccedenze, Mancanti, Box Rotti e non più utilizzabili */}
        <div className="p-5 border-t border-slate-200 bg-white grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Table: Eccedenze */}
          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-slate-800 text-white px-3 py-2 text-xs font-bold font-mono flex items-center justify-between">
              <span>ECCEDENZE</span>
              <span className="text-[10px] text-slate-300">Nr.</span>
            </div>
            <table className="w-full text-xs font-mono">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2.5 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-200 w-36 font-sans">
                    Coperchi
                  </td>
                  <td className="p-1 bg-[#fef08a]">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={eccedenze.coperchi === 0 ? '' : eccedenze.coperchi}
                      onFocus={e => e.target.select()}
                      onChange={e =>
                        setEccedenze({
                          ...eccedenze,
                          coperchi: e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                      className="w-full text-xs font-bold text-center p-1.5 bg-transparent rounded focus:bg-white focus:outline-none"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-200 font-sans">
                    Casse
                  </td>
                  <td className="p-1 bg-[#fef08a]">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={eccedenze.casse === 0 ? '' : eccedenze.casse}
                      onFocus={e => e.target.select()}
                      onChange={e =>
                        setEccedenze({
                          ...eccedenze,
                          casse: e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                      className="w-full text-xs font-bold text-center p-1.5 bg-transparent rounded focus:bg-white focus:outline-none"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-200 font-sans">
                    Basi
                  </td>
                  <td className="p-1 bg-[#fef08a]">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={eccedenze.basi === 0 ? '' : eccedenze.basi}
                      onFocus={e => e.target.select()}
                      onChange={e =>
                        setEccedenze({
                          ...eccedenze,
                          basi: e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                      className="w-full text-xs font-bold text-center p-1.5 bg-transparent rounded focus:bg-white focus:outline-none"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table: Mancanti */}
          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-slate-800 text-white px-3 py-2 text-xs font-bold font-mono flex items-center justify-between">
              <span>MANCANTI</span>
              <span className="text-[10px] text-slate-300">Nr.</span>
            </div>
            <table className="w-full text-xs font-mono">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2.5 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-200 w-36 font-sans">
                    Coperchi
                  </td>
                  <td className="p-1 bg-[#fef08a]">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={mancanti.coperchi === 0 ? '' : mancanti.coperchi}
                      onFocus={e => e.target.select()}
                      onChange={e =>
                        setMancanti({
                          ...mancanti,
                          coperchi: e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                      className="w-full text-xs font-bold text-center p-1.5 bg-transparent rounded focus:bg-white focus:outline-none"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-200 font-sans">
                    Casse
                  </td>
                  <td className="p-1 bg-[#fef08a]">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={mancanti.casse === 0 ? '' : mancanti.casse}
                      onFocus={e => e.target.select()}
                      onChange={e =>
                        setMancanti({
                          ...mancanti,
                          casse: e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                      className="w-full text-xs font-bold text-center p-1.5 bg-transparent rounded focus:bg-white focus:outline-none"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-200 font-sans">
                    Basi
                  </td>
                  <td className="p-1 bg-[#fef08a]">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={mancanti.basi === 0 ? '' : mancanti.basi}
                      onFocus={e => e.target.select()}
                      onChange={e =>
                        setMancanti({
                          ...mancanti,
                          basi: e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                      className="w-full text-xs font-bold text-center p-1.5 bg-transparent rounded focus:bg-white focus:outline-none"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table / Box: Pallet Box rotti e non più utilizzabili */}
          <div className="border border-rose-300 rounded-xl overflow-hidden bg-rose-50/40 p-4 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold text-rose-900 uppercase font-mono">
                  Numero pallet box rotti e non più utilizzabili
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mb-3">
                Unità pallet box dichiarate fuori uso permanente o da avviare al riciclo / sostituzione.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">NR. TOTALE:</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={brokenBoxesCount === 0 ? '' : brokenBoxesCount}
                onFocus={e => e.target.select()}
                onChange={e =>
                  setBrokenBoxesCount(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))
                }
                className="w-24 text-center font-mono font-bold text-base bg-[#fef08a] border border-amber-300 rounded px-2 py-1.5 text-rose-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              <span className="text-xs text-rose-700 font-semibold">Pallet Box rotti</span>
            </div>
          </div>
        </div>

        {/* Bottom Notes & Signatures */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Note e annotazioni di fine turno / conteggio:
            </label>
            <input
              type="text"
              value={sheetNotes}
              onChange={e => setSheetNotes(e.target.value)}
              placeholder="Es. Conteggio effettuato con personale logistica Poste Italiane, rilevata discrepanza su linea 2..."
              className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. HISTORICAL INVENTORY COUNTING SHEETS ARCHIVE */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-700" />
            <h3 className="font-bold text-sm text-slate-900">
              Storico Schede Inventario Salvate ({ipcSheets.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">Registro Storico Ufficiale</span>
        </div>

        {ipcSheets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ipcSheets.map(sheet => {
              const sheetTotal = sheet.rows.reduce((s, r) => s + (Number(r.totaleCsiMle) || 0), 0);
              const isSelected = sheet.id === currentSheetId;

              return (
                <div
                  key={sheet.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/40 shadow-xs ring-1 ring-blue-500'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block truncate max-w-[200px]">
                        {sheet.poolMemberOperator || 'Poste Italiane'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {sheet.data || sheet.timestamp}
                      </span>
                    </div>
                    <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {sheetTotal} BOX
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-1 mb-3">
                    <div className="flex justify-between">
                      <span>Postazioni contate:</span>
                      <strong className="font-mono text-slate-800">{sheet.rows?.length || 0}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Rotti / Fuori uso:</span>
                      <strong className="font-mono text-rose-700">
                        {sheet.palletBoxRottiNonUtilizzabili || 0}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Eccedenze Basi/Cop:</span>
                      <strong className="font-mono text-slate-800">
                        +{sheet.eccedenze?.basi || 0} / +{sheet.eccedenze?.coperchi || 0}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                    <button
                      onClick={() => handleLoadSheet(sheet)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      Carica nel Foglio &rarr;
                    </button>
                    {ipcSheets.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm('Vuoi eliminare questa scheda salvata?')) {
                            deleteIPCSheet(sheet.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Elimina scheda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic text-center py-4">Nessuna scheda inventario archiviata.</p>
        )}
      </div>
    </div>
  );
};
