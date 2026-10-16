import React from 'react';
import { DigitStats, MarketSymbol } from '../types/deriv';
import { X, Sparkles, BarChart3, ShieldCheck } from 'lucide-react';

interface AiAnalysisModalProps {
  market: MarketSymbol | null;
  stats: DigitStats | null;
  isAuthorized?: boolean;
  onClose: () => void;
  onPlaceTrade?: (
    symbol: string,
    contractType: 'DIGITEVEN' | 'DIGITODD' | 'DIGITOVER' | 'DIGITUNDER',
    stake: number,
    barrier?: number,
    onComplete?: (won: boolean, exitTick?: any, payout?: number, errorMsg?: string, contractId?: number) => void
  ) => void;
  onOpenAccountModal?: () => void;
}

export const AiAnalysisModal: React.FC<AiAnalysisModalProps> = ({
  market,
  stats,
  isAuthorized = false,
  onClose,
  onPlaceTrade,
  onOpenAccountModal,
}) => {
  const [stake, setStake] = React.useState<number>(1);
  const [isExecuting, setIsExecuting] = React.useState<boolean>(false);
  const [tradeMessage, setTradeMessage] = React.useState<string | null>(null);

  if (!market || !stats) return null;

  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const maxFreq = Math.max(...Object.values(stats.digitFrequency), 1);

  const handleModalTrade = (contractType: 'DIGITEVEN' | 'DIGITODD') => {
    if (!isAuthorized) {
      onOpenAccountModal?.();
      return;
    }
    if (!onPlaceTrade) return;

    setIsExecuting(true);
    setTradeMessage(null);

    onPlaceTrade(market.id, contractType, stake, undefined, (won, exitTick, payout, errorMsg) => {
      setIsExecuting(false);
      if (errorMsg) {
        setTradeMessage(`Trade Error: ${errorMsg}`);
      } else {
        setTradeMessage(
          won
            ? `Won! Payout: +$${((payout || 0) - stake).toFixed(2)} (Exit Digit: ${exitTick?.lastDigit})`
            : `Lost: -$${stake.toFixed(2)} (Exit Digit: ${exitTick?.lastDigit})`
        );
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0f1628] border border-slate-700/80 rounded-2xl shadow-2xl p-4 sm:p-6 overflow-y-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-fuchsia-500 p-0.5">
              <div className="w-full h-full bg-[#0d1322] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-fuchsia-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white uppercase">{market.name}</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {market.id}
                </span>
                {stats.currentPrice > 0 && (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-white">
                    Live Price: {stats.currentPrice.toFixed(stats.pipSize)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Sample Window: {stats.totalCount} ticks · Latency: Real-time Deriv WebSocket
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Signal Assessment Hero Box */}
        <div className="mt-4 p-4 rounded-xl bg-[#141d33] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              AI Quantitative Model Verdict
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-base font-extrabold uppercase px-2.5 py-0.5 rounded-md ${
                  stats.signal.type === 'even'
                    ? 'bg-emerald-500 text-slate-950'
                    : stats.signal.type === 'odd'
                    ? 'bg-fuchsia-500 text-white'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                }`}
              >
                {stats.signal.label}
              </span>
              <span className="text-xs font-bold font-mono text-white">
                {stats.signal.strength}% Confidence
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1.5">{stats.signal.reason}</p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-[#0b101e] border border-slate-800 text-left sm:text-right">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Recommended Bias</span>
              <span className={`text-xs sm:text-sm font-extrabold font-mono uppercase ${
                stats.signal.type === 'even'
                  ? 'text-emerald-400'
                  : stats.signal.type === 'odd'
                  ? 'text-fuchsia-400'
                  : 'text-cyan-400'
              }`}>
                {stats.signal.type === 'even' ? 'Even Digit (0,2,4,6,8)' : stats.signal.type === 'odd' ? 'Odd Digit (1,3,5,7,9)' : 'Neutral / Monitor'}
              </span>
            </div>

            {onPlaceTrade && (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center bg-[#0b101e] px-2 py-1 rounded-lg border border-slate-800 text-xs font-mono">
                  <span className="text-slate-500 mr-1">$</span>
                  <input
                    type="number"
                    min="0.35"
                    step="0.5"
                    value={stake}
                    onChange={(e) => setStake(parseFloat(e.target.value) || 1)}
                    className="w-12 bg-transparent text-white font-bold focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  disabled={isExecuting}
                  onClick={() => handleModalTrade(stats.signal.type === 'odd' ? 'DIGITODD' : 'DIGITEVEN')}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-50 shadow-md shadow-cyan-500/20"
                >
                  <span>{isExecuting ? 'Trading...' : `Trade ${stats.signal.type === 'odd' ? 'Odd' : 'Even'}`}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {tradeMessage && (
          <div className="mt-2.5 p-2 rounded-xl bg-[#0b101e] border border-cyan-500/50 text-xs font-mono text-cyan-300">
            {tradeMessage}
          </div>
        )}

        {/* 0-9 Digit Distribution Histogram */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Digit Frequency Distribution (0-9)
            </h4>
            <span className="text-xs font-mono text-slate-400">
              Hot: <strong className="text-rose-400">{stats.hotDigits.join(', ')}</strong> | Cold: <strong className="text-cyan-400">{stats.coldDigits.join(', ')}</strong>
            </span>
          </div>

          <div className="grid grid-cols-10 gap-1.5 sm:gap-2 bg-[#0b101e] p-3 rounded-xl border border-slate-800/80">
            {digits.map((digit) => {
              const count = stats.digitFrequency[digit] || 0;
              const percent = stats.digitPercentages[digit] || 0;
              const heightPercent = maxFreq > 0 ? (count / maxFreq) * 100 : 0;
              const isEven = digit % 2 === 0;

              return (
                <div key={digit} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-mono font-semibold text-slate-400 tabular-nums">
                    {percent}%
                  </span>
                  <div className="w-full h-24 bg-slate-900 rounded-md flex items-end p-0.5">
                    <div
                      className={`w-full rounded-sm transition-all duration-500 ${
                        isEven
                          ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
                          : 'bg-gradient-to-t from-fuchsia-600 to-pink-400'
                      }`}
                      style={{ height: `${Math.max(6, heightPercent)}%` }}
                    />
                  </div>
                  <span
                    className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs ${
                      isEven
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                        : 'bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-700/60'
                    }`}
                  >
                    {digit}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {count}x
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Statistical Metrics Breakdown */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-[#0a0f1c] border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400 font-sans text-xs font-semibold">Parity Distribution</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-emerald-400 font-bold">Even: {stats.evenPercent}% ({stats.evenCount})</span>
              <span className="text-fuchsia-400 font-bold">Odd: {stats.oddPercent}% ({stats.oddCount})</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex mt-1.5">
              <div className="bg-emerald-500" style={{ width: `${stats.evenPercent}%` }} />
              <div className="bg-fuchsia-500" style={{ width: `${stats.oddPercent}%` }} />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0a0f1c] border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400 font-sans text-xs font-semibold">Over / Under Ratio</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-cyan-400 font-bold">Under 5 (0-4): {stats.underPercent}%</span>
              <span className="text-blue-400 font-bold">Over 4 (5-9): {stats.overPercent}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex mt-1.5">
              <div className="bg-cyan-500" style={{ width: `${stats.underPercent}%` }} />
              <div className="bg-blue-500" style={{ width: `${stats.overPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Pro Tip Callout */}
        <div className="mt-4 p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 flex items-start gap-2.5 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-cyan-300 font-semibold">Execution Edge:</strong>{' '}
            High probability entry signals trigger when a streak reaches 4 consecutive occurrences (mean reversion) or when one side commands &gt;62% dominance over the 25-tick sample window.
          </div>
        </div>
      </div>
    </div>
  );
};
