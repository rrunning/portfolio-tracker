import type { Transaction, FIFOLot, Holding, RealizedGain } from '../types';

interface PortfolioData {
  holdings: Holding[];
  realizedGains: RealizedGain[];
}

function processTransactions(transactions: Transaction[]): PortfolioData {
  const byTicker = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    const group = byTicker.get(tx.ticker) ?? [];
    group.push(tx);
    byTicker.set(tx.ticker, group);
  }

  const holdings: Holding[] = [];
  const realizedGains: RealizedGain[] = [];

  for (const [ticker, txs] of byTicker) {
    const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));
    const lots: FIFOLot[] = [];

    for (const tx of sorted) {
      if (tx.type === 'buy') {
        lots.push({ date: tx.date, shares: tx.shares, pricePerShare: tx.pricePerShare });
      } else if (tx.type === 'split') {
        const factor = tx.splitFactor ?? 1;
        for (let i = 0; i < lots.length; i++) {
          lots[i] = {
            ...lots[i],
            shares: lots[i].shares * factor,
            pricePerShare: lots[i].pricePerShare / factor,
          };
        }
      } else {
        let remaining = tx.shares;
        let costBasis = 0;

        while (remaining > 0 && lots.length > 0) {
          if (lots[0].shares <= remaining) {
            costBasis += lots[0].shares * lots[0].pricePerShare;
            remaining -= lots[0].shares;
            lots.shift();
          } else {
            costBasis += remaining * lots[0].pricePerShare;
            lots[0] = { ...lots[0], shares: lots[0].shares - remaining };
            remaining = 0;
          }
        }

        const proceeds = tx.shares * tx.pricePerShare;
        const gainLoss = proceeds - costBasis;
        realizedGains.push({
          transactionId: tx.id,
          ticker,
          date: tx.date,
          shares: tx.shares,
          proceeds,
          costBasis,
          gainLoss,
          gainLossPct: costBasis > 0 ? gainLoss / costBasis : 0,
        });
      }
    }

    const netShares = lots.reduce((sum, lot) => sum + lot.shares, 0);
    if (netShares <= 0) continue;

    const totalInvested = lots.reduce((sum, lot) => sum + lot.shares * lot.pricePerShare, 0);
    holdings.push({
      ticker,
      netShares,
      avgCostBasis: totalInvested / netShares,
      totalInvested,
      lots,
    });
  }

  return { holdings, realizedGains };
}

export function deriveHoldings(transactions: Transaction[]): Holding[] {
  return processTransactions(transactions).holdings;
}

export function deriveRealizedGains(transactions: Transaction[]): RealizedGain[] {
  return processTransactions(transactions).realizedGains;
}

export function derivePortfolio(transactions: Transaction[]): PortfolioData {
  return processTransactions(transactions);
}
