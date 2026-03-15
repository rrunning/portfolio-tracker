import { usePortfolioStore } from '../store/usePortfolioStore';
import type { Transaction } from '../types';

interface Props {
  transaction: Transaction;
}

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function TransactionRow({ transaction }: Props) {
  const removeTransaction = usePortfolioStore((s) => s.removeTransaction);
  const total = transaction.shares * transaction.pricePerShare;
  const displayDate = new Date(transaction.date + 'T00:00:00').toLocaleDateString();

  return (
    <tr className="border-t border-gray-800 hover:bg-gray-900/50 transition-colors">
      <td className="px-4 py-3">
        <span
          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase ${
            transaction.type === 'buy'
              ? 'bg-green-900/60 text-green-400'
              : 'bg-red-900/60 text-red-400'
          }`}
        >
          {transaction.type}
        </span>
      </td>
      <td className="px-4 py-3 font-mono font-bold text-white">{transaction.ticker}</td>
      <td className="px-4 py-3 text-gray-300">{displayDate}</td>
      <td className="px-4 py-3 text-gray-300">
        {transaction.shares.toLocaleString(undefined, { maximumFractionDigits: 6 })}
      </td>
      <td className="px-4 py-3 text-gray-300">{fmt.format(transaction.pricePerShare)}</td>
      <td className="px-4 py-3 text-gray-300">{fmt.format(total)}</td>
      <td className="px-4 py-3">
        <button
          onClick={() => removeTransaction(transaction.id)}
          className="text-gray-600 hover:text-red-400 text-xs transition-colors"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
