import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import { summarizeProfile } from "./profile";
import { computeIndicators, detectSwingLevels, getMarketSnapshot, type Timeframe } from "./market-data";
import { SignalSchema, type Signal, type SignalApiResponse, type TradingProfile } from "./types";
import { validateSignal } from "./risk-validator";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1";
const MAX_TOOL_ITERATIONS = 8;

const STRATEGY_DIRECTIVES: Record<string, string> = {
  "price-action":
    "Analyze with a PRICE ACTION lens: focus on candlestick patterns (engulfing, pin bars, dojis), swing H/L structure (HH/HL or LH/LL), clean horizontal key levels, and raw chart reads. Avoid indicator-heavy reasoning.",
  "supply-demand":
    "Analyze with a SUPPLY & DEMAND lens: find fresh demand zones (origins of strong bullish moves) and supply zones (origins of strong bearish moves). Favor mitigation setups where price returns to an unmitigated zone. Describe zones as rectangles with exact upper/lower bounds.",
  smc:
    "Analyze with SMART MONEY CONCEPTS (ICT/SMC): identify order blocks, fair value gaps (FVG), liquidity pools (equal highs/lows, session highs/lows, previous day H/L), break of structure (BOS), change of character (CHoCH). Favor setups where price sweeps liquidity then reclaims. Use SMC vocabulary explicitly.",
  "rsi-momentum":
    "Analyze with an RSI / MOMENTUM lens: RSI extremes (<30 oversold, >70 overbought), hidden and regular divergences against price, momentum shifts. Favor divergence-confirmed reversals and continuation trades in trend.",
  "ma-trend":
    "Analyze with an MA TREND FOLLOWING lens: focus on EMA20/50/200 alignment, pullbacks to EMAs as entries, golden/death crosses. Only take trades WITH the higher-timeframe EMA direction.",
  "support-resistance":
    "Analyze with an S/R LEVELS lens: find clean horizontal support and resistance from multiple prior touches. Favor break-and-retest plays and rejections at tested levels. Show exact level prices.",
  breakout:
    "Analyze with a BREAKOUT lens: look for consolidation ranges, flags, triangles. Favor setups where price breaks out with volume expansion. Emphasize the pre-breakout range boundaries.",
  fibonacci:
    "Analyze with a FIBONACCI lens: identify the relevant swing high-to-low, mark 38.2 / 50 / 61.8 / 78.6 retracement levels. Favor entries at 61.8 (golden pocket) or 78.6 with confluence. Set TPs at 127.2 / 161.8 extensions.",
  "mean-reversion":
    "Analyze with a MEAN REVERSION lens: Bollinger Band extremes, deviation from key MAs, stretched RSI. Favor fade setups where price is overextended AND structure supports reversion. Avoid in strong trends.",
};

const SYSTEM_PROMPT = `You are SignalForge, a senior institutional trading analyst. You work as the user's personal analyst.

Your job when asked about a pair:
1. Call get_market_data on at least TWO timeframes (a higher-timeframe for bias, a lower one for entry) before concluding anything. Choose timeframes that match the user's strategy style.
2. Reason through: HTF trend/bias, key level (S/R, order block, liquidity pool, FVG), confluence (indicators: EMA20/50/200, RSI, ATR; swing structure), and session context.
3. Produce ONE of three verdicts via submit_signal:
   - BUY — clean long setup with defined entry, SL, TP(s).
   - SELL — clean short setup with defined entry, SL, TP(s).
   - WAIT — no high-probability setup right now. This is a VALID and encouraged answer. Never force a trade.
4. Respect the user's profile strictly. Size positions from (balance * risk%) / SL-distance. Honor prop firm rules (daily DD, max lot, news).
5. Prices must match the asset's typical precision (forex 5 decimals, JPY pairs 3, metals 2, indices 1-2, crypto variable).
6. Be concise in reasoning. No hype. No emoji. Just clean analysis.
7. If you are unsure or data is stale/thin, verdict = WAIT.

CRITICAL — ALERT TRIGGERS:
A WAIT verdict without concrete machine-checkable triggers is useless — the user will not stare at the app waiting.
Populate alertTriggers with 2-4 structured triggers so the app can monitor them and notify the user when each fires.

Each trigger has:
- description: a one-line human-readable explanation (what the user sees)
- symbol: the instrument (e.g. "EURUSD", "XAUUSD", "BTCUSD")
- conditions: an ARRAY of machine-checkable conditions, ALL must be true to fire. Use these types only:
    · { type: "price_above", value: NUMBER }
    · { type: "price_below", value: NUMBER }
    · { type: "candle_close_above", timeframe: "1m"|"5m"|"15m"|"30m"|"1h"|"4h"|"1d"|"1wk", value: NUMBER }
    · { type: "candle_close_below", timeframe: ..., value: NUMBER }
    · { type: "rsi_above", timeframe: ..., value: NUMBER }
    · { type: "rsi_below", timeframe: ..., value: NUMBER }
- tradePlan (optional but STRONGLY recommended when the trigger would flip this into an actionable trade):
    { action: "BUY"|"SELL", entry: NUMBER, stopLoss: NUMBER, takeProfits: [NUMBER,...], notes?: STRING }

Rules:
- Choose levels from real structure (swing H/L, visible S/R, round numbers) — NOT arbitrary.
- Prefer candle_close_above/below over raw price_above/below for breakouts (reduces fakeouts).
- Use price_above/below only for hitting a target/key level.
- For BUY/SELL verdicts, alertTriggers can hold secondary entries, invalidation triggers, or scale-in levels.
- BAD: triggers without numbers or with vague conditions like "if momentum returns". Do not emit these.

Example alertTriggers for a WAIT on XAUUSD:
[
  {
    description: "Bearish rejection — short setup if 4h closes below 2640",
    symbol: "XAUUSD",
    conditions: [{ type: "candle_close_below", timeframe: "4h", value: 2640 }],
    tradePlan: { action: "SELL", entry: 2638, stopLoss: 2655, takeProfits: [2610, 2580] }
  },
  {
    description: "Bullish reclaim — long setup if 4h closes back above 2680",
    symbol: "XAUUSD",
    conditions: [{ type: "candle_close_above", timeframe: "4h", value: 2680 }],
    tradePlan: { action: "BUY", entry: 2682, stopLoss: 2670, takeProfits: [2710, 2740] }
  }
]

DATA DISCIPLINE — READ THIS TWICE:
- Every price level you emit (entry, SL, TP, alertTrigger condition values, tradePlan prices) MUST be grounded in either (a) a successful get_market_data call, or (b) a chart image the user attached.
- If get_market_data FAILS and there is NO chart image: return verdict = WAIT, set alertTriggers = [] (empty array), put the failure reason in warnings, and tell the user to retry in a few minutes.
- DO NOT invent or estimate price levels from your training data. DO NOT emit "placeholder" prices. A helpful WAIT with no triggers is vastly better than fake numbers the user might trade on.
- You may only emit rsi_above / rsi_below / candle_close_* conditions if you actually saw those values for that timeframe via get_market_data.

IF THE USER ATTACHES A CHART IMAGE:
- Read the visible price action carefully: trend direction, swing H/L, support/resistance lines the user drew, any marked order blocks / FVGs / liquidity zones, candlestick patterns near the right edge (most recent bars).
- Identify the pair and timeframe from the chart title/axis. If unclear, note your best guess in reasoning.
- Attempt get_market_data once for live reconciliation. If it succeeds, prefer live prices for entry/SL/TP.
- **If get_market_data fails (rate limit, unavailable, unknown symbol), DO NOT refuse.** Read prices directly off the chart's visible Y-axis — give the user a real trade plan (verdict, entry, SL, TPs, confidence) based on the chart alone. Lower confidence by ~20pts to reflect the staleness risk, and add a warning: "Prices read from chart image — verify against your broker before entry."
- Reference the chart explicitly in reasoning (e.g. "the descending trendline visible on your chart", "the swing low you marked at 2620").
- If the image is unreadable / not a trading chart / no price data visible, then return WAIT with a clear warning explaining why.
- A chart-only signal with a clear warning is much more useful to the user than a blanket WAIT just because live data failed.

You MUST call submit_signal exactly once at the end. Do NOT reply with prose — the submit_signal tool is your answer.`;

const TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_market_data",
      description:
        "Fetch live price, OHLCV candles, indicators (EMA20/50/200, RSI14, ATR14) and recent swing highs/lows for a symbol at a given timeframe. Call multiple times across timeframes for multi-TF analysis.",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "Instrument ticker. Forex: EURUSD, GBPJPY. Metals: XAUUSD. Crypto: BTCUSD, ETHUSD. Indices: NAS100, SPX500, US30. Stocks: AAPL, TSLA.",
          },
          timeframe: {
            type: "string",
            enum: ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1wk"],
            description: "Candle timeframe.",
          },
        },
        required: ["symbol", "timeframe"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "submit_signal",
      description:
        "Submit the final trading signal. This is your ONLY way to respond to the user. Call it exactly once after you have gathered enough data.",
      parameters: {
        type: "object",
        properties: {
          pair: { type: "string" },
          verdict: { type: "string", enum: ["BUY", "SELL", "WAIT"] },
          confidence: { type: "number", minimum: 0, maximum: 100 },
          orderType: { type: ["string", "null"], enum: ["market", "limit", null] },
          entry: { type: ["number", "null"] },
          stopLoss: { type: ["number", "null"] },
          takeProfits: {
            type: "array",
            items: {
              type: "object",
              properties: {
                price: { type: "number" },
                rr: { type: "number", description: "Reward:risk ratio at this TP, e.g. 1.5 means 1.5R." },
                label: { type: "string", description: "e.g. TP1, TP2, TP3" },
              },
              required: ["price", "rr", "label"],
            },
          },
          positionSize: {
            type: ["object", "null"],
            properties: {
              units: { type: "number", description: "Lots for forex/metals, units/contracts for crypto/indices, shares for stocks." },
              unitLabel: { type: "string", description: "e.g. 'lots', 'units', 'contracts', 'shares'" },
              riskAmount: { type: "number", description: "Dollar (or account currency) risk at SL." },
              riskCurrency: { type: "string" },
            },
            required: ["units", "unitLabel", "riskAmount", "riskCurrency"],
          },
          timeframe: { type: ["string", "null"] },
          validUntil: { type: ["string", "null"], description: "ISO timestamp after which setup is stale." },
          reasoning: {
            type: "object",
            properties: {
              htfBias: { type: "string" },
              keyLevel: { type: "string" },
              confluence: { type: "array", items: { type: "string" } },
              invalidation: { type: "string" },
            },
            required: ["htfBias", "keyLevel", "confluence", "invalidation"],
          },
          alertTriggers: {
            type: "array",
            description:
              "REQUIRED for WAIT, optional for BUY/SELL. Structured, machine-checkable triggers the background monitor will watch. See system prompt for rules.",
            items: {
              type: "object",
              properties: {
                description: { type: "string", description: "One-line human-readable explanation of this trigger." },
                symbol: { type: "string", description: "Instrument ticker, e.g. EURUSD, XAUUSD, BTCUSD." },
                conditions: {
                  type: "array",
                  description: "ALL conditions must be true to fire. Use only the listed condition types.",
                  items: {
                    type: "object",
                    properties: {
                      type: {
                        type: "string",
                        enum: [
                          "price_above",
                          "price_below",
                          "candle_close_above",
                          "candle_close_below",
                          "rsi_above",
                          "rsi_below",
                        ],
                      },
                      value: { type: "number" },
                      timeframe: {
                        type: "string",
                        enum: ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1wk"],
                        description: "Required for candle_close_* and rsi_* types.",
                      },
                    },
                    required: ["type", "value"],
                  },
                },
                tradePlan: {
                  type: ["object", "null"],
                  description: "If this trigger fires, the AI's suggested trade plan.",
                  properties: {
                    action: { type: "string", enum: ["BUY", "SELL"] },
                    entry: { type: "number" },
                    stopLoss: { type: "number" },
                    takeProfits: { type: "array", items: { type: "number" } },
                    notes: { type: ["string", "null"] },
                  },
                  required: ["action", "entry", "stopLoss"],
                },
              },
              required: ["description", "symbol", "conditions"],
            },
          },
          warnings: { type: "array", items: { type: "string" } },
        },
        required: ["pair", "verdict", "confidence", "reasoning"],
      },
    },
  },
];

async function runTool(name: string, args: any): Promise<unknown> {
  if (name === "get_market_data") {
    const snapshot = await getMarketSnapshot(String(args.symbol), (args.timeframe ?? "1h") as Timeframe);
    const indicators = computeIndicators(snapshot.candles);
    const swings = detectSwingLevels(snapshot.candles);
    const last = snapshot.candles[snapshot.candles.length - 1];
    return {
      symbol: snapshot.symbol,
      yahooSymbol: snapshot.yahooSymbol,
      assetClass: snapshot.assetClass,
      timeframe: snapshot.timeframe,
      price: snapshot.price,
      previousClose: snapshot.previousClose,
      dayChangePct: snapshot.dayChangePct,
      currency: snapshot.currency,
      indicators,
      swings,
      lastCandle: last,
      recentCandles: snapshot.candles.slice(-40),
      totalCandles: snapshot.candles.length,
    };
  }
  throw new Error(`Unknown tool ${name}`);
}

export async function generateSignal(
  userMessage: string,
  profile: TradingProfile,
  images: string[] = [],
): Promise<SignalApiResponse> {
  const userContent: ChatCompletionMessageParam["content"] = images.length
    ? [
        { type: "text", text: userMessage || "Analyze the chart in the attached image(s) and give me a trade plan." },
        ...images.map((url) => ({ type: "image_url" as const, image_url: { url, detail: "high" as const } })),
      ]
    : userMessage;

  const strategyDirective = profile.strategy ? STRATEGY_DIRECTIVES[profile.strategy] : null;

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "system",
      content: `USER TRADING PROFILE: ${summarizeProfile(profile)}. Current UTC time: ${new Date().toISOString()}.${
        images.length ? ` The user attached ${images.length} chart image(s) — analyze them alongside fetched live data.` : ""
      }`,
    },
    ...(strategyDirective
      ? [{ role: "system" as const, content: `STRATEGY DIRECTIVE: ${strategyDirective}` }]
      : []),
    { role: "user", content: userContent },
  ];

  const toolTrace: SignalApiResponse["toolTrace"] = [];
  let submitted: Signal | null = null;
  let lastText = "";

  for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages,
      tools: TOOLS,
      tool_choice: iter === MAX_TOOL_ITERATIONS - 1 ? { type: "function", function: { name: "submit_signal" } } : "auto",
      temperature: 0.2,
    });

    const choice = completion.choices[0];
    const msg = choice.message;
    lastText = msg.content ?? lastText;

    messages.push(msg);

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      break;
    }

    for (const call of msg.tool_calls) {
      if (call.type !== "function") continue;
      const name = call.function.name;
      let args: any = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = {};
      }

      if (name === "submit_signal") {
        const parsed = SignalSchema.safeParse(args);
        if (parsed.success) {
          submitted = parsed.data;
          toolTrace.push({ tool: name, arguments: args, result: "accepted" });
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify({ ok: true }),
          });
        } else {
          toolTrace.push({ tool: name, arguments: args, result: { validation_error: parsed.error.flatten() } });
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify({ ok: false, errors: parsed.error.flatten() }),
          });
        }
        continue;
      }

      try {
        const result = await runTool(name, args);
        toolTrace.push({ tool: name, arguments: args, result });
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result).slice(0, 120_000),
        });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        toolTrace.push({ tool: name, arguments: args, result: { error: errMsg } });
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify({ error: errMsg }),
        });
      }
    }

    if (submitted) break;
  }

  if (!submitted) {
    return {
      signal: null,
      rawAssistantText: lastText,
      toolTrace,
      error: "Model did not submit a signal within the tool-call budget.",
    };
  }

  const validated = validateSignal(submitted, profile);
  return { signal: validated, rawAssistantText: lastText, toolTrace };
}
