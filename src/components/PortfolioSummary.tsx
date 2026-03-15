import { useMemo } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { deriveHoldings } from '../utils/fifo';

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const pct = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2 });

export default function PortfolioSummary() {
  const transactions = usePortfolioStore((s) => s.transactions);
  const prices = usePortfolioStore((s) => s.prices);

  const holdings = useMemo(() => deriveHoldings(transactions), [transactions]);

  if (holdings.length === 0) return null;

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

  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPct = totalCost > 0 ? totalGainLoss / totalCost : 0;
  const isPositive = totalGainLoss >= 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <SummaryCard label="Total Cost Basis" value={fmt.format(totalCost)} />
      <SummaryCard
        label="Market Value"
        value={allPricesLoaded ? fmt.format(totalValue) : '—'}
        muted={!allPricesLoaded}
      />
      <SummaryCard
        label="Total Gain / Loss"
        value={
          allPricesLoaded
            ? `${isPositive ? '+' : ''}${fmt.format(totalGainLoss)}`
            : '—'
        }
        accent={allPricesLoaded ? (isPositive ? 'green' : 'red') : undefined}
        muted={!allPricesLoaded}
      />
      <SummaryCard
        label="Return"
        value={
          allPricesLoaded
            ? `${isPositive ? '+' : ''}${pct.format(totalGainLossPct)}`
            : '—'
        }
        accent={allPricesLoaded ? (isPositive ? 'green' : 'red') : undefined}
        muted={!allPricesLoaded}
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
