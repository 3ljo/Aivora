import type { Candle, MarketSnapshot, Timeframe } from "./market-data";

const BASE = "https://api.twelvedata.com";

const FIAT = ["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "NZD", "CAD", "CNY", "HKD", "SGD", "SEK", "NOK", "MXN", "ZAR"];

// Indices like NDX/SPX/DJI require Twelve Data's paid Grow plan.
// Keep the map so index symbols resolve to null → fall through to Yahoo for indices.
const TD_INDICES_BLOCKED = new Set([
  "NAS100", "US100", "NDX",
  "SPX500", "US500", "SPX",
  "US30", "DOW", "DJI",
  "DAX", "DAX40", "GER40",
  "FTSE", "UK100",
]);

const INTERVAL_MAP: Record<Timeframe, string> = {
  "1m": "1min",
  "5m": "5min",
  "15m": "15min",
  "30m": "30min",
  "1h": "1h",
  "4h": "4h",
  "1d": "1day",
  "1wk": "1week",
};

const OUTPUT_SIZES: Record<Timeframe, number> = {
  "1m": 200,
  "5m": 200,
  "15m": 200,
  "30m": 200,
  "1h": 200,
  "4h": 200,
  "1d": 200,
  "1wk": 150,
};

export interface ResolvedSymbol {
  tdSymbol: string;
  display: string;
  assetClass: MarketSnapshot["assetClass"];
}

export function resolveTwelveDataSymbol(input: string): ResolvedSymbol | null {
  const raw = input
    .trim()
    .toUpperCase()
    .replace(/^\^/, "")        // ^NDX → NDX
    .replace(/=[FX]$/, "")      // EURUSD=X → EURUSD, CL=F → CL
    .replace(/\s+/g, "")
    .replace(/\//g, "");

  if (TD_INDICES_BLOCKED.has(raw)) return null;

  if (raw.startsWith("XAU") || raw.startsWith("XAG")) {
    const base = raw.slice(0, 3);
    const quote = raw.slice(3) || "USD";
    return { tdSymbol: `${base}/${quote}`, display: raw, assetClass: "metal" };
  }

  if (raw.length === 6 && FIAT.includes(raw.slice(0, 3)) && FIAT.includes(raw.slice(3))) {
    return { tdSymbol: `${raw.slice(0, 3)}/${raw.slice(3)}`, display: raw, assetClass: "forex" };
  }

  if (/^[A-Z]{1,5}$/.test(raw)) {
    return { tdSymbol: raw, display: raw, assetClass: "stock" };
  }

  return null;
}

interface TdValue {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
}

interface TdTimeSeriesResponse {
  meta?: {
    symbol?: string;
    interval?: string;
    currency_base?: string;
    currency_quote?: string;
    type?: string;
  };
  values?: TdValue[];
  status?: string;
  code?: number;
  message?: string;
}

interface TdQuoteResponse {
  symbol?: string;
  close?: string;
  previous_close?: string;
  percent_change?: string;
  currency_base?: string;
  currency_quote?: string;
  currency?: string;
  status?: string;
  code?: number;
  message?: string;
}

export async function getTwelveDataSnapshot(symbol: string, timeframe: Timeframe): Promise<MarketSnapshot> {
  const apiKey = process.env.TWELVE_DATA_API_KEY?.trim();
  if (!apiKey) throw new Error("TWELVE_DATA_API_KEY not set.");

  const resolved = resolveTwelveDataSymbol(symbol);
  if (!resolved) throw new Error(`Cannot map ${symbol} to a Twelve Data symbol.`);

  const interval = INTERVAL_MAP[timeframe];
  const outputsize = OUTPUT_SIZES[timeframe];

  const url = `${BASE}/time_series?symbol=${encodeURIComponent(resolved.tdSymbol)}&interval=${interval}&outputsize=${outputsize}&apikey=${apiKey}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`TwelveData HTTP ${res.status}`);
  const data = (await res.json()) as TdTimeSeriesResponse;

  if (data.status === "error" || data.code) {
    throw new Error(`TwelveData: ${data.message || `code ${data.code}`}`);
  }
  if (!Array.isArray(data.values) || data.values.length === 0) {
    throw new Error(`TwelveData: no values for ${resolved.tdSymbol}`);
  }

  const candles: Candle[] = data.values
    .map((v) => ({
      time: new Date(v.datetime + "Z").toISOString(),
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: v.volume ? parseFloat(v.volume) : 0,
    }))
    .reverse();

  const last = candles[candles.length - 1];
  const quote = await fetchQuote(resolved.tdSymbol, apiKey).catch(() => null);

  const price = quote?.close ? parseFloat(quote.close) : last.close;
  const previousClose = quote?.previous_close ? parseFloat(quote.previous_close) : null;
  const dayChangePct = quote?.percent_change ? parseFloat(quote.percent_change) : null;
  const currency = quote?.currency_quote ?? quote?.currency ?? data.meta?.currency_quote ?? null;

  return {
    symbol: resolved.display,
    yahooSymbol: resolved.tdSymbol,
    price,
    previousClose,
    dayChangePct,
    currency,
    assetClass: resolved.assetClass,
    candles,
    timeframe,
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchQuote(tdSymbol: string, apiKey: string): Promise<TdQuoteResponse | null> {
  const url = `${BASE}/quote?symbol=${encodeURIComponent(tdSymbol)}&apikey=${apiKey}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json()) as TdQuoteResponse;
  if (data.status === "error" || data.code) return null;
  return data;
}
