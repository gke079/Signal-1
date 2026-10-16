import React, { useState } from 'react';
import { DigitStats, MarketSymbol, ScanMode } from '../types/deriv';
import { Sparkles, ArrowUpRight, CheckCircle2, XCircle, TrendingUp, Zap, Key, ArrowRightLeft } from 'lucide-react';

interface MarketCardProps {
  market: MarketSymbol;
  stats: DigitStats;
  scanMode: ScanMode;
  onOpenAnalysis: (symbol: string) => void;
  isAuthorized: boolean;
  onPlaceTrade: (
    symbol: string,
    contractType: 'DIGITEVEN' | 'DIGITODD' | 'DIGITOVER' | 'DIGITUNDER',
    stake: number,
    barrier?: number,
    onComplete?: (won: boolean, exitTick?: any, payout?: number, errorMsg?: string, contractId?: number) => void
  ) => void;
  onOpenAccountModal: () => void;
}

export const MarketCard: React.FC<MarketCardProps> = ({
  market,
  stats,
  scanMode,
  onOpenAnalysis,
  isAuthorized,
  onPlaceTrade,
  onOpenAccountModal,
}) => {
  const { signal, evenPercent, oddPercent, underPercent, overPercent, ticks, countdownSec, currentStreak } = stats;

  const [quickStake, setQuickStake] = useState<number>(1);
  const [customStake, setCustomStake] = useState<string>('1');
  const [barrier, setBarrier] = useState<number>(4);
  const [isTrading, setIsTrading] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<{
    won: boolean;
    payout: number;
    stake: number;
    exitDigit?: number;
    contractId?: number;
    errorMsg?: string;
  } | null>(null);

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

  const handleStakeSelect = (val: number) => {
    setQuickStake(val);
    setCustomStake(String(val));
  };

  const handleCustomStakeChange = (valStr: string) => {
    setCustomStake(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      setQuickStake(num);
    }
  };

  const handleExecuteTrade = (contractType: 'DIGITEVEN' | 'DIGITODD' | 'DIGITOVER' | 'DIGITUNDER') => {
    if (!isAuthorized) {
      onOpenAccountModal();
      return;
    }

    const stakeVal = parseFloat(customStake) || quickStake || 1;
    if (stakeVal <= 0) return;

    setIsTrading(true);
    setLastResult(null);

    onPlaceTrade(
      market.id,
      contractType,
      stakeVal,
      scanMode === 'over_under' ? barrier : undefined,
      (won, exitTick, payout, errorMsg, contractId) => {
        setIsTrading(false);
        setLastResult({
          won,
          payout: payout || 0,
          stake: stakeVal,
          exitDigit: exitTick?.lastDigit,
          contractId,
          errorMsg,
        });

        setTimeout(() => {
          setLastResult(null);
        }, 8000);
      }
    );
  };

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
          {/* Prominent Live Price Badge from Real Deriv WS */}
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
              <span className="text-xs text-cyan-400 font-mono animate-pulse">Connecting WS...</span>
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
            <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
              <span className="text-sm font-black text-white leading-none tabular-nums">
                {countdownSec}s
              </span>
              <span className="text-[8px] text-slate-400 uppercase tracking-tighter scale-90">
                CYCLE
              </span>
            </div>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                  isEvenSignal
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                    : isOddSignal
                    ? 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-500/50 shadow-sm shadow-fuchsia-500/20'
                    : isOverSignal
                    ? 'bg-blue-950/80 text-blue-300 border-blue-500/50'
                    : isUnderSignal
                    ? 'bg-teal-950/80 text-teal-300 border-teal-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                {isEvenSignal || isOddSignal || isOverSignal || isUnderSignal ? (
                  <Zap className="w-3 h-3 text-current" />
                ) : (
                  <TrendingUp className="w-3 h-3 text-slate-500" />
                )}
                <span>{signal.label}</span>
              </span>
              <span className="text-xs font-mono font-bold text-slate-300">
                {signal.strength}%
              </span>
            </div>
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
              <div className="text-xs text-cyan-400 py-1 font-mono animate-pulse">Awaiting tick stream from Deriv...</div>
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

      {/* Real Trade Execution Action Bar */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
        {/* Stake Selector */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-400 text-[11px] mr-1 hidden sm:inline">Stake:</span>
          {[0.5, 1, 2, 5, 10, 20].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => handleStakeSelect(val)}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                quickStake === val && customStake === String(val)
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-sm shadow-cyan-500/30'
                  : 'bg-[#141c2e] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              ${val}
            </button>
          ))}

          {/* Custom Stake Input */}
          <div className="relative flex items-center ml-1">
            <span className="absolute left-2 text-[10px] text-slate-400">$</span>
            <input
              type="number"
              min="0.35"
              step="0.5"
              value={customStake}
              onChange={(e) => handleCustomStakeChange(e.target.value)}
              className="w-16 px-1.5 pl-4 py-0.5 rounded-lg bg-[#0b101e] border border-slate-700 text-xs font-mono text-white text-right focus:outline-none focus:border-cyan-400"
              title="Enter custom stake amount"
            />
          </div>
        </div>

        {/* Trade Buttons */}
        <div className="flex items-center gap-2">
          {!isAuthorized ? (
            <button
              type="button"
              onClick={onOpenAccountModal}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Connect Deriv Token to Trade</span>
            </button>
          ) : scanMode === 'over_under' ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 bg-[#141c2e] px-2 py-1 rounded-xl border border-slate-800 text-xs font-mono">
                <span className="text-slate-400 text-[10px]">Barrier:</span>
                <select
                  value={barrier}
                  onChange={(e) => setBarrier(parseInt(e.target.value, 10))}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((b) => (
                    <option key={b} value={b} className="bg-slate-900 text-white">
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                disabled={isTrading}
                onClick={() => handleExecuteTrade('DIGITUNDER')}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-teal-500/20 active:scale-95 disabled:opacity-50"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Trade Under</span>
              </button>

              <button
                type="button"
                disabled={isTrading}
                onClick={() => handleExecuteTrade('DIGITOVER')}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Trade Over</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={isTrading}
                onClick={() => handleExecuteTrade('DIGITEVEN')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 ${
                  isEvenSignal
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/50'
                    : 'bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Trade Even</span>
              </button>

              <button
                type="button"
                disabled={isTrading}
                onClick={() => handleExecuteTrade('DIGITODD')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 ${
                  isOddSignal
                    ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-400 hover:to-pink-400 text-white shadow-md shadow-fuchsia-500/30 ring-2 ring-fuchsia-400/50'
                    : 'bg-fuchsia-950/80 hover:bg-fuchsia-900 border border-fuchsia-600/60 text-fuchsia-300'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Trade Odd</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live Trade Settlement Toast */}
      {isTrading && (
        <div className="mt-2.5 p-2 rounded-xl bg-cyan-950/50 border border-cyan-500/50 flex items-center justify-between text-xs font-mono text-cyan-300 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <span>Submitting contract order to real Deriv platform...</span>
          </div>
          <span className="font-bold text-white">${customStake || quickStake}</span>
        </div>
      )}

      {lastResult && (
        <div
          className={`mt-2.5 p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono animate-fade-in ${
            lastResult.won
              ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-300 shadow-md shadow-emerald-950'
              : lastResult.errorMsg
              ? 'bg-rose-950/70 border-rose-500/80 text-rose-300'
              : 'bg-rose-950/60 border-rose-500/80 text-rose-300 shadow-md shadow-rose-950'
          }`}
        >
          <div className="flex items-center gap-2">
            {lastResult.won ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <div>
              {lastResult.errorMsg ? (
                <span className="font-bold">{lastResult.errorMsg}</span>
              ) : (
                <>
                  <span className="font-extrabold uppercase mr-1.5">
                    {lastResult.won ? 'Contract Won!' : 'Contract Lost'}
                  </span>
                  {lastResult.exitDigit !== undefined && (
                    <span className="text-slate-300">
                      Exit Digit: <strong className="text-white font-bold">{lastResult.exitDigit}</strong>
                    </span>
                  )}
                  {lastResult.contractId && (
                    <span className="text-[10px] text-slate-400 ml-1.5">
                      (ID: {lastResult.contractId})
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {!lastResult.errorMsg && (
            <div className="font-black text-sm tabular-nums">
              {lastResult.won ? (
                <span className="text-emerald-400">+${(lastResult.payout - lastResult.stake).toFixed(2)}</span>
              ) : (
                <span className="text-rose-400">-${lastResult.stake.toFixed(2)}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
