// AmericasOilWatch — Core Types

export type CountryCode =
  | 'US' | 'CA' | 'MX' | 'BR' | 'VE' | 'CO' | 'EC' | 'PE'
  | 'AR' | 'GY' | 'TT' | 'BO' | 'CL' | 'PY' | 'UY' | 'SR';

export type ReserveStatus = 'safe' | 'watch' | 'warning' | 'critical';

// ------------------------------------------------------------
// EIA Weekly Petroleum Data (US-centric, published weekly)
// ------------------------------------------------------------

export interface EIAWeeklyStocks {
  lastUpdated: string;
  weekEnding: string;
  /** US commercial crude stocks, million barrels */
  crudeMb: number;
  crudeMbChange: number;
  /** US gasoline stocks, million barrels */
  gasolineMb: number;
  gasolineMbChange: number;
  /** US distillate stocks (diesel/heating oil), million barrels */
  distillateMb: number;
  distillateMbChange: number;
  /** SPR (Strategic Petroleum Reserve), million barrels */
  sprMb: number;
  /** US crude production, thousand bpd */
  productionKbpd: number;
  dataSource: string;
}

export interface EIARetailPrices {
  lastUpdated: string;
  weekEnding: string;
  /** US national average gasoline, USD/gallon */
  gasolineUsdGal: number;
  gasolineChangeUsdGal: number;
  /** US national average diesel, USD/gallon */
  dieselUsdGal: number;
  dieselChangeUsdGal: number;
  dataSource: string;
}

// ------------------------------------------------------------
// WTI Crude price
// ------------------------------------------------------------

export interface WTIData {
  lastUpdated: string;
  priceUsd: number;
  changeUsd: number;
  changePct: number;
  weekEnding: string;
  dataSource: string;
}

// ------------------------------------------------------------
// Country Producer Snapshot (static + updated by analysis)
// ------------------------------------------------------------

export interface CountryProducer {
  code: CountryCode;
  name: string;
  flag: string;
  /** Approximate production in thousand bpd */
  productionKbpd: number;
  productionTrend: 'rising' | 'stable' | 'falling';
  /** Key crude grades */
  keyGrades: string[];
  /** Notable context */
  note: string;
  status: ReserveStatus;
}

// ------------------------------------------------------------
// AI Analysis
// ------------------------------------------------------------

export interface AIAnalysis {
  generatedAt: string;
  statusLine: string;
  overallStatus: ReserveStatus;
  fullAnalysis: string;
  keyPoints: string[];
  dataPeriod: string;
  model: string;
}

// ------------------------------------------------------------
// Brent (shared with other sites)
// ------------------------------------------------------------

export interface BrentData {
  lastUpdated: string;
  priceUsd: number;
  priceEur: number;
  changeUsd: number;
  changePct: number;
  dataSource: string;
}
