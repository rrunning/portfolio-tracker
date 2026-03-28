import { useState, useEffect } from 'react';
import { useFetchPrices } from './hooks/useFetchPrices';
import { useFetchHistory } from './hooks/useFetchHistory';
import AddTransactionForm from './components/AddTransactionForm';
import CSVImport from './components/CSVImport';
import TabNav from './components/TabNav';
import PortfolioSummary from './components/PortfolioSummary';
import AllocationChart from './components/AllocationChart';
import HoldingsTable from './components/HoldingsTable';
import TransactionsTable from './components/TransactionsTable';
import PerformanceTab from './components/PerformanceTab';
import DividendSuggestionBanner from './components/DividendSuggestionBanner';
import SettingsPanel from './components/SettingsPanel';
import { loadFromJSONBin } from './services/jsonbin';
import { usePortfolioStore } from './store/usePortfolioStore';

export default function App() {
  useFetchPrices();
  useFetchHistory();
  const setTransactions = usePortfolioStore((s) => s.setTransactions);
  const [activeTab, setActiveTab] = useState<'overview' | 'holdings' | 'transactions'>('overview');
  const [activePanel, setActivePanel] = useState<'add' | 'csv' | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [jsonbinLoading, setJsonbinLoading] = useState(false);
  const [jsonbinError, setJsonbinError] = useState<string | null>(null);

  useEffect(() => {
    const binId = localStorage.getItem('jsonbin_bin_id');
    const apiKey = localStorage.getItem('jsonbin_api_key');
    if (!binId || !apiKey) return;

    setJsonbinLoading(true);
    loadFromJSONBin(binId, apiKey)
      .then((transactions) => {
        setTransactions(transactions);
      })
      .catch((err: unknown) => {
        setJsonbinError(err instanceof Error ? err.message : 'Failed to load data from JSONBin.');
      })
      .finally(() => {
        setJsonbinLoading(false);
      });
  }, [setTransactions]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Portfolio Tracker</h1>
        <button
          onClick={() => setSettingsOpen(true)}
          className="text-gray-400 hover:text-gray-100 transition-colors"
          aria-label="Open settings"
          title="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      {jsonbinLoading && (
        <p className="text-sm text-gray-400 mb-4">Loading portfolio from JSONBin…</p>
      )}
      {jsonbinError && (
        <div className="flex items-center justify-between bg-red-900/40 border border-red-700 text-red-300 text-sm rounded px-4 py-2 mb-4">
          <span>{jsonbinError}</span>
          <button
            onClick={() => setJsonbinError(null)}
            className="ml-4 text-red-400 hover:text-red-200 transition-colors"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}
      <TabNav activeTab={activeTab} onChange={setActiveTab} />
      {activeTab === 'overview' && <PerformanceTab />}
      {activeTab === 'holdings' && (
        <>
          <PortfolioSummary />
          <AllocationChart />
          <HoldingsTable />
        </>
      )}
      {activeTab === 'transactions' && (
        <>
          <DividendSuggestionBanner />
          <div className="flex gap-6 mb-4">
            <button
              onClick={() => setActivePanel((p) => (p === 'add' ? null : 'add'))}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              <span className={`transition-transform ${activePanel === 'add' ? 'rotate-90' : ''}`}>▶</span>
              Add Transaction
            </button>
            <button
              onClick={() => setActivePanel((p) => (p === 'csv' ? null : 'csv'))}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              <span className={`transition-transform ${activePanel === 'csv' ? 'rotate-90' : ''}`}>▶</span>
              Import CSV
            </button>
          </div>
          {activePanel === 'add' && <AddTransactionForm />}
          {activePanel === 'csv' && <CSVImport />}
          <TransactionsTable />
        </>
      )}
    </div>
  );
}
