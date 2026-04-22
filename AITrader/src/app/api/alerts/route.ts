import { NextRequest, NextResponse } from "next/server";
import { AlertTriggerSchema } from "@/lib/types";
import { createRule, listRules } from "@/lib/alerts/store";
import type { AlertRule } from "@/lib/alerts/types";
import { getChannelStatus } from "@/lib/alerts/channels/dispatch";

export const runtime = "nodejs";

export async function GET() {
  const [rules, channels] = await Promise.all([listRules(), getChannelStatus()]);
  return NextResponse.json({ rules, channels });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = AlertTriggerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid trigger.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const trigger = parsed.data;
  const rule: AlertRule = {
    id: crypto.randomUUID(),
    description: trigger.description,
    symbol: trigger.symbol,
    conditions: trigger.conditions,
    tradePlan: trigger.tradePlan ?? null,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  await createRule(rule);
  const channels = await getChannelStatus();
  return NextResponse.json({ rule, channels });
}
