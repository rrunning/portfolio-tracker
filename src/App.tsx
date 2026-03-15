import { useState } from 'react';
import { useFetchPrices } from './hooks/useFetchPrices';
import AddTransactionForm from './components/AddTransactionForm';
import CSVImport from './components/CSVImport';
import TabNav from './components/TabNav';
import PortfolioSummary from './components/PortfolioSummary';
import AllocationChart from './components/AllocationChart';
import HoldingsTable from './components/HoldingsTable';
import TransactionsTable from './components/TransactionsTable';

export default function App() {
  useFetchPrices();
  const [activeTab, setActiveTab] = useState<'holdings' | 'transactions'>('holdings');

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 tracking-tight">Portfolio Tracker</h1>
      <AddTransactionForm />
      <CSVImport />
      <TabNav activeTab={activeTab} onChange={setActiveTab} />
      {activeTab === 'holdings' ? (
        <>
          <PortfolioSummary />
          <AllocationChart />
          <HoldingsTable />
        </>
      ) : (
        <TransactionsTable />
      )}
    </div>
  );
}
