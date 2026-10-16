import React, { useState } from 'react';
import { ConnectionState, DERIV_ENDPOINTS } from '../services/derivWebSocket';
import { X, Wifi, WifiOff, AlertTriangle, RefreshCw, CheckCircle2, ShieldAlert, Globe } from 'lucide-react';

interface ConnectionModalProps {
  connectionState: ConnectionState;
  latencyMs: number;
  currentEndpoint: string;
  appId: string;
  errorReason: string;
  onReconnect: () => void;
  onSelectEndpoint: (index: number) => void;
  onChangeAppId: (appId: string) => void;
  onClose: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  connectionState,
  latencyMs,
  currentEndpoint,
  appId: initialAppId,
  errorReason,
  onReconnect,
  onSelectEndpoint,
  onChangeAppId,
  onClose,
}) => {
  const [appIdInput, setAppIdInput] = useState<string>(initialAppId);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const handleRetry = () => {
    setIsRetrying(true);
    onChangeAppId(appIdInput);
    onReconnect();
    setTimeout(() => {
      setIsRetrying(false);
    }, 1500);
  };

  const isConnected = connectionState === 'connected';
  const isFallback = connectionState === 'fallback_live';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0f1628] border border-slate-700/80 rounded-2xl shadow-2xl p-4 sm:p-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                isConnected
                  ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400'
                  : isFallback
                  ? 'bg-amber-950/80 border-amber-800 text-amber-400'
                  : 'bg-rose-950/80 border-rose-800 text-rose-400'
              }`}
            >
              {isConnected ? (
                <Wifi className="w-5 h-5 text-emerald-400" />
              ) : isFallback ? (
                <Globe className="w-5 h-5 text-amber-400" />
              ) : (
                <WifiOff className="w-5 h-5 text-rose-400" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">WebSocket Diagnostics</h3>
              <p className="text-xs text-slate-400">Deriv network connection &amp; fallback feed status</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Overview */}
        <div className="mt-4 p-3.5 rounded-xl bg-[#0a0f1c] border border-slate-800/90 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Connection Feed:</span>
            {isConnected ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Live Deriv Official WS ({latencyMs}ms)
              </span>
            ) : isFallback ? (
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <Globe className="w-4 h-4 animate-spin" />
                Active (Synthetic Live Feed)
              </span>
            ) : (
              <span className="text-rose-400 font-bold flex items-center gap-1.5">
                <WifiOff className="w-4 h-4" />
                Disconnected
              </span>
            )}
          </div>

          <div className="mt-2.5 space-y-1 text-[11px] text-slate-300">
            <div>
              <span className="text-slate-500">Endpoint: </span>
              <span className="text-cyan-400 break-all">{currentEndpoint}</span>
            </div>
            <div>
              <span className="text-slate-500">App ID: </span>
              <span className="text-white font-bold">{initialAppId}</span>
            </div>
          </div>
        </div>

        {/* Diagnostic Explanation (Why is it disconnected?) */}
        {!isConnected && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/50 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Why is the Deriv WebSocket disconnected?</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
              <li>
                <strong className="text-white">Cloudflare Error 520 / Firewall:</strong> Deriv uses Cloudflare protection which rejects or closes direct WebSocket handshakes from certain countries, datacenters, and sandbox iframes.
              </li>
              <li>
                <strong className="text-white">Ad-Blockers &amp; Privacy Shields:</strong> Extensions like Brave Shields, uBlock Origin, or AdBlock often block domains matching <code className="text-cyan-300">*.derivws.com</code> or <code className="text-cyan-300">*.binaryws.com</code>.
              </li>
              <li>
                <strong className="text-white">Regional Trading Restrictions:</strong> Deriv restricts access in certain jurisdictions (e.g. USA, UK, parts of EU).
              </li>
            </ul>
            <div className="pt-1 text-[11px] text-amber-200/90 bg-amber-950/40 p-2 rounded-lg border border-amber-900/60">
              💡 <strong>Automatic Protection:</strong> The app automatically streams realistic 1-second synthetic market ticks so your digit scanner, even/odd prediction, and trading simulation continue without interruption.
            </div>
          </div>
        )}

        {/* Endpoint Switcher */}
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Switch Deriv WebSocket Endpoint:
            </label>
            <div className="space-y-1.5">
              {DERIV_ENDPOINTS.map((ep, idx) => (
                <button
                  key={ep}
                  type="button"
                  onClick={() => onSelectEndpoint(idx)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-all border flex items-center justify-between ${
                    currentEndpoint === ep
                      ? 'bg-cyan-950/50 border-cyan-500/80 text-cyan-200 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="truncate">{ep}</span>
                  {currentEndpoint === ep && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950 font-bold shrink-0 ml-2">
                      Active
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              App ID:
            </label>
            <input
              type="text"
              value={appIdInput}
              onChange={(e) => setAppIdInput(e.target.value)}
              placeholder="1089"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="flex-1 py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Connecting...' : 'Retry Deriv Connection'}</span>
            </button>
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
