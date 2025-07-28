// lib/studies.ts

/**
 * A simple { time, value } tuple for charting.
 */
export interface TimeValue {
  time: number;
  value: number;
}

// RSI configuration
const RSI_PERIOD = 14;

// Bollinger Bands configuration
const BB_PERIOD = 20;
const BB_STDDEV = 2;

// MACD configuration
const MACD_FAST = 12;
const MACD_SLOW = 26;
const MACD_SIGNAL = 9;

/**
 * Computes the Relative Strength Index (RSI) for given price data.
 */
export function computeRSI(data: { time: number; close: number }[]): TimeValue[] {
  if (data.length <= RSI_PERIOD) {
    return [];
  }
  let gains = 0;
  let losses = 0;
  // Initial average gain/loss
  for (let i = 1; i <= RSI_PERIOD; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change >= 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }
  let avgGain = gains / RSI_PERIOD;
  let avgLoss = losses / RSI_PERIOD;
  const rsiValues: TimeValue[] = [];

  // Wilder's smoothing method
  for (let i = RSI_PERIOD + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    avgGain = (avgGain * (RSI_PERIOD - 1) + Math.max(change, 0)) / RSI_PERIOD;
    avgLoss = (avgLoss * (RSI_PERIOD - 1) + Math.max(-change, 0)) / RSI_PERIOD;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);
    rsiValues.push({ time: data[i].time, value: rsi });
  }

  return rsiValues;
}

/**
 * Computes Bollinger Bands (upper and lower) for given price data.
 */
export function computeBB(
  data: { time: number; close: number }[]
): { upper: TimeValue[]; lower: TimeValue[] } {
  if (data.length < BB_PERIOD) {
    return { upper: [], lower: [] };
  }
  const upper: TimeValue[] = [];
  const lower: TimeValue[] = [];

  for (let i = BB_PERIOD - 1; i < data.length; i++) {
    const window = data.slice(i - BB_PERIOD + 1, i + 1).map((d) => d.close);
    const mean = window.reduce((sum, v) => sum + v, 0) / BB_PERIOD;
    const variance =
      window.reduce((sum, v) => sum + (v - mean) ** 2, 0) / BB_PERIOD;
    const stddev = Math.sqrt(variance);
    upper.push({ time: data[i].time, value: mean + BB_STDDEV * stddev });
    lower.push({ time: data[i].time, value: mean - BB_STDDEV * stddev });
  }

  return { upper, lower };
}

/**
 * Computes an Exponential Moving Average (EMA) over the data.
 */
export function computeEMA(
  period: number,
  data: { time: number; close: number }[]
): TimeValue[] {
  if (data.length === 0) {
    return [];
  }
  const k = 2 / (period + 1);
  const emaValues: number[] = [data[0].close];

  for (let i = 1; i < data.length; i++) {
    emaValues.push(data[i].close * k + emaValues[i - 1] * (1 - k));
  }

  return emaValues.map((value, idx) => ({ time: data[idx].time, value }));
}

/**
 * Computes the MACD line, signal line, and histogram values for price data.
 */
export function computeMACD(
  data: { time: number; close: number }[]
): { macd: TimeValue[]; signal: TimeValue[]; hist: TimeValue[] } {
  if (data.length < MACD_SLOW) {
    return { macd: [], signal: [], hist: [] };
  }
  const fast = computeEMA(MACD_FAST, data);
  const slow = computeEMA(MACD_SLOW, data);

  // MACD line: difference between fast EMA and slow EMA
  const macdLine: TimeValue[] = fast.map((f, idx) => ({
    time: f.time,
    value: f.value - slow[idx].value,
  }));

  // Signal line: EMA of MACD line
  const signalRaw = computeEMA(
    MACD_SIGNAL,
    macdLine.map((d) => ({ time: d.time, close: d.value }))
  ).slice(MACD_SIGNAL - 1);
  const signal: TimeValue[] = signalRaw.map((s, idx) => ({
    time: macdLine[idx + MACD_SIGNAL - 1].time,
    value: s.value,
  }));

  // Histogram: difference between MACD line and signal line
  const hist: TimeValue[] = macdLine
    .slice(MACD_SLOW - 1)
    .map((m, idx) => ({ time: m.time, value: m.value - (signal[idx]?.value || 0) }));

  return {
    macd: macdLine.slice(MACD_SLOW - 1),
    signal,
    hist,
  };
}
