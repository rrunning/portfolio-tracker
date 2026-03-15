export interface Transaction {
  id: string;
  ticker: string;
  type: 'buy' | 'sell' | 'split' | 'dividend';
  date: string; // YYYY-MM-DD
  shares: number;        // buy/sell/dividend: actual shares; split: 0
  pricePerShare: number; // buy/sell: price; dividend: amount/share; split: 0
  splitFactor?: number;  // split only — e.g. 10 for a 10:1 split
}

export interface FIFOLot {
  date: string;
  shares: number;
  pricePerShare: number;
}

export interface Holding {
  ticker: string;
  netShares: number;
  avgCostBasis: number;
  totalInvested: number;
  lots: FIFOLot[];
}

export interface RealizedGain {
  transactionId: string;
  ticker: string;
  date: string;
  shares: number;
  proceeds: number;
  costBasis: number;
  gainLoss: number;
  gainLossPct: number;
}

export interface PriceMap {
  [ticker: string]: number;
}

export interface DividendSuggestion {
  ticker: string;
  date: string;        // ex-date YYYY-MM-DD
  amountPerShare: number;
  sharesHeld: number;
  totalAmount: number;
}

export interface HistoryData {
  dates: string[];
  prices: Record<string, (number | null)[]>;
  dividends: Record<string, { date: string; amount: number }[]>;
}

export interface DividendPrefill {
  ticker: string;
  date: string;
  amountPerShare: number;
  sharesHeld: number;
}
