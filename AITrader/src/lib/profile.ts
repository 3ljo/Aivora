import type { TradingProfile } from "./types";

export const TOP_PAIRS_BY_CLASS = {
  crypto: ["BTCUSD", "ETHUSD", "SOLUSD"],
  forex: ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD"],
  metals: ["XAUUSD", "XAGUSD"],
  indices: ["NAS100", "SPX500", "US30"],
} as const;

export const DEFAULT_WATCHLIST: string[] = [
  ...TOP_PAIRS_BY_CLASS.crypto,
  ...TOP_PAIRS_BY_CLASS.forex,
  ...TOP_PAIRS_BY_CLASS.metals,
  ...TOP_PAIRS_BY_CLASS.indices,
];

export const DEFAULT_PROFILE: TradingProfile = {
  instruments: ["forex", "crypto", "metals", "indices"],
  watchlist: [...DEFAULT_WATCHLIST],
  accountBalance: 10000,
  accountCurrency: "USD",
  leverage: 100,
  brokerType: "personal",
  strategyStyle: "day",
  riskPerTradePct: 1,
  maxConcurrentTrades: 3,
  preferredRR: 2,
  session: "london-ny-overlap",
  avoidNews: true,
};

export function summarizeProfile(p: TradingProfile): string {
  const parts = [
    `Account: ${p.accountBalance} ${p.accountCurrency} @ 1:${p.leverage} leverage`,
    `Broker: ${p.brokerType}${p.propFirm?.firmName ? ` (${p.propFirm.firmName})` : ""}`,
    `Style: ${p.strategyStyle}, risk ${p.riskPerTradePct}%/trade, target R:R ${p.preferredRR}`,
    p.strategy ? `Strategy: ${p.strategy}` : "",
    `Session: ${p.session}`,
    `Watchlist: ${p.watchlist.join(", ")}`,
  ].filter((s) => s.length > 0);
  if (p.brokerType === "prop" && p.propFirm) {
    const pf = p.propFirm;
    const rules = [
      pf.maxDailyDrawdownPct != null ? `daily DD ${pf.maxDailyDrawdownPct}%` : null,
      pf.maxTotalDrawdownPct != null ? `total DD ${pf.maxTotalDrawdownPct}%` : null,
      pf.profitTargetPct != null ? `target ${pf.profitTargetPct}%` : null,
      pf.newsTradingAllowed === false ? "no news trading" : null,
      pf.weekendHoldingAllowed === false ? "no weekend holds" : null,
    ].filter(Boolean);
    if (rules.length) parts.push(`Prop rules: ${rules.join(", ")}`);
  }
  return parts.join(" | ");
}
