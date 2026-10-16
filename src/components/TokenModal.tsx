import React, { useState } from 'react';
import { DerivAccount } from '../types/deriv';
import { X, Key, CheckCircle2, Shield, ExternalLink, RotateCcw, AlertCircle, LogOut } from 'lucide-react';

interface TokenModalProps {
  account: DerivAccount;
  onAuthorize: (token: string) => void;
  onDisconnect: () => void;
  onResetDemo: () => void;
  onClose: () => void;
}

export const TokenModal: React.FC<TokenModalProps> = ({
  account,
  onAuthorize,
  onDisconnect,
  onResetDemo,
  onClose,
}) => {
  const [tokenInput, setTokenInput] = useState<string>(account.token || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setErrorMessage('Please enter a valid Deriv API token.');
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    onAuthorize(tokenInput.trim());

    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0f1628] border border-slate-700/80 rounded-2xl shadow-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800/80 text-cyan-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Deriv Account & Real-Time Balance</h3>
              <p className="text-xs text-slate-400">Connect your Deriv account for live streaming balance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Box */}
        <div className="mt-4 p-3.5 rounded-xl bg-[#0a0f1c] border border-slate-800/90">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">Current Status:</span>
            {account.isAuthorized ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Authorized ({account.isVirtual ? 'Virtual Account' : 'Real Account'})
              </span>
            ) : (
              <span className="text-xs font-medium text-amber-400">
                Simulator Mode (Real Market Ticks Streaming)
              </span>
            )}
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Login ID</span>
              <span className="text-slate-100 font-bold truncate block">
                {account.loginId || 'Guest Trader'}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Live Balance</span>
              <span className="text-emerald-400 font-bold text-sm tabular-nums block">
                ${account.balance.toFixed(2)} {account.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Token Input Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Deriv API Token
            </label>
            <div className="relative">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="e.g. a1-Xk9Lp..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            {errorMessage && (
              <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errorMessage}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50"
            >
              <Key className="w-4 h-4" />
              <span>{account.isAuthorized ? 'Update Token' : 'Connect Account'}</span>
            </button>

            {account.isAuthorized && (
              <button
                type="button"
                onClick={onDisconnect}
                className="py-2 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            )}

            <button
              type="button"
              onClick={onResetDemo}
              className="py-2 px-3 rounded-xl bg-[#141c2e] hover:bg-[#1a253c] border border-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
              title="Reset Demo Balance to $10,000"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reset $10k</span>
            </button>
          </div>
        </form>

        {/* Instructions */}
        <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-1 text-cyan-400 font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>How to generate a Deriv API Token:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
            <li>Log in to your Deriv account (app.deriv.com).</li>
            <li>Go to <strong>Manage account &gt; Security &amp; safety &gt; API token</strong>.</li>
            <li>Enter a name and check scopes (<strong>Read</strong> for balance &amp; ticks, <strong>Trade</strong> for automated buy contracts).</li>
            <li>Copy and paste your generated token above.</li>
          </ol>
          <a
            href="https://app.deriv.com/account/api-token"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-[11px] hover:underline pt-1"
          >
            <span>Open Deriv API Tokens page</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
