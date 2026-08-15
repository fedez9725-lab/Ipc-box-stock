export type MovementType =
  | 'RICEZIONE'
  | 'UTILIZZO'
  | 'ROTTURA'
  | 'MANCANZA'
  | 'RECUPERO'
  | 'RETTIFICA'
  | 'ORDINE';

export type OrderStatus = 'IN_ATTESA' | 'PARZIALE' | 'COMPLETATO' | 'ANNULLATO';

export type WorkOrderStatus = 'PIANIFICATA' | 'IN_CORSO' | 'COMPLETATA' | 'ANNULLATA';

export type BoxComponentStatus = 'INTEGRO' | 'ROTTO' | 'MANCANTE';

export type StackStatus = 'OTTIMALE' | 'QUASI_PIENA' | 'INCOMPLETA' | 'QUARANTENA';

export interface ComponentStock {
  basiIntegre: number;
  coperchiIntegri: number;
  basiRotte: number;
  coperchiRotti: number;
  basiMancanti: number;
  coperchiMancanti: number;
  boxDanneggiatiTotali: number; // Box completi ma con danni strutturali
}

export interface ComputedStockMetrics {
  boxUtilizzabili: number;        // min(basiIntegre, coperchiIntegri)
  basiDisponibili: number;        // basiIntegre
  coperchiDisponibili: number;    // coperchiIntegri
  basiEccedenti: number;          // max(0, basiIntegre - coperchiIntegri)
  coperchiEccedenti: number;      // max(0, coperchiIntegri - basiIntegre)
  basiMancantiPerPareggio: number;// coperchiEccedenti (quante basi servono per completare i coperchi orfani)
  coperchiMancantiPerPareggio: number; // basiEccedenti (quanti coperchi servono per completare le basi orfane)
  totaleBasiRotte: number;        // basiRotte
  totaleCoperchiRotti: number;    // coperchiRotti
  totaleComponentiRotte: number;  // basiRotte + coperchiRotti + boxDanneggiatiTotali
  boxInRiparazione: number;       // basiRotte + coperchiRotti
  stockTotaleFisico: number;      // boxUtilizzabili + componenti sbilanciati o danneggiati
  statoScorta: 'VERDE' | 'GIALLO' | 'ROSSO';
  messaggioAllerta?: string;
}

export interface StackBoxItem {
  id: string;
  pilaId: string;
  posizione: number; // da 1 a 7 (dal basso verso l'alto)
  stato: 'INTEGRO' | 'DANNEGGIATO' | 'DISACCOPPIATO';
  haBaseIntegra: boolean;
  haCoperchioIntegro: boolean;
  codiceSeriale?: string;
  note?: string;
}

export interface Pila {
  id: string;
  codice: string;
  zona: string; // es: "Area A - Corsia 1", "Area Stoccaggio B", "Zona Quarantena"
  capienzaMax: number; // standard 7
  boxes: StackBoxItem[];
  note?: string;
  stato: StackStatus;
  dataAggiornamento: string;
}

export interface StockMovement {
  id: string;
  timestamp: string;
  tipologia: MovementType;
  quantita: number;
  deltaBasiIntegre: number;
  deltaCoperchiIntegri: number;
  deltaBasiRotte: number;
  deltaCoperchiRotti: number;
  motivo: string;
  utente: string;
  lavorazioneCodice?: string;
  ordineId?: string;
  note?: string;
}

export interface ReceptionRecord {
  id: string;
  ordineId?: string;
  lineaRiferimento?: string;
  timestamp: string;
  operatore: string;
  quantitaDichiarataBolla: number;
  boxRicevutiIntegri: number;
  boxRicevutiDanneggiati: number;
  basiRotte: number;
  coperchiRotti: number;
  basiMancanti: number;
  coperchiMancanti: number;
  quantitaEffettivamenteUtilizzabile: number;
  discrepanza: number;
  note?: string;
  assegnazioneZona?: string;
}

export interface PurchaseOrder {
  id: string;
  codiceOrdine: string;
  fornitore: string;
  dataOrdine: string;
  dataPrevista?: string;
  quantitaOrdinata: number;
  quantitaRicevuta: number;
  quantitaDaRicevere: number;
  stato: OrderStatus;
  note?: string;
  ricezioni: ReceptionRecord[];
}

export interface WorkOrder {
  id: string;
  codice: string;
  descrizione: string;
  clienteDestinazione: string;
  lineaLavorazione: string;
  dataCreazione: string;
  dataScadenza?: string;
  quantitaRichiesta: number;
  quantitaAssegnata: number;
  stato: WorkOrderStatus;
  operatore: string;
  note?: string;
  dataCompletamento?: string;
}

export interface DamageReport {
  id: string;
  timestamp: string;
  operatore: string;
  tipoElemento: 'BOX_COMPLETO' | 'BASE' | 'COPERCHIO';
  stato: BoxComponentStatus;
  quantita: number;
  causaDanno: 'CADUTA_CARRELLO' | 'SCHIACCIAMENTO' | 'USURA_LAVORAZIONE' | 'DIFETTO_FORNITURA' | 'GANCIO_ROTTO' | 'ALTRO';
  descrizione: string;
  pilaOrigine?: string;
  risolto: boolean;
}

export interface AppSettings {
  sogliaMinimaScorta: number;      // es: 30
  sogliaAttenzioneScorta: number;  // es: 50
  maxBoxPerPila: number;           // standard 7
  scortaSicurezzaDefault: number;  // es: 10
  nomeHub: string;
  codiceHub: string;
  zoneDisponibili: string[];
  operatori: string[];
  autoDistribuzionePile: boolean;
}
