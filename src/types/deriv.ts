export interface DerivTick {
  quote: number;
  pip_size: number;
  symbol: string;
  epoch: number;
  id?: string;
  lastDigit: number;
  isEven: boolean;
  timeStr: string;
}

export interface MarketSymbol {
  id: string;
  name: string;
  category: 'volatility_1s' | 'jump' | 'volatility_standard';
  pipSize: number;
  description: string;
}

export interface DigitStats {
  symbol: string;
  currentPrice: number;
  previousPrice?: number;
  pipSize: number;
  ticks: DerivTick[];
  totalCount: number;
  evenCount: number;
  oddCount: number;
  evenPercent: number;
  oddPercent: number;
  underCount: number; // 0-4
  overCount: number;  // 5-9
  underPercent: number;
  overPercent: number;
  digitFrequency: Record<number, number>; // 0 to 9 counts
  digitPercentages: Record<number, number>; // 0 to 9 percentages
  hotDigits: number[];
  coldDigits: number[];
  currentStreak: {
    type: 'even' | 'odd' | 'none';
    count: number;
  };
  signal: {
    type: 'even' | 'odd' | 'scanning' | 'neutral';
    strength: number; // e.g. 63%, 88%
    reason: string;
    label: string; // 'EVEN ENTRY' | 'ODD ENTRY' | 'SCANNING'
  };
  countdownSec: number;
  lastUpdateEpoch: number;
}

export interface DerivAccount {
  isAuthorized: boolean;
  token?: string;
  loginId?: string;
  email?: string;
  currency: string;
  balance: number;
  isVirtual: boolean;
  fullName?: string;
  scopes?: string[];
}

export interface TradeOrder {
  id: string;
  symbol: string;
  contractType: 'DIGITEVEN' | 'DIGITODD' | 'DIGITOVER' | 'DIGITUNDER' | 'DIGITMATCH' | 'DIGITDIFF';
  stake: number;
  payout: number;
  status: 'pending' | 'won' | 'lost';
  entryTick?: DerivTick;
  exitTick?: DerivTick;
  timestamp: number;
  isSimulated: boolean;
  contractId?: number;
  errorMsg?: string;
}

export type ScanMode = 'even_odd' | 'over_under' | 'matches_differs' | 'digit_matrix';
