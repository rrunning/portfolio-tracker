interface Props {
  activeTab: 'overview' | 'holdings' | 'transactions';
  onChange: (tab: 'overview' | 'holdings' | 'transactions') => void;
}

const TAB_LABELS: Record<'overview' | 'holdings' | 'transactions', string> = {
  overview: 'Overview',
  holdings: 'Holdings',
  transactions: 'Transactions',
};

export default function TabNav({ activeTab, onChange }: Props) {
  return (
    <div className="flex gap-1 mb-6 border-b border-gray-800">
      {(['overview', 'holdings', 'transactions'] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === tab
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          {TAB_LABELS[tab]}
        </button>
      ))}
    </div>
  );
}
