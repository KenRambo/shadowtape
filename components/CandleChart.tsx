// components/CandleChart.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  createSeriesMarkers,
  ISeriesApi,
  SeriesMarker,
  ColorType,
} from "lightweight-charts";
import type {
  CandlestickData,
  LineData,
  UTCTimestamp,
} from "lightweight-charts";
import Controls from "./Controls";
import QuizOverlay, { Quiz as QuizData } from "./QuizOverlay";
import { computeRSI, computeBB, computeMACD } from "../lib/studies";

export type Action = "LONG" | "SHORT" | "NONE";

interface Candle {
  time: number; // Unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
}

export default function CandleChart() {
  // DOM refs
  const priceRef = useRef<HTMLDivElement>(null);
  const rsiRef = useRef<HTMLDivElement>(null);
  const macdRef = useRef<HTMLDivElement>(null);

  // series refs
  const candleSeries = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const bbUpperSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const bbLowerSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const rsiSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const macdSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const signalSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const histSeries = useRef<ISeriesApi<"Histogram"> | null>(null);

  // state
  const [candles, setCandles] = useState<Candle[]>([]);
  const [index, setIndex] = useState(0);
  const [entryPrice, setEntryPrice] = useState<number | null>(null);
  const [position, setPosition] = useState<Action>("NONE");
  const [tradeSize, setTradeSize] = useState(1);
  const [balance, setBalance] = useState(0);
  const [totalPnl, setTotalPnl] = useState(0);
  const [percentPnl, setPercentPnl] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [markers, setMarkers] = useState<SeriesMarker<"time">[]>([]);

  // study toggles
  const [showRSI, setShowRSI] = useState(true);
  const [showBB, setShowBB] = useState(true);
  const [showMACD, setShowMACD] = useState(true);

  // load data
  useEffect(() => {
    fetch("/data/ES-Data4-formatted.json")
      .then((r) => r.json())
      .then(setCandles)
      .catch(console.error);
  }, []);

  // init charts
  useEffect(() => {
    if (!priceRef.current || !rsiRef.current || !macdRef.current || candles.length === 0)
      return;

    // Price + BB
    const pc = createChart(priceRef.current, {
      layout: { background: { type: ColorType.Solid, color: "#000" }, textColor: "#fff" },
      width: priceRef.current.clientWidth,
      height: 300,
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    });
    candleSeries.current = pc.addSeries(CandlestickSeries, {
      upColor: "green",
      downColor: "red",
      wickUpColor: "green",
      wickDownColor: "red",
    });
    bbUpperSeries.current = pc.addSeries(LineSeries, { color: "yellow", lineWidth: 1 });
    bbLowerSeries.current = pc.addSeries(LineSeries, { color: "yellow", lineWidth: 1 });

    // RSI pane
    const rc = createChart(rsiRef.current, {
      layout: { background: { type: ColorType.Solid, color: "#000" }, textColor: "#fff" },
      width: rsiRef.current.clientWidth,
      height: 150,
      rightPriceScale: { visible: false },
      timeScale: { visible: false },
    });
    rsiSeries.current = rc.addSeries(LineSeries, { color: "white", lineWidth: 1 });

    // MACD pane
    const mc = createChart(macdRef.current, {
      layout: { background: { type: ColorType.Solid, color: "#000" }, textColor: "#fff" },
      width: macdRef.current.clientWidth,
      height: 150,
      rightPriceScale: { visible: false },
      timeScale: { visible: false },
    });
    macdSeries.current = mc.addSeries(LineSeries, { color: "#FF9800", lineWidth: 1 });
    signalSeries.current = mc.addSeries(LineSeries, { color: "#FFC107", lineWidth: 1 });
    histSeries.current = mc.addSeries(HistogramSeries, { color: "rgba(255,152,0,0.5)" });

    // responsive resizing
    const ro = new ResizeObserver(() => {
      const w = priceRef.current!.clientWidth;
      pc.applyOptions({ width: w });
      rc.applyOptions({ width: w });
      mc.applyOptions({ width: w });
    });
    ro.observe(priceRef.current);
    ro.observe(rsiRef.current);
    ro.observe(macdRef.current);

    return () => {
      ro.disconnect();
      pc.remove();
      rc.remove();
      mc.remove();
    };
  }, [candles]);

  // play/pause ticker
  useEffect(() => {
    if (!isPlaying) return;
    const iv = setInterval(() => setIndex((i) => Math.min(i + 1, candles.length - 1)), 500);
    return () => clearInterval(iv);
  }, [isPlaying, candles]);

  // update series & PnL
  useEffect(() => {
    if (index === 0) return;
    const slice = candles.slice(0, index + 1);
    const last = slice[slice.length - 1];

    // map to CandlestickData
    const candleData: CandlestickData[] = slice.map((c) => ({
      time: c.time as unknown as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candleSeries.current?.setData(candleData);

    // Bollinger Bands
    if (showBB) {
      const { upper, lower } = computeBB(slice);
      const bbUp: LineData[] = upper.map((d) => ({
        time: d.time as unknown as UTCTimestamp,
        value: d.value,
      }));
      const bbLo: LineData[] = lower.map((d) => ({
        time: d.time as unknown as UTCTimestamp,
        value: d.value,
      }));
      bbUpperSeries.current?.setData(bbUp);
      bbLowerSeries.current?.setData(bbLo);
    } else {
      bbUpperSeries.current?.setData([]);
      bbLowerSeries.current?.setData([]);
    }

    // RSI
    if (showRSI) {
      const rsiVals = computeRSI(slice);
      const rsiData: LineData[] = rsiVals.map((d) => ({
        time: d.time as unknown as UTCTimestamp,
        value: d.value,
      }));
      rsiSeries.current?.setData(rsiData);
    } else {
      rsiSeries.current?.setData([]);
    }

    // MACD
    if (showMACD) {
      const { macd, signal, hist } = computeMACD(slice);
      const macdData: LineData[] = macd.map((d) => ({
        time: d.time as unknown as UTCTimestamp,
        value: d.value,
      }));
      const signalData: LineData[] = signal.map((d) => ({
        time: d.time as unknown as UTCTimestamp,
        value: d.value,
      }));
      const histData: LineData[] = hist.map((d) => ({
        time: d.time as unknown as UTCTimestamp,
        value: d.value,
      }));
      macdSeries.current?.setData(macdData);
      signalSeries.current?.setData(signalData);
      histSeries.current?.setData(histData);
    } else {
      macdSeries.current?.setData([]);
      signalSeries.current?.setData([]);
      histSeries.current?.setData([]);
    }

    // compute PnL & balance
    if (entryPrice !== null) {
      const diff = last.close - entryPrice;
      const unitPnl = position === "LONG" ? diff : position === "SHORT" ? -diff : 0;
      const tot = unitPnl * tradeSize;
      setTotalPnl(tot);
      setBalance(tot);
      setPercentPnl(entryPrice * tradeSize ? (tot / (entryPrice * tradeSize)) * 100 : 0);
    }

    // redraw markers
    createSeriesMarkers(candleSeries.current!, markers);
  }, [
    index,
    showBB,
    showRSI,
    showMACD,
    candles,
    entryPrice,
    position,
    tradeSize,
    markers,
  ]);

  // handle trade button click
  const handleTrade = async (action: Action) => {
    setPosition(action);
    setIsPlaying(false);
    const c = candles[index];
    setEntryPrice(c.close);
    setMarkers((m) => [
      ...m,
      {
        time: c.time,
        position: action === "LONG" ? "belowBar" : "aboveBar",
        color: action === "LONG" ? "green" : "red",
        shape: action === "LONG" ? "arrowUp" : "arrowDown",
        text: "Entry",
      },
    ]);

    const recent = candles.slice(Math.max(0, index - 13), index + 1);
    const res = await fetch("/api/generate-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, recentCandles: recent }),
    });
    const quizData: QuizData = await res.json();
    setQuiz(quizData);
  };

  return (
    <div className="flex flex-col w-full h-full">
      <div className="text-white p-2">Balance: {balance.toFixed(2)}</div>
      <div ref={priceRef} className="mb-2" />
      <div ref={rsiRef} className="mb-2" />
      <div ref={macdRef} className="mb-4" />
      {quiz ? (
        <QuizOverlay quiz={quiz} onSubmit={() => setQuiz(null)} />
      ) : (
        <Controls
          balance={balance}
          onTrade={handleTrade}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          isPlaying={isPlaying}
          tradeSize={tradeSize}
          onSizeChange={setTradeSize}
          totalPnl={totalPnl}
          percentPnl={percentPnl}
          showRSI={showRSI}
          showBB={showBB}
          showMACD={showMACD}
          onToggleRSI={() => setShowRSI((v) => !v)}
          onToggleBB={() => setShowBB((v) => !v)}
          onToggleMACD={() => setShowMACD((v) => !v)}
        />
      )}
    </div>
  );
}
