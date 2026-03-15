export interface Transaction {
  id: string;
  ticker: string;
  type: 'buy' | 'sell';
  date: string; // YYYY-MM-DD
  shares: number;
  pricePerShare: number;
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

export interface PriceMap {
  [ticker: string]: number;
}
