import { usePortfolioStore } from '../store/usePortfolioStore';
import type { Transaction, RealizedGain } from '../types';

interface Props {
  transaction: Transaction;
  realizedGain?: RealizedGain;
}

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const pct = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2 });

export default function TransactionRow({ transaction, realizedGain }: Props) {
  const removeTransaction = usePortfolioStore((s) => s.removeTransaction);
  const total = transaction.shares * transaction.pricePerShare;
  const displayDate = new Date(transaction.date + 'T00:00:00').toLocaleDateString();

  const isPositive = realizedGain !== undefined && realizedGain.gainLoss >= 0;

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
      <td className={`px-4 py-3 font-medium ${realizedGain === undefined ? '' : isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {realizedGain === undefined ? (
          <span className="text-gray-600">—</span>
        ) : (
          <span>
            {isPositive ? '+' : ''}{fmt.format(realizedGain.gainLoss)}{' '}
            <span className="text-xs opacity-75">({isPositive ? '+' : ''}{pct.format(realizedGain.gainLossPct)})</span>
          </span>
        )}
      </td>
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
