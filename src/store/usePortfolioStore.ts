import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction, PriceMap } from '../types';

interface PortfolioState {
  transactions: Transaction[];
  prices: PriceMap;
  loading: boolean;
  error: string | null;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  removeTransaction: (id: string) => void;
  setPrices: (prices: PriceMap) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      transactions: [],
      prices: {},
      loading: false,
      error: null,
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
    }),
    {
      name: 'portfolio-storage',
      onRehydrateStorage: () => (state) => {
        if (state && 'positions' in (state as object)) {
          state.transactions = [];
        }
      },
    }
  )
);
