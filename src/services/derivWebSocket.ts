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
  'wss://frontend.binaryws.com/websockets/v3',
];

export type ConnectionState = 'connecting' | 'connected' | 'fallback_live' | 'disconnected' | 'error';
type TickCallback = (symbol: string, tick: DerivTick) => void;
type HistoryCallback = (symbol: string, ticks: DerivTick[]) => void;
type BalanceCallback = (account: DerivAccount) => void;
type LatencyCallback = (ms: number) => void;

interface PendingTrade {
  id: string;
  symbol: string;
  contractType: string;
  stake: number;
  entryTick: DerivTick;
  durationTicks: number;
  ticksPassed: number;
  isSimulated: boolean;
  onComplete: (won: boolean, exitTick: DerivTick, payout: number) => void;
}

class DerivWebSocketService {
  private ws: WebSocket | null = null;
  private appId: string = '1089';
  private currentEndpointIndex: number = 0;
  private connectionState: ConnectionState = 'connecting';
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectTimeoutTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private fallbackTimer: NodeJS.Timeout | null = null;
  private pingStartTime: number = 0;
  private latencyMs: number = 0;
  private activeSubscriptions = new Map<string, string>();
  private activeSymbols = new Set<string>();
  private connectionErrorReason: string = '';

  // Synthetic price state for fallback engine
  private syntheticPrices: Record<string, number> = {
    '1HZ10V': 4821.52,
    '1HZ15V': 3120.45,
    '1HZ25V': 2194.88,
    '1HZ30V': 5612.33,
    '1HZ50V': 345.1824,
    '1HZ75V': 876.5419,
    '1HZ90V': 6214.71,
    '1HZ100V': 1245.38,
    '1HZ150V': 9450.12,
    '1HZ200V': 11840.65,
    '1HZ250V': 14210.84,
    '1HZ300V': 18920.42,
    'JD10': 1520.45,
    'JD25': 2410.88,
    'JD50': 4850.12,
    'JD75': 7120.65,
    'JD100': 9640.35,
    'R_10': 782.145,
    'R_25': 1340.521,
    'R_50': 234.9182,
    'R_75': 641.8724,
    'R_100': 1582.49,
  };

  // Callbacks
  private stateListeners = new Set<(state: ConnectionState) => void>();
  private tickListeners = new Set<TickCallback>();
  private historyListeners = new Set<HistoryCallback>();
  private balanceListeners = new Set<BalanceCallback>();
  private latencyListeners = new Set<LatencyCallback>();

  // Account state
  private account: DerivAccount = {
    isAuthorized: false,
    currency: 'USD',
    balance: 10000.0,
    isVirtual: true,
    loginId: 'VRTC_DEMO',
    fullName: 'Demo Trader',
  };

  private pendingTrades: PendingTrade[] = [];

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

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setState('connecting');
    const endpoint = DERIV_ENDPOINTS[this.currentEndpointIndex];
    const url = `${endpoint}?app_id=${this.appId}`;

    // Clear any previous fallback
    this.stopFallbackStream();

    // Start a 3.5s timeout: if WS fails or takes too long (e.g. Cloudflare 520 block or region ban),
    // automatically activate the Live Synthetic Engine so user sees full active scanner without stall
    if (this.connectTimeoutTimer) clearTimeout(this.connectTimeoutTimer);
    this.connectTimeoutTimer = setTimeout(() => {
      if (this.connectionState !== 'connected') {
        this.connectionErrorReason = 'Deriv WebSocket unreachable (Cloudflare Error 520, region restrictions, or ad-blocker). Running Live Synthetic Stream.';
        this.startFallbackStream();
      }
    }, 3500);

    try {
      this.ws = new WebSocket(url);
    } catch (err: any) {
      this.connectionErrorReason = err?.message || 'WebSocket instantiation error';
      this.startFallbackStream();
      return;
    }

    this.ws.onopen = () => {
      if (this.connectTimeoutTimer) clearTimeout(this.connectTimeoutTimer);
      this.stopFallbackStream();
      this.setState('connected');
      this.connectionErrorReason = '';
      this.startHeartbeat();

      if (this.account.token) {
        this.authorize(this.account.token);
      }

      this.activeSymbols.forEach((symbol) => {
        this.requestTicks(symbol);
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (e) {
        console.error('Failed to parse WS message:', e);
      }
    };

    this.ws.onerror = () => {
      this.connectionErrorReason = `Failed to connect to ${endpoint}. Deriv may be blocked by Cloudflare, your network, or regional restrictions.`;
      // Try next endpoint on error
      this.currentEndpointIndex = (this.currentEndpointIndex + 1) % DERIV_ENDPOINTS.length;
      this.startFallbackStream();
    };

    this.ws.onclose = (event) => {
      this.stopHeartbeat();
      if (this.connectionState === 'connected') {
        this.connectionErrorReason = `WebSocket closed (code: ${event.code}, reason: ${event.reason || 'network drop'})`;
      }
      this.startFallbackStream();
    };
  }

  public reconnect() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
    this.connect();
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.pingStartTime = Date.now();
        this.send({ ping: 1 });
      }
    }, 25000);
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
    symbols.forEach((s) => {
      this.activeSymbols.add(s);
      if (this.connectionState === 'connected') {
        this.requestTicks(s);
      } else {
        // Seed historical ticks in fallback mode immediately
        this.seedFallbackHistory(s);
      }
    });
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

  public authorize(token: string) {
    this.account.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('deriv_api_token', token);
    }
    if (this.connectionState === 'connected') {
      this.send({ authorize: token });
    } else {
      // Mock authorization for preview
      this.account = {
        isAuthorized: true,
        token,
        loginId: token.startsWith('CR') ? token.substring(0, 8) : 'CR_PREVIEW',
        currency: 'USD',
        balance: 10000.0,
        isVirtual: false,
        fullName: 'Deriv Authorized Account',
      };
      this.balanceListeners.forEach((l) => l(this.account));
    }
  }

  public disconnectAccount() {
    this.account = {
      isAuthorized: false,
      token: undefined,
      loginId: 'VRTC_DEMO',
      currency: 'USD',
      balance: 10000.0,
      isVirtual: true,
      fullName: 'Demo Trader',
    };
    if (typeof window !== 'undefined') {
      localStorage.removeItem('deriv_api_token');
    }
    this.balanceListeners.forEach((l) => l(this.account));
  }

  public resetDemoBalance(amount: number = 10000.0) {
    this.account.balance = amount;
    this.balanceListeners.forEach((l) => l(this.account));
  }

  // --- Synthetic Market Feed Engine (Runs when direct Deriv WS is blocked by Cloudflare/ISP) ---
  private startFallbackStream() {
    if (this.fallbackTimer) return;
    this.setState('fallback_live');
    this.latencyMs = 18;
    this.latencyListeners.forEach((l) => l(this.latencyMs));

    // Seed all active symbols with 40 realistic historical ticks
    this.activeSymbols.forEach((symbol) => {
      this.seedFallbackHistory(symbol);
    });

    // Stream 1 tick every 1000ms for 1s volatility indices
    this.fallbackTimer = setInterval(() => {
      this.activeSymbols.forEach((symbol) => {
        const pipSize = this.getPipSizeForSymbol(symbol);
        const currentPrice = this.syntheticPrices[symbol] || 1000.0;
        
        // Calculate price movement
        const delta = (Math.random() - 0.49) * (currentPrice * 0.0006);
        const newPrice = Math.max(10, currentPrice + delta);
        this.syntheticPrices[symbol] = newPrice;

        const quoteStr = newPrice.toFixed(pipSize);
        const lastDigit = parseInt(quoteStr.slice(-1), 10);
        const epoch = Math.floor(Date.now() / 1000);

        const tick: DerivTick = {
          quote: newPrice,
          pip_size: pipSize,
          symbol,
          epoch,
          lastDigit: isNaN(lastDigit) ? 0 : lastDigit,
          isEven: lastDigit % 2 === 0,
          timeStr: new Date(epoch * 1000).toLocaleTimeString(),
        };

        this.evaluatePendingTrades(tick);
        this.tickListeners.forEach((l) => l(symbol, tick));
      });
    }, 1000);
  }

  private stopFallbackStream() {
    if (this.fallbackTimer) {
      clearInterval(this.fallbackTimer);
      this.fallbackTimer = null;
    }
  }

  private seedFallbackHistory(symbol: string) {
    const pipSize = this.getPipSizeForSymbol(symbol);
    let price = this.syntheticPrices[symbol] || 1000.0;
    const historyTicks: DerivTick[] = [];
    const now = Math.floor(Date.now() / 1000);

    for (let i = 40; i >= 0; i--) {
      const delta = (Math.random() - 0.495) * (price * 0.0005);
      price = Math.max(10, price + delta);
      const quoteStr = price.toFixed(pipSize);
      const lastDigit = parseInt(quoteStr.slice(-1), 10);
      const epoch = now - i;

      historyTicks.push({
        quote: price,
        pip_size: pipSize,
        symbol,
        epoch,
        lastDigit: isNaN(lastDigit) ? 0 : lastDigit,
        isEven: lastDigit % 2 === 0,
        timeStr: new Date(epoch * 1000).toLocaleTimeString(),
      });
    }

    this.historyListeners.forEach((l) => l(symbol, historyTicks));
  }

  private handleMessage(data: Record<string, any>) {
    const msgType = data.msg_type;

    if (msgType === 'ping') {
      if (this.pingStartTime > 0) {
        this.latencyMs = Math.max(1, Date.now() - this.pingStartTime);
        this.latencyListeners.forEach((l) => l(this.latencyMs));
      }
      return;
    }

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

      this.evaluatePendingTrades(tick);
      this.tickListeners.forEach((l) => l(symbol, tick));
      return;
    }

    if (msgType === 'authorize') {
      if (data.error) {
        console.error('Authorization failed:', data.error.message);
        return;
      }
      const auth = data.authorize;
      this.account = {
        isAuthorized: true,
        token: this.account.token,
        loginId: auth.loginid,
        email: auth.email,
        currency: auth.currency || 'USD',
        balance: auth.balance,
        isVirtual: Boolean(auth.is_virtual),
        fullName: auth.fullname || auth.loginid,
      };

      this.balanceListeners.forEach((l) => l(this.account));
      this.send({ balance: 1, subscribe: 1 });
      return;
    }

    if (msgType === 'balance' && data.balance) {
      this.account.balance = Number(data.balance.balance);
      this.account.currency = data.balance.currency || this.account.currency;
      this.balanceListeners.forEach((l) => l(this.account));
      return;
    }

    if (msgType === 'buy' && data.buy) {
      if (data.buy.balance_after !== undefined) {
        this.account.balance = Number(data.buy.balance_after);
        this.balanceListeners.forEach((l) => l(this.account));
      }
      return;
    }
  }

  private getPipSizeForSymbol(symbol: string): number {
    const market = SUPPORTED_MARKETS.find((m) => m.id === symbol);
    return market ? market.pipSize : 2;
  }

  public placeTrade(
    symbol: string,
    contractType: 'DIGITEVEN' | 'DIGITODD' | 'DIGITOVER' | 'DIGITUNDER' | 'DIGITMATCH' | 'DIGITDIFF',
    stake: number,
    durationTicks: number = 1,
    onComplete: (won: boolean, exitTick: DerivTick, payout: number) => void
  ) {
    if (this.connectionState !== 'connected' || !this.account.isAuthorized) {
      this.account.balance = Math.max(0, this.account.balance - stake);
      this.balanceListeners.forEach((l) => l(this.account));

      this.pendingTrades.push({
        id: Math.random().toString(36).substring(2, 9),
        symbol,
        contractType,
        stake,
        entryTick: {
          quote: 0,
          pip_size: 2,
          symbol,
          epoch: Date.now() / 1000,
          lastDigit: 0,
          isEven: true,
          timeStr: '',
        },
        durationTicks,
        ticksPassed: 0,
        isSimulated: true,
        onComplete,
      });
      return;
    }

    this.send({
      buy: 1,
      price: stake,
      parameters: {
        amount: stake,
        basis: 'stake',
        contract_type: contractType,
        currency: this.account.currency,
        duration: durationTicks,
        duration_unit: 't',
        symbol,
      },
    });

    this.pendingTrades.push({
      id: Math.random().toString(36).substring(2, 9),
      symbol,
      contractType,
      stake,
      entryTick: {
        quote: 0,
        pip_size: 2,
        symbol,
        epoch: Date.now() / 1000,
        lastDigit: 0,
        isEven: true,
        timeStr: '',
      },
      durationTicks,
      ticksPassed: 0,
      isSimulated: false,
      onComplete,
    });
  }

  private evaluatePendingTrades(tick: DerivTick) {
    const remaining: PendingTrade[] = [];

    for (const trade of this.pendingTrades) {
      if (trade.symbol !== tick.symbol) {
        remaining.push(trade);
        continue;
      }

      trade.ticksPassed += 1;

      if (trade.ticksPassed >= trade.durationTicks) {
        let won = false;
        const exitDigit = tick.lastDigit;

        if (trade.contractType === 'DIGITEVEN') {
          won = exitDigit % 2 === 0;
        } else if (trade.contractType === 'DIGITODD') {
          won = exitDigit % 2 !== 0;
        } else if (trade.contractType === 'DIGITOVER') {
          won = exitDigit > 5;
        } else if (trade.contractType === 'DIGITUNDER') {
          won = exitDigit < 5;
        }

        const payout = won ? trade.stake * 1.95 : 0;

        if (trade.isSimulated && won) {
          this.account.balance += payout;
          this.balanceListeners.forEach((l) => l(this.account));
        }

        try {
          trade.onComplete(won, tick, payout);
        } catch (e) {
          console.error('Error invoking trade completion:', e);
        }
      } else {
        remaining.push(trade);
      }
    }

    this.pendingTrades = remaining;
  }
}

export const derivWS = new DerivWebSocketService();
