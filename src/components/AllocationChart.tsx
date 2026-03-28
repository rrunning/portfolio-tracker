import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { deriveHoldings } from '../utils/fifo';

const COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#06b6d4', '#f97316', '#84cc16', '#6366f1', '#14b8a6',
];

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const pct = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1 });

interface SliceData {
  ticker: string;
  value: number;
  allocation: number;
  usingCostBasis: boolean;
}

export default function AllocationChart() {
  const transactions = usePortfolioStore((s) => s.transactions);
  const prices = usePortfolioStore((s) => s.prices);

  const holdings = useMemo(() => deriveHoldings(transactions), [transactions]);

  const data = useMemo<SliceData[]>(() => {
    const items = holdings.map((h) => {
      const price = prices[h.ticker];
      const value = price !== undefined ? price * h.netShares : h.totalInvested;
      return { ticker: h.ticker, value, usingCostBasis: price === undefined };
    });
    const total = items.reduce((sum, i) => sum + i.value, 0);
    return items
      .map((i) => ({ ...i, allocation: total > 0 ? i.value / total : 0 }))
      .sort((a, b) => b.value - a.value);
  }, [holdings, prices]);

  if (data.length === 0) return null;

  const anyUsingCostBasis = data.some((d) => d.usingCostBasis);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 min-w-0">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          Portfolio Allocation
        </h2>
        {anyUsingCostBasis && (
          <span className="text-xs text-gray-600">* using cost basis (price unavailable)</span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-8">
        {/* Donut chart */}
        <div className="flex-shrink-0">
          <PieChart width={200} height={200}>
            <Pie
              data={data}
              cx={100}
              cy={100}
              innerRadius={58}
              outerRadius={96}
              dataKey="value"
              strokeWidth={2}
              stroke="#111827"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as SliceData;
                return (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm shadow-lg">
                    <p className="font-mono font-bold text-white mb-1">{d.ticker}</p>
                    <p className="text-gray-300">{fmt.format(d.value)}{d.usingCostBasis ? '*' : ''}</p>
                    <p className="text-gray-400">{pct.format(d.allocation)}</p>
                  </div>
                );
              }}
            />
          </PieChart>
        </div>

        {/* Legend with allocation bars */}
        <div className="flex flex-col gap-2.5 flex-1 w-full min-w-0">
          {data.map((d, i) => (
            <div key={d.ticker} className="flex items-center gap-3 text-sm">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="font-mono font-bold text-white w-14 flex-shrink-0">{d.ticker}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden min-w-0">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${d.allocation * 100}%`,
                    backgroundColor: COLORS[i % COLORS.length],
                  }}
                />
              </div>
              <span className="text-gray-400 w-12 text-right flex-shrink-0">
                {pct.format(d.allocation)}
              </span>
              <span className="text-gray-300 w-24 text-right flex-shrink-0 hidden sm:block">
                {fmt.format(d.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
