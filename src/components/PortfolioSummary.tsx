import { useMemo } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { derivePortfolio } from '../utils/fifo';

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const pct = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2 });

export default function PortfolioSummary() {
  const transactions = usePortfolioStore((s) => s.transactions);
  const prices = usePortfolioStore((s) => s.prices);

  const { holdings, realizedGains } = useMemo(() => derivePortfolio(transactions), [transactions]);

  const totalDividendIncome = transactions
    .filter((t) => t.type === 'dividend')
    .reduce((sum, t) => sum + t.shares * t.pricePerShare, 0);

  if (holdings.length === 0 && realizedGains.length === 0 && totalDividendIncome === 0) return null;

  let totalCost = 0;
  let totalValue = 0;
  let allPricesLoaded = true;

  for (const h of holdings) {
    const price = prices[h.ticker];
    totalCost += h.totalInvested;
    if (price !== undefined) {
      totalValue += price * h.netShares;
    } else {
      allPricesLoaded = false;
    }
  }

  const unrealizedGainLoss = totalValue - totalCost;
  const unrealizedGainLossPct = totalCost > 0 ? unrealizedGainLoss / totalCost : 0;
  const isUnrealizedPositive = unrealizedGainLoss >= 0;

  const totalRealizedGainLoss = realizedGains.reduce((sum, g) => sum + g.gainLoss, 0);
  const totalRealizedCost = realizedGains.reduce((sum, g) => sum + g.costBasis, 0);
  const totalRealizedPct = totalRealizedCost > 0 ? totalRealizedGainLoss / totalRealizedCost : 0;
  const isRealizedPositive = totalRealizedGainLoss >= 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <SummaryCard label="Total Cost Basis" value={fmt.format(totalCost)} />
      <SummaryCard
        label="Market Value"
        value={allPricesLoaded ? fmt.format(totalValue) : '—'}
        muted={!allPricesLoaded}
      />
      <SummaryCard
        label="Unrealized G/L"
        value={
          allPricesLoaded
            ? `${isUnrealizedPositive ? '+' : ''}${fmt.format(unrealizedGainLoss)}`
            : '—'
        }
        accent={allPricesLoaded ? (isUnrealizedPositive ? 'green' : 'red') : undefined}
        muted={!allPricesLoaded}
      />
      <SummaryCard
        label="Unrealized Return"
        value={
          allPricesLoaded
            ? `${isUnrealizedPositive ? '+' : ''}${pct.format(unrealizedGainLossPct)}`
            : '—'
        }
        accent={allPricesLoaded ? (isUnrealizedPositive ? 'green' : 'red') : undefined}
        muted={!allPricesLoaded}
      />
      <SummaryCard
        label="Realized G/L"
        value={
          realizedGains.length > 0
            ? `${isRealizedPositive ? '+' : ''}${fmt.format(totalRealizedGainLoss)} (${isRealizedPositive ? '+' : ''}${pct.format(totalRealizedPct)})`
            : '—'
        }
        accent={realizedGains.length > 0 ? (isRealizedPositive ? 'green' : 'red') : undefined}
        muted={realizedGains.length === 0}
      />
      <SummaryCard
        label="Dividend Income"
        value={totalDividendIncome > 0 ? fmt.format(totalDividendIncome) : '—'}
        accent={totalDividendIncome > 0 ? 'green' : undefined}
        muted={totalDividendIncome === 0}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
  muted,
}: {
  label: string;
  value: string;
  accent?: 'green' | 'red';
  muted?: boolean;
}) {
  const valueColor =
    accent === 'green'
      ? 'text-green-400'
      : accent === 'red'
      ? 'text-red-400'
      : muted
      ? 'text-gray-600'
      : 'text-white';

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-semibold ${valueColor}`}>{value}</p>
    </div>
  );
}
