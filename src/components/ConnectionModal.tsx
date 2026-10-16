import React, { useState } from 'react';
import { ConnectionState, DERIV_ENDPOINTS } from '../services/derivWebSocket';
import { X, Wifi, WifiOff, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';

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
                  : 'bg-rose-950/80 border-rose-800 text-rose-400'
              }`}
            >
              {isConnected ? (
                <Wifi className="w-5 h-5 text-emerald-400" />
              ) : (
                <WifiOff className="w-5 h-5 text-rose-400" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Deriv Real-Time WebSocket Diagnostics</h3>
              <p className="text-xs text-slate-400">Direct streaming connection to official Deriv infrastructure</p>
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
            <span className="text-slate-400">Live Socket Status:</span>
            {isConnected ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Connected to Official Deriv WS ({latencyMs}ms)
              </span>
            ) : (
              <span className="text-rose-400 font-bold flex items-center gap-1.5">
                <WifiOff className="w-4 h-4" />
                Connecting / Disconnected
              </span>
            )}
          </div>

          <div className="mt-2.5 space-y-1 text-[11px] text-slate-300">
            <div>
              <span className="text-slate-500">Active Endpoint: </span>
              <span className="text-cyan-400 break-all">{currentEndpoint}</span>
            </div>
            <div>
              <span className="text-slate-500">Registered App ID: </span>
              <span className="text-white font-bold">{initialAppId}</span>
            </div>
            {errorReason && (
              <div className="text-rose-400 pt-1">
                <span className="text-slate-500">Last Error: </span>
                <span>{errorReason}</span>
              </div>
            )}
          </div>
        </div>

        {/* Endpoint Switcher */}
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Available Deriv WebSocket Endpoints:
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
              Custom Deriv App ID (Default: 1089):
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
              <span>{isRetrying ? 'Connecting...' : 'Reconnect Deriv WebSocket'}</span>
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
