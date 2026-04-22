import type { Signal, TradingProfile } from "./types";

export function validateSignal(signal: Signal, profile: TradingProfile): Signal {
  if (signal.verdict === "WAIT") return signal;

  const warnings = [...signal.warnings];

  if (signal.entry != null && signal.stopLoss != null && signal.positionSize) {
    const riskPct = (signal.positionSize.riskAmount / profile.accountBalance) * 100;
    if (riskPct > profile.riskPerTradePct + 0.1) {
      warnings.push(
        `Risk ${riskPct.toFixed(2)}% exceeds your ${profile.riskPerTradePct}% per-trade cap — position size reduced.`,
      );
      const scale = profile.riskPerTradePct / riskPct;
      signal.positionSize.units = round(signal.positionSize.units * scale, 3);
      signal.positionSize.riskAmount = round(signal.positionSize.riskAmount * scale, 2);
    }
  }

  if (profile.brokerType === "prop" && profile.propFirm) {
    const pf = profile.propFirm;
    if (pf.maxDailyDrawdownPct && signal.positionSize) {
      const dailyCapUsd = (profile.accountBalance * pf.maxDailyDrawdownPct) / 100;
      if (signal.positionSize.riskAmount > dailyCapUsd) {
        warnings.push(
          `Risk $${signal.positionSize.riskAmount} would eat your full daily drawdown ($${dailyCapUsd.toFixed(2)}). Rejecting.`,
        );
        return {
          ...signal,
          verdict: "WAIT",
          warnings,
          reasoning: {
            ...signal.reasoning,
            invalidation: "Prop firm daily drawdown breach risk — signal refused by validator.",
          },
        };
      }
    }
    if (pf.maxLotSize && signal.positionSize && signal.positionSize.unitLabel.toLowerCase().includes("lot")) {
      if (signal.positionSize.units > pf.maxLotSize) {
        warnings.push(
          `Lot size ${signal.positionSize.units} exceeds prop max ${pf.maxLotSize} — capped.`,
        );
        signal.positionSize.units = pf.maxLotSize;
      }
    }
  }

  if (signal.entry != null && signal.stopLoss != null) {
    if (signal.verdict === "BUY" && signal.stopLoss >= signal.entry) {
      warnings.push("SL is above entry on a BUY — invalid. Review with AI.");
    }
    if (signal.verdict === "SELL" && signal.stopLoss <= signal.entry) {
      warnings.push("SL is below entry on a SELL — invalid. Review with AI.");
    }
  }

  return { ...signal, warnings };
}

function round(n: number, digits: number): number {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}
