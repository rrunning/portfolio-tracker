import type { VercelRequest, VercelResponse } from '@vercel/node';

function dateToUnix(dateStr: string): number {
  return Math.floor(new Date(dateStr + 'T00:00:00Z').getTime() / 1000);
}

function unixToDate(ts: number): string {
  const d = new Date(ts * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

async function fetchTicker(ticker: string, period1: number, period2: number) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?period1=${period1}&period2=${period2}&interval=1d`;
  const r = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; portfolio-tracker/1.0)' },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);

  const data = (await r.json()) as {
    chart?: {
      result?: Array<{
        timestamp?: number[];
        indicators?: { quote?: Array<{ close?: (number | null)[] }> };
      }>;
    };
  };

  const result = data.chart?.result?.[0];
  if (!result?.timestamp) throw new Error('No data');

  const timestamps = result.timestamp;
  const closes = result.indicators?.quote?.[0]?.close ?? [];

  return {
    dates: timestamps.map(unixToDate),
    closes: closes.map((c) => c ?? null) as (number | null)[],
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const tickerParam = req.query.tickers;
  const fromParam = req.query.from;

  const baseTickers =
    typeof tickerParam === 'string'
      ? tickerParam.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean)
      : [];
  const tickers = [...new Set([...baseTickers, 'SPY'])];

  const fromDate = typeof fromParam === 'string' ? fromParam : '2010-01-01';
  const period1 = dateToUnix(fromDate);
  const period2 = Math.floor(Date.now() / 1000);

  const settled = await Promise.allSettled(
    tickers.map(async (t) => ({ ticker: t, data: await fetchTicker(t, period1, period2) }))
  );

  const dateSet = new Set<string>();
  const tickerDataMap = new Map<string, Map<string, number | null>>();

  for (const r of settled) {
    if (r.status !== 'fulfilled') continue;
    const { ticker, data } = r.value;
    const map = new Map<string, number | null>();
    for (let i = 0; i < data.dates.length; i++) {
      map.set(data.dates[i], data.closes[i]);
      dateSet.add(data.dates[i]);
    }
    tickerDataMap.set(ticker, map);
  }

  const dates = [...dateSet].sort();
  const prices: Record<string, (number | null)[]> = {};
  for (const [ticker, map] of tickerDataMap) {
    prices[ticker] = dates.map((d) => map.get(d) ?? null);
  }

  return res.json({ dates, prices });
}
