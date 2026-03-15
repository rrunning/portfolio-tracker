import type { Holding, PriceMap } from '../types';

interface Props {
  holding: Holding;
  prices: PriceMap;
  totalPortfolioValue: number;
}

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const pct = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2 });

export default function HoldingRow({ holding, prices, totalPortfolioValue }: Props) {
  const currentPrice = prices[holding.ticker];
  const hasPrice = currentPrice !== undefined;

  const currentValue = hasPrice ? currentPrice * holding.netShares : null;
  const unrealizedGain = currentValue !== null ? currentValue - holding.totalInvested : null;
  const unrealizedGainPct = unrealizedGain !== null && holding.totalInvested > 0
    ? unrealizedGain / holding.totalInvested
    : null;
  const allocationPct = currentValue !== null && totalPortfolioValue > 0
    ? currentValue / totalPortfolioValue
    : null;
  const isPositive = unrealizedGain !== null && unrealizedGain >= 0;

  return (
    <tr className="border-t border-gray-800 hover:bg-gray-900/50 transition-colors">
      <td className="px-4 py-3 font-mono font-bold text-white">{holding.ticker}</td>
      <td className="px-4 py-3 text-gray-300">
        {holding.netShares.toLocaleString(undefined, { maximumFractionDigits: 6 })}
      </td>
      <td className="px-4 py-3 text-gray-300">{fmt.format(holding.avgCostBasis)}</td>
      <td className="px-4 py-3 text-gray-300">
        {hasPrice ? fmt.format(currentPrice) : <span className="text-gray-600">—</span>}
      </td>
      <td className="px-4 py-3 text-gray-300">
        {currentValue !== null ? fmt.format(currentValue) : <span className="text-gray-600">—</span>}
      </td>
      <td className="px-4 py-3 text-gray-300">{fmt.format(holding.totalInvested)}</td>
      <td className={`px-4 py-3 font-medium ${unrealizedGain === null ? '' : isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {unrealizedGain === null ? (
          <span className="text-gray-600">—</span>
        ) : (
          `${isPositive ? '+' : ''}${fmt.format(unrealizedGain)}`
        )}
      </td>
      <td className={`px-4 py-3 font-medium ${unrealizedGainPct === null ? '' : isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {unrealizedGainPct === null ? (
          <span className="text-gray-600">—</span>
        ) : (
          `${isPositive ? '+' : ''}${pct.format(unrealizedGainPct)}`
        )}
      </td>
      <td className="px-4 py-3 text-gray-300">
        {allocationPct !== null ? pct.format(allocationPct) : <span className="text-gray-600">—</span>}
      </td>
    </tr>
  );
}
