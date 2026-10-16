import React from 'react';
import {
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  Wallet,
  Activity,
  Layers,
  Sparkles,
  ArrowRightLeft,
  Globe
} from 'lucide-react';
import { DerivAccount, ScanMode } from '../types/deriv';
import { ConnectionState } from '../services/derivWebSocket';

interface HeaderProps {
  connectionState: ConnectionState;
  latencyMs: number;
  account: DerivAccount;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenAccountModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenConnectionModal: () => void;
  scanMode: ScanMode;
  onChangeScanMode: (mode: ScanMode) => void;
  activeMarketsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  connectionState,
  latencyMs,
  account,
  soundEnabled,
  onToggleSound,
  onOpenAccountModal,
  onOpenSettingsModal,
  onOpenConnectionModal,
  scanMode,
  onChangeScanMode,
  activeMarketsCount,
}) => {
  const isConnected = connectionState === 'connected';
  const isFallback = connectionState === 'fallback_live';

  const formatBalance = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0d1322]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Identity & Active count */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-fuchsia-500 p-[1.5px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
              <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
                9D
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white whitespace-nowrap">
                Deriv Digit Tool
              </h1>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 hidden sm:inline-block">
                LIVE WS
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
              <span>{activeMarketsCount} Active Markets</span>
              <span>·</span>
              <span>v3 API</span>
            </div>
          </div>
        </div>

        {/* Center: Mode Tabs */}
        <div className="flex items-center bg-[#141c2e] p-1 rounded-xl border border-slate-800/90 max-w-md overflow-x-auto">
          <button
            onClick={() => onChangeScanMode('even_odd')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              scanMode === 'even_odd'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-md shadow-emerald-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Even / Odd
          </button>
          <button
            onClick={() => onChangeScanMode('over_under')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              scanMode === 'over_under'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Over / Under
          </button>
          <button
            onClick={() => onChangeScanMode('digit_matrix')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              scanMode === 'digit_matrix'
                ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-slate-950 font-bold shadow-md shadow-fuchsia-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            0-9 Matrix
          </button>
        </div>

        {/* Right: Live Telemetry, Account Balance & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Connection status indicator (clickable for diagnostics) */}
          <button
            onClick={onOpenConnectionModal}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-mono transition-all hover:scale-105 active:scale-95 ${
              isConnected
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400 hover:bg-emerald-900/50'
                : isFallback
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-300 hover:bg-amber-900/50'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-400 hover:bg-rose-900/50'
            }`}
            title="Click for Connection Diagnostics & Reconnect"
          >
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="hidden sm:inline font-bold">Deriv WS</span>
                <span className="hidden md:inline tabular-nums text-[10px] text-emerald-300">({latencyMs}ms)</span>
              </>
            ) : isFallback ? (
              <>
                <Globe className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="font-bold">Live Feed</span>
                <span className="hidden lg:inline text-[10px] text-amber-200/80">(Deriv 520)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline font-bold">Disconnected</span>
              </>
            )}
          </button>

          {/* Account Balance Button */}
          <button
            onClick={onOpenAccountModal}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#141c2e] hover:bg-[#1a253c] border border-slate-700/80 transition-all text-left shadow-sm group"
          >
            <Wallet className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 leading-none flex items-center gap-1">
                {account.isAuthorized ? (
                  <span className="text-emerald-400 font-semibold">{account.isVirtual ? 'DEMO' : 'REAL'}</span>
                ) : (
                  <span className="text-amber-400 font-medium">SIMULATOR</span>
                )}
                <span className="hidden lg:inline">· {account.loginId || 'Guest'}</span>
              </span>
              <span className="text-xs sm:text-sm font-bold font-mono text-white tabular-nums leading-tight">
                {formatBalance(account.balance, account.currency)}
              </span>
            </div>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound alerts' : 'Enable sound alerts'}
            className={`p-2 rounded-xl border transition-all ${
              soundEnabled
                ? 'bg-cyan-950/40 border-cyan-800/80 text-cyan-400 hover:bg-cyan-900/50'
                : 'bg-[#141c2e] border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={soundEnabled ? 'Sound alerts ON' : 'Sound alerts OFF'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettingsModal}
            aria-label="Configuration settings"
            className="p-2 rounded-xl bg-[#141c2e] hover:bg-[#1a253c] border border-slate-800 text-slate-300 hover:text-white transition-all"
            title="Scan Settings & Markets"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
