import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction, PriceMap, HistoryData, DividendPrefill } from '../types';

interface PortfolioState {
  transactions: Transaction[];
  prices: PriceMap;
  loading: boolean;
  error: string | null;
  // Transient — not persisted
  history: HistoryData | null;
  historyLoading: boolean;
  historyError: string | null;
  dividendPrefill: DividendPrefill | null;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  removeTransaction: (id: string) => void;
  setPrices: (prices: PriceMap) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHistory: (history: HistoryData | null) => void;
  setHistoryLoading: (loading: boolean) => void;
  setHistoryError: (error: string | null) => void;
  setDividendPrefill: (prefill: DividendPrefill | null) => void;
  setTransactions: (transactions: Transaction[]) => void;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      transactions: [],
      prices: {},
      loading: false,
      error: null,
      history: null,
      historyLoading: false,
      historyError: null,
      dividendPrefill: null,
      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [
            ...state.transactions,
            { ...transaction, id: crypto.randomUUID() },
          ],
        })),
      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),
      setPrices: (prices) => set({ prices }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setHistory: (history) => set({ history }),
      setHistoryLoading: (historyLoading) => set({ historyLoading }),
      setHistoryError: (historyError) => set({ historyError }),
      setDividendPrefill: (dividendPrefill) => set({ dividendPrefill }),
      setTransactions: (transactions) => set({ transactions }),
    }),
    {
      name: 'portfolio-storage',
      partialize: (state) => ({
        transactions: state.transactions,
        prices: state.prices,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && 'positions' in (state as object)) {
          state.transactions = [];
        }
      },
    }
  )
);
