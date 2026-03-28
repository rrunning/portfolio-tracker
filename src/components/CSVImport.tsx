import { useRef, useState } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';

interface ImportResult {
  imported: number;
  errors: { row: number; message: string }[];
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

type ValidRow =
  | { ticker: string; type: 'buy' | 'sell'; date: string; shares: number; pricePerShare: number }
  | { ticker: string; type: 'split'; date: string; shares: 0; pricePerShare: 0; splitFactor: number }
  | { ticker: string; type: 'dividend'; date: string; shares: number; pricePerShare: number };

function parseCSV(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const valid: ValidRow[] = [];
  const errors: { row: number; message: string }[] = [];

  const firstCols = parseCSVLine(lines[0]);
  const hasHeader = firstCols[0].toLowerCase() === 'ticker';
  const startIdx = hasHeader ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    const rowNum = i + 1;
    const cols = parseCSVLine(raw);

    if (cols.length < 4) {
      errors.push({ row: rowNum, message: 'Expected at least 4 columns: ticker, type, date, shares/splitFactor [, pricePerShare]' });
      continue;
    }

    const ticker = cols[0].toUpperCase();
    const type = cols[1].toLowerCase();
    const date = cols[2];

    if (!ticker) { errors.push({ row: rowNum, message: 'Ticker is required' }); continue; }
    if (type !== 'buy' && type !== 'sell' && type !== 'split' && type !== 'dividend') {
      errors.push({ row: rowNum, message: `Type must be "buy", "sell", "split", or "dividend", got "${cols[1]}"` }); continue;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { errors.push({ row: rowNum, message: `Date must be YYYY-MM-DD, got "${cols[2]}"` }); continue; }

    if (type === 'split') {
      const splitFactor = parseFloat(cols[3]);
      if (isNaN(splitFactor) || splitFactor <= 0) { errors.push({ row: rowNum, message: `Split factor must be a positive number, got "${cols[3]}"` }); continue; }
      valid.push({ ticker, type: 'split', date, shares: 0, pricePerShare: 0, splitFactor });
    } else if (type === 'dividend') {
      if (cols.length < 5) { errors.push({ row: rowNum, message: 'Expected 5 columns for dividend: ticker, dividend, date, sharesHeld, amountPerShare' }); continue; }
      const shares = parseFloat(cols[3]);
      const pricePerShare = parseFloat(cols[4]);
      if (isNaN(shares) || shares <= 0) { errors.push({ row: rowNum, message: `Shares held must be a positive number, got "${cols[3]}"` }); continue; }
      if (isNaN(pricePerShare) || pricePerShare <= 0) { errors.push({ row: rowNum, message: `Amount per share must be a positive number, got "${cols[4]}"` }); continue; }
      valid.push({ ticker, type: 'dividend', date, shares, pricePerShare });
    } else {
      if (cols.length < 5) { errors.push({ row: rowNum, message: 'Expected 5 columns for buy/sell: ticker, type, date, shares, pricePerShare' }); continue; }
      const shares = parseFloat(cols[3]);
      const pricePerShare = parseFloat(cols[4]);
      if (isNaN(shares) || shares <= 0) { errors.push({ row: rowNum, message: `Shares must be a positive number, got "${cols[3]}"` }); continue; }
      if (isNaN(pricePerShare) || pricePerShare <= 0) { errors.push({ row: rowNum, message: `Price must be a positive number, got "${cols[4]}"` }); continue; }
      valid.push({ ticker, type: type as 'buy' | 'sell', date, shares, pricePerShare });
    }
  }

  return { valid, errors };
}

const TEMPLATE = [
  'ticker,type,date,shares,pricePerShare',
  'AAPL,buy,2024-01-15,10,150.00',
  'AAPL,sell,2024-06-01,5,185.00',
  'MSFT,buy,2024-02-01,5,380.00',
  'MSFT,split,2024-03-01,4,0',
  'AAPL,dividend,2024-02-16,10,0.24',
].join('\n');

export default function CSVImport() {
  const addTransactions = usePortfolioStore((s) => s.addTransactions);
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { valid, errors } = parseCSV(text);
      addTransactions(valid);
      setResult({ imported: valid.length, errors });
      if (inputRef.current) inputRef.current.value = '';
    };
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-gray-900 rounded-xl p-5 mb-6 border border-gray-800">
      <p className="text-xs text-gray-500 mb-4">
        Buy/Sell: <code className="text-gray-400">ticker, type (buy/sell), date (YYYY-MM-DD), shares, pricePerShare</code>
        <br />
        Split: <code className="text-gray-400">ticker, split, date (YYYY-MM-DD), splitFactor (e.g. 10 for 10:1)</code>
        <br />
        Dividend: <code className="text-gray-400">ticker, dividend, date (YYYY-MM-DD), sharesHeld, amountPerShare</code>
      </p>
      <div className="flex gap-3 flex-wrap">
        <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
        <button
          onClick={() => inputRef.current?.click()}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg px-5 py-2 text-sm transition-colors"
        >
          Choose CSV File
        </button>
        <button
          onClick={downloadTemplate}
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg px-5 py-2 text-sm transition-colors border border-gray-700"
        >
          Download Template
        </button>
      </div>

      {result && (
        <div className="mt-4 space-y-1">
          {result.imported > 0 && (
            <p className="text-green-400 text-sm">
              {result.imported} transaction{result.imported !== 1 ? 's' : ''} imported successfully.
            </p>
          )}
          {result.errors.length > 0 && (
            <div>
              <p className="text-red-400 text-sm font-medium">
                {result.errors.length} row{result.errors.length !== 1 ? 's' : ''} skipped:
              </p>
              <ul className="mt-1 space-y-0.5">
                {result.errors.map(({ row, message }) => (
                  <li key={row} className="text-xs text-red-300">Row {row}: {message}</li>
                ))}
              </ul>
            </div>
          )}
          {result.imported === 0 && result.errors.length === 0 && (
            <p className="text-gray-500 text-sm">No valid rows found in file.</p>
          )}
        </div>
      )}
    </div>
  );
}
