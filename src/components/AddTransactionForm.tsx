import { useState } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { deriveHoldings } from '../utils/fifo';

export default function AddTransactionForm() {
  const addTransaction = usePortfolioStore((s) => s.addTransaction);
  const transactions = usePortfolioStore((s) => s.transactions);

  const [ticker, setTicker] = useState('');
  const [type, setType] = useState<'buy' | 'sell'>('buy');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shares, setShares] = useState('');
  const [pricePerShare, setPricePerShare] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedShares = parseFloat(shares);
    const parsedPrice = parseFloat(pricePerShare);

    if (!ticker.trim()) return setError('Ticker is required.');
    if (!date) return setError('Date is required.');
    if (isNaN(parsedShares) || parsedShares <= 0) return setError('Shares must be a positive number.');
    if (isNaN(parsedPrice) || parsedPrice <= 0) return setError('Price per share must be a positive number.');

    const normalizedTicker = ticker.trim().toUpperCase();

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

    addTransaction({
      ticker: normalizedTicker,
      type,
      date,
      shares: parsedShares,
      pricePerShare: parsedPrice,
    });

    setTicker('');
    setShares('');
    setPricePerShare('');
    setError('');
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-5 mb-6 border border-gray-800">
      <h2 className="text-lg font-semibold mb-4">Add Transaction</h2>
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
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        <input
          type="number"
          placeholder="Shares"
          value={shares}
          min="0"
          step="any"
          onChange={(e) => setShares(e.target.value)}
          className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <input
          type="number"
          placeholder="Price / share"
          value={pricePerShare}
          min="0"
          step="any"
          onChange={(e) => setPricePerShare(e.target.value)}
          className="w-36 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
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
