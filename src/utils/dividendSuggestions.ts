import type { Transaction, DividendSuggestion, HistoryData } from '../types';
import { getSharesOnDate } from './fifo';

export function computeDividendSuggestions(
  transactions: Transaction[],
  history: HistoryData,
): DividendSuggestion[] {
  const suggestions: DividendSuggestion[] = [];

  for (const [ticker, dividendEvents] of Object.entries(history.dividends)) {
    // Collect already-recorded dividend dates for this ticker
    const recordedDates = new Set(
      transactions
        .filter((t) => t.ticker === ticker && t.type === 'dividend')
        .map((t) => t.date)
    );

    for (const event of dividendEvents) {
      if (recordedDates.has(event.date)) continue;

      const sharesHeld = getSharesOnDate(transactions, ticker, event.date);
      if (sharesHeld <= 0) continue;

      suggestions.push({
        ticker,
        date: event.date,
        amountPerShare: event.amount,
        sharesHeld,
        totalAmount: sharesHeld * event.amount,
      });
    }
  }

  // Sort by date descending (most recent first)
  return suggestions.sort((a, b) => b.date.localeCompare(a.date));
}
