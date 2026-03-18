import { Transaction } from '../types';

const BASE_URL = 'https://api.jsonbin.io/v3/b';

export async function loadFromJSONBin(binId: string, apiKey: string): Promise<Transaction[]> {
  const response = await fetch(`${BASE_URL}/${binId}`, {
    headers: {
      'X-Master-Key': apiKey,
    },
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Invalid JSONBin API key.');
    if (response.status === 404) throw new Error('JSONBin bin not found. Check your Bin ID.');
    throw new Error(`Failed to load data from JSONBin (status ${response.status}).`);
  }

  const data = await response.json();
  const transactions = data?.record;

  if (!Array.isArray(transactions)) {
    throw new Error('JSONBin data is malformed — expected an array of transactions.');
  }

  return transactions as Transaction[];
}

export async function saveToJSONBin(binId: string, apiKey: string, transactions: Transaction[]): Promise<void> {
  const response = await fetch(`${BASE_URL}/${binId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': apiKey,
    },
    body: JSON.stringify(transactions),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Invalid JSONBin API key.');
    if (response.status === 404) throw new Error('JSONBin bin not found. Check your Bin ID.');
    throw new Error(`Failed to save data to JSONBin (status ${response.status}).`);
  }
}
