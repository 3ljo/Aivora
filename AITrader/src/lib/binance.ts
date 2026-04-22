import type { Candle, MarketSnapshot, Timeframe } from "./market-data";

const TF_TO_BINANCE: Record<Timeframe, { interval: string; limit: number }> = {
  "1m": { interval: "1m", limit: 300 },
  "5m": { interval: "5m", limit: 300 },
  "15m": { interval: "15m", limit: 300 },
  "30m": { interval: "30m", limit: 300 },
  "1h": { interval: "1h", limit: 300 },
  "4h": { interval: "4h", limit: 300 },
  "1d": { interval: "1d", limit: 300 },
  "1wk": { interval: "1w", limit: 300 },
};

const KNOWN_BINANCE_BASES = new Set([
  "BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "DOT", "AVAX", "LINK",
  "MATIC", "LTC", "TRX", "ATOM", "UNI", "XLM", "ETC", "FIL", "NEAR", "ARB",
  "OP", "APT", "SUI", "INJ", "TIA", "SEI", "RNDR", "IMX", "AAVE", "MKR",
]);

export function resolveBinanceSymbol(input: string): string | null {
  const raw = input.trim().toUpperCase().replace(/[/\-\s]/g, "");
  for (const quote of ["USDT", "USDC", "USD", "BUSD"]) {
    if (raw.endsWith(quote)) {
      const base = raw.slice(0, raw.length - quote.length);
      if (KNOWN_BINANCE_BASES.has(base)) {
        return base + (quote === "USD" ? "USDT" : quote);
      }
    }
  }
  if (KNOWN_BINANCE_BASES.has(raw)) return raw + "USDT";
  return null;
}

interface BinanceKline {
  0: number; 1: string; 2: string; 3: string; 4: string; 5: string;
  6: number; 7: string; 8: number; 9: string; 10: string; 11: string;
}

export async function getBinanceSnapshot(
  display: string,
  binanceSymbol: string,
  timeframe: Timeframe,
): Promise<MarketSnapshot> {
  const tf = TF_TO_BINANCE[timeframe];
  const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${tf.interval}&limit=${tf.limit}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Binance HTTP ${res.status}`);
  const data = (await res.json()) as BinanceKline[];

  const candles: Candle[] = data.map((k) => ({
    time: new Date(k[0]).toISOString(),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));

  const last = candles[candles.length - 1];
  const first = candles[0];
  const price = last?.close ?? 0;
  const previousClose = first?.close ?? null;
  const dayChangePct = previousClose ? ((price - previousClose) / previousClose) * 100 : null;

  return {
    symbol: display,
    yahooSymbol: binanceSymbol,
    price,
    previousClose,
    dayChangePct,
    currency: "USD",
    assetClass: "crypto",
    candles,
    timeframe,
    fetchedAt: new Date().toISOString(),
  };
}
