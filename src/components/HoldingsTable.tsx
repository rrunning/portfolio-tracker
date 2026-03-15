import { useMemo, useState } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { deriveHoldings } from '../utils/fifo';
import type { Holding, PriceMap } from '../types';
import HoldingRow from './HoldingRow';

type SortKey =
  | 'ticker' | 'qty' | 'avgCost' | 'price'
  | 'value' | 'invested' | 'gainAbs' | 'gainPct' | 'allocation';
type SortDir = 'asc' | 'desc';

const COLUMNS: { label: string; key: SortKey }[] = [
  { label: 'Ticker',           key: 'ticker'     },
  { label: 'Qty',              key: 'qty'        },
  { label: 'Avg Cost',         key: 'avgCost'    },
  { label: 'Current Price',    key: 'price'      },
  { label: 'Current Value',    key: 'value'      },
  { label: 'Amount Invested',  key: 'invested'   },
  { label: 'Unrealized Gain $',key: 'gainAbs'    },
  { label: 'Unrealized Gain %',key: 'gainPct'    },
  { label: 'Allocation %',     key: 'allocation' },
];

function getSortValue(key: SortKey, h: Holding, prices: PriceMap, totalValue: number): string | number | null {
  const price = prices[h.ticker];
  const currentValue = price !== undefined ? price * h.netShares : null;
  const gain = currentValue !== null ? currentValue - h.totalInvested : null;

  switch (key) {
    case 'ticker':     return h.ticker;
    case 'qty':        return h.netShares;
    case 'avgCost':    return h.avgCostBasis;
    case 'price':      return price ?? null;
    case 'value':      return currentValue;
    case 'invested':   return h.totalInvested;
    case 'gainAbs':    return gain;
    case 'gainPct':    return gain !== null && h.totalInvested > 0 ? gain / h.totalInvested : null;
    case 'allocation': return currentValue !== null && totalValue > 0 ? currentValue / totalValue : null;
  }
}

function compareHoldings(
  a: Holding, b: Holding,
  key: SortKey, dir: SortDir,
  prices: PriceMap, totalValue: number
): number {
  const av = getSortValue(key, a, prices, totalValue);
  const bv = getSortValue(key, b, prices, totalValue);

  // Nulls always go last regardless of direction
  if (av === null && bv === null) return 0;
  if (av === null) return 1;
  if (bv === null) return -1;

  const mul = dir === 'asc' ? 1 : -1;
  if (typeof av === 'string' && typeof bv === 'string') return mul * av.localeCompare(bv);
  return mul * ((av as number) - (bv as number));
}

export default function HoldingsTable() {
  const transactions = usePortfolioStore((s) => s.transactions);
  const prices = usePortfolioStore((s) => s.prices);
  const loading = usePortfolioStore((s) => s.loading);
  const error = usePortfolioStore((s) => s.error);

  const [sortKey, setSortKey] = useState<SortKey>('value');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const holdings = useMemo(() => deriveHoldings(transactions), [transactions]);

  const totalPortfolioValue = useMemo(() => {
    return holdings.reduce((sum, h) => {
      const price = prices[h.ticker];
      return price !== undefined ? sum + price * h.netShares : sum;
    }, 0);
  }, [holdings, prices]);

  const sorted = useMemo(() => {
    return [...holdings].sort((a, b) =>
      compareHoldings(a, b, sortKey, sortDir, prices, totalPortfolioValue)
    );
  }, [holdings, sortKey, sortDir, prices, totalPortfolioValue]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  if (holdings.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-10 text-center text-gray-500 text-sm">
        No open positions. Add a buy transaction above.
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {loading && (
        <div className="px-4 py-2 text-xs text-blue-400 bg-blue-950/30 border-b border-gray-800">
          Fetching prices…
        </div>
      )}
      {error && (
        <div className="px-4 py-2 text-xs text-red-400 bg-red-950/30 border-b border-gray-800">
          Price fetch failed: {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
              {COLUMNS.map(({ label, key }) => {
                const active = key === sortKey;
                return (
                  <th
                    key={key}
                    className="px-4 py-3 font-medium whitespace-nowrap cursor-pointer select-none hover:text-gray-300 transition-colors"
                    onClick={() => handleSort(key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      <span className={`text-xs ${active ? 'text-blue-400' : 'text-gray-700'}`}>
                        {active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((holding) => (
              <HoldingRow
                key={holding.ticker}
                holding={holding}
                prices={prices}
                totalPortfolioValue={totalPortfolioValue}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
