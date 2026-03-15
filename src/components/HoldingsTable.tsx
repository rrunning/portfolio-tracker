import { useMemo } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { deriveHoldings } from '../utils/fifo';
import HoldingRow from './HoldingRow';

const COLUMNS = [
  'Ticker', 'Qty', 'Avg Cost', 'Current Price',
  'Current Value', 'Amount Invested', 'Unrealized Gain $', 'Unrealized Gain %', 'Allocation %',
];

export default function HoldingsTable() {
  const transactions = usePortfolioStore((s) => s.transactions);
  const prices = usePortfolioStore((s) => s.prices);
  const loading = usePortfolioStore((s) => s.loading);
  const error = usePortfolioStore((s) => s.error);

  const holdings = useMemo(() => deriveHoldings(transactions), [transactions]);

  const totalPortfolioValue = useMemo(() => {
    return holdings.reduce((sum, h) => {
      const price = prices[h.ticker];
      return price !== undefined ? sum + price * h.netShares : sum;
    }, 0);
  }, [holdings, prices]);

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
              {COLUMNS.map((col) => (
                <th key={col} className="px-4 py-3 font-medium whitespace-nowrap">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding) => (
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
