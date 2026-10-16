import { DerivTick, DigitStats } from '../types/deriv';

export function calculateDigitStats(
  symbol: string,
  ticks: DerivTick[],
  windowSize: number = 25,
  minConfidence: number = 60,
  defaultPipSize: number = 2
): DigitStats {
  const windowTicks = ticks.slice(-windowSize);
  const totalCount = windowTicks.length;

  const latestTick = ticks.length > 0 ? ticks[ticks.length - 1] : null;
  const prevTick = ticks.length > 1 ? ticks[ticks.length - 2] : null;
  const currentPrice = latestTick ? latestTick.quote : 0;
  const previousPrice = prevTick ? prevTick.quote : undefined;
  const pipSize = latestTick?.pip_size ?? defaultPipSize;

  if (totalCount === 0) {
    return {
      symbol,
      currentPrice: 0,
      previousPrice: undefined,
      pipSize,
      ticks: [],
      totalCount: 0,
      evenCount: 0,
      oddCount: 0,
      evenPercent: 50,
      oddPercent: 50,
      underCount: 0,
      overCount: 0,
      underPercent: 50,
      overPercent: 50,
      digitFrequency: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
      digitPercentages: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
      hotDigits: [],
      coldDigits: [],
      currentStreak: { type: 'none', count: 0 },
      signal: {
        type: 'scanning',
        strength: 50,
        reason: 'Awaiting ticks from Deriv...',
        label: 'SCANNING',
      },
      countdownSec: 25,
      lastUpdateEpoch: Date.now(),
    };
  }

  let evenCount = 0;
  let oddCount = 0;
  let underCount = 0; // 0-4
  let overCount = 0;  // 5-9

  const digitFreq: Record<number, number> = {
    0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0,
  };

  for (const tick of windowTicks) {
    const d = tick.lastDigit;
    digitFreq[d] = (digitFreq[d] || 0) + 1;

    if (d % 2 === 0) {
      evenCount++;
    } else {
      oddCount++;
    }

    if (d < 5) {
      underCount++;
    } else {
      overCount++;
    }
  }

  const evenPercent = Math.round((evenCount / totalCount) * 100);
  const oddPercent = 100 - evenPercent;

  const underPercent = Math.round((underCount / totalCount) * 100);
  const overPercent = 100 - underPercent;

  const digitPercentages: Record<number, number> = {};
  for (let i = 0; i <= 9; i++) {
    digitPercentages[i] = Math.round(((digitFreq[i] || 0) / totalCount) * 100);
  }

  // Find Hot & Cold digits
  const sortedDigits = Object.entries(digitFreq)
    .sort((a, b) => b[1] - a[1])
    .map((e) => Number(e[0]));

  const hotDigits = sortedDigits.slice(0, 3);
  const coldDigits = sortedDigits.slice(-3).reverse();

  // Calculate current streak from newest ticks
  let currentStreakType: 'even' | 'odd' | 'none' = 'none';
  let streakCount = 0;

  for (let i = windowTicks.length - 1; i >= 0; i--) {
    const isEven = windowTicks[i].isEven;
    const type = isEven ? 'even' : 'odd';

    if (streakCount === 0) {
      currentStreakType = type;
      streakCount = 1;
    } else if (currentStreakType === type) {
      streakCount++;
    } else {
      break;
    }
  }

  // Signal Prediction Logic:
  // 1. Skew momentum (e.g. Even % >= minConfidence)
  // 2. Mean reversion exhaustion (e.g. 3-4 consecutive Odds creates high probability Even entry)
  let signalType: 'even' | 'odd' | 'scanning' | 'neutral' = 'scanning';
  let strength = 50;
  let reason = 'Market balanced, monitoring tick flow';
  let label = 'SCANNING';

  if (evenPercent >= minConfidence) {
    signalType = 'even';
    strength = evenPercent;
    reason = `Dominant Even momentum (${evenPercent}%) over last ${totalCount} ticks`;
    label = 'EVEN ENTRY';
  } else if (oddPercent >= minConfidence) {
    signalType = 'odd';
    strength = oddPercent;
    reason = `Dominant Odd momentum (${oddPercent}%) over last ${totalCount} ticks`;
    label = 'ODD ENTRY';
  } else if (streakCount >= 4) {
    // Reversal trigger! If 4 odds in a row, Even reversal chance is high
    if (currentStreakType === 'odd') {
      signalType = 'even';
      strength = Math.min(88, 65 + streakCount * 5);
      reason = `${streakCount} consecutive Odds detected (mean reversion entry)`;
      label = 'EVEN ENTRY';
    } else {
      signalType = 'odd';
      strength = Math.min(88, 65 + streakCount * 5);
      reason = `${streakCount} consecutive Evens detected (mean reversion entry)`;
      label = 'ODD ENTRY';
    }
  } else if (evenPercent >= 58) {
    signalType = 'even';
    strength = evenPercent;
    reason = `Even bias (${evenPercent}%) forming`;
    label = 'EVEN ENTRY';
  } else if (oddPercent >= 58) {
    signalType = 'odd';
    strength = oddPercent;
    reason = `Odd bias (${oddPercent}%) forming`;
    label = 'ODD ENTRY';
  }

  // Calculate dynamic cycle countdown (e.g., 25s window cycle)
  const nowSec = Math.floor(Date.now() / 1000);
  const countdownSec = 25 - (nowSec % 25);

  return {
    symbol,
    currentPrice,
    previousPrice,
    pipSize,
    ticks: windowTicks,
    totalCount,
    evenCount,
    oddCount,
    evenPercent,
    oddPercent,
    underCount,
    overCount,
    underPercent,
    overPercent,
    digitFrequency: digitFreq,
    digitPercentages,
    hotDigits,
    coldDigits,
    currentStreak: {
      type: currentStreakType,
      count: streakCount,
    },
    signal: {
      type: signalType,
      strength,
      reason,
      label,
    },
    countdownSec,
    lastUpdateEpoch: Date.now(),
  };
}
