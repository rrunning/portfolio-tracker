import type { PriceMap } from '../types';

export async function fetchPrices(tickers: string[]): Promise<PriceMap> {
  if (tickers.length === 0) return {};

  // In production, use the Vercel serverless function (server-side fetch, no CORS proxy needed).
  // In local dev (npm run dev), fall back to corsproxy since /api/prices isn't available.
  if (!import.meta.env.DEV) {
    const res = await fetch(`/api/prices?tickers=${tickers.join(',')}`);
    if (!res.ok) throw new Error('Failed to fetch prices');
    return res.json() as Promise<PriceMap>;
  }

  // Dev fallback: fetch individually, ignore per-ticker failures
  const settled = await Promise.allSettled(
    tickers.map(async (ticker) => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1d&interval=1d`;
      const proxied = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
      const r = await fetch(proxied);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as {
        chart?: { result?: Array<{ meta?: { regularMarketPrice?: number } }> };
      };
      const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (price == null) throw new Error('No price');
      return [ticker.toUpperCase(), price] as [string, number];
    })
  );

  const priceMap: PriceMap = {};
  for (const r of settled) {
    if (r.status === 'fulfilled') priceMap[r.value[0]] = r.value[1];
  }
  return priceMap;
}
