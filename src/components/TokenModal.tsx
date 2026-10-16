import React, { useState } from 'react';
import { DerivAccount } from '../types/deriv';
import { X, Key, CheckCircle2, Shield, ExternalLink, AlertCircle, LogOut, AlertTriangle } from 'lucide-react';

interface TokenModalProps {
  account: DerivAccount;
  onAuthorize: (token: string, callback?: (success: boolean, errorMsg?: string, account?: DerivAccount) => void) => void;
  onDisconnect: () => void;
  onClose: () => void;
}

export const TokenModal: React.FC<TokenModalProps> = ({
  account,
  onAuthorize,
  onDisconnect,
  onClose,
}) => {
  const [tokenInput, setTokenInput] = useState<string>(account.token || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasTradeScope = account.scopes ? account.scopes.includes('trade') : true;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setErrorMessage('Please enter a valid Deriv API token.');
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    onAuthorize(tokenInput.trim(), (success, errorMsg, acc) => {
      setIsSubmitting(false);
      if (success && acc) {
        const accountTypeStr = acc.isVirtual ? 'Demo Account' : 'Real Money Account';
        setSuccessMessage(`Authorized as ${acc.loginId} (${accountTypeStr})! Live balance: $${acc.balance.toFixed(2)} ${acc.currency}`);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMessage(errorMsg || 'Failed to authenticate with Deriv. Please ensure your token is active and valid.');
      }
    });
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
              <h3 className="text-base font-bold text-white">Deriv Account & Real Money Trading</h3>
              <p className="text-xs text-slate-400">Connect your Deriv API token for real execution &amp; balance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Account Status Box */}
        <div className="mt-4 p-3.5 rounded-xl bg-[#0a0f1c] border border-slate-800/90">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">Deriv Connection:</span>
            {account.isAuthorized ? (
              <span className={`flex items-center gap-1.5 text-xs font-bold ${account.isVirtual ? 'text-cyan-400' : 'text-emerald-400'}`}>
                <CheckCircle2 className="w-4 h-4" />
                {account.isVirtual ? 'Demo Account Connected' : 'Real Account Connected (Real Funds)'}
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-400">
                Not Connected (Live Prices Streaming)
              </span>
            )}
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Account Login ID</span>
              <span className="text-slate-100 font-bold truncate block">
                {account.loginId || 'No token connected'}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Real Balance</span>
              <span className="text-emerald-400 font-bold text-sm tabular-nums block">
                ${account.balance.toFixed(2)} {account.currency}
              </span>
            </div>
          </div>

          {account.isAuthorized && account.scopes && (
            <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Token Permissions:</span>
              <div className="flex items-center gap-1">
                {account.scopes.map((sc) => (
                  <span
                    key={sc}
                    className={`px-1.5 py-0.2 rounded uppercase text-[9px] font-bold ${
                      sc === 'trade'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {sc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {account.isAuthorized && !hasTradeScope && (
            <div className="mt-2 p-2 rounded-lg bg-amber-950/40 border border-amber-800/60 flex items-center gap-2 text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Warning: This token lacks <strong>Trade</strong> scope. You will not be able to execute buy contracts until Trade is checked.</span>
            </div>
          )}
        </div>

        {/* Token Input Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Deriv API Token
            </label>
            <div className="relative">
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste your Deriv API token here"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            {errorMessage && (
              <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </p>
            )}
            {successMessage && (
              <p className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{successMessage}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50"
            >
              <Key className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>
                {isSubmitting
                  ? 'Verifying with Deriv...'
                  : account.isAuthorized
                  ? 'Update Token'
                  : 'Authorize & Connect'}
              </span>
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
          </div>
        </form>

        {/* Real Deriv Token Instructions */}
        <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-1 text-cyan-400 font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>How to generate a Real Money Deriv API Token:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
            <li>Log in to your Deriv account at <strong className="text-white">app.deriv.com</strong>.</li>
            <li>Switch to your <strong>Real Account</strong> (e.g. CRxxxx) in the top-right account dropdown if you want to trade real money, or Demo account (VRTCxxxx).</li>
            <li>Go to <strong>Manage account &gt; Security &amp; safety &gt; API token</strong>.</li>
            <li>Give it a token name (e.g. <code className="text-cyan-300">DigitScanner</code>) and select:
              <ul className="list-disc list-inside ml-4 mt-0.5 space-y-0.5 text-slate-300">
                <li><strong className="text-emerald-400">Read</strong> (to fetch live account balance and verify details)</li>
                <li><strong className="text-emerald-400">Trade</strong> (to execute real contract orders when you click Trade)</li>
              </ul>
            </li>
            <li>Click <strong>Create</strong>, copy your token, and paste it above.</li>
          </ol>
          <a
            href="https://app.deriv.com/account/api-token"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-[11px] hover:underline pt-1"
          >
            <span>Open Deriv API Tokens page directly</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
