import { sendTelegram } from "./telegram";
import { describeCondition } from "../evaluator";
import { readSettings, getServerCapabilities } from "../settings";
import type { AlertRule } from "../types";
import type { Signal } from "../../types";

export interface ChannelStatus {
  telegram: { configured: boolean; enabled: boolean; linked: boolean };
}

export async function getChannelStatus(): Promise<ChannelStatus> {
  const caps = getServerCapabilities();
  const settings = await readSettings();
  return {
    telegram: {
      configured: caps.telegramBot,
      enabled: settings.channels.telegram,
      linked: Boolean(settings.telegram.chatId),
    },
  };
}

/** Sent when a user-created watch alert's conditions fire. */
export async function dispatchTrigger(
  rule: AlertRule,
  context: { price: number | null; context: string },
): Promise<{ telegram?: { ok: boolean; error?: string } }> {
  const status = await getChannelStatus();
  if (!(status.telegram.configured && status.telegram.enabled && status.telegram.linked)) return {};

  const msg = formatAlertMessage(rule, context);
  return { telegram: await sendTelegram(msg) };
}

/** Sent when the background scanner finds a fresh setup on a watchlist pair. */
export async function dispatchScanFinding(signal: Signal): Promise<{ telegram?: { ok: boolean; error?: string } }> {
  const status = await getChannelStatus();
  if (!(status.telegram.configured && status.telegram.enabled && status.telegram.linked)) return {};

  const msg = formatScanMessage(signal);
  return { telegram: await sendTelegram(msg) };
}

function verdictBits(verdict: "BUY" | "SELL" | "WAIT"): { emoji: string; color: string } {
  if (verdict === "BUY") return { emoji: "🟢", color: "BUY" };
  if (verdict === "SELL") return { emoji: "🔴", color: "SELL" };
  return { emoji: "🟡", color: "WAIT" };
}

function fmt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const digits = abs < 1 ? 5 : abs < 100 ? 3 : abs < 10000 ? 2 : 2;
  return n.toLocaleString("en-US", { minimumFractionDigits: Math.min(digits, 2), maximumFractionDigits: digits });
}

function formatAlertMessage(rule: AlertRule, ctx: { price: number | null; context: string }): string {
  const plan = rule.tradePlan;
  const v = plan ? verdictBits(plan.action) : { emoji: "🚨", color: "ALERT" };
  const priceNow = ctx.price != null ? `<code>${fmt(ctx.price)}</code>` : "—";
  const time = new Date().toLocaleString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });

  const lines: string[] = [];
  lines.push(`🚨 <b>ALERT FIRED</b>  ·  <b>${esc(rule.symbol)}</b>`);
  lines.push("");
  lines.push(`${v.emoji} <b>${v.color}</b>  —  <i>${esc(rule.description)}</i>`);

  if (plan) {
    lines.push("");
    lines.push(`📍 Entry   <code>${fmt(plan.entry)}</code>`);
    lines.push(`🛑 Stop    <code>${fmt(plan.stopLoss)}</code>`);
    plan.takeProfits.forEach((tp, i) => {
      const r = Math.abs((tp - plan.entry) / (plan.entry - plan.stopLoss));
      lines.push(`🎯 TP${i + 1}     <code>${fmt(tp)}</code>  <i>+${r.toFixed(1)}R</i>`);
    });
    if (plan.notes) {
      lines.push("");
      lines.push(`<i>${esc(plan.notes)}</i>`);
    }
  }

  lines.push("");
  lines.push("<b>Conditions met</b>");
  rule.conditions.forEach((c) => lines.push(`▸ ${esc(describeCondition(c))}`));

  lines.push("");
  lines.push(`<i>⏰ ${time}  ·  Price ${priceNow}</i>`);

  return lines.join("\n");
}

function formatScanMessage(s: Signal): string {
  const v = verdictBits(s.verdict);
  const time = new Date().toLocaleString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });

  const lines: string[] = [];
  lines.push(`🔥 <b>NEW SETUP</b>  ·  <b>${esc(s.pair)}</b>`);
  lines.push("");
  lines.push(`${v.emoji} <b>${v.color}</b>  ·  <b>${s.confidence}%</b> confidence`);

  if (s.entry != null && s.stopLoss != null) {
    lines.push("");
    lines.push(`📍 Entry   <code>${fmt(s.entry)}</code>`);
    lines.push(`🛑 Stop    <code>${fmt(s.stopLoss)}</code>`);
    s.takeProfits.slice(0, 3).forEach((tp, i) => {
      lines.push(`🎯 ${esc(tp.label || `TP${i + 1}`)}     <code>${fmt(tp.price)}</code>  <i>+${tp.rr.toFixed(1)}R</i>`);
    });
  }

  if (s.positionSize) {
    lines.push("");
    lines.push(
      `💰 Size <b>${fmt(s.positionSize.units)}</b> ${esc(s.positionSize.unitLabel)}  ·  Risk <b>${s.positionSize.riskCurrency} ${fmt(s.positionSize.riskAmount)}</b>`,
    );
  }

  lines.push("");
  lines.push(`<b>HTF</b>: ${esc(s.reasoning.htfBias)}`);
  lines.push(`<b>Level</b>: ${esc(s.reasoning.keyLevel)}`);

  if (s.reasoning.confluence.length) {
    lines.push("");
    s.reasoning.confluence.slice(0, 4).forEach((c) => lines.push(`▸ ${esc(c)}`));
  }

  if (s.warnings.length) {
    lines.push("");
    s.warnings.slice(0, 2).forEach((w) => lines.push(`⚠️ ${esc(w)}`));
  }

  lines.push("");
  const tf = s.timeframe ? ` · TF ${esc(s.timeframe)}` : "";
  const valid = s.validUntil ? ` · Valid ${new Date(s.validUntil).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : "";
  lines.push(`<i>⏰ ${time}${tf}${valid}</i>`);

  return lines.join("\n");
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
