import { useMemo, useState } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { deriveRealizedGains } from '../utils/fifo';
import TransactionRow from './TransactionRow';

const COLUMNS = ['Type', 'Ticker', 'Date', 'Shares', 'Price / Share', 'Total', 'Realized G/L', ''];

export default function TransactionsTable() {
  const transactions = usePortfolioStore((s) => s.transactions);
  const [tickerFilter, setTickerFilter] = useState<string>('');

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    [transactions]
  );

  const tickers = useMemo(
    () => [...new Set(transactions.map((tx) => tx.ticker))].sort(),
    [transactions]
  );

  const filtered = tickerFilter ? sorted.filter((tx) => tx.ticker === tickerFilter) : sorted;

  const realizedGainMap = useMemo(() => {
    const gains = deriveRealizedGains(transactions);
    return new Map(gains.map((g) => [g.transactionId, g]));
  }, [transactions]);

  if (sorted.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-10 text-center text-gray-500 text-sm">
        No transactions yet. Add one above.
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-end gap-3">
        <label htmlFor="ticker-filter" className="text-xs text-gray-500 uppercase tracking-wider font-medium whitespace-nowrap">
          Filter by ticker
        </label>
        <select
          id="ticker-filter"
          value={tickerFilter}
          onChange={(e) => setTickerFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-2 py-1 focus:outline-none focus:border-gray-500"
        >
          <option value="">All tickers</option>
          {tickers.map((ticker) => (
            <option key={ticker} value={ticker}>{ticker}</option>
          ))}
        </select>
        {tickerFilter && (
          <span className="text-xs text-gray-500">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</span>
        )}
      </div>
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
            {filtered.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                realizedGain={realizedGainMap.get(tx.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
