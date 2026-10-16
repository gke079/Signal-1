import React from 'react';
import { DigitStats, MarketSymbol, ScanMode } from '../types/deriv';
import { Sparkles } from 'lucide-react';

interface MarketCardProps {
  market: MarketSymbol;
  stats: DigitStats;
  scanMode: ScanMode;
  onOpenAnalysis: (symbol: string) => void;
  onPlaceTrade?: (
    symbol: string,
    contractType: 'DIGITEVEN' | 'DIGITODD' | 'DIGITOVER' | 'DIGITUNDER',
    stake: number
  ) => void;
}

export const MarketCard: React.FC<MarketCardProps> = ({
  market,
  stats,
  scanMode,
  onOpenAnalysis,
}) => {
  const { signal, evenPercent, oddPercent, underPercent, overPercent, ticks, countdownSec, currentStreak } = stats;

  const isEvenSignal = signal.type === 'even' && signal.label.includes('ENTRY');
  const isOddSignal = signal.type === 'odd' && signal.label.includes('ENTRY');
  const isOverSignal = scanMode === 'over_under' && overPercent >= 60;
  const isUnderSignal = scanMode === 'over_under' && underPercent >= 60;

  // Recent ticks (up to 10 for the display stream)
  const recentTicks = ticks.slice(-10);

  // SVG Progress circle calculation for countdown timer
  const maxSec = 25;
  const progressPercent = Math.max(0, Math.min(100, (countdownSec / maxSec) * 100));
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0f1626]/90 border border-slate-800 hover:border-slate-700/80 p-3.5 sm:p-4.5 transition-all shadow-lg hover:shadow-cyan-950/20 backdrop-blur-sm group">
      {/* Background neon ambient flare for active signals */}
      {isEvenSignal && (
        <div className="absolute -top-10 -left-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      )}
      {isOddSignal && (
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wide uppercase">
              {market.name}
            </h3>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Live streaming" />
            {market.category === 'jump' && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-700/60 uppercase">
                JUMP
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5">
            <span className="text-cyan-400 font-semibold">{market.id}</span>
            <span>·</span>
            {currentStreak.count >= 3 && (
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                currentStreak.type === 'even'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                  : 'bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-700/60'
              }`}>
                {currentStreak.count} {currentStreak.type}s in a row
              </span>
            )}
            <span className="hidden sm:inline text-slate-400">{market.description}</span>
          </div>
        </div>

        {/* Live Price Quote & AI Trigger */}
        <div className="flex items-center gap-2">
          {/* Prominent Live Price Badge to compare with Deriv */}
          <div className="flex items-center gap-1.5 bg-[#0a0f1c] px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-inner">
            <span className="text-[10px] text-slate-400 uppercase font-mono font-medium">Price:</span>
            {stats.currentPrice > 0 ? (
              <div className="flex items-baseline font-mono">
                <span className="text-sm sm:text-base font-bold text-white tabular-nums">
                  {stats.currentPrice.toFixed(stats.pipSize).slice(0, -1)}
                </span>
                <span
                  className={`text-sm sm:text-base font-black px-1 rounded ml-0.5 tabular-nums ${
                    stats.ticks.length > 0 && stats.ticks[stats.ticks.length - 1].isEven
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50'
                      : 'bg-fuchsia-500/25 text-fuchsia-300 border border-fuchsia-500/50'
                  }`}
                  title={`Last digit: ${stats.ticks.length > 0 ? stats.ticks[stats.ticks.length - 1].lastDigit : '-'}`}
                >
                  {stats.currentPrice.toFixed(stats.pipSize).slice(-1)}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-500 font-mono">Syncing...</span>
            )}
          </div>

          {/* AI Analysis Trigger Button */}
          <button
            onClick={() => onOpenAnalysis(market.id)}
            className="relative px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-900/60 to-fuchsia-900/60 hover:from-indigo-800/80 hover:to-fuchsia-800/80 border border-fuchsia-500/40 text-fuchsia-300 hover:text-white transition-all flex items-center gap-1 text-xs font-bold shadow-md shadow-fuchsia-950/30 group-hover:scale-105"
            title="Open AI Statistical Analysis"
          >
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>AI</span>
          </button>
        </div>
      </div>

      {/* Scanner Visual Core */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center bg-[#0a0f1c]/70 p-3 rounded-xl border border-slate-800/70">
        {/* Left Column: Countdown Timer Circle */}
        <div className="md:col-span-3 flex items-center gap-3">
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="28"
                cy="28"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="3.5"
                fill="transparent"
              />
              <circle
                cx="28"
                cy="28"
                r={radius}
                className={
                  isEvenSignal
                    ? 'stroke-emerald-400'
                    : isOddSignal
                    ? 'stroke-fuchsia-400'
                    : 'stroke-cyan-400'
                }
                strokeWidth="3.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-sm font-extrabold font-mono text-white tabular-nums leading-none">
                {countdownSec}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                SEC
              </span>
            </div>
          </div>

          <div className="flex flex-col min-w-0">
            {/* Status / Prediction Badge */}
            {isEvenSignal ? (
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wide shadow-sm shadow-emerald-500/50">
                  EVEN
                </span>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">
                  ENTRY {signal.strength}%
                </span>
              </div>
            ) : isOddSignal ? (
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-md bg-fuchsia-500 text-white font-black text-xs uppercase tracking-wide shadow-sm shadow-fuchsia-500/50">
                  ODD
                </span>
                <span className="text-[11px] font-bold text-fuchsia-400 uppercase tracking-wide">
                  ENTRY {signal.strength}%
                </span>
              </div>
            ) : scanMode === 'over_under' && (isOverSignal || isUnderSignal) ? (
              <div className="flex items-center gap-1.5">
                <span className={`px-2.5 py-0.5 rounded-md font-black text-xs uppercase tracking-wide ${
                  isOverSignal ? 'bg-blue-500 text-white' : 'bg-cyan-500 text-slate-950'
                }`}>
                  {isOverSignal ? 'OVER (5-9)' : 'UNDER (0-4)'}
                </span>
                <span className="text-[11px] font-bold text-cyan-300">
                  ENTRY {isOverSignal ? overPercent : underPercent}%
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-cyan-300 tracking-wider uppercase">
                  SCANNING
                </span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              </div>
            )}
            <span className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
              {stats.totalCount} ticks · 25s window
            </span>
          </div>
        </div>

        {/* Center Column: Digit History Pills Stream */}
        <div className="md:col-span-6 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-mono">Recent Digit Stream:</span>
            <span className="text-slate-400 font-mono">
              Latest: <strong className="text-white font-bold">{ticks.length > 0 ? ticks[ticks.length - 1].lastDigit : '-'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {recentTicks.length === 0 ? (
              <div className="text-xs text-slate-400 py-1 font-mono">Awaiting tick stream from Deriv...</div>
            ) : (
              recentTicks.map((t, idx) => {
                const isLatest = idx === recentTicks.length - 1;
                const isEven = t.isEven;
                return (
                  <div
                    key={`${t.epoch}-${idx}`}
                    className={`relative w-8 h-8 rounded-lg flex items-center justify-center font-mono font-extrabold text-sm transition-all shrink-0 ${
                      isEven
                        ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-950'
                        : 'bg-fuchsia-950/70 border border-fuchsia-500/50 text-fuchsia-300 shadow-sm shadow-fuchsia-950'
                    } ${isLatest ? 'scale-110 ring-2 ring-white/60 shadow-md font-black' : 'opacity-85'}`}
                    title={`Quote: ${t.quote} | Digit: ${t.lastDigit} (${isEven ? 'Even' : 'Odd'}) at ${t.timeStr}`}
                  >
                    {t.lastDigit}
                    {isLatest && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-slate-950 animate-pulse" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Percentage Ratio Bar */}
        <div className="md:col-span-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            {scanMode === 'over_under' ? (
              <>
                <span className="text-cyan-400">{underPercent}% Under</span>
                <span className="text-blue-400">{overPercent}% Over</span>
              </>
            ) : (
              <>
                <span className="text-emerald-400">{evenPercent}% E</span>
                <span className="text-fuchsia-400">{oddPercent}% O</span>
              </>
            )}
          </div>

          {/* Dual visual progress bar */}
          <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
            {scanMode === 'over_under' ? (
              <>
                <div
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${underPercent}%` }}
                />
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${overPercent}%` }}
                />
              </>
            ) : (
              <>
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${evenPercent}%` }}
                />
                <div
                  className="bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500"
                  style={{ width: `${oddPercent}%` }}
                />
              </>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Streak: {currentStreak.count} {currentStreak.type}</span>
            <span>Hot: {stats.hotDigits.slice(0, 2).join(',')}</span>
          </div>
        </div>
      </div>

    </div>
  );
};
