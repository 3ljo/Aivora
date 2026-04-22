# SignalForge — AI Trading Analyst (MVP)

Minimal single-page demo that proves out the core AI signal flow:
**type a pair → OpenAI fetches live market data via tool use → returns a structured trade signal.**

This MVP intentionally skips auth, DB, onboarding, charts, and the wider app shell. It's just the signal engine so you can judge how the AI handles trade calls.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind v4
- OpenAI (`gpt-4.1` by default) with tool use
- `yahoo-finance2` for live market data — no API key needed, covers forex, metals, crypto, indices, stocks
- Server-side risk validator that enforces `riskPerTradePct` and (optionally) prop-firm rules on whatever the model proposes

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 — type a pair (e.g. `EURUSD`, `BTC`, `gold`, `NAS100`) or click one of the quick chips.

The default trading profile is hardcoded in `src/lib/profile.ts` (10k USD account, 1% risk, day-trading style, London-NY session). The AI respects it on every signal.

## How the signal flow works

```
user msg → /api/signal
         → OpenAI with tools [get_market_data, submit_signal]
         → model calls get_market_data(EURUSD, 1h)      ← HTF bias
         → model calls get_market_data(EURUSD, 15m)     ← entry
         → model calls submit_signal({ verdict, entry, SL, TPs, size, reasoning })
         → risk validator scales/rejects if it breaches profile rules
         → structured JSON back to UI → SignalCard
```

## Files worth knowing

- [src/lib/signal-engine.ts](src/lib/signal-engine.ts) — OpenAI tool-calling loop, system prompt, `submit_signal` schema
- [src/lib/market-data.ts](src/lib/market-data.ts) — Yahoo Finance adapter, symbol normalization, EMA/RSI/ATR, swing detection
- [src/lib/risk-validator.ts](src/lib/risk-validator.ts) — scales/rejects signals that breach risk or prop-firm rules
- [src/lib/profile.ts](src/lib/profile.ts) — default trading profile (edit to change account size / style / rules)
- [src/app/api/signal/route.ts](src/app/api/signal/route.ts) — API route
- [src/app/page.tsx](src/app/page.tsx) — the single page UI
- [src/components/signal-card.tsx](src/components/signal-card.tsx) — signal card renderer

## Env

`.env.local` (git-ignored):
```
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4.1
```

## Alerts — get notified when your setup fires

Every signal card includes a **Watch For** section with structured triggers. Click **Create alert** and a background monitor polls market data every 60s — when the conditions hit, you get a **Telegram push** on your phone, instantly, even if the app is closed.

End users just click "Connect Telegram" on `/settings` — no tokens, no copy-paste. The owner of the app sets up the bot **once** in `.env.local`.

### One-time owner setup (free, ~2 min)

1. Open Telegram → chat with **@BotFather** → `/newbot`
2. Pick a name + a username ending in `bot` (e.g. `signalforge_alerts_bot`)
3. Copy the token + the bot's username into `.env.local`:
   ```
   TELEGRAM_BOT_TOKEN=123456:ABCdef...
   TELEGRAM_BOT_USERNAME=signalforge_alerts_bot
   ```
4. Restart `npm run dev`.

### End-user flow
1. Open http://localhost:3000/settings
2. Click **Connect Telegram** → opens the bot → tap *Start* → the UI auto-detects and links your chat.
3. Flip the Enabled toggle.
4. Go back to the main page, generate a signal, click **Create alert** on any trigger.
5. Close your browser. When your setup hits, your phone pings.

### How the monitor works
- `src/instrumentation.ts` boots a `setInterval` when the server starts — polls every 60s.
- Each tick: reads active alerts → fetches fresh candles/price → evaluates conditions → dispatches notifications if all conditions met.
- Alerts are persisted to `data/alerts.json` (gitignored).
- Fired alerts flip to `triggered` status (so you don't get spammed). Click the bell icon in the panel to re-arm them.

### Using in production (Vercel)
`setInterval` won't work on serverless — use Vercel Cron instead:
```json
// vercel.json
{ "crons": [{ "path": "/api/cron/tick", "schedule": "* * * * *" }] }
```
And set `DISABLE_MONITOR=1` + `CRON_SECRET=...` in env so only Vercel can trigger the endpoint.

## What's intentionally NOT built yet

Onboarding wizard · auth · Supabase DB · journal · charts · PWA web-push · watchlist scan · backtesting · multi-TF confluence panel · prop-firm dashboard · economic calendar · streaming AI responses.

These are Phase 2+. Judge the signal quality first, then we build out.
