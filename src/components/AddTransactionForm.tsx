import { useEffect, useRef, useState } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { deriveHoldings, getSharesOnDate } from '../utils/fifo';

export default function AddTransactionForm() {
  const addTransaction = usePortfolioStore((s) => s.addTransaction);
  const transactions = usePortfolioStore((s) => s.transactions);
  const dividendPrefill = usePortfolioStore((s) => s.dividendPrefill);
  const setDividendPrefill = usePortfolioStore((s) => s.setDividendPrefill);

  const [ticker, setTicker] = useState('');
  const [type, setType] = useState<'buy' | 'sell' | 'split' | 'dividend'>('buy');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shares, setShares] = useState('');
  const [pricePerShare, setPricePerShare] = useState('');
  const [splitFactor, setSplitFactor] = useState('');
  const [error, setError] = useState('');

  const formRef = useRef<HTMLFormElement>(null);

  // Apply dividend prefill from banner
  useEffect(() => {
    if (!dividendPrefill) return;
    setType('dividend');
    setTicker(dividendPrefill.ticker);
    setDate(dividendPrefill.date);
    setPricePerShare(String(dividendPrefill.amountPerShare));
    setShares(String(dividendPrefill.sharesHeld));
    setDividendPrefill(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dividendPrefill, setDividendPrefill]);

  // When type is dividend and ticker/date change, auto-fill shares held
  useEffect(() => {
    if (type !== 'dividend') return;
    const normalizedTicker = ticker.trim().toUpperCase();
    if (!normalizedTicker || !date) return;
    const held = getSharesOnDate(transactions, normalizedTicker, date);
    setShares(held > 0 ? String(held) : '');
  }, [type, ticker, date, transactions]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalizedTicker = ticker.trim().toUpperCase();

    if (!normalizedTicker) return setError('Ticker is required.');
    if (!date) return setError('Date is required.');

    if (type === 'split') {
      const factor = parseFloat(splitFactor);
      if (isNaN(factor) || factor <= 0) return setError('Split factor must be a positive number (e.g. 10 for a 10:1 split).');
      if (factor === 1) return setError('Split factor of 1 has no effect.');
      addTransaction({ ticker: normalizedTicker, type: 'split', date, shares: 0, pricePerShare: 0, splitFactor: factor });
    } else if (type === 'dividend') {
      const parsedShares = parseFloat(shares);
      const parsedPrice = parseFloat(pricePerShare);
      if (isNaN(parsedShares) || parsedShares <= 0) return setError('Shares must be a positive number.');
      if (isNaN(parsedPrice) || parsedPrice <= 0) return setError('Amount per share must be a positive number.');
      addTransaction({ ticker: normalizedTicker, type: 'dividend', date, shares: parsedShares, pricePerShare: parsedPrice });
    } else {
      const parsedShares = parseFloat(shares);
      const parsedPrice = parseFloat(pricePerShare);
      if (isNaN(parsedShares) || parsedShares <= 0) return setError('Shares must be a positive number.');
      if (isNaN(parsedPrice) || parsedPrice <= 0) return setError('Price per share must be a positive number.');

      if (type === 'sell') {
        const holdings = deriveHoldings(transactions);
        const holding = holdings.find((h) => h.ticker === normalizedTicker);
        const netShares = holding?.netShares ?? 0;
        if (parsedShares > netShares) {
          return setError(
            `Cannot sell ${parsedShares} shares — only ${netShares.toLocaleString(undefined, { maximumFractionDigits: 6 })} held.`
          );
        }
      }

      addTransaction({ ticker: normalizedTicker, type, date, shares: parsedShares, pricePerShare: parsedPrice });
    }

    setTicker('');
    setShares('');
    setPricePerShare('');
    setSplitFactor('');
    setError('');
  }

  const isDividend = type === 'dividend';
  const isSplit = type === 'split';

  return (
    <form id="add-transaction-form" ref={formRef} onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-5 mb-6 border border-gray-800">
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Ticker (e.g. AAPL)"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          className="flex-1 min-w-32 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <div className="flex rounded-lg overflow-hidden border border-gray-700 text-sm font-medium">
          <button
            type="button"
            onClick={() => setType('buy')}
            className={`px-4 py-2 transition-colors ${type === 'buy' ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => setType('sell')}
            className={`px-4 py-2 transition-colors ${type === 'sell' ? 'bg-red-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            Sell
          </button>
          <button
            type="button"
            onClick={() => setType('split')}
            className={`px-4 py-2 transition-colors ${type === 'split' ? 'bg-yellow-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            Split
          </button>
          <button
            type="button"
            onClick={() => setType('dividend')}
            className={`px-4 py-2 transition-colors ${type === 'dividend' ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            Dividend
          </button>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        {isSplit ? (
          <input
            type="number"
            placeholder="Factor (e.g. 10 for 10:1)"
            value={splitFactor}
            min="0"
            step="any"
            onChange={(e) => setSplitFactor(e.target.value)}
            className="w-52 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-yellow-500"
          />
        ) : (
          <>
            <input
              type="number"
              placeholder="Shares"
              value={shares}
              min="0"
              step="any"
              readOnly={isDividend}
              onChange={(e) => !isDividend && setShares(e.target.value)}
              className={`w-32 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 ${isDividend ? 'opacity-60 cursor-default' : ''}`}
            />
            <input
              type="number"
              placeholder={isDividend ? 'Amount / share' : 'Price / share'}
              value={pricePerShare}
              min="0"
              step="any"
              onChange={(e) => setPricePerShare(e.target.value)}
              className="w-36 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </>
        )}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg px-5 py-2 text-sm transition-colors"
        >
          Add
        </button>
      </div>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </form>
  );
}
