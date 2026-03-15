import type { Transaction, FIFOLot, Holding } from '../types';

export function deriveHoldings(transactions: Transaction[]): Holding[] {
  const byTicker = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    const group = byTicker.get(tx.ticker) ?? [];
    group.push(tx);
    byTicker.set(tx.ticker, group);
  }

  const holdings: Holding[] = [];

  for (const [ticker, txs] of byTicker) {
    const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));
    const lots: FIFOLot[] = [];

    for (const tx of sorted) {
      if (tx.type === 'buy') {
        lots.push({ date: tx.date, shares: tx.shares, pricePerShare: tx.pricePerShare });
      } else {
        let remaining = tx.shares;
        while (remaining > 0 && lots.length > 0) {
          if (lots[0].shares <= remaining) {
            remaining -= lots[0].shares;
            lots.shift();
          } else {
            lots[0] = { ...lots[0], shares: lots[0].shares - remaining };
            remaining = 0;
          }
        }
      }
    }

    const netShares = lots.reduce((sum, lot) => sum + lot.shares, 0);
    if (netShares <= 0) continue;

    const totalInvested = lots.reduce((sum, lot) => sum + lot.shares * lot.pricePerShare, 0);
    const avgCostBasis = totalInvested / netShares;

    holdings.push({ ticker, netShares, avgCostBasis, totalInvested, lots });
  }

  return holdings;
}
