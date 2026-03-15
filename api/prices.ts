import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const tickerParam = req.query.tickers;
  const tickers =
    typeof tickerParam === 'string'
      ? tickerParam.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean)
      : [];

  if (tickers.length === 0) return res.json({});

  const settled = await Promise.allSettled(
    tickers.map(async (ticker) => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=1d`;
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; portfolio-tracker/1.0)' },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as {
        chart?: { result?: Array<{ meta?: { regularMarketPrice?: number } }> };
      };
      const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (price == null) throw new Error('No price in response');
      return [ticker, price] as [string, number];
    })
  );

  const priceMap: Record<string, number> = {};
  for (const r of settled) {
    if (r.status === 'fulfilled') priceMap[r.value[0]] = r.value[1];
  }

  return res.json(priceMap);
}
