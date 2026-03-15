import { useMemo, useState } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { computeDividendSuggestions } from '../utils/dividendSuggestions';

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmtDate = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function DividendSuggestionBanner() {
  const transactions = usePortfolioStore((s) => s.transactions);
  const history = usePortfolioStore((s) => s.history);
  const setDividendPrefill = usePortfolioStore((s) => s.setDividendPrefill);

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const suggestions = useMemo(() => {
    if (!history) return [];
    return computeDividendSuggestions(transactions, history);
  }, [transactions, history]);

  const visible = suggestions.filter((s) => !dismissed.has(`${s.ticker}-${s.date}`));

  if (visible.length === 0) return null;

  function handleRecord(s: typeof visible[0]) {
    setDividendPrefill({
      ticker: s.ticker,
      date: s.date,
      amountPerShare: s.amountPerShare,
      sharesHeld: s.sharesHeld,
    });
    // Scroll to the add transaction form
    document.getElementById('add-transaction-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleDismiss(s: typeof visible[0]) {
    setDismissed((prev) => new Set([...prev, `${s.ticker}-${s.date}`]));
  }

  return (
    <div className="mb-6 space-y-2">
      {visible.map((s) => (
        <div
          key={`${s.ticker}-${s.date}`}
          className="flex items-center justify-between gap-3 bg-blue-950/60 border border-blue-700/50 rounded-xl px-4 py-3 text-sm"
        >
          <span className="text-blue-200 flex-1">
            <span className="font-mono font-bold text-white">{s.ticker}</span> paid{' '}
            <span className="font-semibold text-white">{fmt.format(s.amountPerShare)}/share</span> on{' '}
            {fmtDate(s.date)} — you held{' '}
            <span className="font-semibold text-white">
              {s.sharesHeld.toLocaleString(undefined, { maximumFractionDigits: 6 })} shares
            </span>{' '}
            (<span className="font-semibold text-white">{fmt.format(s.totalAmount)}</span> total).
            Record?
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleRecord(s)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg px-3 py-1.5 text-xs transition-colors"
            >
              Record
            </button>
            <button
              onClick={() => handleDismiss(s)}
              className="text-blue-400 hover:text-white transition-colors text-base leading-none px-1"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
