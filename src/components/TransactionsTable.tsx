import { useMemo } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import TransactionRow from './TransactionRow';

const COLUMNS = ['Type', 'Ticker', 'Date', 'Shares', 'Price / Share', 'Total', ''];

export default function TransactionsTable() {
  const transactions = usePortfolioStore((s) => s.transactions);

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    [transactions]
  );

  if (sorted.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-10 text-center text-gray-500 text-sm">
        No transactions yet. Add one above.
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
              {COLUMNS.map((col) => (
                <th key={col} className="px-4 py-3 font-medium">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
