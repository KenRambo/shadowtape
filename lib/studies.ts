// lib/studies.ts

export interface TimeValue { time: number; value: number }

const RSI_PERIOD = 14;
const BB_PERIOD = 20;
const BB_STDDEV = 2;
const MACD_FAST = 12;
const MACD_SLOW = 26;
const MACD_SIGNAL = 9;

export function computeRSI(data: { time: number; close: number }[]): TimeValue[] {
  if (data.length <= RSI_PERIOD) return [];
  let gains = 0, losses = 0;
  for (let i = 1; i <= RSI_PERIOD; i++) {
    const diff = data[i].close - data[i - 1].close;
    diff >= 0 ? (gains += diff) : (losses -= diff);
  }
  let avgG = gains / RSI_PERIOD;
  let avgL = losses / RSI_PERIOD;
  const out: TimeValue[] = [];
  for (let i = RSI_PERIOD + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    avgG = (avgG * (RSI_PERIOD - 1) + Math.max(diff, 0)) / RSI_PERIOD;
    avgL = (avgL * (RSI_PERIOD - 1) + Math.max(-diff, 0)) / RSI_PERIOD;
    const rs = avgG / (avgL || 1);
    out.push({ time: data[i].time, value: 100 - 100 / (1 + rs) });
  }
  return out;
}

export function computeBB(data: { time: number; close: number }[]): { upper: TimeValue[]; lower: TimeValue[] } {
  if (data.length < BB_PERIOD) return { upper: [], lower: [] };
  const upper: TimeValue[] = [];
  const lower: TimeValue[] = [];
  for (let i = BB_PERIOD - 1; i < data.length; i++) {
    const slice = data.slice(i - BB_PERIOD + 1, i + 1).map(d => d.close);
    const mean = slice.reduce((a, b) => a + b, 0) / BB_PERIOD;
    const std = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / BB_PERIOD);
    upper.push({ time: data[i].time, value: mean + BB_STDDEV * std });
    lower.push({ time: data[i].time, value: mean - BB_STDDEV * std });
  }
  return { upper, lower };
}

export function computeEMA(period: number, data: { time: number; close: number }[]): TimeValue[] {
  const k = 2 / (period + 1);
  const ema: number[] = [data[0].close];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i].close * k + ema[i - 1] * (1 - k));
  }
  return ema.map((value, i) => ({ time: data[i].time, value }));
}

export function computeMACD(data: { time: number; close: number }[]): { macd: TimeValue[]; signal: TimeValue[]; hist: TimeValue[] } {
  if (data.length < MACD_SLOW) return { macd: [], signal: [], hist: [] };
  const fast = computeEMA(MACD_FAST, data);
  const slow = computeEMA(MACD_SLOW, data);
  const macdLine: TimeValue[] = fast.map((d, i) => ({ time: d.time, value: d.value - slow[i].value }));
  const signalRaw = computeEMA(
    MACD_SIGNAL,
    macdLine.map(d => ({ time: d.time, close: d.value }))
  ).slice(MACD_SIGNAL - 1);
  const signal = signalRaw.map((d, i) => ({ time: macdLine[i + MACD_SIGNAL - 1].time, value: d.value }));
  const hist = macdLine.slice(MACD_SLOW - 1).map((d, i) => ({ time: d.time, value: d.value - (signal[i]?.value || 0) }));
  return { macd: macdLine.slice(MACD_SLOW - 1), signal, hist };
}
