import { useEffect, useMemo } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import type { HistoryData } from '../types';

export function useFetchHistory() {
  const transactions = usePortfolioStore((s) => s.transactions);
  const setHistory = usePortfolioStore((s) => s.setHistory);
  const setHistoryLoading = usePortfolioStore((s) => s.setHistoryLoading);
  const setHistoryError = usePortfolioStore((s) => s.setHistoryError);

  const tickerKey = useMemo(() => {
    const tickers = [...new Set(transactions.map((t) => t.ticker))].sort();
    return tickers.join(',');
  }, [transactions]);

  const firstTxDate = useMemo(() => {
    if (transactions.length === 0) return null;
    return [...transactions].sort((a, b) => a.date.localeCompare(b.date))[0].date;
  }, [transactions]);

  useEffect(() => {
    if (!tickerKey || !firstTxDate) return;

    setHistoryLoading(true);
    setHistoryError(null);

    fetch(`/api/history?tickers=${tickerKey}&from=${firstTxDate}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data: HistoryData) => {
        setHistory(data);
        setHistoryLoading(false);
      })
      .catch((e: unknown) => {
        setHistoryError(e instanceof Error ? e.message : String(e));
        setHistoryLoading(false);
      });
  }, [tickerKey, firstTxDate]); // eslint-disable-line react-hooks/exhaustive-deps
}
