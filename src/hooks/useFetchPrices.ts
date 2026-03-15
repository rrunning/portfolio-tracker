import { useEffect } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { fetchPrices } from '../services/stockApi';

export function useFetchPrices() {
  const transactions = usePortfolioStore((s) => s.transactions);
  const setPrices = usePortfolioStore((s) => s.setPrices);
  const setLoading = usePortfolioStore((s) => s.setLoading);
  const setError = usePortfolioStore((s) => s.setError);

  useEffect(() => {
    if (transactions.length === 0) return;

    const tickers = [...new Set(transactions.map((t) => t.ticker))];

    setLoading(true);
    setError(null);

    fetchPrices(tickers)
      .then(setPrices)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Unknown error')
      )
      .finally(() => setLoading(false));
  }, [transactions, setPrices, setLoading, setError]);
}
