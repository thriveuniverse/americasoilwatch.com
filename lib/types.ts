// AmericasOilWatch — Core Types

export type CountryCode =
  | 'US' | 'CA' | 'MX' | 'BR' | 'VE' | 'CO' | 'EC' | 'PE'
  | 'AR' | 'GY' | 'TT' | 'BO' | 'CL' | 'PY' | 'UY' | 'SR';

export type ReserveStatus = 'safe' | 'watch' | 'warning' | 'critical';

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
