interface Props {
  activeTab: 'holdings' | 'transactions';
  onChange: (tab: 'holdings' | 'transactions') => void;
}

export default function TabNav({ activeTab, onChange }: Props) {
  return (
    <div className="flex gap-1 mb-6 border-b border-gray-800">
      {(['holdings', 'transactions'] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
            activeTab === tab
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
