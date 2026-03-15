import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { usePortfolioStore } from '../store/usePortfolioStore';
import type { Transaction } from '../types';

type SubTab = 'value' | 'performance';
type Range = '1mo' | '3mo' | '6mo' | 'ytd' | '1y' | 'all';

const RANGES: { label: string; key: Range }[] = [
  { label: '1M',  key: '1mo' },
  { label: '3M',  key: '3mo' },
  { label: '6M',  key: '6mo' },
  { label: 'YTD', key: 'ytd' },
  { label: '1Y',  key: '1y' },
  { label: 'All', key: 'all' },
];

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(2)}%`;

function getPeriodStart(range: Range, firstTxDate: string): string {
  const today = new Date();
  let d: Date;
  switch (range) {
    case '1mo': d = new Date(today); d.setMonth(d.getMonth() - 1); break;
    case '3mo': d = new Date(today); d.setMonth(d.getMonth() - 3); break;
    case '6mo': d = new Date(today); d.setMonth(d.getMonth() - 6); break;
    case 'ytd': d = new Date(today.getFullYear(), 0, 1); break;
    case '1y':  d = new Date(today); d.setFullYear(d.getFullYear() - 1); break;
    case 'all': return firstTxDate;
  }
  const str = d.toISOString().slice(0, 10);
  return str < firstTxDate ? firstTxDate : str;
}

// Portfolio market value at each date — used for the Value tab
function computePortfolioValues(
  transactions: Transaction[],
  dates: string[],
  prices: Record<string, (number | null)[]>,
): (number | null)[] {
  if (transactions.length === 0) return dates.map(() => null);
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  return dates.map((date, dateIdx) => {
    const shares: Record<string, number> = {};
    for (const tx of sorted) {
      if (tx.date > date) break;
      if (tx.type === 'buy') {
        shares[tx.ticker] = (shares[tx.ticker] ?? 0) + tx.shares;
      } else if (tx.type === 'sell') {
        shares[tx.ticker] = (shares[tx.ticker] ?? 0) - tx.shares;
      } else if (tx.type === 'split') {
        shares[tx.ticker] = (shares[tx.ticker] ?? 0) * (tx.splitFactor ?? 1);
      }
    }
    let value = 0;
    let hasAny = false;
    for (const [ticker, qty] of Object.entries(shares)) {
      if (qty <= 0) continue;
      const p = prices[ticker]?.[dateIdx];
      if (p == null) continue;
      value += qty * p;
      hasAny = true;
    }
    return hasAny ? value : null;
  });
}

// Time-Weighted Return index — used for the Performance tab.
// Chains sub-period returns between each cash flow, so new investments
// don't inflate the apparent return. Returns a running index (1.0 = day of
// first purchase, 1.20 = +20% return since first purchase).
function computeTWRIndex(
  transactions: Transaction[],
  dates: string[],
  prices: Record<string, (number | null)[]>,
): (number | null)[] {
  if (transactions.length === 0) return dates.map(() => null);

  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  const firstTxDate = sorted[0].date;

  const txByDate: Record<string, Transaction[]> = {};
  for (const tx of sorted) {
    (txByDate[tx.date] ??= []).push(tx);
  }

  function valueAt(sharesMap: Record<string, number>, dateIdx: number): number | null {
    let total = 0;
    let hasAny = false;
    for (const [ticker, qty] of Object.entries(sharesMap)) {
      if (qty <= 0) continue;
      const p = prices[ticker]?.[dateIdx];
      if (p == null) continue;
      total += qty * p;
      hasAny = true;
    }
    return hasAny ? total : null;
  }

  const result: (number | null)[] = dates.map(() => null);
  let twrIndex = 1.0;
  let shares: Record<string, number> = {};
  let prevValue: number | null = null;
  let started = false;

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    if (date < firstTxDate) continue;

    // Apply splits first — they don't create cash flow, just adjust share counts.
    // Doing this before valueBefore prevents the price drop on split day from
    // registering as a loss in the TWR calculation.
    const todayTxs = txByDate[date] ?? [];
    for (const tx of todayTxs) {
      if (tx.type === 'split') {
        shares[tx.ticker] = (shares[tx.ticker] ?? 0) * (tx.splitFactor ?? 1);
      }
    }

    // Value BEFORE buy/sell transactions (post-split share count × today's prices)
    const valueBefore = valueAt(shares, i);

    // Compound the sub-period return since last measurement
    if (started && prevValue != null && prevValue > 0 && valueBefore != null) {
      twrIndex *= valueBefore / prevValue;
    }

    // Apply buy/sell transactions
    for (const tx of todayTxs) {
      if (tx.type === 'buy') {
        shares[tx.ticker] = (shares[tx.ticker] ?? 0) + tx.shares;
      } else if (tx.type === 'sell') {
        shares[tx.ticker] = (shares[tx.ticker] ?? 0) - tx.shares;
      }
    }

    // Value AFTER today's transactions → reference for next day
    const valueAfter = valueAt(shares, i);
    if (valueAfter != null) {
      prevValue = valueAfter;
      started = true;
    }

    if (started) result[i] = twrIndex;
  }

  return result;
}

// Normalize a TWR index series relative to a period start → shows % return within that period
function normalizeTWR(twrIndex: (number | null)[], startIdx: number): (number | null)[] {
  let base: number | null = null;
  for (let i = startIdx; i < twrIndex.length; i++) {
    if (twrIndex[i] != null) { base = twrIndex[i]!; break; }
  }
  if (base == null || base === 0) return twrIndex.map(() => null);
  return twrIndex.map((v, i) => i < startIdx ? null : (v != null ? v / base! - 1 : null));
}

// Normalize a price series (SPY) relative to a period start
function normalizePrice(values: (number | null)[], startIdx: number): (number | null)[] {
  let base: number | null = null;
  for (let i = startIdx; i < values.length; i++) {
    if (values[i] != null) { base = values[i]!; break; }
  }
  if (base == null || base === 0) return values.map(() => null);
  return values.map((v, i) => i < startIdx ? null : (v != null ? v / base! - 1 : null));
}

// Compute period return from a TWR index
function twrReturn(index: (number | null)[], dates: string[], from: string): number | null {
  const startIdx = dates.findIndex((d) => d >= from);
  if (startIdx === -1) return null;
  let startVal: number | null = null;
  let endVal: number | null = null;
  for (let i = startIdx; i < index.length; i++) {
    if (index[i] != null) { if (startVal == null) startVal = index[i]; endVal = index[i]; }
  }
  if (startVal == null || startVal === 0 || endVal == null) return null;
  return endVal / startVal - 1;
}

// Compute period return for a plain price series (Value tab % change)
function valueReturn(values: (number | null)[], dates: string[], from: string): number | null {
  const startIdx = dates.findIndex((d) => d >= from);
  if (startIdx === -1) return null;
  let base: number | null = null;
  let last: number | null = null;
  for (let i = startIdx; i < values.length; i++) {
    if (values[i] != null) { if (base == null) base = values[i]; last = values[i]; }
  }
  if (base == null || base === 0 || last == null) return null;
  return last / base - 1;
}

interface HistoryData {
  dates: string[];
  prices: Record<string, (number | null)[]>;
}

export default function PerformanceTab() {
  const transactions = usePortfolioStore((s) => s.transactions);
  const [subTab, setSubTab] = useState<SubTab>('value');
  const [range, setRange] = useState<Range>('1y');
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstTxDate = useMemo(() => {
    if (transactions.length === 0) return null;
    return [...transactions].sort((a, b) => a.date.localeCompare(b.date))[0].date;
  }, [transactions]);

  const tickers = useMemo(() => [...new Set(transactions.map((t) => t.ticker))], [transactions]);

  useEffect(() => {
    if (tickers.length === 0 || !firstTxDate) return;
    setLoading(true);
    setError(null);
    fetch(`/api/history?tickers=${tickers.join(',')}&from=${firstTxDate}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data: HistoryData) => { setHistory(data); setLoading(false); })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, [tickers.join(','), firstTxDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const portfolioValues = useMemo(() => {
    if (!history) return [];
    return computePortfolioValues(transactions, history.dates, history.prices);
  }, [history, transactions]);

  const twrIndex = useMemo(() => {
    if (!history) return [];
    return computeTWRIndex(transactions, history.dates, history.prices);
  }, [history, transactions]);

  const periodStart = useMemo(() => {
    if (!firstTxDate) return '';
    return getPeriodStart(range, firstTxDate);
  }, [range, firstTxDate]);

  const startIdx = useMemo(() => {
    if (!history) return 0;
    const idx = history.dates.findIndex((d) => d >= periodStart);
    return idx === -1 ? 0 : idx;
  }, [history, periodStart]);

  const chartData = useMemo(() => {
    if (!history) return [];
    const spyPrices = history.prices['SPY'] ?? [];

    if (subTab === 'value') {
      return history.dates.slice(startIdx).map((date, i) => {
        const val = portfolioValues[startIdx + i];
        return { date, value: val };
      }).filter((d) => d.value != null);
    } else {
      const normPortfolio = normalizeTWR(twrIndex, startIdx);
      const normSpy = normalizePrice(spyPrices, startIdx);

      return history.dates.slice(startIdx).map((date, i) => {
        const idx = startIdx + i;
        return { date, portfolio: normPortfolio[idx], spy: normSpy[idx] };
      }).filter((d) => d.portfolio != null || d.spy != null);
    }
  }, [history, startIdx, subTab, portfolioValues, twrIndex]);

  const rangeReturns = useMemo((): Partial<Record<Range, number | null>> => {
    if (!history) return {};
    const result: Partial<Record<Range, number | null>> = {};
    for (const { key } of RANGES) {
      const from = firstTxDate ? getPeriodStart(key, firstTxDate) : '';
      if (subTab === 'value') {
        result[key] = valueReturn(portfolioValues, history.dates, from);
      } else {
        result[key] = twrReturn(twrIndex, history.dates, from);
      }
    }
    return result;
  }, [history, portfolioValues, twrIndex, firstTxDate, subTab]);

  const formatXAxis = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  const formatYAxis = (v: number) => {
    if (subTab === 'value') return fmt.format(v);
    return `${(v * 100).toFixed(0)}%`;
  };

  const tooltipFormatter = (value: unknown, name: unknown): [string, string] => {
    if (typeof value !== 'number') return ['N/A', String(name)];
    if (subTab === 'value') return [fmt.format(value), 'Portfolio'];
    const label = name === 'portfolio' ? 'Portfolio' : 'S&P 500';
    return [`${(value * 100).toFixed(2)}%`, label as string];
  };

  // Last non-null index per series, for end-of-line labels
  const lastValueIdx = chartData.reduce(
    (last, d, i) => ((d as { value?: number | null }).value != null ? i : last), -1,
  );
  const lastPortfolioIdx = chartData.reduce(
    (last, d, i) => ((d as { portfolio?: number | null }).portfolio != null ? i : last), -1,
  );
  const lastSpyIdx = chartData.reduce(
    (last, d, i) => ((d as { spy?: number | null }).spy != null ? i : last), -1,
  );
  const currentRangeReturn = rangeReturns[range] ?? null;

  if (transactions.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-10 text-center text-gray-500 text-sm">
        No transactions yet. Add some transactions to see performance.
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      {/* Sub-tab toggle */}
      <div className="flex gap-1 mb-5 border-b border-gray-800">
        {(['value', 'performance'] as SubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              subTab === t
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && (
        <div className="py-16 text-center text-blue-400 text-sm">Loading historical data…</div>
      )}
      {error && (
        <div className="py-4 text-center text-red-400 text-sm">Failed to load history: {error}</div>
      )}

      {!loading && !error && history && (
        <>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {subTab === 'value' ? (
                <AreaChart data={chartData as Record<string, unknown>[]} margin={{ top: 4, right: 72, bottom: 0, left: 10 }}>
                  <defs>
                    <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={60} />
                  <YAxis tickFormatter={formatYAxis} tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: 12 }}
                    labelStyle={{ color: '#9ca3af' }}
                    formatter={tooltipFormatter as Parameters<typeof Tooltip>[0]['formatter']}
                    labelFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  />
                  <Area
                    type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#portfolioGrad)" dot={false} activeDot={{ r: 4 }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    label={(props: any) => {
                      if (props.index !== lastValueIdx || currentRangeReturn == null) return null;
                      return <text x={props.x + 8} y={props.y} fill="#3b82f6" fontSize={11} fontWeight={600} dominantBaseline="middle">{fmtPct(currentRangeReturn)}</text>;
                    }}
                  />
                </AreaChart>
              ) : (
                <LineChart data={chartData as Record<string, unknown>[]} margin={{ top: 4, right: 72, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={60} />
                  <YAxis tickFormatter={formatYAxis} tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} width={60} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: 12 }}
                    labelStyle={{ color: '#9ca3af' }}
                    formatter={tooltipFormatter as Parameters<typeof Tooltip>[0]['formatter']}
                    labelFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  />
                  <Legend
                    formatter={(v) => v === 'portfolio' ? 'Portfolio' : 'S&P 500'}
                    wrapperStyle={{ fontSize: 12, color: '#9ca3af' }}
                  />
                  <Line
                    type="monotone" dataKey="portfolio" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    label={(props: any) => {
                      if (props.index !== lastPortfolioIdx || props.value == null) return null;
                      return <text x={props.x + 8} y={props.y} fill="#3b82f6" fontSize={11} fontWeight={600} dominantBaseline="middle">{fmtPct(props.value)}</text>;
                    }}
                  />
                  <Line
                    type="monotone" dataKey="spy" stroke="#6b7280" strokeWidth={1.5} strokeDasharray="5 3" dot={false} activeDot={{ r: 3 }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    label={(props: any) => {
                      if (props.index !== lastSpyIdx || props.value == null) return null;
                      return <text x={props.x + 8} y={props.y} fill="#9ca3af" fontSize={11} fontWeight={600} dominantBaseline="middle">{fmtPct(props.value)}</text>;
                    }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {RANGES.map(({ label, key }) => {
              const ret = rangeReturns[key];
              const active = range === key;
              return (
                <button
                  key={key}
                  onClick={() => setRange(key)}
                  className={`flex flex-col items-center px-4 py-2 rounded-lg text-xs transition-colors ${
                    active
                      ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400'
                      : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600'
                  }`}
                >
                  <span className="font-medium">{label}</span>
                  {ret != null && (
                    <span className={`mt-0.5 font-semibold ${ret >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {fmtPct(ret)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
