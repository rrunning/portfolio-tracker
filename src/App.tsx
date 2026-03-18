import { useState } from 'react';
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

export default function App() {
  useFetchPrices();
  useFetchHistory();
  const [activeTab, setActiveTab] = useState<'overview' | 'holdings' | 'transactions'>('overview');
  const [settingsOpen, setSettingsOpen] = useState(false);

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
          <AddTransactionForm />
          <CSVImport />
          <TransactionsTable />
        </>
      )}
    </div>
  );
}
