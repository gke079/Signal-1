import React from 'react';
import { TradeOrder } from '../types/deriv';
import { X, History, TrendingUp, CheckCircle2, XCircle, Trash2 } from 'lucide-react';

interface TradeHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  trades: TradeOrder[];
  onClearHistory: () => void;
}

export const TradeHistoryDrawer: React.FC<TradeHistoryDrawerProps> = ({
  isOpen,
  onClose,
  trades,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  const totalTrades = trades.length;
  const wonTrades = trades.filter((t) => t.status === 'won').length;
  const winRate = totalTrades > 0 ? Math.round((wonTrades / totalTrades) * 100) : 0;

  const totalProfit = trades.reduce((acc, t) => {
    if (t.status === 'won') {
      return acc + (t.payout - t.stake);
    } else if (t.status === 'lost') {
      return acc - t.stake;
    }
    return acc;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#0d1322] border-l border-slate-800 h-full flex flex-col p-4 sm:p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Trade Execution Log</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats summary bar */}
        <div className="mt-4 grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#141c2e] border border-slate-800 text-center font-mono">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Win Rate</span>
            <span className="text-sm font-bold text-emerald-400">{winRate}%</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Trades</span>
            <span className="text-sm font-bold text-white">{wonTrades} / {totalTrades}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Net P&amp;L</span>
            <span
              className={`text-sm font-bold ${
                totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {totalProfit >= 0 ? `+$${totalProfit.toFixed(2)}` : `-$${Math.abs(totalProfit).toFixed(2)}`}
            </span>
          </div>
        </div>

        {/* Trades list */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
          {trades.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs text-center font-mono">
              <TrendingUp className="w-8 h-8 mb-2 opacity-40 text-cyan-400" />
              <span>No trade executions logged yet.</span>
              <span className="text-[11px] text-slate-600 mt-1">
                Click Trade Even/Odd on any market card to test!
              </span>
            </div>
          ) : (
            trades.slice().reverse().map((trade) => {
              const isWon = trade.status === 'won';
              const pnl = isWon ? trade.payout - trade.stake : -trade.stake;

              return (
                <div
                  key={trade.id}
                  className={`p-2.5 rounded-xl border text-xs font-mono flex items-center justify-between ${
                    isWon
                      ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                      : 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isWon ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{trade.symbol}</span>
                        <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-300">
                          {trade.contractType}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(trade.timestamp).toLocaleTimeString()} · Exit Digit:{' '}
                        <strong className="text-white">
                          {trade.exitTick ? trade.exitTick.lastDigit : '-'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-sm tabular-nums block">
                      {isWon ? `+$${pnl.toFixed(2)}` : `-$${trade.stake.toFixed(2)}`}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Stake: ${trade.stake}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer clear button */}
        {trades.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800">
            <button
              onClick={onClearHistory}
              className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
