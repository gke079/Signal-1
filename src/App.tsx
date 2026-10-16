/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { MarketCard } from './components/MarketCard';
import { DigitMatrix } from './components/DigitMatrix';
import { AiAnalysisModal } from './components/AiAnalysisModal';
import { TokenModal } from './components/TokenModal';
import { SettingsModal } from './components/SettingsModal';
import { ConnectionModal } from './components/ConnectionModal';
import { TradeHistoryDrawer } from './components/TradeHistoryDrawer';
import { derivWS, SUPPORTED_MARKETS, ConnectionState } from './services/derivWebSocket';
import { audioService } from './services/audioAlerts';
import { calculateDigitStats } from './utils/digitAnalysis';
import {
  DerivAccount,
  DerivTick,
  DigitStats,
  MarketSymbol,
  ScanMode,
  TradeOrder,
} from './types/deriv';
import {
  Sparkles,
  History,
  Activity,
  Layers,
  Zap,
  Info,
  RefreshCw,
  AlertTriangle,
  Globe
} from 'lucide-react';

export default function App() {
  // Connection & Telemetry State
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState<boolean>(false);

  // Deriv Account State
  const [account, setAccount] = useState<DerivAccount>({
    isAuthorized: false,
    currency: 'USD',
    balance: 10000.0,
    isVirtual: true,
    loginId: 'VRTC_DEMO',
    fullName: 'Demo Trader',
  });

  // Scanner Config & Mode State
  const [scanMode, setScanMode] = useState<ScanMode>('even_odd');
  const [marketFilter, setMarketFilter] = useState<'all' | 'volatility_1s' | 'jump' | 'volatility_standard'>('all');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [windowSize, setWindowSize] = useState<number>(25);
  const [minConfidence, setMinConfidence] = useState<number>(60);
  const [selectedMarketIds, setSelectedMarketIds] = useState<string[]>([
    // All 1(s) Markets
    '1HZ10V',
    '1HZ15V',
    '1HZ25V',
    '1HZ30V',
    '1HZ50V',
    '1HZ75V',
    '1HZ90V',
    '1HZ100V',
    '1HZ150V',
    '1HZ200V',
    '1HZ250V',
    '1HZ300V',
    // All Jump Indices
    'JD10',
    'JD25',
    'JD50',
    'JD75',
    'JD100',
  ]);

  // Market Ticks & Stats Buffers
  const [ticksMap, setTicksMap] = useState<Record<string, DerivTick[]>>({});
  const lastAlertTimes = useRef<Record<string, number>>({});

  // Trades History
  const [trades, setTrades] = useState<TradeOrder[]>([]);
  const [isTradeHistoryOpen, setIsTradeHistoryOpen] = useState<boolean>(false);

  // Modals State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [analyzingMarketId, setAnalyzingMarketId] = useState<string | null>(null);

  // Active markets list with category filter
  const activeMarkets = useMemo(() => {
    return SUPPORTED_MARKETS
      .filter((m) => selectedMarketIds.includes(m.id))
      .filter((m) => marketFilter === 'all' || m.category === marketFilter);
  }, [selectedMarketIds, marketFilter]);

  // Calculate stats for all active markets
  const marketStatsMap = useMemo(() => {
    const stats: Record<string, DigitStats> = {};
    for (const market of activeMarkets) {
      const ticks = ticksMap[market.id] || [];
      stats[market.id] = calculateDigitStats(market.id, ticks, windowSize, minConfidence, market.pipSize);
    }
    return stats;
  }, [activeMarkets, ticksMap, windowSize, minConfidence]);

  // Connect to Deriv WebSocket on mount
  useEffect(() => {
    const unsubscribeState = derivWS.onStateChange((state) => {
      setConnectionState(state);
    });

    const unsubscribeLatency = derivWS.onLatency((lat) => {
      setLatencyMs(lat);
    });

    const unsubscribeBalance = derivWS.onBalance((acc) => {
      setAccount(acc);
    });

    const unsubscribeHistory = derivWS.onHistory((symbol, historicalTicks) => {
      setTicksMap((prev) => {
        return {
          ...prev,
          [symbol]: historicalTicks.slice(-100),
        };
      });
    });

    const unsubscribeTick = derivWS.onTick((symbol, newTick) => {
      audioService.playTick();

      setTicksMap((prev) => {
        const current = prev[symbol] || [];
        const updated = [...current, newTick].slice(-100);
        return {
          ...prev,
          [symbol]: updated,
        };
      });
    });

    // Initiate WebSocket connection
    derivWS.connect();
    derivWS.subscribeToSymbols(selectedMarketIds);

    return () => {
      unsubscribeState();
      unsubscribeLatency();
      unsubscribeBalance();
      unsubscribeHistory();
      unsubscribeTick();
    };
  }, []);

  // Update WS subscriptions when selectedMarketIds changes
  useEffect(() => {
    derivWS.subscribeToSymbols(selectedMarketIds);
  }, [selectedMarketIds]);

  // Signal audio chime detector
  useEffect(() => {
    if (!soundEnabled) return;

    for (const [symbol, stats] of Object.entries(marketStatsMap)) {
      if (stats.signal.label.includes('ENTRY') && stats.signal.strength >= minConfidence) {
        const now = Date.now();
        const lastAlert = lastAlertTimes.current[symbol] || 0;

        // Throttle alert to at most once per 12 seconds per symbol
        if (now - lastAlert > 12000) {
          lastAlertTimes.current[symbol] = now;
          audioService.playSignalAlert(stats.signal.type === 'even');
        }
      }
    }
  }, [marketStatsMap, soundEnabled, minConfidence]);

  // Timer tick effect to update circular countdown rings smoothly
  useEffect(() => {
    const interval = setInterval(() => {
      // Re-trigger render every 1s for the 25s countdown timer animation
      setTicksMap((prev) => ({ ...prev }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    audioService.setEnabled(nextState);
  };

  const handlePlaceTrade = (
    symbol: string,
    contractType: 'DIGITEVEN' | 'DIGITODD' | 'DIGITOVER' | 'DIGITUNDER',
    stake: number
  ) => {
    const orderId = Math.random().toString(36).substring(2, 9);
    const newTrade: TradeOrder = {
      id: orderId,
      symbol,
      contractType,
      stake,
      payout: 0,
      status: 'pending',
      timestamp: Date.now(),
      isSimulated: !account.isAuthorized,
    };

    setTrades((prev) => [...prev, newTrade]);

    derivWS.placeTrade(symbol, contractType, stake, 1, (won, exitTick, payout) => {
      if (won) {
        audioService.playWin();
      } else {
        audioService.playLoss();
      }

      setTrades((prev) =>
        prev.map((t) =>
          t.id === orderId
            ? {
                ...t,
                status: won ? 'won' : 'lost',
                payout,
                exitTick,
              }
            : t
        )
      );
    });
  };

  const activeSignalsCount = useMemo(() => {
    return Object.values(marketStatsMap).filter((s) => s.signal.label.includes('ENTRY')).length;
  }, [marketStatsMap]);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      {/* Header Bar */}
      <Header
        connectionState={connectionState}
        latencyMs={latencyMs}
        account={account}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenConnectionModal={() => setIsConnectionModalOpen(true)}
        scanMode={scanMode}
        onChangeScanMode={setScanMode}
        activeMarketsCount={activeMarkets.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-4">
        {/* Connection Notice Banner if in fallback or disconnected */}
        {connectionState === 'fallback_live' && (
          <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-800/60 shadow-lg flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Globe className="w-4 h-4 animate-spin" />
              </span>
              <div>
                <span className="text-xs font-bold text-amber-300 block">
                  Synthetic Live Feed Active (Deriv WebSocket Handshake Blocked)
                </span>
                <span className="text-[11px] text-slate-300">
                  Deriv returned Cloudflare Error 520 or blocked direct connection. Streaming realistic real-time ticks so digit analysis continues seamlessly.
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsConnectionModalOpen(true)}
              className="px-3 py-1 rounded-xl bg-amber-900/60 hover:bg-amber-800 border border-amber-700/80 text-amber-200 text-xs font-bold font-mono transition-all flex items-center gap-1.5"
            >
              <span>Diagnose / Retry WS</span>
            </button>
          </div>
        )}

        {/* Active Signal Alert Banner (if any market triggers high confidence entry) */}
        {activeSignalsCount > 0 && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-[#10192e] to-fuchsia-950/70 border border-emerald-500/40 shadow-lg shadow-emerald-950/40 flex flex-wrap items-center justify-between gap-2.5 animate-pulse-glow">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Zap className="w-4 h-4" />
              </span>
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  {activeSignalsCount} Active Entry Signal{activeSignalsCount > 1 ? 's' : ''} Detected
                </span>
                <span className="text-[11px] text-slate-300 font-mono">
                  High probability digit entry skew ready for execution
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {Object.values(marketStatsMap)
                .filter((s) => s.signal.label.includes('ENTRY'))
                .slice(0, 3)
                .map((s) => (
                  <button
                    key={s.symbol}
                    onClick={() => setAnalyzingMarketId(s.symbol)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                      s.signal.type === 'even'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 hover:bg-fuchsia-500/30'
                    }`}
                  >
                    <span>{s.symbol}</span>
                    <span className="font-extrabold">{s.signal.label}</span>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Market Category Selector Bar */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 bg-[#0f1628] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setMarketFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                marketFilter === 'all'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Active ({selectedMarketIds.length})
            </button>
            <button
              onClick={() => setMarketFilter('volatility_1s')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                marketFilter === 'volatility_1s'
                  ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-md shadow-cyan-500/25'
                  : 'text-cyan-400 hover:bg-cyan-950/40'
              }`}
            >
              <span>1(s) Markets</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                marketFilter === 'volatility_1s' ? 'bg-cyan-900 text-cyan-200' : 'bg-cyan-950 text-cyan-300'
              }`}>
                {SUPPORTED_MARKETS.filter(m => m.category === 'volatility_1s' && selectedMarketIds.includes(m.id)).length}
              </span>
            </button>
            <button
              onClick={() => setMarketFilter('jump')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                marketFilter === 'jump'
                  ? 'bg-purple-500 text-white font-extrabold shadow-md shadow-purple-500/25'
                  : 'text-purple-400 hover:bg-purple-950/40'
              }`}
            >
              <span>Jump Indices</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                marketFilter === 'jump' ? 'bg-purple-900 text-purple-200' : 'bg-purple-950 text-purple-300'
              }`}>
                {SUPPORTED_MARKETS.filter(m => m.category === 'jump' && selectedMarketIds.includes(m.id)).length}
              </span>
            </button>
            <button
              onClick={() => setMarketFilter('volatility_standard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                marketFilter === 'volatility_standard'
                  ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md shadow-emerald-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Standard Volatility</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-800 text-slate-300">
                {SUPPORTED_MARKETS.filter(m => m.category === 'volatility_standard' && selectedMarketIds.includes(m.id)).length}
              </span>
            </button>
          </div>

          <div className="text-xs font-mono text-slate-400 hidden sm:flex items-center gap-2">
            <span>Showing: <strong className="text-white font-bold">{activeMarkets.length}</strong> markets</span>
          </div>
        </div>

        {/* Content View according to mode */}
        {scanMode === 'digit_matrix' ? (
          <DigitMatrix
            markets={activeMarkets}
            marketStats={marketStatsMap}
            onSelectMarket={(symbol) => setAnalyzingMarketId(symbol)}
          />
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {activeMarkets.map((market) => {
              const stats = marketStatsMap[market.id] || calculateDigitStats(market.id, [], windowSize, minConfidence);
              return (
                <MarketCard
                  key={market.id}
                  market={market}
                  stats={stats}
                  scanMode={scanMode}
                  onOpenAnalysis={(sym) => setAnalyzingMarketId(sym)}
                  onPlaceTrade={handlePlaceTrade}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Quick Toolbar / Status */}
      <footer className="sticky bottom-0 z-20 bg-[#0d1322]/95 backdrop-blur-md border-t border-slate-800/80 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <strong className="text-slate-200">ws.derivws.com</strong>
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline text-slate-400">
              Window: {windowSize} ticks ({minConfidence}% threshold)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTradeHistoryOpen(true)}
              className="px-3 py-1 rounded-xl bg-[#141c2e] hover:bg-[#1a253c] border border-slate-700/80 text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span>Trades ({trades.length})</span>
            </button>
          </div>
        </div>
      </footer>

      {/* AI Statistical Analysis Modal */}
      {analyzingMarketId && (
        <AiAnalysisModal
          market={SUPPORTED_MARKETS.find((m) => m.id === analyzingMarketId) || null}
          stats={marketStatsMap[analyzingMarketId] || null}
          onClose={() => setAnalyzingMarketId(null)}
          onPlaceTrade={handlePlaceTrade}
        />
      )}

      {/* Deriv Account & API Token Modal */}
      {isAccountModalOpen && (
        <TokenModal
          account={account}
          onAuthorize={(token) => derivWS.authorize(token)}
          onDisconnect={() => derivWS.disconnectAccount()}
          onResetDemo={() => derivWS.resetDemoBalance(10000.0)}
          onClose={() => setIsAccountModalOpen(false)}
        />
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <SettingsModal
          allMarkets={SUPPORTED_MARKETS}
          selectedMarketIds={selectedMarketIds}
          windowSize={windowSize}
          minConfidence={minConfidence}
          appId={derivWS.getAppId()}
          onSaveSettings={(settings) => {
            setSelectedMarketIds(settings.selectedMarketIds);
            setWindowSize(settings.windowSize);
            setMinConfidence(settings.minConfidence);
            derivWS.setAppId(settings.appId);
          }}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}

      {/* Connection Diagnostics Modal */}
      {isConnectionModalOpen && (
        <ConnectionModal
          connectionState={connectionState}
          latencyMs={latencyMs}
          currentEndpoint={derivWS.getCurrentEndpoint()}
          appId={derivWS.getAppId()}
          errorReason={derivWS.getConnectionErrorReason()}
          onReconnect={() => derivWS.reconnect()}
          onSelectEndpoint={(idx) => derivWS.setEndpointIndex(idx)}
          onChangeAppId={(id) => derivWS.setAppId(id)}
          onClose={() => setIsConnectionModalOpen(false)}
        />
      )}

      {/* Trade Execution History Drawer */}
      <TradeHistoryDrawer
        isOpen={isTradeHistoryOpen}
        onClose={() => setIsTradeHistoryOpen(false)}
        trades={trades}
        onClearHistory={() => setTrades([])}
      />
    </div>
  );
}
