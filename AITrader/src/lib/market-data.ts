import yahooFinance from "yahoo-finance2";

// Silence yahoo-finance2 notice + survival messages in server logs.
yahooFinance.suppressNotices(["yahooSurvey", "ripHistorical"]);

async function withRetry<T>(fn: () => Promise<T>, tries = 3, baseDelayMs = 600): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const retriable = /429|Too Many|fetch failed|ENOTFOUND|ETIMEDOUT|ECONNRESET|socket hang up/i.test(msg);
      if (!retriable || i === tries - 1) throw err;
      const delay = baseDelayMs * Math.pow(2, i) + Math.random() * 300;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

export type Timeframe = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1wk";

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketSnapshot {
  symbol: string;
  yahooSymbol: string;
  price: number;
  previousClose: number | null;
  dayChangePct: number | null;
  currency: string | null;
  assetClass: "forex" | "crypto" | "metal" | "index" | "stock" | "commodity" | "unknown";
  candles: Candle[];
  timeframe: Timeframe;
  fetchedAt: string;
}

const ALIASES: Record<string, string> = {
  GOLD: "XAUUSD",
  XAU: "XAUUSD",
  SILVER: "XAGUSD",
  XAG: "XAGUSD",
  OIL: "CL=F",
  WTI: "CL=F",
  BRENT: "BZ=F",
  SPX: "SPX500",
  SPX500: "^GSPC",
  US500: "^GSPC",
  NAS: "NAS100",
  NAS100: "^NDX",
  US100: "^NDX",
  NDX: "^NDX",
  DOW: "US30",
  US30: "^DJI",
  DJI: "^DJI",
  DAX: "^GDAXI",
  DAX40: "^GDAXI",
  GER40: "^GDAXI",
  FTSE: "^FTSE",
  UK100: "^FTSE",
  BTC: "BTC-USD",
  ETH: "ETH-USD",
  SOL: "SOL-USD",
};

const FIAT = ["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "NZD", "CAD", "CNY", "HKD", "SGD", "SEK", "NOK", "MXN", "ZAR"];

export function normalizeSymbol(input: string): { display: string; yahoo: string; assetClass: MarketSnapshot["assetClass"] } {
  const raw = input.trim().toUpperCase().replace(/\s+/g, "").replace(/\//g, "");

  const alias = ALIASES[raw];
  if (alias) {
    return normalizeSymbol(alias);
  }

  if (raw.startsWith("^") || raw.endsWith("=F") || raw.endsWith("=X") || raw.includes("-USD")) {
    const assetClass: MarketSnapshot["assetClass"] = raw.startsWith("^")
      ? "index"
      : raw.endsWith("=F")
        ? "commodity"
        : raw.includes("-USD")
          ? "crypto"
          : "forex";
    return { display: raw, yahoo: raw, assetClass };
  }

  if (raw.length === 6 && FIAT.includes(raw.slice(0, 3)) && FIAT.includes(raw.slice(3))) {
    return { display: raw, yahoo: `${raw}=X`, assetClass: "forex" };
  }

  if (raw.startsWith("XAU") || raw.startsWith("XAG")) {
    return { display: raw, yahoo: `${raw}=X`, assetClass: "metal" };
  }

  const cryptoQuotes = ["USD", "USDT", "USDC"];
  for (const q of cryptoQuotes) {
    if (raw.endsWith(q) && raw.length > q.length) {
      const base = raw.slice(0, raw.length - q.length);
      return { display: raw, yahoo: `${base}-USD`, assetClass: "crypto" };
    }
  }

  return { display: raw, yahoo: raw, assetClass: "stock" };
}

const TF_TO_YAHOO: Record<Timeframe, { interval: "1m" | "5m" | "15m" | "30m" | "60m" | "90m" | "1d" | "1wk"; range: string; approxCandles: number }> = {
  "1m": { interval: "1m", range: "1d", approxCandles: 120 },
  "5m": { interval: "5m", range: "5d", approxCandles: 120 },
  "15m": { interval: "15m", range: "5d", approxCandles: 120 },
  "30m": { interval: "30m", range: "1mo", approxCandles: 150 },
  "1h": { interval: "60m", range: "1mo", approxCandles: 150 },
  "4h": { interval: "60m", range: "3mo", approxCandles: 200 },
  "1d": { interval: "1d", range: "6mo", approxCandles: 150 },
  "1wk": { interval: "1wk", range: "2y", approxCandles: 120 },
};

export async function getMarketSnapshot(symbol: string, timeframe: Timeframe = "1h"): Promise<MarketSnapshot> {
  const { display, yahoo, assetClass } = normalizeSymbol(symbol);

  if (assetClass === "crypto") {
    const { resolveBinanceSymbol, getBinanceSnapshot } = await import("./binance");
    const binanceSym = resolveBinanceSymbol(display);
    if (binanceSym) {
      try {
        return await withRetry(() => getBinanceSnapshot(display, binanceSym, timeframe), 3, 400);
      } catch {
        // fall through to twelve data / yahoo
      }
    }
  } else if (process.env.TWELVE_DATA_API_KEY) {
    try {
      const { getTwelveDataSnapshot, resolveTwelveDataSymbol } = await import("./twelvedata");
      if (resolveTwelveDataSymbol(display)) {
        return await withRetry(() => getTwelveDataSnapshot(display, timeframe), 2, 600);
      }
    } catch {
      // fall through to yahoo
    }
  }

  const tf = TF_TO_YAHOO[timeframe];

  const now = new Date();
  const rangeMs: Record<string, number> = {
    "1d": 1 * 864e5,
    "5d": 5 * 864e5,
    "1mo": 31 * 864e5,
    "3mo": 92 * 864e5,
    "6mo": 183 * 864e5,
    "1y": 365 * 864e5,
    "2y": 730 * 864e5,
  };
  const period1 = new Date(now.getTime() - (rangeMs[tf.range] ?? 30 * 864e5));

  const chart = await withRetry(() =>
    yahooFinance.chart(yahoo, {
      period1,
      period2: now,
      interval: tf.interval,
    }),
  );

  const rawCandles = (chart.quotes ?? []).filter(
    (q) => q.open != null && q.high != null && q.low != null && q.close != null,
  );

  let candles: Candle[] = rawCandles.map((q) => ({
    time: q.date instanceof Date ? q.date.toISOString() : new Date(q.date).toISOString(),
    open: q.open as number,
    high: q.high as number,
    low: q.low as number,
    close: q.close as number,
    volume: (q.volume as number) ?? 0,
  }));

  if (timeframe === "4h") {
    candles = aggregateTo4h(candles);
  }

  candles = candles.slice(-tf.approxCandles);

  const meta = chart.meta;
  const price = meta?.regularMarketPrice ?? candles[candles.length - 1]?.close ?? 0;
  const previousClose = meta?.chartPreviousClose ?? null;
  const currency = meta?.currency ?? null;
  const dayChangePct =
    previousClose && price ? ((price - previousClose) / previousClose) * 100 : null;

  return {
    symbol: display,
    yahooSymbol: yahoo,
    price,
    previousClose,
    dayChangePct,
    currency,
    assetClass,
    candles,
    timeframe,
    fetchedAt: new Date().toISOString(),
  };
}

function aggregateTo4h(hourly: Candle[]): Candle[] {
  if (!hourly.length) return [];
  const out: Candle[] = [];
  for (let i = 0; i < hourly.length; i += 4) {
    const chunk = hourly.slice(i, i + 4);
    if (!chunk.length) continue;
    out.push({
      time: chunk[0].time,
      open: chunk[0].open,
      high: Math.max(...chunk.map((c) => c.high)),
      low: Math.min(...chunk.map((c) => c.low)),
      close: chunk[chunk.length - 1].close,
      volume: chunk.reduce((a, c) => a + c.volume, 0),
    });
  }
  return out;
}

export function computeIndicators(candles: Candle[]) {
  if (!candles.length) {
    return { ema20: null, ema50: null, ema200: null, rsi14: null, atr14: null };
  }
  const closes = candles.map((c) => c.close);
  return {
    ema20: ema(closes, 20),
    ema50: ema(closes, 50),
    ema200: ema(closes, 200),
    rsi14: rsi(closes, 14),
    atr14: atr(candles, 14),
  };
}

function ema(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let e = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i++) {
    e = values[i] * k + e * (1 - k);
  }
  return e;
}

function rsi(values: number[], period: number): number | null {
  if (values.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgG = gains / period;
  let avgL = losses / period;
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const g = diff > 0 ? diff : 0;
    const l = diff < 0 ? -diff : 0;
    avgG = (avgG * (period - 1) + g) / period;
    avgL = (avgL * (period - 1) + l) / period;
  }
  if (avgL === 0) return 100;
  const rs = avgG / avgL;
  return 100 - 100 / (1 + rs);
}

function atr(candles: Candle[], period: number): number | null {
  if (candles.length < period + 1) return null;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const prev = candles[i - 1];
    trs.push(Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close)));
  }
  const seed = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let a = seed;
  for (let i = period; i < trs.length; i++) {
    a = (a * (period - 1) + trs[i]) / period;
  }
  return a;
}

export function detectSwingLevels(candles: Candle[], lookback = 5) {
  const highs: { time: string; price: number }[] = [];
  const lows: { time: string; price: number }[] = [];
  for (let i = lookback; i < candles.length - lookback; i++) {
    const c = candles[i];
    let isHigh = true;
    let isLow = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j === i) continue;
      if (candles[j].high >= c.high) isHigh = false;
      if (candles[j].low <= c.low) isLow = false;
    }
    if (isHigh) highs.push({ time: c.time, price: c.high });
    if (isLow) lows.push({ time: c.time, price: c.low });
  }
  return { highs: highs.slice(-5), lows: lows.slice(-5) };
}
