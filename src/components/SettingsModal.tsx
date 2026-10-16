import React, { useState } from 'react';
import { MarketSymbol } from '../types/deriv';
import { X, Sliders, CheckSquare, Square, Save, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  allMarkets: MarketSymbol[];
  selectedMarketIds: string[];
  windowSize: number;
  minConfidence: number;
  appId: string;
  onSaveSettings: (settings: {
    selectedMarketIds: string[];
    windowSize: number;
    minConfidence: number;
    appId: string;
  }) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  allMarkets,
  selectedMarketIds,
  windowSize: initialWindowSize,
  minConfidence: initialConfidence,
  appId: initialAppId,
  onSaveSettings,
  onClose,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedMarketIds);
  const [windowSize, setWindowSize] = useState<number>(initialWindowSize);
  const [minConfidence, setMinConfidence] = useState<number>(initialConfidence);
  const [appId, setAppId] = useState<string>(initialAppId);

  const toggleMarket = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 1) return; // Keep at least one
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSave = () => {
    onSaveSettings({
      selectedMarketIds: selectedIds,
      windowSize,
      minConfidence,
      appId,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0f1628] border border-slate-700/80 rounded-2xl shadow-2xl p-4 sm:p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Scanner & Market Settings</h3>
              <p className="text-xs text-slate-400">Customize tick windows, entry thresholds, and active indices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Window size */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-200">
                Tick Window Sample Size:
              </label>
              <span className="text-xs font-mono font-bold text-cyan-400">{windowSize} ticks</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[15, 25, 50, 100].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setWindowSize(size)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    windowSize === size
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {size} ticks
                </button>
              ))}
            </div>
          </div>

          {/* Confidence threshold */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-200">
                Minimum Signal Entry Threshold:
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400">{minConfidence}%</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[55, 60, 65, 70].map((conf) => (
                <button
                  key={conf}
                  type="button"
                  onClick={() => setMinConfidence(conf)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    minConfidence === conf
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {conf}%
                </button>
              ))}
            </div>
          </div>

          {/* Deriv App ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Deriv App ID:
            </label>
            <input
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="1089 (Standard Test App ID)"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Default is 1089. Change only if you have registered your own App ID with Deriv Developers.
            </span>
          </div>

          {/* Active Indices Checkboxes grouped by category */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-200">
                Active Markets ({selectedIds.length} active):
              </label>
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    const s1Ids = allMarkets.filter((m) => m.category === 'volatility_1s').map((m) => m.id);
                    setSelectedIds(Array.from(new Set([...selectedIds, ...s1Ids])));
                  }}
                  className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900"
                >
                  + All 1(s)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const jumpIds = allMarkets.filter((m) => m.category === 'jump').map((m) => m.id);
                    setSelectedIds(Array.from(new Set([...selectedIds, ...jumpIds])));
                  }}
                  className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 hover:bg-purple-900"
                >
                  + All Jump
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds(allMarkets.map((m) => m.id))}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Select All
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {/* 1(s) Volatility Category */}
              <div>
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block mb-1.5">
                  1-Second (1s) Volatility Indices ({allMarkets.filter(m => m.category === 'volatility_1s').length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {allMarkets.filter((m) => m.category === 'volatility_1s').map((m) => {
                    const isChecked = selectedIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleMarket(m.id)}
                        className={`flex items-center gap-2 p-1.5 rounded-xl text-left border transition-all ${
                          isChecked
                            ? 'bg-cyan-950/40 border-cyan-800/80 text-white'
                            : 'bg-slate-900/60 border-slate-800/60 text-slate-400 hover:bg-slate-800/40'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        )}
                        <div className="truncate">
                          <span className="text-xs font-bold block">{m.id}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{m.name}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Jump Indices Category */}
              <div>
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block mb-1.5">
                  Jump Indices ({allMarkets.filter(m => m.category === 'jump').length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {allMarkets.filter((m) => m.category === 'jump').map((m) => {
                    const isChecked = selectedIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleMarket(m.id)}
                        className={`flex items-center gap-2 p-1.5 rounded-xl text-left border transition-all ${
                          isChecked
                            ? 'bg-purple-950/40 border-purple-800/80 text-white'
                            : 'bg-slate-900/60 border-slate-800/60 text-slate-400 hover:bg-slate-800/40'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        )}
                        <div className="truncate">
                          <span className="text-xs font-bold block">{m.id}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{m.name}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Standard Volatility Category */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Standard Volatility Indices ({allMarkets.filter(m => m.category === 'volatility_standard').length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {allMarkets.filter((m) => m.category === 'volatility_standard').map((m) => {
                    const isChecked = selectedIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleMarket(m.id)}
                        className={`flex items-center gap-2 p-1.5 rounded-xl text-left border transition-all ${
                          isChecked
                            ? 'bg-slate-850 border-slate-700 text-white'
                            : 'bg-slate-900/60 border-slate-800/60 text-slate-400 hover:bg-slate-800/40'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        )}
                        <div className="truncate">
                          <span className="text-xs font-bold block">{m.id}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{m.name}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Apply Settings</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedIds(['1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V']);
                setWindowSize(25);
                setMinConfidence(60);
                setAppId('1089');
              }}
              className="py-2 px-3 rounded-xl bg-[#141c2e] hover:bg-[#1a253c] border border-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
