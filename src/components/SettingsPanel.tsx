import { useEffect, useRef, useState } from 'react';

const BIN_ID_KEY = 'jsonbin_bin_id';
const API_KEY_KEY = 'jsonbin_api_key';

interface Props {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: Props) {
  const [binId, setBinId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBinId(localStorage.getItem(BIN_ID_KEY) ?? '');
    setApiKey(localStorage.getItem(API_KEY_KEY) ?? '');
  }, []);

  function handleSave() {
    localStorage.setItem(BIN_ID_KEY, binId);
    localStorage.setItem(API_KEY_KEY, apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    >
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-100">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-100 transition-colors text-xl leading-none"
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1" htmlFor="binId">
              JSONBin Bin ID
            </label>
            <input
              id="binId"
              type="text"
              value={binId}
              onChange={e => setBinId(e.target.value)}
              placeholder="e.g. 64a1b2c3d4e5f6..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1" htmlFor="apiKey">
              JSONBin API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="$2a$10$..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Save
          </button>
          {saved && <span className="text-green-400 text-sm">Saved</span>}
        </div>
      </div>
    </div>
  );
}
