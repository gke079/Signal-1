import { DerivAccount, DerivTick, MarketSymbol } from '../types/deriv';

export const SUPPORTED_MARKETS: MarketSymbol[] = [
  // --- All 1-Second (1s) Volatility Markets ---
  {
    id: '1HZ10V',
    name: 'Volatility 10 (1s)',
    category: 'volatility_1s',
    pipSize: 2,
    description: '1 tick/s • 10% constant volatility',
  },
  {
    id: '1HZ15V',
    name: 'Volatility 15 (1s)',
    category: 'volatility_1s',
    pipSize: 2,
    description: '1 tick/s • 15% constant volatility',
  },
  {
    id: '1HZ25V',
    name: 'Volatility 25 (1s)',
    category: 'volatility_1s',
    pipSize: 2,
    description: '1 tick/s • 25% constant volatility',
  },
  {
    id: '1HZ30V',
    name: 'Volatility 30 (1s)',
    category: 'volatility_1s',
    pipSize: 2,
    description: '1 tick/s • 30% constant volatility',
  },
  {
    id: '1HZ50V',
    name: 'Volatility 50 (1s)',
    category: 'volatility_1s',
    pipSize: 4,
    description: '1 tick/s • 50% constant volatility (4 decimals)',
  },
  {
    id: '1HZ75V',
    name: 'Volatility 75 (1s)',
    category: 'volatility_1s',
    pipSize: 4,
    description: '1 tick/s • 75% constant volatility (4 decimals)',
  },
  {
    id: '1HZ90V',
    name: 'Volatility 90 (1s)',
    category: 'volatility_1s',
    pipSize: 2,
    description: '1 tick/s • 90% constant volatility',
  },
  {
    id: '1HZ100V',
    name: 'Volatility 100 (1s)',
    category: 'volatility_1s',
    pipSize: 2,
    description: '1 tick/s • 100% extreme volatility',
  },
  {
    id: '1HZ150V',
    name: 'Volatility 150 (1s)',
    category: 'volatility_1s',
    pipSize: 2,
    description: '1 tick/s • 150% ultra-fast volatility',
  },
  {
    id: '1HZ200V',
    name: 'Volatility 200 (1s)',
    category: 'volatility_1s',
    pipSize: 2,
    description: '1 tick/s • 200% hyper volatility',
  },
  {
    id: '1HZ250V',
    name: 'Volatility 250 (1s)',
    category: 'volatility_1s',
    pipSize: 2,
    description: '1 tick/s • 250% high-frequency volatility',
  },
  {
    id: '1HZ300V',
    name: 'Volatility 300 (1s)',
    category: 'volatility_1s',
    pipSize: 2,
    description: '1 tick/s • 300% maximum volatility',
  },

  // --- All Jump Indices ---
  {
    id: 'JD10',
    name: 'Jump 10 Index',
    category: 'jump',
    pipSize: 2,
    description: '10% volatility • Price jumps avg every 20 mins',
  },
  {
    id: 'JD25',
    name: 'Jump 25 Index',
    category: 'jump',
    pipSize: 2,
    description: '25% volatility • Price jumps avg every 20 mins',
  },
  {
    id: 'JD50',
    name: 'Jump 50 Index',
    category: 'jump',
    pipSize: 2,
    description: '50% volatility • Price jumps avg every 20 mins',
  },
  {
    id: 'JD75',
    name: 'Jump 75 Index',
    category: 'jump',
    pipSize: 2,
    description: '75% volatility • Price jumps avg every 20 mins',
  },
  {
    id: 'JD100',
    name: 'Jump 100 Index',
    category: 'jump',
    pipSize: 2,
    description: '100% volatility • Price jumps avg every 20 mins',
  },

  // --- Standard Volatility Indices (2s interval) ---
  {
    id: 'R_10',
    name: 'Volatility 10 Index',
    category: 'volatility_standard',
    pipSize: 3,
    description: 'Standard 2-second tick interval',
  },
  {
    id: 'R_25',
    name: 'Volatility 25 Index',
    category: 'volatility_standard',
    pipSize: 3,
    description: 'Standard 2-second tick interval',
  },
  {
    id: 'R_50',
    name: 'Volatility 50 Index',
    category: 'volatility_standard',
    pipSize: 4,
    description: 'Standard 2-second tick interval',
  },
  {
    id: 'R_75',
    name: 'Volatility 75 Index',
    category: 'volatility_standard',
    pipSize: 4,
    description: 'Standard 2-second tick interval',
  },
  {
    id: 'R_100',
    name: 'Volatility 100 Index',
    category: 'volatility_standard',
    pipSize: 2,
    description: 'Standard 2-second tick interval',
  },
];

export const DERIV_ENDPOINTS = [
  'wss://ws.derivws.com/websockets/v3',
  'wss://ws.binaryws.com/websockets/v3',
  'wss://blue.derivws.com/websockets/v3',
  'wss://green.derivws.com/websockets/v3',
  'wss://red.derivws.com/websockets/v3',
];

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';
type TickCallback = (symbol: string, tick: DerivTick) => void;
type HistoryCallback = (symbol: string, ticks: DerivTick[]) => void;
type BalanceCallback = (account: DerivAccount) => void;
type LatencyCallback = (ms: number) => void;
type AuthCallback = (success: boolean, errorMsg?: string, account?: DerivAccount) => void;

class DerivWebSocketService {
  private ws: WebSocket | null = null;
  private appId: string = '1089';
  private currentEndpointIndex: number = 0;
  private connectionState: ConnectionState = 'connecting';
  private reconnectTimer: any = null;
  private pingTimer: any = null;
  private pingStartTime: number = 0;
  private latencyMs: number = 0;
  private activeSubscriptions = new Map<string, string>();
  private activeSymbols = new Set<string>();
  private connectionErrorReason: string = '';
  private subscriptionQueueTimer: any = null;
  private authCallbacks: AuthCallback[] = [];
  private isIntentionalDisconnect: boolean = false;
  private reqIdCounter: number = 0;

  private pendingBuyRequests = new Map<
    number,
    {
      symbol: string;
      contractType: string;
      stake: number;
      onComplete?: (won: boolean, exitTick?: DerivTick, payout?: number, errorMsg?: string, contractId?: number) => void;
    }
  >();

  private pendingOpenContracts = new Map<
    number,
    {
      symbol: string;
      contractType: string;
      stake: number;
      onComplete?: (won: boolean, exitTick?: DerivTick, payout?: number, errorMsg?: string, contractId?: number) => void;
    }
  >();

  // Real Account state (no fake balances)
  private account: DerivAccount = {
    isAuthorized: false,
    currency: 'USD',
    balance: 0.0,
    isVirtual: false,
    loginId: '',
    fullName: '',
  };

  // Callbacks
  private stateListeners = new Set<(state: ConnectionState) => void>();
  private tickListeners = new Set<TickCallback>();
  private historyListeners = new Set<HistoryCallback>();
  private balanceListeners = new Set<BalanceCallback>();
  private latencyListeners = new Set<LatencyCallback>();

  constructor() {
    if (typeof window !== 'undefined') {
      const savedAppId = localStorage.getItem('deriv_app_id');
      if (savedAppId) this.appId = savedAppId;

      const savedToken = localStorage.getItem('deriv_api_token');
      if (savedToken) {
        this.account.token = savedToken;
      }
    }
  }

  public setAppId(appId: string) {
    if (appId && appId !== this.appId) {
      this.appId = appId;
      if (typeof window !== 'undefined') {
        localStorage.setItem('deriv_app_id', appId);
      }
      this.reconnect();
    }
  }

  public getAppId(): string {
    return this.appId;
  }

  public getCurrentEndpoint(): string {
    return DERIV_ENDPOINTS[this.currentEndpointIndex];
  }

  public setEndpointIndex(index: number) {
    if (index >= 0 && index < DERIV_ENDPOINTS.length) {
      this.currentEndpointIndex = index;
      this.reconnect();
    }
  }

  public getAccount(): DerivAccount {
    return { ...this.account };
  }

  public getLatency(): number {
    return this.latencyMs;
  }

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  public getConnectionErrorReason(): string {
    return this.connectionErrorReason;
  }

  public onStateChange(listener: (state: ConnectionState) => void) {
    this.stateListeners.add(listener);
    listener(this.connectionState);
    return () => this.stateListeners.delete(listener);
  }

  public onTick(listener: TickCallback) {
    this.tickListeners.add(listener);
    return () => this.tickListeners.delete(listener);
  }

  public onHistory(listener: HistoryCallback) {
    this.historyListeners.add(listener);
    return () => this.historyListeners.delete(listener);
  }

  public onBalance(listener: BalanceCallback) {
    this.balanceListeners.add(listener);
    listener(this.account);
    return () => this.balanceListeners.delete(listener);
  }

  public onLatency(listener: LatencyCallback) {
    this.latencyListeners.add(listener);
    return () => this.latencyListeners.delete(listener);
  }

  private setState(state: ConnectionState) {
    this.connectionState = state;
    this.stateListeners.forEach((l) => l(state));
  }

  public connect(forceFresh: boolean = false) {
    if (!forceFresh && this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.setState('connecting');
    const endpoint = DERIV_ENDPOINTS[this.currentEndpointIndex];
    const url = `${endpoint}?app_id=${this.appId}&brand=deriv`;

    try {
      if (this.ws) {
        try {
          this.ws.onopen = null;
          this.ws.onmessage = null;
          this.ws.onerror = null;
          this.ws.onclose = null;
          this.ws.close();
        } catch {
          // ignore
        }
      }

      this.ws = new WebSocket(url);
    } catch (err: any) {
      this.connectionErrorReason = err?.message || 'WebSocket instantiation error';
      this.rotateEndpointAndRetry();
      return;
    }

    this.ws.onopen = () => {
      this.setState('connected');
      this.connectionErrorReason = '';
      this.startHeartbeat();

      // If user provided a real token, authorize immediately with real Deriv
      if (this.account.token) {
        this.send({ authorize: this.account.token });
      }

      // Stagger subscriptions nicely within Deriv rate limits (1 req / 180ms)
      this.flushSubscriptions();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (e) {
        console.error('[DerivWS] Failed to parse message:', e);
      }
    };

    this.ws.onerror = (e) => {
      console.warn(`[DerivWS] Connection error on ${endpoint}:`, e);
      this.connectionErrorReason = `Failed to connect to ${endpoint}.`;
      this.rotateEndpointAndRetry();
    };

    this.ws.onclose = (event) => {
      this.stopHeartbeat();
      if (!this.isIntentionalDisconnect) {
        this.setState('disconnected');
        this.connectionErrorReason = `Connection closed (code: ${event.code})`;
        this.scheduleReconnect(2500);
      }
    };
  }

  private rotateEndpointAndRetry() {
    this.currentEndpointIndex = (this.currentEndpointIndex + 1) % DERIV_ENDPOINTS.length;
    this.scheduleReconnect(2000);
  }

  private scheduleReconnect(delayMs: number = 2000) {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect(true);
    }, delayMs);
  }

  public reconnect() {
    this.isIntentionalDisconnect = true;
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
    this.isIntentionalDisconnect = false;
    this.connect(true);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.pingStartTime = Date.now();
        this.send({ ping: 1 });
      }
    }, 20000);
  }

  private stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  public send(msg: Record<string, unknown>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  public subscribeToSymbols(symbols: string[]) {
    symbols.forEach((s) => this.activeSymbols.add(s));
    if (this.connectionState === 'connected') {
      this.flushSubscriptions();
    }
  }

  private flushSubscriptions() {
    if (this.subscriptionQueueTimer) clearTimeout(this.subscriptionQueueTimer);

    const symbols = Array.from(this.activeSymbols);
    let index = 0;

    // Send 1 request every 180ms to stay safely below Deriv's strict 10 req/s rate limit
    const processNext = () => {
      if (this.connectionState !== 'connected' || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }

      if (index < symbols.length) {
        const symbol = symbols[index++];
        this.requestTicks(symbol);
        this.subscriptionQueueTimer = setTimeout(processNext, 180);
      }
    };

    processNext();
  }

  public unsubscribeSymbol(symbol: string) {
    this.activeSymbols.delete(symbol);
    const subId = this.activeSubscriptions.get(symbol);
    if (subId) {
      this.send({ forget: subId });
      this.activeSubscriptions.delete(symbol);
    }
  }

  private requestTicks(symbol: string) {
    this.send({
      ticks_history: symbol,
      end: 'latest',
      count: 50,
      style: 'ticks',
      subscribe: 1,
    });
  }

  public authorize(token: string, callback?: AuthCallback) {
    this.account.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('deriv_api_token', token);
    }

    if (callback) {
      this.authCallbacks.push(callback);
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({ authorize: token });
    } else {
      this.connect(true);
    }
  }

  public disconnectAccount() {
    this.account = {
      isAuthorized: false,
      token: undefined,
      loginId: '',
      currency: 'USD',
      balance: 0.0,
      isVirtual: false,
      fullName: '',
    };
    if (typeof window !== 'undefined') {
      localStorage.removeItem('deriv_api_token');
    }
    this.balanceListeners.forEach((l) => l(this.account));
  }

  private handleMessage(data: Record<string, any>) {
    const msgType = data.msg_type;

    // Direct Error Detection from Official Deriv API
    if (data.error) {
      console.warn(`[DerivWS] Response error for ${msgType || 'request'}:`, data.error.message);

      if (msgType === 'authorize') {
        const errorMsg = data.error.message || 'Authorization failed. Please check your Deriv API token.';
        this.account.isAuthorized = false;
        this.balanceListeners.forEach((l) => l(this.account));
        this.notifyAuthCallbacks(false, errorMsg);
        return;
      }

      if (msgType === 'buy') {
        const reqId = data.req_id;
        const pendingBuy = reqId ? this.pendingBuyRequests.get(reqId) : undefined;
        if (reqId) this.pendingBuyRequests.delete(reqId);
        if (pendingBuy?.onComplete) {
          pendingBuy.onComplete(false, undefined, 0, data.error.message || 'Trade execution rejected by Deriv');
        }
        return;
      }

      if (data.error.code === 'RateLimit') {
        console.warn('[DerivWS] Rate limit reached. Backing off subscription queue...');
        return;
      }

      if (data.error.code === 'AlreadySubscribed') {
        return;
      }
    }

    // Ping / Latency
    if (msgType === 'ping') {
      if (this.pingStartTime > 0) {
        this.latencyMs = Math.max(1, Date.now() - this.pingStartTime);
        this.latencyListeners.forEach((l) => l(this.latencyMs));
      }
      return;
    }

    // Real Historical Ticks from Official Deriv
    if (msgType === 'history' && data.history) {
      const symbol = data.echo_req?.ticks_history;
      if (!symbol) return;

      const prices = data.history.prices || [];
      const times = data.history.times || [];
      const pipSize = data.pip_size ?? this.getPipSizeForSymbol(symbol);

      const parsedTicks: DerivTick[] = [];
      for (let i = 0; i < prices.length; i++) {
        const rawQuote = Number(prices[i]);
        const quoteStr = rawQuote.toFixed(pipSize);
        const lastChar = quoteStr.slice(-1);
        const lastDigit = parseInt(lastChar, 10);
        const epoch = Number(times[i]);

        parsedTicks.push({
          quote: rawQuote,
          pip_size: pipSize,
          symbol,
          epoch,
          lastDigit: isNaN(lastDigit) ? 0 : lastDigit,
          isEven: lastDigit % 2 === 0,
          timeStr: new Date(epoch * 1000).toLocaleTimeString(),
        });
      }

      if (data.subscription?.id) {
        this.activeSubscriptions.set(symbol, data.subscription.id);
      }

      this.historyListeners.forEach((l) => l(symbol, parsedTicks));
      return;
    }

    // Real Live Tick from Official Deriv
    if (msgType === 'tick' && data.tick) {
      const rawTick = data.tick;
      const symbol = rawTick.symbol;
      const pipSize = rawTick.pip_size ?? this.getPipSizeForSymbol(symbol);
      const rawQuote = Number(rawTick.quote);
      const quoteStr = rawQuote.toFixed(pipSize);
      const lastChar = quoteStr.slice(-1);
      const lastDigit = parseInt(lastChar, 10);
      const epoch = Number(rawTick.epoch);

      const tick: DerivTick = {
        quote: rawQuote,
        pip_size: pipSize,
        symbol,
        epoch,
        id: rawTick.id,
        lastDigit: isNaN(lastDigit) ? 0 : lastDigit,
        isEven: lastDigit % 2 === 0,
        timeStr: new Date(epoch * 1000).toLocaleTimeString(),
      };

      if (data.subscription?.id) {
        this.activeSubscriptions.set(symbol, data.subscription.id);
      }

      this.tickListeners.forEach((l) => l(symbol, tick));
      return;
    }

    // Real Authorization from Official Deriv
    if (msgType === 'authorize' && data.authorize) {
      const auth = data.authorize;
      this.account = {
        isAuthorized: true,
        token: this.account.token,
        loginId: auth.loginid,
        email: auth.email,
        currency: auth.currency || 'USD',
        balance: Number(auth.balance),
        isVirtual: Boolean(auth.is_virtual),
        fullName: auth.fullname || auth.loginid,
        scopes: Array.isArray(auth.scopes) ? auth.scopes : [],
      };

      this.balanceListeners.forEach((l) => l(this.account));
      // Continuous balance subscription
      this.send({ balance: 1, subscribe: 1 });
      this.notifyAuthCallbacks(true, undefined, this.account);

      // Refresh symbols in authorized session
      this.flushSubscriptions();
      return;
    }

    // Real Live Balance Updates from Official Deriv
    if (msgType === 'balance' && data.balance) {
      this.account.balance = Number(data.balance.balance);
      this.account.currency = data.balance.currency || this.account.currency;
      this.balanceListeners.forEach((l) => l(this.account));
      return;
    }

    // Real Buy Contract Response from Official Deriv
    if (msgType === 'buy') {
      const reqId = data.req_id;
      const pendingBuy = reqId ? this.pendingBuyRequests.get(reqId) : undefined;
      if (reqId) this.pendingBuyRequests.delete(reqId);

      if (data.buy) {
        const contractId = data.buy.contract_id;
        if (data.buy.balance_after !== undefined) {
          this.account.balance = Number(data.buy.balance_after);
          this.balanceListeners.forEach((l) => l(this.account));
        }

        if (pendingBuy && contractId) {
          this.pendingOpenContracts.set(contractId, pendingBuy);
          // Subscribe to open contract settlement
          this.send({
            proposal_open_contract: 1,
            contract_id: contractId,
            subscribe: 1,
          });
        }
      }
      return;
    }

    // Real Contract Settlement from Official Deriv
    if (msgType === 'proposal_open_contract' && data.proposal_open_contract) {
      const poc = data.proposal_open_contract;
      const contractId = poc.contract_id;
      const pending = contractId ? this.pendingOpenContracts.get(contractId) : undefined;

      if (poc.is_sold === 1 && pending) {
        this.pendingOpenContracts.delete(contractId);
        const won = poc.status === 'won';
        const payout = Number(poc.payout || 0);
        const exitQuote = Number(poc.exit_tick || poc.current_spot || 0);
        const exitDisplay = poc.exit_tick_display_value || String(exitQuote);
        const exitDigit = parseInt(exitDisplay.slice(-1), 10);
        const symbol = poc.underlying || pending.symbol;
        const pipSize = this.getPipSizeForSymbol(symbol);

        const exitTick: DerivTick = {
          quote: exitQuote,
          pip_size: pipSize,
          symbol,
          epoch: poc.exit_tick_time || Math.floor(Date.now() / 1000),
          lastDigit: isNaN(exitDigit) ? 0 : exitDigit,
          isEven: exitDigit % 2 === 0,
          timeStr: new Date((poc.exit_tick_time || Date.now() / 1000) * 1000).toLocaleTimeString(),
        };

        if (data.subscription?.id) {
          this.send({ forget: data.subscription.id });
        }

        // Refresh balance after real contract settlement
        this.send({ balance: 1 });

        if (pending.onComplete) {
          pending.onComplete(won, exitTick, payout, undefined, contractId);
        }
      }
      return;
    }
  }

  private notifyAuthCallbacks(success: boolean, errorMsg?: string, account?: DerivAccount) {
    const callbacks = [...this.authCallbacks];
    this.authCallbacks = [];
    callbacks.forEach((cb) => {
      try {
        cb(success, errorMsg, account);
      } catch (e) {
        console.error('Error invoking auth callback:', e);
      }
    });
  }

  // Real Money Contract Execution on Deriv
  public placeTrade(
    symbol: string,
    contractType: string,
    stake: number,
    durationTicks: number = 1,
    barrier?: number,
    onComplete?: (won: boolean, exitTick?: DerivTick, payout?: number, errorMsg?: string, contractId?: number) => void
  ) {
    if (!this.account.token || !this.account.isAuthorized) {
      onComplete?.(false, undefined, 0, 'Please connect your Deriv API token with Trade scope to execute real money trades.');
      return;
    }

    if (this.account.scopes && !this.account.scopes.includes('trade')) {
      onComplete?.(false, undefined, 0, 'Your Deriv API token lacks "trade" permission. Please generate a new token with Trade scope enabled on Deriv.');
      return;
    }

    const reqId = ++this.reqIdCounter;
    this.pendingBuyRequests.set(reqId, {
      symbol,
      contractType,
      stake,
      onComplete,
    });

    const buyParams: Record<string, any> = {
      amount: stake,
      basis: 'stake',
      contract_type: contractType,
      currency: this.account.currency || 'USD',
      duration: durationTicks,
      duration_unit: 't',
      symbol,
    };

    if (barrier !== undefined) {
      buyParams.barrier = String(barrier);
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        buy: 1,
        price: stake,
        parameters: buyParams,
        req_id: reqId,
      });
    } else {
      this.connect(true);
      setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.send({
            buy: 1,
            price: stake,
            parameters: buyParams,
            req_id: reqId,
          });
        } else {
          this.pendingBuyRequests.delete(reqId);
          onComplete?.(false, undefined, 0, 'Deriv connection offline. Please check connection diagnostics.');
        }
      }, 1500);
    }
  }

  private getPipSizeForSymbol(symbol: string): number {
    const market = SUPPORTED_MARKETS.find((m) => m.id === symbol);
    return market ? market.pipSize : 2;
  }
}

export const derivWS = new DerivWebSocketService();
