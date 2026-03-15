import type { PriceMap } from '../types';

// Fetches each ticker individually via corsproxy.io → Yahoo Finance v8 chart API
async function fetchPrice(ticker: string): Promise<[string, number]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1d&interval=1d`;
  const proxied = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;

  const res = await fetch(proxied);
  if (!res.ok) throw new Error(`Failed to fetch ${ticker}`);

  const data = await res.json();
  const price: number =
    data?.chart?.result?.[0]?.meta?.regularMarketPrice ?? 0;

  return [ticker.toUpperCase(), price];
}

export async function fetchPrices(tickers: string[]): Promise<PriceMap> {
  if (tickers.length === 0) return {};

  const results = await Promise.all(tickers.map(fetchPrice));
  return Object.fromEntries(results);
}
