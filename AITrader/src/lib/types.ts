import { z } from "zod";

export type Verdict = "BUY" | "SELL" | "WAIT";

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1wk"] as const;

export const AlertConditionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("price_above"), value: z.number() }),
  z.object({ type: z.literal("price_below"), value: z.number() }),
  z.object({
    type: z.literal("candle_close_above"),
    timeframe: z.enum(TIMEFRAMES),
    value: z.number(),
  }),
  z.object({
    type: z.literal("candle_close_below"),
    timeframe: z.enum(TIMEFRAMES),
    value: z.number(),
  }),
  z.object({
    type: z.literal("rsi_above"),
    timeframe: z.enum(TIMEFRAMES),
    value: z.number(),
  }),
  z.object({
    type: z.literal("rsi_below"),
    timeframe: z.enum(TIMEFRAMES),
    value: z.number(),
  }),
]);

export type AlertCondition = z.infer<typeof AlertConditionSchema>;

export const TradePlanSchema = z.object({
  action: z.enum(["BUY", "SELL"]),
  entry: z.number(),
  stopLoss: z.number(),
  takeProfits: z.array(z.number()).default([]),
  notes: z.string().nullish(),
});

export type TradePlan = z.infer<typeof TradePlanSchema>;

export const AlertTriggerSchema = z.object({
  description: z.string(),
  symbol: z.string(),
  conditions: z.array(AlertConditionSchema).min(1),
  tradePlan: TradePlanSchema.nullish(),
});

export type AlertTrigger = z.infer<typeof AlertTriggerSchema>;

export type StrategyStyle = "scalp" | "day" | "swing" | "position";

export type TradingStrategy =
  | "price-action"
  | "supply-demand"
  | "smc"
  | "rsi-momentum"
  | "ma-trend"
  | "support-resistance"
  | "breakout"
  | "fibonacci"
  | "mean-reversion";

export const STRATEGY_INFO: Record<TradingStrategy, { label: string; desc: string }> = {
  "price-action": { label: "Price Action", desc: "Candlestick patterns, swing structure, key levels" },
  "supply-demand": { label: "Supply & Demand", desc: "Demand zones, supply zones, mitigation plays" },
  smc: { label: "Smart Money (SMC/ICT)", desc: "Order blocks, FVG, liquidity sweeps, BOS/CHoCH" },
  "rsi-momentum": { label: "RSI / Momentum", desc: "RSI levels, divergences, momentum shifts" },
  "ma-trend": { label: "MA Trend Following", desc: "EMA crosses, pullbacks to moving averages" },
  "support-resistance": { label: "S/R Levels", desc: "Horizontal support/resistance, break-and-retest" },
  breakout: { label: "Breakout", desc: "Range breaks, consolidation breakouts, volume confirmation" },
  fibonacci: { label: "Fibonacci", desc: "Retracement + extension levels, golden pocket" },
  "mean-reversion": { label: "Mean Reversion", desc: "Bollinger bands, overextension reversals" },
};

export type BrokerType = "personal" | "prop";

export type TradingSession =
  | "sydney"
  | "tokyo"
  | "london"
  | "new-york"
  | "london-ny-overlap";

export interface PropFirmRules {
  firmName?: string;
  phase?: "challenge" | "verification" | "funded";
  maxDailyDrawdownPct?: number;
  maxTotalDrawdownPct?: number;
  profitTargetPct?: number;
  maxLotSize?: number;
  newsTradingAllowed?: boolean;
  weekendHoldingAllowed?: boolean;
}

export interface TradingProfile {
  instruments: Array<"forex" | "crypto" | "indices" | "stocks" | "commodities" | "metals">;
  watchlist: string[];
  accountBalance: number;
  accountCurrency: string;
  leverage: number;
  brokerType: BrokerType;
  propFirm?: PropFirmRules;
  strategyStyle: StrategyStyle;
  strategy?: TradingStrategy;
  riskPerTradePct: number;
  maxConcurrentTrades: number;
  preferredRR: number;
  session: TradingSession;
  avoidNews: boolean;
  tradingDays?: Array<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun">;
}

export const TradingProfileSchema = z.object({
  instruments: z.array(z.enum(["forex", "crypto", "indices", "stocks", "commodities", "metals"])).default([]),
  watchlist: z.array(z.string()).default([]),
  accountBalance: z.number().positive(),
  accountCurrency: z.string().default("USD"),
  leverage: z.number().positive().default(100),
  brokerType: z.enum(["personal", "prop"]).default("personal"),
  propFirm: z
    .object({
      firmName: z.string().optional(),
      phase: z.enum(["challenge", "verification", "funded"]).optional(),
      maxDailyDrawdownPct: z.number().optional(),
      maxTotalDrawdownPct: z.number().optional(),
      profitTargetPct: z.number().optional(),
      maxLotSize: z.number().optional(),
      newsTradingAllowed: z.boolean().optional(),
      weekendHoldingAllowed: z.boolean().optional(),
    })
    .optional(),
  strategyStyle: z.enum(["scalp", "day", "swing", "position"]).default("day"),
  strategy: z
    .enum([
      "price-action",
      "supply-demand",
      "smc",
      "rsi-momentum",
      "ma-trend",
      "support-resistance",
      "breakout",
      "fibonacci",
      "mean-reversion",
    ])
    .optional(),
  riskPerTradePct: z.number().min(0.1).max(10).default(1),
  maxConcurrentTrades: z.number().int().min(1).max(20).default(3),
  preferredRR: z.number().min(0.5).max(10).default(2),
  session: z.enum(["sydney", "tokyo", "london", "new-york", "london-ny-overlap"]).default("london-ny-overlap"),
  avoidNews: z.boolean().default(true),
  tradingDays: z.array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"])).optional(),
});

export const SignalSchema = z.object({
  pair: z.string(),
  verdict: z.enum(["BUY", "SELL", "WAIT"]),
  confidence: z.number().min(0).max(100),
  orderType: z.enum(["market", "limit"]).nullish().transform((v) => v ?? null),
  entry: z.number().nullish().transform((v) => v ?? null),
  stopLoss: z.number().nullish().transform((v) => v ?? null),
  takeProfits: z
    .array(
      z.object({
        price: z.number(),
        rr: z.number(),
        label: z.string(),
      }),
    )
    .default([]),
  positionSize: z
    .object({
      units: z.number(),
      unitLabel: z.string(),
      riskAmount: z.number(),
      riskCurrency: z.string(),
    })
    .nullish()
    .transform((v) => v ?? null),
  timeframe: z.string().nullish().transform((v) => v ?? null),
  validUntil: z.string().nullish().transform((v) => v ?? null),
  reasoning: z.object({
    htfBias: z.string(),
    keyLevel: z.string(),
    confluence: z.array(z.string()).default([]),
    invalidation: z.string(),
  }),
  alertTriggers: z.array(AlertTriggerSchema).default([]),
  warnings: z.array(z.string()).default([]),
});

export type Signal = z.infer<typeof SignalSchema>;

export interface SignalApiResponse {
  signal: Signal | null;
  rawAssistantText: string;
  toolTrace: Array<{ tool: string; arguments: unknown; result: unknown }>;
  error?: string;
}
