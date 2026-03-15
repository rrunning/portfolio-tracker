export interface Transaction {
  id: string;
  ticker: string;
  type: 'buy' | 'sell' | 'split';
  date: string; // YYYY-MM-DD
  shares: number;        // buy/sell: actual shares; split: 0
  pricePerShare: number; // buy/sell: price; split: 0
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
