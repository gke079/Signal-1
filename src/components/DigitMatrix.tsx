import React from 'react';
import { DigitStats, MarketSymbol } from '../types/deriv';
import { Activity, Flame, Snowflake } from 'lucide-react';

interface DigitMatrixProps {
  markets: MarketSymbol[];
  marketStats: Record<string, DigitStats>;
  onSelectMarket: (symbol: string) => void;
}

export const DigitMatrix: React.FC<DigitMatrixProps> = ({
  markets,
  marketStats,
  onSelectMarket,
}) => {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="bg-[#0f1626]/90 rounded-2xl border border-slate-800 p-4 sm:p-6 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            0-9 Digit Frequency Matrix
          </h2>
          <p className="text-xs text-slate-400">
            Real-time percentage occurrence of each last digit (0-9) across active Deriv Volatility indices.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-rose-400">
            <Flame className="w-3.5 h-3.5" />
            <span>Hot (&gt;15%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Snowflake className="w-3.5 h-3.5" />
            <span>Cold (&lt;6%)</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="py-2.5 px-3 font-semibold text-slate-300">Index</th>
              <th className="py-2.5 px-3 font-semibold text-slate-300">Live Price</th>
              <th className="py-2.5 px-2 text-center text-emerald-400 font-bold">E%</th>
              <th className="py-2.5 px-2 text-center text-fuchsia-400 font-bold">O%</th>
              {digits.map((d) => (
                <th
                  key={d}
                  className={`py-2.5 px-2 text-center font-bold ${
                    d % 2 === 0 ? 'text-emerald-400/90' : 'text-fuchsia-400/90'
                  }`}
                >
                  [{d}]
                </th>
              ))}
              <th className="py-2.5 px-3 text-right">Hot / Cold</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {markets.map((m) => {
              const stats = marketStats[m.id];
              const evenP = stats ? stats.evenPercent : 50;
              const oddP = stats ? stats.oddPercent : 50;
              const hot = stats?.hotDigits?.[0] ?? '-';
              const cold = stats?.coldDigits?.[0] ?? '-';

              return (
                <tr
                  key={m.id}
                  onClick={() => onSelectMarket(m.id)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-cyan-400 group-hover:underline">{m.id}</span>
                      {m.category === 'jump' ? (
                        <span className="text-[10px] px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                          Jump
                        </span>
                      ) : m.category === 'volatility_1s' ? (
                        <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                          1s
                        </span>
                      ) : null}
                      <span className="text-slate-400 font-normal hidden md:inline text-[11px]">
                        ({m.name})
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-white tabular-nums whitespace-nowrap">
                    {stats && stats.currentPrice > 0 ? (
                      <span className="flex items-baseline">
                        <span>{stats.currentPrice.toFixed(stats.pipSize).slice(0, -1)}</span>
                        <strong className="text-cyan-400 bg-cyan-950/60 px-0.5 rounded border border-cyan-800">
                          {stats.currentPrice.toFixed(stats.pipSize).slice(-1)}
                        </strong>
                      </span>
                    ) : (
                      <span className="text-slate-500 font-normal">--</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-emerald-400 tabular-nums">
                    {evenP}%
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-fuchsia-400 tabular-nums">
                    {oddP}%
                  </td>
                  {digits.map((d) => {
                    const percent = stats?.digitPercentages?.[d] ?? 0;
                    const isHot = percent >= 15;
                    const isCold = percent <= 5 && (stats?.totalCount || 0) >= 15;
                    const isEven = d % 2 === 0;

                    return (
                      <td key={d} className="py-3 px-2 text-center tabular-nums">
                        <span
                          className={`inline-block min-w-8 py-0.5 px-1 rounded text-center font-bold transition-all ${
                            isHot
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm shadow-rose-950'
                              : isCold
                              ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-800/40'
                              : isEven
                              ? 'text-slate-300'
                              : 'text-slate-300'
                          }`}
                        >
                          {percent}%
                        </span>
                      </td>
                    );
                  })}
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <span className="text-rose-400 font-bold">H:{hot}</span>
                    <span className="text-slate-400 mx-1">/</span>
                    <span className="text-cyan-400 font-bold">C:{cold}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
