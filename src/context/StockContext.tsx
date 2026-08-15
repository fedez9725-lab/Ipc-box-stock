import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  AppSettings,
  ComponentStock,
  ComputedStockMetrics,
  DamageReport,
  Pila,
  PurchaseOrder,
  ReceptionRecord,
  StackBoxItem,
  StockMovement,
  WorkOrder,
} from '../types';
import {
  initialComponentStock,
  initialDamageReports,
  initialMovements,
  initialOrders,
  initialPiles,
  initialSettings,
  initialWorkOrders,
} from '../data/initialData';

interface StockContextType {
  stock: ComponentStock;
  metrics: ComputedStockMetrics;
  piles: Pila[];
  orders: PurchaseOrder[];
  workOrders: WorkOrder[];
  damageReports: DamageReport[];
  movements: StockMovement[];
  settings: AppSettings;
  activeOperator: string;
  setActiveOperator: (op: string) => void;
  // Actions
  recordReception: (data: {
    ordineId?: string;
    quantitaDichiarata: number;
    boxIntegri: number;
    boxDanneggiati: number;
    basiRotte: number;
    coperchiRotti: number;
    basiMancanti: number;
    coperchiMancanti: number;
    note?: string;
    operatore?: string;
    zona?: string;
  }) => { success: boolean; message: string };
  recordUsage: (data: {
    quantita: number;
    lavorazioneCodice?: string;
    lavorazioneId?: string;
    note?: string;
    operatore?: string;
  }) => { success: boolean; message: string };
  recordDamage: (data: {
    tipoElemento: 'BOX_COMPLETO' | 'BASE' | 'COPERCHIO';
    quantita: number;
    causaDanno: 'CADUTA_CARRELLO' | 'SCHIACCIAMENTO' | 'USURA_LAVORAZIONE' | 'DIFETTO_FORNITURA' | 'GANCIO_ROTTO' | 'ALTRO';
    descrizione: string;
    operatore?: string;
    pilaOrigine?: string;
  }) => { success: boolean; message: string };
  recordRecovery: (data: {
    tipoElemento: 'BOX_COMPLETO' | 'BASE' | 'COPERCHIO';
    quantita: number;
    note?: string;
    operatore?: string;
  }) => { success: boolean; message: string };
  adjustStock: (data: {
    basiIntegre: number;
    coperchiIntegri: number;
    basiRotte: number;
    coperchiRotti: number;
    motivo: string;
    operatore?: string;
  }) => void;
  createOrder: (data: {
    fornitore: string;
    quantitaOrdinata: number;
    dataPrevista?: string;
    note?: string;
  }) => PurchaseOrder;
  updateOrderStatus: (id: string, stato: PurchaseOrder['stato']) => void;
  deleteOrder: (id: string) => void;
  createWorkOrder: (data: {
    codice: string;
    descrizione: string;
    clienteDestinazione: string;
    lineaLavorazione: string;
    quantitaRichiesta: number;
    dataScadenza?: string;
    note?: string;
  }) => WorkOrder;
  updateWorkOrderStatus: (id: string, stato: WorkOrder['stato']) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  rebuildPilesManually: () => void;
  updatePilaZone: (pilaId: string, nuovaZona: string) => void;
  resetAllData: () => void;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

const STORAGE_PREFIX = 'IPC_BOX_SYSTEM_';

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from local storage or fallback to initial data
  const [stock, setStock] = useState<ComponentStock>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}stock`);
    return saved ? JSON.parse(saved) : initialComponentStock;
  });

  const [piles, setPiles] = useState<Pila[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}piles`);
    return saved ? JSON.parse(saved) : initialPiles;
  });

  const [orders, setOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}orders`);
    return saved ? JSON.parse(saved) : initialOrders;
  });

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}workOrders`);
    return saved ? JSON.parse(saved) : initialWorkOrders;
  });

  const [damageReports, setDamageReports] = useState<DamageReport[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}damageReports`);
    return saved ? JSON.parse(saved) : initialDamageReports;
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}movements`);
    return saved ? JSON.parse(saved) : initialMovements;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}settings`);
    return saved ? JSON.parse(saved) : initialSettings;
  });

  const [activeOperator, setActiveOperator] = useState<string>(() => {
    return settings.operatori[0] || 'Marco Rossi (Capoturno)';
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}stock`, JSON.stringify(stock));
  }, [stock]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}piles`, JSON.stringify(piles));
  }, [piles]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}orders`, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}workOrders`, JSON.stringify(workOrders));
  }, [workOrders]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}damageReports`, JSON.stringify(damageReports));
  }, [damageReports]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}movements`, JSON.stringify(movements));
  }, [movements]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(settings));
  }, [settings]);

  // Compute stock metrics
  const metrics = useMemo<ComputedStockMetrics>(() => {
    const boxUtilizzabili = Math.min(Math.max(0, stock.basiIntegre), Math.max(0, stock.coperchiIntegri));
    const basiDisponibili = Math.max(0, stock.basiIntegre);
    const coperchiDisponibili = Math.max(0, stock.coperchiIntegri);
    const basiEccedenti = Math.max(0, basiDisponibili - coperchiDisponibili);
    const coperchiEccedenti = Math.max(0, coperchiDisponibili - basiDisponibili);
    const basiMancantiPerPareggio = coperchiEccedenti;
    const coperchiMancantiPerPareggio = basiEccedenti;
    const totaleBasiRotte = Math.max(0, stock.basiRotte);
    const totaleCoperchiRotti = Math.max(0, stock.coperchiRotti);
    const totaleComponentiRotte = totaleBasiRotte + totaleCoperchiRotti + (stock.boxDanneggiatiTotali || 0);
    const boxInRiparazione = totaleBasiRotte + totaleCoperchiRotti + (stock.boxDanneggiatiTotali || 0);
    const stockTotaleFisico = boxUtilizzabili + basiEccedenti + coperchiEccedenti + totaleComponentiRotte;

    let statoScorta: 'VERDE' | 'GIALLO' | 'ROSSO' = 'VERDE';
    let messaggioAllerta: string | undefined = undefined;

    if (boxUtilizzabili < settings.sogliaMinimaScorta) {
      statoScorta = 'ROSSO';
      messaggioAllerta = `SCORTA IPC BOX SOTTO IL LIVELLO MINIMO: ${boxUtilizzabili} disponibili (Soglia min: ${settings.sogliaMinimaScorta})`;
    } else if (
      boxUtilizzabili <= settings.sogliaAttenzioneScorta ||
      basiEccedenti >= 3 ||
      coperchiEccedenti >= 3 ||
      totaleComponentiRotte >= 4
    ) {
      statoScorta = 'GIALLO';
      if (boxUtilizzabili <= settings.sogliaAttenzioneScorta) {
        messaggioAllerta = `ATTENZIONE: Scorta in avvicinamento alla soglia di sicurezza (${boxUtilizzabili} BOX)`;
      } else if (basiEccedenti > 0 || coperchiEccedenti > 0) {
        messaggioAllerta = `SBILANCIAMENTO COMPONENTI: ${basiEccedenti} basi spaiate o ${coperchiEccedenti} coperchi orfani`;
      }
    }

    return {
      boxUtilizzabili,
      basiDisponibili,
      coperchiDisponibili,
      basiEccedenti,
      coperchiEccedenti,
      basiMancantiPerPareggio,
      coperchiMancantiPerPareggio,
      totaleBasiRotte,
      totaleCoperchiRotti,
      totaleComponentiRotte,
      boxInRiparazione,
      stockTotaleFisico,
      statoScorta,
      messaggioAllerta,
    };
  }, [stock, settings]);

  // Helper to re-generate stacks of max 7 boxes based on usable count and quarantine items
  const generatePilesForStock = (usableCount: number, existingPiles: Pila[]): Pila[] => {
    const maxPerPila = settings.maxBoxPerPila || 7;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    
    // Separate quarantine/damaged stack if present
    const quarantineStack = existingPiles.find(p => p.stato === 'QUARANTENA');

    const totalFullPiles = Math.floor(usableCount / maxPerPila);
    const remainder = usableCount % maxPerPila;
    const totalPilesCount = totalFullPiles + (remainder > 0 ? 1 : 0);

    const zones = settings.zoneDisponibili;
    const newPiles: Pila[] = [];

    let globalBoxIndex = 1;

    for (let pIdx = 0; pIdx < totalPilesCount; pIdx++) {
      const isLast = pIdx === totalPilesCount - 1;
      const countInThisPila = isLast && remainder > 0 ? remainder : maxPerPila;
      const pilaCode = `PILA-${String.fromCharCode(65 + Math.floor(pIdx / 4))}${String((pIdx % 4) + 1).padStart(2, '0')}`;
      
      const zoneIndex = Math.min(Math.floor(pIdx / 3), zones.length - 1);
      const zona = zones[zoneIndex] || 'Area A - Stoccaggio Rapido';

      const pileBoxes: StackBoxItem[] = [];
      for (let b = 1; b <= countInThisPila; b++) {
        pileBoxes.push({
          id: `box-${pIdx + 1}-${b}`,
          pilaId: `pila-${pIdx + 1}`,
          posizione: b,
          stato: 'INTEGRO',
          haBaseIntegra: true,
          haCoperchioIntegro: true,
          codiceSeriale: `IPC-${2026}-${1000 + globalBoxIndex}`,
        });
        globalBoxIndex++;
      }

      newPiles.push({
        id: `pila-${pIdx + 1}`,
        codice: pilaCode,
        zona,
        capienzaMax: maxPerPila,
        stato: countInThisPila === maxPerPila ? 'OTTIMALE' : 'INCOMPLETA',
        dataAggiornamento: nowStr,
        boxes: pileBoxes,
        note: countInThisPila === maxPerPila ? 'Pila completa 7/7' : `Pila parziale ${countInThisPila}/${maxPerPila}`,
      });
    }

    if (quarantineStack) {
      newPiles.push(quarantineStack);
    }

    return newPiles;
  };

  // Helper to add movement
  const addMovement = (
    tipologia: StockMovement['tipologia'],
    quantita: number,
    deltaBasiIntegre: number,
    deltaCoperchiIntegri: number,
    deltaBasiRotte: number,
    deltaCoperchiRotti: number,
    motivo: string,
    note?: string,
    lavorazioneCodice?: string,
    ordineId?: string,
    op?: string
  ) => {
    const newMovement: StockMovement = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      tipologia,
      quantita,
      deltaBasiIntegre,
      deltaCoperchiIntegri,
      deltaBasiRotte,
      deltaCoperchiRotti,
      motivo,
      utente: op || activeOperator,
      lavorazioneCodice,
      ordineId,
      note,
    };
    setMovements(prev => [newMovement, ...prev]);
  };

  // 1. Record Reception
  const recordReception = (data: {
    ordineId?: string;
    quantitaDichiarata: number;
    boxIntegri: number;
    boxDanneggiati: number;
    basiRotte: number;
    coperchiRotti: number;
    basiMancanti: number;
    coperchiMancanti: number;
    note?: string;
    operatore?: string;
    zona?: string;
  }) => {
    const op = data.operatore || activeOperator;
    const effUtilizzabili = data.boxIntegri;
    const discrepanza = (data.quantitaDichiarata || 0) - (data.boxIntegri + data.boxDanneggiati);

    const receptionId = `rec-${Date.now()}`;
    const newReception: ReceptionRecord = {
      id: receptionId,
      ordineId: data.ordineId,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      operatore: op,
      quantitaDichiarataBolla: data.quantitaDichiarata,
      boxRicevutiIntegri: data.boxIntegri,
      boxRicevutiDanneggiati: data.boxDanneggiati,
      basiRotte: data.basiRotte,
      coperchiRotti: data.coperchiRotti,
      basiMancanti: data.basiMancanti,
      coperchiMancanti: data.coperchiMancanti,
      quantitaEffettivamenteUtilizzabile: effUtilizzabili,
      discrepanza,
      note: data.note,
      assegnazioneZona: data.zona || 'Zona Ricezione & Buffer',
    };

    // Update Stock
    setStock(prev => {
      const nextStock: ComponentStock = {
        ...prev,
        basiIntegre: prev.basiIntegre + data.boxIntegri,
        coperchiIntegri: prev.coperchiIntegri + data.boxIntegri,
        basiRotte: prev.basiRotte + data.basiRotte,
        coperchiRotti: prev.coperchiRotti + data.coperchiRotti,
        boxDanneggiatiTotali: prev.boxDanneggiatiTotali + data.boxDanneggiati,
      };

      if (settings.autoDistribuzionePile) {
        const nextUsable = Math.min(nextStock.basiIntegre, nextStock.coperchiIntegri);
        setPiles(currPiles => generatePilesForStock(nextUsable, currPiles));
      }

      return nextStock;
    });

    // Update Order if specified
    if (data.ordineId) {
      setOrders(prevOrders =>
        prevOrders.map(ord => {
          if (ord.id === data.ordineId) {
            const totRicevuta = ord.quantitaRicevuta + data.boxIntegri + data.boxDanneggiati;
            const daRicevere = Math.max(0, ord.quantitaOrdinata - totRicevuta);
            const stato = daRicevere === 0 ? 'COMPLETATO' : 'PARZIALE';
            return {
              ...ord,
              quantitaRicevuta: totRicevuta,
              quantitaDaRicevere: daRicevere,
              stato,
              ricezioni: [newReception, ...(ord.ricezioni || [])],
            };
          }
          return ord;
        })
      );
    }

    // Add Movement
    addMovement(
      'RICEZIONE',
      data.boxIntegri + data.boxDanneggiati,
      data.boxIntegri,
      data.boxIntegri,
      data.basiRotte,
      data.coperchiRotti,
      data.ordineId ? `Ricezione per ordine ${data.ordineId}` : 'Ricezione carico fornitura diretta',
      data.note,
      undefined,
      data.ordineId,
      op
    );

    return {
      success: true,
      message: `Caricati con successo ${data.boxIntegri} IPC BOX integri utilizzabili.${
        data.boxDanneggiati > 0 || data.basiRotte > 0 || data.coperchiRotti > 0
          ? ` Rilevati componenti non conformi: ${data.boxDanneggiati} box danneggiati, ${data.basiRotte} basi rotte, ${data.coperchiRotti} coperchi rotti.`
          : ''
      }`,
    };
  };

  // 2. Record Usage
  const recordUsage = (data: {
    quantita: number;
    lavorazioneCodice?: string;
    lavorazioneId?: string;
    note?: string;
    operatore?: string;
  }) => {
    const op = data.operatore || activeOperator;
    const usable = Math.min(stock.basiIntegre, stock.coperchiIntegri);

    if (data.quantita > usable) {
      return {
        success: false,
        message: `ERRORE: Quantità richiesta (${data.quantita}) superiore agli IPC BOX utilizzabili disponibili (${usable}). Impossibile procedere.`,
      };
    }

    setStock(prev => {
      const nextStock: ComponentStock = {
        ...prev,
        basiIntegre: Math.max(0, prev.basiIntegre - data.quantita),
        coperchiIntegri: Math.max(0, prev.coperchiIntegri - data.quantita),
      };

      if (settings.autoDistribuzionePile) {
        const nextUsable = Math.min(nextStock.basiIntegre, nextStock.coperchiIntegri);
        setPiles(currPiles => generatePilesForStock(nextUsable, currPiles));
      }

      return nextStock;
    });

    // Update WorkOrder if linked
    if (data.lavorazioneId) {
      setWorkOrders(prev =>
        prev.map(wo => {
          if (wo.id === data.lavorazioneId) {
            const nextAssegnata = wo.quantitaAssegnata + data.quantita;
            const stato = nextAssegnata >= wo.quantitaRichiesta ? 'COMPLETATA' : 'IN_CORSO';
            return {
              ...wo,
              quantitaAssegnata: nextAssegnata,
              stato,
              dataCompletamento: stato === 'COMPLETATA' ? new Date().toISOString().replace('T', ' ').substring(0, 16) : wo.dataCompletamento,
            };
          }
          return wo;
        })
      );
    }

    addMovement(
      'UTILIZZO',
      data.quantita,
      -data.quantita,
      -data.quantita,
      0,
      0,
      data.lavorazioneCodice ? `Scarico per lavorazione ${data.lavorazioneCodice}` : 'Scarico per lavorazione logistica',
      data.note,
      data.lavorazioneCodice,
      undefined,
      op
    );

    return {
      success: true,
      message: `Scaricati con successo ${data.quantita} IPC BOX per la lavorazione. Ricalcolo pile completato.`,
    };
  };

  // 3. Record Damage
  const recordDamage = (data: {
    tipoElemento: 'BOX_COMPLETO' | 'BASE' | 'COPERCHIO';
    quantita: number;
    causaDanno: 'CADUTA_CARRELLO' | 'SCHIACCIAMENTO' | 'USURA_LAVORAZIONE' | 'DIFETTO_FORNITURA' | 'GANCIO_ROTTO' | 'ALTRO';
    descrizione: string;
    operatore?: string;
    pilaOrigine?: string;
  }) => {
    const op = data.operatore || activeOperator;

    setStock(prev => {
      let nextBasiIntegre = prev.basiIntegre;
      let nextCoperchiIntegri = prev.coperchiIntegri;
      let nextBasiRotte = prev.basiRotte;
      let nextCoperchiRotti = prev.coperchiRotti;
      let nextBoxDanneggiati = prev.boxDanneggiatiTotali;

      let deltaBasiIntegre = 0;
      let deltaCoperchiIntegri = 0;
      let deltaBasiRotte = 0;
      let deltaCoperchiRotti = 0;

      if (data.tipoElemento === 'BOX_COMPLETO') {
        nextBasiIntegre = Math.max(0, prev.basiIntegre - data.quantita);
        nextCoperchiIntegri = Math.max(0, prev.coperchiIntegri - data.quantita);
        nextBoxDanneggiati += data.quantita;
        deltaBasiIntegre = -data.quantita;
        deltaCoperchiIntegri = -data.quantita;
      } else if (data.tipoElemento === 'BASE') {
        nextBasiIntegre = Math.max(0, prev.basiIntegre - data.quantita);
        nextBasiRotte += data.quantita;
        deltaBasiIntegre = -data.quantita;
        deltaBasiRotte = data.quantita;
      } else if (data.tipoElemento === 'COPERCHIO') {
        nextCoperchiIntegri = Math.max(0, prev.coperchiIntegri - data.quantita);
        nextCoperchiRotti += data.quantita;
        deltaCoperchiIntegri = -data.quantita;
        deltaCoperchiRotti = data.quantita;
      }

      addMovement(
        'ROTTURA',
        data.quantita,
        deltaBasiIntegre,
        deltaCoperchiIntegri,
        deltaBasiRotte,
        deltaCoperchiRotti,
        `Danno riscontrato: ${data.tipoElemento} (${data.causaDanno})`,
        data.descrizione,
        undefined,
        undefined,
        op
      );

      const nextStock: ComponentStock = {
        ...prev,
        basiIntegre: nextBasiIntegre,
        coperchiIntegri: nextCoperchiIntegri,
        basiRotte: nextBasiRotte,
        coperchiRotti: nextCoperchiRotti,
        boxDanneggiatiTotali: nextBoxDanneggiati,
      };

      if (settings.autoDistribuzionePile) {
        const nextUsable = Math.min(nextStock.basiIntegre, nextStock.coperchiIntegri);
        setPiles(currPiles => generatePilesForStock(nextUsable, currPiles));
      }

      return nextStock;
    });

    const newReport: DamageReport = {
      id: `dam-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      operatore: op,
      tipoElemento: data.tipoElemento,
      stato: 'ROTTO',
      quantita: data.quantita,
      causaDanno: data.causaDanno,
      descrizione: data.descrizione,
      pilaOrigine: data.pilaOrigine,
      risolto: false,
    };

    setDamageReports(prev => [newReport, ...prev]);

    return {
      success: true,
      message: `Registrato danno per ${data.quantita} ${data.tipoElemento}. Stock utilizzabile aggiornato automaticamente.`,
    };
  };

  // 4. Record Recovery / Repair
  const recordRecovery = (data: {
    tipoElemento: 'BOX_COMPLETO' | 'BASE' | 'COPERCHIO';
    quantita: number;
    note?: string;
    operatore?: string;
  }) => {
    const op = data.operatore || activeOperator;

    setStock(prev => {
      let nextBasiIntegre = prev.basiIntegre;
      let nextCoperchiIntegri = prev.coperchiIntegri;
      let nextBasiRotte = prev.basiRotte;
      let nextCoperchiRotti = prev.coperchiRotti;
      let nextBoxDanneggiati = prev.boxDanneggiatiTotali;

      let deltaBasiIntegre = 0;
      let deltaCoperchiIntegri = 0;
      let deltaBasiRotte = 0;
      let deltaCoperchiRotti = 0;

      if (data.tipoElemento === 'BOX_COMPLETO') {
        const q = Math.min(data.quantita, nextBoxDanneggiati);
        nextBoxDanneggiati = Math.max(0, nextBoxDanneggiati - q);
        nextBasiIntegre += q;
        nextCoperchiIntegri += q;
        deltaBasiIntegre = q;
        deltaCoperchiIntegri = q;
      } else if (data.tipoElemento === 'BASE') {
        const q = Math.min(data.quantita, nextBasiRotte);
        nextBasiRotte = Math.max(0, nextBasiRotte - q);
        nextBasiIntegre += q;
        deltaBasiIntegre = q;
        deltaBasiRotte = -q;
      } else if (data.tipoElemento === 'COPERCHIO') {
        const q = Math.min(data.quantita, nextCoperchiRotti);
        nextCoperchiRotti = Math.max(0, nextCoperchiRotti - q);
        nextCoperchiIntegri += q;
        deltaCoperchiIntegri = q;
        deltaCoperchiRotti = -q;
      }

      addMovement(
        'RECUPERO',
        data.quantita,
        deltaBasiIntegre,
        deltaCoperchiIntegri,
        deltaBasiRotte,
        deltaCoperchiRotti,
        `Recupero e ripristino componente: ${data.tipoElemento}`,
        data.note,
        undefined,
        undefined,
        op
      );

      const nextStock: ComponentStock = {
        ...prev,
        basiIntegre: nextBasiIntegre,
        coperchiIntegri: nextCoperchiIntegri,
        basiRotte: nextBasiRotte,
        coperchiRotti: nextCoperchiRotti,
        boxDanneggiatiTotali: nextBoxDanneggiati,
      };

      if (settings.autoDistribuzionePile) {
        const nextUsable = Math.min(nextStock.basiIntegre, nextStock.coperchiIntegri);
        setPiles(currPiles => generatePilesForStock(nextUsable, currPiles));
      }

      return nextStock;
    });

    return {
      success: true,
      message: `Recuperati ${data.quantita} ${data.tipoElemento}. Disponibilità e pile riallineate.`,
    };
  };

  // 5. Adjust Stock
  const adjustStock = (data: {
    basiIntegre: number;
    coperchiIntegri: number;
    basiRotte: number;
    coperchiRotti: number;
    motivo: string;
    operatore?: string;
  }) => {
    const op = data.operatore || activeOperator;
    const deltaBasi = data.basiIntegre - stock.basiIntegre;
    const deltaCoperchi = data.coperchiIntegri - stock.coperchiIntegri;

    setStock(prev => {
      const nextStock: ComponentStock = {
        ...prev,
        basiIntegre: Math.max(0, data.basiIntegre),
        coperchiIntegri: Math.max(0, data.coperchiIntegri),
        basiRotte: Math.max(0, data.basiRotte),
        coperchiRotti: Math.max(0, data.coperchiRotti),
      };

      if (settings.autoDistribuzionePile) {
        const nextUsable = Math.min(nextStock.basiIntegre, nextStock.coperchiIntegri);
        setPiles(currPiles => generatePilesForStock(nextUsable, currPiles));
      }

      return nextStock;
    });

    addMovement(
      'RETTIFICA',
      Math.abs(deltaBasi) + Math.abs(deltaCoperchi),
      deltaBasi,
      deltaCoperchi,
      data.basiRotte - stock.basiRotte,
      data.coperchiRotti - stock.coperchiRotti,
      `Rettifica inventariale: ${data.motivo}`,
      `Basi: ${stock.basiIntegre} -> ${data.basiIntegre} | Coperchi: ${stock.coperchiIntegri} -> ${data.coperchiIntegri}`,
      undefined,
      undefined,
      op
    );
  };

  // 6. Create Purchase Order
  const createOrder = (data: {
    fornitore: string;
    quantitaOrdinata: number;
    dataPrevista?: string;
    note?: string;
  }) => {
    const count = orders.length + 43;
    const orderId = `ord-2026-${String(count).padStart(3, '0')}`;
    const codiceOrdine = `ORD-IPC-2026-${String(count).padStart(3, '0')}`;
    const nowStr = new Date().toISOString().substring(0, 10);

    const newOrder: PurchaseOrder = {
      id: orderId,
      codiceOrdine,
      fornitore: data.fornitore,
      dataOrdine: nowStr,
      dataPrevista: data.dataPrevista,
      quantitaOrdinata: data.quantitaOrdinata,
      quantitaRicevuta: 0,
      quantitaDaRicevere: data.quantitaOrdinata,
      stato: 'IN_ATTESA',
      note: data.note,
      ricezioni: [],
    };

    setOrders(prev => [newOrder, ...prev]);

    addMovement(
      'ORDINE',
      data.quantitaOrdinata,
      0,
      0,
      0,
      0,
      `Nuovo ordine fornitore emesso: ${codiceOrdine} (${data.fornitore})`,
      data.note,
      undefined,
      orderId,
      activeOperator
    );

    return newOrder;
  };

  const updateOrderStatus = (id: string, stato: PurchaseOrder['stato']) => {
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, stato } : o)));
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  // 7. Create Work Order
  const createWorkOrder = (data: {
    codice: string;
    descrizione: string;
    clienteDestinazione: string;
    lineaLavorazione: string;
    quantitaRichiesta: number;
    dataScadenza?: string;
    note?: string;
  }) => {
    const newWo: WorkOrder = {
      id: `wo-${Date.now()}`,
      codice: data.codice,
      descrizione: data.descrizione,
      clienteDestinazione: data.clienteDestinazione,
      lineaLavorazione: data.lineaLavorazione,
      dataCreazione: new Date().toISOString().replace('T', ' ').substring(0, 16),
      dataScadenza: data.dataScadenza,
      quantitaRichiesta: data.quantitaRichiesta,
      quantitaAssegnata: 0,
      stato: 'PIANIFICATA',
      operatore: activeOperator,
      note: data.note,
    };

    setWorkOrders(prev => [newWo, ...prev]);
    return newWo;
  };

  const updateWorkOrderStatus = (id: string, stato: WorkOrder['stato']) => {
    setWorkOrders(prev => prev.map(wo => (wo.id === id ? { ...wo, stato } : wo)));
  };

  // 8. Settings & Pile Manual operations
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      return updated;
    });
  };

  const rebuildPilesManually = () => {
    const usable = Math.min(stock.basiIntegre, stock.coperchiIntegri);
    setPiles(currPiles => generatePilesForStock(usable, currPiles));
  };

  const updatePilaZone = (pilaId: string, nuovaZona: string) => {
    setPiles(prev =>
      prev.map(p =>
        p.id === pilaId
          ? {
              ...p,
              zona: nuovaZona,
              dataAggiornamento: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : p
      )
    );
  };

  const resetAllData = () => {
    setStock(initialComponentStock);
    setPiles(initialPiles);
    setOrders(initialOrders);
    setWorkOrders(initialWorkOrders);
    setDamageReports(initialDamageReports);
    setMovements(initialMovements);
    setSettings(initialSettings);
  };

  return (
    <StockContext.Provider
      value={{
        stock,
        metrics,
        piles,
        orders,
        workOrders,
        damageReports,
        movements,
        settings,
        activeOperator,
        setActiveOperator,
        recordReception,
        recordUsage,
        recordDamage,
        recordRecovery,
        adjustStock,
        createOrder,
        updateOrderStatus,
        deleteOrder,
        createWorkOrder,
        updateWorkOrderStatus,
        updateSettings,
        rebuildPilesManually,
        updatePilaZone,
        resetAllData,
      }}
    >
      {children}
    </StockContext.Provider>
  );
};

export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};
